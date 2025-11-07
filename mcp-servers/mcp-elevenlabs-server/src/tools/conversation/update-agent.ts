import type { Clients, ToolResult, AgentConfig } from '../../types/index.js'

/**
 * Tool definition for updating an agent
 */
export const updateAgentTool = {
  name: 'elevenlabs_update_agent',
  description: 'Update an existing conversational AI agent configuration (greeting, system prompt, knowledge base, etc.)',
  inputSchema: {
    type: 'object',
    properties: {
      agentId: {
        type: 'string',
        description: 'ID of the agent to update',
      },
      name: {
        type: 'string',
        description: 'Update agent name',
      },
      voiceId: {
        type: 'string',
        description: 'Update voice ID',
      },
      greeting: {
        type: 'string',
        description: 'Update greeting message',
      },
      firstMessage: {
        type: 'string',
        description: 'Update first message',
      },
      systemPrompt: {
        type: 'string',
        description: 'Update system instructions',
      },
      conversationGoal: {
        type: 'string',
        description: 'Update conversation goal',
      },
      interruptionSensitivity: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'Update interruption sensitivity',
      },
      knowledgeBase: {
        type: 'array',
        items: { type: 'string' },
        description: 'Update knowledge base documents',
      },
      contextDocuments: {
        type: 'array',
        items: { type: 'string' },
        description: 'Update context documents',
      },
    },
    required: ['agentId'],
  },
  handler: updateAgent,
}

/**
 * Handler function for updating an agent
 */
async function updateAgent(args: any, clients: Clients): Promise<ToolResult> {
  try {
    const { agentId, ...updates } = args

    console.error('[Tool] Updating agent:', agentId)

    const result = await clients.elevenlabs.updateAgent(agentId, updates as Partial<AgentConfig>)

    const output = [
      `✓ Agent updated successfully!`,
      ``,
      `Agent ID: ${result.agentId}`,
      `Name: ${result.name}`,
      `Status: ${result.status}`,
      ``,
      `Updated fields:`,
      ...Object.keys(updates).map(key => `- ${key}`),
      ``,
      `Next steps:`,
      `1. Test new configuration with elevenlabs_start_conversation`,
      `2. Monitor call quality and sentiment with updated settings`,
      `3. A/B test different configurations for optimization`,
    ]

    return {
      content: [
        { type: 'text', text: output.join('\n') },
        { type: 'text', text: JSON.stringify(result, null, 2) },
      ],
      isError: false,
    }
  } catch (error) {
    console.error('[Tool] Update agent error:', error)
    return {
      content: [
        {
          type: 'text',
          text: `Error updating agent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    }
  }
}
