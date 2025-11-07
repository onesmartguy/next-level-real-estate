import { config as loadEnv } from 'dotenv'
import { z } from 'zod'

loadEnv()

const configSchema = z.object({
  twilio: z.object({
    accountSid: z.string().min(1, 'TWILIO_ACCOUNT_SID is required'),
    authToken: z.string().min(1, 'TWILIO_AUTH_TOKEN is required'),
    phoneNumber: z.string().min(1, 'TWILIO_PHONE_NUMBER is required'),
    timeout: z.number().default(60000),
  }),
  elevenlabs: z.object({
    apiKey: z.string().min(1, 'ELEVENLABS_API_KEY is required'),
    webhookBaseUrl: z.string().url('WEBHOOK_BASE_URL must be a valid URL'),
  }),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

export type Config = z.infer<typeof configSchema>

export async function loadConfig(): Promise<Config> {
  const rawConfig = {
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
      timeout: parseInt(process.env.TWILIO_TIMEOUT || '60000', 10),
    },
    elevenlabs: {
      apiKey: process.env.ELEVENLABS_API_KEY || '',
      webhookBaseUrl: process.env.WEBHOOK_BASE_URL || '',
    },
    logLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  }

  try {
    return configSchema.parse(rawConfig)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.errors.map(e => e.path.join('.')).join(', ')
      throw new Error(`Configuration validation failed: ${missingFields}`)
    }
    throw error
  }
}
