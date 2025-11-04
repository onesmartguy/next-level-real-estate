import { z } from 'zod';

/**
 * Sentiment analysis results
 */
export const SentimentSchema = z.object({
  overall: z.enum(['very_positive', 'positive', 'neutral', 'negative', 'very_negative']),
  confidence: z.number().min(0).max(1),
  emotions: z.record(z.number()).optional(),
  keywords: z.array(z.string()).optional(),
});

/**
 * Intent detection from conversation
 */
export const IntentSchema = z.object({
  primary: z.string(),
  secondary: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1),
  entities: z.record(z.any()).optional(),
});

/**
 * Call transcript with timestamps
 */
export const TranscriptSegmentSchema = z.object({
  speaker: z.enum(['agent', 'customer', 'system']),
  text: z.string(),
  timestamp: z.number(),
  confidence: z.number().min(0).max(1).optional(),
  sentiment: SentimentSchema.optional(),
});

export const TranscriptSchema = z.object({
  segments: z.array(TranscriptSegmentSchema),
  fullText: z.string(),
  language: z.string().default('en'),
  duration: z.number(),
});

/**
 * Call quality metrics
 */
export const CallQualitySchema = z.object({
  audioQuality: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  latency: z.number().optional(),
  interruptions: z.number().default(0),
  silencePercentage: z.number().optional(),
  talkTimeRatio: z.number().optional(),
});

/**
 * Call outcome and next steps
 */
export const CallOutcomeSchema = z.object({
  result: z.enum([
    'qualified',
    'not_interested',
    'callback_requested',
    'voicemail',
    'wrong_number',
    'no_answer',
    'appointment_set',
    'information_provided',
    'objection',
    'other'
  ]),
  appointmentScheduled: z.boolean().default(false),
  appointmentDate: z.date().optional(),
  callbackRequested: z.boolean().default(false),
  callbackDate: z.date().optional(),
  nextSteps: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

/**
 * ElevenLabs conversation details
 */
export const ElevenLabsDetailsSchema = z.object({
  conversationId: z.string(),
  agentId: z.string(),
  voiceId: z.string().optional(),
  model: z.string().default('flash-2.5'),
  language: z.string().optional(),
  turnsTaken: z.number().optional(),
  averageLatency: z.number().optional(),
});

/**
 * Twilio call details
 */
export const TwilioDetailsSchema = z.object({
  callSid: z.string(),
  accountSid: z.string(),
  fromNumber: z.string(),
  toNumber: z.string(),
  status: z.enum([
    'queued',
    'ringing',
    'in-progress',
    'completed',
    'busy',
    'failed',
    'no-answer',
    'canceled'
  ]),
  direction: z.enum(['inbound', 'outbound']),
  price: z.number().optional(),
  priceUnit: z.string().optional(),
});

/**
 * Main Call model
 * Records all call interactions with AI and customer
 */
export const CallSchema = z.object({
  // Primary identifiers
  callId: z.string(),
  leadId: z.string(),
  contactPhone: z.string(),

  // Call details
  direction: z.enum(['inbound', 'outbound']),
  callType: z.enum(['manual', 'automated', 'agent']),

  // Timing
  initiatedAt: z.date(),
  answeredAt: z.date().optional(),
  endedAt: z.date().optional(),
  duration: z.number().optional(),

  // Service integration
  elevenlabs: ElevenLabsDetailsSchema.optional(),
  twilio: TwilioDetailsSchema.optional(),

  // Conversation content
  transcript: TranscriptSchema.optional(),
  recording: z.string().optional(),

  // Analysis
  sentiment: SentimentSchema.optional(),
  intent: IntentSchema.optional(),
  quality: CallQualitySchema.optional(),

  // Outcome
  outcome: CallOutcomeSchema.optional(),

  // Context used during call
  context: z.record(z.any()).optional(),

  // Agent/operator
  handledBy: z.enum(['ai', 'human', 'hybrid']),
  agentId: z.string().optional(),
  operatorId: z.string().optional(),

  // Compliance
  consentVerified: z.boolean().default(false),
  recordingConsent: z.boolean().default(false),

  // Metadata
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),

  // Errors and issues
  errors: z.array(z.string()).optional(),

  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Sentiment = z.infer<typeof SentimentSchema>;
export type Intent = z.infer<typeof IntentSchema>;
export type TranscriptSegment = z.infer<typeof TranscriptSegmentSchema>;
export type Transcript = z.infer<typeof TranscriptSchema>;
export type CallQuality = z.infer<typeof CallQualitySchema>;
export type CallOutcome = z.infer<typeof CallOutcomeSchema>;
export type ElevenLabsDetails = z.infer<typeof ElevenLabsDetailsSchema>;
export type TwilioDetails = z.infer<typeof TwilioDetailsSchema>;
export type Call = z.infer<typeof CallSchema>;

/**
 * MongoDB collection name
 */
export const CALL_COLLECTION = 'calls';

/**
 * MongoDB indexes
 */
export const CALL_INDEXES = [
  { key: { callId: 1 }, unique: true },
  { key: { leadId: 1, initiatedAt: -1 } },
  { key: { contactPhone: 1, initiatedAt: -1 } },
  { key: { 'twilio.callSid': 1 }, sparse: true },
  { key: { 'elevenlabs.conversationId': 1 }, sparse: true },
  { key: { initiatedAt: -1 } },
  { key: { 'outcome.result': 1, initiatedAt: -1 } },
  { key: { handledBy: 1, initiatedAt: -1 } },
];
