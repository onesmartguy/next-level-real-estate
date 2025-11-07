# Claude Code Best Practices for Next Level Real Estate

Comprehensive guide to using Claude Code effectively with ElevenLabs Conversational AI, Twilio integration, and the Next Level Real Estate platform.

## Table of Contents

1. [Working with Subagents](#working-with-subagents)
2. [Using Skills Effectively](#using-skills-effectively)
3. [MCP Server Integration](#mcp-server-integration)
4. [Agent Development Workflow](#agent-development-workflow)
5. [Testing & Quality Assurance](#testing--quality-assurance)
6. [Performance Optimization](#performance-optimization)
7. [Security & Compliance](#security--compliance)
8. [Team Collaboration](#team-collaboration)

---

## Working with Subagents

### What are Subagents?

Subagents are specialized AI assistants with:
- **Dedicated context windows** - Keep main conversation focused
- **Custom system prompts** - Expert behavior for specific domains
- **Configurable tool access** - Security through least privilege
- **Resumable sessions** - Continue previous work

### When to Use the elevenlabs-agent-manager Subagent

**Automatic Invocation:**
Claude Code will automatically invoke the subagent when you:
- Mention "ElevenLabs" or "Twilio"
- Discuss "conversational AI" or "voice agents"
- Work on agent configuration or testing
- Debug call quality or agent issues
- Optimize conversation flows

**Manual Invocation:**
```
> Use the elevenlabs-agent-manager subagent to create a lead qualification agent

> Have the agent manager debug the poor audio quality on conversation abc123

> Let the agent manager analyze recent call transcripts for optimization opportunities
```

### Best Practices for Subagent Usage

#### 1. Be Specific About Goals

**❌ Vague:**
```
> Create an agent
```

**✅ Specific:**
```
> Create a wholesale lead qualification agent that:
> - Qualifies motivated sellers in under 3 minutes
> - Assesses property condition and timeline
> - Schedules viewings for qualified leads
> - Uses a professional female voice
> - Maintains TCPA compliance
```

#### 2. Provide Context

**❌ No Context:**
```
> Test the agent
```

**✅ With Context:**
```
> Test agent_abc123 with these scenarios:
> 1. Motivated seller, probate situation, needs to sell in 30 days
> 2. Investor looking to sell rental property, no rush
> 3. Homeowner dealing with foreclosure, urgent timeline
>
> Measure: connect rate, call duration, sentiment, qualification rate
```

#### 3. Iterate Incrementally

```
# Session 1: Create baseline agent
> Create a lead qualification agent with basic configuration

# Session 2: Optimize voice
> Test 3 different voice options and select the best one

# Session 3: Improve prompts
> Analyze transcripts and update system prompt for better engagement

# Session 4: A/B test
> Create variant with different greeting and compare performance
```

#### 4. Leverage Skills

The subagent has access to three specialized skills:

```
> Use the agent-tuning skill to optimize the system prompt

> Invoke the twilio-testing skill to run end-to-end call tests

> Apply the agent-debugging skill to diagnose the connection issues
```

### Resuming Previous Sessions

Each subagent execution gets a unique agent ID and transcript. Resume for:
- Long-running analysis
- Multi-day optimization projects
- Continuous monitoring tasks

```
> Resume the agent optimization work from yesterday
```

Claude Code will automatically find the previous session transcript.

---

## Using Skills Effectively

### Available Skills

#### 1. agent-tuning
**Purpose:** Agent configuration and optimization

**When to use:**
- Creating new agents
- Selecting voices
- Engineering system prompts
- Configuring parameters
- A/B testing strategies
- Performance analysis

**Example invocations:**
```
> Use agent-tuning to help me select the best voice for a professional real estate agent

> Apply agent-tuning to analyze the performance of agent_abc123 over the last week

> Have agent-tuning create an A/B test plan for improving lead qualification rate
```

#### 2. twilio-testing
**Purpose:** Telephony integration testing and validation

**When to use:**
- Setting up Twilio integration
- Testing outbound calls
- Validating audio quality
- Configuring webhooks
- Measuring call metrics
- Debugging telephony issues

**Example invocations:**
```
> Use twilio-testing to execute an end-to-end test call

> Have twilio-testing validate our webhook endpoint configuration

> Apply twilio-testing to measure call quality metrics for the last 50 calls
```

#### 3. agent-debugging
**Purpose:** Troubleshooting and error diagnosis

**When to use:**
- Agent not responding correctly
- Call quality issues
- Connection failures
- Performance problems
- Analyzing error logs
- Investigating edge cases

**Example invocations:**
```
> Use agent-debugging to diagnose why conversation_xyz failed

> Have agent-debugging analyze the error logs from the last hour

> Apply agent-debugging to find the root cause of the audio latency issues
```

### Skill Invocation Patterns

#### Direct Invocation
```
> Use the agent-tuning skill
```
Claude will activate the skill and wait for specific instructions.

#### Task-Specific Invocation
```
> Use agent-tuning to create a system prompt for a follow-up campaign agent
```
Claude activates the skill with a specific goal.

#### Chained Skills
```
> First use agent-tuning to optimize the configuration,
> then use twilio-testing to validate the changes,
> and finally use agent-debugging to analyze any issues found
```

---

## MCP Server Integration

### Understanding the MCP Architecture

```
┌──────────────────┐
│  Claude Code     │
│  (Main Context)  │
└────────┬─────────┘
         │
         │ Invokes MCP tools
         ▼
┌──────────────────┐
│ mcp-elevenlabs-  │
│     server       │
└────────┬─────────┘
         │
         │ API calls
         ▼
┌──────────────────┐
│  ElevenLabs API  │
└──────────────────┘
```

### Available MCP Tools

The `mcp-elevenlabs-server` provides 9 tools:

#### Agent Management (4 tools)
1. `mcp__elevenlabs__elevenlabs_create_agent` - Create new agents
2. `mcp__elevenlabs__elevenlabs_get_agent` - Retrieve agent details
3. `mcp__elevenlabs__elevenlabs_list_agents` - List all agents
4. `mcp__elevenlabs__elevenlabs_update_agent` - Update agent config

#### Conversation Management (3 tools)
5. `mcp__elevenlabs__elevenlabs_start_conversation` - Initiate calls
6. `mcp__elevenlabs__elevenlabs_get_conversation` - Get call details
7. `mcp__elevenlabs__elevenlabs_list_conversations` - List all calls

#### Voice Management (2 tools)
8. `mcp__elevenlabs__elevenlabs_list_voices` - Browse voices
9. `mcp__elevenlabs__elevenlabs_get_voice` - Get voice details

### MCP Tool Usage Best Practices

#### 1. Use Through Subagent

**✅ Recommended:**
```
> Have the agent manager create a new lead qualification agent
```
The subagent will use `elevenlabs_create_agent` internally with proper validation.

**❌ Direct (Less Safe):**
```
> Use mcp__elevenlabs__elevenlabs_create_agent with {...raw config...}
```

#### 2. Let Subagent Handle Complex Workflows

**✅ High-level request:**
```
> Create and test a new agent for market research calls
```

The subagent will:
1. Use `list_voices` to find suitable voice
2. Use `create_agent` with optimized config
3. Use `start_conversation` for test call
4. Use `get_conversation` to analyze results
5. Use `update_agent` if improvements needed

#### 3. Chain Tools Logically

```
# Good sequence:
1. list_voices (find options)
2. get_voice (preview top candidates)
3. create_agent (using selected voice)
4. start_conversation (test call)
5. get_conversation (analyze results)
6. update_agent (improve based on feedback)
```

### MCP Server Configuration

#### Setup (One-Time)

1. **Build the server:**
```bash
cd mcp-servers/mcp-elevenlabs-server
npm install
npm run build
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env:
ELEVENLABS_API_KEY=your_key_here
```

3. **Add to Claude Desktop config:**

macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "elevenlabs": {
      "command": "node",
      "args": ["/path/to/mcp-servers/mcp-elevenlabs-server/dist/server.js"],
      "env": {
        "ELEVENLABS_API_KEY": "your_key_here"
      }
    }
  }
}
```

4. **Restart Claude Desktop**

#### Troubleshooting

**Issue: Tools not appearing**
```bash
# Check MCP server logs
# In Claude Code:
> Check if the MCP elevenlabs server is running

# Manually test:
cd mcp-servers/mcp-elevenlabs-server
npm start
```

**Issue: API errors**
```bash
# Verify API key
curl -H "xi-api-key: your_key" https://api.elevenlabs.io/v1/voices

# Check server logs
Grep mcp-servers/mcp-elevenlabs-server/logs/server.log "error"
```

---

## Agent Development Workflow

### The 5-Stage Agent Development Lifecycle

```
1. DESIGN    → Define purpose, goals, success criteria
2. CREATE    → Build agent with optimized configuration
3. TEST      → Validate with real scenarios
4. DEPLOY    → Launch to production with monitoring
5. OPTIMIZE  → Continuous improvement based on data
```

### Stage 1: Design

**Duration:** 1-2 hours

**Activities:**
1. Define agent purpose and objectives
2. Identify target use case and audience
3. Determine success metrics
4. Research voice and conversation best practices

**Claude Code Workflow:**
```
> Use the agent manager to research best practices for real estate lead qualification agents

> Help me define success criteria for a wholesale lead qualifier
```

**Deliverables:**
- Agent requirements document
- Success metrics defined
- Voice preferences noted
- Example conversation flows

### Stage 2: Create

**Duration:** 2-4 hours

**Activities:**
1. Select optimal voice
2. Engineer system prompt
3. Configure agent parameters
4. Set up knowledge base references
5. Enable compliance features

**Claude Code Workflow:**
```
> Use agent manager with agent-tuning skill to:
> 1. Help me select the best voice for a professional female agent
> 2. Create an optimized system prompt for lead qualification
> 3. Configure the agent with Flash 2.5 model and high interruption sensitivity
> 4. Enable TCPA compliance and recording consent
```

**Deliverables:**
- Agent created with ID
- Configuration documented
- Initial test call completed

### Stage 3: Test

**Duration:** 1-2 days

**Activities:**
1. Execute test calls with diverse scenarios
2. Measure audio quality and response latency
3. Validate context injection
4. Verify TCPA compliance
5. Analyze transcripts for quality

**Claude Code Workflow:**
```
> Use agent manager with twilio-testing skill to:
> Run comprehensive tests on agent_abc123:
> 1. Test with motivated seller scenario
> 2. Test with investor scenario
> 3. Test with urgent foreclosure scenario
> Measure: connect rate, duration, sentiment, audio quality
```

**Deliverables:**
- Test report with metrics
- Transcript analysis
- Issues identified
- Optimization recommendations

### Stage 4: Deploy

**Duration:** 1 day

**Activities:**
1. Deploy to production environment
2. Configure monitoring and alerting
3. Set up logging and metrics collection
4. Create operational runbook

**Claude Code Workflow:**
```
> Create a deployment checklist for agent_abc123

> Set up monitoring and alerting for production agents

> Generate an operational runbook for the support team
```

**Deliverables:**
- Production agent deployed
- Monitoring configured
- Runbook created
- Team trained

### Stage 5: Optimize

**Duration:** Ongoing

**Activities:**
1. Collect and analyze call data
2. Identify patterns in successful calls
3. Extract techniques for knowledge base
4. A/B test improvements
5. Update agent configurations

**Claude Code Workflow:**
```
> Use agent manager to:
> 1. Analyze the last 100 calls for agent_abc123
> 2. Identify top-performing conversation patterns
> 3. Create an A/B test to improve qualification rate
> 4. Update the system prompt with successful techniques
```

**Deliverables:**
- Weekly performance reports
- Updated agent configurations
- A/B test results
- Knowledge base updates

---

## Testing & Quality Assurance

### Test Pyramid for Conversational AI

```
        ┌─────────────┐
        │   E2E Tests │  (5% - Full call flow)
        └─────────────┘
       ┌───────────────┐
       │ Integration   │  (15% - Twilio + ElevenLabs)
       └───────────────┘
      ┌─────────────────┐
      │ Component Tests │  (30% - Agent config, context)
      └─────────────────┘
     ┌───────────────────┐
     │   Unit Tests      │  (50% - Voice validation, prompts)
     └───────────────────┘
```

### Test Checklist

#### Pre-Production Testing

**Agent Configuration:**
- [ ] Agent has valid voice ID
- [ ] Voice is available for TTS
- [ ] Model is supported (Flash/Turbo/Multilingual)
- [ ] System prompt is clear and specific
- [ ] Greeting is professional and concise
- [ ] TCPA compliance enabled
- [ ] Recording consent enabled

**Integration:**
- [ ] Webhook endpoint accessible (200 OK)
- [ ] TwiML response validates
- [ ] Twilio phone number active
- [ ] ElevenLabs API key valid
- [ ] ConversationRelay configured

**Functionality:**
- [ ] Test call connects successfully
- [ ] Agent greeting heard clearly
- [ ] Agent responds to user input
- [ ] Context injection working
- [ ] Call completes gracefully

**Quality:**
- [ ] Audio quality acceptable (no choppiness)
- [ ] Response latency <200ms
- [ ] Natural turn-taking
- [ ] No awkward pauses >3 seconds

**Compliance:**
- [ ] Recording disclosure present
- [ ] Company name stated
- [ ] Purpose explained
- [ ] Opt-out option available

### Automated Testing

#### Test Script Template

```typescript
// tests/agent.test.ts
import { describe, it, expect } from 'vitest'

describe('Lead Qualification Agent', () => {
  const agentId = 'agent_abc123'

  it('should connect successfully', async () => {
    const call = await testCall(agentId, {
      scenario: 'motivated_seller'
    })

    expect(call.status).toBe('completed')
    expect(call.duration).toBeGreaterThan(60)
    expect(call.duration).toBeLessThan(300)
  })

  it('should use lead context', async () => {
    const call = await testCall(agentId, {
      leadData: {
        name: 'John Smith',
        property: '123 Main St'
      }
    })

    const transcript = call.transcript.map(t => t.text).join(' ')

    expect(transcript).toContain('John')
    expect(transcript).toContain('Main St')
  })

  it('should maintain TCPA compliance', async () => {
    const call = await testCall(agentId)

    const transcript = call.transcript[0].text.toLowerCase()

    expect(transcript).toMatch(/recorded|recording/)
    expect(transcript).toContain('next level real estate')
  })

  it('should have acceptable audio quality', async () => {
    const call = await testCall(agentId)

    const quality = await measureAudioQuality(call.id)

    expect(quality.avgLatency).toBeLessThan(200)
    expect(quality.dropouts).toBe(0)
    expect(quality.clarificationRequests).toBeLessThan(2)
  })
})
```

#### Claude Code Test Execution

```
> Run the agent test suite and report results

> Test agent_abc123 with all scenarios in tests/scenarios.json

> Execute load test with 10 concurrent calls and measure performance
```

### Quality Metrics

Track these metrics for every agent:

```typescript
interface AgentQualityMetrics {
  // Connection
  connectRate: number          // % calls that connect
  avgDuration: number          // Average call length

  // Audio Quality
  avgResponseLatency: number   // Milliseconds
  audioQualityScore: number    // 0-1
  dropoutRate: number          // % calls with dropouts

  // Conversation Quality
  completionRate: number       // % reaching goal
  positiveSentiment: number    // % positive sentiment
  clarificationRate: number    // % needing clarifications

  // Business Outcomes
  qualificationRate: number    // % leads qualified
  conversionRate: number       // % scheduling viewings
  costPerLead: number          // $ per qualified lead
}
```

**Target Thresholds:**

| Metric | Target | Minimum | Alert If Below |
|--------|--------|---------|----------------|
| Connect Rate | >80% | >70% | 65% |
| Avg Response Latency | <150ms | <250ms | 300ms |
| Audio Quality | >0.9 | >0.7 | 0.6 |
| Completion Rate | >85% | >75% | 70% |
| Positive Sentiment | >70% | >60% | 55% |
| Qualification Rate | >50% | >40% | 35% |

---

## Performance Optimization

### Optimization Priorities

```
1. Latency      → <200ms response time (CRITICAL for naturalness)
2. Quality      → Clear audio, no dropouts
3. Context      → Proper use of lead data
4. Completion   → Reaching conversation goal
5. Cost         → Minimize per-call expense
```

### Latency Optimization

**Target:** <150ms average response latency

#### Model Selection
```
Flash 2.5:        75ms   (USE THIS)
Turbo 2.5:       120ms   (If higher quality needed)
Multilingual v2: 200ms   (Only if multi-language required)
```

#### Configuration
```typescript
{
  modelId: "eleven_flash_v2_5",
  responseLatency: 75,
  interruptionSensitivity: "high"
}
```

#### System Prompt Optimization
- Keep prompts under 500 words
- Remove verbose examples
- Use bullet points over paragraphs
- Reference external knowledge base for details

### Quality Optimization

#### Voice Settings
```typescript
{
  voiceSettings: {
    stability: 0.5,           // Balance natural vs consistent
    similarityBoost: 0.75,    // Closer to original voice
    style: 0.0,               // Neutral (use for sales)
    useSpeakerBoost: true     // Enhance clarity
  }
}
```

#### Turn-Taking
```typescript
{
  interruptionSensitivity: "high"  // More natural for sales calls
}
```

### Context Optimization

**Do:**
- ✅ Use flat, simple structures
- ✅ Clear, descriptive field names
- ✅ Reference context in system prompt
- ✅ Provide examples of context usage

**Don't:**
- ❌ Deeply nested objects
- ❌ Ambiguous field names
- ❌ Excessive data (keep under 2KB)
- ❌ Assume agent will discover context

### Cost Optimization

**Strategies:**

1. **Optimize call duration**
   - Set realistic maxDuration limits
   - Train agents to be concise
   - Identify and stop bad leads quickly

2. **Use appropriate model**
   - Flash 2.5 for most calls (cheapest)
   - Only use higher models when needed

3. **Reduce failed calls**
   - Validate phone numbers before calling
   - Check DNC registry
   - Verify consent

4. **Batch operations**
   - Update knowledge bases in bulk
   - Run analytics during off-peak hours

**Example Cost Analysis:**

```
Current:
- 1,000 calls/day
- Avg duration: 4 minutes
- Model: Turbo 2.5
- Cost: $0.08/minute
- Daily cost: 1,000 * 4 * $0.08 = $320

Optimized:
- 1,000 calls/day
- Avg duration: 3 minutes (improved qualification)
- Model: Flash 2.5
- Cost: $0.04/minute
- Daily cost: 1,000 * 3 * $0.04 = $120

Savings: $200/day = $6,000/month
```

---

## Security & Compliance

### TCPA Compliance (2025 Regulations)

**Critical Requirements:**

1. **Written Consent**
   - One-to-one consent required
   - Verbal agreements no longer acceptable
   - Must be documented in CRM

2. **Do Not Call Registry**
   - Check national DNC before calling
   - Maintain internal DNC list
   - 31-day scrub cycle

3. **Recording Disclosure**
   - Disclose at call start if recording
   - Cannot be buried in terms
   - Must be explicit

4. **Automated Call Restrictions**
   - Requires written consent
   - Manual dialing for cold prospects
   - Automated only for opted-in contacts

### Implementation

#### Pre-Call Validation

```typescript
async function validateCallCompliance(lead: Lead) {
  const issues = []

  // Check consent
  if (!lead.consent.hasWrittenConsent) {
    issues.push('No written consent on file')
  }

  if (lead.consent.expiresAt < new Date()) {
    issues.push('Consent expired')
  }

  // Check DNC
  if (await isOnDNCRegistry(lead.phone)) {
    issues.push('On national DNC registry')
  }

  if (lead.dncStatus.internalDNC) {
    issues.push('On internal DNC list')
  }

  // Check last scrub
  const daysSinceScrub = daysBetween(lead.dncStatus.lastCheckedAt, new Date())
  if (daysSinceScrub > 31) {
    issues.push('DNC check expired (>31 days)')
  }

  if (issues.length > 0) {
    throw new ComplianceError('Cannot call: ' + issues.join(', '))
  }
}
```

#### Agent Configuration

```typescript
const agent = await createAgent({
  // ...other config

  // MANDATORY compliance settings
  tcpaCompliance: true,
  recordingConsent: true,

  // Include disclosure in greeting
  greeting: `Hi ${leadName}, this is Sarah from Next Level Real Estate.
             This call may be recorded for quality and training purposes.
             Is now a good time to talk about your property?`,

  // Handle opt-outs in system prompt
  systemPrompt: `
    ...

    OPT-OUT HANDLING:
    If the person asks to be removed from the calling list or
    no longer wishes to be contacted:
    1. Apologize politely
    2. Confirm their request: "I understand, I'll make sure we
       don't contact you again."
    3. End the call immediately
    4. Flag account for internal DNC list

    NEVER try to convince them to stay on the call.
  `
})
```

#### Post-Call Compliance

```typescript
async function logCallForCompliance(call: Call) {
  await database.callLogs.insert({
    callSid: call.sid,
    conversationId: call.conversationId,
    leadId: call.leadId,
    phoneNumber: call.to,
    timestamp: new Date(),
    duration: call.duration,
    consentVerified: true,
    recordingUrl: call.recordingUrl,
    outcome: call.outcome,
    optOutRequested: call.optOutRequested,

    // Keep for 3 years per TCPA
    retentionDate: addYears(new Date(), 3)
  })

  // If opt-out requested
  if (call.optOutRequested) {
    await database.leads.update(call.leadId, {
      'dncStatus.internalDNC': true,
      'dncStatus.optOutDate': new Date(),
      'dncStatus.optOutSource': 'phone_call'
    })
  }
}
```

### Data Security

#### API Key Management

**Do:**
- ✅ Store in environment variables
- ✅ Use secrets manager in production
- ✅ Rotate keys quarterly
- ✅ Use separate keys per environment

**Don't:**
- ❌ Commit to git
- ❌ Share via email/chat
- ❌ Embed in client code
- ❌ Use same key everywhere

#### PII Protection

```typescript
// Mask sensitive data in logs
function maskPhone(phone: string): string {
  return phone.replace(/\d(?=\d{4})/g, '*')
}

logger.info('Call initiated', {
  conversationId: call.id,
  phone: maskPhone(call.to),  // *******6789
  agentId: call.agentId
})
```

---

## Team Collaboration

### Version Control

**What to commit:**
- ✅ `.claude/agents/` - Project subagents
- ✅ `.claude/skills/` - Project skills
- ✅ `mcp-servers/` - MCP server code
- ✅ `docs/claude-code/` - Documentation
- ✅ Test scripts and scenarios

**What NOT to commit:**
- ❌ `.env` files (API keys)
- ❌ `logs/` - Log files
- ❌ Personal subagents (`~/.claude/`)
- ❌ Conversation transcripts (unless anonymized)

### Documentation Standards

#### Agent Configuration

```markdown
# Agent: lead-qualifier-v2

## Purpose
Qualify wholesale real estate leads within 3 minutes.

## Configuration
- Voice: Rachel (21m00Tcm4TlvDq8ikWAM)
- Model: Flash 2.5
- Interruption Sensitivity: High
- Max Duration: 180s

## System Prompt
[Full prompt here]

## Performance
- Qualification Rate: 48%
- Positive Sentiment: 73%
- Avg Duration: 2m 47s

## Last Updated
2025-01-15 by John Smith

## Changelog
- 2025-01-15: Improved greeting to mention property address
- 2025-01-10: Increased interruption sensitivity
- 2025-01-05: Initial creation
```

### Knowledge Sharing

#### Weekly Agent Review

```markdown
# Agent Performance Review - Week of Jan 8-14, 2025

## Metrics
| Agent | Calls | Qual Rate | Sentiment | Issues |
|-------|-------|-----------|-----------|--------|
| lead-qualifier-v2 | 487 | 48% | 73% | None |
| follow-up-v1 | 203 | 34% | 61% | Low qual rate |

## Insights
1. lead-qualifier-v2 performing well with property address mention
2. follow-up-v1 needs system prompt optimization
3. Market research agent showing high sentiment but low conversion

## Action Items
- [ ] Update follow-up-v1 prompt (John)
- [ ] A/B test market research greeting (Sarah)
- [ ] Create knowledge base doc from successful transcripts (Mike)
```

### Onboarding Checklist

**New Team Member Setup:**

- [ ] Clone repository
- [ ] Install Claude Code CLI
- [ ] Configure MCP servers
- [ ] Set up environment variables
- [ ] Run test suite
- [ ] Read documentation
- [ ] Shadow agent creation session
- [ ] Create first agent with mentor
- [ ] Conduct independent test
- [ ] Review with team

---

## Quick Reference

### Common Commands

```bash
# Start MCP server
cd mcp-servers/mcp-elevenlabs-server && npm start

# Run tests
npm test

# View logs
tail -f logs/calling-service.log

# Analyze transcripts
Grep logs/combined.log "conversation_abc123"
```

### Useful Prompts

```
# Agent creation
> Use agent manager to create a [purpose] agent for [use case]

# Testing
> Test agent_[id] with [scenario] and measure [metrics]

# Optimization
> Analyze agent_[id] performance and suggest improvements

# Debugging
> Debug conversation_[id] - why did it fail?
```

### Key Metrics to Track

- **Connect Rate:** >75%
- **Avg Latency:** <200ms
- **Positive Sentiment:** >65%
- **Qualification Rate:** >45%
- **Cost per Qualified Lead:** <$5

---

## Resources

- [ElevenLabs Docs](https://elevenlabs.io/docs/conversational-ai/overview)
- [Twilio Voice API](https://www.twilio.com/docs/voice/api)
- [TCPA Compliance Guide](https://www.fcc.gov/general/telemarketing-and-robocalls)
- [Project CLAUDE.md](../../CLAUDE.md)
- [MCP Server README](../../mcp-servers/mcp-elevenlabs-server/README.md)

---

**Last Updated:** 2025-01-07
**Maintainer:** Next Level Real Estate Team
