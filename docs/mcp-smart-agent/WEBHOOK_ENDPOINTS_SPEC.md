# Webhook Endpoints Specification

**Version**: 1.0
**Last Updated**: 2025-11-07

---

## Overview

The MCP Smart Agent Server exposes HTTP endpoints for Twilio webhooks. These endpoints handle incoming calls, status updates, and recording notifications.

**Server**: `http://localhost:3333` (development) or deployment URL (production)

---

## Endpoints

### 1. POST /webhooks/conversation-relay

**Purpose**: Handle incoming and outbound call routing to ElevenLabs Conversational AI

**Twilio Configuration**:
- Configure in Twilio Console under Phone Numbers → Active Numbers → Voice Configuration
- **"A Call Comes In"**: `https://your-domain/webhooks/conversation-relay?agentId=agent_XXXXX` (POST)

**Request Headers**:
```
Content-Type: application/x-www-form-urlencoded
X-Twilio-Signature: <signature>
```

**Request Body** (Twilio sends URL-encoded):
```
CallSid=CA1234567890abcdef
AccountSid=AC5af4d80653e99f4375d7a43d02bb6a96
From=%2B12147305642
To=%2B1234567890
CallStatus=ringing
Direction=inbound
ApiVersion=2010-04-01
```

**Query Parameters**:
```
agentId=agent_2201k95pnb1beqp9m0k7rs044b1c
```

**Response**: TwiML XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream
      url="wss://api.elevenlabs.io/convai/conversation?signed_url=..."
      track="inbound_track"
    />
  </Connect>
</Response>
```

**Process Flow**:
1. Verify Twilio signature (security)
2. Extract `agentId` from query params
3. Call `ElevenLabsClient.getSignedUrl(agentId)`
4. Parse signed URL from ElevenLabs
5. Generate TwiML with ConversationRelay stream
6. Return TwiML response
7. Log webhook call with callSid and status

**Error Handling**:
- Missing agentId: Return error TwiML with "Missing agent ID"
- Invalid agentId: Return error TwiML with "Agent not found"
- ElevenLabs API error: Return error TwiML with "Connection failed"

**Success Response (200 OK)**:
```
Content-Type: application/xml

<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://api.elevenlabs.io/..." />
  </Connect>
</Response>
```

**Error Response (200 OK with error TwiML)**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry, there was an error connecting to the agent.</Say>
  <Hangup/>
</Response>
```

**Logging**:
```
[conversation-relay] Incoming call
  callSid: CA1234567890abcdef
  from: +12147305642
  to: +1234567890
  agentId: agent_2201k95pnb1beqp9m0k7rs044b1c
  status: connecting
```

---

### 2. POST /webhooks/status-callback

**Purpose**: Receive call status updates from Twilio

**Twilio Configuration**:
- Configure under Phone Numbers → Voice Configuration
- **"Call Status Changes"**: `https://your-domain/webhooks/status-callback` (POST)

**Request Body** (URL-encoded):
```
CallSid=CA1234567890abcdef
AccountSid=AC5af4d80653e99f4375d7a43d02bb6a96
From=%2B12147305642
To=%2B1234567890
CallStatus=in-progress
CallDuration=45
Direction=outbound-dial
ApiVersion=2010-04-01
ParentCallSid=CA9876543210fedcba
```

**Status Values**:
- `queued`: Call queued
- `ringing`: Phone ringing
- `in-progress`: Call answered and in progress
- `completed`: Call ended normally
- `failed`: Call failed to connect
- `busy`: Recipient busy
- `no-answer`: No answer after timeout
- `canceled`: Call canceled before connection

**Process Flow**:
1. Verify Twilio signature
2. Extract call details (callSid, status, duration, from, to)
3. Update call record in CallManager
4. Log status transition
5. Trigger any post-call actions (if completed)

**Response (200 OK)**:
```
OK
```

**Empty Body**: The endpoint should return `200 OK` with empty body or minimal response

**Logging**:
```
[status-callback] Call status update
  callSid: CA1234567890abcdef
  status: in-progress
  duration: 45
  from: +12147305642
  to: +1234567890
```

**State Transitions**:
```
queued → ringing → in-progress → completed
              ↓
              busy/no-answer/failed
```

---

### 3. POST /webhooks/recording-callback

**Purpose**: Notification when call recording is ready

**Twilio Configuration**:
- Configure under Phone Numbers → Voice Configuration
- **"Recording Status Callback"**: `https://your-domain/webhooks/recording-callback` (POST)

**Request Body** (URL-encoded):
```
CallSid=CA1234567890abcdef
AccountSid=AC5af4d80653e99f4375d7a43d02bb6a96
RecordingSid=RE1234567890abcdef
RecordingUrl=https://api.twilio.com/2010-04-01/Accounts/.../Recordings/RE1234567890abcdef
RecordingStatus=completed
RecordingDuration=120
RecordingChannels=1
RecordingSource=transcription
ApiVersion=2010-04-01
```

**Recording Status Values**:
- `in-progress`: Recording in progress
- `completed`: Recording completed and available
- `absent`: No recording made
- `failed`: Recording failed

**Process Flow**:
1. Verify Twilio signature
2. Extract recording details (callSid, recordingSid, recordingUrl, duration)
3. Update call record with recording URL
4. Log recording availability
5. (Optional) Queue for transcription processing

**Response (200 OK)**:
```
OK
```

**Logging**:
```
[recording-callback] Recording ready
  callSid: CA1234567890abcdef
  recordingSid: RE1234567890abcdef
  duration: 120
  url: https://api.twilio.com/...
```

**Recording Access**:
- Recording URL valid for 30 days after completion
- Should be downloaded/archived promptly
- (Future) Use for transcription and analysis

---

### 4. GET /health

**Purpose**: Health check endpoint

**Request**: No body

**Response (200 OK)**:
```json
{
  "status": "ok",
  "service": "mcp-smart-agent-server",
  "version": "1.0.0",
  "timestamp": "2025-11-07T10:30:00Z",
  "uptime": 3600,
  "stats": {
    "activeCalls": 2,
    "callsToday": 47,
    "errorCount": 0
  }
}
```

**Response (503 Service Unavailable)**:
```json
{
  "status": "error",
  "service": "mcp-smart-agent-server",
  "error": "Database connection failed"
}
```

---

## Twilio Signature Verification

### Implementation

For security, verify all Twilio webhook requests with signature validation:

```typescript
import crypto from 'crypto';

function verifyTwilioSignature(req: Express.Request): boolean {
  const signature = req.headers['x-twilio-signature'] as string;
  const token = process.env.TWILIO_AUTH_TOKEN;

  // Construct the URL with full path and query string
  const url = `https://${req.headers.host}${req.originalUrl}`;

  // Sort and concatenate all POST body parameters
  let data = url;
  const sortedKeys = Object.keys(req.body).sort();
  for (const key of sortedKeys) {
    data += key + req.body[key];
  }

  // Create signature using HMAC-SHA1
  const computed = crypto
    .createHmac('sha1', token)
    .update(data)
    .digest('Base64');

  // Compare signatures
  return computed === signature;
}

// Middleware usage
app.use('/webhooks', (req, res, next) => {
  if (!verifyTwilioSignature(req)) {
    return res.status(401).send('Invalid signature');
  }
  next();
});
```

### Testing Signature Verification

```bash
# Test signature with curl
curl -X POST https://localhost:3333/webhooks/status-callback \
  -H "X-Twilio-Signature: <computed_signature>" \
  -d "CallSid=CA123&CallStatus=in-progress&..."
```

---

## Error Handling

### Invalid Requests

**Missing Required Parameter**:
```
Status: 400 Bad Request
Body: "Missing required parameter: agentId"
```

**Invalid Signature**:
```
Status: 401 Unauthorized
Body: "Invalid signature"
```

**Server Error**:
```
Status: 500 Internal Server Error
Body: "Internal server error"
```

### Retry Strategy

Twilio retries webhook calls that fail:
- Timeout > 5 seconds
- HTTP status not 2xx
- Maximum 3 attempts with exponential backoff

**Our Strategy**:
- Always respond with 200 OK quickly (within 1 second)
- Process webhook data asynchronously in background
- Log all webhook calls for debugging
- Store webhook payloads in case of processing failure

---

## Request/Response Logging

### Structured Logging Format

```json
{
  "timestamp": "2025-11-07T10:30:00.123Z",
  "level": "INFO",
  "component": "webhook",
  "endpoint": "/webhooks/status-callback",
  "method": "POST",
  "httpStatus": 200,
  "callSid": "CA1234567890abcdef",
  "status": "in-progress",
  "duration": 45,
  "processingTime": 125,
  "error": null
}
```

### Sensitive Data Masking

**Phone Numbers**: Mask last 4 digits
```
+1234567890 → +1234567xxx
```

**API Keys**: Never log
```
ELEVENLABS_API_KEY=sk_xxxxx (in logs, show first 10 chars only)
```

**Recording URLs**: Log without auth tokens
```
https://api.twilio.com/.../Recordings/RE123 (OK)
https://api.twilio.com/.../Recordings/RE123?auth=token (MASK)
```

---

## Rate Limiting

### Twilio Webhook Rate Limits

- Twilio sends webhooks at same rate as calls
- Typical: 10-100 calls/second per account
- Peak: Can exceed 1000 calls/second

### Our Handling

```typescript
// In-memory rate limiter
const webhookRateLimiter = new Map<string, RateLimit>();

function checkRateLimit(callSid: string): boolean {
  const limit = webhookRateLimiter.get(callSid) || { count: 0, reset: Date.now() };

  // Reset every minute
  if (Date.now() - limit.reset > 60000) {
    limit.count = 0;
    limit.reset = Date.now();
  }

  // Allow max 10 events per call per minute
  if (limit.count >= 10) {
    return false; // Rate limited
  }

  limit.count++;
  webhookRateLimiter.set(callSid, limit);
  return true;
}
```

---

## Testing Webhooks

### Manual Testing with ngrok

```bash
# 1. Start ngrok tunnel
ngrok http 3333

# 2. Configure in Twilio Console
# Voice URL: https://your-ngrok-url/webhooks/conversation-relay?agentId=agent_xxx

# 3. Make test call
# View logs on ngrok interface: http://localhost:4040
```

### Testing with cURL

```bash
# Test status callback
curl -X POST http://localhost:3333/webhooks/status-callback \
  -d "CallSid=CA123&CallStatus=in-progress&CallDuration=45&From=%2B12147305642&To=%2B1234567890"

# Test health endpoint
curl http://localhost:3333/health
```

### Testing with Twilio CLI

```bash
# Simulate incoming call
twilio api:core:incoming-phone-numbers:list

# Make test call
twilio api:core:calls:create \
  --to "+1234567890" \
  --from "+12147305642" \
  --url "https://your-url/webhooks/conversation-relay?agentId=agent_xxx"
```

---

## Security Considerations

### Signature Verification
- ✅ Always verify Twilio signature
- ✅ Use HMAC-SHA1 with auth token
- ✅ Reject unsigned requests

### HTTPS Only
- ✅ Use HTTPS in production
- ✅ Valid SSL certificate
- ✅ HTTP upgrade to HTTPS

### Authentication
- ✅ Verify agentId exists before using
- ✅ Check agent ownership/authorization
- ✅ Rate limit per account

### Data Privacy
- ✅ Mask phone numbers in logs
- ✅ Don't log API keys
- ✅ Encrypt recording URLs at rest

---

## Related Documents

- [Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md)
- [Architecture Design](./MCP_SMART_AGENT_ARCHITECTURE.md)
- [TCPA Compliance Guide](./TCPA_COMPLIANCE_GUIDE.md)
