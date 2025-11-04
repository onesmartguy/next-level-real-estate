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

// TCPA Compliance Configuration
const DNC_API_KEY = process.env.DNC_API_KEY || '';
const DNC_API_URL = process.env.DNC_API_URL || 'https://api.donotcall.gov';

interface TCPACheckResult {
  phoneNumber: string;
  isCompliant: boolean;
  onDNCRegistry: boolean;
  hasWrittenConsent: boolean;
  consentDate?: string;
  violationRisk: 'none' | 'low' | 'medium' | 'high';
  recommendations: string[];
  checkedAt: string;
  details: {
    consentMethod?: string;
    consentSource?: string;
    lastScrubDate?: string;
    automatedCallsAllowed: boolean;
  };
}

// MCP Server Implementation
class TCPACheckerMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'tcpa-checker-mcp',
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
          case 'check_tcpa_compliance':
            return await this.checkTCPAComplianceTool(args);
          case 'check_dnc_registry':
            return await this.checkDNCRegistryTool(args);
          case 'verify_consent':
            return await this.verifyConsentTool(args);
          case 'get_calling_permissions':
            return await this.getCallingPermissionsTool(args);
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
        name: 'check_tcpa_compliance',
        description: 'Comprehensive TCPA compliance check including DNC registry and consent verification',
        inputSchema: {
          type: 'object',
          properties: {
            phoneNumber: {
              type: 'string',
              description: 'Phone number to check (E.164 format recommended)',
            },
            leadData: {
              type: 'object',
              description: 'Lead consent data (hasWrittenConsent, consentDate, consentMethod)',
            },
          },
          required: ['phoneNumber'],
        },
      },
      {
        name: 'check_dnc_registry',
        description: 'Check if a phone number is on the National Do Not Call Registry',
        inputSchema: {
          type: 'object',
          properties: {
            phoneNumber: {
              type: 'string',
              description: 'Phone number to check',
            },
          },
          required: ['phoneNumber'],
        },
      },
      {
        name: 'verify_consent',
        description: 'Verify if written consent exists and is valid for TCPA compliance',
        inputSchema: {
          type: 'object',
          properties: {
            phoneNumber: {
              type: 'string',
              description: 'Phone number associated with consent',
            },
            consentData: {
              type: 'object',
              description: 'Consent details (hasWrittenConsent, consentDate, consentMethod, consentSource)',
            },
          },
          required: ['phoneNumber', 'consentData'],
        },
      },
      {
        name: 'get_calling_permissions',
        description: 'Get detailed calling permissions based on TCPA rules',
        inputSchema: {
          type: 'object',
          properties: {
            phoneNumber: {
              type: 'string',
              description: 'Phone number to check',
            },
            callType: {
              type: 'string',
              enum: ['manual', 'automated', 'prerecorded'],
              description: 'Type of call to make',
            },
          },
          required: ['phoneNumber', 'callType'],
        },
      },
    ];
  }

  // Tool Implementations

  private async checkTCPAComplianceTool(args: any) {
    const { phoneNumber, leadData = {} } = args;

    // Check DNC registry
    const dncCheck = await this.checkDNCRegistry(phoneNumber);

    // Verify consent
    const consentValid = this.isConsentValid(leadData);

    // Calculate violation risk
    let violationRisk: 'none' | 'low' | 'medium' | 'high' = 'none';
    const recommendations: string[] = [];

    if (dncCheck.onRegistry && !consentValid) {
      violationRisk = 'high';
      recommendations.push('⚠️ CRITICAL: Number on DNC registry without written consent');
      recommendations.push('Do not call this number with automated system');
    } else if (dncCheck.onRegistry && consentValid) {
      violationRisk = 'low';
      recommendations.push('Number on DNC but has valid consent - OK to call');
    } else if (!consentValid) {
      violationRisk = 'medium';
      recommendations.push('No written consent on file - manual calls only');
    }

    if (!leadData.consentDate) {
      recommendations.push('Obtain and document written consent before automated calling');
    }

    const result: TCPACheckResult = {
      phoneNumber,
      isCompliant: violationRisk === 'none' || violationRisk === 'low',
      onDNCRegistry: dncCheck.onRegistry,
      hasWrittenConsent: consentValid,
      consentDate: leadData.consentDate,
      violationRisk,
      recommendations,
      checkedAt: new Date().toISOString(),
      details: {
        consentMethod: leadData.consentMethod,
        consentSource: leadData.consentSource,
        lastScrubDate: dncCheck.lastScrubDate,
        automatedCallsAllowed: consentValid && !dncCheck.onRegistry,
      },
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async checkDNCRegistryTool(args: any) {
    const { phoneNumber } = args;
    const result = await this.checkDNCRegistry(phoneNumber);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async verifyConsentTool(args: any) {
    const { phoneNumber, consentData } = args;

    const isValid = this.isConsentValid(consentData);
    const expirationDate = consentData.consentDate
      ? new Date(new Date(consentData.consentDate).getTime() + 365 * 24 * 60 * 60 * 1000)
      : null;

    const result = {
      phoneNumber,
      hasValidConsent: isValid,
      consentDate: consentData.consentDate,
      consentMethod: consentData.consentMethod,
      expiresAt: expirationDate?.toISOString(),
      isExpired: expirationDate ? new Date() > expirationDate : false,
      recommendations: isValid
        ? ['Consent is valid for automated calling']
        : ['Obtain written consent before making automated calls'],
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async getCallingPermissionsTool(args: any) {
    const { phoneNumber, callType } = args;

    // Mock implementation - in production, would query database and DNC
    const permissions = {
      phoneNumber,
      callType,
      canCall: callType === 'manual' ? true : false,
      requiresConsent: callType !== 'manual',
      tcpaCompliant: false,
      restrictions: [] as string[],
      allowedCallTypes: ['manual'] as string[],
    };

    if (callType === 'automated' || callType === 'prerecorded') {
      permissions.restrictions.push('Written consent required for automated/prerecorded calls');
      permissions.restrictions.push('One-to-one consent required as of 2025 TCPA rules');
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(permissions, null, 2),
        },
      ],
    };
  }

  // Helper Methods

  private async checkDNCRegistry(phoneNumber: string) {
    // Mock implementation - in production, would call actual DNC API
    // Real implementation would use FTC DNC API or third-party service

    // Simulate random DNC check for demo
    const onRegistry = Math.random() < 0.1; // 10% chance

    return {
      phoneNumber,
      onRegistry,
      lastScrubDate: new Date().toISOString(),
      source: 'mock-dnc-registry',
    };

    // Real implementation:
    // if (DNC_API_KEY) {
    //   const response = await axios.post(`${DNC_API_URL}/check`, {
    //     phone: phoneNumber,
    //     apiKey: DNC_API_KEY
    //   });
    //   return response.data;
    // }
  }

  private isConsentValid(consentData: any): boolean {
    if (!consentData) return false;

    // Check for written consent
    if (!consentData.hasWrittenConsent) return false;

    // Check consent date exists
    if (!consentData.consentDate) return false;

    // Check if consent is not expired (1 year)
    const consentDate = new Date(consentData.consentDate);
    const expirationDate = new Date(consentDate.getTime() + 365 * 24 * 60 * 60 * 1000);

    if (new Date() > expirationDate) return false;

    // Check consent method is acceptable
    const validMethods = ['written_form', 'email', 'online_form', 'signed_agreement'];
    if (consentData.consentMethod && !validMethods.includes(consentData.consentMethod)) {
      return false;
    }

    return true;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[TCPA Checker MCP] Server running on stdio');
  }
}

// Start the server
const server = new TCPACheckerMCPServer();
server.run().catch(console.error);
