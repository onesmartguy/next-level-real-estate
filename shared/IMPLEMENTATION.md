# Shared Infrastructure Implementation Summary

## Overview

This document provides a comprehensive summary of the shared infrastructure code created for the Next Level Real Estate platform. All code is production-ready TypeScript with proper error handling, type safety, and documentation.

## Directory Structure

```
shared/
├── models/                      # TypeScript interfaces and Zod schemas
│   ├── lead.model.ts           # Lead data model with TCPA compliance
│   ├── property.model.ts       # Property valuation and analysis
│   ├── call.model.ts           # Call tracking and transcripts
│   ├── campaign.model.ts       # Campaign configuration and metrics
│   ├── agent-state.model.ts    # AI agent state management
│   └── index.ts                # Barrel export
├── database/                    # Database client wrappers
│   ├── mongodb.client.ts       # MongoDB with connection pooling
│   ├── qdrant.client.ts        # Vector database for RAG
│   ├── redis.client.ts         # Redis caching layer
│   └── index.ts                # Barrel export
├── messaging/                   # Kafka event infrastructure
│   ├── kafka.producer.ts       # Producer with retry logic
│   ├── kafka.consumer.ts       # Consumer with error handling
│   ├── events.ts               # Event type definitions
│   └── index.ts                # Barrel export
├── utils/                       # Utility functions
│   ├── logger.ts               # Winston + OpenTelemetry logging
│   ├── phone.util.ts           # Phone number normalization
│   ├── email.util.ts           # Email validation
│   ├── error.util.ts           # Error handling utilities
│   ├── observability.util.ts   # OpenTelemetry tracing
│   └── index.ts                # Barrel export
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── .eslintrc.js                # ESLint configuration
├── .prettierrc                 # Prettier formatting
├── README.md                   # Usage documentation
└── index.ts                    # Main barrel export

scripts/
├── mongo-init.js               # MongoDB initialization
├── qdrant-init.ts              # Qdrant vector DB setup
├── package.json                # Script dependencies
└── tsconfig.json               # TypeScript config
```

## Key Features

### 1. Data Models (models/)

All models use **Zod** for runtime validation and type inference:

#### Lead Model (`lead.model.ts`)
- **TCPA Compliance**: Consent tracking, DNC status, one-to-one consent requirements
- **Contact Information**: Name, phone, email with validation
- **Property Information**: Address, type, condition, estimated value
- **Qualification**: Scoring, motivation level, seller situation
- **Call Tracking**: Attempt history, outcomes, next follow-up dates
- **MongoDB Indexes**: 9 indexes for optimal query performance

#### Property Model (`property.model.ts`)
- **Valuation Data**: Estimated value, comps, confidence levels
- **ARV Calculation**: After-repair value for fix-and-flip analysis
- **Investment Analysis**: Max allowable offer, wholesale fee, ROI projections
- **Market Conditions**: Trends, absorption rates, price appreciation
- **Repair Estimates**: Categorized repair items with cost estimates

#### Call Model (`call.model.ts`)
- **Transcript Storage**: Timestamped segments with speaker identification
- **Sentiment Analysis**: Overall sentiment, emotions, confidence scores
- **Intent Detection**: Primary/secondary intents with entity extraction
- **Quality Metrics**: Audio quality, latency, interruptions, talk time ratio
- **Integration Details**: ElevenLabs and Twilio metadata

#### Campaign Model (`campaign.model.ts`)
- **Targeting Rules**: Geographic, property criteria, lead filters
- **Calling Schedule**: Time windows, frequency limits, timezone support
- **Conversation Templates**: Scripts, objection handling, voice configuration
- **Performance Metrics**: Conversion rates, costs, quality scores
- **A/B Testing**: Multiple variants with separate metrics tracking

#### Agent State Model (`agent-state.model.ts`)
- **Task Tracking**: Active tasks, history, progress tracking
- **Decision Records**: Context, reasoning, confidence, outcomes
- **Knowledge Updates**: Category, source, importance, versioning
- **Performance Metrics**: Cache hit rates, API calls, cost savings
- **Health Monitoring**: Heartbeat, error tracking, status

### 2. Database Clients (database/)

#### MongoDB Client (`mongodb.client.ts`)
**Features:**
- Singleton pattern for connection management
- Connection pooling (configurable 10-50 connections)
- Automatic reconnection with retry logic
- Health check endpoint
- Index creation utilities
- Statistics and monitoring

**Usage:**
```typescript
const mongo = initMongoDB();
await mongo.connect();
const leads = mongo.getCollection<Lead>('leads');
```

#### Qdrant Client (`qdrant.client.ts`)
**Features:**
- Vector search with filters and thresholds
- Batch upsert operations
- Payload indexing for metadata filtering
- Collection management (create, delete, info)
- Point CRUD operations
- Health check endpoint

**Usage:**
```typescript
const qdrant = initQdrant();
await qdrant.createCollection('knowledge_base', 1536, 'Cosine');
const results = await qdrant.search('knowledge_base', {
  vector: embeddings,
  limit: 10,
  scoreThreshold: 0.7,
});
```

#### Redis Client (`redis.client.ts`)
**Features:**
- TTL-based caching
- Key prefix support
- Pattern-based deletion
- Increment/decrement counters
- JSON serialization/deserialization
- Connection pooling with retry strategy

**Usage:**
```typescript
const redis = initRedis();
await redis.set('lead:123', leadData, { ttl: 3600 });
const cached = await redis.get<Lead>('lead:123');
```

### 3. Messaging Infrastructure (messaging/)

#### Kafka Producer (`kafka.producer.ts`)
**Features:**
- GZIP compression
- Idempotent writes
- Automatic retries with exponential backoff
- Batch sending for high throughput
- Transaction support
- Health monitoring

**Usage:**
```typescript
const producer = createKafkaProducer();
await producer.connect();
await producer.sendWithRetry({
  topic: 'leads',
  key: leadId,
  value: eventData,
});
```

#### Kafka Consumer (`kafka.consumer.ts`)
**Features:**
- Consumer groups for parallel processing
- Topic and pattern-based subscriptions
- Individual and batch message handlers
- Automatic offset management
- Error handling with DLQ support
- Manual commit control

**Usage:**
```typescript
const consumer = createKafkaConsumer('lead-service');
await consumer.subscribe(['leads']);
consumer.onMessage('leads', async (message) => {
  await processLead(message.value);
});
await consumer.run();
```

#### Event Definitions (`events.ts`)
**Event Types:**
- Lead events: RECEIVED, QUALIFIED, ASSIGNED, UPDATED
- Call events: INITIATED, COMPLETED, ANALYZED
- Campaign events: STARTED, PAUSED, METRICS_UPDATED
- Property events: VALUATION_UPDATED, ANALYSIS_COMPLETED
- Agent events: TASK_COMPLETED, KNOWLEDGE_UPDATED

### 4. Utility Functions (utils/)

#### Logger (`logger.ts`)
**Features:**
- Winston-based logging
- OpenTelemetry trace context injection
- Multiple transports (console, file)
- JSON format for production
- Child loggers with service names
- Configurable log levels

#### Phone Utilities (`phone.util.ts`)
**Functions:**
- `normalizePhoneNumber()`: E.164 format conversion
- `validatePhoneNumber()`: Validation with country detection
- `formatPhoneNumber()`: Display formatting (national/international)
- `isMobileNumber()`: Mobile vs landline detection
- `arePhoneNumbersEqual()`: Comparison with normalization

#### Email Utilities (`email.util.ts`)
**Functions:**
- `validateEmail()`: RFC-compliant validation
- `normalizeEmail()`: Lowercase and trim
- `isDisposableEmail()`: Temporary email detection
- `maskEmail()`: Privacy masking (j***n@example.com)
- `getEmailDomain()`: Domain extraction

#### Error Handling (`error.util.ts`)
**Error Classes:**
- `AppError`: Base application error
- `ValidationError`: Input validation failures
- `NotFoundError`: Resource not found
- `UnauthorizedError`: Authentication failures
- `TCPAComplianceError`: Compliance violations
- `ExternalServiceError`: Third-party API failures

**Utilities:**
- `ErrorHandler`: Centralized error handling
- `asyncHandler`: Async/await error wrapper
- `retryWithBackoff`: Exponential backoff retry logic

#### Observability (`observability.util.ts`)
**Features:**
- OpenTelemetry SDK initialization
- OTLP trace exporter configuration
- Auto-instrumentation for Node.js
- `@traced` decorator for manual spans
- Graceful shutdown handling

### 5. Database Initialization Scripts (scripts/)

#### MongoDB Init (`mongo-init.js`)
**Creates:**
- 5 collections: leads, properties, calls, campaigns, agent_states
- 36 total indexes across all collections
- 4 initial agent state documents (architect, conversation, sales, realty)

**Usage:**
```bash
npm run init:mongo
# or
mongosh mongodb://localhost:27017/next_level_real_estate mongo-init.js
```

#### Qdrant Init (`qdrant-init.ts`)
**Creates:**
- 6 vector collections:
  - `architect_knowledge`: AI research and system patterns
  - `conversation_knowledge`: Conversation strategies and scripts
  - `sales_knowledge`: Market trends and campaigns
  - `realty_knowledge`: Property strategies and regulations
  - `market_intelligence`: Comps and neighborhood data
  - `call_transcripts`: Historical calls for learning
- Payload indexes for filtering (category, source, date, etc.)

**Usage:**
```bash
npm run init:qdrant
# or
ts-node scripts/qdrant-init.ts
```

## TCPA Compliance Implementation

The platform strictly enforces TCPA 2025 regulations:

### 1. Consent Tracking (Lead Model)
```typescript
consent: {
  hasWrittenConsent: boolean;
  consentDate: Date;
  consentMethod: 'written_form' | 'email' | 'phone' | 'website';
  consentSource: string;
  consentText: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
}
```

### 2. DNC Management
```typescript
dncStatus: {
  onNationalRegistry: boolean;
  internalDNC: boolean;
  lastCheckedAt: Date;
  dncReason: string;
}
```

### 3. Call Authorization
- `automatedCallsAllowed` flag prevents unauthorized automated calls
- Call attempts tracked with type (manual/automated/agent)
- Maximum call frequency enforced via campaign configuration

### 4. Compliance Error Handling
`TCPAComplianceError` class for violations:
```typescript
if (!lead.consent.hasWrittenConsent) {
  throw new TCPAComplianceError(
    'Written consent required for automated calling'
  );
}
```

## Performance Optimizations

### 1. MongoDB Indexes
- Compound indexes for common query patterns
- Partial indexes for sparse data (nextFollowUpAt)
- Descending indexes for time-series queries

### 2. Connection Pooling
- MongoDB: 10-50 connections (configurable)
- Redis: Connection reuse with retry strategy
- Kafka: Persistent connections with heartbeat

### 3. Caching Strategy
- Redis TTL-based caching
- Key prefixes for namespace isolation
- Pattern-based invalidation

### 4. Prompt Caching (Agent Models)
- 90% cost reduction target
- Aggressive/moderate/conservative strategies
- Cache hit/miss tracking in performance metrics

### 5. OpenTelemetry Instrumentation
- Distributed tracing across services
- Automatic span creation
- Context propagation
- Performance bottleneck identification

## Environment Configuration

All clients support environment variables:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=next_level_real_estate
MONGODB_MAX_POOL_SIZE=50

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=optional

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_KEY_PREFIX=nlre

# Kafka
KAFKA_CLIENT_ID=next-level-re
KAFKA_BROKERS=localhost:9092

# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# Logging
NODE_ENV=production
LOG_LEVEL=info
```

## Type Safety

All models export both TypeScript types and Zod schemas:

```typescript
// Zod schema for validation
export const LeadSchema = z.object({...});

// TypeScript type for usage
export type Lead = z.infer<typeof LeadSchema>;

// Runtime validation
const validatedLead = LeadSchema.parse(rawData);

// Type checking
const lead: Lead = validatedLead;
```

## Error Handling Patterns

### 1. Database Operations
```typescript
try {
  await mongo.connect();
} catch (error) {
  throw new DatabaseError('Failed to connect', error);
}
```

### 2. External Services
```typescript
try {
  await twilioClient.makeCall();
} catch (error) {
  throw new ExternalServiceError('Twilio', 'Call failed', error);
}
```

### 3. Validation
```typescript
const result = LeadSchema.safeParse(data);
if (!result.success) {
  throw new ValidationError('Invalid lead data', result.error.flatten());
}
```

## Testing Considerations

All modules are designed for testability:

1. **Dependency Injection**: All clients accept configuration
2. **Singleton Pattern**: Use `getInstance()` for shared instances
3. **Health Checks**: Every client has a `healthCheck()` method
4. **Error Simulation**: Errors can be triggered for testing

## Next Steps

This shared infrastructure is ready for use by:

1. **API Gateway Service**: HTTP routing and authentication
2. **Lead Service**: Lead ingestion and management
3. **Calling Service**: AI calling with ElevenLabs/Twilio
4. **Agent Service**: Claude AI agents orchestration
5. **Analytics Service**: Real-time metrics and reporting

## Dependencies

Key production dependencies:
- `mongodb@^6.8.0`: MongoDB driver
- `@qdrant/js-client-rest@^1.10.0`: Vector database
- `ioredis@^5.4.1`: Redis client
- `kafkajs@^2.2.4`: Kafka client
- `winston@^3.14.2`: Logging
- `zod@^3.23.8`: Schema validation
- `libphonenumber-js@^1.11.4`: Phone utilities
- `@opentelemetry/*`: Distributed tracing

## Build & Deployment

```bash
# Install dependencies
cd shared && npm install

# Build TypeScript
npm run build

# Run linting
npm run lint

# Format code
npm run format

# Initialize databases
cd ../scripts
npm run init:all
```

## License

UNLICENSED - Private project for Next Level Real Estate platform.
