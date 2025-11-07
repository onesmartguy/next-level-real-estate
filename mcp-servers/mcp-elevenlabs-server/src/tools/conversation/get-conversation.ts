import type { Clients, ToolResult } from '../../types/index.js'

/**
 * Tool definition for retrieving conversation details
 */
export const getConversationTool = {
  name: 'elevenlabs_get_conversation',
  description: 'Get details about a conversation including transcript, sentiment analysis, and call metrics',
  inputSchema: {
    type: 'object',
    properties: {
      conversationId: {
        type: 'string',
        description: 'ID of the conversation to retrieve',
      },
      includeTranscript: {
        type: 'boolean',
        description: 'Include full conversation transcript',
        default: true,
      },
      includeSentiment: {
        type: 'boolean',
        description: 'Include sentiment analysis and buyer motivation insights',
        default: true,
      },
    },
    required: ['conversationId'],
  },
  handler: getConversation,
}

/**
 * Handler function for getting conversation details
 */
async function getConversation(args: any, clients: Clients): Promise<ToolResult> {
  try {
    console.error('[Tool] Retrieving conversation:', args.conversationId)

    const conversation = await clients.elevenlabs.getConversation(args.conversationId)

    const output = [
      `Conversation Details:`,
      ``,
      `ID: ${conversation.conversationId}`,
      `Agent: ${conversation.agentId}`,
      `Status: ${conversation.status}`,
      `Started: ${conversation.startedAt}`,
      conversation.endedAt ? `Ended: ${conversation.endedAt}` : '',
      conversation.duration ? `Duration: ${conversation.duration}s` : '',
      ``,
    ]

    // Add sentiment analysis if available
    if (args.includeSentiment !== false && conversation.sentiment) {
      output.push(
        `Sentiment Analysis:`,
        `- Overall: ${conversation.sentiment.overall} (${conversation.sentiment.score.toFixed(2)})`,
        conversation.sentiment.motivation ? `- Motivation: ${conversation.sentiment.motivation}` : '',
        conversation.sentiment.intent ? `- Intent: ${conversation.sentiment.intent.join(', ')}` : '',
        ``,
      )
    }

    // Add transcript if available and requested
    if (args.includeTranscript !== false && conversation.transcript && conversation.transcript.length > 0) {
      output.push(`Transcript:`, ``)
      conversation.transcript.forEach((entry, index) => {
        const role = entry.role === 'agent' ? '🤖 Agent' : '👤 User'
        const confidence = entry.confidence ? ` (${(entry.confidence * 100).toFixed(0)}%)` : ''
        output.push(`${index + 1}. ${role}${confidence}: ${entry.text}`)
      })
      output.push(``)
    }

    // Add recording URL if available
    if (conversation.recordingUrl) {
      output.push(`Recording: ${conversation.recordingUrl}`, ``)
    }

    // Add metadata if available
    if (conversation.metadata) {
      output.push(
        `Metadata:`,
        JSON.stringify(conversation.metadata, null, 2),
        ``,
      )
    }

    // Insights for knowledge base improvement
    if (conversation.status === 'completed') {
      output.push(
        `Knowledge Base Insights:`,
        `1. Extract successful responses for pattern library`,
        `2. Identify objection handling techniques that worked`,
        `3. Update conversation strategies based on sentiment`,
        `4. Feed successful qualification criteria to RAG system`,
      )
    }

    return {
      content: [
        { type: 'text', text: output.filter(Boolean).join('\n') },
        { type: 'text', text: JSON.stringify(conversation, null, 2) },
      ],
      isError: false,
    }
  } catch (error) {
    console.error('[Tool] Get conversation error:', error)
    return {
      content: [
        {
          type: 'text',
          text: `Error retrieving conversation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    }
  }
}
