import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from the calling-service directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Configuration schema with validation
 */
const ConfigSchema = z.object({
  // Service
  port: z.number().default(3002),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  serviceName: z.string().default('calling-service'),

  // Database
  mongoUri: z.string(),

  // Kafka
  kafkaBrokers: z.string(),
  kafkaClientId: z.string().default('calling-service'),
  kafkaGroupId: z.string().default('calling-service-group'),

  // Twilio
  twilio: z.object({
    accountSid: z.string(),
    authToken: z.string(),
    phoneNumber: z.string(),
  }),

  // ElevenLabs
  elevenlabs: z.object({
    apiKey: z.string(),
    agentId: z.string().optional(),
    voiceId: z.string().optional(),
    model: z.string().default('flash-2.5'),
  }),

  // Service URLs
  leadServiceUrl: z.string().default('http://localhost:3001'),
  analyticsServiceUrl: z.string().default('http://localhost:3003'),

  // Observability
  otel: z.object({
    endpoint: z.string().optional(),
    serviceName: z.string().default('calling-service'),
  }),

  // TCPA Compliance
  tcpa: z.object({
    enableValidation: z.boolean().default(true),
    requireWrittenConsent: z.boolean().default(true),
  }),

  // Call Configuration
  call: z.object({
    maxDuration: z.number().default(1800), // 30 minutes
    timeout: z.number().default(30), // 30 seconds
    enableRecording: z.boolean().default(true),
    enableTranscription: z.boolean().default(true),
  }),
});

/**
 * Load and validate configuration
 */
function loadConfig() {
  const rawConfig = {
    port: parseInt(process.env.PORT || '3002', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    serviceName: process.env.SERVICE_NAME || 'calling-service',

    mongoUri: process.env.MONGODB_URI || '',

    kafkaBrokers: process.env.KAFKA_BROKERS || 'localhost:9092',
    kafkaClientId: process.env.KAFKA_CLIENT_ID || 'calling-service',
    kafkaGroupId: process.env.KAFKA_GROUP_ID || 'calling-service-group',

    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    },

    elevenlabs: {
      apiKey: process.env.ELEVENLABS_API_KEY || '',
      agentId: process.env.ELEVENLABS_AGENT_ID,
      voiceId: process.env.ELEVENLABS_VOICE_ID,
      model: process.env.ELEVENLABS_MODEL || 'flash-2.5',
    },

    leadServiceUrl: process.env.LEAD_SERVICE_URL || 'http://localhost:3001',
    analyticsServiceUrl: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3003',

    otel: {
      endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
      serviceName: process.env.OTEL_SERVICE_NAME || 'calling-service',
    },

    tcpa: {
      enableValidation: process.env.ENABLE_TCPA_VALIDATION === 'true',
      requireWrittenConsent: process.env.REQUIRE_WRITTEN_CONSENT === 'true',
    },

    call: {
      maxDuration: parseInt(process.env.MAX_CALL_DURATION || '1800', 10),
      timeout: parseInt(process.env.CALL_TIMEOUT || '30', 10),
      enableRecording: process.env.ENABLE_CALL_RECORDING !== 'false',
      enableTranscription: process.env.ENABLE_TRANSCRIPTION !== 'false',
    },
  };

  try {
    return ConfigSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation failed:');
      console.error(JSON.stringify(error.errors, null, 2));
      throw new Error('Invalid configuration');
    }
    throw error;
  }
}

/**
 * Global configuration instance
 */
export const config = loadConfig();

/**
 * Type for configuration
 */
export type Config = z.infer<typeof ConfigSchema>;
