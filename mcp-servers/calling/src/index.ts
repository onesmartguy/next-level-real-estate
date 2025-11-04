#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// API Configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const CALLING_SERVICE_URL = process.env.CALLING_SERVICE_URL || 'http://localhost:3002';

interface CallRequest {
  leadId: string;
  phoneNumber: string;
  leadName: string;
  address: string;
  callType: 'manual' | 'automated';
  conversationContext?: any;
}

interface CallStatus {
  callId: string;
  status: 'initiated' | 'ringing' | 'in-progress' | 'completed' | 'failed';
  duration?: number;
  startTime?: string;
  endTime?: string;
  transcript?: string;
  outcome?: string;
}

// MCP Server Implementation
class CallingMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'calling-mcp',
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
          case 'initiate_call':
            return await this.initiateCallTool(args);
          case 'get_call_status':
            return await this.getCallStatusTool(args);
          case 'end_call':
            return await this.endCallTool(args);
          case 'get_call_transcript':
            return await this.getCallTranscriptTool(args);
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
        name: 'initiate_call',
        description: 'Initiate an AI-powered call to a lead using ElevenLabs and Twilio',
        inputSchema: {
          type: 'object',
          properties: {
            leadId: {
              type: 'string',
              description: 'MongoDB ObjectId of the lead',
            },
            phoneNumber: {
              type: 'string',
              description: 'Phone number to call (E.164 format)',
            },
            leadName: {
              type: 'string',
              description: 'Name of the lead for personalization',
            },
            address: {
              type: 'string',
              description: 'Property address for conversation context',
            },
            callType: {
              type: 'string',
              enum: ['manual', 'automated'],
              description: 'Type of call (manual requires consent)',
            },
            conversationContext: {
              type: 'object',
              description: 'Additional context for the AI conversation (property details, lead notes, etc.)',
            },
          },
          required: ['leadId', 'phoneNumber', 'leadName', 'address', 'callType'],
        },
      },
      {
        name: 'get_call_status',
        description: 'Get the current status of an ongoing or completed call',
        inputSchema: {
          type: 'object',
          properties: {
            callId: {
              type: 'string',
              description: 'Call ID returned from initiate_call',
            },
          },
          required: ['callId'],
        },
      },
      {
        name: 'end_call',
        description: 'End an ongoing call',
        inputSchema: {
          type: 'object',
          properties: {
            callId: {
              type: 'string',
              description: 'Call ID to end',
            },
          },
          required: ['callId'],
        },
      },
      {
        name: 'get_call_transcript',
        description: 'Retrieve the transcript of a completed call',
        inputSchema: {
          type: 'object',
          properties: {
            callId: {
              type: 'string',
              description: 'Call ID to get transcript for',
            },
          },
          required: ['callId'],
        },
      },
    ];
  }

  // Tool Implementations

  private async initiateCallTool(args: any) {
    const { leadId, phoneNumber, leadName, address, callType, conversationContext = {} } = args;

    // Mock implementation - in production, this would call Calling Service API
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const callRequest: CallRequest = {
      leadId,
      phoneNumber,
      leadName,
      address,
      callType,
      conversationContext: {
        ...conversationContext,
        greeting: `Hi ${leadName}, this is calling from Next Level Real Estate regarding the property at ${address}.`,
      },
    };

    // TODO: Implement real Calling Service API call
    // const response = await axios.post(`${CALLING_SERVICE_URL}/api/calls/initiate`, callRequest);

    const mockResponse = {
      callId,
      status: 'initiated',
      leadId,
      phoneNumber,
      startTime: new Date().toISOString(),
      message: 'Call initiated successfully',
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockResponse, null, 2),
        },
      ],
    };
  }

  private async getCallStatusTool(args: any) {
    const { callId } = args;

    // Mock implementation
    const mockStatus: CallStatus = {
      callId,
      status: 'in-progress',
      duration: 120,
      startTime: new Date(Date.now() - 120000).toISOString(),
    };

    // TODO: Implement real status check
    // const response = await axios.get(`${CALLING_SERVICE_URL}/api/calls/${callId}/status`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockStatus, null, 2),
        },
      ],
    };
  }

  private async endCallTool(args: any) {
    const { callId } = args;

    // Mock implementation
    const mockResponse = {
      callId,
      status: 'completed',
      endTime: new Date().toISOString(),
      message: 'Call ended successfully',
    };

    // TODO: Implement real call termination
    // const response = await axios.post(`${CALLING_SERVICE_URL}/api/calls/${callId}/end`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockResponse, null, 2),
        },
      ],
    };
  }

  private async getCallTranscriptTool(args: any) {
    const { callId } = args;

    // Mock implementation
    const mockTranscript = {
      callId,
      transcript: [
        {
          speaker: 'AI',
          timestamp: '00:00:02',
          text: 'Hi, this is calling from Next Level Real Estate regarding the property at 123 Main St.',
        },
        {
          speaker: 'Lead',
          timestamp: '00:00:08',
          text: 'Oh yes, I was wondering when someone would reach out.',
        },
        {
          speaker: 'AI',
          timestamp: '00:00:12',
          text: 'Great! I wanted to discuss your property. Are you interested in selling?',
        },
        {
          speaker: 'Lead',
          timestamp: '00:00:16',
          text: 'Yes, I am actually. The house needs some repairs though.',
        },
      ],
      duration: 180,
      summary: 'Lead is motivated to sell. Property needs repairs. Follow-up recommended.',
      sentiment: 'positive',
      qualification: 'qualified',
    };

    // TODO: Implement real transcript retrieval
    // const response = await axios.get(`${CALLING_SERVICE_URL}/api/calls/${callId}/transcript`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockTranscript, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[Calling MCP] Server running on stdio');
  }
}

// Start the server
const server = new CallingMCPServer();
server.run().catch(console.error);
