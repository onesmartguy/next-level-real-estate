import type { Clients, ToolResult, ConversationConfig } from '../../types/index.js'

/**
 * Tool definition for starting a conversation (outbound call)
 */
export const startConversationTool = {
  name: 'elevenlabs_start_conversation',
  description: 'Start an outbound call conversation with an ElevenLabs agent, injecting dynamic context for personalized interactions',
  inputSchema: {
    type: 'object',
    properties: {
      agentId: {
        type: 'string',
        description: 'ID of the conversational AI agent to use for this call',
      },
      leadData: {
        type: 'object',
        description: 'Lead information to inject as context (name, phone, email, motivation, etc.)',
        additionalProperties: true,
      },
      propertyInfo: {
        type: 'object',
        description: 'Property details to inject as context (address, estimated value, condition, etc.)',
        additionalProperties: true,
      },
      strategyRules: {
        type: 'object',
        description: 'Real estate strategy rules (wholesale criteria, ARV calculations, etc.)',
        additionalProperties: true,
      },
      language: {
        type: 'string',
        description: 'Override primary language for this call (auto-detected if not specified)',
      },
      voiceId: {
        type: 'string',
        description: 'Override voice for this specific call',
      },
      maxDuration: {
        type: 'number',
        description: 'Maximum call duration in seconds (default: 300 = 5 minutes)',
        default: 300,
      },
      recordConversation: {
        type: 'boolean',
        description: 'Record this conversation for transcript and analysis',
        default: true,
      },
    },
    required: ['agentId'],
  },
  handler: startConversation,
}

/**
 * Handler function for starting a conversation
 */
async function startConversation(args: any, clients: Clients): Promise<ToolResult> {
  try {
    const conversationConfig: ConversationConfig = {
      agentId: args.agentId,
      context: {
        leadData: args.leadData,
        propertyInfo: args.propertyInfo,
        strategyRules: args.strategyRules,
      },
      language: args.language,
      voiceId: args.voiceId,
      maxDuration: args.maxDuration || 300,
      recordConversation: args.recordConversation !== false,
    }

    console.error('[Tool] Starting conversation with agent:', args.agentId)

    const result = await clients.elevenlabs.createConversation(conversationConfig)

    const output = [
      `✓ Conversation started successfully!`,
      ``,
      `Conversation ID: ${result.conversationId}`,
      `Agent ID: ${result.agentId}`,
      `Status: ${result.status}`,
      `Started: ${result.startedAt}`,
      ``,
      `Context injected:`,
      args.leadData ? `- Lead data: ${Object.keys(args.leadData).join(', ')}` : '',
      args.propertyInfo ? `- Property info: ${Object.keys(args.propertyInfo).join(', ')}` : '',
      args.strategyRules ? `- Strategy rules: ${Object.keys(args.strategyRules).join(', ')}` : '',
      ``,
      `Call settings:`,
      `- Max duration: ${conversationConfig.maxDuration}s`,
      `- Recording: ${conversationConfig.recordConversation ? 'Enabled' : 'Disabled'}`,
      args.language ? `- Language: ${args.language}` : '- Language: Auto-detect',
      ``,
      `Next steps:`,
      `1. Monitor call status with elevenlabs_get_conversation`,
      `2. After call ends, retrieve transcript for analysis`,
      `3. Feed successful patterns back to knowledge base`,
    ].filter(Boolean)

    return {
      content: [
        { type: 'text', text: output.join('\n') },
        { type: 'text', text: JSON.stringify(result, null, 2) },
      ],
      isError: false,
    }
  } catch (error) {
    console.error('[Tool] Start conversation error:', error)
    return {
      content: [
        {
          type: 'text',
          text: `Error starting conversation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    }
  }
}
