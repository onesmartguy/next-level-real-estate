import { createAgentTool } from './create-agent.js'
import { startConversationTool } from './start-conversation.js'
import { getConversationTool } from './get-conversation.js'
import { listConversationsTool } from './list-conversations.js'
import { updateAgentTool } from './update-agent.js'
import { listAgentsTool } from './list-agents.js'
import { getAgentTool } from './get-agent.js'

/**
 * Export all conversation tools for agent-based outbound calling
 */
export const conversationTools = [
  // Agent management
  createAgentTool,
  getAgentTool,
  listAgentsTool,
  updateAgentTool,

  // Conversation management
  startConversationTool,
  getConversationTool,
  listConversationsTool,
]
