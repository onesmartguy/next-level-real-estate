import type { Clients, ToolResult } from '../../types/index.js'

// List Leads Tool
export const listLeadsTool = {
  name: 'realgeeks_list_leads',
  description: 'List all leads from RealGeeks CRM for a specific site',
  inputSchema: {
    type: 'object',
    properties: {
      siteUuid: { type: 'string', description: 'Site UUID' },
    },
    required: ['siteUuid'],
  },
  handler: async (args: any, clients: Clients): Promise<ToolResult> => {
    try {
      const leads = await clients.realgeeks.listLeads(args.siteUuid)

      if (Array.isArray(leads)) {
        const output = [
          `Found ${leads.length} leads`,
          '',
          ...leads.map((lead: any) => {
            const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown'
            const email = lead.email ? ` | ${lead.email}` : ''
            const phone = lead.phone ? ` | ${lead.phone}` : ''
            const status = lead.status ? ` [${lead.status}]` : ''
            return `• ${name}${email}${phone}${status}`
          }),
        ]

        return {
          content: [
            { type: 'text', text: output.join('\n') },
            { type: 'text', text: JSON.stringify(leads, null, 2) },
          ],
          isError: false,
        }
      } else {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(leads, null, 2),
          }],
          isError: false,
        }
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      }
    }
  },
}
