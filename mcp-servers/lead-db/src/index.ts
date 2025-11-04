#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/next_level_real_estate';

// Lead Schema (simplified version matching the main Lead model)
const LeadSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    fullAddress: String,
  },
  leadSource: {
    source: String,
    sourceId: String,
    campaign: String,
    receivedAt: Date,
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'nurturing', 'converted', 'disqualified'],
    default: 'new',
  },
  consent: {
    hasWrittenConsent: Boolean,
    consentDate: Date,
    consentMethod: String,
    consentSource: String,
  },
  tcpaCompliance: {
    checked: Boolean,
    checkedAt: Date,
    onDNCRegistry: Boolean,
    violationRisk: String,
  },
  propertyDetails: {
    propertyType: String,
    estimatedValue: Number,
    estimatedEquity: Number,
    condition: String,
    motivationLevel: String,
  },
  callAttempts: [{
    date: Date,
    type: String,
    result: String,
    duration: Number,
    notes: String,
  }],
  notes: [{
    date: Date,
    author: String,
    content: String
  }],
  tags: [String],
  automatedCallsAllowed: Boolean,
  lastContactedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Lead = mongoose.model('Lead', LeadSchema);

// MCP Server Implementation
class LeadDBMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'lead-db-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();

    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      await mongoose.connection.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getTools(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_lead':
            return await this.getLeadTool(args);
          case 'update_lead':
            return await this.updateLeadTool(args);
          case 'add_call_attempt':
            return await this.addCallAttemptTool(args);
          case 'add_note':
            return await this.addNoteTool(args);
          case 'search_leads':
            return await this.searchLeadsTool(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private getTools(): Tool[] {
    return [
      {
        name: 'get_lead',
        description: 'Retrieve a lead by ID with all details including contact info, property details, and call history',
        inputSchema: {
          type: 'object',
          properties: {
            leadId: {
              type: 'string',
              description: 'The MongoDB ObjectId of the lead',
            },
          },
          required: ['leadId'],
        },
      },
      {
        name: 'update_lead',
        description: 'Update lead fields such as status, property details, or contact information',
        inputSchema: {
          type: 'object',
          properties: {
            leadId: {
              type: 'string',
              description: 'The MongoDB ObjectId of the lead',
            },
            updates: {
              type: 'object',
              description: 'Fields to update (e.g., status, propertyDetails, tags)',
            },
          },
          required: ['leadId', 'updates'],
        },
      },
      {
        name: 'add_call_attempt',
        description: 'Record a new call attempt for a lead',
        inputSchema: {
          type: 'object',
          properties: {
            leadId: {
              type: 'string',
              description: 'The MongoDB ObjectId of the lead',
            },
            type: {
              type: 'string',
              enum: ['manual', 'automated'],
              description: 'Type of call attempt',
            },
            result: {
              type: 'string',
              description: 'Result of the call (e.g., connected, voicemail, no-answer)',
            },
            duration: {
              type: 'number',
              description: 'Call duration in seconds',
            },
            notes: {
              type: 'string',
              description: 'Notes from the call',
            },
          },
          required: ['leadId', 'type', 'result'],
        },
      },
      {
        name: 'add_note',
        description: 'Add a note to a lead',
        inputSchema: {
          type: 'object',
          properties: {
            leadId: {
              type: 'string',
              description: 'The MongoDB ObjectId of the lead',
            },
            author: {
              type: 'string',
              description: 'Author of the note (e.g., "AI Agent", "Sales Rep")',
            },
            content: {
              type: 'string',
              description: 'Note content',
            },
          },
          required: ['leadId', 'author', 'content'],
        },
      },
      {
        name: 'search_leads',
        description: 'Search leads by criteria (status, tags, phone number, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            criteria: {
              type: 'object',
              description: 'Search criteria (e.g., {status: "new", tags: "motivated"})',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return',
              default: 10,
            },
          },
          required: ['criteria'],
        },
      },
    ];
  }

  // Tool Implementations
  private async getLeadTool(args: any) {
    const { leadId } = args;
    const lead = await Lead.findById(leadId);

    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(lead, null, 2),
        },
      ],
    };
  }

  private async updateLeadTool(args: any) {
    const { leadId, updates } = args;

    const lead = await Lead.findByIdAndUpdate(
      leadId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Lead updated successfully: ${JSON.stringify(lead, null, 2)}`,
        },
      ],
    };
  }

  private async addCallAttemptTool(args: any) {
    const { leadId, type, result, duration, notes } = args;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    lead.callAttempts.push({
      date: new Date(),
      type,
      result,
      duration,
      notes,
    } as any);

    lead.lastContactedAt = new Date();

    // Auto-update status based on result
    if (result === 'connected' || result === 'voicemail') {
      lead.status = 'contacted';
    }

    await lead.save();

    return {
      content: [
        {
          type: 'text',
          text: `Call attempt recorded for lead ${leadId}: ${result}`,
        },
      ],
    };
  }

  private async addNoteTool(args: any) {
    const { leadId, author, content } = args;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    lead.notes.push({
      date: new Date(),
      author,
      content,
    } as any);

    await lead.save();

    return {
      content: [
        {
          type: 'text',
          text: `Note added to lead ${leadId}`,
        },
      ],
    };
  }

  private async searchLeadsTool(args: any) {
    const { criteria, limit = 10 } = args;

    const leads = await Lead.find(criteria).limit(limit);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(leads, null, 2),
        },
      ],
    };
  }

  async run() {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.error('[Lead DB MCP] Connected to MongoDB');

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[Lead DB MCP] Server running on stdio');
  }
}

// Start the server
const server = new LeadDBMCPServer();
server.run().catch(console.error);
