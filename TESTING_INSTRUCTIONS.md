# ElevenLabs Agent Testing Instructions

## Current Status

✅ **WebSocket Relay Server Running** on port 3002
✅ **Production Agent (Sydney)** configured and active
✅ **Twilio Integration** ready for testing

## What You Have

### Active Agents
1. **Production Agent (Sydney)** - `agent_2201k95pnb1beqp9m0k7rs044b1c`
   - Purpose: Real estate cold calling (downsizing/cash sales)
   - Phone: +19724262821
   - Voice: Warm female (yM93hbw8Qtvdma2wCnJG)
   - Model: Qwen 3 30B

2. **Sales Agent (Harper)** - `agent_2701k95dc7krebct4nx1kbey08sg`
   - Purpose: Demo/template agent
   - Model: Google Gemini 2.5 Flash

### Infrastructure
- **WebSocket Relay Server:** http://localhost:3002 (running)
- **Health Check:** http://localhost:3002/health (responding)
- **Twilio Account:** Configured with credentials in .env

---

## How To Test Calls

### Option 1: Local Testing (No Real Calls Yet)

#### A. Check Agent Configuration
```bash
node test-elevenlabs-call.js production
```
This verifies the agent is accessible and retrieves its full configuration.

#### B. Check Relay Server Status
```bash
curl http://localhost:3002/health
```
Returns:
```json
{
  "status": "ok",
  "timestamp": "2025-11-07T19:57:37.770Z",
  "activeConnections": 0,
  "elevenlabsAgent": "agent_2201k95pnb1beqp9m0k7rs044b1c"
}
```

### Option 2: Real Outbound Calls (Using Twilio)

```bash
node test-call-with-twilio.js +15551234567 advanced
```

This will:
1. ✅ Call from +19724262821 (your Twilio number)
2. ✅ Call to +15551234567 (destination)
3. ✅ Production Agent (Sydney) answers
4. ✅ Personalized greeting with injected variables

**Status:** Ready to test! You just need a real phone number to call.

### Option 3: Inbound Calls (Someone Calls Your Number)

When someone calls +19724262821:

1. **Twilio receives** the call
2. **Twilio calls** your webhook: `POST /voice/incoming`
3. **Your server responds** with TwiML pointing to WebSocket relay
4. **Relay connects** Twilio ↔ ElevenLabs
5. **Production Agent (Sydney)** answers and starts conversation

**To enable this:**

1. Deploy your relay server to the internet (not localhost)
2. Get a public URL (e.g., via ngrok for testing)
3. Configure in Twilio console:
   - Phone Numbers → Active Numbers → +19724262821
   - Voice Configuration → Webhooks → Call comes in
   - Set URL: `https://your-domain.com/voice/incoming`
   - Method: POST

---

## Step-by-Step: Make Your First Test Call

### Step 1: Verify Setup
```bash
# Check relay server is running
curl http://localhost:3002/health

# Check agent is configured
node test-elevenlabs-call.js production
```

Expected: Both return success responses.

### Step 2: Make Test Call
```bash
# Call a test number (use your own phone or a test number)
node test-call-with-twilio.js +15551234567 advanced
```

Expected output:
```
✅ Call Created Successfully!
─────────────────────────────────
Call SID: CA1234567890abcdef...
Status: queued
```

### Step 3: Monitor Call
The destination phone will ring. When you answer, Sydney will greet:

> "Hi, is this {{homeowner_first_name}} {{homeowner_last_name}}? Oh hey, it's just Sydney with Team Price Homes..."

And proceed with the qualification script from her configuration.

---

## API Endpoints on Your Relay Server

### POST /voice/incoming
**Purpose:** Twilio calls this when someone calls your number

**Called by:** Twilio Voice API
**Parameters:** None (Twilio sends them in request body)
**Returns:** TwiML XML

**Example Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay url="wss://your-server.com/voice/relay/{callSid}">
      <Parameter name="conversation_initiation_client_data">
        {"agent_id": "agent_2201k95pnb1beqp9m0k7rs044b1c", ...}
      </Parameter>
    </ConversationRelay>
  </Connect>
</Response>
```

### POST /voice/initiate
**Purpose:** Initiate outbound calls

**Parameters:** `{ "to": "+15551234567" }`
**Returns:** `{ "status": "initiated", ... }`

### GET /health
**Purpose:** Check server status

**Returns:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-07T19:57:37.770Z",
  "activeConnections": 0,
  "elevenlabsAgent": "agent_2201k95pnb1beqp9m0k7rs044b1c"
}
```

### WSS /voice/relay/:callSid
**Purpose:** WebSocket relay between Twilio and ElevenLabs

**Connection:** Established automatically by Twilio when TwiML points here
**Messages:** Audio, transcripts, agent responses relayed bidirectionally

---

## Variables Injected Into Agent

When you initiate a call with the `advanced` test type, these are sent to the agent:

```javascript
{
  "homeowner_first_name": "Jeff",
  "homeowner_last_name": "Price",
  "property_address_street": "1620 Yaggi Drive",
  "property_city": "Flower Mound",
  "property_state": "TX",
  "property_size": "3100 square feet",
  "bedrooms": "4",
  "estimated_value": "650000",
  "years_owned": "15"
}
```

These are interpolated into Sydney's first message:
```
"Hi, is this {{homeowner_first_name}} {{homeowner_last_name}}?..."
```

---

## Monitoring & Logs

### Relay Server Logs
```bash
tail -f /tmp/relay-server.log
```

Shows:
- Incoming/outgoing calls
- WebSocket connections/disconnections
- Message relay activity
- Errors and issues

### View Active Connections
```bash
curl http://localhost:3002/health
```

The `activeConnections` field shows how many calls are currently active.

### Twilio Console
Visit https://www.twilio.com/console
- Calls → All Calls (see call history)
- Logs (see webhook calls)
- Phone Numbers (verify webhook URL)

---

## Production Deployment

When ready to go production:

### 1. Deploy Relay Server
```bash
# Option A: Deploy to AWS Lambda, Heroku, or similar
npm run build
npm run deploy

# Option B: Deploy to your own server
pm2 start websocket-relay-server.js
```

### 2. Configure Twilio Webhook
1. Go to Twilio Console
2. Phone Numbers → Active Numbers → +19724262821
3. Voice Configuration → Webhooks → Call comes in
4. **URL:** `https://your-production-domain.com/voice/incoming`
5. **Method:** POST
6. **Save**

### 3. Enable HTTPS/SSL
Twilio requires HTTPS for webhooks:
```bash
# If using ngrok locally:
ngrok http 3002

# If self-hosted, use certbot for Let's Encrypt:
certbot certonly --standalone -d your-domain.com
```

### 4. Update Agent Configuration (Optional)
- Add more knowledge base documents
- Enable RAG (Retrieval Augmented Generation)
- Add custom tools
- Implement call recording/transcription webhooks

---

## Troubleshooting

### Issue: "Not Found" Error
**Cause:** Agent ID doesn't match the API key
**Fix:** Verify you're using the correct agent ID and API key

Current:
- ✅ Agent ID: `agent_2201k95pnb1beqp9m0k7rs044b1c`
- ✅ API Key: `sk_8a7aefd...`

### Issue: WebSocket Connection Refused
**Cause:** Relay server not running
**Fix:**
```bash
node websocket-relay-server.js
# Or restart if already running:
kill $(cat /tmp/relay-server.pid)
node websocket-relay-server.js &
```

### Issue: Call Rings But No Answer
**Cause:** Relay server not connected to ElevenLabs
**Fix:**
1. Check `/tmp/relay-server.log` for errors
2. Verify ElevenLabs API key is valid
3. Verify agent ID is correct

### Issue: Twilio Webhook Not Triggering
**Cause:** Webhook URL not configured or unreachable
**Fix:**
1. Check Twilio console for webhook configuration
2. Test webhook URL manually: `curl -X POST https://your-url/voice/incoming`
3. Check server is publicly accessible (use ngrok for local testing)

---

## Files Created

- ✅ `test-elevenlabs-call.js` - Test agent configuration
- ✅ `test-call-with-twilio.js` - Make real outbound calls
- ✅ `test-websocket-call.js` - Test WebSocket connection
- ✅ `websocket-relay-server.js` - Twilio ↔ ElevenLabs bridge
- ✅ `ELEVENLABS_TESTING_GUIDE.md` - Detailed integration guide
- ✅ `TESTING_INSTRUCTIONS.md` - This file

---

## Next Steps

1. **Make First Test Call**
   ```bash
   node test-call-with-twilio.js +1234567890 advanced
   ```

2. **Deploy Relay Server** to a production domain

3. **Configure Twilio Webhook** to point to your relay server

4. **Receive Inbound Call** by calling +19724262821

5. **Monitor Agent Performance**
   - Call duration
   - Transcript quality
   - Sentiment analysis
   - Appointment setting rate

6. **Optimize Agent Behavior**
   - Review call transcripts
   - Update prompt/instructions
   - Add knowledge base documents
   - A/B test different approaches

---

## Support & Resources

- **ElevenLabs Docs:** https://elevenlabs.io/docs
- **Twilio Docs:** https://www.twilio.com/docs
- **ConversationRelay:** https://www.twilio.com/docs/voice/conversationrelay
- **Your Agents:** https://elevenlabs.io (login to see agents)

---

## Quick Reference Commands

```bash
# Start relay server
node websocket-relay-server.js

# Test agent
node test-elevenlabs-call.js production

# Check server health
curl http://localhost:3002/health

# Make test call
node test-call-with-twilio.js +15551234567 advanced

# View relay logs
tail -f /tmp/relay-server.log

# Stop relay server
kill $(cat /tmp/relay-server.pid)
```

---

**Last Updated:** 2025-11-07
**Status:** Ready for testing ✅
