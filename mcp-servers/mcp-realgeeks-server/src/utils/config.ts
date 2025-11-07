import 'dotenv/config'
import { z } from 'zod'
import type { ServerConfig } from '../types/index.js'

const ConfigSchema = z.object({
  realgeeks: z.object({
    apiUsername: z.string().min(1, 'RealGeeks API username is required'),
    apiPassword: z.string().min(1, 'RealGeeks API password is required'),
    webhookSecret: z.string().optional(),
    timeout: z.number().default(30000),
  }),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

export async function loadConfig(): Promise<ServerConfig> {
  const config = {
    realgeeks: {
      apiUsername: process.env.REALGEEKS_API_USERNAME || '',
      apiPassword: process.env.REALGEEKS_API_PASSWORD || '',
      webhookSecret: process.env.REALGEEKS_WEBHOOK_SECRET,
      timeout: parseInt(process.env.REALGEEKS_TIMEOUT || '30000'),
    },
    logLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  }

  try {
    return ConfigSchema.parse(config)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n')
      throw new Error(`Configuration validation failed:\n${issues}`)
    }
    throw error
  }
}
