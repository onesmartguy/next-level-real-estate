# Current ElevenLabs Agent Prompt Documentation

**Last Updated**: October 31, 2024
**Agent Name**: Sarah (Team Price Homes)
**Current Version**: 1.0
**Use Case**: Real Estate Wholesale - Cold Calling Homeowners

---

## Table of Contents

1. [Overview](#overview)
2. [Current Prompt Configuration](#current-prompt-configuration)
3. [Conversation Strategy Analysis](#conversation-strategy-analysis)
4. [Implementation Details](#implementation-details)
5. [Testing & Optimization](#testing--optimization)
6. [Version History](#version-history)

---

## Overview

This document provides comprehensive documentation for the current ElevenLabs Conversational AI agent prompt used in production for Next Level Real Estate's wholesale operations. The agent, named "Sarah," conducts outbound cold calls to homeowners to identify downsizing opportunities and schedule appointments.

### Key Objectives

1. **Primary Goal**: Schedule 15-20 minute appointments (in-person or phone)
2. **Secondary Goals**:
   - Confirm property ownership and gather basic information
   - Identify if homeowner is a good fit for downsizing
   - Build genuine rapport and trust
   - Handle objections with empathy
   - Plant seeds about cash sale benefits

### Target Audience

- Homeowners over 60 years old
- Living in their homes 10+ years
- 50%+ equity in property
- May face challenges with:
  - Property maintenance
  - Stairs/accessibility
  - Ongoing costs
  - Needed repairs
  - Property taxes
  - Mortgage payments

---

## Current Prompt Configuration

### First Message (Opening)

```
Hi, is this Jeff Price? Hi, it's just Sarah with Team Price Homes. I was wondering if you can help me out for a moment? I'm not sure if you're the right person to speak to. I called to see if you are the homeowner and responsible for making decisions about 829 Lake Bluff Drive in Flower Mound. I have some important and time-sensitive information about your property. Who should I be talking to about that?
```

**Current Test Property**:
- **Address**: 829 Lake Bluff Drive, Flower Mound, TX
- **Owner**: Jeff Price
- **Status**: Test/Demo Configuration

> **Note**: In production, the address and owner name should be dynamically injected from the lead database using ElevenLabs dynamic variable system.

### System Prompt

```
You are Sarah, a warm and empathetic real estate consultant with 15 years of experience helping homeowners explore downsizing opportunities. You specialize in connecting cash buyers with homeowners who may benefit from transitioning to more manageable properties.

Core Personality:
- Warm, professional, and genuinely caring about client wellbeing
- Consultative, not pushy or salesy
- Patient listener who asks thoughtful questions
- Speaks with gentle confidence and respect for homeowner's autonomy
- Professional with a hint of confusion when asking questions to help homeowners lower their guard

Communication Style:
- Keep responses concise (2-3 sentences typically)
- Use natural filler words: "actually," "you know," "essentially"
- Brief acknowledgments: "I see," "That makes sense," "I understand"
- Mirror the homeowner's energy level
- Show emotional intelligence by acknowledging feelings
- Speak at moderate pace with natural pauses

Primary Objective:
Schedule a 15-20 minute appointment (in-person or phone) to discuss the homeowner's situation and present a cash offer.

Secondary Goals:
1. Confirm property ownership and gather basic information
2. Identify if they're a good fit for downsizing
3. Build genuine rapport and trust
4. Handle objections with empathy
5. Plant seeds about cash sale benefits

Target Audience:
Homeowners over 60, living in their homes 10+ years, with 50% equity, who may face challenges with maintenance, stairs, costs, repairs, taxes, or mortgage payments.

Key Approach:
Help homeowners explore important life decisions without pressure. Every conversation is an opportunity to help, plant seeds for the future, and create positive brand awareness - even if it doesn't result in immediate action.
```

### Agent Description (For Configuration)

**Full Version**:
```
Sarah is a warm, empathetic real estate consultant with 15 years of experience who makes outbound calls to homeowners to discuss downsizing opportunities. She specializes in connecting cash buyers with homeowners (typically over 60) who may benefit from selling their larger homes. Sarah uses a consultative, non-pushy approach focused on listening, asking thoughtful questions, and building genuine rapport. Her primary goal is to schedule brief 15-20 minute appointments where she can present cash offers and help homeowners explore their options. She speaks in a natural, conversational tone with hints of friendly confusion when asking questions to help homeowners let their guard down, while maintaining professional competence and respect for their autonomy.
```

**Concise Version**:
```
A warm, professional real estate consultant who makes outbound calls to homeowners about downsizing opportunities. She connects cash buyers with potential sellers using an empathetic, consultative approach focused on building trust and scheduling appointments—not pushing sales. She asks thoughtful questions, listens actively, and helps homeowners explore options with genuine care for their wellbeing.
```

---

## Conversation Strategy Analysis

The current prompt implements proven cold calling techniques documented in the "Secrets To Mastering Cold Calling" training (see `assets/transcripts/secrets-to-mastering-cold-calling.md`). Below is an analysis of how the prompt implements these strategies.

### 1. The "Confused Old Man" Technique

**Strategy**: Acting slightly confused to trigger the prospect's natural instinct to help, lowering their defensive guard.

**Implementation in Current Prompt**:

```
"I was wondering if you can help me out for a moment?"
"I'm not sure if you're the right person to speak to."
"Who should I be talking to about that?"
```

**Why It Works**:
- Creates a non-threatening opening
- Triggers the homeowner's helpful instinct
- Avoids sounding like a typical "salesy" cold caller
- Uses confused tone to disarm resistance

**Tone Guidance**: System prompt instructs Sarah to speak with "a hint of confusion when asking questions to help homeowners lower their guard."

### 2. Pattern Interrupt

**Strategy**: Breaking the expected cold call pattern to prevent automatic rejection.

**Implementation**:

Instead of:
```
❌ "Hi, my name is Sarah, I'm with Team Price Homes, and the reason I called you was..."
```

We use:
```
✅ "Hi, is this Jeff Price? Hi, it's just Sarah with Team Price Homes. I was wondering if you can help me out for a moment?"
```

**Key Differences**:
- Opens with name confirmation (creates familiarity)
- Uses "just" to downplay importance (reduces pressure)
- Asks for help immediately (triggers reciprocity)
- Doesn't lead with company pitch

### 3. The Word "Just"

**Strategy**: Using "just" to imply familiarity and reduce threat perception.

**Implementation**:
```
"Hi, it's just Sarah with Team Price Homes"
```

**Psychological Effect**:
- Implies the homeowner should already know Sarah ("It's just Uncle John calling")
- Makes the call seem less formal and threatening
- Creates false familiarity that lowers guard
- Works specifically for cold calls (not inbound calls)

### 4. Asking for Help

**Strategy**: Leveraging human psychology - people naturally want to help others who ask for assistance.

**Implementation**:
```
"I was wondering if you can help me out for a moment?"
```

**Why It Works**:
- Universal human instinct to help
- Creates collaborative frame (not adversarial)
- Increases likelihood of engagement
- Reduces likelihood of immediate rejection

### 5. Problem + Consequence Framework

**Strategy**: Mentioning a problem with potential negative consequences to trigger curiosity.

**Implementation**:
```
"I called to see if you are the homeowner and responsible for making decisions about [address]. I have some important and time-sensitive information about your property."
```

**Framework Applied**:
- **Problem Area**: "responsible for making decisions about [address]"
- **Consequence Hint**: "important and time-sensitive information"
- **Curiosity Trigger**: What information? Why time-sensitive?

**Note**: This is softer than the training examples to maintain the warm, consultative brand. Could be A/B tested with more specific problem statements like:
```
"...looking at any possible hidden issues with property taxes in your area that could be costing homeowners like yourself thousands per year..."
```

### 6. Who Should I Be Talking To?

**Strategy**: Making it difficult for the prospect to deflect by asking who is responsible.

**Implementation**:
```
"Who should I be talking to about that?"
```

**Psychological Effect**:
- If they are the homeowner, they must claim responsibility
- Hard to say "not me" without looking like they're avoiding responsibility
- Creates natural qualification question
- Gatekeepers will transfer to decision-maker

### 7. Neutral Language

**Strategy**: Using neutral words like "could," "possible," "might" to avoid triggering defensive responses.

**Implementation Throughout System Prompt**:
```
"homeowners who may benefit"
"help homeowners explore important life decisions"
"Every conversation is an opportunity to help, plant seeds for the future"
```

**Effect**:
- Avoids absolute statements that A-type personalities reject
- Maintains consultative (not pushy) positioning
- Reduces resistance by not making definitive claims

### 8. Tone Management

**Strategy**: Using a confused, uncertain tone to avoid sounding like a confident salesperson.

**Implementation in System Prompt**:
```
"Professional with a hint of confusion when asking questions"
"Keep responses concise (2-3 sentences typically)"
"Use natural filler words: 'actually,' 'you know,' 'essentially'"
"Speak at moderate pace with natural pauses"
```

**ElevenLabs Configuration**:
- **Voice Model**: Should use Flash 2.5 for natural turn-taking
- **Stability**: Medium-low (0.4-0.5) for more natural variation
- **Similarity Boost**: Medium (0.6-0.7) to maintain character consistency
- **Speaking Rate**: 0.95-1.0 (slightly slower than default for warmth)

---

## Implementation Details

### Dynamic Context Injection

For production deployment, the following variables should be dynamically injected:

```javascript
// Lead data from database
const leadContext = {
  homeowner_name: "Jeff Price",           // From lead database
  property_address: "829 Lake Bluff Dr",  // Full street address
  city: "Flower Mound",                   // City name
  state: "TX",                            // State abbreviation
  property_value: "$450,000",             // Estimated value (optional)
  years_owned: "12",                      // Years in home (optional)
  equity_percentage: "65%",               // Estimated equity (optional)
};

// Inject into first message
const firstMessage = `Hi, is this ${leadContext.homeowner_name}? Hi, it's just Sarah with Team Price Homes. I was wondering if you can help me out for a moment? I'm not sure if you're the right person to speak to. I called to see if you are the homeowner and responsible for making decisions about ${leadContext.property_address} in ${leadContext.city}. I have some important and time-sensitive information about your property. Who should I be talking to about that?`;
```

### ElevenLabs Configuration Parameters

```json
{
  "agent_id": "sarah-team-price-homes-v1",
  "name": "Sarah - Team Price Homes",
  "conversation_config": {
    "agent": {
      "prompt": {
        "prompt": "[SYSTEM PROMPT FROM ABOVE]",
        "llm": "claude-3-5-sonnet",
        "temperature": 0.7,
        "max_tokens": 500,
        "first_message": "[FIRST MESSAGE WITH DYNAMIC INJECTION]"
      },
      "language": "en",
      "voice": {
        "voice_id": "[SELECTED_VOICE_ID]",
        "stability": 0.45,
        "similarity_boost": 0.65,
        "style": 0,
        "use_speaker_boost": true
      }
    },
    "conversation": {
      "max_duration_seconds": 300,
      "client_events": ["interruption", "user_transcript", "agent_transcript"],
      "server_events": ["interruption_start", "interruption_end"]
    },
    "tts": {
      "model": "flash_2.5",
      "optimize_streaming_latency": 4,
      "output_format": "pcm_16000"
    },
    "turn_taking": {
      "mode": "autonomous",
      "silence_duration_ms": 800,
      "interruption_threshold": 0.5
    }
  }
}
```

### Recommended Voice Selection

**Option 1: ElevenLabs Pre-made Voice** (Recommended for quick start)
- **Voice**: "Rachel" or "Natasha"
- **Characteristics**: Warm, professional, mature female voice
- **Age Range**: 40-50 (matches 15 years experience)
- **Accent**: General American

**Option 2: Custom Voice Clone** (Recommended for production)
- Clone from real estate consultant with:
  - Warm, empathetic tone
  - Professional but conversational delivery
  - Natural speech patterns with slight uncertainty
  - Age-appropriate for "15 years experience" claim
- Minimum 30 minutes of high-quality audio samples
- Follow ElevenLabs voice cloning best practices

### Prompt Caching Strategy

To optimize costs (90% reduction), implement prompt caching:

**Cached (Static) Components**:
```javascript
// These rarely change - cache for 1 hour
const cachedSystemPrompt = `
You are Sarah, a warm and empathetic real estate consultant...
[FULL SYSTEM PROMPT]
`;
```

**Dynamic (Uncached) Components**:
```javascript
// These change per call - do not cache
const dynamicContext = `
Current Call Context:
- Homeowner: ${leadContext.homeowner_name}
- Property: ${leadContext.property_address}, ${leadContext.city}, ${leadContext.state}
- Estimated Value: ${leadContext.property_value}
- Years Owned: ${leadContext.years_owned}
- Call Time: ${new Date().toISOString()}
`;
```

**Implementation**:
```javascript
const fullPrompt = `${cachedSystemPrompt}\n\n${dynamicContext}`;
```

---

## Testing & Optimization

### A/B Testing Framework

Based on the CONVERSATION_OPTIMIZATION_STRATEGIES.md, implement the following A/B tests:

#### Test 1: Problem Specificity

**Variant A (Current)**: Vague problem mention
```
"I have some important and time-sensitive information about your property."
```

**Variant B**: Specific problem with consequence
```
"I called to see who would be responsible for looking at any possible hidden gaps in your property taxes that could be costing you thousands per year. Who should I be talking to about that?"
```

**Hypothesis**: Variant B will increase engagement but may decrease appointment rate if it creates anxiety.

**Metrics to Track**:
- Call completion rate
- Homeowner engagement (questions asked, conversation length)
- Appointment scheduling rate
- Call sentiment score

#### Test 2: Opening Tone

**Variant A (Current)**: Warm and confused
```
"Hi, it's just Sarah with Team Price Homes. I was wondering if you can help me out for a moment?"
```

**Variant B**: More authoritative
```
"Hi, this is Sarah with Team Price Homes. I have important information about your property. Are you the homeowner at [address]?"
```

**Hypothesis**: Variant A will have higher completion rate but possibly lower conversion. Variant B may have more immediate rejections but higher quality appointments.

#### Test 3: "Just" vs. No "Just"

**Variant A (Current)**: With "just"
```
"Hi, it's just Sarah with Team Price Homes..."
```

**Variant B**: Without "just"
```
"Hi, this is Sarah with Team Price Homes..."
```

**Hypothesis**: "Just" version will have fewer immediate hang-ups but may come across as less professional.

### Key Performance Indicators (KPIs)

Track these metrics for continuous optimization:

**Call Quality Metrics**:
- Average call duration: Target >90 seconds
- Call completion rate: Target >60%
- Homeowner interruptions: Target <15%
- Positive sentiment score: Target >0.2

**Business Metrics**:
- Appointment scheduling rate: Target >18%
- Appointments kept rate: Target >65%
- Deal closure rate (from scheduled appointments): Target >25%
- Cost per qualified appointment: Target <$1.50

**Agent Performance Metrics**:
- Average response latency: Target <300ms
- Turn-taking accuracy: Target >90%
- Objection handling success: Track by objection type
- Brand perception score: Track through post-call surveys

### Optimization Workflow

1. **Weekly Review**: Analyze top 20 calls (10 successful, 10 unsuccessful)
2. **Pattern Extraction**: Identify what worked/didn't work
3. **Prompt Iteration**: Update system prompt with learnings
4. **A/B Test**: Deploy new variant to 20% of calls
5. **Statistical Analysis**: Run for minimum 100 calls per variant
6. **Graduate Winner**: Roll winning variant to 100% after significance
7. **Document**: Update this file with changes and results

---

## Version History

### Version 1.0 (October 31, 2024) - Current

**Initial Production Release**

**Changes**:
- Implemented "Confused Old Man" technique
- Added pattern interrupt opening
- Configured warm, consultative personality
- Set concise response style (2-3 sentences)
- Added natural filler words and acknowledgments
- Implemented neutral language throughout
- Added test property: 829 Lake Bluff Drive, Flower Mound, TX (Jeff Price)

**Based On**:
- "Secrets To Mastering Cold Calling" training principles
- ElevenLabs Conversational AI 2.0 best practices
- Real estate wholesale industry standards
- Next Level Real Estate brand guidelines

**Known Limitations**:
- First message uses hardcoded property details (needs dynamic injection)
- No objection handling scripts documented yet
- No call flow/decision tree implemented
- Voice selection not finalized
- A/B testing framework not deployed

**Next Steps**:
1. Implement dynamic context injection for property details
2. Add common objection handling responses
3. Create decision tree for conversation flow
4. Select and configure optimal voice
5. Deploy A/B testing framework
6. Collect baseline metrics from initial 100 calls

---

## Related Documentation

- **Conversation Strategy**: `assets/transcripts/secrets-to-mastering-cold-calling.md`
- **ElevenLabs Configuration**: `docs/ELEVENLABS_AGENT_CONFIGURATION_GUIDE.md`
- **Integration Guide**: `docs/TWILIO_ELEVENLABS_INTEGRATION_GUIDE.md`
- **Optimization Strategies**: `docs/CONVERSATION_OPTIMIZATION_STRATEGIES.md`
- **Current Prompt File**: `assets/current-elevenlabs-prompt.md`

---

## Appendix: Common Objections & Response Framework

### Objection 1: "We're not interested in selling"

**Response Framework**:
```
"I completely understand. Actually, most homeowners we talk to aren't actively thinking about selling either. That's okay. I'm not calling to pressure you into anything - I just wanted to share some information that might be helpful for you to have, whether you decide to explore this now or maybe down the road. Would it be okay if I shared that with you really quick?"
```

**Tone**: Empathetic, non-pushy, consultative

**Goal**: Plant seeds for future consideration

### Objection 2: "How did you get my information?"

**Response Framework**:
```
"That's a great question. We work with public property records to identify homeowners who might benefit from downsizing opportunities. Your information is all publicly available - nothing private or confidential. We specifically look for homeowners like yourself who've been in their homes for a while and might be thinking about their next chapter. Does that make sense?"
```

**Tone**: Transparent, professional, understanding

**Goal**: Build trust through transparency

### Objection 3: "We already have a realtor"

**Response Framework**:
```
"That's perfectly fine - it's actually great that you have someone you trust. What we do is actually a bit different from traditional real estate agents. We represent cash buyers who can close in as little as 7-14 days with no repairs, no showings, and no commissions. It's really just about giving you options. Would it make sense to have a quick 15-minute conversation just to see if this could be a fit for your situation?"
```

**Tone**: Respectful, educational, value-focused

**Goal**: Differentiate from traditional realtors

### Objection 4: "I need to talk to my spouse/family"

**Response Framework**:
```
"Oh absolutely, that makes total sense. These are important decisions that should definitely be made together. Actually, would it make sense to schedule a quick call or meeting when you're both available? That way you can both hear the information and ask any questions. What works better for you - mornings or afternoons?"
```

**Tone**: Understanding, inclusive, assumptive

**Goal**: Secure appointment with decision-makers present

### Objection 5: "What's this about? / Why are you calling?"

**Response Framework**:
```
"Of course, let me explain. I work with Team Price Homes, and we connect homeowners with cash buyers who are looking for properties in your area. We've found that a lot of homeowners, especially those who've been in their homes for many years, are starting to think about downsizing or simplifying their lives. I called because I wanted to see if that might be something that would interest you, either now or in the future. Does that make sense?"
```

**Tone**: Transparent, conversational, consultative

**Goal**: Build credibility and explore interest level

---

**Document Maintained By**: AI Agent Development Team
**Review Frequency**: Weekly
**Last Reviewed**: October 31, 2024
**Next Review**: November 7, 2024
