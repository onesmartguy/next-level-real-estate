# MCP RealGeeks Server

Model Context Protocol (MCP) server that wraps the RealGeeks CRM API for **Next Level Real Estate** platform. This server provides tools for lead management, activity tracking, and bi-directional CRM synchronization with ElevenLabs conversational AI.

## Features

### Lead Management
- **Create leads** with comprehensive contact and property data
- **Update leads** with status changes, urgency, and notes
- **Retrieve lead details** including full activity history
- **Add activities** to track calls, emails, property views, and notes
- **Deduplicate leads** based on email, phone, or name+address

### User Management
- **List agents and lenders** for lead assignment
- **Role-based filtering** (Agents vs Lenders)
- **Contact information** for notifications

### Webhook Support
- **HMAC-SHA256 signature validation** for security
- **Idempotent processing** with message ID tracking
- **Retry handling** with exponential backoff
- **Event types**: lead created, updated, activity_added

## Technology Stack

- **MCP SDK**: [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk)
- **TypeScript**: Type-safe implementation
- **Zod**: Runtime configuration validation
- **HTTP Basic Auth**: API authentication

## Installation

### 1. Install dependencies

```bash
cd mcp-servers/mcp-realgeeks-server
npm install
```

### 2. Configure environment

Copy the example environment file and add your RealGeeks credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
REALGEEKS_API_USERNAME=your_username_here
REALGEEKS_API_PASSWORD=your_password_here
REALGEEKS_WEBHOOK_SECRET=your_webhook_secret_here
REALGEEKS_TIMEOUT=30000
LOG_LEVEL=info
```

**Where to get credentials:**
- API username/password: Contact RealGeeks support
- Site UUID: Found in your RealGeeks URL (e.g., `https://app.realgeeks.com/sites/{site-uuid}`)
- Webhook secret: Generate a secure random string

### 3. Build the server

```bash
npm run build
```

## Usage

### Running the server

```bash
npm start
```

### Development mode (with watch)

```bash
npm run dev
```

### Integration with Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "realgeeks": {
      "command": "node",
      "args": [
        "/home/onesmartguy/projects/next-level-real-estate/mcp-servers/mcp-realgeeks-server/dist/server.js"
      ],
      "env": {
        "REALGEEKS_API_USERNAME": "your_username",
        "REALGEEKS_API_PASSWORD": "your_password",
        "REALGEEKS_WEBHOOK_SECRET": "your_secret"
      }
    }
  }
}
```

## Available Tools

### Lead Management Tools

#### `realgeeks_create_lead`
Create a new lead in RealGeeks CRM.

**Parameters**:
- `siteUuid` (required): RealGeeks site UUID
- `firstName`: Lead first name
- `lastName`: Lead last name
- `email`: Primary email address
- `phone`: Primary phone number
- `source`: Lead source (default: "API Integration")
- `sourceDetails`: Additional source information
- `role`: "Buyer", "Seller", "Buyer and Seller", or "Renter"
- `urgency`: "Cold", "Warm", "Hot", "Contacted", or "Not Contacted"
- `timeframe`: When they plan to buy/sell
- `address`, `city`, `state`, `zip`: Property/lead location
- `notes`: Additional notes
- `tags`: Array of categorization tags
- `region`: Geographic region for assignment
- `assignToUserId`: Agent ID to assign lead to

**Example**:
```typescript
{
  "siteUuid": "abc-123-def-456",
  "firstName": "John",
  "lastName": "Smith",
  "email": "john@example.com",
  "phone": "+1234567890",
  "source": "Google Ads - Property Search",
  "role": "Buyer",
  "urgency": "Hot",
  "timeframe": "Immediately",
  "notes": "Interested in 3-bed homes in downtown",
  "tags": ["google-ads", "high-intent"],
  "assignToUserId": "agent-789"
}
```

#### `realgeeks_update_lead`
Update an existing lead in RealGeeks.

**Parameters**:
- `siteUuid` (required): Site UUID
- `leadId` (required): Lead ID to update
- `email`: Update email
- `phone`: Update phone
- `urgency`: Update urgency level
- `status`: "Active", "Cancelled", "In Escrow", "Closed Escrow", or "Dead"
- `notes`: Update notes
- `tags`: Update tags

#### `realgeeks_get_lead`
Retrieve lead details including activities.

**Parameters**:
- `siteUuid` (required): Site UUID
- `leadId` (required): Lead ID

#### `realgeeks_add_activities`
Add activities to a lead (calls, emails, property views, notes).

**Parameters**:
- `siteUuid` (required): Site UUID
- `leadId` (required): Lead ID
- `activities` (required): Array of activity objects

**Activity Object**:
```typescript
{
  "type": "called",  // Activity type
  "description": "AI call completed. Duration: 3min. Sentiment: Positive.",
  "source": "ElevenLabs AI"  // Optional, defaults to "API"
}
```

**Supported Activity Types**:
- `called` - Phone call
- `note` - Internal note
- `property_viewed` - Property detail page view
- `contact_emailed` - Contact form submission
- `was_assigned` - Lead assignment
- `tour_requested` - Viewing request
- And 20+ more (see [Activities API docs](https://developers.realgeeks.com/activities/))

### User Management Tools

#### `realgeeks_list_users`
List all agents and lenders in your RealGeeks organization.

**Parameters**:
- `siteUuid` (required): Site UUID

**Returns**: Array of user objects with:
- `id`: User ID for lead assignment
- `name`: Full name
- `email`: Contact email
- `role`: "Agent" or "Lender"
- `admin`: Admin access boolean
- `phone_*`: Various phone numbers

## API Reference

### RealGeeks API Endpoints Used

**Base URL**: `https://receivers.leadrouter.realgeeks.com/rest`

- `POST /sites/{site-uuid}/leads` - Create lead
- `PATCH /sites/{site-uuid}/leads/{lead-id}` - Update lead
- `GET /sites/{site-uuid}/leads/{lead-id}` - Get lead
- `POST /sites/{site-uuid}/leads/{lead-id}/activities` - Add activities
- `GET /sites/{site-uuid}/users` - List users

### Authentication

Uses HTTP Basic Auth with username and password encoded in base64:

```
Authorization: Basic base64(username:password)
```

### Webhook Signature Validation

Validates incoming webhooks using HMAC-SHA256:

```typescript
const hmac = crypto.createHmac('sha256', webhookSecret)
hmac.update(requestBody)
const calculatedSignature = hmac.digest('hex')

// Compare with X-Lead-Router-Signature header
const isValid = crypto.timingSafeEqual(
  Buffer.from(signature),
  Buffer.from(calculatedSignature)
)
```

## Integration Patterns

### Pattern 1: External Lead → RealGeeks → ElevenLabs

```
Google Ads Lead
    ↓
  (webhook)
    ↓
Your Application
    ↓
  (MCP tool: realgeeks_create_lead)
    ↓
RealGeeks CRM
    ↓
  (retrieve lead details)
    ↓
ElevenLabs AI
    ↓
  (call lead)
    ↓
  (MCP tool: realgeeks_add_activities)
    ↓
RealGeeks CRM (log call result)
```

### Pattern 2: RealGeeks Webhook → AI Calling

```
RealGeeks CRM (new lead)
    ↓
  (webhook: lead.created)
    ↓
Your Webhook Handler
    ↓
  (validate signature)
    ↓
Calling Queue
    ↓
ElevenLabs AI
    ↓
  (call within 5 minutes)
    ↓
  (MCP tool: realgeeks_add_activities)
    ↓
RealGeeks CRM (log outcome)
```

### Pattern 3: Bi-Directional Sync

```
RealGeeks ←→ Your System ←→ ElevenLabs

- Leads flow into RealGeeks (create_lead)
- Activities flow into RealGeeks (add_activities)
- Webhooks flow from RealGeeks to your system
- Lead data flows to ElevenLabs for context
```

## Use Cases

### Use Case 1: Import Google Ads Leads

```typescript
// Receive Google Ads webhook
app.post('/webhooks/google-ads', async (req, res) => {
  const googleLead = req.body

  // Create in RealGeeks
  await realgeeksClient.createLead(siteUuid, {
    id: randomUUID(),
    first_name: googleLead.first_name,
    last_name: googleLead.last_name,
    email: googleLead.email,
    phone: googleLead.phone,
    source: `Google Ads - ${googleLead.campaign_name}`,
    source_details: `Keyword: ${googleLead.keyword}, Ad Group: ${googleLead.ad_group}`,
    urgency: 'Hot',  // Google Ads leads are high intent
    tags: ['google-ads', googleLead.campaign_id],
  })

  res.status(200).json({ success: true })
})
```

### Use Case 2: Log AI Call Results

```typescript
// After ElevenLabs call completes
const callResult = await getElevenLabsConversation(conversationId)

// Log in RealGeeks
await realgeeksClient.addActivities(siteUuid, leadId, [{
  type: 'called',
  source: 'ElevenLabs AI',
  description: `
    AI call completed.
    Duration: ${callResult.duration}s
    Sentiment: ${callResult.sentiment.overall}
    Qualified: ${callResult.qualified ? 'Yes' : 'No'}
    Key Points: ${callResult.summary}
    Next Step: ${callResult.next_step}
  `,
  created: callResult.endedAt,
}])

// Update lead urgency based on call
if (callResult.qualified) {
  await realgeeksClient.updateLead(siteUuid, leadId, {
    urgency: 'Hot',
    notes: `Qualified via AI call. ${callResult.qualification_notes}`,
  })
}
```

### Use Case 3: Assign Leads to Agents

```typescript
// List available agents
const users = await realgeeksClient.listUsers(siteUuid)
const agents = users.filter(u => u.role === 'Agent')

// Implement round-robin assignment
let currentAgentIndex = 0

function assignLead(leadId: string) {
  const agent = agents[currentAgentIndex]
  currentAgentIndex = (currentAgentIndex + 1) % agents.length

  return realgeeksClient.addActivities(siteUuid, leadId, [{
    type: 'was_assigned',
    source: 'Auto-Assignment',
    description: `Assigned via round-robin to ${agent.name}`,
    user: { id: agent.id },
    role: 'agent',
    notify_users: true,  // Notify agent
  }])
}
```

## Error Handling

### Common HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Continue |
| 201 | Created | Continue |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Verify credentials |
| 422 | Unprocessable Entity | Check field values |
| 500 | Server Error | Retry with backoff |
| 503 | Service Unavailable | Retry later |

### Retry Strategy

```typescript
async function retryWithBackoff(fn: Function, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries) throw error

      const delay = Math.pow(2, attempt - 1) * 1000
      await sleep(delay)
    }
  }
}
```

## Webhook Setup

### 1. Register Webhook in RealGeeks

Contact RealGeeks support to register your webhook URL:
```
https://your-domain.com/webhooks/realgeeks
```

### 2. Implement Webhook Handler

```typescript
import express from 'express'
import crypto from 'crypto'

const app = express()

// Use raw body for signature validation
app.use('/webhooks/realgeeks', express.raw({ type: 'application/json' }))

app.post('/webhooks/realgeeks', (req, res) => {
  // Validate signature
  const signature = req.headers['x-lead-router-signature']
  const bodyString = req.body.toString()

  const hmac = crypto.createHmac('sha256', process.env.REALGEEKS_WEBHOOK_SECRET)
  hmac.update(bodyString)
  const calculatedSignature = hmac.digest('hex')

  if (signature !== calculatedSignature) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  // Process webhook
  const action = req.headers['x-lead-router-action']
  const messageId = req.headers['x-lead-router-message-id']
  const payload = JSON.parse(bodyString)

  console.log(`Webhook received: ${action} (${messageId})`)

  // Handle different actions
  switch (action) {
    case 'created':
      handleLeadCreated(payload)
      break
    case 'updated':
      handleLeadUpdated(payload)
      break
    case 'activity_added':
      handleActivityAdded(payload)
      break
  }

  res.status(200).json({ received: true })
})
```

### 3. Test with ngrok (Local Development)

```bash
# Start your server
npm run dev

# Expose with ngrok
ngrok http 3000

# Use ngrok URL for RealGeeks webhook
# https://abc123.ngrok.io/webhooks/realgeeks
```

## Troubleshooting

### Issue: Authentication Fails

**Symptoms**: 401 Unauthorized errors

**Solution**:
1. Verify username and password are correct
2. Check they're Base64 encoded properly
3. Contact RealGeeks support if still failing

### Issue: Lead Not Creating

**Symptoms**: 422 Unprocessable Entity

**Solution**:
1. Ensure at least one identification field (name, email, phone, address)
2. Verify UUID format for lead ID
3. Check all field types match schema

### Issue: Webhook Signature Validation Fails

**Symptoms**: Signature mismatch

**Solution**:
1. Verify webhook secret matches RealGeeks config
2. Use raw request body (not parsed JSON)
3. Ensure using HMAC-SHA256 with hex output
4. Use constant-time comparison

### Issue: Activities Not Appearing

**Symptoms**: Activities added but not visible

**Solution**:
1. Verify lead ID is correct
2. Check activity type is valid
3. Ensure source and description are provided
4. Review activity in RealGeeks UI (may take a moment)

## Development

### Project Structure

```
mcp-realgeeks-server/
├── src/
│   ├── server.ts                 # Main server
│   ├── types/index.ts            # TypeScript types
│   ├── clients/
│   │   └── realgeeks.ts          # API client
│   ├── tools/
│   │   ├── leads/                # Lead management tools
│   │   └── users/                # User management tools
│   └── utils/
│       └── config.ts             # Configuration
├── package.json
├── tsconfig.json
└── README.md
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
npm run format
```

## Resources

### RealGeeks Documentation
- [Incoming Leads API](https://developers.realgeeks.com/incoming-leads-api/)
- [Outgoing Leads API](https://developers.realgeeks.com/outgoing-leads-api/)
- [Leads Reference](https://developers.realgeeks.com/leads/)
- [Activities Reference](https://developers.realgeeks.com/activities/)
- [Users Reference](https://developers.realgeeks.com/users/)

### Internal Documentation
- Project CLAUDE.md: `/home/onesmartguy/projects/next-level-real-estate/CLAUDE.md`
- RealGeeks Integration Subagent: `.claude/agents/realgeeks-integration.md`
- RealGeeks Sync Skill: `.claude/skills/realgeeks-sync/`

## License

MIT

---

**Support**: For RealGeeks API questions, contact RealGeeks support. For MCP server issues, open an issue in this repository.

**Last Updated**: 2025-01-07
