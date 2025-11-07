import type { Clients, ToolResult } from '../../types/index.js'

/**
 * Tool definition for getting agent details
 */
export const getAgentTool = {
  name: 'elevenlabs_get_agent',
  description: 'Get detailed configuration and performance metrics for a specific conversational AI agent',
  inputSchema: {
    type: 'object',
    properties: {
      agentId: {
        type: 'string',
        description: 'ID of the agent to retrieve',
      },
    },
    required: ['agentId'],
  },
  handler: getAgent,
}

/**
 * Handler function for getting agent details
 */
async function getAgent(args: any, clients: Clients): Promise<ToolResult> {
  try {
    console.error('[Tool] Retrieving agent:', args.agentId)

    const agent = await clients.elevenlabs.getAgent(args.agentId)

    const output = [
      `Agent Details:`,
      ``,
      `Name: ${agent.name}`,
      `ID: ${agent.agentId}`,
      `Status: ${agent.status}`,
      `Created: ${agent.createdAt}`,
      `Updated: ${agent.updatedAt}`,
      ``,
    ]

    // Performance metrics
    if (agent.conversationCount !== undefined || agent.averageDuration !== undefined || agent.successRate !== undefined) {
      output.push(`Performance Metrics:`)
      if (agent.conversationCount !== undefined) {
        output.push(`- Total Conversations: ${agent.conversationCount}`)
      }
      if (agent.averageDuration !== undefined) {
        output.push(`- Average Duration: ${agent.averageDuration.toFixed(1)}s`)
      }
      if (agent.successRate !== undefined) {
        output.push(`- Success Rate: ${(agent.successRate * 100).toFixed(1)}%`)
      }
      output.push('')
    }

    // Configuration details
    if (agent.config) {
      output.push(
        `Configuration:`,
        `- Voice: ${agent.config.voiceId}`,
        `- Model: ${agent.config.modelId || 'eleven_flash_v2_5'}`,
        `- Language: ${agent.config.language || 'en'}`,
        agent.config.supportedLanguages && agent.config.supportedLanguages.length > 0
          ? `- Supported Languages: ${agent.config.supportedLanguages.join(', ')}`
          : '',
        `- Auto-detect Language: ${agent.config.autoDetectLanguage ? 'Yes' : 'No'}`,
        ``,
        `Conversation Settings:`,
        agent.config.greeting ? `- Greeting: "${agent.config.greeting}"` : '',
        agent.config.firstMessage ? `- First Message: "${agent.config.firstMessage}"` : '',
        agent.config.conversationGoal ? `- Goal: ${agent.config.conversationGoal}` : '',
        `- Interruption Sensitivity: ${agent.config.interruptionSensitivity || 'high'}`,
        `- Response Latency: ${agent.config.responseLatency || 75}ms`,
        ``,
      )

      if (agent.config.systemPrompt) {
        output.push(`System Prompt:`, agent.config.systemPrompt, ``)
      }

      if (agent.config.knowledgeBase && agent.config.knowledgeBase.length > 0) {
        output.push(
          `Knowledge Base:`,
          ...agent.config.knowledgeBase.map(kb => `- ${kb}`),
          ``,
        )
      }

      if (agent.config.contextDocuments && agent.config.contextDocuments.length > 0) {
        output.push(
          `Context Documents:`,
          ...agent.config.contextDocuments.map(doc => `- ${doc}`),
          ``,
        )
      }

      output.push(
        `Compliance:`,
        `- TCPA Compliance: ${agent.config.tcpaCompliance ? 'Enabled' : 'Disabled'}`,
        `- Recording Consent: ${agent.config.recordingConsent ? 'Required' : 'Not required'}`,
        ``,
      )

      if (agent.config.tags && agent.config.tags.length > 0) {
        output.push(`Tags: ${agent.config.tags.join(', ')}`, ``)
      }

      if (agent.config.description) {
        output.push(`Description:`, agent.config.description, ``)
      }
    }

    return {
      content: [
        { type: 'text', text: output.filter(Boolean).join('\n') },
        { type: 'text', text: JSON.stringify(agent, null, 2) },
      ],
      isError: false,
    }
  } catch (error) {
    console.error('[Tool] Get agent error:', error)
    return {
      content: [
        {
          type: 'text',
          text: `Error retrieving agent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    }
  }
}
