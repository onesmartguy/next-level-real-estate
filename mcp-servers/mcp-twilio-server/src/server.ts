#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

import { createTwilioClient } from './clients/twilio.js'
import { makeCallTool, getCallStatusTool, endCallTool } from './tools/calls/index.js'
import { loadConfig } from './utils/config.js'
import type { Clients } from './types/index.js'

async function initializeClients(): Promise<Clients> {
  console.error('[Server] Initializing Twilio client...')

  const config = await loadConfig()

  const twilioClient = createTwilioClient({
    accountSid: config.twilio.accountSid,
    authToken: config.twilio.authToken,
    phoneNumber: config.twilio.phoneNumber,
    timeout: config.twilio.timeout,
  })

  console.error('[Server] Running health checks...')
  const isHealthy = await twilioClient.healthCheck()
  console.error(`[Server] Twilio: ${isHealthy ? '✓ healthy' : '✗ unhealthy'}`)

  if (!isHealthy) {
    console.error('[Server] WARNING: Twilio health check failed. Check credentials.')
  }

  return {
    twilio: twilioClient,
  }
}

function getAllTools() {
  return [
    makeCallTool,
    getCallStatusTool,
    endCallTool,
  ]
}

async function registerHandlers(server: Server, clients: Clients) {
  const allTools = getAllTools()

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

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name
    console.error(`[Server] CallTool: ${toolName}`)

    const tool = allTools.find(t => t.name === toolName)
    if (!tool) {
      console.error(`[Server] Tool not found: ${toolName}`)
      return {
        content: [{
          type: 'text',
          text: `Unknown tool: ${toolName}`,
        }],
        isError: true,
      }
    }

    try {
      const result = await (tool as any).handler(
        request.params.arguments || {},
        clients
      )

      console.error(`[Server] Tool ${toolName} completed successfully`)
      return result

    } catch (error) {
      console.error(`[Server] Tool ${toolName} error:`, error)

      return {
        content: [{
          type: 'text',
          text: `Error executing ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      }
    }
  })
}

async function main() {
  console.error('[Server] Twilio MCP Server starting...')

  try {
    const clients = await initializeClients()

    const server = new Server(
      {
        name: 'mcp-twilio-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    )

    await registerHandlers(server, clients)

    const transport = new StdioServerTransport()
    await server.connect(transport)

    console.error('[Server] Twilio MCP Server running')
    console.error('[Server] Available tools:')
    getAllTools().forEach(tool => {
      console.error(`  - ${tool.name}: ${tool.description}`)
    })

  } catch (error) {
    console.error('[Server] Fatal error:', error)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('[Server] Unhandled error:', error)
  process.exit(1)
})
