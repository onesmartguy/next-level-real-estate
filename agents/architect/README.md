# Architecture Agent

AI agent specialized in system design, performance optimization, and technical research for the Next Level Real Estate platform.

## Overview

The Architecture Agent is responsible for:

- **System Architecture & Design**: Microservices patterns, database schemas, API design
- **Performance Optimization**: Identifying bottlenecks, caching strategies, query optimization
- **Technology Research**: Staying current with AI/ML innovations and best practices
- **Technical Decision Making**: Evaluating trade-offs and making data-driven recommendations

## Features

- **RAG-Powered Knowledge Base**: Semantic search across technical documentation and research
- **Prompt Caching**: 90% cost reduction through multi-tier caching
- **Tool Integration**: Query system metrics, analyze databases, research technologies
- **Inter-Agent Communication**: Kafka-based messaging with other agents
- **Distributed Tracing**: OpenTelemetry integration for observability

## Installation

```bash
cd agents/architect
npm install
npm run build
```

## Configuration

Create a `.env` file:

```bash
# Claude API
ANTHROPIC_API_KEY=your-key-here

# OpenAI (for embeddings)
OPENAI_API_KEY=your-key-here

# Qdrant Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=optional

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Kafka (for messaging)
KAFKA_BROKERS=localhost:9092

# Metrics API
METRICS_API_URL=http://localhost:4317

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

## Usage

### Start the Agent

```bash
npm run dev
```

### Programmatic Usage

```typescript
import { ArchitectAgent } from './agents/architect';
import { RagDocument } from '@next-level-re/agent-shared';

const agent = new ArchitectAgent();
await agent.initialize();

// Analyze system performance
const analysis = await agent.analyzeSystemPerformance('api-gateway');
console.log(analysis);

// Research new technology
const research = await agent.researchTechnology('vector databases');
console.log(research);

// Add knowledge to base
const document: RagDocument = {
  id: 'doc-123',
  content: 'Technical content here...',
  metadata: {
    source: 'research-paper.pdf',
    timestamp: new Date(),
    category: 'research',
    agentId: 'architect-agent',
  },
};

await agent.addKnowledge(document);

// Interactive query
const response = await agent.query(
  'What are the best practices for implementing prompt caching?'
);
console.log(response);
```

## Tools

The Architecture Agent has access to these tools:

### 1. Query System Metrics

```typescript
{
  name: 'query_system_metrics',
  parameters: {
    metric_type: 'latency' | 'throughput' | 'error_rate' | 'resource_usage',
    service_name: string,
    time_range?: '1h' | '6h' | '24h' | '7d' | '30d'
  }
}
```

### 2. Search Technical Research

```typescript
{
  name: 'search_technical_research',
  parameters: {
    query: string,
    category?: 'ai-ml' | 'architecture' | 'performance' | 'database' | 'messaging' | 'observability'
  }
}
```

### 3. Update Knowledge Base

```typescript
{
  name: 'update_knowledge_base',
  parameters: {
    category: 'design-patterns' | 'performance' | 'technology-comparison' | 'research' | 'case-study',
    title: string,
    content: string,
    source: string,
    tags?: string[]
  }
}
```

### 4. Analyze Database Performance

```typescript
{
  name: 'analyze_database_performance',
  parameters: {
    database_name: string,
    analysis_type?: 'slow_queries' | 'index_usage' | 'connections' | 'overall'
  }
}
```

### 5. Recommend Optimization

```typescript
{
  name: 'recommend_optimization',
  parameters: {
    area: 'api_performance' | 'database' | 'caching' | 'messaging' | 'ai_costs' | 'overall',
    current_metrics?: object,
    constraints?: string[]
  }
}
```

## Knowledge Base Categories

The agent maintains knowledge in these categories:

- **design-patterns**: Microservices, event-driven, CQRS, etc.
- **performance**: Caching, indexing, connection pooling
- **technology-comparison**: Framework evaluations, tool assessments
- **research**: Latest AI/ML research papers
- **case-study**: Real-world implementations

## Inter-Agent Communication

The Architecture Agent communicates with other agents via Kafka:

### Consumed Topics

- `agent-messages-architect-agent`: Direct messages to this agent
- `agent-events-knowledge_update`: Knowledge updates from other agents
- `system-metrics`: System performance metrics

### Produced Topics

- `agent-messages-*`: Messages to other agents
- `agent-events-*`: System-wide events

### Message Types

**Incoming:**
- `optimization_request`: Request for optimization recommendations
- `architecture_review`: Request for architecture review

**Outgoing:**
- `optimization_response`: Response to optimization request
- `architecture_review_response`: Response to architecture review

## Example Queries

```typescript
// Performance optimization
await agent.query(
  'The API gateway is showing p95 latency of 800ms. What optimizations can we implement?'
);

// Technology evaluation
await agent.query(
  'Should we use Qdrant or Pinecone for our vector database? Compare based on performance, cost, and features.'
);

// Architecture design
await agent.query(
  'Design a scalable architecture for processing 10,000 leads per hour with <5 minute response time.'
);

// Database optimization
await agent.query(
  'We have slow queries on the leads collection. Analyze and recommend index improvements.'
);
```

## Monitoring & Health

```typescript
const health = agent.getHealth();
// {
//   agentId: 'architect-agent',
//   name: 'Architecture Agent',
//   status: 'healthy',
//   coordinator: { connected: true, agentId: 'architect-agent' },
//   model: 'claude-3-5-sonnet-20241022'
// }
```

## Development

```bash
# Build TypeScript
npm run build

# Watch mode
npm run watch

# Lint
npm run lint

# Format
npm run format
```

## Production Deployment

```bash
# Build optimized version
npm run build

# Start production server
npm start
```

## Cost Optimization

The Architecture Agent uses prompt caching for 90% cost reduction:

- **System prompt**: Cached for 1 hour (static tier)
- **Knowledge base context**: Cached for 5 minutes (semi-static tier)
- **User queries**: Not cached (dynamic)

Expected monthly savings:
- Without caching: ~$300/month (10K requests)
- With 90% cache hit rate: ~$30/month
- **Savings: $270/month per agent**

## Troubleshooting

### Agent won't start

Check environment variables:
```bash
echo $ANTHROPIC_API_KEY
echo $OPENAI_API_KEY
```

### Kafka connection issues

Verify Kafka is running:
```bash
docker compose ps kafka
docker compose logs kafka
```

### Vector database errors

Ensure Qdrant is accessible:
```bash
curl http://localhost:6333/collections
```

### Low cache hit rate

Check Redis connection and TTL settings:
```bash
redis-cli info stats
```

## License

MIT
