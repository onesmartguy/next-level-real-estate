# ElevenLabs Agent Configurations

Retrieved: 2025-11-07

## Summary

You have **2 conversational AI agents** configured in ElevenLabs:

### 1. **Production Agent** (Sydney)
- **Agent ID:** `agent_2201k95pnb1beqp9m0k7rs044b1c`
- **Status:** Active (last call: 2025-11-07)
- **Purpose:** Warm, empathetic real estate professional specializing in downsizing and cash sale opportunities
- **Model:** Qwen 3 30B (qwen3-30b-a3b, temp: 1.0)
- **Voice:** `yM93hbw8Qtvdma2wCnJG` (Warm female voice - Sydney)
- **TTS Model:** eleven_turbo_v2
- **Max Duration:** 600 seconds (10 minutes)
- **Phone Number:** +19724262821 (Main - Twilio)

**Key Features:**
- Specializes in downsizing and cash sale opportunities
- Uses "confused helper" tone with natural hesitations
- Consultative, never pushy
- TCPA 2025 compliance built-in (DNC checks, time restrictions, consent tracking)
- Dynamic variable injection for personalized outreach (10 variables)
- Custom first message with property-specific information
- Advanced objection handling framework
- Natural speech patterns with filler words

**Configuration Details:**
- ASR Quality: HIGH (ElevenLabs provider)
- Turn Timeout: 7.0 seconds
- Turn Mode: Normal (not eager)
- Interruption Handling: Enabled with soft timeout message
- Supported Events: audio, interruption, user_transcript, agent_response, agent_response_correction
- Backup LLM: Claude Sonnet 4.5, GPT-5, GLM-45-Air-FP8, Gemini 2.5 Flash Lite (override preference)

---

### 2. **Sales Agent** (Harper)
- **Agent ID:** `agent_2701k95dc7krebct4nx1kbey08sg`
- **Status:** Active (last call: 2025-11-07)
- **Purpose:** Vibrant sales consultant demonstrating ElevenLabs Agents platform capabilities
- **Model:** Google Gemini 2.5 Flash (gemini-2.5-flash, temp: 0.5)
- **Voice:** `yM93hbw8Qtvdma2wCnJG` (Same warm female voice)
- **TTS Model:** eleven_turbo_v2
- **Max Duration:** 600 seconds (10 minutes)
- **Phone Number:** None assigned

**Key Features:**
- Template/demo agent for showcasing conversational AI capabilities
- Strategic and perceptive sales approach
- Adaptive communication style (analytical, visionary, pragmatic)
- Natural conversational skills with human-like engagement
- Industry insights and success stories
- ROI-focused messaging
- Thinking budget: 0 (no extended reasoning)

**Configuration Details:**
- ASR Quality: HIGH (ElevenLabs provider)
- Turn Timeout: 7.0 seconds
- Turn Mode: Normal (not eager)
- Interruption Handling: Enabled with soft timeout message
- Supported Events: audio, interruption, user_transcript, agent_response, agent_response_correction
- Backup LLM: Default preference (not overridden)

---

## Production Agent (Sydney) - Detailed Configuration

### Voice Configuration
- **Voice ID:** `yM93hbw8Qtvdma2wCnJG`
- **Stability:** 0.4 (natural variation)
- **Similarity Boost:** 0.45 (moderate naturalness)
- **Speed:** 0.88x (slightly slower for clarity)
- **Optimize Streaming Latency:** Level 2 (balanced latency/quality)

### Dynamic Variables (10 total)
Used for personalizing each call:
1. `homeowner_first_name` - Example: "Jeff"
2. `homeowner_last_name` - Example: "Price"
3. `property_address_street` - Example: "1620 Yaggi Drive"
4. `property_city` - Example: "Flower Mound"
5. `property_state` - Example: "TX"
6. `property_size` - Example: "3100 square feet"
7. `bedrooms` - Example: "4"
8. `estimated_value` - Example: "650000"
9. `years_owned` - Example: "15"
10. `estimated_value` - Property valuation estimate

### First Message Template
```
Hi..., is this {{homeowner_first_name}} {{homeowner_last_name}}?
```

### Conversation Strategy

**Initial Goals (First 30 seconds):**
1. Lower their guard (confused, asking for help)
2. Trigger curiosity (holding property information, three-block area)
3. Get them to engage ("Who would be the right person...")

**Middle Goals (Next 2-3 minutes):**
1. Identify their situation (empty nester? financial distress? inherited property?)
2. Understand their pain points (maintenance? stairs? costs?)
3. Match benefits to their situation
4. Educate about cash offers (if they're receptive)

**End Goals (Final minute):**
1. Handle any objections empathetically
2. Schedule next step (appointment, follow-up call, send information)
3. Leave door open if not ready now
4. Maintain positive relationship

### Target Audience

**Primary:**
- Homeowners over 60
- Living in homes 10+ years
- 50%+ equity
- Facing challenges with:
  - Property maintenance burden
  - Stairs and mobility issues
  - Ongoing costs (utilities, taxes, repairs)
  - Recent life changes (empty nest, health issues, spouse passing)
  - Need to downsize or relocate

**Secondary:**
- Financial distress / facing foreclosure
- Inherited properties
- Divorce or separation
- Job relocation
- Tired of being a landlord

### Built-in Tools
- **voicemail_detection:** Automatically detects and handles voicemail
- **play_keypad_touch_tone:** Play DTMF tones (for IVR navigation if needed)

### Objection Handling Framework

The agent has comprehensive responses for:
1. "We're not interested in selling"
2. "How did you get my information?"
3. "We already have a realtor"
4. "I need to talk to my spouse/family"
5. "What's this really about?"
6. "That offer seems low"
7. "I want to think about it"
8. "Take me off your list" / "Don't call me again"
9. "Is this a scam?"
10. "The house needs too much work"

Each objection has:
- Pre-scripted empathetic response
- Tone guidance
- Follow-up action steps

### TCPA 2025 Compliance

**Built into prompt:**
- ✅ Do Not Call (DNC) registry check instructions
- ✅ Time restrictions (8am-9pm homeowner local time)
- ✅ Written consent validation requirements
- ✅ Immediate opt-out handling (end call, log removal)
- ✅ Call frequency limits (max 3 per 7 days without permission)
- ✅ Proper identification in greeting

**Enforcement:**
- Violations: $500-$1,500 per call
- Immediate call termination on opt-out request
- No continuation of conversation after opt-out

---

## Sales Agent (Harper) - Detailed Configuration

### Voice Configuration
- **Voice ID:** `yM93hbw8Qtvdma2wCnJG` (same as Production Agent)
- **Stability:** 0.5 (balanced)
- **Similarity Boost:** 0.8 (high naturalness)
- **Speed:** 1.0x (normal)
- **Optimize Streaming Latency:** Level 3 (aggressive optimization)

### First Message
```
Hi there! I'm Harper from ElevenLabs. How could ElevenLabs Agents help your business today?
```

### Communication Style

**Tone Adaptation:**
- **Analytical clients:** Emphasize metrics and ROI
- **Visionary clients:** Highlight innovative possibilities and future advantages
- **Pragmatic clients:** Lead with implementation ease and immediate benefits

**Response Guidelines:**
- Typically 3 sentences or fewer
- Thoughtful and concise
- Actively reference conversation history
- Watch for buying signals or hesitations

**Natural Speech Patterns:**
- Ellipses ("...") for distinct pauses
- Clearly pronounce special characters
- Spell out acronyms
- Brief affirmations ("got it," "sure thing")
- Occasional filler words ("actually," "so," "you know," "uhm")
- Subtle disfluencies (false starts, mild corrections)

### Sales Approach

**Primary Mission:**
- Secure buy-in from decision-makers
- Convey immediate and long-term advantages
- Position as trusted partner
- Show easy implementation with minimal overhead

**Focus Areas:**
- Reducing costs
- Upgrading customer service
- Unlocking new revenue streams
- Real-time interaction handling
- Knowledge base integrations
- High-volume scalability

### Guardrails
- Focus on benefits and solutions (not technical specs unless requested)
- Never mention being an AI unless asked
- Treat vague requirements as opportunities to clarify
- Never repeat same statement multiple ways
- Address objections immediately
- Mirror client's communication style
- For booking requests: redirect to sales team at "elevenlabs dot io slash contact dash sales"

---

## Common Configuration

### Language & Timezone
- **Default Language:** English (en)
- **Language Detection:** Enabled
- **Timezone:** America/Chicago (Production Agent)

### Conversation Settings
- **Text Only Mode:** Supported
- **Max Duration:** 600 seconds (10 minutes)
- **Client Events Tracked:**
  - Audio
  - Interruption
  - User transcript
  - Agent response
  - Agent response correction

### Turn Configuration
- **Turn Timeout:** 7.0 seconds
- **Silence End Call Timeout:** -1.0 (disabled)
- **Turn Eagerness:** Normal (not eager)
- **Soft Timeout Message:** "Hhmmmm...yeah give me a second..."

### ASR (Automatic Speech Recognition)
- **Quality:** HIGH
- **Provider:** ElevenLabs
- **Audio Format:** PCM 16000Hz
- **Background Voice Detection:** Disabled

### TTS (Text-to-Speech)
- **Model:** eleven_turbo_v2
- **Audio Format:** PCM 16000Hz
- **Pronunciation Dictionary:** None configured

### RAG (Retrieval Augmented Generation)
- **Enabled:** No (both agents)
- **Embedding Model:** e5_mistral_7b_instruct (if enabled)
- **Max Vector Distance:** 0.6
- **Max Documents Length:** 50,000 tokens
- **Max Retrieved Chunks:** 20

---

## Platform Settings

### Widget Configuration
Both agents support widget deployment with:
- **Variant:** Full
- **Placement:** Bottom-right
- **Avatar:** Orb style
  - Production Agent: Blue (#2792dc → #9ce6e6)
  - Sales Agent: Purple (#d426ef → #8ddff6)
- **Feedback Mode:**
  - Production Agent: During call
  - Sales Agent: None
- **Text Input:** Enabled
- **Transcript:** Disabled
- **Mic Muting:** Disabled

### Data Collection & Privacy
- **Record Voice:** Yes (both agents)
- **Retention Days:** -1 (indefinite)
- **Delete Transcript/PII:** No
- **Delete Audio:** No
- **Zero Retention Mode:** No

### Guardrails & Moderation
**Currently DISABLED for both agents:**
- Sexual content blocking: OFF
- Violence detection: OFF
- Harassment detection: OFF
- Hate speech detection: OFF
- Self-harm detection: OFF

> ⚠️ **Recommendation:** Consider enabling moderation guardrails in production environments

### Call Limits
**Production Agent:**
- Agent concurrency limit: 1
- Daily limit: 100,000 calls
- Bursting: Disabled

**Sales Agent:**
- Agent concurrency limit: -1 (unlimited)
- Daily limit: 100,000 calls
- Bursting: Enabled

---

## Integration Points

### Twilio Integration (Production Agent Only)
- **Phone Number:** +19724262821
- **Provider:** Twilio
- **Supports Inbound:** Yes
- **Supports Outbound:** Yes
- **Phone Number ID:** `phnum_1501k979j4rsfed93m6kxpd0g35s`
- **ConversationRelay:** Enabled with native ElevenLabs support
- **Bidirectional WebSocket:** Audio streams
- **Status Webhooks:** Call lifecycle events

### Webhook Configuration
Both agents configured for:
- **Events:** Transcript
- **Send Audio:** No
- **Post-Call Webhook:** Not configured

---

## Access & Permissions

All agents:
- **Creator:** Jeffrey Price (teampricehomes@gmail.com)
- **Role:** Admin
- **Archived:** No
- **Is Creator:** Yes

---

## API Endpoints

### Get All Agents
```bash
GET https://api.elevenlabs.io/v1/convai/agents
Headers: xi-api-key: {API_KEY}
```

### Get Specific Agent
```bash
GET https://api.elevenlabs.io/v1/convai/agents/{agent_id}
Headers: xi-api-key: {API_KEY}
```

### Start Agent Call
```bash
POST https://api.elevenlabs.io/v1/convai/conversation
Body: {
  "agent_id": "agent_2201k95pnb1beqp9m0k7rs044b1c",
  "chat_history_override": [...],
  "variables": {
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
}
```

---

## Performance Metrics (Production Agent - Sydney)

### Target KPIs
- Appointment Setting Rate: >18%
- Call Completion Rate: >60%
- Objection Resolution Rate: High
- Average Call Length: 3-5 minutes

### Success Metrics Tracked
- Appointment setting rate
- Call completion rate
- Homeowner satisfaction
- Objection resolution rate
- Average call length

---

## Key Differences Between Agents

| Feature | Production Agent (Sydney) | Sales Agent (Harper) |
|---------|---------------------------|----------------------|
| **Primary Use** | Real estate cold calling | Demo/template agent |
| **LLM Model** | Qwen 3 30B (qwen3-30b-a3b) | Google Gemini 2.5 Flash |
| **Temperature** | 1.0 (creative) | 0.5 (balanced) |
| **Voice Speed** | 0.88x (slower) | 1.0x (normal) |
| **Stability** | 0.4 (more variation) | 0.5 (more stable) |
| **Similarity Boost** | 0.45 (moderate) | 0.8 (high) |
| **Latency Optimization** | Level 2 | Level 3 (more aggressive) |
| **Dynamic Variables** | 10 (property/homeowner data) | 0 (none) |
| **Phone Number** | +19724262821 | None |
| **Backup LLM Strategy** | Override (custom order) | Default |
| **Concurrency Limit** | 1 | Unlimited |
| **Bursting** | Disabled | Enabled |
| **Target Audience** | Homeowners 60+ | Business decision-makers |
| **Compliance Focus** | TCPA 2025 | General sales |

---

## Archived/Removed Agents

The following agents mentioned in previous documentation are no longer active:

### Sarah (Real Estate Consultant)
- **Old Agent ID:** `agent_0401k87t75shf0cbt0bnpq35f0w3`
- **Status:** Agent not found (replaced by Production Agent)
- **Note:** Configuration and strategy migrated to Production Agent (Sydney)

### Carmela
- **Old Agent ID:** `agent_6401k7frm7t9erdt0pkaf7pp7cpj`
- **Status:** Agent not found

### Support Agent
- **Old Agent ID:** `agent_1601k7fphf18faytepd5hjkjedqh`
- **Status:** Agent not found

---

## Next Steps

1. ✅ **Configuration Retrieved** - Complete agent details documented
2. **Test Production Agent** - Validate calling flows and dynamic variables
3. **Configure Webhooks** - Set up post-call transcript delivery
4. **Enable Monitoring** - Implement call analytics and performance tracking
5. **Knowledge Base** - Add RAG documents for enhanced responses (currently disabled)
6. **Compliance Review** - Verify TCPA compliance in pre-production
7. **Enable Guardrails** - Consider enabling content moderation for production
8. **Sales Agent Customization** - Clone and customize Harper for business use cases

---

## Notes

- Both agents use the same voice (`yM93hbw8Qtvdma2wCnJG`) but with different stability/speed settings
- Production Agent has extensive TCPA compliance built into prompt
- RAG is currently disabled for both agents - no knowledge base documents loaded
- All moderation guardrails are disabled - consider enabling for production
- Production Agent uses Qwen 3 30B (Chinese model) - may want to test Claude or GPT-4 alternatives
- Sales Agent is a template/demo - not configured for production use
- Backup LLM configuration includes Claude Sonnet 4.5 and GPT-5 (Production Agent)

---

Last Updated: 2025-11-07
