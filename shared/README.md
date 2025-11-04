# @next-level-re/shared

Shared infrastructure code for the Next Level Real Estate platform. This package provides common models, database clients, messaging infrastructure, and utility functions used across all microservices.

## Installation

```bash
npm install
npm run build
```

## Usage

### Models

All data models with Zod validation schemas:

```typescript
import { Lead, LeadSchema, Property, Call, Campaign, AgentState } from '@next-level-re/shared';

// Validate lead data
const validatedLead = LeadSchema.parse(leadData);

// Use types
const lead: Lead = {
  leadId: '123',
  contact: {
    firstName: 'John',
    lastName: 'Doe',
    phone: '+14155552671',
    email: 'john@example.com',
    preferredContactMethod: 'phone',
  },
  // ... other fields
};
```

### Database Clients

#### MongoDB

```typescript
import { MongoDBClient, initMongoDB } from '@next-level-re/shared';

// Initialize with environment variables
const mongo = initMongoDB();
await mongo.connect();

// Get collection
const leadsCollection = mongo.getCollection('leads');
const leads = await leadsCollection.find({ status: 'new' }).toArray();

// Health check
const isHealthy = await mongo.healthCheck();
```

#### Qdrant (Vector Database)

```typescript
import { QdrantClient, initQdrant } from '@next-level-re/shared';

// Initialize
const qdrant = initQdrant();

// Search for similar vectors
const results = await qdrant.search('architect_knowledge', {
  vector: embeddings,
  limit: 10,
  scoreThreshold: 0.7,
  filter: { category: 'system_design' },
});
```

#### Redis (Caching)

```typescript
import { RedisClient, initRedis } from '@next-level-re/shared';

// Initialize
const redis = initRedis();

// Set cache with TTL
await redis.set('lead:123', leadData, { ttl: 3600 });

// Get cache
const cached = await redis.get<Lead>('lead:123');

// Delete by pattern
await redis.deleteByPattern('lead:*');
```

### Messaging (Kafka)

#### Producer

```typescript
import { createKafkaProducer, LeadEventType } from '@next-level-re/shared';

const producer = createKafkaProducer();
await producer.connect();

// Send message
await producer.send({
  topic: 'leads',
  key: leadId,
  value: {
    eventType: LeadEventType.RECEIVED,
    data: leadData,
  },
});

// Send batch
await producer.sendBatch([message1, message2, message3]);
```

#### Consumer

```typescript
import { createKafkaConsumer } from '@next-level-re/shared';

const consumer = createKafkaConsumer('lead-service');
await consumer.connect();
await consumer.subscribe(['leads', 'calls']);

// Register handlers
consumer.onMessage('leads', async (message) => {
  console.log('Received lead event:', message.value);
  // Process message
});

// Start consuming
await consumer.run();
```

### Utilities

#### Phone Number Utilities

```typescript
import {
  normalizePhoneNumber,
  validatePhoneNumber,
  formatPhoneNumber,
  isMobileNumber
} from '@next-level-re/shared';

// Normalize to E.164 format
const normalized = normalizePhoneNumber('(415) 555-2671'); // +14155552671

// Validate
const result = validatePhoneNumber('415-555-2671');
console.log(result.isValid, result.normalized, result.country);

// Format for display
const formatted = formatPhoneNumber('+14155552671', 'NATIONAL'); // (415) 555-2671

// Check if mobile
const isMobile = isMobileNumber('+14155552671');
```

#### Email Utilities

```typescript
import {
  validateEmail,
  normalizeEmail,
  isDisposableEmail,
  maskEmail
} from '@next-level-re/shared';

// Validate
const result = validateEmail('john@example.com');
console.log(result.isValid, result.normalized);

// Normalize
const normalized = normalizeEmail('John@Example.COM'); // john@example.com

// Check if disposable
const isTemp = isDisposableEmail('test@tempmail.com'); // true

// Mask for privacy
const masked = maskEmail('john@example.com'); // j**n@example.com
```

#### Error Handling

```typescript
import {
  AppError,
  ValidationError,
  NotFoundError,
  ErrorHandler,
  asyncHandler,
  retryWithBackoff
} from '@next-level-re/shared';

// Throw custom errors
throw new NotFoundError('Lead', leadId);
throw new ValidationError('Invalid input', { phone: ['Invalid format'] });

// Async handler wrapper
const handler = asyncHandler(async (req, res) => {
  const lead = await findLead(req.params.id);
  res.json(lead);
});

// Retry with backoff
const result = await retryWithBackoff(
  async () => await fetchExternalData(),
  { maxRetries: 3, initialDelay: 1000 }
);
```

#### Logging with OpenTelemetry

```typescript
import { logger, createChildLogger, initLogger } from '@next-level-re/shared';

// Global logger
logger.info('Application started');
logger.error('Error occurred', { error, leadId });

// Child logger with service name
const leadLogger = createChildLogger('lead-service');
leadLogger.info('Processing lead', { leadId });

// Initialize with custom config
initLogger({
  level: LogLevel.DEBUG,
  serviceName: 'lead-service',
  enableConsole: true,
  enableFile: true,
});
```

#### OpenTelemetry Tracing

```typescript
import { initOpenTelemetry, traced } from '@next-level-re/shared';

// Initialize at app startup
const otel = initOpenTelemetry({
  serviceName: 'lead-service',
  serviceVersion: '1.0.0',
  otlpEndpoint: 'http://localhost:4317',
});

// Decorator for automatic tracing
class LeadService {
  @traced('processLead')
  async processLead(leadId: string) {
    // Automatically traced
  }
}
```

## Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=next_level_real_estate
MONGODB_MAX_POOL_SIZE=50
MONGODB_MIN_POOL_SIZE=10

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-api-key
QDRANT_TIMEOUT=30000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
REDIS_KEY_PREFIX=nlre

# Kafka
KAFKA_CLIENT_ID=next-level-re
KAFKA_BROKERS=localhost:9092

# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# Logging
NODE_ENV=development
LOG_LEVEL=info
```

## Development

```bash
# Install dependencies
npm install

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

## License

UNLICENSED - Private project
