# Testing Framework - Next Level Real Estate

Comprehensive testing suite for the Next Level Real Estate AI-powered platform.

## Table of Contents

- [Quick Start](#quick-start)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Mock Services](#mock-services)
- [Test Data Generators](#test-data-generators)
- [Continuous Integration](#continuous-integration)
- [Best Practices](#best-practices)

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests in watch mode
npm test -- --watch

# Run single test file
npm test -- tests/e2e/lead-to-call-workflow.test.ts
```

## Test Structure

```
tests/
├── e2e/                          # End-to-end tests
│   ├── lead-to-call-workflow.test.ts
│   ├── tcpa-compliance.test.ts
│   ├── agent-collaboration.test.ts
│   └── error-scenarios.test.ts
│
├── integration/                  # Integration tests
│   ├── lead-service.test.ts
│   ├── calling-service.test.ts
│   ├── agent-communication.test.ts
│   └── database-operations.test.ts
│
├── unit/                         # Unit tests (in service dirs)
│   └── (unit tests live alongside source code)
│
├── performance/                  # Performance tests
│   ├── load-test.ts
│   ├── stress-test.ts
│   └── benchmark.ts
│
├── mocks/                        # Mock implementations
│   ├── twilio-mock.ts
│   ├── elevenlabs-mock.ts
│   ├── claude-mock.ts
│   ├── kafka-mock.ts
│   └── test-data.ts
│
├── utils/                        # Test utilities
│   ├── test-helpers.ts
│   ├── assertions.ts
│   ├── cleanup.ts
│   └── mock-generators.ts
│
├── setup.ts                      # Jest setup
├── global-setup.ts               # Global test setup
├── global-teardown.ts            # Global test teardown
└── README.md                     # This file
```

## Running Tests

### All Tests

```bash
npm test
```

### By Test Type

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# End-to-end tests only
npm run test:e2e
```

### With Coverage

```bash
npm test -- --coverage

# Coverage thresholds:
# - Branches: 70%
# - Functions: 75%
# - Lines: 80%
# - Statements: 80%
```

### Watch Mode

```bash
npm test -- --watch

# Run specific test file in watch mode
npm test -- --watch tests/e2e/lead-to-call-workflow.test.ts
```

### Single Test

```bash
# By file
npm test -- tests/integration/lead-service.test.ts

# By pattern
npm test -- --testNamePattern="should ingest Google Ads lead"

# By describe block
npm test -- --testNamePattern="TCPA Compliance"
```

### Debug Mode

```bash
# Enable verbose logging
VERBOSE_TESTS=true npm test

# Use Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Writing Tests

### Test Structure

```typescript
import { generateLead } from '../mocks/test-data';
import { assertValidLead } from '../utils/assertions';
import { createCleanupCoordinator } from '../utils/cleanup';

describe('Feature Name', () => {
  const cleanup = createCleanupCoordinator();

  beforeAll(() => {
    // Setup that runs once before all tests
  });

  beforeEach(() => {
    // Setup that runs before each test
  });

  afterEach(async () => {
    // Cleanup after each test
    await cleanup.cleanupAll();
  });

  afterAll(() => {
    // Cleanup that runs once after all tests
  });

  describe('Specific Functionality', () => {
    it('should do something specific', async () => {
      // Arrange
      const lead = generateLead();

      // Act
      const result = await someFunction(lead);

      // Assert
      assertValidLead(result);
      expect(result.status).toBe('qualified');
    });
  });
});
```

### Using Mock Services

```typescript
import { twilioMock } from '../mocks/twilio-mock';
import { elevenLabsMock } from '../mocks/elevenlabs-mock';
import { claudeMock } from '../mocks/claude-mock';
import { kafkaMock } from '../mocks/kafka-mock';

describe('Using Mocks', () => {
  beforeEach(() => {
    // Mocks are automatically reset between tests
  });

  it('should create a call', async () => {
    const call = await twilioMock.createCall({
      to: '+15125551234',
      from: '+15555555555',
    });

    expect(call.sid).toBeDefined();
    expect(call.status).toBe('queued');
  });

  it('should publish event', async () => {
    const producer = kafkaMock.producer();
    await producer.connect();

    await producer.send({
      topic: 'leads',
      messages: [{ value: JSON.stringify({ leadId: '123' }) }],
    });

    const messages = producer.getMessagesByTopic('leads');
    expect(messages).toHaveLength(1);
  });
});
```

### Generating Test Data

```typescript
import {
  generateLead,
  generateLeads,
  generateQualifiedLead,
  generateCall,
  generateCompletedCall,
  generateCampaign,
  generateGoogleAdsLead,
  generateZillowLead,
} from '../mocks/test-data';

// Single lead with defaults
const lead = generateLead();

// Multiple leads
const leads = generateLeads(10);

// Lead with overrides
const customLead = generateLead({
  source: 'zillow',
  status: 'qualified',
});

// Pre-qualified lead
const qualified = generateQualifiedLead();

// Completed call with transcript
const call = generateCompletedCall();

// Webhook payloads
const googleAdsPayload = generateGoogleAdsLead();
const zillowPayload = generateZillowLead();
```

### Custom Assertions

```typescript
import {
  assertValidLead,
  assertTCPACompliant,
  assertQualifiedLead,
  assertValidCall,
  assertCompletedCall,
  assertValidTranscript,
  assertTimingConstraint,
} from '../utils/assertions';

// Lead assertions
assertValidLead(lead); // Validates structure
assertTCPACompliant(lead); // Validates TCPA compliance
assertQualifiedLead(lead); // Validates qualification

// Call assertions
assertValidCall(call);
assertCompletedCall(call);

// Timing assertions (for 5-minute rule)
assertTimingConstraint(startTime, endTime, 5); // Max 5 minutes
```

### Test Helpers

```typescript
import {
  waitForCondition,
  wait,
  retry,
  measureTime,
  withTimeout,
} from '../utils/test-helpers';

// Wait for condition
await waitForCondition(
  () => call.status === 'completed',
  { timeout: 5000, interval: 100 }
);

// Wait for duration
await wait(1000); // 1 second

// Retry with backoff
const result = await retry(
  async () => await flakeyFunction(),
  { maxAttempts: 3, delay: 1000 }
);

// Measure execution time
const { result, duration } = await measureTime(async () => {
  return await someOperation();
});

// Add timeout to promise
await withTimeout(slowOperation(), 5000, 'Operation timed out');
```

## Mock Services

### Twilio Mock

```typescript
import { twilioMock } from '../mocks/twilio-mock';

// Create call
const call = await twilioMock.createCall({
  to: '+15125551234',
  from: '+15555555555',
});

// Complete call
await twilioMock.completeCall(call.sid, 120); // 120 second duration

// Fail call
await twilioMock.failCall(call.sid, 'no-answer');

// Get call
const fetchedCall = await twilioMock.getCall(call.sid);

// List calls
const calls = await twilioMock.listCalls({ status: 'completed' });

// Reset (automatically done between tests)
twilioMock.reset();
```

### ElevenLabs Mock

```typescript
import { elevenLabsMock } from '../mocks/elevenlabs-mock';

// Create conversation
const conversation = await elevenLabsMock.createConversation({
  agentId: 'test_agent',
  customContext: JSON.stringify({ leadId: '123' }),
  firstMessage: 'Hello!',
});

// Add messages
await elevenLabsMock.addMessage(conversation.conversationId, 'User response', 'user');

// Complete conversation
await elevenLabsMock.completeConversation(conversation.conversationId);

// Get transcript
const transcript = await elevenLabsMock.getTranscript(conversation.conversationId);

// Analyze sentiment
const sentiment = await elevenLabsMock.analyzeSentiment(conversation.conversationId);
```

### Claude Mock

```typescript
import { claudeMock, multiAgentMock } from '../mocks/claude-mock';

// Single message
const response = await claudeMock.createMessage({
  model: 'claude-sonnet-4-5-20250929',
  maxTokens: 4096,
  messages: [{ role: 'user', content: 'Qualify this lead' }],
  system: 'You are a real estate expert',
});

// Multi-agent system
multiAgentMock.registerAgent({
  name: 'realty-expert',
  role: 'Real Estate Expert',
  systemPrompt: 'You are a real estate expert.',
});

const agentResponse = await multiAgentMock.sendToAgent('realty-expert', 'Qualify lead');

// Check token usage
const usage = claudeMock.getTotalUsage();
console.log(`Cost: $${usage.cost.toFixed(4)}`);
```

### Kafka Mock

```typescript
import { kafkaMock, createEventMessage, EventTypes } from '../mocks/kafka-mock';

// Producer
const producer = kafkaMock.producer();
await producer.connect();

await producer.send({
  topic: 'leads',
  messages: [createEventMessage(EventTypes.LEAD_RECEIVED, { leadId: '123' })],
});

// Get messages
const messages = producer.getMessagesByTopic('leads');

// Consumer
const consumer = kafkaMock.consumer({ groupId: 'test-group' });
await consumer.connect();
await consumer.subscribe({ topics: ['leads'] });

await consumer.run({
  eachMessage: async ({ topic, message }) => {
    console.log('Received:', message);
  },
});

// Manually process message (for testing)
await consumer.processMessage('leads', { value: JSON.stringify({ test: true }) });
```

## Test Data Generators

All test data generators support overrides:

```typescript
const customLead = generateLead({
  source: 'google_ads',
  status: 'qualified',
  contact: {
    firstName: 'John',
    email: 'john@example.com',
  },
});
```

Available generators:
- `generateLead()` - Single lead
- `generateLeads(count)` - Multiple leads
- `generateQualifiedLead()` - Pre-qualified lead
- `generateCall()` - Call record
- `generateCompletedCall()` - Completed call with transcript
- `generateCampaign()` - Campaign
- `generateAgentContext()` - Agent context
- `generateMarketIntelligence()` - Market data
- `generateGoogleAdsLead()` - Google Ads webhook payload
- `generateZillowLead()` - Zillow webhook payload
- `generateTwilioStatusCallback()` - Twilio status update

## Continuous Integration

Tests run automatically on:
- Every pull request
- Every push to main branch
- Nightly builds

See `.github/workflows/test.yml` for CI configuration.

### CI Environment

```bash
# CI uses test containers
USE_TEST_CONTAINERS=true

# All external APIs are mocked
MOCK_EXTERNAL_APIS=true

# Tests run in parallel
jest --maxWorkers=50%
```

## Best Practices

### 1. Test Independence

Each test should be completely independent:

```typescript
// Good: Test creates its own data
it('should qualify lead', async () => {
  const lead = generateLead();
  const result = await qualifyLead(lead);
  expect(result.qualified).toBe(true);
});

// Bad: Test depends on previous test
let sharedLead;
it('should create lead', async () => {
  sharedLead = await createLead();
});
it('should qualify lead', async () => {
  await qualifyLead(sharedLead); // Depends on previous test
});
```

### 2. Cleanup

Always clean up test data:

```typescript
const cleanup = createCleanupCoordinator();

afterEach(async () => {
  await cleanup.cleanupAll();
});

// Track resources for cleanup
cleanup.database.track('leads', leadId);
cleanup.mocks.register('twilio', () => twilioMock.reset());
```

### 3. Descriptive Test Names

```typescript
// Good
it('should reject call without valid TCPA consent', async () => {});

// Bad
it('should work', async () => {});
```

### 4. Arrange-Act-Assert Pattern

```typescript
it('should qualify high-equity leads', async () => {
  // Arrange
  const lead = generateLead({ estimatedEquity: 150000 });

  // Act
  const result = await qualifyLead(lead);

  // Assert
  expect(result.qualified).toBe(true);
  expect(result.score).toBeGreaterThan(70);
});
```

### 5. Test One Thing

```typescript
// Good: Tests one specific behavior
it('should calculate ARV correctly', async () => {
  const property = generateProperty();
  const arv = calculateARV(property);
  expect(arv).toBeGreaterThan(property.estimatedValue);
});

// Bad: Tests multiple things
it('should process lead', async () => {
  await ingestLead(lead);
  await qualifyLead(lead);
  await initiateCall(lead);
  // Too much in one test
});
```

### 6. Use Factories for Test Data

```typescript
// Good: Use generator with overrides
const lead = generateLead({ source: 'google_ads' });

// Bad: Manually construct
const lead = {
  leadId: '123',
  source: 'google_ads',
  contact: {
    firstName: 'John',
    // ... lots of manual setup
  },
};
```

### 7. Mock External Services

```typescript
// Good: Use provided mocks
import { twilioMock } from '../mocks/twilio-mock';
const call = await twilioMock.createCall({...});

// Bad: Hit real Twilio API in tests
const twilio = require('twilio')(accountSid, authToken);
await twilio.calls.create({...}); // Real API call!
```

## Troubleshooting

### Tests Hanging

```bash
# Check for open handles
npm test -- --detectOpenHandles

# Force exit after tests
npm test -- --forceExit
```

### Memory Issues

```bash
# Run tests sequentially
npm test -- --runInBand

# Increase memory
NODE_OPTIONS=--max_old_space_size=4096 npm test
```

### Flaky Tests

```bash
# Run test multiple times
npm test -- --testNamePattern="flaky test" --repeat=10

# Check test isolation
npm test -- --runInBand
```

### Coverage Issues

```bash
# See uncovered lines
npm test -- --coverage --verbose

# Update coverage thresholds in jest.config.js
```

## Support

For questions or issues with tests:
1. Check test logs for error details
2. Review test documentation
3. Check existing tests for examples
4. Consult team members

---

**Happy Testing!** 🚀
