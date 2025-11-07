# Claude Code Workflows for Next Level Real Estate

Step-by-step workflows for common tasks using Claude Code with the elevenlabs-agent-manager subagent and specialized skills.

## Table of Contents

1. [Creating a New Agent](#workflow-1-creating-a-new-agent)
2. [Testing Outbound Calls](#workflow-2-testing-outbound-calls)
3. [Debugging Agent Issues](#workflow-3-debugging-agent-issues)
4. [Optimizing Agent Performance](#workflow-4-optimizing-agent-performance)
5. [A/B Testing Agents](#workflow-5-ab-testing-agents)
6. [Setting Up Twilio Integration](#workflow-6-setting-up-twilio-integration)
7. [Analyzing Call Transcripts](#workflow-7-analyzing-call-transcripts)
8. [Updating Agent Knowledge Base](#workflow-8-updating-agent-knowledge-base)

---

## Workflow 1: Creating a New Agent

**Goal:** Create a production-ready conversational AI agent for outbound calling

**Duration:** 2-4 hours

**Prerequisites:**
- ElevenLabs API key configured
- MCP server running
- Clear understanding of agent purpose

### Steps

#### 1. Define Agent Requirements

**In Claude Code:**
```
> Help me define the requirements for a wholesale lead qualification agent

> What success metrics should I track?
```

**Expected Output:**
- Agent purpose statement
- Target audience
- Success criteria
- Key conversation points

**Document:** Create `agents/lead-qualifier-requirements.md`

#### 2. Research Best Practices

**In Claude Code:**
```
> Use the agent manager to research best practices for real estate conversational AI agents

> What are successful conversation patterns for lead qualification?
```

**Expected Output:**
- Industry best practices
- Successful conversation examples
- Common pitfalls to avoid

#### 3. Select Voice

**In Claude Code:**
```
> Use the agent manager with agent-tuning skill to help me select the best voice

> I need a professional, warm female voice for B2C real estate calls
```

**Agent Manager Actions:**
1. Lists available voices with filtering
2. Provides preview URLs for top 3-5 candidates
3. Recommends based on criteria

**Your Actions:**
1. Listen to preview URLs
2. Rate voices on warmth, professionalism, clarity
3. Select final voice ID

**Expected Output:**
```
Selected Voice:
- Name: Rachel
- ID: 21m00Tcm4TlvDq8ikWAM
- Category: Professional
- Rationale: Clear, warm, professional tone ideal for sales
```

#### 4. Engineer System Prompt

**In Claude Code:**
```
> Use agent-tuning to create an optimized system prompt for a wholesale lead qualification agent

> The agent should:
> - Qualify leads in under 3 minutes
> - Assess motivation, timeline, and property condition
> - Schedule viewings for qualified leads
> - Maintain empathy and professionalism
> - Follow TCPA compliance
```

**Expected Output:**
- Complete system prompt (500-1000 words)
- Structured with objectives, guidelines, constraints
- Includes context usage instructions
- Has opt-out handling

**Document:** Save to `agents/prompts/lead-qualifier-v1.txt`

#### 5. Create Agent

**In Claude Code:**
```
> Use the agent manager to create a lead qualification agent with:
> - Name: "Lead Qualifier V1"
> - Voice: 21m00Tcm4TlvDq8ikWAM
> - Model: eleven_flash_v2_5
> - Greeting: [your greeting]
> - System Prompt: [from step 4]
> - Enable TCPA compliance
> - Enable recording consent
```

**Agent Manager Actions:**
1. Validates configuration
2. Creates agent via MCP tool
3. Returns agent ID

**Expected Output:**
```
✓ Agent created successfully!

Agent ID: agent_abc123xyz
Name: Lead Qualifier V1
Status: active
Created: 2025-01-07T10:30:00Z
```

**Document:** Add to `agents/registry.md`

#### 6. Initial Test Call

**In Claude Code:**
```
> Test agent_abc123xyz with a motivated seller scenario:
> - Lead: John Smith
> - Property: 123 Main St, Austin TX
> - Motivation: Probate
> - Timeline: Urgent (30 days)
> - Estimated value: $250,000
```

**Agent Manager Actions:**
1. Prepares test context
2. Starts conversation via MCP
3. Monitors call status
4. Retrieves transcript

**Your Actions:**
1. Answer test call
2. Act as motivated seller
3. Note any issues

**Expected Output:**
- Call transcript
- Sentiment analysis
- Duration metrics
- Issues identified (if any)

#### 7. Review and Iterate

**In Claude Code:**
```
> Analyze the test call transcript and identify improvements

> What worked well? What should be changed?
```

**Expected Analysis:**
- Strengths of current configuration
- Specific issues to address
- Recommended changes

**If changes needed:**
```
> Update agent_abc123xyz with:
> - [specific change 1]
> - [specific change 2]
```

#### 8. Documentation

**In Claude Code:**
```
> Generate complete documentation for agent_abc123xyz
```

**Expected Output:**
- Agent configuration file
- System prompt
- Test results
- Known issues
- Performance baselines

**Save to:** `agents/lead-qualifier-v1/`

---

## Workflow 2: Testing Outbound Calls

**Goal:** Validate agent performance with comprehensive testing

**Duration:** 2-3 hours

**Prerequisites:**
- Agent created and configured
- Twilio integration set up
- Test phone numbers available

### Steps

#### 1. Prepare Test Scenarios

**In Claude Code:**
```
> Create test scenarios for agent_abc123xyz covering:
> - Motivated seller (probate)
> - Investor looking to sell
> - Foreclosure situation
> - Not interested/unqualified lead
```

**Expected Output:**
```json
{
  "scenarios": [
    {
      "name": "motivated_seller_probate",
      "leadData": {
        "name": "John Smith",
        "phone": "+1234567890",
        "motivation": "probate",
        "timeline": "urgent"
      },
      "propertyInfo": {
        "address": "123 Main St",
        "estimatedValue": 250000,
        "condition": "needs_repairs"
      },
      "expectedOutcome": "qualified"
    },
    // ... more scenarios
  ]
}
```

**Save to:** `tests/scenarios/lead-qualifier-scenarios.json`

#### 2. Execute Test Suite

**In Claude Code:**
```
> Use the agent manager with twilio-testing skill to run all scenarios for agent_abc123xyz

> Measure: connect rate, call duration, sentiment, audio quality, context usage
```

**Agent Manager Actions:**
1. Loads test scenarios
2. Executes each call via Twilio + ElevenLabs
3. Collects metrics
4. Analyzes transcripts

**Your Actions:**
1. Answer each test call
2. Follow scenario script
3. Note any issues in real-time

#### 3. Review Test Results

**Expected Output:**
```
Test Results: agent_abc123xyz

Scenarios Tested: 4
Successful Calls: 4 (100%)
Average Duration: 2m 45s

Metrics:
- Connect Rate: 100%
- Avg Response Latency: 142ms
- Audio Quality Score: 0.92
- Positive Sentiment: 75%
- Context Usage: 100% (name and address used in all calls)

Issues Found:
1. Slight hesitation when handling foreclosure topic
2. Could be more empathetic in probate scenario

Recommendations:
- Update system prompt with more empathy guidance for probate
- Add knowledge base entry for foreclosure objection handling
```

#### 4. Address Issues

**In Claude Code:**
```
> Based on test results, update agent_abc123xyz to be more empathetic in probate scenarios and improve foreclosure handling
```

#### 5. Regression Test

**In Claude Code:**
```
> Re-run probate and foreclosure scenarios to validate improvements
```

#### 6. Generate Test Report

**In Claude Code:**
```
> Generate a comprehensive test report for agent_abc123xyz
```

**Save to:** `tests/reports/lead-qualifier-v1-test-report.md`

---

## Workflow 3: Debugging Agent Issues

**Goal:** Diagnose and resolve agent problems systematically

**Duration:** 30 minutes - 2 hours (depending on issue)

**Prerequisites:**
- Issue description or conversation ID
- Access to logs and transcripts

### Steps

#### 1. Gather Initial Information

**In Claude Code:**
```
> I'm having issues with agent_abc123xyz. The symptoms are:
> - [describe symptoms]
>
> Recent conversation IDs: [conv_123, conv_456]
```

#### 2. Invoke Debugging Skill

**In Claude Code:**
```
> Use the agent manager with agent-debugging skill to diagnose:
> - Why conversation_conv_123 failed
> - Why audio quality is poor on conv_456
```

**Agent Manager Actions:**
1. Retrieves conversation details
2. Analyzes transcripts
3. Checks agent configuration
4. Reviews error logs
5. Identifies patterns

#### 3. Review Diagnostic Report

**Expected Output:**
```
Diagnostic Report: agent_abc123xyz

Issue: Poor audio quality with choppy voice

Root Cause Analysis:
- Model: Using eleven_multilingual_v2 (200ms latency)
- Voice Settings: Stability too low (0.3)
- Network: No issues detected
- Configuration: Sub-optimal for real-time calls

Evidence:
- Average response latency: 387ms (target <200ms)
- Multiple dropouts detected in transcripts
- User confusion indicators: 3 "What?" instances

Primary Cause: Model too slow for natural conversation
Contributing Factor: Voice stability setting too low

Recommended Fix:
1. Switch to eleven_flash_v2_5 model
2. Increase voice stability to 0.5
3. Enable speaker boost for clarity
```

#### 4. Implement Fix

**In Claude Code:**
```
> Apply the recommended fixes to agent_abc123xyz
```

**Agent Manager Actions:**
1. Updates agent configuration
2. Validates changes
3. Confirms update successful

#### 5. Verify Fix

**In Claude Code:**
```
> Test agent_abc123xyz with the same scenario that had issues
```

**Compare:**
- Before metrics
- After metrics
- Transcript quality

#### 6. Document Resolution

**In Claude Code:**
```
> Document the issue and resolution in the troubleshooting runbook
```

**Add to:** `docs/troubleshooting/audio-quality-issues.md`

---

## Workflow 4: Optimizing Agent Performance

**Goal:** Continuously improve agent effectiveness

**Duration:** Ongoing (weekly review)

**Prerequisites:**
- Agent in production
- At least 50-100 calls completed
- Metrics collection enabled

### Steps

#### 1. Collect Performance Data

**In Claude Code:**
```
> Use the agent manager to analyze performance for agent_abc123xyz over the last week

> Include: call metrics, sentiment analysis, qualification rate, common conversation patterns
```

**Expected Output:**
```
Performance Analysis: agent_abc123xyz
Period: Jan 1-7, 2025
Total Calls: 247

Key Metrics:
- Connect Rate: 78% (target: >75%) ✓
- Avg Duration: 3m 42s (target: 2-4min) ✓
- Positive Sentiment: 71% (target: >65%) ✓
- Qualification Rate: 46% (target: >45%) ✓
- Cost per Qualified Lead: $3.45

Top Performing Elements:
1. Opening with property address mention (82% positive)
2. Empathy statements during motivation discussion (79% positive)
3. Flexible viewing scheduling approach (67% conversion)

Improvement Opportunities:
1. Reduce negative sentiment (7% current, target <5%)
2. Increase qualification rate (current 46%, target 50%)
3. Optimize for shorter calls (avg 3m42s, target 3m)
```

#### 2. Identify Optimization Target

**In Claude Code:**
```
> Based on this analysis, what's the highest-impact optimization we can make?
```

**Agent Manager Response:**
```
Recommended Optimization: Improve qualification rate

Rationale:
- Currently at 46%, just above target (45%)
- Increasing to 50% would add 10 qualified leads/week
- Lower hanging fruit than reducing sentiment (already good)
- More impact than duration optimization

Approach:
- Analyze transcripts from qualified vs unqualified calls
- Identify differentiating factors
- Extract successful qualification patterns
- Update system prompt with techniques
```

#### 3. Analyze Successful Patterns

**In Claude Code:**
```
> Analyze the last 50 qualified vs 50 unqualified calls

> What differentiated the successful qualifications?
```

**Expected Insights:**
```
Qualification Pattern Analysis:

Successful Qualifications (50 calls):
- Asked about timeline within first minute (94%)
- Used specific urgency language (86%)
- Mentioned "as-is" purchase 3+ times (78%)
- Adapted empathy to motivation type (91%)

Unsuccessful Qualifications (50 calls):
- Generic timeline question (67%)
- Limited urgency emphasis (34%)
- Didn't emphasize as-is capability (45%)
- Same empathy approach regardless of motivation (71%)

Key Differentiator:
Early timeline assessment and emphasizing as-is purchase capability
significantly increases qualification rate.
```

#### 4. Update Agent Configuration

**In Claude Code:**
```
> Update agent_abc123xyz system prompt to:
> 1. Ask about timeline within first 60 seconds
> 2. Emphasize "as-is" purchase capability early
> 3. Adapt empathy language based on motivation type
```

#### 5. A/B Test (Optional)

**In Claude Code:**
```
> Create agent_abc123xyz_variant with the updated prompt for A/B testing

> Run both versions in parallel for 100 calls each
```

#### 6. Monitor Results

**In Claude Code:**
```
> Track performance for both variants and compare after 100 calls each
```

#### 7. Deploy Winner

**If variant performs better:**
```
> Make agent_abc123xyz_variant the primary agent and archive the original
```

#### 8. Update Knowledge Base

**In Claude Code:**
```
> Add successful qualification patterns to the knowledge base
```

---

## Workflow 5: A/B Testing Agents

**Goal:** Test variations to find optimal configuration

**Duration:** 1-2 weeks (test period)

**Prerequisites:**
- Baseline agent with stable performance
- Clear hypothesis about improvement
- Ability to split traffic

### Steps

#### 1. Form Hypothesis

**In Claude Code:**
```
> I want to test if a more casual greeting improves engagement

> Current greeting: "Hi [name], this is Sarah from Next Level Real Estate. I saw you inquired about your property at [address]."

> Proposed greeting: "Hey [name]! Sarah here from Next Level. Just following up on your inquiry about [address] - got a quick minute?"
```

#### 2. Create Variant Agent

**In Claude Code:**
```
> Use the agent manager to create a variant of agent_abc123xyz with the casual greeting

> Name it: agent_abc123xyz_casual_greeting
```

#### 3. Define Success Metrics

**In Claude Code:**
```
> What metrics should I track to determine if the casual greeting is better?
```

**Expected Response:**
```
Primary Metrics:
1. Positive Sentiment Rate (first 30 seconds)
2. Completion Rate (did call reach goal?)
3. Qualification Rate

Secondary Metrics:
4. Average call duration
5. Objection rate
6. Opt-out requests

Sample Size:
- Minimum 100 calls per variant
- Target 95% confidence
```

#### 4. Run Test

**In Claude Code:**
```
> Run A/B test:
> - Control: agent_abc123xyz (50% traffic)
> - Variant: agent_abc123xyz_casual_greeting (50% traffic)
> - Duration: 1 week or 200 total calls
```

#### 5. Monitor Progress

**Daily check-in:**
```
> Show current A/B test results for the greeting test
```

#### 6. Analyze Results

**After reaching sample size:**
```
> Use the agent manager to analyze A/B test results and determine winner

> Include statistical significance calculation
```

**Expected Output:**
```
A/B Test Results: Greeting Comparison

Control (Professional Greeting):
- Calls: 105
- Positive Sentiment: 71%
- Completion Rate: 84%
- Qualification Rate: 46%

Variant (Casual Greeting):
- Calls: 108
- Positive Sentiment: 68%
- Completion Rate: 81%
- Qualification Rate: 43%

Statistical Significance:
- Confidence: 92%
- Result: No significant difference

Winner: CONTROL (professional greeting)

Recommendation: Keep professional greeting. Casual approach did not
improve metrics and showed slight negative trend. Test a different
variable instead (e.g., question ordering, value proposition).
```

#### 7. Document Learnings

**In Claude Code:**
```
> Document the A/B test results and learnings in the knowledge base
```

---

## Workflow 6: Setting Up Twilio Integration

**Goal:** Configure Twilio Voice API with ElevenLabs ConversationRelay

**Duration:** 2-4 hours

**Prerequisites:**
- Twilio account
- ElevenLabs account with agent created
- Server with public endpoint

### Steps

#### 1. Twilio Account Setup

**Manual Steps:**
1. Create Twilio account at twilio.com
2. Navigate to Console Dashboard
3. Note Account SID and Auth Token
4. Purchase or verify phone number

#### 2. Environment Configuration

**In Claude Code:**
```
> Help me set up environment variables for Twilio integration

> I have:
> - Twilio Account SID: ACxxxxxx
> - Twilio Auth Token: [token]
> - Twilio Phone Number: +1234567890
> - ElevenLabs API Key: [key]
```

**Expected Output:**
`.env` file with proper format and security notes

#### 3. Install Dependencies

**In Claude Code:**
```bash
cd services/calling-service
npm install twilio express dotenv
```

#### 4. Create Twilio Client Service

**In Claude Code:**
```
> Create a Twilio client service module at services/calling-service/src/clients/twilio.ts

> It should support:
> - Initiating outbound calls
> - Getting call status
> - Hanging up calls
> - Handling webhooks
```

**Agent Manager Actions:**
1. Creates client module with best practices
2. Includes error handling
3. Adds TypeScript types
4. Implements retry logic

#### 5. Create Webhook Handler

**In Claude Code:**
```
> Create webhook routes for Twilio TwiML and status callbacks

> Routes needed:
> - POST /twiml/:conversationId (returns TwiML for ConversationRelay)
> - POST /status/:conversationId (handles call status updates)
```

#### 6. Test Webhook Locally

**In Claude Code:**
```
> Use twilio-testing skill to set up ngrok and test webhook locally
```

**Agent Manager Actions:**
1. Guides ngrok setup
2. Creates test endpoint
3. Validates TwiML response
4. Tests status callbacks

#### 7. Execute Test Call

**In Claude Code:**
```
> Use twilio-testing to execute a complete test call

> Test number: +1234567890
> Agent: agent_abc123xyz
> Scenario: Basic greeting and response test
```

#### 8. Verify Integration

**Checklist:**
- [ ] Call connects successfully
- [ ] TwiML webhook called
- [ ] ElevenLabs agent responds
- [ ] Audio is clear
- [ ] Status callbacks received
- [ ] Call completes gracefully

#### 9. Deploy to Production

**In Claude Code:**
```
> Create deployment checklist for Twilio integration to production
```

---

## Workflow 7: Analyzing Call Transcripts

**Goal:** Extract insights from conversation data

**Duration:** 1-2 hours

**Prerequisites:**
- Multiple completed calls
- Transcripts available
- Clear analysis objective

### Steps

#### 1. Collect Transcripts

**In Claude Code:**
```
> Retrieve transcripts for agent_abc123xyz from the last week

> Include: all completed calls, sentiment data, outcome
```

#### 2. Define Analysis Goals

**In Claude Code:**
```
> I want to analyze transcripts to:
> 1. Identify successful objection handling techniques
> 2. Find common drop-off points
> 3. Extract qualification questions that work best
```

#### 3. Perform Analysis

**In Claude Code:**
```
> Use the agent manager to analyze transcripts for agent_abc123xyz

> Focus on: objection handling, drop-off points, successful questions
```

**Expected Output:**
```
Transcript Analysis: agent_abc123xyz
Transcripts Analyzed: 247
Period: Jan 1-7, 2025

Objection Handling:
Top 3 objections:
1. "I'm not ready to sell yet" (67 occurrences)
   - Successful response: Emphasize no obligation, just exploring options
   - Success rate: 78%

2. "I want to list with a realtor first" (43 occurrences)
   - Successful response: Explain speed and as-is benefits
   - Success rate: 61%

3. "Your offer will be too low" (38 occurrences)
   - Successful response: Focus on net proceeds after repairs/fees
   - Success rate: 53%

Drop-off Points:
1. Financial questions (minute 2:30) - 18% drop-off
2. Property condition assessment (minute 3:15) - 12% drop-off
3. Viewing scheduling (minute 4:00) - 8% drop-off

Successful Questions:
1. "What's prompting you to consider selling?" (94% positive response)
2. "How soon are you looking to move?" (89% positive response)
3. "Can you tell me about the property's condition?" (81% positive response)

Recommendations:
1. Add objection handling scripts to knowledge base
2. Address financial questions earlier to reduce drop-off
3. Use proven questions in system prompt
```

#### 4. Extract Patterns

**In Claude Code:**
```
> Extract the top 10 most successful agent responses for the knowledge base
```

#### 5. Update Agent

**In Claude Code:**
```
> Update agent_abc123xyz with learnings from transcript analysis:
> - Add successful objection handling
> - Move financial discussion earlier
> - Emphasize proven questions
```

#### 6. Validate Improvements

**In Claude Code:**
```
> Test updated agent with objection scenarios to validate improvements
```

---

## Workflow 8: Updating Agent Knowledge Base

**Goal:** Enhance agent intelligence with new information

**Duration:** 1-2 hours

**Prerequisites:**
- Agent created
- New information to add (market data, scripts, FAQs)

### Steps

#### 1. Prepare Knowledge Documents

**In Claude Code:**
```
> Help me create knowledge base documents for agent_abc123xyz

> Topics needed:
> - 2025 Austin market trends
> - Common seller FAQs
> - Probate process overview
> - Foreclosure talking points
```

#### 2. Format for RAG

**In Claude Code:**
```
> Format this market data for optimal RAG retrieval:

[paste market data]
```

**Expected Output:**
```markdown
# Austin Real Estate Market Trends - 2025

## Key Statistics
- Median home price: $450,000 (up 3.2% YoY)
- Days on market: 42 (down from 48 in 2024)
- Inventory: 3.2 months (seller's market)

## When to Use
Reference when discussing property value or market conditions

## Examples
"The Austin market is strong right now with homes selling in about 42 days on average..."
```

#### 3. Upload to Knowledge Base

**In Claude Code:**
```
> Add these documents to agent_abc123xyz knowledge base:
> 1. austin-market-2025.md
> 2. seller-faqs.md
> 3. probate-guide.md
> 4. foreclosure-talking-points.md
```

#### 4. Update System Prompt

**In Claude Code:**
```
> Update agent_abc123xyz system prompt to reference the new knowledge base
```

#### 5. Test Knowledge Retrieval

**In Claude Code:**
```
> Test agent_abc123xyz with questions that should use the new knowledge:
> 1. "What's the Austin market like right now?"
> 2. "How does probate affect the selling timeline?"
> 3. "Can you buy my house if it's in foreclosure?"
```

#### 6. Validate Responses

**Review test call transcripts to ensure:**
- [ ] Agent references knowledge base correctly
- [ ] Information is accurate
- [ ] Usage feels natural
- [ ] No hallucinations or made-up data

---

## Quick Reference

### Common Agent Manager Commands

```
# Creation
> Create a [purpose] agent for [use case]

# Testing
> Test agent_[id] with [scenario]

# Optimization
> Analyze agent_[id] and suggest improvements

# Debugging
> Debug conversation_[id] - what went wrong?

# A/B Testing
> Create variant of agent_[id] with [change]

# Knowledge Base
> Add [document] to agent_[id] knowledge base
```

### Troubleshooting Workflows

**Issue: Agent not responding**
1. Get agent status
2. Check configuration
3. Verify voice ID
4. Test with minimal config

**Issue: Poor call quality**
1. Measure latency
2. Check model selection
3. Test voice settings
4. Verify network

**Issue: Context not used**
1. Verify context format
2. Check system prompt
3. Test context injection
4. Review transcript

---

**Last Updated:** 2025-01-07
**Maintainer:** Next Level Real Estate Team
