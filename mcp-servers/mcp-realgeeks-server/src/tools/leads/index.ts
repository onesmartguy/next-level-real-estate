import { createLeadTool } from './create-lead.js'
import { listLeadsTool } from './list-leads.js'
import { randomUUID } from 'crypto'
import type { Clients, ToolResult } from '../../types/index.js'

// Update Lead Tool
export const updateLeadTool = {
  name: 'realgeeks_update_lead',
  description: 'Update an existing lead in RealGeeks CRM',
  inputSchema: {
    type: 'object',
    properties: {
      siteUuid: { type: 'string', description: 'Site UUID' },
      leadId: { type: 'string', description: 'Lead ID to update' },
      email: { type: 'string' },
      phone: { type: 'string' },
      urgency: { type: 'string', enum: ['Cold', 'Warm', 'Hot', 'Contacted', 'Not Contacted'] },
      status: { type: 'string', enum: ['Active', 'Cancelled', 'In Escrow', 'Closed Escrow', 'Dead'] },
      notes: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
    },
    required: ['siteUuid', 'leadId'],
  },
  handler: async (args: any, clients: Clients): Promise<ToolResult> => {
    try {
      const updates: any = {}
      if (args.email) updates.email = args.email
      if (args.phone) updates.phone = args.phone
      if (args.urgency) updates.urgency = args.urgency
      if (args.status) updates.status = args.status
      if (args.notes) updates.notes = args.notes
      if (args.tags) updates.tags = args.tags

      const result = await clients.realgeeks.updateLead(args.siteUuid, args.leadId, updates)

      return {
        content: [
          { type: 'text', text: `✓ Lead ${args.leadId} updated successfully` },
          { type: 'text', text: JSON.stringify(result, null, 2) },
        ],
        isError: false,
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

// Get Lead Tool
export const getLeadTool = {
  name: 'realgeeks_get_lead',
  description: 'Retrieve lead details from RealGeeks CRM',
  inputSchema: {
    type: 'object',
    properties: {
      siteUuid: { type: 'string', description: 'Site UUID' },
      leadId: { type: 'string', description: 'Lead ID' },
    },
    required: ['siteUuid', 'leadId'],
  },
  handler: async (args: any, clients: Clients): Promise<ToolResult> => {
    try {
      const lead = await clients.realgeeks.getLead(args.siteUuid, args.leadId)

      const output = [
        `Lead Details:`,
        `ID: ${lead.id}`,
        `Name: ${[lead.first_name, lead.last_name].filter(Boolean).join(' ')}`,
        `Email: ${lead.email || 'N/A'}`,
        `Phone: ${lead.phone || 'N/A'}`,
        `Role: ${lead.role || 'N/A'}`,
        `Urgency: ${lead.urgency || 'N/A'}`,
        `Status: ${lead.status || 'Active'}`,
        `Source: ${lead.source}`,
        lead.activities ? `Activities: ${lead.activities.length}` : '',
      ].filter(Boolean)

      return {
        content: [
          { type: 'text', text: output.join('\n') },
          { type: 'text', text: JSON.stringify(lead, null, 2) },
        ],
        isError: false,
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

// Add Activities Tool
export const addActivitiesTool = {
  name: 'realgeeks_add_activities',
  description: 'Add activities to a lead (calls, emails, property views, notes, etc.)',
  inputSchema: {
    type: 'object',
    properties: {
      siteUuid: { type: 'string', description: 'Site UUID' },
      leadId: { type: 'string', description: 'Lead ID' },
      activities: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'Activity type (e.g., called, note, property_viewed)' },
            description: { type: 'string', description: 'Activity description' },
            source: { type: 'string', description: 'Activity source', default: 'API' },
          },
          required: ['type', 'description'],
        },
      },
    },
    required: ['siteUuid', 'leadId', 'activities'],
  },
  handler: async (args: any, clients: Clients): Promise<ToolResult> => {
    try {
      const activities = args.activities.map((a: any) => ({
        type: a.type,
        description: a.description,
        source: a.source || 'API',
      }))

      await clients.realgeeks.addActivities(args.siteUuid, args.leadId, activities)

      return {
        content: [{
          type: 'text',
          text: `✓ Added ${activities.length} activities to lead ${args.leadId}`,
        }],
        isError: false,
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

export const leadTools = [
  createLeadTool,
  listLeadsTool,
  updateLeadTool,
  getLeadTool,
  addActivitiesTool,
]
