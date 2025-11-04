# Shared Infrastructure Quick Reference

## File Summary

### Models (5 files)
1. **lead.model.ts** - Lead management with TCPA compliance (394 lines)
2. **property.model.ts** - Property valuation and investment analysis (287 lines)
3. **call.model.ts** - Call tracking with transcripts and sentiment (227 lines)
4. **campaign.model.ts** - Campaign configuration and metrics (241 lines)
5. **agent-state.model.ts** - AI agent state and performance tracking (236 lines)

### Database Clients (3 files)
1. **mongodb.client.ts** - MongoDB with connection pooling (237 lines)
2. **qdrant.client.ts** - Vector database for RAG (315 lines)
3. **redis.client.ts** - Redis caching layer (268 lines)

### Messaging (3 files)
1. **kafka.producer.ts** - Kafka producer with retry logic (215 lines)
2. **kafka.consumer.ts** - Kafka consumer with error handling (281 lines)
3. **events.ts** - Event type definitions (223 lines)

### Utilities (5 files)
1. **logger.ts** - Winston + OpenTelemetry logging (148 lines)
2. **phone.util.ts** - Phone number validation and formatting (149 lines)
3. **email.util.ts** - Email validation and normalization (111 lines)
4. **error.util.ts** - Error handling utilities (269 lines)
5. **observability.util.ts** - OpenTelemetry tracing (105 lines)

### Scripts (2 files)
1. **mongo-init.js** - MongoDB initialization with indexes (265 lines)
2. **qdrant-init.ts** - Qdrant vector database setup (195 lines)

## Total Code Statistics
- **27 TypeScript/JavaScript files**
- **~4,400 lines of production-ready code**
- **36 MongoDB indexes**
- **6 vector database collections**
- **4 AI agent state documents**

## Common Usage Patterns

### Initialize All Clients
```typescript
import {
  initMongoDB,
  initQdrant,
  initRedis,
  initOpenTelemetry,
  initLogger
} from '@next-level-re/shared';

// Logging first
initLogger({ serviceName: 'my-service', level: LogLevel.INFO });

// OpenTelemetry
initOpenTelemetry({
  serviceName: 'my-service',
  otlpEndpoint: 'http://localhost:4317'
});

// Databases
const mongo = initMongoDB();
await mongo.connect();

const qdrant = initQdrant();
const redis = initRedis();

// Messaging
const producer = createKafkaProducer();
await producer.connect();

const consumer = createKafkaConsumer('my-service');
await consumer.connect();
```

### Lead Processing Example
```typescript
import {
  Lead,
  LeadSchema,
  LeadEventType,
  normalizePhoneNumber,
  validateEmail
} from '@next-level-re/shared';

// Validate and normalize lead data
const phoneResult = normalizePhoneNumber(rawLead.phone);
const emailResult = validateEmail(rawLead.email);

const lead: Lead = LeadSchema.parse({
  leadId: generateId(),
  contact: {
    firstName: rawLead.firstName,
    lastName: rawLead.lastName,
    phone: phoneResult,
    email: emailResult.normalized,
    preferredContactMethod: 'phone',
  },
  source: {
    source: 'google_ads',
    receivedAt: new Date(),
  },
  consent: {
    hasWrittenConsent: true,
    consentDate: new Date(),
    consentMethod: 'website',
  },
  dncStatus: {
    onNationalRegistry: false,
    internalDNC: false,
  },
  automatedCallsAllowed: true,
  qualification: {
    qualificationStatus: 'pending',
    motivationLevel: 'unknown',
  },
  callAttempts: [],
  status: 'new',
  stage: 'lead',
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Save to MongoDB
const leadsCollection = mongo.getCollection<Lead>('leads');
await leadsCollection.insertOne(lead);

// Cache in Redis
await redis.set(`lead:${lead.leadId}`, lead, { ttl: 3600 });

// Publish event
await producer.send({
  topic: 'leads',
  key: lead.leadId,
  value: {
    eventType: LeadEventType.RECEIVED,
    eventId: generateId(),
    timestamp: new Date(),
    source: 'lead-service',
    data: lead,
  },
});
```

### Vector Search Example
```typescript
import { QdrantClient } from '@next-level-re/shared';

// Search knowledge base
const results = await qdrant.search('conversation_knowledge', {
  vector: await embedText(query),
  limit: 10,
  scoreThreshold: 0.7,
  filter: {
    category: { $eq: 'objection_handling' },
    success_rate: { $gte: 0.8 },
  },
  withPayload: true,
});

// Process results
for (const result of results) {
  console.log(`Score: ${result.score}`);
  console.log(`Content: ${result.payload.content}`);
}
```

### Error Handling Example
```typescript
import {
  NotFoundError,
  ValidationError,
  TCPAComplianceError,
  asyncHandler,
  retryWithBackoff
} from '@next-level-re/shared';

// Async handler for Express routes
app.get('/leads/:id', asyncHandler(async (req, res) => {
  const lead = await findLead(req.params.id);

  if (!lead) {
    throw new NotFoundError('Lead', req.params.id);
  }

  if (!lead.consent.hasWrittenConsent) {
    throw new TCPAComplianceError(
      'Cannot call lead without written consent'
    );
  }

  res.json(lead);
}));

// Retry with backoff
const data = await retryWithBackoff(
  async () => await externalAPI.getData(),
  {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    onRetry: (attempt, error) => {
      logger.warn(`Retry attempt ${attempt}`, { error });
    },
  }
);
```

### Kafka Event Processing
```typescript
import {
  createKafkaConsumer,
  LeadEventType,
  isLeadEvent
} from '@next-level-re/shared';

const consumer = createKafkaConsumer('lead-processor');

await consumer.subscribe(['leads', 'calls', 'properties']);

consumer.onMessage('leads', async (message) => {
  const event = message.value;

  if (!isLeadEvent(event)) {
    logger.warn('Unknown event type', { eventType: event.eventType });
    return;
  }

  switch (event.eventType) {
    case LeadEventType.RECEIVED:
      await processNewLead(event.data);
      break;

    case LeadEventType.QUALIFIED:
      await assignToAgent(event.data.leadId);
      break;

    case LeadEventType.UPDATED:
      await invalidateCache(event.data.leadId);
      break;
  }
});

await consumer.run();
```

## Environment Setup

### Local Development (.env)
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=next_level_real_estate
MONGODB_MAX_POOL_SIZE=50
MONGODB_MIN_POOL_SIZE=10

# Qdrant
QDRANT_URL=http://localhost:6333

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_KEY_PREFIX=nlre

# Kafka
KAFKA_CLIENT_ID=next-level-re
KAFKA_BROKERS=localhost:9092

# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# Logging
NODE_ENV=development
LOG_LEVEL=debug
```

### Docker Compose (docker-compose.yml)
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: next_level_real_estate
    volumes:
      - mongodb_data:/data/db
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/init.js

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  kafka:
    image: bitnami/kafka:latest
    ports:
      - "9092:9092"
    environment:
      KAFKA_CFG_NODE_ID: 0
      KAFKA_CFG_PROCESS_ROLES: controller,broker
      KAFKA_CFG_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093
      KAFKA_CFG_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_CFG_CONTROLLER_QUORUM_VOTERS: 0@kafka:9093
      KAFKA_CFG_CONTROLLER_LISTENER_NAMES: CONTROLLER
    volumes:
      - kafka_data:/bitnami/kafka

  otel-collector:
    image: otel/opentelemetry-collector:latest
    ports:
      - "4317:4317"  # OTLP gRPC
      - "4318:4318"  # OTLP HTTP
    volumes:
      - ./otel-config.yaml:/etc/otel/config.yaml
    command: --config=/etc/otel/config.yaml

volumes:
  mongodb_data:
  qdrant_data:
  redis_data:
  kafka_data:
```

## Installation & Build

```bash
# Install shared package
cd shared
npm install
npm run build

# Install script dependencies
cd ../scripts
npm install

# Initialize databases
npm run init:mongo
npm run init:qdrant
```

## Common Commands

```bash
# Shared package
cd shared
npm run build          # Build TypeScript
npm run dev            # Watch mode
npm run lint           # Run ESLint
npm run format         # Format with Prettier
npm test               # Run tests

# Database initialization
cd scripts
npm run init:mongo     # Initialize MongoDB
npm run init:qdrant    # Initialize Qdrant
npm run init:all       # Initialize all databases
```

## Health Check Endpoints

All clients provide health check methods:

```typescript
// MongoDB
const isHealthy = await mongo.healthCheck();

// Qdrant
const isHealthy = await qdrant.healthCheck();

// Redis
const isHealthy = await redis.healthCheck();

// Kafka Producer
const isHealthy = await producer.healthCheck();

// Kafka Consumer
const isHealthy = await consumer.healthCheck();
```

## Monitoring & Observability

### Automatic Instrumentation
OpenTelemetry auto-instruments:
- HTTP/HTTPS requests
- MongoDB operations
- Redis commands
- Kafka produce/consume
- DNS lookups

### Manual Tracing
```typescript
import { traced, createTracer } from '@next-level-re/shared';

// Decorator
class LeadService {
  @traced('processLead')
  async processLead(leadId: string) {
    // Automatically traced
  }
}

// Manual span
const tracer = createTracer('lead-service');
const span = tracer.startSpan('custom-operation');
try {
  // ... operation
  span.setStatus({ code: 1 }); // OK
} catch (error) {
  span.setStatus({ code: 2, message: error.message }); // ERROR
  span.recordException(error);
  throw error;
} finally {
  span.end();
}
```

## Key Design Decisions

1. **Zod for Validation**: Runtime type safety and validation
2. **Singleton Pattern**: Single instances for database clients
3. **Event-Driven**: Kafka for all inter-service communication
4. **TCPA First**: Compliance built into data models
5. **OpenTelemetry**: Distributed tracing from day 1
6. **TypeScript Strict**: Full type safety throughout
7. **Connection Pooling**: Efficient database connections
8. **Retry Logic**: Exponential backoff for reliability
9. **Structured Logging**: JSON logs with trace context
10. **Index Optimization**: 36 MongoDB indexes for performance

## Next Development Steps

1. **API Gateway Service**: Build Express.js gateway
2. **Lead Service**: Implement lead ingestion and management
3. **Calling Service**: Integrate ElevenLabs and Twilio
4. **Agent Service**: Build Claude agent orchestration
5. **Analytics Service**: Real-time metrics and dashboards

---

**Created**: 2025-10-24
**Version**: 1.0.0
**Status**: Production-ready shared infrastructure
