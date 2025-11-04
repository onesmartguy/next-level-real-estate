# ElevenLabs Conversational AI 2.0 Integration

## Overview

ElevenLabs Conversational AI 2.0 provides state-of-the-art voice synthesis with Flash 2.5 model delivering 75ms latency, 32+ language support, and human-like turn-taking for real-time phone conversations.

## Key Features

- **Flash 2.5 Model**: 75ms latency for natural real-time conversations
- **32+ Languages**: Auto-detection with seamless mid-conversation switching
- **Turn-Taking Model**: Eliminates awkward pauses, handles interruptions naturally
- **Custom Voice Cloning**: Professional-quality voice replication
- **HIPAA Compliance**: Available for healthcare conversations
- **WebSocket API**: Bidirectional real-time audio streaming
- **Sound Effects**: Text-to-sound-effects for immersive audio

## Prerequisites

- ElevenLabs account with Conversational AI access
- API key from https://elevenlabs.io/api
- Voice ID (default or custom cloned voice)
- WebSocket support in your infrastructure

## Authentication

```javascript
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// HTTP API authentication
const axios = require('axios');
const client = axios.create({
  baseURL: 'https://api.elevenlabs.io/v1',
  headers: {
    'xi-api-key': ELEVENLABS_API_KEY,
    'Content-Type': 'application/json',
  },
});
```

## Voice List & Selection

### Fetching Available Voices

```javascript
// Get all available voices
async function getVoices() {
  const response = await client.get('/voices');

  return response.data.voices.map(voice => ({
    voiceId: voice.voice_id,
    name: voice.name,
    category: voice.category, // premade, cloned, professional
    description: voice.description,
    previewUrl: voice.preview_url,
    labels: voice.labels, // age, accent, gender, use_case
  }));
}

// Select optimal voice for real estate conversations
async function selectOptimalVoice(criteria = {}) {
  const voices = await getVoices();

  // Filter by criteria
  const filtered = voices.filter(v => {
    if (criteria.gender && v.labels.gender !== criteria.gender) return false;
    if (criteria.age && v.labels.age !== criteria.age) return false;
    if (criteria.accent && v.labels.accent !== criteria.accent) return false;
    return true;
  });

  // Prefer professional voices for business
  return filtered.find(v => v.category === 'professional') || filtered[0];
}

// Example: Select professional male voice with American accent
const voice = await selectOptimalVoice({
  gender: 'male',
  age: 'middle_aged',
  accent: 'american',
});
```

## Conversational AI Configuration

### Agent Configuration

```javascript
// Configure conversational AI agent
const agentConfig = {
  agent: {
    prompt: {
      prompt: `You are a professional real estate wholesaler calling to evaluate investment properties.

CONVERSATION GUIDELINES:
- Start with a friendly greeting and introduce yourself
- Confirm you're speaking with the property owner
- Express genuine interest in their property
- Ask open-ended questions to understand their situation
- Listen actively and respond empathetically
- Identify seller motivation (timeline, condition, circumstances)
- Discuss potential solutions without making commitments
- Schedule follow-up or site visit if interested
- Thank them for their time

CONSTRAINTS:
- Never guarantee property values or offers
- Always verify consent before proceeding with conversation
- Respect Do-Not-Call preferences
- Document key information for follow-up`,
      llm: 'claude-3-5-sonnet-20250924', // or 'gpt-4o', 'gemini-1.5-pro'
    },

    first_message: 'Hi, this is calling from Next Level Real Estate. Am I speaking with the owner of the property at {property.address}?',

    language: 'en', // or 'auto' for auto-detection

    // Voice configuration
    voice: {
      voice_id: voice.voiceId,
      model_id: 'eleven_flash_v2_5', // Flash 2.5 for 75ms latency
      stability: 0.5,
      similarity_boost: 0.8,
      style: 0.5, // 0-1: monotone to expressive
      use_speaker_boost: true,
    },

    // Advanced conversation settings
    conversation_config: {
      turn_timeout_seconds: 10, // Max wait for user speech
      agent_turn_timeout_seconds: 30, // Max agent speaking time
      enable_interruptions: true, // Allow user interruptions
      enable_backchannel: true, // "mm-hmm", "okay", etc.
    },

    // Tool use (optional)
    tools: [
      {
        type: 'webhook',
        name: 'lookup_property_value',
        description: 'Get estimated property value and comparables',
        url: 'https://your-api.com/tools/property-value',
        method: 'POST',
        parameters: {
          address: 'string',
          city: 'string',
          state: 'string',
          zip: 'string',
        },
      },
    ],
  },
};

// Create conversation
const response = await client.post('/convai/conversations', agentConfig);
const conversationId = response.data.conversation_id;
```

### Dynamic Context Injection

```javascript
// Inject lead-specific context into conversation
async function startCallWithContext(lead, property) {
  const contextualPrompt = `You are calling ${lead.firstName} ${lead.lastName} about their property at ${property.address}.

LEAD INFORMATION:
- Name: ${lead.firstName} ${lead.lastName}
- Phone: ${lead.phone}
- Lead Source: ${lead.source}
- Previous Contacts: ${lead.contactHistory.length}

PROPERTY CONTEXT:
- Address: ${property.address}, ${property.city}, ${property.state} ${property.zipCode}
- Estimated Value: $${property.estimatedValue?.toLocaleString()}
- Property Type: ${property.type}
- Bedrooms/Bathrooms: ${property.bedrooms}/${property.bathrooms}
- Condition: ${property.condition || 'Unknown'}
- Days on Market: ${property.daysOnMarket || 'Unknown'}

MARKET INTELLIGENCE:
- Recent Comparables: ${property.comparables?.slice(0, 3).map(c => `$${c.price}`).join(', ')}
- Market Trend: ${property.marketTrend}
- Average DOM in Area: ${property.avgDaysOnMarket} days

YOUR APPROACH:
${await getConversationStrategy(lead, property)}

Remember: You're evaluating if this is a good wholesale opportunity. Target criteria: 20%+ equity, motivated seller, property condition suitable for rehab.`;

  const config = {
    ...agentConfig,
    agent: {
      ...agentConfig.agent,
      prompt: {
        ...agentConfig.agent.prompt,
        prompt: contextualPrompt,
      },
      first_message: `Hi ${lead.firstName}, this is calling from Next Level Real Estate. How are you doing today? I'm reaching out about your property at ${property.address}. Do you have a few minutes to chat?`,
    },
  };

  return await client.post('/convai/conversations', config);
}

async function getConversationStrategy(lead, property) {
  // Query RAG knowledge base for optimal strategy
  const strategy = await vectorDB.search({
    query: `conversation strategy for ${lead.intent} seller with ${property.condition} property`,
    collection: 'conversation-patterns',
    limit: 3,
  });

  return strategy.map(s => `- ${s.content}`).join('\n');
}
```

## WebSocket Connection

### Real-Time Audio Streaming

```javascript
const WebSocket = require('ws');
const { PassThrough } = require('stream');

async function connectConversationWebSocket(conversationId) {
  const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?conversation_id=${conversationId}`;

  const ws = new WebSocket(wsUrl, {
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
    },
  });

  ws.on('open', () => {
    console.log('ElevenLabs WebSocket connected');

    // Send initial configuration
    ws.send(JSON.stringify({
      type: 'conversation_initiation_client_data',
      conversation_config_override: {
        agent: {
          // Override any config here
        },
      },
    }));
  });

  ws.on('message', (data) => {
    const message = JSON.parse(data);

    switch (message.type) {
      case 'audio':
        // Received audio chunk from ElevenLabs
        handleAudioFromAgent(message.audio); // Base64 encoded PCM
        break;

      case 'agent_response':
        // Agent's text response
        console.log('Agent said:', message.text);
        logTranscript('agent', message.text);
        break;

      case 'user_transcript':
        // User's speech transcribed
        console.log('User said:', message.text);
        logTranscript('user', message.text);
        break;

      case 'interruption':
        // User interrupted agent
        console.log('User interrupted');
        handleInterruption();
        break;

      case 'agent_thinking':
        // Agent is processing (show loading indicator)
        console.log('Agent is thinking...');
        break;

      case 'conversation_ended':
        // Conversation complete
        console.log('Conversation ended');
        handleCallEnd(message.metadata);
        break;

      case 'error':
        console.error('ElevenLabs error:', message.error);
        break;
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log('WebSocket closed');
  });

  return ws;
}

// Send user audio to ElevenLabs
function sendUserAudio(ws, audioChunk) {
  // audioChunk should be PCM 16-bit 16kHz mono
  const base64Audio = audioChunk.toString('base64');

  ws.send(JSON.stringify({
    type: 'audio',
    audio: base64Audio,
  }));
}
```

## Voice Cloning

### Creating Custom Voice

```javascript
// Upload voice samples for cloning
async function cloneVoice(name, description, audioFiles) {
  const formData = new FormData();

  formData.append('name', name);
  formData.append('description', description);

  // Add audio samples (minimum 1 minute total, 25+ samples recommended)
  for (const file of audioFiles) {
    formData.append('files', fs.createReadStream(file));
  }

  // Labels for voice characteristics
  formData.append('labels', JSON.stringify({
    accent: 'american',
    age: 'middle_aged',
    gender: 'male',
    use_case: 'real_estate_sales',
  }));

  const response = await client.post('/voices/add', formData, {
    headers: formData.getHeaders(),
  });

  return {
    voiceId: response.data.voice_id,
    name: response.data.name,
    status: response.data.status, // 'processing' or 'ready'
  };
}

// Best practices for voice cloning
const VOICE_CLONING_GUIDELINES = {
  audioQuality: {
    sampleRate: '44.1kHz or 48kHz',
    format: 'WAV or MP3 (320kbps)',
    background: 'Silent or minimal noise',
    duration: '1-5 minutes total',
  },

  content: {
    samples: '25+ clips of varied speech',
    emotions: 'Include different tones: friendly, serious, excited',
    pacing: 'Natural conversational pace',
    avoid: 'Music, other voices, loud background noise',
  },

  recording: {
    microphone: 'Studio quality (e.g., Shure SM7B, Rode NT1)',
    environment: 'Quiet room with acoustic treatment',
    distance: '6-12 inches from microphone',
    levels: 'Peak at -6dB to -3dB',
  },
};
```

## Text-to-Sound-Effects

### Generating Sound Effects

```javascript
// Generate sound effects for enhanced conversations
async function generateSoundEffect(description) {
  const response = await client.post('/sound-generation', {
    text: description,
    duration_seconds: 2.0,
    prompt_influence: 0.5,
  });

  const audioUrl = response.data.audio_url;
  return audioUrl;
}

// Example: Door knock for realistic call opening
const doorKnock = await generateSoundEffect('gentle door knock, realistic, clear');

// Use in conversation intro
const introAudio = await mixAudio([
  doorKnock,
  await textToSpeech('Hi, this is calling from Next Level Real Estate...'),
]);
```

## Sentiment Analysis

### Real-Time Emotion Detection

```javascript
// Monitor sentiment during call
let currentSentiment = {
  score: 0, // -1 to 1
  emotion: 'neutral',
  confidence: 0,
};

ws.on('message', (data) => {
  const message = JSON.parse(data);

  if (message.type === 'user_transcript') {
    // Analyze sentiment of user's speech
    const sentiment = analyzeSentiment(message.text);

    currentSentiment = sentiment;

    // Alert if sentiment drops significantly
    if (sentiment.score < -0.5) {
      console.warn('Negative sentiment detected!');
      await notifyAgent('user_upset', sentiment);
    }

    // Log for post-call analysis
    logSentiment(message.timestamp, sentiment);
  }
});

function analyzeSentiment(text) {
  // Use sentiment analysis library or API
  const Sentiment = require('sentiment');
  const sentiment = new Sentiment();
  const result = sentiment.analyze(text);

  return {
    score: result.comparative, // -1 to 1
    emotion: determineEmotion(result),
    confidence: Math.abs(result.comparative),
  };
}
```

## Call Analytics

### Post-Call Analysis

```javascript
// Get conversation details after call ends
async function analyzeConversation(conversationId) {
  const response = await client.get(`/convai/conversations/${conversationId}`);
  const conversation = response.data;

  // Extract transcript
  const transcript = conversation.messages.map(msg => ({
    speaker: msg.role, // 'agent' or 'user'
    text: msg.content,
    timestamp: msg.timestamp,
  }));

  // Calculate metrics
  const metrics = {
    duration: conversation.duration_seconds,
    agentTalkTime: calculateTalkTime(transcript, 'agent'),
    userTalkTime: calculateTalkTime(transcript, 'user'),
    interruptionCount: conversation.interruptions.length,
    turnCount: transcript.length,
    avgTurnDuration: conversation.duration_seconds / transcript.length,
  };

  // Sentiment analysis
  const sentimentTimeline = transcript.map(t => ({
    timestamp: t.timestamp,
    speaker: t.speaker,
    sentiment: analyzeSentiment(t.text),
  }));

  const avgSentiment = sentimentTimeline
    .filter(s => s.speaker === 'user')
    .reduce((sum, s) => sum + s.sentiment.score, 0) / sentimentTimeline.length;

  // Extract key moments
  const keyMoments = identifyKeyMoments(transcript, sentimentTimeline);

  return {
    conversationId,
    transcript,
    metrics,
    avgSentiment,
    keyMoments,
    outcome: determineCallOutcome(transcript, metrics, avgSentiment),
  };
}

function identifyKeyMoments(transcript, sentiment) {
  const moments = [];

  // Identify objections
  const objectionKeywords = ['but', 'however', 'not sure', 'concern', 'worried'];
  transcript.forEach((turn, index) => {
    if (turn.speaker === 'user') {
      if (objectionKeywords.some(kw => turn.text.toLowerCase().includes(kw))) {
        moments.push({
          type: 'objection',
          timestamp: turn.timestamp,
          text: turn.text,
          agentResponse: transcript[index + 1]?.text,
        });
      }
    }
  });

  // Identify commitment language
  const commitmentKeywords = ['yes', 'sounds good', 'let\'s do it', 'schedule', 'when'];
  transcript.forEach(turn => {
    if (turn.speaker === 'user') {
      if (commitmentKeywords.some(kw => turn.text.toLowerCase().includes(kw))) {
        moments.push({
          type: 'commitment',
          timestamp: turn.timestamp,
          text: turn.text,
        });
      }
    }
  });

  return moments;
}
```

## TCPA Compliance

### Consent Verification

```javascript
// Verify consent before starting conversation
async function verifyConsentBeforeCall(lead) {
  const consent = await db.collection('leads').findOne(
    { _id: lead._id },
    { projection: { consent: 1, dncStatus: 1 } }
  );

  // Check written consent
  if (!consent.hasWrittenConsent) {
    throw new Error('TCPA_VIOLATION: No written consent on file');
  }

  // Check consent expiration
  if (consent.expiresAt && new Date(consent.expiresAt) < new Date()) {
    throw new Error('TCPA_VIOLATION: Consent expired');
  }

  // Check DNC status
  if (consent.dncStatus.onNationalRegistry) {
    throw new Error('TCPA_VIOLATION: On National Do-Not-Call Registry');
  }

  if (consent.dncStatus.internalDNC) {
    throw new Error('TCPA_VIOLATION: On internal DNC list');
  }

  // Check if automated calls allowed
  if (!consent.automatedCallsAllowed) {
    throw new Error('TCPA_VIOLATION: Automated calls not permitted');
  }

  return true;
}

// Log all call attempts for audit trail
async function logCallAttempt(lead, conversation) {
  await db.collection('call_logs').insertOne({
    leadId: lead._id,
    conversationId: conversation.conversation_id,
    timestamp: new Date(),
    type: 'automated', // or 'manual'
    consentVerified: true,
    dncCheckPassed: true,
    outcome: 'initiated',
  });
}
```

## Error Handling

```javascript
async function safeConversationStart(lead, property) {
  try {
    // Verify compliance
    await verifyConsentBeforeCall(lead);

    // Start conversation
    const conversation = await startCallWithContext(lead, property);

    // Log attempt
    await logCallAttempt(lead, conversation);

    return conversation;

  } catch (error) {
    if (error.message.startsWith('TCPA_VIOLATION')) {
      console.error(`TCPA violation prevented call to ${lead.phone}:`, error.message);
      await flagLeadForReview(lead, error.message);
      return null;
    }

    if (error.response?.status === 429) {
      console.warn('ElevenLabs rate limit hit, retrying in 60s');
      await sleep(60000);
      return safeConversationStart(lead, property);
    }

    if (error.response?.status === 401) {
      console.error('ElevenLabs authentication failed');
      await refreshAPIKey();
      return safeConversationStart(lead, property);
    }

    throw error;
  }
}
```

## Environment Variables

```bash
# .env
ELEVENLABS_API_KEY=your_api_key
ELEVENLABS_VOICE_ID=your_default_voice_id
ELEVENLABS_MODEL=eleven_flash_v2_5
ELEVENLABS_HIPAA_ENABLED=false
```

## Resources

- [ElevenLabs API Documentation](https://elevenlabs.io/docs)
- [Conversational AI Guide](https://elevenlabs.io/docs/conversational-ai/overview)
- [Voice Cloning Best Practices](https://elevenlabs.io/docs/voice-cloning/best-practices)
- [WebSocket API Reference](https://elevenlabs.io/docs/api-reference/websocket)
- [Flash 2.5 Model Details](https://elevenlabs.io/docs/models/flash-2-5)
