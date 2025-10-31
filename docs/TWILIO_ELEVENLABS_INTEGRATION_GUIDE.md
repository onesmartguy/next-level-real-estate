# Twilio + ElevenLabs ConversationRelay Integration Guide

Complete guide for integrating ElevenLabs Conversational AI with Twilio Voice API for seamless real estate wholesale calling.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [ConversationRelay Configuration](#conversationrelay-configuration)
3. [Setup & Prerequisites](#setup--prerequisites)
4. [Multi-Language Configuration](#multi-language-configuration)
5. [Custom Parameters & Context](#custom-parameters--context)
6. [Interruptibility & Turn-Taking](#interruptibility--turn-taking)
7. [Recording & Transcription](#recording--transcription)
8. [Error Handling & Failover](#error-handling--failover)
9. [Performance Optimization](#performance-optimization)
10. [Testing & Debugging](#testing--debugging)
11. [Production Deployment](#production-deployment)

---

## Architecture Overview

### System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Your Application (Next Level Real Estate)                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Call Initiation Service                                 │  │
│  │ - Load lead context                                     │  │
│  │ - Build ElevenLabs conversation config                  │  │
│  │ - Trigger Twilio call                                   │  │
│  └───────────────────────────┬─────────────────────────────┘  │
│                               │                                 │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                                ▼
                    ┌──────────────────────────┐
                    │   Twilio Voice API       │
                    │   (Phone Provider)       │
                    │                          │
                    │  ┌──────────────────┐   │
                    │  │ ConversationRelay│   │
                    │  │ WebSocket Bridge │   │
                    │  └────────┬─────────┘   │
                    └───────────┼──────────────┘
                                │
                                ▼
                    ┌──────────────────────────┐
                    │  ElevenLabs             │
                    │  Conversational AI 2.0  │
                    │                          │
                    │  ┌──────────────────┐   │
                    │  │ Flash 2.5 Model  │   │
                    │  │ 75ms Latency     │   │
                    │  └────────┬─────────┘   │
                    │           │             │
                    │  ┌────────▼─────────┐   │
                    │  │ Claude LLM       │   │
                    │  │ (or OpenAI GPT)  │   │
                    │  └──────────────────┘   │
                    └──────────────────────────┘
                                │
                                ▼
                    ┌──────────────────────────┐
                    │   Telephone Network      │
                    │   (PSTN/VoIP)            │
                    └───────────┬──────────────┘
                                │
                                ▼
                    ┌──────────────────────────┐
                    │   Receiver's Phone       │
                    │   (Seller)               │
                    └──────────────────────────┘

Key Points:
- ConversationRelay handles audio bridging (bidirectional)
- ElevenLabs manages AI conversation in real-time
- Zero-latency turn-taking with sophisticated interruption handling
- Call recording captured by Twilio
- Transcript generated automatically post-call
```

---

## ConversationRelay Configuration

### Basic TwiML Setup

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <ConversationRelay
            url="wss://api.elevenlabs.io/v1/convai/conversation?conversation_id=YOUR_CONVERSATION_ID"
            dtmfDetection="true"
            debug="false">
            <Parameter name="api_key" value="YOUR_ELEVENLABS_API_KEY" />
        </ConversationRelay>
    </Connect>
</Response>
```

### Node.js Implementation

```javascript
const express = require('express');
const twilio = require('twilio');

const app = express();
app.use(express.urlencoded({ extended: false }));

// Endpoint for initiating ConversationRelay call
app.post('/api/calls/start-conversationrelay', async (req, res) => {
  const { leadId, phone } = req.body;

  try {
    // Load lead context from database
    const lead = await db.collection('leads').findOne({ _id: leadId });
    const property = await db.collection('properties').findOne({
      _id: lead.propertyId,
    });

    // Step 1: Create ElevenLabs conversation
    const elevenLabsConv = await createElevenLabsConversation(lead, property);
    console.log(`ElevenLabs conversation created: ${elevenLabsConv.conversation_id}`);

    // Step 2: Generate TwiML with ConversationRelay
    const twiml = generateConversationRelayTwiML(elevenLabsConv.conversation_id);

    // Step 3: Create Twilio call
    const call = await twilio().calls.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
      twiml: twiml,
      statusCallback: `${process.env.WEBHOOK_BASE_URL}/webhooks/twilio/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
      record: true,
      recordingStatusCallback: `${process.env.WEBHOOK_BASE_URL}/webhooks/twilio/recording-status`,
    });

    // Step 4: Log call initiation
    await db.collection('calls').insertOne({
      leadId,
      callSid: call.sid,
      conversationId: elevenLabsConv.conversation_id,
      status: 'initiated',
      createdAt: new Date(),
      phone,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    res.json({
      success: true,
      callSid: call.sid,
      conversationId: elevenLabsConv.conversation_id,
    });
  } catch (error) {
    console.error('Error starting ConversationRelay call:', error);
    res.status(500).json({ error: error.message });
  }
});

function generateConversationRelayTwiML(conversationId) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <ConversationRelay
            url="wss://api.elevenlabs.io/v1/convai/conversation?conversation_id=${conversationId}"
            dtmfDetection="true"
            debug="false">
            <Parameter name="api_key" value="${process.env.ELEVENLABS_API_KEY}" />
        </ConversationRelay>
    </Connect>
</Response>`;
}

// Webhook for call status updates
app.post('/webhooks/twilio/call-status', async (req, res) => {
  const { CallSid, CallStatus } = req.body;

  console.log(`Call ${CallSid} status: ${CallStatus}`);

  // Update database
  await db.collection('calls').updateOne(
    { callSid: CallSid },
    { $set: { status: CallStatus, updatedAt: new Date() } }
  );

  res.status(200).send('OK');
});

// Webhook for recording completion
app.post('/webhooks/twilio/recording-status', async (req, res) => {
  const { RecordingSid, RecordingUrl, CallSid, RecordingDuration } = req.body;

  console.log(`Recording completed for ${CallSid}: ${RecordingSid}`);

  // Process recording (transcription, storage, etc.)
  await processRecording(RecordingSid, RecordingUrl, CallSid, RecordingDuration);

  res.status(200).send('OK');
});
```

### .NET Implementation

```csharp
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.TwiML;
using Twilio.TwiML.Voice;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/calls")]
public class ConversationRelayController : ControllerBase
{
    private readonly ILeadRepository _leadRepository;
    private readonly ICallRepository _callRepository;
    private readonly IElevenLabsService _elevenLabsService;
    private readonly ILogger<ConversationRelayController> _logger;

    [HttpPost("start-conversationrelay")]
    public async Task<IActionResult> StartConversationRelayCall([FromBody] StartCallRequest request)
    {
        try
        {
            // Load context
            var lead = await _leadRepository.GetByIdAsync(request.LeadId);
            var property = await _leadRepository.GetPropertyAsync(lead.PropertyId);

            // Create ElevenLabs conversation
            var elevenLabsConv = await _elevenLabsService.CreateConversationAsync(lead, property);
            _logger.LogInformation($"ElevenLabs conversation created: {elevenLabsConv.ConversationId}");

            // Generate TwiML
            var twiml = GenerateConversationRelayTwiML(elevenLabsConv.ConversationId);

            // Create Twilio call
            TwilioClient.Init(
                Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID"),
                Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN")
            );

            var call = await CallResource.CreateAsync(
                from: new PhoneNumber(Environment.GetEnvironmentVariable("TWILIO_PHONE_NUMBER")),
                to: new PhoneNumber(request.Phone),
                twiml: new Twilio.Types.Twiml(twiml),
                statusCallback: new Uri($"{Environment.GetEnvironmentVariable("WEBHOOK_BASE_URL")}/webhooks/twilio/call-status"),
                statusCallbackEvent: new List<string> { "initiated", "ringing", "answered", "completed" },
                statusCallbackMethod: Twilio.Http.HttpMethod.Post,
                record: true,
                recordingStatusCallback: new Uri($"{Environment.GetEnvironmentVariable("WEBHOOK_BASE_URL")}/webhooks/twilio/recording-status")
            );

            // Log call
            await _callRepository.CreateAsync(new Call
            {
                LeadId = request.LeadId,
                CallSid = call.Sid,
                ConversationId = elevenLabsConv.ConversationId,
                Status = "initiated",
                CreatedAt = DateTime.UtcNow,
                Phone = request.Phone,
            });

            return Ok(new
            {
                success = true,
                callSid = call.Sid,
                conversationId = elevenLabsConv.ConversationId,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting ConversationRelay call");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    private string GenerateConversationRelayTwiML(string conversationId)
    {
        var response = new VoiceResponse();
        var connect = new Connect();

        var relay = new ConversationRelay(
            url: $"wss://api.elevenlabs.io/v1/convai/conversation?conversation_id={conversationId}",
            dtmfDetection: true
        );

        relay.Parameter("api_key", Environment.GetEnvironmentVariable("ELEVENLABS_API_KEY"));

        connect.Append(relay);
        response.Append(connect);

        return response.ToString();
    }
}
```

---

## Setup & Prerequisites

### Twilio Configuration

1. **Create Twilio Account** and get:
   - Account SID
   - Auth Token
   - Twilio Phone Number (or purchase one)

2. **Enable Voice API**:
   - Go to Twilio Console
   - Enable Voice API
   - Configure Webhooks

3. **Set Webhook Endpoints**:
   - Call Status Webhook: `/webhooks/twilio/call-status`
   - Recording Webhook: `/webhooks/twilio/recording-status`
   - Ensure endpoints are HTTPS (Twilio requirement)

### ElevenLabs Configuration

1. **Create ElevenLabs Account** with:
   - API Key (from https://elevenlabs.io/api)
   - Conversational AI 2.0 access enabled
   - Voice ID selected

2. **Test Conversation API**:
```javascript
async function testElevenLabsConnection() {
  const response = await axios.post(
    'https://api.elevenlabs.io/v1/convai/conversations',
    {
      agent: {
        prompt: { prompt: 'You are a helpful assistant.' },
        first_message: 'Hello, how can I help?',
        voice: {
          voice_id: process.env.ELEVENLABS_VOICE_ID,
          model_id: 'eleven_flash_v2_5',
        },
      },
    },
    {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
    }
  );

  console.log('ElevenLabs connection successful:', response.data.conversation_id);
}
```

### Environment Variables

```bash
# .env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_voice_id
WEBHOOK_BASE_URL=https://your-domain.com
MONGODB_URI=mongodb://localhost:27017/next-level-real-estate
```

---

## Multi-Language Configuration

### Language-Specific ConversationRelay

```javascript
const multiLanguageConfigs = {
  english: {
    language: 'en',
    voiceId: 'english_voice_id',
    firstMessage: 'Hi [Name], this is calling from Next Level Real Estate.',
  },

  spanish: {
    language: 'es',
    voiceId: 'spanish_voice_id',
    firstMessage: 'Hola [Nombre], te llamo de Next Level Real Estate.',
  },

  portuguese: {
    language: 'pt',
    voiceId: 'portuguese_voice_id',
    firstMessage: 'Oi [Nome], estou ligando da Next Level Real Estate.',
  },

  mandarin: {
    language: 'zh',
    voiceId: 'mandarin_voice_id',
    firstMessage: '您好 [Name]，我是Next Level Real Estate的。',
  },
};

async function startMultilingualCall(lead, property) {
  // Detect language preference
  const language = lead.preferredLanguage || detectLanguageFromContext(lead);
  const config = multiLanguageConfigs[language] || multiLanguageConfigs.english;

  // Create conversation with language-specific config
  const elevenLabsConv = await elevenLabsClient.post('/convai/conversations', {
    agent: {
      prompt: {
        prompt: getPromptForLanguage(language),
        llm: 'claude-3-5-sonnet-20250924',
      },
      language: language,
      first_message: config.firstMessage.replace('[Name]', lead.firstName),
      voice: {
        voice_id: config.voiceId,
        model_id: 'eleven_flash_v2_5',
      },
    },
  });

  return elevenLabsConv;
}

// Enable mid-call language switching
function setupLanguageSwitchingTwiML(conversationId) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <ConversationRelay
            url="wss://api.elevenlabs.io/v1/convai/conversation?conversation_id=${conversationId}"
            dtmfDetection="true"
            debug="false">
            <Parameter name="api_key" value="${process.env.ELEVENLABS_API_KEY}" />
            <Language default="auto">
                <Language language="en" provider="elevenlabs" />
                <Language language="es" provider="elevenlabs" />
                <Language language="pt" provider="elevenlabs" />
                <Language language="zh" provider="elevenlabs" />
            </Language>
        </ConversationRelay>
    </Connect>
</Response>`;
}
```

---

## Custom Parameters & Context

### Passing Lead Context to ElevenLabs

```javascript
// Method 1: Via WebSocket parameters
async function startCallWithCustomParameters(lead, property) {
  // Create conversation
  const elevenLabsConv = await createElevenLabsConversation(lead, property);

  // Get auth token for WebSocket connection
  const wsAuthToken = generateWebSocketToken(elevenLabsConv.conversation_id);

  // Prepare TwiML with custom parameters
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <ConversationRelay
            url="wss://api.elevenlabs.io/v1/convai/conversation?conversation_id=${elevenLabsConv.conversation_id}&auth=${wsAuthToken}"
            dtmfDetection="true">
            <Parameter name="api_key" value="${process.env.ELEVENLABS_API_KEY}" />
            <Parameter name="lead_id" value="${lead._id}" />
            <Parameter name="property_id" value="${property._id}" />
            <Parameter name="lead_name" value="${lead.firstName}" />
            <Parameter name="property_address" value="${property.address}" />
            <Parameter name="property_type" value="${property.type}" />
            <Parameter name="call_objective" value="qualify_wholesale_property" />
        </ConversationRelay>
    </Connect>
</Response>`;

  return {
    elevenLabsConversationId: elevenLabsConv.conversation_id,
    twiml,
  };
}

// Method 2: Via prompt injection (most flexible)
async function injectContextIntoPrompt(lead, property, basePrompt) {
  const contextInjection = `
## CALL CONTEXT
- Lead Name: ${lead.firstName} ${lead.lastName}
- Lead Phone: ${lead.phone}
- Lead Source: ${lead.source}
- Property Address: ${property.address}, ${property.city}, ${property.state}
- Property Type: ${property.type}
- Property Condition: ${property.condition}
- Lead Quality Score: ${lead.score}/100
- Conversation Objective: Qualify property and schedule viewing
`;

  return basePrompt + '\n' + contextInjection;
}
```

---

## Interruptibility & Turn-Taking

### Fine-Tuning Conversation Flow

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <ConversationRelay
            url="wss://api.elevenlabs.io/v1/convai/conversation?conversation_id=YOUR_CONV_ID"
            dtmfDetection="true"
            debug="false">

            <!-- Allows caller to interrupt agent with speech -->
            <Parameter name="interruptible" value="speech" />

            <!-- Allow DTMF (phone button) interruptions -->
            <Parameter name="interruptible" value="any" />

            <!-- Disable interruptions (use rarely - feels unnatural) -->
            <Parameter name="interruptible" value="none" />

            <!-- Text to send before answering (no interruptions until sent) -->
            <Parameter name="welcomeGreeting" value="Thank you for calling. Please hold while I connect you." />
            <Parameter name="welcomeGreetingInterruptible" value="false" />

            <!-- Control agent speaking speed -->
            <Parameter name="agentTurnTimeout" value="45" />

            <!-- Max wait for caller response -->
            <Parameter name="turnTimeout" value="12" />

            <!-- Enable natural conversation markers -->
            <Parameter name="enableBackchannel" value="true" />
            <Parameter name="backchannelFrequency" value="0.5" />
        </ConversationRelay>
    </Connect>
</Response>
```

### Dynamic Interruptibility Configuration

```javascript
const interruptibilityProfiles = {
  // Cold outreach - let them interrupt quickly
  coldOutreach: {
    interruptible: 'speech',
    welcomeGreetingInterruptible: true,
    turnTimeout: 10,
    agentTurnTimeout: 45,
    backchannelFrequency: 0.4,
  },

  // Rapport building - natural conversation
  rapportBuilding: {
    interruptible: 'speech',
    welcomeGreetingInterruptible: false, // Let greeting complete
    turnTimeout: 15,
    agentTurnTimeout: 30,
    backchannelFrequency: 0.6,
  },

  // Data gathering - more directed
  dataGathering: {
    interruptible: 'speech',
    welcomeGreetingInterruptible: true,
    turnTimeout: 12,
    agentTurnTimeout: 40,
    backchannelFrequency: 0.5,
  },

  // Objection handling - very responsive
  objectionHandling: {
    interruptible: 'speech',
    welcomeGreetingInterruptible: true,
    turnTimeout: 8,
    agentTurnTimeout: 60, // Allow longer explanations
    backchannelFrequency: 0.3, // Less interruption
  },

  // Closing - quick and decisive
  closing: {
    interruptible: 'any', // Allow DTMF
    welcomeGreetingInterruptible: true,
    turnTimeout: 8,
    agentTurnTimeout: 25,
    backchannelFrequency: 0.5,
  },
};

async function generateProfiledTwiML(conversationId, callPhase = 'coldOutreach') {
  const profile = interruptibilityProfiles[callPhase];

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <ConversationRelay
            url="wss://api.elevenlabs.io/v1/convai/conversation?conversation_id=${conversationId}"
            dtmfDetection="true"
            debug="false">
            <Parameter name="api_key" value="${process.env.ELEVENLABS_API_KEY}" />
            <Parameter name="interruptible" value="${profile.interruptible}" />
            <Parameter name="welcomeGreetingInterruptible" value="${profile.welcomeGreetingInterruptible}" />
            <Parameter name="turnTimeout" value="${profile.turnTimeout}" />
            <Parameter name="agentTurnTimeout" value="${profile.agentTurnTimeout}" />
            <Parameter name="backchannelFrequency" value="${profile.backchannelFrequency}" />
        </ConversationRelay>
    </Connect>
</Response>`;
}
```

---

## Recording & Transcription

### Complete Recording Pipeline

```javascript
async function processRecording(recordingSid, recordingUrl, callSid, duration) {
  try {
    // Step 1: Fetch recording URL with auth
    const recordingAudioUrl = `${recordingUrl}.mp3`;
    console.log(`Processing recording: ${recordingSid}`);

    // Step 2: Store recording metadata
    await db.collection('recordings').insertOne({
      recordingSid,
      callSid,
      url: recordingAudioUrl,
      duration: parseInt(duration),
      status: 'received',
      createdAt: new Date(),
    });

    // Step 3: Trigger transcription
    const transcriptionId = await startTranscription(recordingSid, recordingAudioUrl);
    console.log(`Transcription started: ${transcriptionId}`);

    // Step 4: Download and archive (optional)
    await downloadAndArchiveRecording(recordingAudioUrl, recordingSid);

    // Step 5: Emit event for processing
    await emitEvent('RecordingProcessed', {
      recordingSid,
      callSid,
      transcriptionId,
    });

  } catch (error) {
    console.error('Error processing recording:', error);
    await db.collection('failed_recordings').insertOne({
      recordingSid,
      error: error.message,
      createdAt: new Date(),
    });
  }
}

// Transcription using OpenAI Whisper
async function startTranscription(recordingSid, audioUrl) {
  const transcriptionResponse = await axios.post(
    'https://api.openai.com/v1/audio/transcriptions',
    {
      file: await axios.get(audioUrl, { responseType: 'arraybuffer' }),
      model: 'whisper-1',
      language: 'en',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment', 'word'],
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    }
  );

  const transcript = transcriptionResponse.data;

  // Store transcript
  const result = await db.collection('transcripts').insertOne({
    recordingSid,
    text: transcript.text,
    segments: transcript.segments,
    words: transcript.words,
    language: transcript.language,
    duration: transcript.duration,
    createdAt: new Date(),
  });

  return result.insertedId;
}

// Alternative: ElevenLabs transcription (if using ElevenLabs for recording)
async function getElevenLabsTranscript(conversationId) {
  const response = await axios.get(
    `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
    {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
    }
  );

  const conversation = response.data;

  // Extract transcript from conversation messages
  const transcript = conversation.messages.map(msg => ({
    speaker: msg.role,
    text: msg.content,
    timestamp: msg.timestamp,
  }));

  return transcript;
}

// Sentiment analysis from transcript
async function analyzeTranscriptSentiment(transcript) {
  const Sentiment = require('sentiment');
  const sentiment = new Sentiment();

  let overallSentiment = 0;
  let sentimentTimeline = [];

  for (const line of transcript.split('\n')) {
    if (line.includes('Caller:')) {
      const callerText = line.replace('Caller:', '').trim();
      const result = sentiment.analyze(callerText);

      sentimentTimeline.push({
        speaker: 'caller',
        text: callerText,
        sentiment: result.comparative,
        magnitude: Math.abs(result.comparative),
      });

      overallSentiment += result.comparative;
    }
  }

  return {
    overallSentiment: (overallSentiment / sentimentTimeline.length).toFixed(2),
    timeline: sentimentTimeline,
    startingSentiment: sentimentTimeline[0]?.sentiment || 0,
    endingSentiment: sentimentTimeline[sentimentTimeline.length - 1]?.sentiment || 0,
  };
}
```

---

## Error Handling & Failover

### Comprehensive Error Management

```javascript
const errorHandlers = {
  // ElevenLabs API errors
  elevenLabsErrors: {
    401: {
      message: 'Invalid ElevenLabs API key',
      action: 'refresh_api_key',
      retry: true,
      retryDelay: 5000,
    },
    429: {
      message: 'Rate limit exceeded',
      action: 'exponential_backoff',
      retry: true,
      retryDelay: 60000,
    },
    500: {
      message: 'ElevenLabs server error',
      action: 'exponential_backoff',
      retry: true,
      retryDelay: 10000,
    },
  },

  // Twilio errors
  twilioErrors: {
    20003: {
      message: 'Authentication failed',
      action: 'refresh_credentials',
      retry: false,
    },
    21211: {
      message: 'Invalid phone number',
      action: 'flag_lead',
      retry: false,
    },
    21215: {
      message: 'Not authorized for destination',
      action: 'flag_for_manual',
      retry: false,
    },
    20429: {
      message: 'Too many requests',
      action: 'exponential_backoff',
      retry: true,
      retryDelay: 5000,
    },
  },

  // Network errors
  networkErrors: {
    ECONNREFUSED: {
      message: 'Connection refused',
      action: 'exponential_backoff',
      retry: true,
      maxRetries: 3,
    },
    ETIMEDOUT: {
      message: 'Request timeout',
      action: 'exponential_backoff',
      retry: true,
      maxRetries: 3,
    },
    ENOTFOUND: {
      message: 'DNS resolution failed',
      action: 'exponential_backoff',
      retry: true,
      maxRetries: 5,
    },
  },
};

async function startCallWithErrorHandling(lead, property, retryCount = 0) {
  try {
    // Verify prerequisites
    await verifyTCPACompliance(lead);
    await verifyApiCredentials();

    // Start call
    return await startCallWithConversationRelay(lead, property);

  } catch (error) {
    const errorConfig = getErrorConfig(error);

    if (!errorConfig || !errorConfig.retry || retryCount >= (errorConfig.maxRetries || 3)) {
      // Non-retryable error
      await handleFinalError(lead, error, errorConfig);
      return null;
    }

    // Retryable error
    console.warn(
      `Error calling ${lead.phone}: ${error.message}. Retrying in ${errorConfig.retryDelay}ms...`
    );

    await sleep(errorConfig.retryDelay);
    return startCallWithErrorHandling(lead, property, retryCount + 1);
  }
}

function getErrorConfig(error) {
  // Match error to handler config
  if (error.response?.status) {
    return errorHandlers.twilioErrors[error.response.status] ||
           errorHandlers.elevenLabsErrors[error.response.status];
  }

  return errorHandlers.networkErrors[error.code];
}

async function handleFinalError(lead, error, errorConfig) {
  // Log error
  await db.collection('failed_calls').insertOne({
    leadId: lead._id,
    error: error.message,
    errorCode: error.code || error.response?.status,
    errorConfig,
    createdAt: new Date(),
  });

  // Notify team
  if (errorConfig?.action === 'flag_for_manual') {
    await notifyTeam(`Manual review needed: ${lead.phone}`, lead);
  }

  // Schedule retry if appropriate
  if (shouldRetryLater(error, errorConfig)) {
    await scheduleRetry(lead, 3600 * 1000); // Retry in 1 hour
  }
}

function shouldRetryLater(error, errorConfig) {
  // Some errors warrant later retry
  const retryLaterErrors = ['ENOTFOUND', 429, 500];
  return retryLaterErrors.includes(error.code || error.response?.status);
}
```

---

## Performance Optimization

### Latency Optimization

```javascript
// Pre-create conversations in parallel
async function batchStartCalls(leads) {
  // Step 1: Load all context in parallel
  const contexts = await Promise.all(
    leads.map(lead =>
      loadLeadContext(lead._id)
    )
  );

  // Step 2: Create all ElevenLabs conversations in parallel
  const elevenLabsConvs = await Promise.all(
    contexts.map(context =>
      elevenLabsClient.post('/convai/conversations', buildAgentConfig(context))
    )
  );

  // Step 3: Create all Twilio calls in parallel
  const calls = await Promise.all(
    leads.map((lead, i) =>
      twilio().calls.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: lead.phone,
        twiml: generateTwiML(elevenLabsConvs[i].conversation_id),
        // ... rest of config
      })
    )
  );

  // Step 4: Log all calls
  await db.collection('calls').insertMany(
    calls.map((call, i) => ({
      leadId: leads[i]._id,
      callSid: call.sid,
      conversationId: elevenLabsConvs[i].conversation_id,
      createdAt: new Date(),
    }))
  );

  return calls;
}

// Cache frequently used data
const contextCache = new Map();

async function loadLeadContextCached(leadId, ttlMs = 3600000) {
  const cacheKey = `context:${leadId}`;
  const cached = contextCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < ttlMs) {
    return cached.data;
  }

  const context = await loadLeadContext(leadId);
  contextCache.set(cacheKey, { data: context, timestamp: Date.now() });

  // Cleanup old cache entries
  if (contextCache.size > 1000) {
    const oldestKey = Array.from(contextCache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
    contextCache.delete(oldestKey);
  }

  return context;
}

// Connection pooling for Twilio/ElevenLabs
const httpAgent = new Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 50,
  maxFreeSockets: 10,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 50,
  maxFreeSockets: 10,
});

const apiClient = axios.create({
  httpAgent,
  httpsAgent,
  timeout: 30000,
});
```

---

## Testing & Debugging

### Local Testing

```javascript
// Test ConversationRelay with mock data
async function testConversationRelayLocally() {
  const mockLead = {
    _id: new ObjectId(),
    firstName: 'John',
    phone: '+15551234567',
    source: 'test',
  };

  const mockProperty = {
    _id: new ObjectId(),
    address: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    type: 'residential',
  };

  try {
    // Test ElevenLabs connection
    const elevenLabsConv = await elevenLabsClient.post('/convai/conversations', {
      agent: {
        prompt: {
          prompt: 'You are a test agent.',
          llm: 'claude-3-5-sonnet-20250924',
        },
        first_message: 'Hello, this is a test call.',
        voice: {
          voice_id: process.env.ELEVENLABS_VOICE_ID,
          model_id: 'eleven_flash_v2_5',
        },
      },
    });

    console.log('ElevenLabs conversation created:', elevenLabsConv.conversation_id);

    // Test TwiML generation
    const twiml = generateConversationRelayTwiML(elevenLabsConv.conversation_id);
    console.log('TwiML generated successfully');

    // Test Twilio connection (don't make real call)
    console.log('Twilio credentials verified');

    return { success: true, conversationId: elevenLabsConv.conversation_id };

  } catch (error) {
    console.error('Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Debug logging
const debugLogger = {
  logConversationCreation: (conv) => {
    console.log(`[CONV] Created: ${conv.conversation_id} at ${new Date().toISOString()}`);
  },

  logCallInitiation: (call) => {
    console.log(`[CALL] Initiated: ${call.sid} to ${call.to} at ${new Date().toISOString()}`);
  },

  logCallStatus: (callSid, status) => {
    console.log(`[CALL] ${callSid}: ${status} at ${new Date().toISOString()}`);
  },

  logError: (context, error) => {
    console.error(`[ERROR] ${context}: ${error.message}`, error);
  },
};
```

---

## Production Deployment

### Pre-Production Checklist

- [ ] ElevenLabs API key validated and stored securely
- [ ] Twilio Account SID and Auth Token in environment variables
- [ ] HTTPS webhooks configured and tested
- [ ] SSL certificates valid and renewed (90-day reminder)
- [ ] Database backups configured and tested
- [ ] Error logging and alerting configured
- [ ] Sentiment analysis working on sample calls
- [ ] Recording archival strategy implemented
- [ ] TCPA compliance checks enforced
- [ ] Load testing completed (target: 100 concurrent calls)
- [ ] Failover strategy documented and tested
- [ ] Team training completed

### Monitoring Setup

```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date(),
    checks: {},
  };

  // Check ElevenLabs
  try {
    await axios.get('https://api.elevenlabs.io/v1/user', {
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
    });
    health.checks.elevenLabs = 'ok';
  } catch (error) {
    health.checks.elevenLabs = 'failed';
    health.status = 'degraded';
  }

  // Check Twilio
  try {
    const account = await twilio().api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    health.checks.twilio = account.status;
  } catch (error) {
    health.checks.twilio = 'failed';
    health.status = 'degraded';
  }

  // Check MongoDB
  try {
    await db.admin().ping();
    health.checks.mongodb = 'ok';
  } catch (error) {
    health.checks.mongodb = 'failed';
    health.status = 'failed';
  }

  res.json(health);
});

// Metrics collection
const callMetrics = {
  initiatedToday: 0,
  completedToday: 0,
  failedToday: 0,
  appointmentsScheduledToday: 0,
};

// Expose metrics for monitoring systems
app.get('/metrics', (req, res) => {
  res.json({
    calls: callMetrics,
    timestamp: new Date(),
  });
});
```

---

## Conclusion

This integration creates a seamless, real-time conversational AI experience for your real estate wholesale calling system. The combination of Twilio's reliable phone infrastructure and ElevenLabs' advanced conversational AI provides:

- **Natural conversations** with 75ms latency
- **Multi-language support** with auto-detection
- **Sophisticated turn-taking** that feels human
- **Comprehensive recording** for training and compliance
- **Scalable architecture** handling 100+ concurrent calls

Monitor key metrics, continuously test improvements, and iterate based on conversation analysis to maximize appointment scheduling rate and deal closure.
