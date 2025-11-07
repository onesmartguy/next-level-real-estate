import type { Clients, ToolResult } from '../../types/index.js'

/**
 * Tool definition for listing conversations
 */
export const listConversationsTool = {
  name: 'elevenlabs_list_conversations',
  description: 'List all conversations with optional filtering and analysis of call patterns',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of conversations to return',
        default: 50,
      },
      status: {
        type: 'string',
        enum: ['initiated', 'active', 'completed', 'failed'],
        description: 'Filter by conversation status',
      },
      includeMetrics: {
        type: 'boolean',
        description: 'Include aggregate metrics (avg duration, success rate, etc.)',
        default: true,
      },
    },
  },
  handler: listConversations,
}

/**
 * Handler function for listing conversations
 */
async function listConversations(args: any, clients: Clients): Promise<ToolResult> {
  try {
    console.error('[Tool] Listing conversations')

    const conversations = await clients.elevenlabs.listConversations()

    // Filter by status if specified
    let filtered = conversations
    if (args.status) {
      filtered = conversations.filter(c => c.status === args.status)
    }

    // Apply limit
    const limited = filtered.slice(0, args.limit || 50)

    const output = [`Found ${limited.length} conversation(s)`, ``]

    // Calculate metrics if requested
    if (args.includeMetrics !== false && limited.length > 0) {
      const completed = limited.filter(c => c.status === 'completed')
      const avgDuration = completed.length > 0
        ? completed.reduce((sum, c) => sum + (c.duration || 0), 0) / completed.length
        : 0

      const sentiments = limited
        .filter(c => c.sentiment)
        .map(c => c.sentiment!.overall)
      const positive = sentiments.filter(s => s === 'positive').length
      const neutral = sentiments.filter(s => s === 'neutral').length
      const negative = sentiments.filter(s => s === 'negative').length

      output.push(
        `Metrics:`,
        `- Total: ${limited.length}`,
        `- Completed: ${completed.length}`,
        `- Active: ${limited.filter(c => c.status === 'active').length}`,
        `- Failed: ${limited.filter(c => c.status === 'failed').length}`,
        `- Avg Duration: ${avgDuration.toFixed(1)}s`,
        ``,
        `Sentiment Distribution:`,
        `- Positive: ${positive} (${((positive / sentiments.length) * 100).toFixed(1)}%)`,
        `- Neutral: ${neutral} (${((neutral / sentiments.length) * 100).toFixed(1)}%)`,
        `- Negative: ${negative} (${((negative / sentiments.length) * 100).toFixed(1)}%)`,
        ``,
      )
    }

    // List conversations
    output.push(`Conversations:`, ``)
    limited.forEach((conv, index) => {
      const status = conv.status === 'completed' ? '✓' : conv.status === 'active' ? '▶' : '✗'
      const sentiment = conv.sentiment ? ` [${conv.sentiment.overall}]` : ''
      const duration = conv.duration ? ` (${conv.duration}s)` : ''
      output.push(
        `${index + 1}. ${status} ${conv.conversationId}${sentiment}${duration}`,
        `   Agent: ${conv.agentId}`,
        `   Started: ${conv.startedAt}`,
      )
      if (conv.endedAt) {
        output.push(`   Ended: ${conv.endedAt}`)
      }
      output.push('')
    })

    // Add insights
    if (limited.length > 0) {
      output.push(
        `Insights for Optimization:`,
        `1. Review high-performing conversations for pattern extraction`,
        `2. Analyze failed calls to improve agent strategies`,
        `3. Track sentiment trends over time`,
        `4. Identify optimal call duration for lead qualification`,
      )
    }

    return {
      content: [
        { type: 'text', text: output.join('\n') },
        { type: 'text', text: JSON.stringify(limited, null, 2) },
      ],
      isError: false,
    }
  } catch (error) {
    console.error('[Tool] List conversations error:', error)
    return {
      content: [
        {
          type: 'text',
          text: `Error listing conversations: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    }
  }
}
