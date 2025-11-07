# Twilio + ElevenLabs Webhook Setup Guide

## Status: PRODUCTION READY ✅

**Webhook Handler Deployed**: https://webhook-handler-q96azhm43-onesmartguys-projects.vercel.app

- ✅ Health check: `/health` returns `{"status":"ok","service":"webhook-handler"}`
- ✅ CommonJS module compatible with Vercel
- ✅ ElevenLabs ConversationRelay support
- ✅ Status callback handling
- ✅ Recording callback support

---

## Configuration Steps

### Step 1: Get Webhook Handler URL

The webhook handler is deployed and accessible at:
```
https://webhook-handler-q96azhm43-onesmartguys-projects.vercel.app
```

### Step 2: Configure Twilio Phone Number Webhooks

1. **Log in to Twilio Console**
   - Go to https://console.twilio.com
   - Enter your credentials

2. **Navigate to Phone Numbers**
   - Go to `Voice` → `Manage` → `Active Numbers`
   - Click on your phone number: **+12147305642**

3. **Configure Voice Incoming Call Webhook**
   - **"A Call Comes In"** → Select `Webhook`
   - **URL**: `https://webhook-handler-q96azhm43-onesmartguys-projects.vercel.app/conversation-relay`
   - **HTTP Method**: `POST`
   - Click **Save**

4. **Configure Status Callback (Optional but Recommended)**
   - Under **"Call Status Changes"**
   - **Webhook URL**: `https://webhook-handler-q96azhm43-onesmartguys-projects.vercel.app/status-callback`
   - **HTTP Method**: `POST`
   - Click **Save**

5. **Configure Recording Callback (Optional)**
   - Under **"Recording Status Callback"**
   - **Webhook URL**: `https://webhook-handler-q96azhm43-onesmartguys-projects.vercel.app/recording-callback`
   - **HTTP Method**: `POST`
   - Click **Save**

---

## API Endpoints

### 1. Health Check
Verify the webhook handler is running:
```bash
curl https://webhook-handler-q96azhm43-onesmartguys-projects.vercel.app/health
```

**Response:**
```json
{"status":"ok","service":"webhook-handler"}
```

### 2. Conversation Relay (Incoming/Outbound Calls)
**Endpoint**: `/conversation-relay`
**Method**: `POST`
**Query Parameters**:
- `agentId` (required): ElevenLabs agent ID

**Flow**:
1. Twilio receives call (incoming or outbound initiated)
2. Makes POST request to `/conversation-relay?agentId=agent_XXXXX`
3. Webhook fetches signed URL from ElevenLabs
4. Returns TwiML with ConversationRelay connection
5. Bidirectional audio stream established between caller and ElevenLabs agent

**Example Twilio Outbound Call Initiation**:
```javascript
const twilio = require('twilio');
const client = twilio(accountSid, authToken);

const call = await client.calls.create({
  url: 'https://webhook-handler-q96azhm43-onesmartguys-projects.vercel.app/conversation-relay?agentId=agent_2201k95pnb1beqp9m0k7rs044b1c',
  to: '+1234567890',      // Prospect phone number
  from: '+12147305642',   // Your Twilio phone number
  record: true,           // Record the call
  recordingStatusCallback: 'https://webhook-handler-q96azhm43-onesmartguys-projects.vercel.app/recording-callback'
});
```

### 3. Status Callback
**Endpoint**: `/status-callback`
**Method**: `POST`
**Twilio sends**:
- `CallSid`: Unique call identifier
- `CallStatus`: `initiated`, `ringing`, `in-progress`, `completed`
- `CallDuration`: Duration in seconds
- `From`: Caller phone number
- `To`: Recipient phone number

**Use Cases**:
- Log call status changes to database
- Trigger follow-up actions based on call outcome
- Update CRM with call results

### 4. Recording Callback
**Endpoint**: `/recording-callback`
**Method**: `POST`
**Twilio sends**:
- `CallSid`: Unique call identifier
- `RecordingSid`: Unique recording identifier
- `RecordingUrl`: URL to access the recording
- `RecordingDuration`: Duration in seconds

**Use Cases**:
- Store recording URL in database
- Trigger transcription of recording
- Send recording to analysis service

---

## ElevenLabs Agents Available

### Production Agent (Sydney)
- **Agent ID**: `agent_2201k95pnb1beqp9m0k7rs044b1c`
- **Model**: Qwen 3 30B
- **Voice**: Warm female (ID: yM93hbw8Qtvdma2wCnJG)
- **Max Duration**: 600 seconds (10 minutes)
- **Purpose**: Real estate cold calling (downsizing/cash sales)
- **Features**:
  - TCPA 2025 compliance built-in
  - Advanced objection handling
  - 10 dynamic variables for personalization
  - Natural speech patterns with filler words
  - Sentiment analysis during call

### Sales Agent (Harper)
- **Agent ID**: `agent_2701k95dc7krebct4nx1kbey08sg`
- **Model**: Google Gemini 2.5 Flash
- **Voice**: Same as Production (yM93hbw8Qtvdma2wCnJG)
- **Purpose**: Demo/template agent

---

## Dynamic Variable Injection

The Production Agent (Sydney) supports 10 dynamic variables for lead personalization:

```javascript
// Variables available for injection during call
{
  "first_name": "John",
  "last_name": "Smith",
  "property_address": "123 Main St, Austin TX",
  "estimated_arv": "$250,000",
  "estimated_equity": "$50,000",
  "repair_estimate": "$15,000",
  "investor_type": "Fix & Flip",
  "contact_method": "email",
  "best_time_to_call": "evenings",
  "property_type": "single family home"
}
```

Variables are passed when initiating the call and injected at the start of the conversation.

---

## TCPA Compliance (2025 Requirements)

### Required Checks Before Calling

1. **Consent Verification**
   - Confirm recipient has written consent
   - Check consent date and method in database
   - Verify consent has not expired

2. **Do Not Call Registry Check**
   - Check against national DNC registry
   - Maintain internal DNC list
   - Update DNC status before each call attempt

3. **Call Frequency Limits**
   - Track call attempts per lead
   - Enforce minimum spacing between calls
   - Respect opt-out requests immediately

### Agent Configuration

The Production Agent (Sydney) includes:
- **TCPA Disclaimer Prompt**: Automatically included in agent system prompt
- **Consent Verification**: Agent asks for confirmation of consent
- **Opt-Out Handling**: Agent respects opt-out requests and marks lead as internal DNC

---

## Testing the Integration

### Manual Test Call

```bash
#!/bin/bash

# Set your variables
ACCOUNT_SID="AC5af4d80653e99f4375d7a43d02bb6a96"
AUTH_TOKEN="your_auth_token"
FROM_NUMBER="+12147305642"
TO_NUMBER="+1234567890"  # Test phone number
AGENT_ID="agent_2201k95pnb1beqp9m0k7rs044b1c"
WEBHOOK_URL="https://webhook-handler-q96azhm43-onesmartguys-projects.vercel.app"

# Make the call
curl -X POST https://api.twilio.com/2010-04-01/Accounts/$ACCOUNT_SID/Calls.json \
  -u "$ACCOUNT_SID:$AUTH_TOKEN" \
  -d "Url=$WEBHOOK_URL/conversation-relay?agentId=$AGENT_ID" \
  -d "To=$TO_NUMBER" \
  -d "From=$FROM_NUMBER" \
  -d "Record=true" \
  -d "RecordingStatusCallback=$WEBHOOK_URL/recording-callback"
```

### Expected Behavior

1. **Incoming call**: Twilio answers and routes to `/conversation-relay`
2. **Agent connection**: ElevenLabs agent answers with personalized greeting
3. **Conversation**: Agent engages in natural conversation
4. **Status updates**: `/status-callback` receives status changes
5. **Recording**: Call is recorded and `/recording-callback` is triggered

---

## Webhook Handler Code

**Location**: `/home/onesmartguy/projects/next-level-real-estate/services/webhook-handler/api/index.js`

**Key Features**:
- CommonJS module (compatible with Vercel)
- Robust error handling
- Comprehensive logging
- Support for dynamic query parameters

**Environment Variables Required**:
- `ELEVENLABS_API_KEY`: Your ElevenLabs API key
- Set in `.env` file and deployed to Vercel

---

## Troubleshooting

### "Missing agent ID" Error
- **Cause**: `agentId` query parameter not passed to webhook
- **Fix**: Ensure Twilio webhook URL includes `?agentId=agent_XXXXX`

### "Failed to get signed URL" Error
- **Cause**: Invalid agent ID or ElevenLabs API key
- **Fix**: Verify agent ID exists and API key is correct

### Call Connects But No Voice
- **Cause**: Agent not responding or network latency
- **Fix**: Check ElevenLabs agent status in dashboard
- **Fix**: Ensure bidirectional audio streaming is working

### Webhook Not Responding
- **Cause**: Vercel deployment issue
- **Fix**: Check deployment URL: `https://webhook-handler-q96azhm43-onesmartguys-projects.vercel.app/health`
- **Fix**: View Vercel logs for detailed error messages

---

## Next Steps

1. **Configure Twilio Webhooks** (see Step 2 above)
2. **Test with Manual Call** (see Testing section)
3. **Create API Endpoints** for programmatic call triggering
4. **Integrate with Claude Agent SDK** for intelligent call orchestration
5. **Implement Lead Database Integration** for automatic calling

---

## Related Documentation

- [Twilio Integration Guide](./api/twilio.md)
- [ElevenLabs Integration Guide](./api/elevenlabs.md)
- [Testing Instructions](../TESTING_INSTRUCTIONS.md)
- [Agent Configurations](../agents/AGENT_CONFIGURATIONS.md)
