import type { ElevenLabsClient as ElevenLabsSDK } from '@elevenlabs/elevenlabs-js'

/**
 * Client interfaces for MCP server
 */
export interface Clients {
  elevenlabs: ElevenLabsClient
}

/**
 * ElevenLabs client abstraction for testability
 */
export interface ElevenLabsClient {
  healthCheck(): Promise<boolean>

  // Conversational AI methods
  createConversation(config: ConversationConfig): Promise<ConversationResponse>
  getConversation(conversationId: string): Promise<ConversationDetails>
  listConversations(): Promise<ConversationDetails[]>

  // Voice methods
  listVoices(): Promise<Voice[]>
  getVoice(voiceId: string): Promise<Voice>

  // Text-to-Speech methods
  textToSpeech(config: TextToSpeechConfig): Promise<Buffer>
  textToSpeechStream(config: TextToSpeechConfig): Promise<ReadableStream>

  // Agent methods
  createAgent(config: AgentConfig): Promise<AgentResponse>
  getAgent(agentId: string): Promise<AgentDetails>
  listAgents(): Promise<AgentDetails[]>
  updateAgent(agentId: string, config: Partial<AgentConfig>): Promise<AgentResponse>
  deleteAgent(agentId: string): Promise<void>
}

/**
 * Configuration for conversational AI
 */
export interface ConversationConfig {
  agentId: string
  // Dynamic context injected at call start
  context?: {
    leadData?: Record<string, any>
    propertyInfo?: Record<string, any>
    strategyRules?: Record<string, any>
  }
  // Call settings
  language?: string
  voiceId?: string
  maxDuration?: number // in seconds
  recordConversation?: boolean
}

/**
 * Response from creating a conversation
 */
export interface ConversationResponse {
  conversationId: string
  agentId: string
  status: 'initiated' | 'active' | 'completed' | 'failed'
  startedAt: string
}

/**
 * Detailed conversation information
 */
export interface ConversationDetails extends ConversationResponse {
  endedAt?: string
  duration?: number
  transcript?: ConversationTranscript[]
  sentiment?: SentimentAnalysis
  recordingUrl?: string
  metadata?: Record<string, any>
}

/**
 * Conversation transcript entry
 */
export interface ConversationTranscript {
  role: 'agent' | 'user'
  text: string
  timestamp: string
  confidence?: number
}

/**
 * Sentiment analysis result
 */
export interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative'
  score: number // -1 to 1
  motivation?: string
  intent?: string[]
}

/**
 * Voice information
 */
export interface Voice {
  voiceId: string
  name: string
  category?: string
  description?: string
  labels?: Record<string, string>
  previewUrl?: string
  availableForTts?: boolean
  settings?: VoiceSettings
}

/**
 * Voice settings
 */
export interface VoiceSettings {
  stability?: number
  similarityBoost?: number
  style?: number
  useSpeakerBoost?: boolean
}

/**
 * Text-to-speech configuration
 */
export interface TextToSpeechConfig {
  text: string
  voiceId: string
  modelId?: string
  voiceSettings?: VoiceSettings
  outputFormat?: 'mp3_44100_128' | 'mp3_44100_192' | 'pcm_16000' | 'pcm_22050' | 'pcm_24000'
}

/**
 * Agent configuration for conversational AI
 */
export interface AgentConfig {
  name: string
  voiceId: string
  modelId?: string // Flash 2.5, Turbo 2.5, or custom

  // Conversation settings
  greeting?: string
  firstMessage?: string
  systemPrompt?: string
  conversationGoal?: string

  // Turn-taking configuration
  interruptionSensitivity?: 'low' | 'medium' | 'high'
  responseLatency?: number // target latency in ms

  // Language settings
  language?: string
  supportedLanguages?: string[]
  autoDetectLanguage?: boolean

  // Knowledge base
  knowledgeBase?: string[]
  contextDocuments?: string[]

  // Compliance
  tcpaCompliance?: boolean
  recordingConsent?: boolean

  // Metadata
  tags?: string[]
  description?: string
}

/**
 * Agent response
 */
export interface AgentResponse {
  agentId: string
  name: string
  status: 'active' | 'inactive' | 'training'
  createdAt: string
}

/**
 * Detailed agent information
 */
export interface AgentDetails extends AgentResponse {
  config: AgentConfig
  updatedAt: string
  conversationCount?: number
  averageDuration?: number
  successRate?: number
}

/**
 * Tool result interface
 */
export interface ToolResult {
  content: Array<{
    type: 'text' | 'resource'
    text?: string
    uri?: string
    data?: any
  }>
  isError?: boolean
}

/**
 * MCP server configuration
 */
export interface ServerConfig {
  elevenlabs: {
    apiKey: string
    timeout?: number
  }
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
}
