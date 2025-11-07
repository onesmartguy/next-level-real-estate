import type { Clients, ToolResult, AgentConfig } from '../../types/index.js'

/**
 * Tool definition for creating a conversational AI agent
 */
export const createAgentTool = {
  name: 'elevenlabs_create_agent',
  description: 'Create a new ElevenLabs Conversational AI agent for outbound calling with custom voice, greeting, and conversation strategy',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the agent (e.g., "Real Estate Wholesale Lead Qualifier")',
      },
      voiceId: {
        type: 'string',
        description: 'ElevenLabs voice ID to use for the agent',
      },
      modelId: {
        type: 'string',
        description: 'Model to use (eleven_flash_v2_5 for 75ms latency, eleven_turbo_v2_5 for balanced, or custom)',
        default: 'eleven_flash_v2_5',
      },
      greeting: {
        type: 'string',
        description: 'Initial greeting when call connects (e.g., "Hi, this is Sarah from Next Level Real Estate...")',
      },
      firstMessage: {
        type: 'string',
        description: 'First message after greeting (e.g., "I saw you were interested in selling your property...")',
      },
      systemPrompt: {
        type: 'string',
        description: 'System instructions for the agent behavior, conversation style, and objectives',
      },
      conversationGoal: {
        type: 'string',
        description: 'Primary goal of the conversation (e.g., "Qualify lead and schedule property viewing")',
      },
      interruptionSensitivity: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'How sensitive the agent is to user interruptions (high = more natural turn-taking)',
        default: 'high',
      },
      responseLatency: {
        type: 'number',
        description: 'Target response latency in milliseconds (75ms minimum with Flash 2.5)',
        default: 75,
      },
      language: {
        type: 'string',
        description: 'Primary language (e.g., "en" for English)',
        default: 'en',
      },
      supportedLanguages: {
        type: 'array',
        items: { type: 'string' },
        description: 'Additional supported languages for auto-detection',
        default: [],
      },
      autoDetectLanguage: {
        type: 'boolean',
        description: 'Automatically detect and switch languages during conversation (32+ languages supported)',
        default: true,
      },
      knowledgeBase: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of knowledge base document IDs or URLs for RAG context',
        default: [],
      },
      contextDocuments: {
        type: 'array',
        items: { type: 'string' },
        description: 'Context documents for dynamic injection (strategy guides, market data, etc.)',
        default: [],
      },
      tcpaCompliance: {
        type: 'boolean',
        description: 'Enable TCPA compliance checks (consent verification, DNC registry)',
        default: true,
      },
      recordingConsent: {
        type: 'boolean',
        description: 'Require recording consent disclosure at call start',
        default: true,
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags for organizing agents (e.g., ["wholesale", "lead-qualification"])',
        default: [],
      },
      description: {
        type: 'string',
        description: 'Human-readable description of the agent purpose',
      },
    },
    required: ['name', 'voiceId', 'greeting', 'systemPrompt'],
  },
  handler: createAgent,
}

/**
 * Handler function for creating an agent
 */
async function createAgent(args: any, clients: Clients): Promise<ToolResult> {
  try {
    const agentConfig: AgentConfig = {
      name: args.name,
      voiceId: args.voiceId,
      modelId: args.modelId || 'eleven_flash_v2_5',
      greeting: args.greeting,
      firstMessage: args.firstMessage,
      systemPrompt: args.systemPrompt,
      conversationGoal: args.conversationGoal,
      interruptionSensitivity: args.interruptionSensitivity || 'high',
      responseLatency: args.responseLatency || 75,
      language: args.language || 'en',
      supportedLanguages: args.supportedLanguages || [],
      autoDetectLanguage: args.autoDetectLanguage !== false,
      knowledgeBase: args.knowledgeBase || [],
      contextDocuments: args.contextDocuments || [],
      tcpaCompliance: args.tcpaCompliance !== false,
      recordingConsent: args.recordingConsent !== false,
      tags: args.tags || [],
      description: args.description,
    }

    console.error('[Tool] Creating ElevenLabs conversational agent:', agentConfig.name)

    const result = await clients.elevenlabs.createAgent(agentConfig)

    const output = [
      `✓ Agent created successfully!`,
      ``,
      `Agent ID: ${result.agentId}`,
      `Name: ${result.name}`,
      `Status: ${result.status}`,
      `Created: ${result.createdAt}`,
      ``,
      `Configuration:`,
      `- Model: ${agentConfig.modelId}`,
      `- Voice: ${agentConfig.voiceId}`,
      `- Language: ${agentConfig.language} (Auto-detect: ${agentConfig.autoDetectLanguage})`,
      `- Turn-taking: ${agentConfig.interruptionSensitivity} sensitivity`,
      `- Response latency: ${agentConfig.responseLatency}ms`,
      `- TCPA compliance: ${agentConfig.tcpaCompliance ? 'Enabled' : 'Disabled'}`,
      `- Recording consent: ${agentConfig.recordingConsent ? 'Required' : 'Not required'}`,
      ``,
      `Next steps:`,
      `1. Use elevenlabs_start_conversation to initiate calls with this agent`,
      `2. Inject dynamic context (lead data, property info) at call start`,
      `3. Monitor conversation transcripts for quality improvement`,
    ]

    return {
      content: [
        { type: 'text', text: output.join('\n') },
        { type: 'text', text: JSON.stringify(result, null, 2) },
      ],
      isError: false,
    }
  } catch (error) {
    console.error('[Tool] Create agent error:', error)
    return {
      content: [
        {
          type: 'text',
          text: `Error creating agent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    }
  }
}
