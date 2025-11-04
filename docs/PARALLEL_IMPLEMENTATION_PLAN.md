# Parallel Implementation Plan

## Overview

This plan accelerates development by implementing **Stage 1 (Foundation)** and **Stage 3 (Agentic Intelligence)** in parallel. This approach allows:

- Infrastructure and AI agents to develop simultaneously
- Early validation of multi-agent architecture
- Faster time-to-market for core features
- Continuous integration testing from day 1

## Parallel Workstreams

### 🔵 Track A: Infrastructure Foundation (Stage 1)
**Team**: Backend engineers, DevOps
**Duration**: Weeks 1-4
**Goal**: Build core platform infrastructure

### 🟢 Track B: AI Agent System (Stage 3)
**Team**: AI engineers, prompt engineers
**Duration**: Weeks 1-4 (parallel to Track A)
**Goal**: Develop four specialized Claude agents

---

## Week 1: Setup & Foundation

### Track A: Infrastructure 🔵

**Days 1-2: Project Scaffolding**
```bash
# Initialize monorepo structure
mkdir -p services/{api-gateway,lead-service,calling-service,analytics-service}
mkdir -p agents/{architect,conversation,sales,realty}
mkdir -p shared/{models,utils,constants}

# Initialize Node.js services
cd services/api-gateway && npm init -y
cd services/lead-service && npm init -y

# Initialize .NET services
cd services/analytics-service && dotnet new webapi

# Install dependencies
npm install express typescript @types/node @types/express
npm install mongoose kafkajs redis ioredis
npm install @opentelemetry/api @opentelemetry/sdk-node
```

**Days 3-4: Docker Compose Setup**
```yaml
# docker-compose.yml
version: '3.9'
services:
  mongodb:
    image: mongo:7.0
    ports: ["27017:27017"]
    volumes:
      - mongodb_data:/data/db
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js

  qdrant:
    image: qdrant/qdrant:v1.7.4
    ports: ["6333:6333"]
    volumes:
      - qdrant_data:/qdrant/storage

  kafka:
    image: confluentinc/cp-kafka:7.5.3
    ports: ["9092:9092"]
    environment:
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181

  redis:
    image: redis:7.2-alpine
    ports: ["6379:6379"]

  api-gateway:
    build: ./services/api-gateway
    ports: ["3000:3000"]
    depends_on: [mongodb, redis, kafka]

  lead-service:
    build: ./services/lead-service
    ports: ["3001:3001"]
    depends_on: [mongodb, kafka]
```

**Days 5-7: API Gateway Implementation**
- Authentication middleware (JWT)
- Rate limiting (Redis-backed)
- Request logging with OpenTelemetry
- Route definitions
- Error handling middleware

### Track B: AI Agents 🟢

**Days 1-2: Claude SDK Setup & Testing**
```typescript
// agents/shared/claude-client.ts
import Anthropic from '@anthropic-ai/sdk';

export class ClaudeClient {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async chat(messages: Message[], options: ChatOptions) {
    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20250924',
      max_tokens: 4096,
      system: options.systemPrompt,
      messages,
      // Enable prompt caching
      cache_control: options.cacheControl,
    });
    return response;
  }
}
```

**Days 3-4: Architecture Agent Foundation**
```typescript
// agents/architect/index.ts
import { ClaudeClient } from '../shared/claude-client';
import { VectorDB } from '../shared/vector-db';

export class ArchitectAgent {
  private claude: ClaudeClient;
  private vectorDB: VectorDB;

  constructor() {
    this.claude = new ClaudeClient();
    this.vectorDB = new VectorDB('architect-knowledge');
  }

  async analyzeSystemPerformance(metrics: SystemMetrics) {
    // Retrieve relevant knowledge from vector DB
    const context = await this.vectorDB.search({
      query: `system optimization patterns for ${metrics.bottleneck}`,
      limit: 5,
    });

    // Generate recommendations with cached system prompt
    const response = await this.claude.chat([
      { role: 'user', content: this.buildAnalysisPrompt(metrics, context) }
    ], {
      systemPrompt: this.getSystemPrompt(), // Cached!
      cacheControl: { type: 'ephemeral' },
    });

    return this.parseRecommendations(response);
  }

  private getSystemPrompt(): string {
    return `You are an expert system architect specializing in...`;
    // This prompt is cached for 5 minutes, reducing costs 90%
  }
}
```

**Days 5-7: Knowledge Base Schema Design**
```typescript
// agents/shared/knowledge-base-schema.ts
export interface KnowledgeDocument {
  id: string;
  collection: 'architect' | 'conversation' | 'sales' | 'realty';
  content: string;
  metadata: {
    source: string;
    category: string;
    tags: string[];
    created: Date;
    updated: Date;
    version: number;
    effectiveness?: number; // 0-1 score from feedback
  };
  vector: number[]; // 1536 dimensions
}

// Qdrant collection setup
async function initializeCollections() {
  await qdrant.createCollection('architect-knowledge', {
    vectors: { size: 1536, distance: 'Cosine' },
  });

  await qdrant.createCollection('conversation-patterns', {
    vectors: { size: 1536, distance: 'Cosine' },
  });

  // ... more collections
}
```

---

## Week 2: Core Services & Agent Logic

### Track A: Infrastructure 🔵

**Days 1-3: Lead Service Implementation**
```typescript
// services/lead-service/src/webhooks/zillow.ts
import { Router } from 'express';
import { LeadProcessor } from '../processors/lead-processor';
import { KafkaProducer } from '../messaging/kafka-producer';

export const zillowRouter = Router();

zillowRouter.post('/webhooks/zillow/leads', async (req, res) => {
  try {
    const zillowPayload = req.body;

    // Normalize to internal format
    const lead = await LeadProcessor.normalize(zillowPayload, 'zillow');

    // Check for duplicates
    const isDuplicate = await LeadProcessor.checkDuplicate(lead);
    if (isDuplicate) {
      return res.json({ received: true, duplicate: true });
    }

    // Emit to Kafka
    await KafkaProducer.send('leads.received', {
      key: lead.externalId,
      value: JSON.stringify({ eventType: 'LeadReceived', lead }),
    });

    res.json({ received: true });
  } catch (error) {
    console.error('Zillow webhook error:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});
```

**Days 4-5: MongoDB Setup**
```typescript
// shared/database/mongodb-client.ts
import mongoose from 'mongoose';
import { LeadSchema } from './schemas/lead-schema';

export class MongoDBClient {
  async connect() {
    await mongoose.connect(process.env.MONGODB_URI!);

    // Create indexes
    await this.createIndexes();
  }

  private async createIndexes() {
    const Lead = mongoose.model('Lead', LeadSchema);

    await Lead.collection.createIndex({ 'contact.email': 1 });
    await Lead.collection.createIndex({ 'contact.phone': 1 });
    await Lead.collection.createIndex(
      { source: 1, externalId: 1 },
      { unique: true }
    );
    // ... more indexes
  }
}
```

**Days 6-7: Kafka Event Bus**
```typescript
// shared/messaging/kafka-producer.ts
import { Kafka } from 'kafkajs';

export class KafkaProducer {
  private static kafka = new Kafka({
    clientId: 'next-level-real-estate',
    brokers: process.env.KAFKA_BROKERS!.split(','),
  });

  private static producer = this.kafka.producer();

  static async send(topic: string, message: any) {
    await this.producer.send({
      topic,
      messages: [message],
    });
  }
}

// Create topics
await kafka.admin().createTopics({
  topics: [
    { topic: 'leads.received' },
    { topic: 'leads.qualified' },
    { topic: 'calls.initiated' },
    { topic: 'calls.completed' },
    { topic: 'knowledge.updated' },
  ],
});
```

### Track B: AI Agents 🟢

**Days 1-3: Conversation AI Agent**
```typescript
// agents/conversation/index.ts
export class ConversationAgent {
  private claude: ClaudeClient;
  private vectorDB: VectorDB;

  async optimizeCallStrategy(transcript: CallTranscript) {
    // Extract patterns from successful calls
    const patterns = await this.extractPatterns(transcript);

    // Compare with existing knowledge
    const similar = await this.vectorDB.search({
      query: patterns.mainObjection,
      collection: 'conversation-patterns',
      limit: 5,
    });

    // Generate improved strategy
    const improvement = await this.claude.chat([
      {
        role: 'user',
        content: `Analyze this call and suggest improvements:

Transcript: ${transcript.fullText}
Sentiment: ${transcript.avgSentiment}
Outcome: ${transcript.outcome}

Similar successful patterns:
${similar.map(s => s.content).join('\n\n')}

What can we learn?`,
      }
    ], {
      systemPrompt: this.getSystemPrompt(),
      cacheControl: { type: 'ephemeral' },
    });

    // Store learning in knowledge base
    if (transcript.outcome === 'qualified') {
      await this.updateKnowledgeBase(patterns, improvement);
    }

    return improvement;
  }

  private async extractPatterns(transcript: CallTranscript) {
    // Use Claude to identify key patterns
    const analysis = await this.claude.chat([
      {
        role: 'user',
        content: `Extract conversation patterns from this transcript:
        ${transcript.fullText}

        Identify:
        1. Main objections raised
        2. Successful responses
        3. Commitment language
        4. Emotional turning points`,
      }
    ], { systemPrompt: 'You are an expert conversation analyst...' });

    return this.parsePatterns(analysis);
  }
}
```

**Days 4-5: Sales & Marketing Agent**
```typescript
// agents/sales/index.ts
export class SalesAgent {
  async analyzeCampaignPerformance(campaignId: string) {
    // Fetch campaign metrics
    const metrics = await this.getCampaignMetrics(campaignId);

    // Retrieve market intelligence
    const marketContext = await this.vectorDB.search({
      query: `market trends for ${metrics.geography} real estate`,
      collection: 'market-intelligence',
      limit: 10,
    });

    // Generate insights with Claude
    const insights = await this.claude.chat([
      {
        role: 'user',
        content: `Analyze campaign performance:

Campaign: ${metrics.name}
Conversion Rate: ${metrics.conversionRate}%
Cost Per Lead: $${metrics.costPerLead}
ROI: ${metrics.roi}x

Market Context:
${marketContext.map(m => m.content).join('\n')}

Provide:
1. Performance assessment
2. Optimization recommendations
3. Market opportunities`,
      }
    ], {
      systemPrompt: this.getSystemPrompt(),
      cacheControl: { type: 'ephemeral' },
    });

    return insights;
  }
}
```

**Days 6-7: Realty Expert Agent**
```typescript
// agents/realty/index.ts
export class RealtyAgent {
  async evaluateProperty(property: Property, lead: Lead) {
    // Retrieve domain knowledge
    const valuation = await this.vectorDB.search({
      query: `wholesale valuation ${property.type} ${property.city}`,
      collection: 'realty-domain',
      limit: 5,
    });

    const compliance = await this.vectorDB.search({
      query: 'TCPA compliance real estate calls',
      collection: 'realty-domain',
      limit: 3,
    });

    // Evaluate with Claude
    const evaluation = await this.claude.chat([
      {
        role: 'user',
        content: `Evaluate wholesale opportunity:

Property: ${property.address}
Type: ${property.type}
Condition: ${property.condition}
Estimated Value: $${property.valuation.zestimate}
ARV: $${property.valuation.afterRepairValue}
Repair Cost: $${property.totalRepairCost}

Lead Intent: ${lead.intent.message}
Motivation: ${lead.intent.motivation.join(', ')}

Domain Knowledge:
${valuation.map(v => v.content).join('\n\n')}

Compliance Requirements:
${compliance.map(c => c.content).join('\n\n')}

Assess:
1. Wholesale potential (score 0-1)
2. Estimated profit margin
3. Key risks
4. Compliance concerns
5. Negotiation strategy`,
      }
    ], {
      systemPrompt: this.getSystemPrompt(),
      cacheControl: { type: 'ephemeral' },
    });

    return this.parseEvaluation(evaluation);
  }
}
```

---

## Week 3: Integration & RAG Pipeline

### Track A: Infrastructure 🔵

**Days 1-3: Service Integration**
- Connect API Gateway to Lead Service
- Implement service-to-service authentication
- Add distributed tracing with OpenTelemetry
- Set up health check endpoints

**Days 4-7: Testing Infrastructure**
```typescript
// tests/integration/lead-ingestion.test.ts
import request from 'supertest';
import { app } from '../src/app';
import { MongoDB } from '../src/database/mongodb';

describe('Lead Ingestion', () => {
  beforeAll(async () => {
    await MongoDB.connect();
  });

  it('should ingest Zillow lead and emit event', async () => {
    const mockLead = {
      lead_id: 'TEST-123',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '555-0100',
      property_address: '123 Test St',
      // ... more fields
    };

    const response = await request(app)
      .post('/webhooks/zillow/leads')
      .send(mockLead);

    expect(response.status).toBe(200);
    expect(response.body.received).toBe(true);

    // Verify lead in database
    const lead = await Lead.findOne({ externalId: 'TEST-123' });
    expect(lead).toBeDefined();
    expect(lead.source).toBe('zillow');
  });
});
```

### Track B: AI Agents 🟢

**Days 1-4: RAG Pipeline Implementation**
```typescript
// agents/shared/rag-pipeline.ts
import OpenAI from 'openai';
import { QdrantClient } from '@qdrant/js-client-rest';

export class RAGPipeline {
  private openai: OpenAI;
  private qdrant: QdrantClient;

  async ingestDocument(doc: Document, collection: string) {
    // Step 1: Chunk document
    const chunks = this.chunkDocument(doc.content, 800);

    // Step 2: Generate embeddings
    const embeddings = await this.generateEmbeddings(chunks);

    // Step 3: Store in Qdrant
    await this.qdrant.upsert(collection, {
      points: chunks.map((chunk, i) => ({
        id: `${doc.id}-chunk-${i}`,
        vector: embeddings[i],
        payload: {
          content: chunk,
          source: doc.source,
          category: doc.category,
          created: doc.created,
        },
      })),
    });
  }

  private chunkDocument(content: string, maxTokens: number): string[] {
    // Split into chunks with 100-token overlap
    const chunks: string[] = [];
    let start = 0;

    while (start < content.length) {
      const end = start + maxTokens * 4; // ~4 chars per token
      const chunk = content.slice(start, end);
      chunks.push(chunk);
      start = end - 400; // 100-token overlap
    }

    return chunks;
  }

  private async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: texts,
      dimensions: 1536,
    });

    return response.data.map(d => d.embedding);
  }

  async search(query: string, collection: string, limit: number = 5) {
    // Generate query embedding
    const queryEmbedding = await this.generateEmbeddings([query]);

    // Hybrid search (keyword + vector)
    const results = await this.qdrant.search(collection, {
      vector: queryEmbedding[0],
      limit,
      with_payload: true,
    });

    return results.map(r => ({
      content: r.payload.content,
      score: r.score,
      metadata: r.payload,
    }));
  }
}
```

**Days 5-7: Agent Communication via Kafka**
```typescript
// agents/shared/agent-coordinator.ts
export class AgentCoordinator {
  private kafka: Kafka;
  private agents: Map<string, Agent>;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'agent-coordinator',
      brokers: process.env.KAFKA_BROKERS!.split(','),
    });

    this.agents = new Map([
      ['architect', new ArchitectAgent()],
      ['conversation', new ConversationAgent()],
      ['sales', new SalesAgent()],
      ['realty', new RealtyAgent()],
    ]);
  }

  async start() {
    const consumer = this.kafka.consumer({ groupId: 'agents' });

    await consumer.subscribe({
      topics: [
        'calls.completed',
        'leads.qualified',
        'knowledge.update.requested',
      ],
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const event = JSON.parse(message.value!.toString());

        switch (topic) {
          case 'calls.completed':
            // Conversation agent analyzes call
            await this.agents.get('conversation')!.analyzeCall(event.call);
            break;

          case 'leads.qualified':
            // Realty agent evaluates property
            await this.agents.get('realty')!.evaluateProperty(event.property);
            break;

          case 'knowledge.update.requested':
            // All agents update their knowledge
            await Promise.all(
              Array.from(this.agents.values()).map(agent =>
                agent.refreshKnowledge()
              )
            );
            break;
        }
      },
    });
  }
}
```

---

## Week 4: Testing, Optimization & Integration

### Track A: Infrastructure 🔵

**Days 1-3: E2E Testing**
```typescript
// tests/e2e/lead-to-call.test.ts
describe('Lead to Call Workflow', () => {
  it('should process lead from webhook to qualification', async () => {
    // Step 1: Simulate Zillow webhook
    const lead = await simulateZillowWebhook();

    // Step 2: Wait for lead ingestion
    await waitForEvent('leads.received', lead.externalId);

    // Step 3: Verify lead in MongoDB
    const storedLead = await Lead.findOne({ externalId: lead.externalId });
    expect(storedLead).toBeDefined();

    // Step 4: Wait for qualification
    await waitForEvent('leads.qualified', lead.externalId);

    // Step 5: Verify qualification score
    const qualifiedLead = await Lead.findById(storedLead._id);
    expect(qualifiedLead.qualification.qualified).toBe(true);
    expect(qualifiedLead.qualification.score).toBeGreaterThan(0.7);
  });
});
```

**Days 4-7: Performance Optimization**
- Database query optimization
- Redis caching layer
- Load testing with k6
- Memory profiling

### Track B: AI Agents 🟢

**Days 1-3: Prompt Caching Optimization**
```typescript
// agents/shared/prompt-cache-manager.ts
export class PromptCacheManager {
  // Tier 1: Static (1-hour TTL)
  private static SYSTEM_PROMPTS = new Map<string, CachedPrompt>();

  // Tier 2: Semi-static (5-minute TTL)
  private static KNOWLEDGE_CONTEXT = new Map<string, CachedPrompt>();

  static getSystemPrompt(agentType: string): CachedPrompt {
    const cached = this.SYSTEM_PROMPTS.get(agentType);

    if (cached && Date.now() - cached.timestamp < 3600000) {
      return cached; // Cache hit - 90% cost savings!
    }

    // Cache miss - fetch and cache
    const prompt = this.loadSystemPrompt(agentType);
    this.SYSTEM_PROMPTS.set(agentType, {
      content: prompt,
      timestamp: Date.now(),
    });

    return this.SYSTEM_PROMPTS.get(agentType)!;
  }

  static async getKnowledgeContext(
    query: string,
    collection: string
  ): Promise<CachedPrompt> {
    const key = `${collection}:${query}`;
    const cached = this.KNOWLEDGE_CONTEXT.get(key);

    if (cached && Date.now() - cached.timestamp < 300000) {
      return cached; // Cache hit - 75% cost savings!
    }

    // Cache miss - search vector DB
    const results = await vectorDB.search(query, collection);
    this.KNOWLEDGE_CONTEXT.set(key, {
      content: results.map(r => r.content).join('\n\n'),
      timestamp: Date.now(),
    });

    return this.KNOWLEDGE_CONTEXT.get(key)!;
  }
}
```

**Days 4-7: Self-Improvement Feedback Loops**
```typescript
// agents/shared/feedback-loop.ts
export class FeedbackLoop {
  async processCallOutcome(call: Call, outcome: CallOutcome) {
    if (outcome.successful) {
      // Extract what worked
      const patterns = await this.extractSuccessPatterns(call);

      // Update knowledge base
      await Promise.all(
        patterns.map(pattern =>
          this.updateKnowledgeBase(pattern, outcome.metrics)
        )
      );

      // Emit knowledge update event
      await kafka.send('knowledge.updated', {
        agentType: 'conversation',
        patterns,
        effectiveness: outcome.metrics.score,
      });
    } else {
      // Analyze what went wrong
      const issues = await this.identifyIssues(call);

      // Log for review
      await this.logForHumanReview(call, issues);
    }
  }

  private async extractSuccessPatterns(call: Call) {
    const agent = new ConversationAgent();

    return await agent.analyzeSuccessFactors({
      transcript: call.transcript,
      sentiment: call.sentiment,
      keyMoments: call.keyMoments,
      outcome: call.outcome,
    });
  }

  private async updateKnowledgeBase(pattern: Pattern, metrics: Metrics) {
    // Embed pattern
    const embedding = await rag.generateEmbedding(pattern.description);

    // Store in Qdrant
    await qdrant.upsert('conversation-patterns', {
      points: [{
        id: pattern.id,
        vector: embedding,
        payload: {
          content: pattern.description,
          category: pattern.category,
          effectiveness: metrics.score,
          useCount: 1,
          created: new Date(),
        },
      }],
    });
  }
}
```

---

## Integration Point: Week 4 End

### Combined System Test

```typescript
// tests/integration/full-system.test.ts
describe('Full System Integration', () => {
  it('should process lead with AI agent evaluation', async () => {
    // 1. Infrastructure: Ingest lead
    const lead = await simulateZillowWebhook({
      property: {
        address: '123 Main St, Seattle, WA',
        price: 350000,
        condition: 'needs_work',
      },
      intent: {
        message: 'Need to sell quickly, relocating',
        urgency: 'high',
      },
    });

    // 2. Infrastructure: Lead stored in MongoDB
    await waitForLeadIngestion(lead.externalId);

    // 3. Agent: Realty agent evaluates property
    const evaluation = await realtyAgent.evaluateProperty(
      lead.propertyId,
      lead
    );

    expect(evaluation.wholesalePotential).toBeGreaterThan(0.7);
    expect(evaluation.estimatedProfit).toBeGreaterThan(50000);

    // 4. Infrastructure: Qualification event emitted
    await waitForEvent('leads.qualified', lead.externalId);

    // 5. Agent: Conversation agent prepares call strategy
    const strategy = await conversationAgent.prepareCallStrategy(lead);

    expect(strategy.openingScript).toContain('relocating');
    expect(strategy.keyPoints).toContain('quick close');

    // 6. Infrastructure: Call would be initiated
    // (Skipped in test, requires Twilio + ElevenLabs)

    // 7. System validation
    const finalLead = await Lead.findOne({ externalId: lead.externalId });
    expect(finalLead.qualification.qualified).toBe(true);
    expect(finalLead.status).toBe('active');
  });
});
```

---

## Success Metrics

### Week 4 Goals

**Infrastructure Track 🔵**
- ✅ Local environment fully operational
- ✅ Lead ingestion from at least one source (Zillow)
- ✅ MongoDB with all schemas and indexes
- ✅ Kafka event bus with 5 topics
- ✅ API Gateway with authentication
- ✅ 80%+ test coverage

**AI Agent Track 🟢**
- ✅ All 4 agents implemented and tested
- ✅ Qdrant with 4 knowledge base collections
- ✅ RAG pipeline with embedding generation
- ✅ Prompt caching reducing costs 80%+
- ✅ Agent-to-agent communication via Kafka
- ✅ Self-improvement feedback loop prototype

### Combined Metrics
- ✅ Lead-to-evaluation E2E flow working
- ✅ Sub-second response times for agent queries
- ✅ Knowledge base with 100+ documents indexed
- ✅ OpenTelemetry tracing across all services
- ✅ Docker Compose environment with all services

---

## Risk Mitigation

### Potential Blockers

1. **Claude API Rate Limits**
   - Mitigation: Implement queue system, use prompt caching aggressively
   - Fallback: Request rate limit increase from Anthropic

2. **Knowledge Base Quality**
   - Mitigation: Start with curated domain expert content
   - Fallback: Manual review and refinement of agent outputs

3. **Service Integration Issues**
   - Mitigation: Contract testing between services
   - Fallback: Mock services for independent development

4. **Vector Search Performance**
   - Mitigation: Optimize Qdrant indexes, use metadata filtering
   - Fallback: Hybrid search with keyword filtering first

---

## Next Steps After Week 4

With both tracks complete, you'll have:

1. **Working infrastructure** ready for additional lead sources
2. **Four AI agents** ready to optimize real conversations
3. **RAG pipeline** ready for continuous knowledge updates
4. **Event-driven architecture** ready to scale
5. **Testing framework** ready for CI/CD

**Week 5+**: Add ElevenLabs + Twilio calling (Stage 2) with agents already prepared to optimize conversations from day 1!

---

## Getting Started

```bash
# Clone and setup
git clone <repo>
cd next-level-real-estate

# Start infrastructure
docker compose up -d

# Start agents (in separate terminals)
cd agents/architect && npm run dev
cd agents/conversation && npm run dev
cd agents/sales && npm run dev
cd agents/realty && npm run dev

# Run tests
npm test

# Verify system health
curl http://localhost:3000/health
```

Let's build this in parallel! 🚀
