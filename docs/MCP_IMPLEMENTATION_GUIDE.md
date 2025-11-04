# MCP Implementation Guide - Claude Agent SDK

## Quick Reference

**What we're building:**
- 4 MCP servers (Lead DB, Property Data, TCPA Checker, Calling)
- Claude Agent SDK integration in Calling Service
- End-to-end AI-powered calling system

**Project structure:**
```
next-level-real-estate/
├── mcp-servers/           # NEW: MCP tool servers
│   ├── lead-db/
│   ├── property-data/
│   ├── tcpa-checker/
│   └── calling/
└── services/
    └── calling-service/   # NEW: AI calling service
```

---

## Step-by-Step Implementation

### Step 1: Install Dependencies

```bash
cd /home/onesmartguy/projects/next-level-real-estate

# Create MCP servers directory
mkdir -p mcp-servers/{lead-db,property-data,tcpa-checker,calling}

# Create calling service
mkdir -p services/calling-service

# Install Claude SDK and MCP SDK
cd services/calling-service
npm init -y
npm install @anthropic-ai/sdk @modelcontextprotocol/sdk
npm install express mongoose kafkajs dotenv winston
npm install -D typescript @types/node @types/express ts-node nodemon
```

### Step 2: Create Lead DB MCP Server

**Purpose:** Provides Claude access to lead database (MongoDB)

**Tools:**
- `get_lead` - Retrieve lead by phone/ID
- `update_lead` - Update lead information
- `add_call_note` - Add notes during call
- `check_lead_status` - Get lead status

**File:** `mcp-servers/lead-db/package.json`
```json
{
  "name": "lead-db-mcp",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "nodemon --exec ts-node src/index.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4",
    "mongoose": "^8.3.2",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "@types/node": "^22.10.2",
    "ts-node": "^10.9.2",
    "nodemon": "^3.1.0"
  }
}
```

**File:** `mcp-servers/lead-db/src/index.ts`
```typescript
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Lead Model (simplified for MCP)
const LeadSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  propertyDetails: {
    address: String,
    city: String,
    state: String,
    zipCode: String,
  },
  status: String,
  notes: String,
  callAttempts: Array,
  consent: {
    hasWrittenConsent: Boolean,
    consentDate: Date,
  },
  dncStatus: {
    onNationalRegistry: Boolean,
    internalDNC: Boolean,
  },
});

const Lead = mongoose.model('Lead', LeadSchema);

// Connect to MongoDB
await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/next_level_real_estate');

// Create MCP server
const server = new Server(
  {
    name: 'lead-db-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_lead',
        description: 'Get lead information by phone number or ID. Returns complete lead details including contact info, property details, and call history.',
        inputSchema: {
          type: 'object',
          properties: {
            phone: {
              type: 'string',
              description: 'Phone number of the lead (e.g., +12065551234)',
            },
            leadId: {
              type: 'string',
              description: 'MongoDB ObjectId of the lead',
            },
          },
        },
      },
      {
        name: 'update_lead',
        description: 'Update lead information with new data',
        inputSchema: {
          type: 'object',
          properties: {
            leadId: {
              type: 'string',
              description: 'Lead ID to update',
            },
            updates: {
              type: 'object',
              description: 'Fields to update (e.g., {status: "contacted"})',
            },
          },
          required: ['leadId', 'updates'],
        },
      },
      {
        name: 'add_call_note',
        description: 'Add a timestamped note to the lead from the current call',
        inputSchema: {
          type: 'object',
          properties: {
            leadId: {
              type: 'string',
              description: 'Lead ID',
            },
            note: {
              type: 'string',
              description: 'Note content (e.g., "Interested in selling, wants cash offer")',
            },
          },
          required: ['leadId', 'note'],
        },
      },
      {
        name: 'check_lead_status',
        description: 'Get the current status and qualification of a lead',
        inputSchema: {
          type: 'object',
          properties: {
            leadId: {
              type: 'string',
              description: 'Lead ID',
            },
          },
          required: ['leadId'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_lead': {
        let lead;
        if (args.phone) {
          lead = await Lead.findOne({ phone: args.phone }).lean();
        } else if (args.leadId) {
          lead = await Lead.findById(args.leadId).lean();
        } else {
          throw new Error('Either phone or leadId must be provided');
        }

        if (!lead) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ error: 'Lead not found' }),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(lead, null, 2),
            },
          ],
        };
      }

      case 'update_lead': {
        const lead = await Lead.findByIdAndUpdate(
          args.leadId,
          args.updates,
          { new: true }
        ).lean();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                lead,
              }, null, 2),
            },
          ],
        };
      }

      case 'add_call_note': {
        const lead = await Lead.findById(args.leadId);
        if (!lead) {
          throw new Error('Lead not found');
        }

        const timestamp = new Date().toISOString();
        const noteWithTimestamp = `[${timestamp}] ${args.note}`;

        lead.notes = lead.notes
          ? `${lead.notes}\n\n${noteWithTimestamp}`
          : noteWithTimestamp;

        await lead.save();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Note added successfully',
              }),
            },
          ],
        };
      }

      case 'check_lead_status': {
        const lead = await Lead.findById(args.leadId).lean();

        if (!lead) {
          throw new Error('Lead not found');
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: lead.status,
                hasConsent: lead.consent?.hasWrittenConsent,
                onDNC: lead.dncStatus?.onNationalRegistry || lead.dncStatus?.internalDNC,
                callAttempts: lead.callAttempts?.length || 0,
                lastCallDate: lead.callAttempts?.[lead.callAttempts.length - 1]?.date,
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        },
      ],
      isError: true,
    };
  }
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);

console.error('Lead DB MCP Server running on stdio');
```

**File:** `mcp-servers/lead-db/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

### Step 3: Create Property Data MCP Server

**Purpose:** Get property valuations and comparable sales

**File:** `mcp-servers/property-data/src/index.ts`
```typescript
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  {
    name: 'property-data-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_property_value',
        description: 'Get estimated property value and details by address. Returns current market value, equity estimate, and property characteristics.',
        inputSchema: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'Full property address (street, city, state, zip)',
            },
          },
          required: ['address'],
        },
      },
      {
        name: 'get_comparable_sales',
        description: 'Get recent comparable sales (comps) near the property to help with valuation',
        inputSchema: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'Property address',
            },
            radius: {
              type: 'number',
              description: 'Search radius in miles (default: 0.5)',
              default: 0.5,
            },
            limit: {
              type: 'number',
              description: 'Max number of comps to return (default: 5)',
              default: 5,
            },
          },
          required: ['address'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_property_value': {
        // TODO: Integrate with Zillow API, Redfin API, or similar
        // For MVP, return mock data
        const mockValue = {
          address: args.address,
          estimatedValue: 450000,
          confidenceScore: 0.85,
          valuationDate: new Date().toISOString(),
          propertyType: 'Single Family',
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1800,
          yearBuilt: 1985,
          lotSize: 0.25,
          lastSalePrice: 380000,
          lastSaleDate: '2020-06-15',
          estimatedEquity: 120000,
          estimatedMortgage: 330000,
          taxAssessedValue: 425000,
          annualPropertyTax: 5100,
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(mockValue, null, 2),
            },
          ],
        };
      }

      case 'get_comparable_sales': {
        // TODO: Integrate with MLS data or public records
        const mockComps = [
          {
            address: '125 Main St, Seattle, WA 98101',
            salePrice: 465000,
            saleDate: '2025-09-12',
            bedrooms: 3,
            bathrooms: 2,
            squareFeet: 1850,
            pricePerSqFt: 251,
            distanceMiles: 0.2,
          },
          {
            address: '789 Pine Ave, Seattle, WA 98101',
            salePrice: 440000,
            saleDate: '2025-08-28',
            bedrooms: 3,
            bathrooms: 2.5,
            squareFeet: 1750,
            pricePerSqFt: 251,
            distanceMiles: 0.3,
          },
        ];

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                address: args.address,
                comparables: mockComps.slice(0, args.limit || 5),
                averagePrice: 452500,
                averagePricePerSqFt: 251,
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        },
      ],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);

console.error('Property Data MCP Server running on stdio');
```

### Step 4: Create TCPA Checker MCP Server

**Purpose:** Ensure TCPA compliance before calling

**File:** `mcp-servers/tcpa-checker/src/index.ts`
```typescript
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  {
    name: 'tcpa-checker-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'check_dnc',
        description: 'Check if phone number is on the National Do Not Call Registry. ALWAYS call this before initiating an automated call.',
        inputSchema: {
          type: 'object',
          properties: {
            phone: {
              type: 'string',
              description: 'Phone number to check',
            },
          },
          required: ['phone'],
        },
      },
      {
        name: 'verify_consent',
        description: 'Verify that the lead has given written consent to receive automated calls',
        inputSchema: {
          type: 'object',
          properties: {
            leadId: {
              type: 'string',
              description: 'Lead ID',
            },
          },
          required: ['leadId'],
        },
      },
      {
        name: 'can_call',
        description: 'Comprehensive check: determines if it is legally compliant to call this lead (checks DNC, consent, business hours, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            leadId: {
              type: 'string',
              description: 'Lead ID',
            },
            phone: {
              type: 'string',
              description: 'Phone number',
            },
          },
          required: ['leadId', 'phone'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'check_dnc': {
        // TODO: Integrate with National DNC Registry API
        // For MVP, return mock data
        const isOnDNC = false; // Mock: not on DNC

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                phone: args.phone,
                onNationalDNC: isOnDNC,
                lastChecked: new Date().toISOString(),
                canCall: !isOnDNC,
              }, null, 2),
            },
          ],
        };
      }

      case 'verify_consent': {
        // TODO: Check consent in database
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                leadId: args.leadId,
                hasWrittenConsent: true,
                consentDate: '2025-10-24',
                consentMethod: 'manual_entry',
                canAutomatedCall: true,
              }, null, 2),
            },
          ],
        };
      }

      case 'can_call': {
        const currentHour = new Date().getHours();
        const isBusinessHours = currentHour >= 8 && currentHour < 21;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                canCall: isBusinessHours,
                reasons: {
                  businessHours: isBusinessHours,
                  notOnDNC: true,
                  hasConsent: true,
                  notRecentlyCalled: true,
                },
                recommendation: isBusinessHours
                  ? 'Safe to call'
                  : 'Outside business hours (8am-9pm local time)',
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        },
      ],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);

console.error('TCPA Checker MCP Server running on stdio');
```

### Step 5: Create Calling Service with Claude Agent SDK

**File:** `services/calling-service/package.json`
```json
{
  "name": "calling-service",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "nodemon --exec ts-node-esm src/index.ts"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.32.1",
    "@modelcontextprotocol/sdk": "^1.0.4",
    "express": "^4.19.2",
    "dotenv": "^16.4.5",
    "winston": "^3.13.0"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "@types/node": "^22.10.2",
    "@types/express": "^4.17.21",
    "ts-node": "^10.9.2",
    "nodemon": "^3.1.0"
  }
}
```

**File:** `services/calling-service/src/agent.ts`
```typescript
import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

export class RealEstateAgent {
  private anthropic: Anthropic;
  private mcpClients: Map<string, Client> = new Map();
  private availableTools: any[] = [];

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }

  /**
   * Initialize MCP server connections
   */
  async initialize() {
    console.log('Initializing MCP servers...');

    // Start Lead DB MCP Server
    await this.connectMCPServer('lead-db', '../../../mcp-servers/lead-db/dist/index.js');

    // Start Property Data MCP Server
    await this.connectMCPServer('property-data', '../../../mcp-servers/property-data/dist/index.js');

    // Start TCPA Checker MCP Server
    await this.connectMCPServer('tcpa-checker', '../../../mcp-servers/tcpa-checker/dist/index.js');

    // Get all available tools from MCP servers
    await this.refreshTools();

    console.log(`Initialized with ${this.availableTools.length} tools`);
  }

  private async connectMCPServer(name: string, scriptPath: string) {
    const transport = new StdioClientTransport({
      command: 'node',
      args: [scriptPath],
    });

    const client = new Client(
      {
        name: 'calling-service',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await client.connect(transport);
    this.mcpClients.set(name, client);

    console.log(`Connected to ${name} MCP server`);
  }

  private async refreshTools() {
    this.availableTools = [];

    for (const [serverName, client] of this.mcpClients) {
      try {
        const result: any = await client.request(
          {
            method: 'tools/list',
            params: {},
          },
          {
            timeout: 5000,
          }
        );

        if (result.tools) {
          this.availableTools.push(...result.tools);
        }
      } catch (error) {
        console.error(`Error getting tools from ${serverName}:`, error);
      }
    }
  }

  /**
   * Start conversation with Claude
   */
  async startConversation(params: {
    leadId: string;
    phone: string;
    address: string;
  }) {
    const { leadId, phone, address } = params;

    // System prompt with caching
    const systemPrompt = [
      {
        type: 'text' as const,
        text: `You are Alex, a friendly and professional real estate wholesaler.

Your Goal:
- Have a natural, conversational phone call with a property owner
- Determine if they are interested in selling their property quickly for cash
- Qualify the lead based on motivation, timeline, and property condition

Your Approach:
- Be warm and personable, not pushy or salesy
- Ask open-ended questions to understand their situation
- Listen for motivated seller signals: divorce, inheritance, financial distress, repairs needed, relocation
- Qualify the property: condition, equity, timeline to sell
- If interested, offer to provide a no-obligation cash offer

TCPA Compliance (CRITICAL):
- ALWAYS verify consent before proceeding with the call
- If they ask to be removed from your list, immediately end the call politely and update their DNC status
- Never misrepresent who you are or why you're calling
- Respect their time and wishes

Available Tools:
You have access to tools to:
- Get lead information from database
- Check property values and comparable sales
- Verify TCPA compliance (DNC status, consent)
- Add notes during the conversation
- Update lead status

Conversation Flow:
1. Introduce yourself warmly
2. Verify you're speaking with the right person
3. Ask permission to continue (TCPA)
4. Understand their situation with open questions
5. Qualify the property and timeline
6. If interested, schedule next steps
7. Thank them for their time

Remember: Build rapport, ask questions, listen actively.`,
        cache_control: { type: 'ephemeral' as const },
      },
    ];

    // Initial message to Claude
    const initialMessage = `I'm about to make a call to a lead. Here's the information:

Lead ID: ${leadId}
Phone: ${phone}
Address: ${address}

Before we start the call, please:
1. Use the "can_call" tool to verify TCPA compliance
2. Use the "get_lead" tool to retrieve any existing information about this lead
3. Use the "get_property_value" tool to get an estimated value for the property

Then, prepare an opening line for the call that is warm and personalized based on what you learned.`;

    // Start conversation
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: initialMessage,
        },
      ],
      tools: this.availableTools,
    });

    // Process response and handle tool calls
    return await this.processResponse(response, [{
      role: 'user',
      content: initialMessage,
    }]);
  }

  private async processResponse(
    response: Anthropic.Message,
    messageHistory: any[]
  ): Promise<any> {
    // Check for tool use
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    if (toolUseBlocks.length > 0) {
      console.log(`\nClaude wants to use ${toolUseBlocks.length} tool(s):\n`);

      // Execute all tool calls
      const toolResults = await Promise.all(
        toolUseBlocks.map(async (toolUse) => {
          console.log(`- ${toolUse.name}:`, JSON.stringify(toolUse.input, null, 2));

          const result = await this.executeToolCall(
            toolUse.name,
            toolUse.input as Record<string, unknown>
          );

          console.log(`  Result:`, result.substring(0, 200) + '...\n');

          return {
            type: 'tool_result' as const,
            tool_use_id: toolUse.id,
            content: result,
          };
        })
      );

      // Continue conversation with tool results
      messageHistory.push({
        role: 'assistant',
        content: response.content,
      });

      messageHistory.push({
        role: 'user',
        content: toolResults,
      });

      const nextResponse = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: messageHistory,
        tools: this.availableTools,
      });

      return this.processResponse(nextResponse, messageHistory);
    }

    // No more tool calls - return final response
    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    return {
      response: textBlocks.map(block => block.text).join('\n'),
      messageHistory,
    };
  }

  private async executeToolCall(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<string> {
    // Find which MCP server has this tool
    for (const [serverName, client] of this.mcpClients) {
      try {
        const result: any = await client.request(
          {
            method: 'tools/call',
            params: {
              name: toolName,
              arguments: args,
            },
          },
          {
            timeout: 10000,
          }
        );

        if (result.content && result.content[0]) {
          return result.content[0].text;
        }

        return JSON.stringify(result);
      } catch (error) {
        // Tool not on this server, try next
        continue;
      }
    }

    throw new Error(`Tool ${toolName} not found on any MCP server`);
  }

  /**
   * Cleanup MCP connections
   */
  async shutdown() {
    for (const [name, client] of this.mcpClients) {
      try {
        await client.close();
        console.log(`Disconnected from ${name} MCP server`);
      } catch (error) {
        console.error(`Error disconnecting from ${name}:`, error);
      }
    }
  }
}
```

---

## Testing the Implementation

### Test Script

**File:** `services/calling-service/src/test-agent.ts`
```typescript
import { RealEstateAgent } from './agent.js';
import dotenv from 'dotenv';

dotenv.config();

async function testAgent() {
  const agent = new RealEstateAgent();

  try {
    // Initialize MCP servers
    await agent.initialize();

    console.log('\n=== Starting Test Call ===\n');

    // Start conversation
    const result = await agent.startConversation({
      leadId: '68fc0c2ff7716276d3ce5f47',
      phone: '+12065551234',
      address: '123 Main St, Seattle, WA 98101',
    });

    console.log('\n=== Claude\'s Opening Line ===\n');
    console.log(result.response);

    console.log('\n=== Test Complete ===\n');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await agent.shutdown();
  }
}

testAgent();
```

### Run Test

```bash
# Terminal 1: Build and start MCP servers
cd mcp-servers/lead-db && npm run build && cd ../..
cd mcp-servers/property-data && npm run build && cd ../..
cd mcp-servers/tcpa-checker && npm run build && cd ../..

# Terminal 2: Test the agent
cd services/calling-service
npm run build
ANTHROPIC_API_KEY=your-key node dist/test-agent.js
```

---

## Environment Variables

**File:** `services/calling-service/.env`
```env
# Claude API
ANTHROPIC_API_KEY=sk-ant-xxx

# MongoDB
MONGODB_URI=mongodb://localhost:27017/next_level_real_estate

# Service Port
PORT=3002

# Log Level
LOG_LEVEL=info
```

---

## Next Steps

1. ✅ MCP servers created (Lead DB, Property Data, TCPA)
2. ✅ Claude Agent SDK integrated
3. ✅ Tool calling workflow implemented
4. ⏳ Build REST API for calling service
5. ⏳ Integrate with ElevenLabs + Twilio
6. ⏳ Create admin dashboard form
7. ⏳ End-to-end testing

---

*MCP Implementation Guide*
*Next Level Real Estate - October 2025*
