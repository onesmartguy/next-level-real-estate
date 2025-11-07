import type { Clients, ToolResult } from '../../types/index.js'

export const listUsersTool = {
  name: 'realgeeks_list_users',
  description: 'List all agents and lenders in RealGeeks CRM for lead assignment',
  inputSchema: {
    type: 'object',
    properties: {
      siteUuid: {
        type: 'string',
        description: 'RealGeeks site UUID',
      },
    },
    required: ['siteUuid'],
  },
  handler: async (args: any, clients: Clients): Promise<ToolResult> => {
    try {
      const users = await clients.realgeeks.listUsers(args.siteUuid)

      const output = [`Found ${users.length} user(s) in RealGeeks CRM`, ``]

      // Group by role
      const agents = users.filter(u => u.role === 'Agent')
      const lenders = users.filter(u => u.role === 'Lender')

      if (agents.length > 0) {
        output.push(`Agents (${agents.length}):`)
        agents.forEach((agent, i) => {
          output.push(`  ${i + 1}. ${agent.name} (${agent.email})`)
          output.push(`     ID: ${agent.id}`)
          output.push(`     Phone: ${agent.phone_cell || agent.phone_office || 'N/A'}`)
          output.push(`     Admin: ${agent.admin ? 'Yes' : 'No'}`)
        })
        output.push('')
      }

      if (lenders.length > 0) {
        output.push(`Lenders (${lenders.length}):`)
        lenders.forEach((lender, i) => {
          output.push(`  ${i + 1}. ${lender.name} (${lender.email})`)
          output.push(`     ID: ${lender.id}`)
        })
        output.push('')
      }

      output.push(
        `Usage:`,
        `- Use user IDs when creating leads with realgeeks_create_lead (assignToUserId parameter)`,
        `- Use in was_assigned activities to assign leads to specific agents`,
      )

      return {
        content: [
          { type: 'text', text: output.join('\n') },
          { type: 'text', text: JSON.stringify(users, null, 2) },
        ],
        isError: false,
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing users: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      }
    }
  },
}

export const userTools = [listUsersTool]
