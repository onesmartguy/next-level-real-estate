# MCP Smart Agent Server - Architecture & Design

**Version**: 1.0
**Last Updated**: 2025-11-07
**Status**: Design Phase

---

## Table of Contents

1. [System Overview](#system-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Component Breakdown](#component-breakdown)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [State Management](#state-management)
6. [Integration Points](#integration-points)
7. [Error Handling Strategy](#error-handling-strategy)
8. [Logging & Observability](#logging--observability)

---

## System Overview

The MCP Smart Agent Server is a unified system that orchestrates outbound calling with real-time conversational AI. It consolidates functionality previously spread across multiple services into one cohesive platform.

### Key Components
- **MCP Server**: Anthropic Agent SDK integration point
- **HTTP Server**: Webhook endpoints for Twilio callbacks
- **Service Layer**: Reusable business logic (Twilio, ElevenLabs, TCPA, State)
- **Tool Layer**: 18 MCP tools exposed to Claude agents
- **Data Models**: TypeScript interfaces for type safety

### Integration Ecosystem
```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Agent (via MCP)                   │
│               (Orchestrates calling workflows)              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │   MCP Smart Agent Server           │
        │                                    │
        │  ┌──────────────────────────────┐ │
        │  │  18 MCP Tools                │ │
        │  │  - Orchestration (5)         │ │
        │  │  - Twilio Ops (4)            │ │
        │  │  - ElevenLabs Ops (6)        │ │
        │  │  - TCPA Compliance (3)       │ │
        │  └──────────────────────────────┘ │
        │                                    │
        │  ┌──────────────────────────────┐ │
        │  │  HTTP Webhook Server         │ │
        │  │  - conversation-relay        │ │
        │  │  - status-callback           │ │
        │  │  - recording-callback        │ │
        │  │  - /health                   │ │
        │  └──────────────────────────────┘ │
        │                                    │
        │  ┌──────────────────────────────┐ │
        │  │  Service Layer               │ │
        │  │  - TwilioClient              │ │
        │  │  - ElevenLabsClient          │ │
        │  │  - CallManager               │ │
        │  │  - TCPAChecker               │ │
        │  └──────────────────────────────┘ │
        │                                    │
        │  ┌──────────────────────────────┐ │
        │  │  In-Memory State             │ │
        │  │  - Calls Map                 │ │
        │  │  - Leads Map                 │ │
        │  │  - Compliance Records        │ │
        │  │  - Active Conversations      │ │
        │  └──────────────────────────────┘ │
        └────────────────┬───────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
    ┌──────────┐  ┌──────────┐  ┌─────────────┐
    │  Twilio  │  │ElevenLabs│  │ DNC Registry│
    │   API    │  │   API    │  │  (Future)   │
    └──────────┘  └──────────┘  └─────────────┘
```

---

## High-Level Architecture

### Layered Design

```
┌──────────────────────────────────────────────┐
│           MCP Interface Layer                │
│  (Claude Agent SDK - Tool Definitions)       │
├──────────────────────────────────────────────┤
│         Application Logic Layer              │
│  (Tool Handlers - 18 Tools)                  │
├──────────────────────────────────────────────┤
│           Service Layer                      │
│  (TwilioClient, ElevenLabsClient,           │
│   CallManager, TCPAChecker)                  │
├──────────────────────────────────────────────┤
│         HTTP Server Layer                    │
│  (Express.js - Webhook Handlers)             │
├──────────────────────────────────────────────┤
│      State Management Layer                  │
│  (In-Memory Data Structures + Optional DB)   │
├──────────────────────────────────────────────┤
│      External API Layer                      │
│  (Twilio, ElevenLabs, DNC Registry)         │
└──────────────────────────────────────────────┘
```

### Technology Stack

**Runtime**: Node.js 18+ (TypeScript)

**Dependencies**:
- `@anthropic-sdk/sdk`: Claude Agent SDK for MCP
- `twilio`: Twilio Voice API client
- `@elevenlabs/elevenlabs-js`: ElevenLabs SDK
- `express`: HTTP server framework
- `dotenv`: Environment variables

**DevDependencies**:
- `typescript`: TypeScript compiler
- `@types/node`: Node.js type definitions
- `@types/express`: Express type definitions

---

## Component Breakdown

### 1. Data Models (`src/models/`)

#### Call.ts
```typescript
interface Call {
  callSid: string;              // Unique Twilio identifier
  from: string;                 // Caller phone number
  to: string;                   // Recipient phone number
  agentId: string;              // ElevenLabs agent ID
  status: 'initiated' | 'ringing' | 'in-progress' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;            // In seconds
  leadId?: string;              // Associated lead
  recordingUrl?: string;        // Call recording URL
  conversationSid?: string;     // ElevenLabs conversation ID
  dynamicVariables?: Record<string, string>;
  complianceChecked: boolean;
  complianceStatus?: 'approved' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}
```

#### Lead.ts
```typescript
interface Lead {
  leadId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  property?: {
    address: string;
    estimatedArv: number;
    estimatedEquity: number;
    repairEstimate: number;
  };
  investorType?: string;
  source: string;                // 'google_ads' | 'zillow' | 'realgeeks'
  status: 'new' | 'contacted' | 'qualified' | 'disqualified';
  consent: {
    hasWrittenConsent: boolean;
    consentDate?: Date;
    consentMethod?: string;
  };
  dncStatus: {
    onNationalRegistry: boolean;
    internalDNC: boolean;
  };
  callAttempts: CallAttempt[];
  lastContacted?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CallAttempt {
  timestamp: Date;
  status: 'completed' | 'failed' | 'declined';
  duration?: number;
  outcome?: string;
}
```

#### ComplianceRecord.ts
```typescript
interface ComplianceRecord {
  recordId: string;
  leadId: string;
  checkTime: Date;
  checks: {
    consentVerified: boolean;
    dncVerified: boolean;
    callFrequencyValid: boolean;
  };
  status: 'approved' | 'blocked';
  blockReasons?: string[];
  checkDetails: {
    consentStatus: string;
    dncStatus: string;
    lastCallTime?: Date;
    daysSinceLast: number;
  };
  checkedBy: string;              // 'system' | 'manual'
}
```

#### ConversationState.ts
```typescript
interface ConversationState {
  conversationId: string;
  callSid: string;
  agentId: string;
  status: 'active' | 'ended' | 'error';
  startTime: Date;
  endTime?: Date;
  messages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }[];
  sentimentScore?: number;        // -1 to 1
  keyTopics?: string[];
  actionItems?: string[];
}
```

### 2. Service Layer (`src/services/`)

#### TwilioClient.ts
Wrapper around Twilio SDK with enhanced functionality:

**Methods**:
- `makeCall(to, from, url, options)` → callSid
- `getCall(callSid)` → Call details
- `endCall(callSid)` → Success/error
- `recordCall(callSid, recordingUrl)` → Success/error

**Features**:
- Automatic retry on failure
- Request/response logging
- Error handling with context
- Rate limit awareness

#### ElevenLabsClient.ts
Wrapper around ElevenLabs SDK:

**Methods**:
- `createAgent(config)` → agentId
- `updateAgent(agentId, updates)` → agent
- `getAgent(agentId)` → agent details
- `listAgents()` → agents array
- `listVoices()` → voices array
- `getVoice(voiceId)` → voice details
- `getSignedUrl(agentId)` → websocket URL

**Features**:
- Agent configuration validation
- Signed URL generation for ConversationRelay
- Fallback agent handling
- Voice filtering and search

#### CallManager.ts
In-memory state management for calls:

**Methods**:
- `createCall(callSid, data)` → Call record
- `updateCall(callSid, updates)` → Updated call
- `getCall(callSid)` → Call details
- `getCallHistory(limit, offset)` → Call array
- `getActiveCalls()` → Active call array
- `associateLead(callSid, leadId)` → Success/error

**State Structure**:
```typescript
private calls: Map<string, Call> = new Map();
private activeConversations: Map<string, ConversationState> = new Map();
```

**Features**:
- FIFO queue for call history
- Automatic cleanup of old calls
- Optional persistence to database
- Real-time call status tracking

#### TCPAChecker.ts
TCPA 2025 compliance engine:

**Methods**:
- `checkCompliance(lead)` → ComplianceRecord
- `verifyConsent(leadId)` → consent status
- `checkDNC(phone)` → DNC status
- `addToDNC(phone, reason)` → Success/error

**Compliance Checks**:
1. **Consent Verification**
   - Check written consent exists
   - Verify consent not expired
   - Verify consent matches call type

2. **DNC Registry Check**
   - Check national registry (mock for now)
   - Check internal DNC list
   - Verify no opt-outs

3. **Call Frequency Check**
   - Verify minimum time between calls
   - Respect lead preferences
   - Track call attempt count

**Features**:
- Audit trail of all checks
- Decision logging with reasons
- Configurable DNC rules
- Mock DNC registry (upgradeable to real API)

### 3. Tool Layer (`src/tools/`)

#### call-orchestration.ts
High-level call management (5 tools):
1. `initiate_call_with_compliance`
2. `get_call_status`
3. `end_call`
4. `get_call_history`
5. `list_active_calls`

#### twilio-operations.ts
Low-level Twilio operations (4 tools):
1. `twilio_make_call`
2. `twilio_get_call`
3. `twilio_end_call`
4. `twilio_record_call`

#### elevenlabs-operations.ts
Agent management (6 tools):
1. `elevenlabs_create_agent`
2. `elevenlabs_update_agent`
3. `elevenlabs_get_agent`
4. `elevenlabs_list_agents`
5. `elevenlabs_list_voices`
6. `elevenlabs_get_voice`

#### tcpa-compliance.ts
Compliance utilities (3 tools):
1. `check_tcpa_compliance`
2. `verify_consent`
3. `check_dnc_status`

### 4. HTTP Server (`src/server.ts`)

Express-based server with webhook endpoints:

```typescript
app.post('/webhooks/conversation-relay', handler);
app.post('/webhooks/status-callback', handler);
app.post('/webhooks/recording-callback', handler);
app.get('/health', handler);
```

**Middleware**:
- Request logging
- Body parsing (URL-encoded, JSON)
- Error handling
- CORS (if needed)
- Rate limiting (future enhancement)

### 5. Entry Point (`src/index.ts`)

MCP server initialization:

```typescript
const server = new MCPServer({
  name: 'mcp-smart-agent-server',
  version: '1.0.0'
});

// Register all 18 tools
server.tool('initiate_call_with_compliance', ..., handler);
server.tool('get_call_status', ..., handler);
// ... 16 more tools

// Start HTTP server
httpServer.listen(3333);

// Connect to MCP
server.start();
```

---

## Data Flow Diagrams

### Outbound Call Flow

```
Claude Agent
    │
    ├─ Tool: initiate_call_with_compliance
    │   └─ Parameters: lead, phone, agentId
    │
    ▼
MCP Smart Agent Server
    │
    ├─ 1. CallManager.createCall()
    │
    ├─ 2. TCPAChecker.checkCompliance()
    │   ├─ Verify consent
    │   ├─ Check DNC status
    │   └─ Check call frequency
    │
    ├─ 3. Compliance check result?
    │   ├─ ❌ BLOCKED → Return error
    │   └─ ✅ APPROVED
    │
    ├─ 4. TwilioClient.makeCall()
    │   └─ Twilio API Call
    │
    ▼
Twilio
    │
    ├─ Initiates call to prospect
    │
    ▼
Prospect Phone
    │
    ├─ Ring + Answer
    │
    ▼
Twilio Webhook
    │
    └─ POST /webhooks/conversation-relay
       └─ agentId parameter
    │
    ▼
MCP Smart Agent Server
    │
    ├─ ElevenLabsClient.getSignedUrl(agentId)
    │
    ▼
ElevenLabs API
    │
    └─ Return signed WebSocket URL
    │
    ▼
Twilio Response
    │
    └─ TwiML: <Connect><Stream url="signed_url"/></Connect>
    │
    ▼
Twilio + ElevenLabs
    │
    └─ Bidirectional audio stream established
    │   ├─ Agent says greeting
    │   ├─ Prospect responds
    │   ├─ Natural conversation
    │   └─ Call completes

    ▼
Status Updates
    │
    └─ POST /webhooks/status-callback
       └─ Update CallManager with status
    │
    ▼
Recording Ready
    │
    └─ POST /webhooks/recording-callback
       └─ Store recording URL in call record
```

### Incoming Call Flow

```
Prospect calls +12147305642
    │
    ▼
Twilio receives call
    │
    ├─ Webhook to conversation-relay
    │   └─ With agentId query parameter
    │
    ▼
MCP Smart Agent Server
    │
    ├─ conversation-relay handler
    │
    ├─ ElevenLabsClient.getSignedUrl(agentId)
    │
    ├─ Generate TwiML response
    │
    ▼
TwiML Response
    │
    └─ <Connect><Stream url="signed_url"/></Connect>
    │
    ▼
Twilio + ElevenLabs
    │
    └─ Agent answers call
    │   ├─ Greeting
    │   ├─ Agent listens
    │   ├─ Agent responds
    │   └─ Natural conversation
    │
    ▼
Call Status Updates
    │
    └─ Webhook: status-callback
       └─ CallManager tracks progress
```

---

## State Management

### In-Memory Data Structures

```typescript
class CallManager {
  private calls: Map<string, Call> = new Map();
  private leads: Map<string, Lead> = new Map();
  private complianceRecords: Map<string, ComplianceRecord[]> = new Map();
  private activeConversations: Map<string, ConversationState> = new Map();
}
```

### Call Lifecycle

```
INITIATED
    │
    ├─ Twilio queued
    │
    ▼
RINGING
    │
    ├─ Prospect phone ringing
    │
    ▼
IN_PROGRESS
    │
    ├─ Prospect answered
    ├─ ElevenLabs agent connected
    ├─ Conversation active
    │
    ▼
COMPLETED / FAILED
    │
    └─ Call ended
        ├─ Recording URL stored
        ├─ Duration recorded
        └─ Compliance record saved
```

### Optional Persistence

For durability beyond server restarts:

```typescript
interface PersistenceLayer {
  saveCall(call: Call): Promise<void>;
  saveLead(lead: Lead): Promise<void>;
  saveComplianceRecord(record: ComplianceRecord): Promise<void>;
  getCall(callSid: string): Promise<Call | null>;
  queryCallHistory(filter: any): Promise<Call[]>;
}
```

Implementation options:
- MongoDB (recommended for production)
- PostgreSQL with JSON columns
- Redis for high-frequency access
- SQLite for simple deployments

---

## Integration Points

### External APIs

#### Twilio Voice API
- **Endpoint**: `https://api.twilio.com/2010-04-01/`
- **Methods Used**:
  - POST `/Accounts/{AccountSid}/Calls.json` (make call)
  - GET `/Accounts/{AccountSid}/Calls/{CallSid}.json` (get call)
  - POST `/Accounts/{AccountSid}/Calls/{CallSid}.json` (update call)

#### ElevenLabs API
- **Endpoint**: `https://api.elevenlabs.io/v1/`
- **Methods Used**:
  - GET `/convai/agents` (list agents)
  - POST `/convai/agents` (create agent)
  - GET `/convai/agents/{agentId}` (get agent)
  - POST `/convai/agents/{agentId}` (update agent)
  - GET `/convai/conversation/get_signed_url` (signed URL for relay)
  - GET `/voices` (list voices)

#### Twilio Webhooks
- **POST /webhooks/conversation-relay**: Incoming call handler
- **POST /webhooks/status-callback**: Call status updates
- **POST /webhooks/recording-callback**: Recording ready notification

#### Claude Agent SDK (MCP)
- **Interface**: Standard MCP protocol
- **Tool Registration**: Declarative tool definitions
- **Request/Response**: JSON-RPC over stdio or HTTP

---

## Error Handling Strategy

### Error Categories

#### 1. API Errors (External)
- Twilio API timeout
- ElevenLabs API rate limit
- Network connectivity issue

**Handling**:
- Exponential backoff retry
- Fallback agent use
- Clear error message to user
- Log with full context

#### 2. Validation Errors (Input)
- Invalid phone number
- Missing required fields
- Invalid lead ID

**Handling**:
- Reject immediately
- Return clear error message
- Log validation failure
- No retry

#### 3. Business Logic Errors
- TCPA compliance check failed
- DNC registry blocked
- Consent missing

**Handling**:
- Reject call attempt
- Log compliance decision with reason
- Update audit trail
- Return specific error code

#### 4. State Management Errors
- Call SID not found
- Conversation state lost
- Concurrent update conflict

**Handling**:
- Attempt recovery from persistence
- Queue for retry
- Log warning with context
- Alert on repeated failures

### Error Response Format

```typescript
{
  success: false,
  error: {
    code: 'COMPLIANCE_BLOCKED',
    message: 'Lead has no written consent',
    details: {
      reason: 'consent_missing',
      leadId: 'lead_123',
      blockDate: '2025-11-07T10:30:00Z'
    },
    retryable: false
  }
}
```

---

## Logging & Observability

### Structured Logging

```typescript
interface LogEntry {
  timestamp: ISO8601String;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  component: string;
  action: string;
  correlationId: string;
  data: Record<string, any>;
  error?: ErrorDetails;
}
```

### Log Categories

1. **Tool Execution**
   - Tool name, parameters, result
   - Execution time
   - Any errors

2. **API Calls**
   - Request/response summary
   - Status codes
   - Response times
   - Errors

3. **TCPA Compliance**
   - Compliance decision
   - Reason for block/approval
   - Lead ID
   - Timestamp

4. **Call Events**
   - Call initiated, answered, completed
   - Duration, outcome
   - Recording URL when available
   - Lead association

5. **System Events**
   - Server start/stop
   - Health checks
   - Configuration changes
   - Memory usage

### Monitoring Metrics

**Key Metrics**:
- Tool call success rate
- Average call duration
- Compliance block rate
- API response times
- Error rate by type
- Call outcome distribution

**Dashboards** (Future):
- Real-time call activity
- Compliance decision history
- System health
- Tool usage breakdown

---

## Security Considerations

### API Key Management
- Store in environment variables only
- Never log API keys
- Rotate keys regularly
- Use principle of least privilege

### Data Privacy
- Encrypt phone numbers in transit
- Mask sensitive data in logs
- TCPA compliance audit trail
- Data retention policies

### Rate Limiting
- Implement rate limits per client
- Exponential backoff for retries
- Queue management for high load

### Input Validation
- Validate all MCP tool inputs
- Validate webhook requests
- Sanitize string inputs
- Type checking with TypeScript

---

## Performance Considerations

### Optimization Opportunities

1. **Caching**
   - Cache agent configurations
   - Cache voice list
   - Cache lead lookup results

2. **Async Processing**
   - Queue webhook processing
   - Async compliance checks (when possible)
   - Background cleanup of old calls

3. **Connection Pooling**
   - Reuse HTTP connections to APIs
   - Connection pools for database (if used)

4. **In-Memory Indexing**
   - Index calls by leadId
   - Index by status for filtering
   - Index by timestamp for queries

### Scalability Considerations

**Current Design**: Single-instance in-memory
- Suitable for: MVP, small-scale testing
- Typical throughput: 10-50 concurrent calls

**For Higher Scale**:
1. Add persistence layer (MongoDB)
2. Implement distributed locking
3. Use Redis for state sharing
4. Horizontal scaling with load balancing
5. Message queue for async processing

---

## Related Documents

- [Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md)
- [MCP Tools Specification](./MCP_TOOLS_SPECIFICATION.md)
- [Webhook Endpoints Specification](./WEBHOOK_ENDPOINTS_SPEC.md)
- [TCPA Compliance Guide](./TCPA_COMPLIANCE_GUIDE.md)
- [State Management Design](./STATE_MANAGEMENT_DESIGN.md)

---

**Last Updated**: 2025-11-07
**Status**: Design Complete, Ready for Implementation
