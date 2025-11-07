/**
 * Type definitions for Twilio MCP Server
 */

export interface TwilioClientConfig {
  accountSid: string
  authToken: string
  phoneNumber: string
  timeout?: number
}

export interface ElevenLabsConfig {
  apiKey: string
  webhookBaseUrl: string
}

export interface CallConfig {
  to: string // Phone number to call
  agentId: string // ElevenLabs agent ID
  context?: {
    leadData?: Record<string, any>
    propertyInfo?: Record<string, any>
    strategyRules?: Record<string, any>
  }
  maxDuration?: number // Max call duration in seconds
  recordCall?: boolean // Whether to record the call
  statusCallbackUrl?: string // Webhook for call status updates
}

export interface CallResult {
  callSid: string
  conversationId: string
  status: string
  to: string
  from: string
  createdAt: string
}

export interface CallStatus {
  callSid: string
  status: 'queued' | 'initiated' | 'ringing' | 'in-progress' | 'completed' | 'busy' | 'failed' | 'no-answer' | 'canceled'
  direction: 'outbound-api' | 'inbound'
  duration?: number
  startTime?: string
  endTime?: string
  price?: string
  priceUnit?: string
}

export interface ConversationRelayConfig {
  conversationId: string
  agentId: string
  apiKey: string
}

export interface TwilioClient {
  makeCall(config: CallConfig): Promise<CallResult>
  getCallStatus(callSid: string): Promise<CallStatus>
  endCall(callSid: string): Promise<void>
  healthCheck(): Promise<boolean>
}

export interface Clients {
  twilio: TwilioClient
}
