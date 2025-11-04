import { z } from 'zod';

/**
 * Agent task tracking
 */
export const AgentTaskSchema = z.object({
  taskId: z.string(),
  type: z.enum([
    'research',
    'analysis',
    'optimization',
    'decision',
    'documentation',
    'monitoring',
    'improvement'
  ]),
  description: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  progress: z.number().min(0).max(100).default(0),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  result: z.any().optional(),
  error: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Agent decision record
 */
export const AgentDecisionSchema = z.object({
  decisionId: z.string(),
  context: z.string(),
  options: z.array(z.string()),
  selectedOption: z.string(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
  outcome: z.string().optional(),
  feedback: z.string().optional(),
  timestamp: z.date(),
});

/**
 * Knowledge base update
 */
export const KnowledgeUpdateSchema = z.object({
  updateId: z.string(),
  category: z.string(),
  source: z.enum(['research', 'feedback', 'analysis', 'manual', 'external']),
  content: z.string(),
  vector: z.array(z.number()).optional(),
  metadata: z.record(z.any()).optional(),
  importance: z.number().min(0).max(1),
  version: z.number().default(1),
  createdAt: z.date(),
  expiresAt: z.date().optional(),
});

/**
 * Agent memory/context
 */
export const AgentMemorySchema = z.object({
  shortTerm: z.record(z.any()).optional(),
  longTerm: z.array(z.string()).optional(),
  recentDecisions: z.array(z.string()).optional(),
  cachedPrompts: z.record(z.string()).optional(),
  sessionState: z.record(z.any()).optional(),
});

/**
 * Agent performance metrics
 */
export const AgentPerformanceSchema = z.object({
  tasksCompleted: z.number().default(0),
  tasksSuccessful: z.number().default(0),
  tasksFailed: z.number().default(0),
  averageTaskDuration: z.number().optional(),

  decisionsCount: z.number().default(0),
  decisionAccuracy: z.number().optional(),
  averageConfidence: z.number().optional(),

  knowledgeUpdates: z.number().default(0),
  promptCacheHits: z.number().default(0),
  promptCacheMisses: z.number().default(0),

  apiCalls: z.number().default(0),
  apiErrors: z.number().default(0),
  totalCost: z.number().default(0),
  costSavingsFromCache: z.number().default(0),

  lastUpdated: z.date(),
});

/**
 * Agent configuration
 */
export const AgentConfigSchema = z.object({
  model: z.string().default('claude-sonnet-4-5-20250929'),
  temperature: z.number().min(0).max(1).default(0.7),
  maxTokens: z.number().default(4096),
  enablePromptCaching: z.boolean().default(true),
  cacheStrategy: z.enum(['aggressive', 'moderate', 'conservative']).default('aggressive'),
  tools: z.array(z.string()).optional(),
  customInstructions: z.string().optional(),
  systemPrompt: z.string().optional(),
});

/**
 * Main AgentState model
 * Tracks state and performance of each AI agent
 */
export const AgentStateSchema = z.object({
  // Primary identifiers
  agentId: z.string(),
  agentType: z.enum(['architect', 'conversation', 'sales', 'realty']),
  name: z.string(),

  // Status
  status: z.enum(['idle', 'active', 'busy', 'error', 'offline']).default('idle'),

  // Configuration
  config: AgentConfigSchema,

  // Current state
  currentTask: z.string().optional(),
  activeTasks: z.array(z.string()).default([]),

  // Memory and context
  memory: AgentMemorySchema,

  // Task history (recent only, use separate collection for full history)
  recentTasks: z.array(AgentTaskSchema).default([]),

  // Decision history (recent only)
  recentDecisions: z.array(AgentDecisionSchema).default([]),

  // Knowledge updates (recent only)
  recentKnowledgeUpdates: z.array(KnowledgeUpdateSchema).default([]),

  // Performance metrics
  performance: AgentPerformanceSchema,

  // Health monitoring
  lastHeartbeat: z.date(),
  lastError: z.string().optional(),
  lastErrorAt: z.date().optional(),
  consecutiveErrors: z.number().default(0),

  // Metadata
  version: z.string(),
  deployedAt: z.date().optional(),

  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AgentTask = z.infer<typeof AgentTaskSchema>;
export type AgentDecision = z.infer<typeof AgentDecisionSchema>;
export type KnowledgeUpdate = z.infer<typeof KnowledgeUpdateSchema>;
export type AgentMemory = z.infer<typeof AgentMemorySchema>;
export type AgentPerformance = z.infer<typeof AgentPerformanceSchema>;
export type AgentConfig = z.infer<typeof AgentConfigSchema>;
export type AgentState = z.infer<typeof AgentStateSchema>;

/**
 * MongoDB collection name
 */
export const AGENT_STATE_COLLECTION = 'agent_states';

/**
 * MongoDB indexes
 */
export const AGENT_STATE_INDEXES = [
  { key: { agentId: 1 }, unique: true },
  { key: { agentType: 1 } },
  { key: { status: 1 } },
  { key: { lastHeartbeat: 1 } },
  { key: { 'performance.lastUpdated': -1 } },
];
