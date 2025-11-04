import Anthropic from '@anthropic-ai/sdk';
import path from 'path';

// Configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const MCP_SERVERS_PATH = path.resolve(__dirname, '../../../../mcp-servers');

interface MCPServer {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface ConversationContext {
  leadId: string;
  leadName: string;
  phoneNumber: string;
  address: string;
  propertyDetails?: any;
  previousNotes?: string[];
  callObjective?: string;
}

export class ClaudeAgentService {
  private anthropic: Anthropic;
  private mcpClients: Map<string, Client> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });
  }

  /**
   * Initialize all MCP servers and establish connections
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[Claude Agent] Already initialized');
      return;
    }

    console.log('[Claude Agent] Initializing MCP servers...');

    // Dynamically import MCP SDK (ES modules)
    const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
    const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');

    const servers: MCPServer[] = [
      {
        name: 'lead-db',
        command: 'node',
        args: [path.join(MCP_SERVERS_PATH, 'lead-db/dist/index.js')],
        env: {
          MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/next_level_real_estate',
        },
      },
      {
        name: 'property-data',
        command: 'node',
        args: [path.join(MCP_SERVERS_PATH, 'property-data/dist/index.js')],
        env: {
          ZILLOW_API_KEY: process.env.ZILLOW_API_KEY || '',
          ATTOM_API_KEY: process.env.ATTOM_API_KEY || '',
        },
      },
      {
        name: 'tcpa-checker',
        command: 'node',
        args: [path.join(MCP_SERVERS_PATH, 'tcpa-checker/dist/index.js')],
        env: {
          DNC_API_KEY: process.env.DNC_API_KEY || '',
        },
      },
      {
        name: 'calling',
        command: 'node',
        args: [path.join(MCP_SERVERS_PATH, 'calling/dist/index.js')],
        env: {
          TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
          TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
          ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || '',
        },
      },
    ];

    // Initialize each MCP server
    for (const server of servers) {
      try {
        console.log(`[Claude Agent] Connecting to ${server.name} MCP server...`);

        const client = new Client(
          {
            name: `claude-agent-${server.name}-client`,
            version: '1.0.0',
          },
          {
            capabilities: {},
          }
        );

        // Create stdio transport for the MCP server
        const transport = new StdioClientTransport({
          command: server.command,
          args: server.args,
          env: { ...process.env, ...server.env },
        });

        await client.connect(transport);
        this.mcpClients.set(server.name, client);

        console.log(`[Claude Agent] ✓ Connected to ${server.name} MCP server`);
      } catch (error) {
        console.error(`[Claude Agent] ✗ Failed to connect to ${server.name} MCP server:`, error);
        throw error;
      }
    }

    this.isInitialized = true;
    console.log('[Claude Agent] All MCP servers initialized successfully');
  }

  /**
   * Get available tools from all connected MCP servers
   */
  async getAvailableTools(): Promise<any[]> {
    const allTools: any[] = [];

    for (const [serverName, client] of this.mcpClients.entries()) {
      try {
        const response = await client.listTools();
        const tools = response.tools.map((tool: any) => ({
          ...tool,
          _mcpServer: serverName, // Track which server provides this tool
        }));
        allTools.push(...tools);
      } catch (error) {
        console.error(`[Claude Agent] Error listing tools from ${serverName}:`, error);
      }
    }

    return allTools;
  }

  /**
   * Execute a tool by routing to the appropriate MCP server
   */
  async executeTool(toolName: string, parameters: any): Promise<any> {
    // Find which MCP server provides this tool
    const tools = await this.getAvailableTools();
    const tool = tools.find((t) => t.name === toolName);

    if (!tool || !tool._mcpServer) {
      throw new Error(`Tool ${toolName} not found in any MCP server`);
    }

    const client = this.mcpClients.get(tool._mcpServer);
    if (!client) {
      throw new Error(`MCP client ${tool._mcpServer} not connected`);
    }

    console.log(`[Claude Agent] Executing tool ${toolName} on ${tool._mcpServer} MCP server`);

    const response = await client.callTool({
      name: toolName,
      arguments: parameters,
    });

    return response;
  }

  /**
   * Start an AI-powered conversation with a lead
   */
  async startConversation(context: ConversationContext): Promise<{
    conversationId: string;
    initialMessage: string;
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log(`[Claude Agent] Starting conversation with lead ${context.leadId}`);

    // Step 1: Check TCPA compliance
    const tcpaCheck = await this.executeTool('check_tcpa_compliance', {
      phoneNumber: context.phoneNumber,
      leadData: {
        leadId: context.leadId,
      },
    });

    console.log('[Claude Agent] TCPA Check:', tcpaCheck);

    if (tcpaCheck.content[0]?.text) {
      const tcpaResult = JSON.parse(tcpaCheck.content[0].text);
      if (!tcpaResult.isCompliant) {
        throw new Error(
          `TCPA Compliance Failed: ${tcpaResult.recommendations.join(', ')}`
        );
      }
    }

    // Step 2: Get lead details from database
    const leadDetails = await this.executeTool('get_lead', {
      leadId: context.leadId,
    });

    // Step 3: Get property valuation
    const propertyData = await this.executeTool('get_property_valuation', {
      address: context.address,
    });

    // Step 4: Prepare conversation system prompt with context
    const systemPrompt = this.buildSystemPrompt(context, leadDetails, propertyData);

    // Step 5: Generate initial greeting using Claude
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' }, // Cache system prompt for cost savings
        },
      ],
      messages: [
        {
          role: 'user',
          content: 'Generate a warm, professional greeting to start the conversation.',
        },
      ],
    });

    const initialMessage = response.content[0].type === 'text' ? response.content[0].text : '';

    // Step 6: Record call attempt
    await this.executeTool('add_call_attempt', {
      leadId: context.leadId,
      type: 'automated',
      result: 'initiated',
      notes: 'AI conversation started',
    });

    return {
      conversationId: response.id,
      initialMessage,
    };
  }

  /**
   * Continue an ongoing conversation
   */
  async continueConversation(
    conversationId: string,
    context: ConversationContext,
    userMessage: string,
    conversationHistory: any[]
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        ...conversationHistory,
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  /**
   * Build comprehensive system prompt with all context
   */
  private buildSystemPrompt(
    context: ConversationContext,
    leadDetails?: any,
    propertyData?: any
  ): string {
    return `You are an expert real estate wholesaler AI assistant calling ${context.leadName} about their property at ${context.address}.

**Your Role:**
- Be warm, professional, and genuinely helpful
- Build rapport and trust
- Understand the seller's situation and motivations
- Qualify the lead for wholesale opportunities
- Schedule next steps if appropriate

**Lead Information:**
${leadDetails ? JSON.stringify(JSON.parse(leadDetails.content[0].text), null, 2) : 'Loading...'}

**Property Information:**
${propertyData ? JSON.stringify(JSON.parse(propertyData.content[0].text), null, 2) : 'Loading...'}

**Conversation Objective:**
${context.callObjective || 'Qualify the lead and understand their selling timeline and motivation'}

**Guidelines:**
1. Start with a warm greeting mentioning their property address
2. Ask open-ended questions about their situation
3. Listen for motivation signals (timeline, repairs needed, life changes)
4. Provide value - share market insights from property data
5. Be transparent about your wholesale approach
6. Respect their time - keep initial call under 5 minutes
7. Always ask for permission before asking questions
8. If they're interested, schedule a follow-up or property visit

**Compliance:**
- TCPA compliant (verified before call)
- Professional and respectful at all times
- Honor any request to stop contact immediately

**Tools Available:**
You have access to tools to:
- Update lead information (add_note, update_lead)
- Get property comparables and market trends
- Schedule follow-ups
- Check additional compliance requirements

Use tools when needed to provide accurate information or record important details.`;
  }

  /**
   * Cleanup and disconnect all MCP servers
   */
  async cleanup(): Promise<void> {
    console.log('[Claude Agent] Cleaning up MCP connections...');

    for (const [name, client] of this.mcpClients.entries()) {
      try {
        await client.close();
        console.log(`[Claude Agent] ✓ Disconnected from ${name} MCP server`);
      } catch (error) {
        console.error(`[Claude Agent] Error disconnecting from ${name}:`, error);
      }
    }

    this.mcpClients.clear();
    this.isInitialized = false;

    console.log('[Claude Agent] Cleanup complete');
  }
}

// Export singleton instance
export const claudeAgent = new ClaudeAgentService();
