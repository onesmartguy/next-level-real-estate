/**
 * Shared types and interfaces for all AI agents
 */

import Anthropic from '@anthropic-ai/sdk';

/**
 * Agent configuration
 */
export interface AgentConfig {
  agentId: string;
  name: string;
  model: string;
  maxTokens: number;
  temperature: number;
  vectorCollection: string;
  kafkaTopics: {
    consume: string[];
    produce: string[];
  };
}

/**
 * Tool definition for Claude
 */
export interface AgentTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Tool execution result
 */
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Agent message structure
 */
export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string | Anthropic.ContentBlock[];
}

/**
 * Prompt cache configuration
 */
export enum CacheTier {
  STATIC = 'static', // System prompts, compliance rules (1 hour TTL)
  SEMI_STATIC = 'semi_static', // Knowledge base content (5 min TTL)
  DYNAMIC = 'dynamic', // No caching
}

export interface CacheConfig {
  tier: CacheTier;
  ttl?: number; // in seconds
}

/**
 * RAG document structure
 */
export interface RagDocument {
  id: string;
  content: string;
  metadata: {
    source: string;
    timestamp: Date;
    category: string;
    agentId: string;
    [key: string]: unknown;
  };
  embedding?: number[];
}

/**
 * RAG chunk structure
 */
export interface RagChunk {
  chunkId: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  totalChunks: number;
  metadata: RagDocument['metadata'];
}

/**
 * RAG query result
 */
export interface RagQueryResult {
  chunks: Array<{
    chunk: RagChunk;
    score: number;
  }>;
  totalResults: number;
}

/**
 * Vector search parameters
 */
export interface VectorSearchParams {
  query: string;
  limit?: number;
  scoreThreshold?: number;
  filter?: Record<string, unknown>;
}

/**
 * Inter-agent message
 */
export interface InterAgentMessage {
  fromAgent: string;
  toAgent: string;
  messageType: string;
  payload: unknown;
  timestamp: Date;
  correlationId?: string;
}

/**
 * Agent event types
 */
export enum AgentEventType {
  KNOWLEDGE_UPDATE = 'knowledge_update',
  DECISION_REQUEST = 'decision_request',
  ANALYSIS_COMPLETE = 'analysis_complete',
  RECOMMENDATION = 'recommendation',
  ALERT = 'alert',
}

/**
 * Agent event
 */
export interface AgentEvent {
  eventId: string;
  eventType: AgentEventType;
  agentId: string;
  timestamp: Date;
  data: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Knowledge update event
 */
export interface KnowledgeUpdateEvent extends AgentEvent {
  eventType: AgentEventType.KNOWLEDGE_UPDATE;
  data: {
    documents: RagDocument[];
    updateReason: string;
    source: string;
  };
}

/**
 * Analysis result
 */
export interface AnalysisResult {
  analysisId: string;
  agentId: string;
  timestamp: Date;
  findings: string;
  recommendations: string[];
  confidence: number;
  metadata?: Record<string, unknown>;
}

/**
 * Agent health status
 */
export interface AgentHealth {
  agentId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  metrics: {
    requestsProcessed: number;
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
  };
}

/**
 * Prompt template
 */
export interface PromptTemplate {
  system: string;
  cacheTier: CacheTier;
  variables?: Record<string, string>;
}

/**
 * Claude response with caching info
 */
export interface ClaudeResponse {
  message: Anthropic.Message;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens?: number;
    cacheReadTokens?: number;
  };
  stopReason: string;
}

/**
 * Embedding request
 */
export interface EmbeddingRequest {
  text: string | string[];
  model?: string;
}

/**
 * Embedding response
 */
export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

/**
 * Agent initialization options
 */
export interface AgentInitOptions {
  config: AgentConfig;
  systemPrompt: PromptTemplate;
  tools: AgentTool[];
  onToolCall: (toolName: string, input: unknown) => Promise<ToolResult>;
  onEvent?: (event: AgentEvent) => void;
}

/**
 * Streaming chunk
 */
export interface StreamingChunk {
  type: 'content_block_delta' | 'content_block_start' | 'content_block_stop' | 'message_delta' | 'message_start' | 'message_stop';
  delta?: {
    type: string;
    text?: string;
  };
  content_block?: {
    type: string;
    text?: string;
  };
  message?: Anthropic.Message;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}
