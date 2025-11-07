#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

import { createElevenLabsClient } from './clients/elevenlabs.js'
import { conversationTools } from './tools/conversation/index.js'
import { voiceTools } from './tools/voices/index.js'
import { loadConfig } from './utils/config.js'
import type { Clients } from './types/index.js'

/**
 * Initialize clients with health checks
 */
async function initializeClients(): Promise<Clients> {
  console.error('[Server] Initializing clients...')

  const config = await loadConfig()

  // Create ElevenLabs client
  const elevenlabsClient = createElevenLabsClient({
    apiKey: config.elevenlabs.apiKey,
    timeout: config.elevenlabs.timeout,
  })

  // Run health check
  console.error('[Server] Running health checks...')
  const isHealthy = await elevenlabsClient.healthCheck()
  console.error(`[Server] ElevenLabs: ${isHealthy ? '✓ healthy' : '✗ unhealthy'}`)

  if (!isHealthy) {
    console.error('[Server] WARNING: ElevenLabs health check failed. Some features may not work.')
  }

  return {
    elevenlabs: elevenlabsClient,
  }
}

/**
 * Get all available tools
 */
function getAllTools() {
  return [
    ...conversationTools,
    ...voiceTools,
  ]
}

/**
 * Register MCP request handlers
 */
async function registerHandlers(server: Server, clients: Clients) {
  const allTools = getAllTools()

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error(`[Server] ListTools called - ${allTools.length} tools available`)

    return {
      tools: allTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    }
  })

  // Call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name
    console.error(`[Server] CallTool: ${toolName}`)

    // Find the tool
    const tool = allTools.find(t => t.name === toolName)
    if (!tool) {
      console.error(`[Server] Tool not found: ${toolName}`)
      return {
        content: [
          {
            type: 'text',
            text: `Unknown tool: ${toolName}`,
          },
        ],
        isError: true,
      }
    }

    try {
      // Call tool handler with arguments and clients
      const result = await (tool as any).handler(
        request.params.arguments || {},
        clients
      )

      console.error(`[Server] Tool ${toolName} completed successfully`)
      return result

    } catch (error) {
      console.error(`[Server] Tool ${toolName} error:`, error)

      return {
        content: [
          {
            type: 'text',
            text: `Error executing ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      }
    }
  })
}

/**
 * Main server entry point
 */
async function main() {
  console.error('[Server] ElevenLabs MCP Server starting...')

  try {
    // Initialize clients
    const clients = await initializeClients()

    // Create MCP server
    const server = new Server(
      {
        name: 'mcp-elevenlabs-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    )

    // Register handlers
    await registerHandlers(server, clients)

    // Start server with stdio transport
    const transport = new StdioServerTransport()
    await server.connect(transport)

    console.error('[Server] ElevenLabs MCP Server running')
    console.error('[Server] Available tools:')
    getAllTools().forEach(tool => {
      console.error(`  - ${tool.name}: ${tool.description}`)
    })

  } catch (error) {
    console.error('[Server] Fatal error:', error)
    process.exit(1)
  }
}

// Start the server
main().catch(error => {
  console.error('[Server] Unhandled error:', error)
  process.exit(1)
})
