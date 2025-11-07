import type { Clients, ToolResult } from '../../types/index.js'

/**
 * Tool definition for listing agents
 */
export const listAgentsTool = {
  name: 'elevenlabs_list_agents',
  description: 'List all conversational AI agents with their configurations and performance metrics',
  inputSchema: {
    type: 'object',
    properties: {
      includeMetrics: {
        type: 'boolean',
        description: 'Include performance metrics for each agent',
        default: true,
      },
    },
  },
  handler: listAgents,
}

/**
 * Handler function for listing agents
 */
async function listAgents(args: any, clients: Clients): Promise<ToolResult> {
  try {
    console.error('[Tool] Listing agents')

    const agents = await clients.elevenlabs.listAgents()

    const output = [`Found ${agents.length} agent(s)`, ``]

    agents.forEach((agent, index) => {
      output.push(
        `${index + 1}. ${agent.name}`,
        `   ID: ${agent.agentId}`,
        `   Status: ${agent.status}`,
        `   Created: ${agent.createdAt}`,
      )

      if (args.includeMetrics !== false) {
        if (agent.conversationCount !== undefined) {
          output.push(`   Conversations: ${agent.conversationCount}`)
        }
        if (agent.averageDuration !== undefined) {
          output.push(`   Avg Duration: ${agent.averageDuration.toFixed(1)}s`)
        }
        if (agent.successRate !== undefined) {
          output.push(`   Success Rate: ${(agent.successRate * 100).toFixed(1)}%`)
        }
      }

      if (agent.config) {
        output.push(
          `   Voice: ${agent.config.voiceId}`,
          `   Model: ${agent.config.modelId || 'eleven_flash_v2_5'}`,
          `   Language: ${agent.config.language || 'en'}`,
        )
      }

      output.push('')
    })

    if (agents.length > 0) {
      output.push(
        `Agent Management Tips:`,
        `1. Compare performance metrics to identify top performers`,
        `2. Clone successful agents for A/B testing variations`,
        `3. Update underperforming agents based on call feedback`,
        `4. Archive inactive agents to keep list organized`,
      )
    }

    return {
      content: [
        { type: 'text', text: output.join('\n') },
        { type: 'text', text: JSON.stringify(agents, null, 2) },
      ],
      isError: false,
    }
  } catch (error) {
    console.error('[Tool] List agents error:', error)
    return {
      content: [
        {
          type: 'text',
          text: `Error listing agents: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    }
  }
}
