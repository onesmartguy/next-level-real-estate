# Calling Service - Quick Start Guide

## Setup (5 minutes)

1. **Install Dependencies**
   ```bash
   cd services/calling-service
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Required Credentials**
   - Twilio Account SID and Auth Token
   - Twilio Phone Number
   - ElevenLabs API Key
   - MongoDB connection string
   - Kafka broker address

## Development

```bash
# Start service
npm run dev

# Service will be available at http://localhost:3002
```

## Quick Test

### 1. Health Check
```bash
curl http://localhost:3002/health
```

### 2. Initiate a Call
```bash
curl -X POST http://localhost:3002/api/calls/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "lead_123",
    "callType": "agent"
  }'
```

### 3. Get Call Details
```bash
curl http://localhost:3002/api/calls/{callId}
```

## Key Components

### Call Manager (`src/services/call-manager.ts`)
Orchestrates the entire call workflow from initiation to post-call processing.

### TCPA Validator (`src/services/tcpa-validator.ts`)
Enforces TCPA 2025 compliance with strict validation.

### Twilio Service (`src/services/twilio-service.ts`)
Manages Twilio Voice API integration for calls.

### ElevenLabs Service (`src/services/elevenlabs-service.ts`)
Handles AI conversation setup and management.

### Event Emitter (`src/utils/event-emitter.ts`)
Publishes call events to Kafka for downstream processing.

## Call Flow

```
1. POST /api/calls/initiate
   └─> TCPA Validation
       └─> Fetch Lead Data
           └─> Build Context
               └─> Create ElevenLabs Conversation
                   └─> Initiate Twilio Call
                       └─> Monitor Call Status
                           └─> Post-Call Processing
                               └─> Emit Events
```

## TCPA Compliance

**Always Required:**
- Written consent on file
- Phone not on DNC registry
- Consent not expired
- Automated calls explicitly allowed (for AI calls)

**Violation Prevention:**
The service automatically blocks calls that don't meet TCPA requirements.

## Webhooks Setup

Configure these URLs in Twilio:

- **Status Callback**: `https://your-domain.com/webhooks/twilio/status`
- **Recording Callback**: `https://your-domain.com/webhooks/twilio/recording`

## Event Topics

Kafka topics published:
- `calls.initiated`
- `calls.answered`
- `calls.completed`
- `calls.failed`
- `calls.transcripts`

## Common Issues

**"Lead not found"**
- Ensure Lead Service is running
- Check `LEAD_SERVICE_URL` in .env

**"TCPA violation"**
- Check lead consent status
- Verify DNC status
- Review TCPA validation logs

**"Call failed to initiate"**
- Verify Twilio credentials
- Check phone number format (E.164)
- Review Twilio dashboard for errors

## Production Checklist

- [ ] Configure production MongoDB cluster
- [ ] Set up Kafka cluster
- [ ] Configure Twilio production account
- [ ] Set ElevenLabs production API key
- [ ] Configure webhook URLs (publicly accessible)
- [ ] Enable OpenTelemetry tracing
- [ ] Set up monitoring and alerts
- [ ] Review TCPA compliance settings
- [ ] Configure rate limiting
- [ ] Enable TLS for all connections

## Next Steps

1. Review the [README.md](./README.md) for detailed documentation
2. Explore the [API endpoints](./README.md#api-endpoints)
3. Check [TCPA compliance](./README.md#tcpa-compliance) requirements
4. Review [event emission](./README.md#event-emission) patterns
5. Set up [observability](./README.md#observability) tools

## Support

For questions or issues, refer to:
- Main documentation: `README.md`
- Project overview: `../../CLAUDE.md`
- Shared models: `../../shared/models/`
