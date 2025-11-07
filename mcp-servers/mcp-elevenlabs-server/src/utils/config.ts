import 'dotenv/config'
import { z } from 'zod'
import type { ServerConfig } from '../types/index.js'

/**
 * Configuration schema validation
 */
const ConfigSchema = z.object({
  elevenlabs: z.object({
    apiKey: z.string().min(1, 'ElevenLabs API key is required'),
    timeout: z.number().default(60000),
  }),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

/**
 * Load and validate server configuration from environment variables
 */
export async function loadConfig(): Promise<ServerConfig> {
  const config = {
    elevenlabs: {
      apiKey: process.env.ELEVENLABS_API_KEY || '',
      timeout: parseInt(process.env.ELEVENLABS_TIMEOUT || '60000'),
    },
    logLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  }

  try {
    // Validate configuration
    return ConfigSchema.parse(config)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n')
      throw new Error(`Configuration validation failed:\n${issues}`)
    }
    throw error
  }
}
