# Calling Service

AI-powered calling service with Twilio and ElevenLabs Conversational AI 2.0 integration for Next Level Real Estate platform.

## Overview

The Calling Service is responsible for:

- **Outbound Call Management**: Initiating and managing AI-powered calls to leads
- **TCPA Compliance**: Enforcing 2025 TCPA regulations with strict consent validation
- **Twilio Integration**: Managing voice calls through Twilio Voice API
- **ElevenLabs AI**: Conversational AI with 75ms latency and 32+ languages
- **Call Recording & Transcription**: Automatic recording and transcription of calls
- **Sentiment Analysis**: Real-time sentiment tracking during conversations
- **Event Emission**: Publishing call events to Kafka for downstream processing

## Features

### TCPA 2025 Compliance

Strict enforcement of TCPA regulations:

- **Written Consent Validation**: Verifies one-to-one written consent
- **DNC Registry Checking**: Checks National and Internal Do Not Call lists
- **Automated Call Restrictions**: Blocks automated calls without explicit permission
- **31-Day Scrub Cycle**: Enforces DNC registry re-checking
- **Violation Tracking**: Monitors and prevents potential $500-$1,500 fines per violation

### AI-Powered Conversations

ElevenLabs Conversational AI 2.0:

- **Flash 2.5 Model**: 75ms latency for natural conversations
- **32+ Languages**: Auto-detection with mid-conversation switching
- **Turn-Taking**: State-of-the-art interruption handling
- **Dynamic Context**: Lead-specific information injected at call start
- **Sentiment Tracking**: Real-time emotion and intent detection

### Call Management

Complete call lifecycle management:

- **Call Initiation**: Automated outbound calling with TCPA checks
- **Status Tracking**: Real-time call status updates (queued, ringing, in-progress, completed)
- **Recording**: Automatic call recording via Twilio
- **Transcription**: Full conversation transcription with speaker identification
- **Post-Call Processing**: Automatic analysis and lead status updates

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Calling Service                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐    ┌──────────────┐                 │
│  │ Call Manager │────│ TCPA         │                 │
│  │              │    │ Validator    │                 │
│  └───────┬──────┘    └──────────────┘                 │
│          │                                             │
│  ┌───────┴──────┐    ┌──────────────┐                 │
│  │ Twilio       │    │ ElevenLabs   │                 │
│  │ Service      │    │ Service      │                 │
│  └──────────────┘    └──────────────┘                 │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐                 │
│  │ Event        │    │ Context      │                 │
│  │ Emitter      │    │ Builder      │                 │
│  └──────────────┘    └──────────────┘                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
    MongoDB               Twilio              ElevenLabs
                          Voice API           Conversation AI
```

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

## Configuration

Required environment variables:

```bash
# Service
PORT=3002
NODE_ENV=development
LOG_LEVEL=debug

# Database
MONGODB_URI=mongodb://localhost:27017/next_level_real_estate

# Kafka
KAFKA_BROKERS=localhost:9092

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+15551234567

# ElevenLabs
ELEVENLABS_API_KEY=your_api_key
ELEVENLABS_AGENT_ID=your_agent_id
ELEVENLABS_VOICE_ID=your_voice_id

# TCPA Compliance
ENABLE_TCPA_VALIDATION=true
REQUIRE_WRITTEN_CONSENT=true

# Call Configuration
ENABLE_CALL_RECORDING=true
ENABLE_TRANSCRIPTION=true
MAX_CALL_DURATION=1800
```

## Development

```bash
# Start development server
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Lint code
npm run lint

# Format code
npm run format
```

## API Endpoints

### POST /api/calls/initiate

Initiate an outbound call to a lead.

**Request:**
```json
{
  "leadId": "lead_123",
  "campaignId": "campaign_456",
  "callType": "agent",
  "overrideTCPA": false
}
```

**Response:**
```json
{
  "callId": "call_789",
  "status": "initiated",
  "call": {
    "callId": "call_789",
    "leadId": "lead_123",
    "twilio": {
      "callSid": "CA...",
      "status": "queued"
    },
    "elevenlabs": {
      "conversationId": "conv_..."
    }
  }
}
```

### GET /api/calls/:callId

Get call details by ID.

**Response:**
```json
{
  "callId": "call_789",
  "leadId": "lead_123",
  "status": "completed",
  "duration": 245,
  "transcript": { ... },
  "sentiment": {
    "overall": "positive",
    "confidence": 0.85
  },
  "outcome": {
    "result": "qualified",
    "appointmentScheduled": true
  }
}
```

### GET /api/calls/:callId/transcript

Get call transcript with sentiment analysis.

**Response:**
```json
{
  "callId": "call_789",
  "transcript": {
    "segments": [
      {
        "speaker": "agent",
        "text": "Hi John, this is Sarah from Next Level Real Estate...",
        "timestamp": 0,
        "confidence": 0.95
      },
      {
        "speaker": "customer",
        "text": "Hi Sarah, yes I'm interested in selling my property.",
        "timestamp": 3500,
        "confidence": 0.92,
        "sentiment": {
          "overall": "positive",
          "confidence": 0.8
        }
      }
    ],
    "fullText": "...",
    "duration": 245
  },
  "sentiment": {
    "overall": "positive",
    "confidence": 0.85
  },
  "intent": {
    "primary": "sell_property",
    "confidence": 0.9
  }
}
```

### GET /api/calls/lead/:leadId

Get all calls for a lead.

**Response:**
```json
{
  "leadId": "lead_123",
  "calls": [ ... ],
  "count": 3
}
```

### GET /api/calls/active/all

Get all active calls.

**Response:**
```json
{
  "calls": [ ... ],
  "count": 5
}
```

## Webhooks

### POST /webhooks/twilio/status

Twilio call status webhook.

Handles status updates: `queued`, `ringing`, `in-progress`, `completed`, `failed`, `no-answer`, `busy`, `canceled`

### POST /webhooks/twilio/recording

Twilio recording status webhook.

Receives recording URLs when recordings are ready.

### POST /webhooks/twilio/connect/:callId

TwiML webhook for call connection.

Returns TwiML instructions for:
- Voicemail detection
- AI agent connection
- Error handling

### POST /webhooks/elevenlabs/conversation

ElevenLabs conversation events webhook.

Handles conversation events from ElevenLabs Conversational AI.

## Call Flow

### 1. Call Initiation

```typescript
POST /api/calls/initiate
{
  "leadId": "lead_123",
  "callType": "agent"
}
```

### 2. TCPA Validation

- Check DNC status
- Verify written consent
- Validate automated call permission
- Log compliance checks

### 3. Lead Data Retrieval

- Fetch lead from Lead Service
- Extract contact information
- Gather property details
- Compile qualification data

### 4. Context Building

- Build conversation context
- Determine approach strategy
- Generate talking points
- Prepare objection handling

### 5. ElevenLabs Setup

- Create conversation session
- Inject dynamic context
- Configure voice and model
- Set language preferences

### 6. Twilio Call

- Format phone number (E.164)
- Initiate outbound call
- Configure recording
- Set status webhooks

### 7. Real-time Monitoring

- Track call status
- Monitor conversation flow
- Detect sentiment changes
- Identify key moments

### 8. Post-Call Processing

- Fetch recording
- Get transcript
- Analyze sentiment
- Determine outcome
- Update lead status
- Emit events

## Event Emission

Events published to Kafka:

### CallInitiated
```json
{
  "eventType": "CallInitiated",
  "callId": "call_789",
  "leadId": "lead_123",
  "callSid": "CA...",
  "conversationId": "conv_..."
}
```

### CallAnswered
```json
{
  "eventType": "CallAnswered",
  "callId": "call_789",
  "leadId": "lead_123",
  "timestamp": "2025-10-24T..."
}
```

### CallCompleted
```json
{
  "eventType": "CallCompleted",
  "callId": "call_789",
  "leadId": "lead_123",
  "status": "completed",
  "duration": 245
}
```

### CallFailed
```json
{
  "eventType": "CallFailed",
  "callId": "call_789",
  "leadId": "lead_123",
  "reason": "TCPA_VIOLATION",
  "violations": ["NO_CONSENT"]
}
```

### CallTranscriptReady
```json
{
  "eventType": "CallTranscriptReady",
  "callId": "call_789",
  "leadId": "lead_123",
  "transcript": { ... },
  "sentiment": { ... }
}
```

## TCPA Compliance

### Validation Checks

1. **National DNC Registry**: Check if phone number is on registry
2. **Internal DNC List**: Check internal do-not-call list
3. **Written Consent**: Verify one-to-one written consent exists
4. **Consent Method**: Validate consent method (written_form, email, website)
5. **Consent Expiration**: Check if consent has expired
6. **Automated Calls**: Verify automated calls are explicitly allowed

### Violation Types

- `NO_CONSENT`: No written consent on file
- `EXPIRED_CONSENT`: Consent has expired
- `WRONG_CONSENT_METHOD`: Invalid consent method for automated calls
- `ON_DNC_REGISTRY`: On National Do Not Call Registry
- `INTERNAL_DNC`: On internal DNC list
- `AUTOMATED_CALL_NOT_ALLOWED`: Automated calls not permitted

### Fine Estimation

TCPA violations carry fines of $500-$1,500 per violation. The service tracks and prevents potential violations.

## Docker

### Build Image

```bash
docker build -t calling-service .
```

### Run Container

```bash
docker run -p 3002:3002 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/next_level_real_estate \
  -e TWILIO_ACCOUNT_SID=your_sid \
  -e TWILIO_AUTH_TOKEN=your_token \
  -e ELEVENLABS_API_KEY=your_key \
  calling-service
```

### Docker Compose

```bash
docker compose up calling-service
```

## Observability

### OpenTelemetry Tracing

Distributed tracing with OpenTelemetry:

- Request/response tracking
- External service calls
- Database queries
- Event emissions

### Logging

Structured logging with Winston:

- Request logging
- Error tracking
- Performance metrics
- Compliance audits

### Health Checks

```bash
curl http://localhost:3002/health
```

Response:
```json
{
  "status": "healthy",
  "service": "calling-service",
  "timestamp": "2025-10-24T...",
  "mongodb": "connected"
}
```

## Production Deployment

### Environment Setup

1. Configure production MongoDB cluster
2. Set up Kafka cluster
3. Configure Twilio production account
4. Set up ElevenLabs production API key
5. Configure callback URLs for webhooks

### Security

- Use environment variables for secrets
- Enable TLS for all external connections
- Implement rate limiting
- Monitor for suspicious activity
- Regular security audits

### Scaling

- Horizontal scaling with load balancing
- Kafka for async event processing
- MongoDB replica sets for high availability
- Connection pooling for database
- Circuit breakers for external services

## Troubleshooting

### Common Issues

**Call not initiating:**
- Check TCPA validation logs
- Verify lead consent status
- Check DNC status
- Validate Twilio credentials

**Transcript not available:**
- Check ElevenLabs API key
- Verify conversation ID
- Check webhook configuration
- Wait for post-call processing

**Events not emitting:**
- Check Kafka connection
- Verify broker configuration
- Check topic permissions
- Review event emitter logs

## License

UNLICENSED - Proprietary software for Next Level Real Estate

## Support

For issues and questions, contact the development team.
