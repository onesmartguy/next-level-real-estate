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
const ZILLOW_API_KEY = process.env.ZILLOW_API_KEY || '';
const ATTOM_API_KEY = process.env.ATTOM_API_KEY || '';

interface PropertyValuation {
  address: string;
  estimatedValue: number;
  valuationRange: {
    low: number;
    high: number;
  };
  comparables: Array<{
    address: string;
    soldPrice: number;
    soldDate: string;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    distance: number;
  }>;
  marketTrends: {
    appreciation: number;
    daysOnMarket: number;
    pricePerSquareFoot: number;
  };
  updatedAt: string;
}

// MCP Server Implementation
class PropertyDataMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'property-data-mcp',
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
          case 'get_property_valuation':
            return await this.getPropertyValuationTool(args);
          case 'get_comparables':
            return await this.getComparablesTool(args);
          case 'get_market_trends':
            return await this.getMarketTrendsTool(args);
          case 'calculate_arv':
            return await this.calculateARVTool(args);
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
        name: 'get_property_valuation',
        description: 'Get current market valuation for a property address',
        inputSchema: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'Full property address (street, city, state, zip)',
            },
          },
          required: ['address'],
        },
      },
      {
        name: 'get_comparables',
        description: 'Find recently sold comparable properties (comps)',
        inputSchema: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'Subject property address',
            },
            radius: {
              type: 'number',
              description: 'Search radius in miles',
              default: 1,
            },
            limit: {
              type: 'number',
              description: 'Maximum number of comps to return',
              default: 5,
            },
          },
          required: ['address'],
        },
      },
      {
        name: 'get_market_trends',
        description: 'Get market trends for a specific area (zip code or city)',
        inputSchema: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'Zip code or city name',
            },
          },
          required: ['location'],
        },
      },
      {
        name: 'calculate_arv',
        description: 'Calculate After Repair Value (ARV) for a property',
        inputSchema: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'Property address',
            },
            repairCost: {
              type: 'number',
              description: 'Estimated repair/renovation cost',
            },
          },
          required: ['address', 'repairCost'],
        },
      },
    ];
  }

  // Tool Implementations

  private async getPropertyValuationTool(args: any) {
    const { address } = args;

    // Mock implementation - in production, this would call Zillow/Attom APIs
    const mockValuation: PropertyValuation = {
      address,
      estimatedValue: 350000,
      valuationRange: {
        low: 330000,
        high: 370000,
      },
      comparables: [
        {
          address: '123 Similar St',
          soldPrice: 345000,
          soldDate: '2025-09-15',
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1800,
          distance: 0.3,
        },
        {
          address: '456 Nearby Ave',
          soldPrice: 360000,
          soldDate: '2025-10-01',
          bedrooms: 3,
          bathrooms: 2.5,
          squareFeet: 1850,
          distance: 0.5,
        },
      ],
      marketTrends: {
        appreciation: 5.2,
        daysOnMarket: 28,
        pricePerSquareFoot: 195,
      },
      updatedAt: new Date().toISOString(),
    };

    // TODO: Implement real API calls
    // if (ZILLOW_API_KEY) {
    //   const response = await axios.get(`https://api.zillow.com/webservice/GetZestimate.htm`, {
    //     params: { 'zws-id': ZILLOW_API_KEY, address }
    //   });
    //   // Parse Zillow response
    // }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockValuation, null, 2),
        },
      ],
    };
  }

  private async getComparablesTool(args: any) {
    const { address, radius = 1, limit = 5 } = args;

    // Mock implementation
    const comparables = [
      {
        address: '789 Comp Lane',
        soldPrice: 355000,
        soldDate: '2025-10-10',
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 1820,
        distance: 0.4,
      },
      {
        address: '321 Match Rd',
        soldPrice: 342000,
        soldDate: '2025-09-28',
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 1780,
        distance: 0.6,
      },
    ];

    return {
      content: [
        {
          type: 'text',
          text: `Found ${comparables.length} comparable properties within ${radius} miles:\n\n${JSON.stringify(comparables, null, 2)}`,
        },
      ],
    };
  }

  private async getMarketTrendsTool(args: any) {
    const { location } = args;

    // Mock implementation
    const trends = {
      location,
      medianSalePrice: 365000,
      priceChange30Days: 2.1,
      priceChange90Days: 4.8,
      priceChangeYoY: 7.3,
      averageDaysOnMarket: 32,
      inventoryLevel: 'low',
      demandScore: 85,
      appreciation12Month: 6.2,
      updatedAt: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: 'text',
          text: `Market trends for ${location}:\n\n${JSON.stringify(trends, null, 2)}`,
        },
      ],
    };
  }

  private async calculateARVTool(args: any) {
    const { address, repairCost } = args;

    // Get current valuation
    const valuationResult = await this.getPropertyValuationTool({ address });
    const valuationText = valuationResult.content[0].text;
    const valuation: PropertyValuation = JSON.parse(valuationText);

    // Calculate ARV (simplified formula)
    const currentValue = valuation.estimatedValue;
    const appreciationFactor = 1 + (valuation.marketTrends.appreciation / 100);
    const arv = Math.round((currentValue + repairCost * 0.8) * appreciationFactor);

    const calculation = {
      address,
      currentValue,
      repairCost,
      appreciationRate: valuation.marketTrends.appreciation,
      estimatedARV: arv,
      potentialProfit: arv - currentValue - repairCost,
      roi: ((arv - currentValue - repairCost) / (currentValue + repairCost)) * 100,
      maxOfferPrice: Math.round(arv * 0.7 - repairCost), // 70% rule
      calculatedAt: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(calculation, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[Property Data MCP] Server running on stdio');
  }
}

// Start the server
const server = new PropertyDataMCPServer();
server.run().catch(console.error);
