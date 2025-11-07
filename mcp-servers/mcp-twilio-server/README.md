# Twilio MCP Server

Model Context Protocol (MCP) server for Twilio Voice API integration with ElevenLabs ConversationRelay. Enables Claude Code to make outbound phone calls with AI conversational agents.

## Features

- **Outbound Calling**: Initiate phone calls with ElevenLabs conversational agents
- **ConversationRelay Integration**: Seamless Twilio + ElevenLabs audio streaming
- **Context Injection**: Pass lead data, property info, and strategy rules to AI agent
- **Call Management**: Get status, end calls, monitor duration and costs
- **Health Checks**: Automatic credential validation on startup

## Installation

```bash
cd mcp-servers/mcp-twilio-server
npm install
npm run build
```

## Configuration

Create a `.env` file (see `.env.example`):

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Webhook Configuration
WEBHOOK_BASE_URL=https://your-domain.com
WEBHOOK_SECRET=your_webhook_secret_here

# Logging
LOG_LEVEL=info
```

### Getting Credentials

**Twilio**:
1. Sign up at [twilio.com](https://www.twilio.com)
2. Get Account SID and Auth Token from Console
3. Purchase or verify a phone number

**ElevenLabs**:
1. Sign up at [elevenlabs.io](https://elevenlabs.io)
2. Get API key from Settings > API Keys
3. Create a conversational agent and note the agent ID

**Webhook**:
- Deploy webhook handler (see Webhook Setup below)
- Use public URL (ngrok for testing)

## MCP Tools

### twilio_make_call

Initiate an outbound call with ElevenLabs agent.

**Parameters**:
- `to` (required): Phone number in E.164 format (e.g., +19723363907)
- `agentId` (required): ElevenLabs agent ID
- `leadData` (optional): Lead context object
- `propertyInfo` (optional): Property details object
- `strategyRules` (optional): Strategy rules object
- `maxDuration` (optional): Max call duration in seconds
- `recordCall` (optional): Whether to record the call
- `statusCallbackUrl` (optional): Webhook for status updates

**Returns**:
```json
{
  "success": true,
  "call": {
    "sid": "CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "conversationId": "conv_xxxxxxxx",
    "status": "queued",
    "to": "+19723363907",
    "from": "+1234567890",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### twilio_get_call_status

Get current status of a call.

**Parameters**:
- `callSid` (required): Twilio call SID

**Returns**:
```json
{
  "success": true,
  "status": {
    "callSid": "CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "status": "in-progress",
    "direction": "outbound-api",
    "duration": 45,
    "startTime": "2025-01-15T10:30:15.000Z",
    "price": "-0.013",
    "priceUnit": "USD"
  }
}
```

### twilio_end_call

End an active call.

**Parameters**:
- `callSid` (required): Twilio call SID

**Returns**:
```json
{
  "success": true,
  "message": "Call CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx ended successfully"
}
```

## Webhook Setup

The server expects a webhook endpoint at `${WEBHOOK_BASE_URL}/twilio/conversation-relay` that returns TwiML to connect Twilio to ElevenLabs.

Example webhook handler (Express.js):

```typescript
import express from 'express'
import { VoiceResponse } from 'twilio/lib/twiml/VoiceResponse'

const app = express()

app.post('/twilio/conversation-relay', (req, res) => {
  const { conversationId, agentId } = req.query

  const twiml = new VoiceResponse()
  const connect = twiml.connect()

  connect.stream({
    url: `wss://api.elevenlabs.io/v1/convai/conversations/${conversationId}/stream`,
    parameters: {
      apiKey: process.env.ELEVENLABS_API_KEY,
      agentId,
    },
  })

  res.type('text/xml')
  res.send(twiml.toString())
})

app.listen(3000, () => {
  console.log('Webhook server running on port 3000')
})
```

For local testing, use [ngrok](https://ngrok.com):

```bash
ngrok http 3000
# Set WEBHOOK_BASE_URL to the ngrok URL
```

## Usage with Claude Code

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "twilio": {
      "command": "node",
      "args": ["/path/to/mcp-twilio-server/dist/server.js"],
      "env": {
        "TWILIO_ACCOUNT_SID": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "TWILIO_AUTH_TOKEN": "your_auth_token",
        "TWILIO_PHONE_NUMBER": "+1234567890",
        "ELEVENLABS_API_KEY": "your_api_key",
        "WEBHOOK_BASE_URL": "https://your-domain.com"
      }
    }
  }
}
```

## Example: Make a Test Call

```typescript
// In Claude Code
const result = await mcp__twilio__twilio_make_call({
  to: '+19723363907',
  agentId: 'agent_xxxxxxxx',
  leadData: {
    name: 'John Smith',
    phone: '+19723363907',
    source: 'Google Ads',
    urgency: 'Hot'
  },
  propertyInfo: {
    address: '123 Main St, Dallas, TX',
    price: 250000,
    beds: 3,
    baths: 2
  },
  recordCall: true,
  maxDuration: 300
})

console.log('Call SID:', result.call.sid)
console.log('Conversation ID:', result.call.conversationId)
```

## Architecture

```
┌─────────────────┐
│  Claude Code    │
└────────┬────────┘
         │ MCP Tool Call
         │ (twilio_make_call)
         ▼
┌─────────────────┐
│  Twilio MCP     │
│    Server       │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────────┐
│ElevenLabs│ │  Twilio    │
│Create   │ │  Initiate  │
│Convo    │ │  Call      │
└────────┘ └─────┬──────┘
                 │
                 │ Fetch TwiML
                 ▼
         ┌──────────────┐
         │   Webhook    │
         │   Handler    │
         └──────┬───────┘
                │ Return
                │ ConversationRelay
                │ TwiML
                ▼
         ┌──────────────┐
         │  Bidirectional│
         │  Audio Stream│
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │  Lead's Phone│
         └──────────────┘
```

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid Twilio credentials | Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN |
| 404 Not Found | Invalid phone number | Verify TWILIO_PHONE_NUMBER is verified/purchased |
| 500 Server Error | ElevenLabs API error | Check ELEVENLABS_API_KEY and agent ID |
| Connection failed | Webhook unreachable | Verify WEBHOOK_BASE_URL is accessible publicly |

## Monitoring

The server logs all operations to stderr:

```
[Server] Twilio MCP Server starting...
[Server] Initializing Twilio client...
[Server] Running health checks...
[Server] Twilio: ✓ healthy
[Server] Twilio MCP Server running
[Server] Available tools:
  - twilio_make_call: Initiate an outbound call using Twilio with ElevenLabs ConversationRelay
  - twilio_get_call_status: Retrieve the current status of a Twilio call
  - twilio_end_call: End an active Twilio call
[Twilio] Initiating call to: +19723363907
[Twilio] Using agent: agent_xxxxxxxx
[Twilio] ElevenLabs conversation created: conv_xxxxxxxx
[Twilio] Call initiated: CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Run
npm start
```

## License

MIT
