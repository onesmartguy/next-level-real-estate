# Next Level Real Estate - AI Agent System

Complete implementation of four specialized Claude AI agents with RAG knowledge bases, prompt caching, and inter-agent communication.

## Overview

The AI agent system consists of:

1. **Shared Infrastructure** (`/shared`) - Common libraries for all agents
2. **Architecture Agent** (`/architect`) - System design and optimization
3. **Conversation AI Agent** (`/conversation`) - Call transcript analysis and optimization
4. **Sales & Marketing Agent** (`/sales`) - Market research and campaign optimization
5. **Realty Expert Agent** (`/realty`) - Property analysis and compliance

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Ecosystem                          │
└────┬────────────┬────────────┬────────────┬─────────────────┘
     │            │            │            │
┌────▼───┐  ┌────▼───┐  ┌─────▼──┐  ┌─────▼────┐
│Architect│ │Convers.│  │Sales   │  │Realty    │
│Agent    │ │Agent   │  │Agent   │  │Agent     │
└────┬────┘ └────┬───┘  └────┬───┘  └────┬─────┘
     │           │           │           │
     └───────────┴───────────┴───────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
    ┌────▼────┐          ┌────▼────┐
    │ Shared  │          │ Kafka   │
    │ Infra   │          │ Events  │
    └─────────┘          └─────────┘
         │
    ┌────┴────┬─────────┬──────────┐
    │         │         │          │
┌───▼───┐ ┌──▼──┐  ┌───▼───┐  ┌───▼────┐
│Claude │ │RAG  │  │Vector │  │Cache   │
│Client │ │Pipe │  │Store  │  │Manager │
└───────┘ └─────┘  └───────┘  └────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
# Install shared infrastructure first
cd agents/shared
npm install
npm run build

# Install each agent
cd ../architect && npm install && npm run build
cd ../conversation && npm install && npm run build
cd ../sales && npm install && npm run build
cd ../realty && npm install && npm run build
```

### 2. Configure Environment

Create `.env` in project root:

```bash
# Claude API
ANTHROPIC_API_KEY=your-key-here

# OpenAI (for embeddings)
OPENAI_API_KEY=your-key-here

# Qdrant Vector Database
QDRANT_URL=http://localhost:6333

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Kafka (for messaging)
KAFKA_BROKERS=localhost:9092

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

### 3. Start Infrastructure

```bash
# Start Docker services (Kafka, Redis, Qdrant, MongoDB)
docker compose up -d
```

### 4. Run Agents

```bash
# Terminal 1 - Architecture Agent
cd agents/architect
npm run dev

# Terminal 2 - Conversation Agent
cd agents/conversation
npm run dev

# Terminal 3 - Sales Agent
cd agents/sales
npm run dev

# Terminal 4 - Realty Agent
cd agents/realty
npm run dev
```

## Agent Capabilities

### Architecture Agent

**Purpose**: System optimization and technical decision-making

**Tools**:
- Query system metrics (latency, throughput, errors)
- Search technical research
- Analyze database performance
- Generate optimization recommendations
- Update architecture knowledge base

**Use Cases**:
- "Analyze API gateway performance and recommend optimizations"
- "Compare Qdrant vs Pinecone for our vector database"
- "Design a caching strategy to reduce costs by 90%"

### Conversation AI Agent

**Purpose**: Optimize AI voice conversations and analyze transcripts

**Tools**:
- Analyze call transcripts for patterns
- Extract successful conversation techniques
- Design conversation flows
- Query call analytics
- Update conversation knowledge base

**Use Cases**:
- "Analyze these 50 successful call transcripts and extract patterns"
- "Design a conversation flow for cold outreach to seller leads"
- "What are the top 5 objections and how should we handle them?"

### Sales & Marketing Agent

**Purpose**: Market research and campaign optimization

**Tools**:
- Analyze market trends by geography
- Query campaign performance metrics
- Research competitor strategies
- Generate campaign optimization recommendations

**Use Cases**:
- "Analyze Austin market trends and recommend targeting strategy"
- "Compare Google Ads vs Zillow performance and optimize budget allocation"
- "Research top 3 competitors and identify our differentiators"

### Realty Expert Agent

**Purpose**: Property analysis and regulatory compliance

**Tools**:
- Analyze property investment potential
- Get comparable sales data
- Calculate ARV (After Repair Value)
- Check TCPA/Fair Housing compliance
- Evaluate wholesale deals

**Use Cases**:
- "Analyze this wholesale deal: $280k purchase, $420k ARV, $45k repairs"
- "Check TCPA compliance for lead #12345"
- "Find comparable sales for 123 Main St, Austin TX"

## Shared Infrastructure

All agents use these common components:

### Claude Client
- Prompt caching for 90% cost reduction
- Streaming responses
- Tool use integration
- OpenTelemetry tracing

### RAG Pipeline
- Document chunking (1000 tokens, 200 overlap)
- OpenAI text-embedding-3-large embeddings
- Qdrant vector storage
- Hybrid search (semantic + keyword)

### Agent Coordinator
- Kafka-based messaging
- Event publishing/subscription
- Inter-agent communication
- Message routing

### Prompt Cache Manager
- Redis-based caching
- Multi-tier TTL strategy
- Cache statistics
- Hit rate optimization

## Inter-Agent Communication

Agents communicate via Kafka topics:

### Message Topics
- `agent-messages-{agentId}`: Direct messages to specific agent
- `agent-events-{eventType}`: System-wide events

### Event Types
- `knowledge_update`: New knowledge added to system
- `decision_request`: Request for decision/recommendation
- `analysis_complete`: Analysis results available
- `recommendation`: Optimization or strategy recommendation
- `alert`: System alert or issue

### Example Communication

```typescript
// Sales Agent requests optimization from Architecture Agent
await coordinator.sendMessage({
  toAgent: 'architect-agent',
  messageType: 'optimization_request',
  payload: {
    service: 'lead-ingestion',
    currentLatency: 850,
    targetLatency: 500,
  },
});

// Architecture Agent responds
await coordinator.sendMessage({
  toAgent: 'sales-agent',
  messageType: 'optimization_response',
  payload: {
    recommendations: [/* ... */],
  },
  correlationId: originalMessageId,
});
```

## Cost Optimization

### Prompt Caching Strategy

All agents implement multi-tier caching:

| Tier | Content | TTL | Hit Rate | Savings |
|------|---------|-----|----------|---------|
| Static | System prompts, compliance rules | 1 hour | >95% | 90% |
| Semi-Static | Knowledge base content | 5 min | 70-80% | 70% |
| Dynamic | Real-time context | None | 0% | 0% |

**Expected Monthly Savings**:
- 4 agents × 10,000 requests/month × $0.003/1K tokens × 500 tokens
- Without caching: $60/month
- With 90% cache hit: $6/month
- **Total savings: $54/month per agent = $216/month**

## Knowledge Base Management

Each agent maintains a specialized knowledge base:

### Architecture Agent KB
- Design patterns (microservices, event-driven, CQRS)
- Performance best practices
- Technology comparisons
- Research papers
- Case studies

### Conversation Agent KB
- Top conversation patterns
- Objection handlers by type
- Qualification techniques
- Sentiment signals
- A/B test results

### Sales Agent KB
- Market trends by geography
- Campaign strategies
- Competitor analysis
- Seasonal patterns
- ROI benchmarks

### Realty Agent KB
- Valuation methodologies
- Investment criteria by strategy
- Compliance rules (TCPA, Fair Housing, RESPA)
- Market intelligence
- Best practices

## Monitoring & Observability

All agents include OpenTelemetry instrumentation:

```typescript
// Automatic tracing
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('my-agent');

tracer.startActiveSpan('operation', async (span) => {
  try {
    // Your code
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR });
    span.recordException(error);
  } finally {
    span.end();
  }
});
```

View traces in SigNoz dashboard at `http://localhost:3301`

## Development

### Build All Agents

```bash
# From agents/ directory
for dir in shared architect conversation sales realty; do
  cd $dir && npm run build && cd ..
done
```

### Test Individual Agent

```bash
cd agents/architect
npm run dev

# In another terminal
curl -X POST http://localhost:3000/query \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Analyze system performance"}'
```

### Add Knowledge to Agent

```typescript
import { RagDocument } from '@next-level-re/agent-shared';

const document: RagDocument = {
  id: 'doc-123',
  content: 'Your knowledge content here...',
  metadata: {
    source: 'research-paper.pdf',
    timestamp: new Date(),
    category: 'design-patterns',
    agentId: 'architect-agent',
  },
};

await agent.addKnowledge(document);
```

## Production Deployment

### Docker Build

Each agent can be containerized:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: architect-agent
spec:
  replicas: 2
  selector:
    matchLabels:
      app: architect-agent
  template:
    metadata:
      labels:
        app: architect-agent
    spec:
      containers:
      - name: architect-agent
        image: next-level-re/architect-agent:latest
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-agent-secrets
              key: anthropic-key
```

## Troubleshooting

### Agent Won't Start

```bash
# Check environment variables
echo $ANTHROPIC_API_KEY
echo $OPENAI_API_KEY

# Verify infrastructure
docker compose ps

# Check logs
docker compose logs kafka
docker compose logs redis
docker compose logs qdrant
```

### Low Cache Hit Rate

```bash
# Check Redis stats
redis-cli info stats

# Monitor cache hits
curl http://localhost:3000/health | jq '.cacheStats'
```

### Kafka Connection Issues

```bash
# Verify Kafka is running
docker compose logs kafka

# List topics
docker exec -it kafka kafka-topics.sh --list --bootstrap-server localhost:9092

# Check consumer lag
docker exec -it kafka kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group architect-agent-group
```

## License

MIT
