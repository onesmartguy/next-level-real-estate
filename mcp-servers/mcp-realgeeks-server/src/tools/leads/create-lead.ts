import { randomUUID } from 'crypto'
import type { Clients, ToolResult, LeadCreate } from '../../types/index.js'

export const createLeadTool = {
  name: 'realgeeks_create_lead',
  description: 'Create a new lead in RealGeeks CRM with contact information, property interests, and initial activities',
  inputSchema: {
    type: 'object',
    properties: {
      siteUuid: {
        type: 'string',
        description: 'RealGeeks site UUID (unique identifier for your site)',
      },
      firstName: {
        type: 'string',
        description: 'Lead first name',
      },
      lastName: {
        type: 'string',
        description: 'Lead last name',
      },
      email: {
        type: 'string',
        description: 'Primary email address',
      },
      phone: {
        type: 'string',
        description: 'Primary phone number (supports US and international formats)',
      },
      source: {
        type: 'string',
        description: 'Lead source (e.g., "Website Property Search", "Referral", "Open House")',
        default: 'API Integration',
      },
      sourceDetails: {
        type: 'string',
        description: 'Additional details about lead source',
      },
      role: {
        type: 'string',
        enum: ['Buyer', 'Seller', 'Buyer and Seller', 'Renter'],
        description: 'Lead role/interest',
        default: 'Buyer',
      },
      urgency: {
        type: 'string',
        enum: ['Cold', 'Warm', 'Hot', 'Contacted', 'Not Contacted'],
        description: 'Lead urgency/temperature',
        default: 'Warm',
      },
      timeframe: {
        type: 'string',
        description: 'When they plan to buy/sell (e.g., "Immediately", "3-6 Months", "1 Year Or More")',
      },
      address: {
        type: 'string',
        description: 'Full address or property of interest',
      },
      city: {
        type: 'string',
        description: 'City',
      },
      state: {
        type: 'string',
        description: 'State (2-letter code)',
      },
      zip: {
        type: 'string',
        description: 'ZIP code',
      },
      notes: {
        type: 'string',
        description: 'Additional notes about the lead',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags for categorizing the lead',
        default: [],
      },
      region: {
        type: 'string',
        description: 'Geographic region for round-robin assignment',
      },
      assignToUserId: {
        type: 'string',
        description: 'User ID of agent to assign this lead to',
      },
    },
    required: ['siteUuid'],
  },
  handler: createLead,
}

async function createLead(args: any, clients: Clients): Promise<ToolResult> {
  try {
    // Validate at least one identification field
    if (!args.firstName && !args.lastName && !args.email && !args.phone && !args.address) {
      return {
        content: [{
          type: 'text',
          text: 'Error: At least one identification field required (firstName, lastName, email, phone, or address)',
        }],
        isError: true,
      }
    }

    // Generate UUID for lead
    const leadId = randomUUID()

    // Build lead object
    const lead: LeadCreate = {
      id: leadId,
      source: args.source || 'API Integration',
    }

    // Add optional fields
    if (args.firstName) lead.first_name = args.firstName
    if (args.lastName) lead.last_name = args.lastName
    if (args.email) lead.email = args.email
    if (args.phone) lead.phone = args.phone
    if (args.sourceDetails) lead.source_details = args.sourceDetails
    if (args.role) lead.role = args.role
    if (args.urgency) lead.urgency = args.urgency
    if (args.timeframe) lead.timeframe = args.timeframe
    if (args.address) lead.address = args.address
    if (args.city) lead.city = args.city
    if (args.state) lead.state = args.state
    if (args.zip) lead.zip = args.zip
    if (args.notes) lead.notes = args.notes
    if (args.tags && args.tags.length > 0) lead.tags = args.tags
    if (args.region) lead.region = args.region

    // Add assignment activity if specified
    if (args.assignToUserId) {
      lead.activities = [{
        type: 'was_assigned',
        source: 'API Integration',
        description: 'Lead assigned via API',
        user: { id: args.assignToUserId },
        role: 'agent',
      }]
    }

    console.error('[Tool] Creating lead in RealGeeks:', lead.email || lead.phone)

    const result = await clients.realgeeks.createLead(args.siteUuid, lead)

    const output = [
      `✓ Lead created successfully in RealGeeks!`,
      ``,
      `Lead ID: ${result.lead_id}`,
      `Name: ${[args.firstName, args.lastName].filter(Boolean).join(' ') || 'N/A'}`,
      `Email: ${args.email || 'N/A'}`,
      `Phone: ${args.phone || 'N/A'}`,
      `Role: ${args.role || 'Buyer'}`,
      `Urgency: ${args.urgency || 'Warm'}`,
      `Source: ${args.source || 'API Integration'}`,
      args.assignToUserId ? `Assigned to User: ${args.assignToUserId}` : '',
      ``,
      `Next steps:`,
      `1. Lead will appear in RealGeeks Lead Manager CRM`,
      `2. Assigned agent will receive notification (if assigned)`,
      `3. Use realgeeks_add_activities to log interactions`,
      `4. Sync with ElevenLabs for AI calling`,
    ].filter(Boolean)

    return {
      content: [
        { type: 'text', text: output.join('\n') },
        { type: 'text', text: JSON.stringify(result, null, 2) },
      ],
      isError: false,
    }
  } catch (error) {
    console.error('[Tool] Create lead error:', error)
    return {
      content: [{
        type: 'text',
        text: `Error creating lead: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    }
  }
}
