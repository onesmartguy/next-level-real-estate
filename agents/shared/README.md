# Agent Shared Infrastructure

Shared TypeScript infrastructure for all Claude AI agents in the Next Level Real Estate platform.

## Overview

This package provides common functionality for all specialized AI agents:

- **Claude Client**: SDK wrapper with prompt caching, streaming, and tool use
- **RAG Pipeline**: Complete retrieval-augmented generation with chunking, embedding, and indexing
- **Vector Store**: Qdrant client wrapper for semantic search
- **Prompt Cache Manager**: Multi-tier Redis caching for cost optimization
- **Agent Coordinator**: Kafka-based inter-agent communication
- **Logger**: Winston logging with structured output

## Installation

```bash
cd agents/shared
npm install
npm run build
```

## Usage

### Claude Client

```typescript
import { ClaudeClient, PromptTemplate, CacheTier } from '@next-level-re/agent-shared';

const client = new ClaudeClient({
  model: 'claude-3-5-sonnet-20241022',
  maxTokens: 4096,
  temperature: 0.7,
});

const systemPrompt: PromptTemplate = {
  system: 'You are an expert real estate AI assistant...',
  cacheTier: CacheTier.STATIC, // Cache for 1 hour
};

const response = await client.sendMessage({
  systemPrompt,
  messages: [
    { role: 'user', content: 'Analyze this property...' }
  ],
  tools: [/* tool definitions */],
});

console.log(ClaudeClient.extractText(response));
```

### RAG Pipeline

```typescript
import { RagPipeline, VectorStore, RagDocument } from '@next-level-re/agent-shared';

// Initialize vector store
const vectorStore = new VectorStore({
  collectionName: 'agent-knowledge-base',
  vectorSize: 1536,
});

// Create RAG pipeline
const ragPipeline = new RagPipeline({
  vectorStore,
  embeddingModel: 'text-embedding-3-large',
  chunkSize: 1000,
  chunkOverlap: 200,
});

// Index documents
const document: RagDocument = {
  id: 'doc-123',
  content: 'Real estate market analysis...',
  metadata: {
    source: 'market-report.pdf',
    timestamp: new Date(),
    category: 'market-analysis',
    agentId: 'sales-agent',
  },
};

await ragPipeline.indexDocument(document);

// Retrieve relevant chunks
const results = await ragPipeline.retrieve({
  query: 'What are the current market trends?',
  limit: 5,
  scoreThreshold: 0.7,
  filter: { 'metadata.category': 'market-analysis' },
});

// Build context for Claude
const context = RagPipeline.buildContext(results);
```

### Agent Coordinator

```typescript
import { AgentCoordinator, AgentEventType } from '@next-level-re/agent-shared';

const coordinator = new AgentCoordinator({
  agentId: 'sales-agent',
  topics: {
    consume: ['agent-messages-sales-agent', 'agent-events-knowledge_update'],
    produce: ['agent-messages-*', 'agent-events-*'],
  },
});

await coordinator.connect();
await coordinator.subscribe(['agent-messages-sales-agent']);

// Register message handler
coordinator.onMessage('decision_request', async (message) => {
  console.log('Received decision request:', message);
  // Process and respond
});

// Send message to another agent
await coordinator.sendMessage({
  toAgent: 'architect-agent',
  messageType: 'optimization_request',
  payload: { metric: 'response_time', threshold: 500 },
});

// Publish event
await coordinator.publishEvent({
  eventType: AgentEventType.KNOWLEDGE_UPDATE,
  data: {
    documents: [/* new documents */],
    updateReason: 'Market data refresh',
    source: 'external-api',
  },
});
```

### Prompt Cache Manager

```typescript
import { PromptCacheManager, CacheTier } from '@next-level-re/agent-shared';

const cacheManager = new PromptCacheManager();

// Cache static content (1 hour TTL)
await cacheManager.set(
  'system-prompt-v1',
  'You are an expert...',
  CacheTier.STATIC
);

// Retrieve from cache
const cached = await cacheManager.get('system-prompt-v1');

// Get cache stats
const stats = await cacheManager.getStats();
console.log(`Cache hit rate: ${stats.hitRate * 100}%`);
```

## Environment Variables

```bash
# Claude API
ANTHROPIC_API_KEY=your-key-here

# OpenAI (for embeddings)
OPENAI_API_KEY=your-key-here

# Qdrant Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=optional-api-key

# Redis (for prompt caching)
REDIS_URL=redis://localhost:6379

# Kafka (for inter-agent communication)
KAFKA_BROKERS=localhost:9092

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

## Cost Optimization

### Prompt Caching Strategy

The system implements multi-tier caching for 90% cost reduction:

1. **Static Cache (1 hour TTL)**
   - System prompts
   - Compliance rules
   - Strategy guides
   - Target hit rate: >95%

2. **Semi-Static Cache (5 min TTL)**
   - Knowledge base content
   - Market intelligence
   - Best practices
   - Target hit rate: 70-80%

3. **Dynamic (No Cache)**
   - Real-time context
   - User-specific data
   - Streaming responses

### Example Savings

Without caching:
- 10,000 requests/day
- 500 tokens/request system prompt
- $0.003/1K tokens
- Cost: $15/day = $450/month

With 90% cache hit rate:
- 9,000 cached reads (90% discount)
- 1,000 new writes
- Cost: $1.50/day = $45/month
- **Savings: $405/month (90%)**

## OpenTelemetry Integration

All components include distributed tracing:

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('my-agent');

tracer.startActiveSpan('myOperation', async (span) => {
  try {
    // Your code here
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
});
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Lint
npm run lint

# Format
npm run format

# Test
npm test
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Agent Application                     │
│  (Architect, Conversation, Sales, Realty)               │
└──────────────┬──────────────────────────────────────────┘
               │
    ┌──────────┴──────────┬──────────────┬────────────┐
    │                     │              │            │
┌───▼────────┐   ┌────────▼──┐   ┌──────▼────┐   ┌──▼────┐
│ Claude     │   │ RAG       │   │ Agent     │   │ Cache │
│ Client     │   │ Pipeline  │   │ Coord.    │   │ Mgr   │
└─────┬──────┘   └──────┬────┘   └─────┬─────┘   └───┬───┘
      │                │              │             │
┌─────▼──────┐   ┌────▼─────┐   ┌────▼────┐   ┌────▼───┐
│ Anthropic  │   │ Qdrant   │   │ Kafka   │   │ Redis  │
│ API        │   │ Vector   │   │ Message │   │ Cache  │
│            │   │ DB       │   │ Bus     │   │        │
└────────────┘   └──────────┘   └─────────┘   └────────┘
```

## TypeScript Types

All types are exported from `src/types.ts`:

- `AgentConfig` - Agent configuration
- `AgentTool` - Claude tool definition
- `PromptTemplate` - System prompt with caching
- `RagDocument` - Document for indexing
- `RagChunk` - Document chunk with metadata
- `InterAgentMessage` - Message between agents
- `AgentEvent` - System-wide event
- `ClaudeResponse` - Response with usage stats

## License

MIT
