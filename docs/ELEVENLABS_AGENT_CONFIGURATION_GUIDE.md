# ElevenLabs Conversational AI 2.0: Agent Configuration & Prompt Engineering Guide

This guide provides comprehensive best practices for configuring ElevenLabs Conversational AI agents, optimizing prompts for real estate wholesale calling, and integrating with your real estate platform.

## Table of Contents

1. [Agent Configuration Architecture](#agent-configuration-architecture)
2. [Optimal Prompt Engineering](#optimal-prompt-engineering)
3. [Dynamic Context Injection](#dynamic-context-injection)
4. [Voice Selection & Customization](#voice-selection--customization)
5. [Turn-Taking & Interruption Handling](#turn-taking--interruption-handling)
6. [Multi-Language Conversations](#multi-language-conversations)
7. [Sentiment Analysis Integration](#sentiment-analysis-integration)
8. [Real-Time Conversation Optimization](#real-time-conversation-optimization)
9. [Conversation Flow Templates](#conversation-flow-templates)
10. [Advanced Features & HIPAA Compliance](#advanced-features--hipaa-compliance)

---

## Agent Configuration Architecture

### Core Configuration Schema

The optimal ElevenLabs agent configuration combines system prompts, dynamic context, and fine-tuned conversation parameters for maximum effectiveness in real estate wholesale scenarios.

```javascript
const optimalAgentConfig = {
  agent: {
    // SECTION 1: Prompt Engineering
    prompt: {
      // Base system prompt (cached for cost optimization)
      prompt: `[Your system prompt here - see "Optimal Prompt Engineering" section]`,

      // LLM selection - Claude optimal for nuanced real estate conversations
      llm: 'claude-3-5-sonnet-20250924', // Or 'gpt-4o', 'gemini-1.5-pro'

      // Temperature controls randomness/creativity (0-1)
      // Real estate: use 0.5-0.7 for balance of consistency and natural variation
      temperature: 0.65,
    },

    // SECTION 2: Initial Engagement
    first_message: 'Hi [Name], this is [Your Name] from Next Level Real Estate. How are you doing today?',

    // Auto-translated based on detected language
    language: 'auto', // or 'en', 'es', 'fr', 'de', 'zh', etc.

    // SECTION 3: Voice Configuration
    voice: {
      voice_id: 'YOUR_VOICE_ID', // From voice library
      model_id: 'eleven_flash_v2_5', // Latest Flash model, 75ms latency
      stability: 0.5, // 0-1: lower = more variable, higher = consistent
      similarity_boost: 0.8, // 0-1: how closely to match original voice
      style: 0.5, // 0-1: monotone to expressive
      use_speaker_boost: true, // Enhanced voice clarity
    },

    // SECTION 4: Conversation Settings
    conversation_config: {
      // Turn-taking configuration
      turn_timeout_seconds: 12, // Max wait for user speech before agent speaks
      agent_turn_timeout_seconds: 45, // Max agent can speak continuously
      enable_interruptions: true, // Allow user to interrupt agent mid-sentence
      enable_backchannel: true, // Agent says "mm-hmm", "I see", "understood"

      // Interruption sensitivity (0-1, higher = more sensitive)
      interruption_sensitivity: 0.7,

      // Backchannel frequency (0-1, higher = more frequent)
      backchannel_frequency: 0.4,
    },

    // SECTION 5: Tool Integration (Optional)
    tools: [
      {
        type: 'webhook',
        name: 'lookup_property_value',
        description: 'Get estimated property value, comparable sales, and market analysis',
        url: 'https://your-api.com/tools/property-value',
        method: 'POST',
        parameters: {
          address: { type: 'string', required: true },
          city: { type: 'string', required: true },
          state: { type: 'string', required: true },
          zip: { type: 'string', required: true },
        },
      },
      {
        type: 'webhook',
        name: 'schedule_property_visit',
        description: 'Schedule property inspection appointment',
        url: 'https://your-api.com/tools/schedule-visit',
        method: 'POST',
        parameters: {
          property_address: { type: 'string', required: true },
          preferred_dates: { type: 'array', items: { type: 'string' } },
          lead_phone: { type: 'string', required: true },
        },
      },
    ],

    // SECTION 6: Response Format
    knowledge_base: {
      max_knowledge_base_size: 10000, // Max characters in knowledge context
      knowledge_retrieval_timeout: 5000, // Max time to fetch context (ms)
    },
  },
};
```

### Configuration Validation

```javascript
async function validateAgentConfig(config) {
  const validationChecks = {
    hasValidPrompt: !!config.agent.prompt.prompt && config.agent.prompt.prompt.length > 50,
    hasValidVoiceId: !!config.agent.voice.voice_id && config.agent.voice.voice_id.length > 5,
    hasValidLLM: ['claude-3-5-sonnet-20250924', 'gpt-4o', 'gemini-1.5-pro'].includes(config.agent.prompt.llm),
    turnTimeoutInRange: config.agent.conversation_config.turn_timeout_seconds >= 5 &&
                        config.agent.conversation_config.turn_timeout_seconds <= 30,
    agentTurnTimeoutInRange: config.agent.conversation_config.agent_turn_timeout_seconds >= 10 &&
                             config.agent.conversation_config.agent_turn_timeout_seconds <= 120,
    voiceStabilityInRange: config.agent.voice.stability >= 0 && config.agent.voice.stability <= 1,
  };

  const failures = Object.entries(validationChecks)
    .filter(([_, passed]) => !passed)
    .map(([check]) => check);

  if (failures.length > 0) {
    throw new Error(`Agent config validation failed: ${failures.join(', ')}`);
  }

  return true;
}
```

---

## Optimal Prompt Engineering

### Real Estate Wholesale Conversation Prompt Template

The foundation of agent success is a well-structured system prompt that balances personality, compliance, and conversion goals.

```javascript
const wholesaleConversationPrompt = `You are a professional real estate wholesaler conducting an initial property evaluation call.

## PERSONALITY & TONE
- Friendly and professional, not pushy
- Genuinely curious about the seller's situation
- Empathetic listener who builds rapport
- Confident but humble about market knowledge
- Adapt your communication style to the seller's tone and pace

## CORE RESPONSIBILITIES
1. Establish rapport and build trust immediately
2. Confirm property ownership and decision-making authority
3. Understand seller motivation (timeline, circumstance, emotion)
4. Ask clarifying questions to assess wholesale potential
5. Provide preliminary evaluation without guarantees
6. Schedule follow-up or property visit if interested

## CONVERSATION STRUCTURE
Your call should naturally follow this arc:

### Opening (first 30 seconds)
- Warm greeting with your name
- Reason for calling (found property info online, sent direct mail, etc.)
- Ask if it's a good time (respect their time)
- Brief purpose: "I evaluate properties for cash purchase opportunities"

### Discovery (2-3 minutes)
- Confirm ownership and decision-making
- Property condition: "Tell me about the condition of the home"
- Timeline: "Are you looking to sell soon, or is this a future consideration?"
- Motivation: "Help me understand what brought on thinking about selling"
- Price expectations: "Do you have a price range in mind?"

### Analysis (1-2 minutes)
- Summarize what you heard
- Position your expertise: "Based on homes we've purchased in [area]..."
- Provide preliminary feedback (never guarantee values)
- Identify if wholesale opportunity exists

### Closure (30-60 seconds)
- Express genuine interest or honest pass
- If interested: schedule property visit
- If not interested: ask for referrals, leave door open
- Thank them for their time

## KEY PHRASES FOR DIFFERENT SCENARIOS

### Building Rapport
- "I appreciate you taking the time to talk with me"
- "That makes sense, a lot of homeowners in your situation..."
- "I can definitely understand why that would be frustrating"

### Investigating Seller Motivation
- "What's prompting you to think about selling now?"
- "How long have you been considering this?"
- "If you could wave a magic wand, what would your ideal solution be?"

### Addressing Concerns
- "That's a valid concern - here's how we typically handle that..."
- "I don't blame you for being cautious, let me explain our process..."
- "Many sellers have asked that - the answer is..."

### Handling Objections
- Listen fully without interrupting
- Acknowledge and validate: "I hear you..."
- Provide solution or new perspective
- Ask clarifying question to move forward

### Closing for Visit
- "Based on what you've told me, I'd like to see the property in person"
- "Would morning or afternoon work better for you this week?"
- "Great! Let me get you on my schedule - what's your availability?"

## CRITICAL CONSTRAINTS - NEVER VIOLATE

1. TCPA COMPLIANCE
   - Confirm consent before proceeding: "I want to make sure this is okay to call you about"
   - Never make unsolicited follow-up calls to those who decline
   - Respect Do-Not-Call preferences immediately

2. HONESTY & INTEGRITY
   - Never guarantee specific prices or outcomes
   - Never misrepresent your business or intentions
   - Admit what you don't know
   - Don't pressure for immediate decisions

3. PROFESSIONAL BOUNDARIES
   - Don't pry into personal financial details unnecessarily
   - Respect if they're not interested
   - Don't disparage competitors or other investors
   - Keep focus on their needs, not your commission

4. DATA PROTECTION
   - Don't ask for or record unnecessary personal information
   - Comply with all data privacy regulations
   - Secure any information shared (phone, email, address)

## WHOLESALE QUALIFICATION CRITERIA

During conversation, mentally assess these factors:

### Strong Signals
- Urgent timeline (within 30-60 days)
- Inherited property (quick sale needed)
- Foreclosure or distress situation
- Property condition requires repairs
- Owner mentions being "upside down"

### Weak Signals
- Already listed with real estate agent
- Unrealistic pricing expectations
- Long timeline (6+ months)
- Multiple offers already
- Wants full market value

## WHAT SUCCESS LOOKS LIKE
- Seller feels heard and respected
- You've gathered key property information
- Next steps are clear and agreed upon
- Door left open for future conversations
- Positive referral relationship established

## POST-CALL DOCUMENTATION
After each call, capture:
- Property address and condition details
- Seller motivation and timeline
- Price expectations and flexibility
- Next steps and follow-up date
- Any special circumstances
- Quality of rapport (1-5 scale)
`;
```

### Strategic Prompt Variations for Different Lead Types

```javascript
const conversationPromptVariations = {
  // Motivated/Distressed Seller
  motivated: `${wholesaleConversationPrompt}

## SPECIAL CONTEXT: MOTIVATED SELLER
This lead likely has urgency. Key adjustments:

FOCUS AREAS
- Lead with your ability to close quickly
- Emphasize the simplicity of your process
- Build confidence in your capability
- Be more directive about next steps (schedule visit same call)

OBJECTION PATTERN
Motivated sellers often object to: "Will I get a fair price?"
Response framework: "Fair for your situation means solving your problem quickly. Let me assess the property to give you accurate numbers."`,

  // Inherited Property
  inherited: `${wholesaleConversationPrompt}

## SPECIAL CONTEXT: INHERITED PROPERTY
These sellers have unique needs. Key adjustments:

FOCUS AREAS
- Acknowledge complexity of estate situations
- Mention coordination with other heirs
- Lead with simplicity and stress reduction
- Position yourself as the "easy button"

EMOTIONAL ANGLE
"Managing a property you've inherited can be overwhelming. My job is to make this as simple as possible for you."`,

  // Off-Market Property
  offMarket: `${wholesaleConversationPrompt}

## SPECIAL CONTEXT: OFF-MARKET PROPERTY
This is a cold outreach. Key adjustments:

OPENING TONE
- Lead with specific property knowledge to build credibility
- Mention why you found them: "Your property in [area] matches investment criteria"
- Be extra respectful of their time
- Give them an easy "no" upfront

PITCH REFINEMENT
"I'm not here to pressure you, but if you ever think about selling, I'm interested. I'd love to have a quick conversation to see if it makes sense. Do you have 10 minutes?"`,

  // Fire Sale / Extreme Urgency
  extreme: `${wholesaleConversationPrompt}

## SPECIAL CONTEXT: EXTREME URGENCY (Foreclosure, Eviction, etc.)
This person may be stressed. Key adjustments:

TONE
- Calm, reassuring, professional
- Confidence without aggression
- Speed without pressure
- Solution-oriented

LANGUAGE
- "I understand this is time-sensitive"
- "Let me show you your options"
- "Here's what happens next"
- "You're in good hands"`,
};
```

### Prompt Caching for Cost Optimization

```javascript
// Cache the base prompt for 1-hour TTL
// All subsequent calls within 1 hour reuse cached version = 90% cost savings

async function createCachedConversation(lead, property, promptVariation = 'default') {
  const basePrompt = conversationPromptVariations[promptVariation] || wholesaleConversationPrompt;

  const response = await elevenLabsClient.post('/convai/conversations', {
    agent: {
      prompt: {
        prompt: basePrompt, // This gets cached
        llm: 'claude-3-5-sonnet-20250924',
        temperature: 0.65,
        cache_control: { type: 'ephemeral', ttl: 3600 }, // 1-hour cache
      },
      first_message: `Hi ${lead.firstName}, this is calling from Next Level Real Estate. How are you doing today?`,
      language: 'auto',
      voice: {
        voice_id: process.env.ELEVENLABS_VOICE_ID,
        model_id: 'eleven_flash_v2_5',
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.5,
        use_speaker_boost: true,
      },
      conversation_config: {
        turn_timeout_seconds: 12,
        agent_turn_timeout_seconds: 45,
        enable_interruptions: true,
        enable_backchannel: true,
      },
    },
  }, {
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
}
```

---

## Dynamic Context Injection

### Real-Time Lead & Property Context

The power of ElevenLabs agents is the ability to inject lead-specific context at call time, enabling personalized conversations without sacrificing efficiency.

```javascript
async function startCallWithOptimalContext(lead, property) {
  // Retrieve RAG context from vector database
  const [marketData, successfulStrategies, propertyComps] = await Promise.all([
    vectorDB.search({
      query: `market trends ${property.city} ${property.state} ${property.type}`,
      limit: 3,
    }),
    vectorDB.search({
      query: `successful conversation patterns ${lead.leadSource} sellers`,
      filter: { success_rate: { $gte: 0.7 } },
      limit: 3,
    }),
    vectorDB.search({
      query: `comparable properties ${property.zipCode} ${property.bedrooms}bd`,
      limit: 5,
    }),
  ]);

  // Build contextual prompt
  const contextualPrompt = `${wholesaleConversationPrompt}

## LEAD-SPECIFIC CONTEXT

### About This Seller
- Name: ${lead.firstName} ${lead.lastName}
- Contact Source: ${lead.source}
- Prior Contact Attempts: ${lead.contactHistory?.length || 0}
- Estimated Lead Quality: ${lead.score || 'Unknown'}
- Timezone: ${lead.timezone || 'Eastern'}

### Property Information
- Address: ${property.address}, ${property.city}, ${property.state} ${property.zipCode}
- Property Type: ${property.type}
- Bedrooms/Bathrooms: ${property.bedrooms}/${property.bathrooms}
- Square Footage: ${property.squareFeet || 'Unknown'}
- Estimated Current Value: $${property.estimatedValue?.toLocaleString() || 'Unknown'}
- Estimated After-Repair Value: $${property.estimatedARV?.toLocaleString() || 'Unknown'}
- Condition Assessment: ${property.condition || 'Unknown'}
- Days On Market (if listed): ${property.daysOnMarket || 'Not listed'}

### Market Intelligence
Recent comparable sales in the area:
${propertyComps.slice(0, 3).map(c =>
  `- ${c.metadata.address}: $${c.metadata.price.toLocaleString()} (${c.metadata.daysAgo} days ago)`
).join('\n')}

Current Market Conditions:
${marketData[0]?.content || 'Market data not available'}

### Successful Conversation Patterns for This Lead Type
${successfulStrategies.slice(0, 2).map(s =>
  `- ${s.content} (Success Rate: ${(s.metadata.success_rate * 100).toFixed(0)}%)`
).join('\n')}

## PERSONALIZED APPROACH FOR THIS CALL

Based on ${lead.firstName}'s profile and property characteristics:
1. Lead with your ability to handle ${property.condition === 'needs_work' ? 'properties needing renovation' : 'quick cash closings'}
2. Reference comparable sales to establish credibility
3. Focus on ${lead.leadSource === 'direct_mail' ? 'your personal outreach' : 'online research'} that prompted the call
4. Target close timeline: ${property.daysOnMarket > 30 ? '30-45 days' : 'flexible timeline'}

## FINANCIAL FRAMEWORK
- Target minimum equity: 20%+
- Expected repair costs: $${property.estimatedRepairCost?.toLocaleString() || 'TBD'}
- Estimated wholesale fee: ${property.estimatedWholesaleFee || 'TBD'}
- Profit margin potential: ${property.estimatedProfitMargin?.toLocaleString() || 'TBD'}
`;

  // Create conversation with injected context
  const response = await elevenLabsClient.post('/convai/conversations', {
    agent: {
      prompt: {
        prompt: contextualPrompt,
        llm: 'claude-3-5-sonnet-20250924',
        temperature: 0.65,
      },
      first_message: generatePersonalizedGreeting(lead, property),
      language: 'auto',
      voice: {
        voice_id: process.env.ELEVENLABS_VOICE_ID,
        model_id: 'eleven_flash_v2_5',
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.5,
        use_speaker_boost: true,
      },
      conversation_config: {
        turn_timeout_seconds: 12,
        agent_turn_timeout_seconds: 45,
        enable_interruptions: true,
        enable_backchannel: true,
      },
    },
  }, {
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
    },
  });

  return response.data;
}

function generatePersonalizedGreeting(lead, property) {
  const greetings = [
    `Hi ${lead.firstName}, this is calling from Next Level Real Estate. I was actually looking at properties in your area and came across your place at ${property.address}. Do you have a quick minute to chat?`,
    `${lead.firstName}! This is from Next Level Real Estate. I specialize in properties like yours in ${property.city} - I'd love to chat about your home if you have a moment.`,
    `Hi there, ${lead.firstName}. This is calling about your property at ${property.address}. I work with investors looking for properties in ${property.state}, and I think yours might be a fit. You got a few minutes?`,
  ];

  return greetings[Math.floor(Math.random() * greetings.length)];
}
```

### Context Management Best Practices

```javascript
// Context size constraints
const contextMaxSizes = {
  totalPromptSize: 10000, // chars
  leadContextSize: 1000, // chars
  propertyContextSize: 1500, // chars
  marketDataSize: 2000, // chars
  successPatternSize: 2500, // chars
};

function validateContextSize(contextualPrompt) {
  if (contextualPrompt.length > contextMaxSizes.totalPromptSize) {
    console.warn(`Prompt exceeds optimal size: ${contextualPrompt.length}/${contextMaxSizes.totalPromptSize}`);
    return false;
  }
  return true;
}

// Pre-call context assembly (should complete in < 2 seconds)
async function assembleContextFast(lead, property) {
  const startTime = Date.now();

  const context = await Promise.race([
    assembleContext(lead, property),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Context assembly timeout')), 2000)
    ),
  ]);

  const elapsed = Date.now() - startTime;
  console.log(`Context assembled in ${elapsed}ms`);

  return context;
}
```

---

## Voice Selection & Customization

### Selecting the Right Voice

```javascript
async function selectOptimalVoiceForContext(context = {}) {
  const voices = await elevenLabsClient.get('/voices');

  const voiceScoreCard = {
    gender: context.preferredGender || 'any', // 'male', 'female', 'neutral'
    age: context.preferredAge || 'any', // 'young', 'middle_aged', 'senior'
    accent: context.preferredAccent || 'american', // 'american', 'british', 'australian', etc.
    useCase: 'real_estate_sales',
    quality: 'professional', // Only professional/premium voices
  };

  const filteredVoices = voices.data.voices.filter(voice => {
    if (voiceScoreCard.gender !== 'any' && voice.labels?.gender !== voiceScoreCard.gender) {
      return false;
    }
    if (voiceScoreCard.age !== 'any' && voice.labels?.age !== voiceScoreCard.age) {
      return false;
    }
    if (voiceScoreCard.accent !== 'any' && voice.labels?.accent !== voiceScoreCard.accent) {
      return false;
    }
    // Only use professional/premium voices for real estate
    if (!['professional', 'premium'].includes(voice.category)) {
      return false;
    }
    return true;
  });

  // Score voices by relevance
  const scoredVoices = filteredVoices.map(voice => ({
    ...voice,
    relevanceScore: calculateRelevanceScore(voice, voiceScoreCard),
  }));

  // Return top 3 options
  return scoredVoices.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 3);
}

function calculateRelevanceScore(voice, criteria) {
  let score = 0;

  if (criteria.gender !== 'any' && voice.labels?.gender === criteria.gender) score += 30;
  if (criteria.age !== 'any' && voice.labels?.age === criteria.age) score += 20;
  if (criteria.accent === voice.labels?.accent) score += 20;
  if (voice.category === 'professional') score += 20;
  if (voice.description?.toLowerCase().includes('professional')) score += 10;

  return score;
}

// Voice configuration optimization
const voiceOptimizationByScenario = {
  // Cold outreach - needs authority and warmth
  coldOutreach: {
    stability: 0.6, // Slightly more variable to sound natural
    similarity_boost: 0.7, // Slightly less perfect to avoid uncanny valley
    style: 0.6, // More expressive to engage skeptical listener
  },

  // Follow-up call - build rapport
  followUp: {
    stability: 0.5, // Variable for conversational feel
    similarity_boost: 0.8, // Close match to establish consistency
    style: 0.7, // More expressive, friendly
  },

  // Data gathering - clarity is key
  dataGathering: {
    stability: 0.7, // More consistent for clarity
    similarity_boost: 0.8, // Professional sound
    style: 0.4, // More controlled, less variation
  },

  // Negotiation - confidence and calm
  negotiation: {
    stability: 0.7, // Steady, confident tone
    similarity_boost: 0.85, // Professionally consistent
    style: 0.4, // Controlled, measured
  },
};
```

### Voice Cloning for Brand Consistency

```javascript
// Best practices for cloning your voice or company voice
const voiceCloningGuidelines = {
  audioRequirements: {
    sampleRate: '44.1kHz or 48kHz',
    format: 'WAV or MP3 (320kbps)',
    bitDepth: '16-bit',
    backgroundNoise: 'Minimal (must be > -40dB)',
    totalDuration: '2-5 minutes ideal (minimum 1 minute)',
  },

  recordingGuidelines: {
    environment: 'Quiet room with basic acoustic treatment',
    microphone: 'Studio-quality USB condenser or better (Shure SM7B, Rode NT1, Audio-Technica AT2020)',
    distance: '6-12 inches from microphone',
    levels: 'Peak at -6dB to -3dB (never clip)',
    speakingPace: 'Natural conversational pace, 120-150 WPM',
  },

  sampleContent: {
    samples: '25-40 distinct audio clips',
    emotions: 'Mix of friendly, serious, and moderately enthusiastic tones',
    topics: 'Varied real estate talking points and general conversation',
    avoidance: [
      'Background music or sound effects',
      'Artificial speed changes',
      'Multiple people speaking',
      'Excessive emotion (too angry, too sad)',
      'Heavy accents unclear to wide audiences',
    ],
  },

  qualityChecklist: [
    'All clips are clear and intelligible',
    'Volume is consistent across clips',
    'No background noise > -40dB',
    'No clipping or distortion',
    'Natural pacing and intonation',
    'Represents the voice you want the clone to have',
  ],
};

async function cloneVoiceForRealEstate(voiceDetails, audioFiles) {
  // Validate audio quality before submission
  for (const file of audioFiles) {
    const audioAnalysis = await analyzeAudioQuality(file);
    if (!audioAnalysis.isAcceptable) {
      throw new Error(`Audio file ${file} does not meet quality standards: ${audioAnalysis.issues.join(', ')}`);
    }
  }

  const formData = new FormData();
  formData.append('name', voiceDetails.name);
  formData.append('description', voiceDetails.description);

  for (const file of audioFiles) {
    formData.append('files', fs.createReadStream(file));
  }

  // Label the voice for discoverability
  formData.append('labels', JSON.stringify({
    accent: 'american',
    age: 'middle_aged',
    gender: voiceDetails.gender,
    use_case: 'real_estate_wholesale_sales',
    specialty: 'professional_sales',
  }));

  const response = await elevenLabsClient.post('/voices/add', formData, {
    headers: formData.getHeaders(),
  });

  console.log(`Voice clone "${voiceDetails.name}" submitted: ${response.data.voice_id}`);
  console.log(`Status: ${response.data.status} (usually "processing" initially)`);

  return {
    voiceId: response.data.voice_id,
    name: response.data.name,
    status: response.data.status,
    createdAt: new Date(),
  };
}
```

---

## Turn-Taking & Interruption Handling

### Optimal Turn-Taking Configuration

Professional real estate conversations require sophisticated turn-taking that feels natural while maintaining control.

```javascript
const turnTakingOptimization = {
  // Wholesale cold outreach (quick qualification)
  coldOutreach: {
    turn_timeout_seconds: 10, // Shorter patience for disinterested parties
    agent_turn_timeout_seconds: 45, // Allow more agent speaking for pitch
    interruption_sensitivity: 0.8, // Respond quickly to objections
    backchannel_frequency: 0.3, // Less frequent, more business-like
  },

  // Initial rapport building
  rapportBuilding: {
    turn_timeout_seconds: 15, // More patience in opening
    agent_turn_timeout_seconds: 30, // Shorter agent turns for questions
    interruption_sensitivity: 0.6, // Moderate sensitivity
    backchannel_frequency: 0.6, // Frequent "mm-hmm"
  },

  // Active negotiation/property discussion
  negotiation: {
    turn_timeout_seconds: 12, // Balanced
    agent_turn_timeout_seconds: 40, // Longer for explanations
    interruption_sensitivity: 0.7, // Quick response to concerns
    backchannel_frequency: 0.5, // Steady acknowledgment
  },

  // Objection handling
  objectionHandling: {
    turn_timeout_seconds: 10, // Very responsive
    agent_turn_timeout_seconds: 60, // Allow full explanation
    interruption_sensitivity: 0.9, // Ultra-responsive
    backchannel_frequency: 0.4, // Less interruption, more listening
  },

  // Closing/scheduling
  closing: {
    turn_timeout_seconds: 8, // Quick, action-oriented
    agent_turn_timeout_seconds: 25, // Brief confirmations
    interruption_sensitivity: 0.7, // Quick to confirm
    backchannel_frequency: 0.5, // Natural agreement sounds
  },
};

// Backchannel techniques for authentic conversation
const backchannelStrategies = {
  // Engagement and validation
  validation: [
    'I hear you',
    'That makes sense',
    'Totally understand',
    'Mm-hmm',
    'Yeah, absolutely',
  ],

  // Agreement and encouragement
  agreement: [
    'Right',
    'Exactly',
    'Got it',
    'For sure',
    'Completely agree',
  ],

  // Processing and thinking
  processing: [
    'Let me think about that',
    'Okay, so...',
    'Interesting',
    'I see where you\'re going',
    'That\'s a good point',
  ],

  // Transition phrases
  transition: [
    'Here\'s what I\'m thinking...',
    'Based on what you\'ve told me...',
    'One thing I find interesting...',
    'The reason I ask is...',
  ],
};
```

### Handling Difficult Interruptions

```javascript
// Real estate agents often get interrupted or need to regain control
const interruptionRecoveryStrategies = {
  // When seller interrupts to object
  objectInception: {
    approach: 'Acknowledge, validate, redirect',
    example: `I absolutely hear your concern about [concern]. That's actually one of the first things investors ask. Let me explain how we typically handle it because the answer might surprise you...`,
  },

  // When caller wants to move faster than agent
  pressingForSpeed: {
    approach: 'Match their urgency, provide quick value',
    example: `I can tell this is time-sensitive for you. Here\'s what I can do right now: I can get a preliminary assessment in the next 24 hours...`,
  },

  // When seller wants to end call
  earlyCallEnd: {
    approach: 'Confirm understanding, leave door open',
    example: `I get it - you want to think about this more, which is smart. Can I ask just one quick question before we wrap up? [One key question]. Great. I\'ll follow up with you on [specific date/time]. Sound good?`,
  },

  // When seller goes off-topic
  offTopic: {
    approach: 'Listen briefly, then refocus gently',
    example: `That\'s interesting about [topic]. I hear you. Quick question though - does that affect your timeline for selling?`,
  },
};
```

---

## Multi-Language Conversations

### Auto-Detection & Code-Switching

ElevenLabs Flash 2.5 supports seamless mid-conversation language switching for diverse markets.

```javascript
const multiLanguageOptimization = {
  languageSettings: {
    autoDetect: true, // Automatically detect caller language
    supportedLanguages: [
      'en', // English
      'es', // Spanish
      'pt', // Portuguese
      'zh', // Chinese (Mandarin)
      'ja', // Japanese
      'ko', // Korean
      'fr', // French
      'de', // German
      'it', // Italian
    ],
  },

  // Spanish is critical for real estate in many US markets
  spanishOptimizations: {
    prompt: `Eres un agente de bienes raíces profesional especializado en la compra de propiedades en efectivo...`,
    voicePreference: 'native_spanish_speaker',
    contextualPhrases: {
      greeting: 'Hola, te llamo de Next Level Real Estate',
      closing: 'Perfecto, ¡gracias por tu tiempo!',
    },
  },

  // Market-specific configurations
  marketConfigs: {
    southwest: {
      primaryLanguage: 'en',
      secondaryLanguage: 'es',
      bilingualVoice: true,
    },
    northeast: {
      primaryLanguage: 'en',
      secondaryLanguage: 'pt', // Portuguese for Brazilian community
    },
    california: {
      primaryLanguage: 'en',
      secondaryLanguage: 'es',
      tertiaryLanguage: 'zh',
    },
  },
};

async function startMultilingualConversation(lead, property) {
  // Determine language based on lead profile
  const language = lead.preferredLanguage || 'auto';

  // Get appropriate prompt version
  const promptVersion = getPromptForLanguage(language);

  // Select voice with language capability
  const voice = await selectVoiceForLanguage(language);

  const config = {
    agent: {
      prompt: {
        prompt: promptVersion,
        llm: 'claude-3-5-sonnet-20250924',
      },
      language: language, // 'auto' for auto-detection, or specific code
      voice: {
        voice_id: voice.voice_id,
        model_id: 'eleven_flash_v2_5',
      },
    },
  };

  return await elevenLabsClient.post('/convai/conversations', config);
}

// Handle code-switching mid-call
function setupCodeSwitchingPrompt(primaryLanguage, secondaryLanguage) {
  return `You are bilingual in ${primaryLanguage} and ${secondaryLanguage}.

## CODE-SWITCHING GUIDELINES
- Start in the caller's language (determined by their first response)
- Switch languages only if the caller code-switches
- Maintain professionalism in both languages
- Use the language that makes the caller most comfortable
- If unclear, ask: "What language would you prefer to speak in?"

## Important: Never code-switch randomly
- Code-switching should feel natural, not forced
- Only switch if the caller does first
- Stay in one language unless the conversation requires switching`;
}
```

---

## Sentiment Analysis Integration

### Real-Time Emotional Intelligence

Monitor sentiment throughout the call to adapt conversation and detect critical moments.

```javascript
class SentimentMonitor {
  constructor(conversationId) {
    this.conversationId = conversationId;
    this.sentimentTimeline = [];
    this.keyMoments = [];
    this.overallTrajectory = null;
  }

  async monitorWebSocketMessages(ws) {
    ws.on('message', (data) => {
      const message = JSON.parse(data);

      if (message.type === 'user_transcript') {
        this.analyzeSentiment(message.text, message.timestamp, 'user');
      }

      if (message.type === 'agent_response') {
        // Analyze if agent is responding appropriately to sentiment
        const userSentiment = this.getLatestUserSentiment();
        this.validateAgentAdaptation(message.text, userSentiment);
      }
    });
  }

  analyzeSentiment(text, timestamp, speaker) {
    // Use sentiment library or API
    const sentiment = this.calculateSentiment(text);

    const entry = {
      timestamp,
      speaker,
      text,
      sentiment: {
        score: sentiment.score, // -1 to 1
        magnitude: sentiment.magnitude, // 0 to 1 (intensity)
        emotion: this.detectEmotion(text),
        confidence: sentiment.confidence,
      },
    };

    this.sentimentTimeline.push(entry);

    // Detect critical moments
    if (sentiment.score < -0.5 && speaker === 'user') {
      this.keyMoments.push({
        type: 'negative_sentiment',
        timestamp,
        text,
        sentiment,
        action: 'ESCALATE_EMPATHY',
      });

      // Alert that agent should increase empathy
      console.warn(`Negative sentiment detected at ${timestamp}. Agent should increase empathy.`);
    }

    if (this.isCommitmentLanguage(text) && speaker === 'user') {
      this.keyMoments.push({
        type: 'commitment_language',
        timestamp,
        text,
        action: 'CLOSE_NOW',
      });

      console.log(`Commitment language detected at ${timestamp}. Consider closing immediately.`);
    }

    return entry;
  }

  calculateSentiment(text) {
    const Sentiment = require('sentiment');
    const sentiment = new Sentiment();
    const result = sentiment.analyze(text);

    return {
      score: result.comparative,
      magnitude: Math.abs(result.comparative),
      confidence: this.estimateConfidence(text, result),
    };
  }

  detectEmotion(text) {
    // Map sentiment to emotion
    const emotions = {
      anger: ['frustrated', 'angry', 'furious', 'outraged', 'upset'],
      fear: ['worried', 'nervous', 'anxious', 'scared', 'afraid'],
      sadness: ['sad', 'depressed', 'unhappy', 'disappointed', 'discouraged'],
      confusion: ['confused', 'unsure', 'unclear', 'lost', 'don\'t understand'],
      excitement: ['excited', 'thrilled', 'amazing', 'great', 'awesome'],
      interest: ['interested', 'curious', 'intrigued', 'tell me more'],
    };

    const detectedEmotions = [];

    for (const [emotion, keywords] of Object.entries(emotions)) {
      if (keywords.some(kw => text.toLowerCase().includes(kw))) {
        detectedEmotions.push(emotion);
      }
    }

    return detectedEmotions.length > 0 ? detectedEmotions : ['neutral'];
  }

  getLatestUserSentiment() {
    const userMessages = this.sentimentTimeline.filter(m => m.speaker === 'user');
    return userMessages[userMessages.length - 1]?.sentiment;
  }

  validateAgentAdaptation(agentText, userSentiment) {
    if (!userSentiment) return;

    // If user is upset, agent should show empathy
    if (userSentiment.score < -0.5) {
      const empathyKeywords = [
        'understand',
        'appreciate',
        'hear you',
        'frustrating',
        'I get it',
      ];
      const hasEmpathy = empathyKeywords.some(kw =>
        agentText.toLowerCase().includes(kw)
      );

      if (!hasEmpathy) {
        console.warn('Agent response lacking empathy for negative sentiment user');
      }
    }
  }

  isCommitmentLanguage(text) {
    const commitmentKeywords = [
      'yes',
      'sounds good',
      'let\'s do it',
      'schedule',
      'when can',
      'let\'s set up',
      'I\'m interested',
      'count me in',
      'okay, let\'s go',
      'works for me',
    ];

    return commitmentKeywords.some(kw =>
      text.toLowerCase().includes(kw)
    );
  }

  estimateConfidence(text, sentimentResult) {
    // Confidence based on text length and sentiment intensity
    const wordCount = text.split(/\s+/).length;
    const intensityScore = Math.abs(sentimentResult.comparative);

    if (wordCount < 3) return 0.4; // Very short responses are less reliable
    if (wordCount < 10) return 0.6;
    if (intensityScore > 0.5) return 0.9; // Strong sentiment = high confidence
    return 0.7;
  }

  generateSentimentReport() {
    const userSentiments = this.sentimentTimeline.filter(m => m.speaker === 'user');
    const avgSentiment =
      userSentiments.reduce((sum, m) => sum + m.sentiment.score, 0) /
      userSentiments.length;

    // Determine trajectory
    if (userSentiments.length >= 2) {
      const early = userSentiments.slice(0, 3);
      const late = userSentiments.slice(-3);

      const earlyAvg =
        early.reduce((sum, m) => sum + m.sentiment.score, 0) / early.length;
      const lateAvg =
        late.reduce((sum, m) => sum + m.sentiment.score, 0) / late.length;

      if (lateAvg > earlyAvg) {
        this.overallTrajectory = 'improving';
      } else if (lateAvg < earlyAvg) {
        this.overallTrajectory = 'declining';
      } else {
        this.overallTrajectory = 'stable';
      }
    }

    return {
      conversationId: this.conversationId,
      overallSentiment: avgSentiment,
      trajectory: this.overallTrajectory,
      keyMoments: this.keyMoments,
      totalTurns: this.sentimentTimeline.length,
      avgMagnitude:
        this.sentimentTimeline.reduce((sum, m) => sum + m.sentiment.magnitude, 0) /
        this.sentimentTimeline.length,
    };
  }
}
```

---

## Real-Time Conversation Optimization

### Mid-Call Adaptive Prompting

ElevenLabs agents can adapt their behavior based on what's happening in the conversation.

```javascript
class AdaptiveConversationController {
  constructor(conversationId, elevenLabsClient) {
    this.conversationId = conversationId;
    this.client = elevenLabsClient;
    this.state = 'opening';
    this.callHistory = [];
    this.lastAdaptation = null;
  }

  // Monitor conversation state and adapt as needed
  async monitorAndAdapt(ws) {
    ws.on('message', (data) => {
      const message = JSON.parse(data);

      if (message.type === 'user_transcript') {
        this.updateState(message.text);
        this.considerAdaptation(message.text);
      }
    });
  }

  updateState(userText) {
    // Track conversation progression
    if (this.state === 'opening') {
      if (this.callHistory.length > 3) {
        this.state = 'rapport_building';
      }
    } else if (this.state === 'rapport_building') {
      if (userText.toLowerCase().includes('property')) {
        this.state = 'property_discussion';
      }
    } else if (this.state === 'property_discussion') {
      if (this.hasObjection(userText)) {
        this.state = 'objection_handling';
      } else if (this.isReadyToClose(userText)) {
        this.state = 'closing';
      }
    }

    this.callHistory.push(userText);
  }

  async considerAdaptation(userText) {
    const timeSinceLastAdaptation = Date.now() - (this.lastAdaptation?.timestamp || 0);

    // Don't adapt too frequently
    if (timeSinceLastAdaptation < 30000) {
      return; // Wait at least 30 seconds between adaptations
    }

    const shouldAdapt = this.evaluateAdaptationNeeded(userText);

    if (shouldAdapt) {
      await this.sendAdaptation(shouldAdapt);
      this.lastAdaptation = {
        type: shouldAdapt,
        timestamp: Date.now(),
      };
    }
  }

  evaluateAdaptationNeeded(userText) {
    // Increase urgency if user shows commitment
    if (this.isShowingCommitment(userText)) {
      return 'increase_closing_urgency';
    }

    // Switch to empathy if user is frustrated
    if (this.isShowingFrustration(userText)) {
      return 'increase_empathy';
    }

    // Speed up if user is impatient
    if (this.isShowingImpatience(userText)) {
      return 'accelerate_pace';
    }

    // Provide more data if user is analytical
    if (this.isAnalytical(userText)) {
      return 'provide_detailed_analysis';
    }

    return null;
  }

  async sendAdaptation(adaptationType) {
    const adaptationPrompts = {
      increase_closing_urgency: `The caller is showing strong commitment signals. Begin closing the conversation immediately. Propose specific next steps and confirm the appointment.`,

      increase_empathy: `The caller seems frustrated or overwhelmed. Increase empathetic language. Listen more, talk less. Validate their concerns before providing solutions.`,

      accelerate_pace: `The caller wants to move faster. Reduce your speaking time, get to the point quickly, and expedite decision-making process.`,

      provide_detailed_analysis: `The caller wants specific numbers and analysis. Provide detailed breakdown of property evaluation, comparable sales, and financial projections.`,
    };

    // Send context override to ElevenLabs
    await this.client.post(
      `/convai/conversations/${this.conversationId}/override-context`,
      {
        instruction: adaptationPrompts[adaptationType],
      }
    );

    console.log(`Applied adaptation: ${adaptationType}`);
  }

  // Detection helpers
  isShowingCommitment(text) {
    const commitmentWords = [
      'yes',
      'sounds good',
      'let\'s',
      'schedule',
      'when can we',
      'I\'m interested',
    ];
    return commitmentWords.some(word => text.toLowerCase().includes(word));
  }

  isShowingFrustration(text) {
    const frustrationWords = [
      'frustrated',
      'angry',
      'upset',
      'annoyed',
      'tired of',
      'enough',
    ];
    return frustrationWords.some(word => text.toLowerCase().includes(word));
  }

  isShowingImpatience(text) {
    const impatienceWords = ['hurry', 'quick', 'soon', 'asap', 'today', 'now'];
    return impatienceWords.some(word => text.toLowerCase().includes(word));
  }

  isAnalytical(text) {
    const analyticWords = ['value', 'price', 'calculate', 'compare', 'estimate', 'number'];
    return analyticWords.some(word => text.toLowerCase().includes(word));
  }

  hasObjection(text) {
    const objectionWords = ['but', 'however', 'concerned', 'worried', 'problem', 'issue'];
    return objectionWords.some(word => text.toLowerCase().includes(word));
  }

  isReadyToClose(text) {
    return this.isShowingCommitment(text) && !this.hasObjection(text);
  }
}
```

---

## Conversation Flow Templates

### Complete Conversation Flows for Different Scenarios

Templates ensure consistent, high-quality conversations across your team.

```javascript
// Template 1: Cold Outreach to Distressed Property (Off-Market)
const coldOutreachTemplate = {
  name: 'Cold Outreach - Distressed Property',
  stage1_opening: {
    duration: '30-45 seconds',
    goals: ['Build credibility', 'Get permission to continue', 'Establish topic'],
    script: `Hi [FirstName], this is [YourName] with Next Level Real Estate. I specialize in acquiring properties that need work in [City], and I've been looking at your place. Do you have a quick minute?`,
    keyPoints: [
      'Mention property directly (establishes legitimacy)',
      'Explain your business simply',
      'Ask permission to continue (respect)',
      'Keep opening under 45 seconds',
    ],
  },

  stage2_rapport: {
    duration: '1-2 minutes',
    goals: ['Build trust', 'Qualify decision-maker', 'Understand situation'],
    script: [
      'Great, thanks for taking the call.',
      'Quick question - are you the owner of the property?',
      'How long have you owned it?',
      'What brought on thinking about selling?',
    ],
    agentAdaptations: [
      'If friendly: Be more casual, match their energy',
      'If guarded: Be more professional, slower pace',
      'If rushed: Speed up and get to business',
    ],
  },

  stage3_discovery: {
    duration: '2-3 minutes',
    goals: ['Understand property condition', 'Assess timeline', 'Identify motivation'],
    discoveryQuestions: [
      'Tell me about the condition of the home - any major issues?',
      'When would you ideally like to have this resolved?',
      'Have you listed it with an agent or explored other options?',
      'What would be your ideal outcome here?',
    ],
  },

  stage4_positioning: {
    duration: '1-2 minutes',
    goals: ['Show you understand their situation', 'Position your solution', 'Build confidence'],
    framingLanguage: `Based on what you've told me, [situation], that's actually pretty common in [area]. We've bought several homes in similar condition. The benefit for you is that we can close quickly without the hassle of fixing anything up.`,
  },

  stage5_proposal: {
    duration: '1 minute',
    goals: ['Make next step clear', 'Set expectation', 'Confirm interest'],
    proposal: `Here's what I'd like to do: I want to see the property in person, run some numbers based on what I see, and get you a fair cash offer within 24 hours. No obligation, no commission - that's how we work. Does that sound fair?`,
  },

  stage6_close: {
    duration: '30-60 seconds',
    goals: ['Get appointment commitment', 'End positively', 'Preserve relationship'],
    closingLines: [
      'Perfect! Let me get this on my calendar. What's better for you - morning or afternoon this week?',
      'Great! I appreciate your time. Let\'s plan for [Day/Time].',
      'Excellent. I\'ll send you a text confirmation and I\'ll see you [Day/Time].',
    ],
  },

  possibleObjections: {
    'I want to sell for market value': {
      response: 'I completely understand. Here\'s the thing - [property condition]. The cost to fix it up is $[amount], and it would take [time]. With us, you get your money now and avoid the hassle. But let me look at it first and show you the numbers.',
      technique: 'Acknowledge, reframe, request permission',
    },
    'I already have another offer': {
      response: 'That\'s great - shows the property has value. We can often beat or match offers because we buy with our own cash and don\'t need appraisals. Let me just see it first, then we can compare.',
      technique: 'Validate, differentiate, propose next step',
    },
    'I\'ll think about it': {
      response: 'I respect that. Let me ask - is it more of a timing thing, or do you have concerns about working with us? [Listen]. Here\'s what I\'ll do - I\'ll come see the property so you have real numbers to think about.',
      technique: 'Probe objection, demonstrate value, request action',
    },
  },
};

// Template 2: Motivated Seller Follow-Up (Known Timeline)
const motivatedSellerTemplate = {
  name: 'Motivated Seller Follow-Up',
  assumedContext: {
    timeline: 'Need to sell within 30-60 days',
    condition: 'Unknown to problematic',
    sellMethod: 'Likely looking for quick solution',
    emotion: 'Probably stressed or motivated',
  },

  stage1_reestablishment: {
    script: `Hi [FirstName], this is [YourName] again from Next Level Real Estate. You mentioned you might be interested in selling soon. I wanted to follow up because we might be able to help you move faster than you expected.`,
  },

  stage2_urgencyAlignment: {
    script: `I know you wanted this handled by [expected date]. We close in as little as 7 days if needed. How does that timeline compare to what you were hoping for?`,
    keypoint: 'Align your solution with their urgency',
  },

  stage3_nextStep: {
    script: `Let\'s get this scheduled for [specific day/time]. I can do a quick walkthrough, get a preliminary feel, and get you an offer by [specific time]. Sound good?`,
    keypoint: 'Be specific and assumptive',
  },
};

// Template 3: Inherited Property (Emotional, Rushed)
const inheritedPropertyTemplate = {
  name: 'Inherited Property',
  emotionalContext: {
    complexity: 'Often dealing with grieving family',
    urgency: 'Often higher than usual',
    decisiveness: 'Often lower (need consensus)',
    motivation: 'Estate settlement, taxes, disagreement with heirs',
  },

  stage1_sensitivity: {
    script: `Hi [FirstName], this is [YourName] with Next Level Real Estate. I'm calling about [property]. I understand this might be a property you inherited, and I know that can be complicated. I want to see if we might be able to help simplify things for you.`,
    tone: 'Warm, understanding, solution-focused',
  },

  stage2_understanding: {
    questions: [
      'Are there other family members involved in the decision?',
      'What\'s the timeline you\'re working with?',
      'Have you had any professional appraisals or assessments?',
      'What would be the ideal outcome for you and your family?',
    ],
  },

  stage3_positioning: {
    script: `Here\'s what often works for families in your situation: We handle the whole process - appraisal, offer, closing. You don\'t have to coordinate with multiple people, and there\'s no real estate commission. It\'s much simpler.`,
  },
};
```

---

## Advanced Features & HIPAA Compliance

### HIPAA Configuration for Healthcare Properties

If expanding into healthcare or sensitive sectors:

```javascript
const HIPAACompliantConfig = {
  // Enable HIPAA compliance settings
  agent: {
    compliance: {
      hipaa_enabled: true,
      pci_disabled: true, // ConversationRelay is NOT PCI compliant
      data_encryption: 'AES-256',
      data_retention_days: 90,
      audit_logging: true,
    },

    // Special prompting for HIPAA scenarios
    prompt: {
      prompt: `You are a professional healthcare real estate specialist. HIPAA regulations require strict confidentiality...`,
    },

    // Conversation constraints for healthcare
    conversation_config: {
      max_recording_duration: 3600, // Auto-stop after 1 hour
      auto_delete_after_days: 90,
      audit_trail: 'complete', // Full logging for compliance
      encryption: 'end_to_end',
    },
  },
};

async function startHIPAACompliantCall(lead, property) {
  // Verify patient data handling
  const dataHandlingCheck = {
    containsPII: true,
    requiresAudit: true,
    encryptionRequired: true,
  };

  // Additional consent verification
  const hipaaConsent = await verifyHIPAAConsent(lead);
  if (!hipaaConsent) {
    throw new Error('HIPAA consent not verified');
  }

  // Use HIPAA-enabled configuration
  return await elevenLabsClient.post(
    '/convai/conversations',
    HIPAACompliantConfig,
    {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'x-hipaa-compliance': 'required',
      },
    }
  );
}
```

### Advanced Compliance Tracking

```javascript
async function logComplianceEvent(conversation) {
  // Log all conversation events for audit trail
  const complianceLog = {
    timestamp: new Date(),
    conversationId: conversation.conversation_id,
    callSid: conversation.twilio_call_sid,
    events: [
      {
        type: 'conversation_initiated',
        consentVerified: true,
        dncCheckPassed: true,
      },
      {
        type: 'call_recording',
        recordingEnabled: true,
        consentForRecording: true,
      },
      {
        type: 'transcript_available',
        autoDeleteDate: calculateAutoDeleteDate(90),
      },
      {
        type: 'sentiment_analysis',
        sentiment: conversation.avgSentiment,
      },
      {
        type: 'conversation_ended',
        duration: conversation.duration,
        outcome: conversation.outcome,
      },
    ],
  };

  await db.collection('compliance_logs').insertOne(complianceLog);
}
```

---

## Implementation Checklist

- [ ] ElevenLabs account created with Conversational AI 2.0 access
- [ ] Claude (or preferred LLM) API key configured
- [ ] Voice ID selected and tested
- [ ] System prompt for real estate wholesale created
- [ ] Prompt caching configured for cost optimization
- [ ] Dynamic context injection tested
- [ ] Twilio integration configured with ConversationRelay
- [ ] WebSocket handlers for conversation monitoring implemented
- [ ] Sentiment analysis integrated
- [ ] TCPA compliance checks enforced
- [ ] Call recording and transcription configured
- [ ] Conversation analytics dashboard created
- [ ] A/B testing framework for conversation variations built
- [ ] Multi-language support tested
- [ ] Voice cloning quality verified (if using cloned voice)
- [ ] Error handling and fallback strategies tested
- [ ] Production environment configured with monitoring
- [ ] Team training completed

---

## Key Metrics to Monitor

Track these metrics to continuously improve your conversations:

```javascript
const conversationMetrics = {
  // Conversation Quality
  averageCallDuration: 'Should be 3-5 minutes for cold outreach',
  completionRate: 'Target: >95% (calls that complete normally)',
  avgSentiment: 'Target: >0.3 (positive sentiment)',
  sentimentTrajectory: 'Target: improving (more positive by end)',

  // Effectiveness
  appointmentSchedulingRate: 'Target: >15% of completed calls',
  propertyInviteRate: 'Target: >10% of completed calls',
  softCommitmentRate: 'Target: >20% (interested but not ready)',

  // Agent Performance
  userInterruptionRate: 'Target: <15% (too many means agent too verbose)',
  backchannel_frequency: 'Target: 0.4-0.6 (sounds natural)',
  agentTalkTimePercent: 'Target: 40-50% (good balance with listening)',

  // Business Outcomes
  wholesale_deal_rate: 'Track revenue impact of calls',
  average_deal_value: 'Compare by conversation quality',
  cost_per_lead: 'Track API costs vs. revenue generated',

  // Compliance
  tcpa_violations: 'Target: 0',
  consent_verification_rate: 'Target: 100%',
  dnc_check_completion: 'Target: 100%',
};
```

---

## Resource Links

- [ElevenLabs Conversational AI Documentation](https://elevenlabs.io/docs/conversational-ai/overview)
- [Twilio ConversationRelay Guide](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay)
- [ElevenLabs Voice Library](https://elevenlabs.io/docs/voice-library)
- [Claude API Documentation](https://docs.anthropic.com/)
- [Real Estate Wholesale Best Practices](https://www.investopedia.com/articles/personal-finance/120515/wholesaling-real-estate.asp)
- [TCPA Compliance 2025](https://www.fcc.gov/consumers/guides/consumer-guide-tcpa)

---

## Version History

**v1.0** - October 31, 2025
- Initial comprehensive guide
- Real estate wholesale templates
- Sentiment analysis integration
- HIPAA compliance section
- Multi-language support guidelines
