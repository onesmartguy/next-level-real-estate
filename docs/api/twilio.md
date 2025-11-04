# Twilio Voice API Integration

## Overview

Twilio Voice API provides programmable voice communications with native ElevenLabs ConversationRelay integration, Media Streams for bidirectional audio, and comprehensive call control via TwiML. The platform enables outbound calling with built-in TCPA compliance checkpoints and real-time call monitoring.

## Key Features

- **ConversationRelay**: Native integration with ElevenLabs Conversational AI 2.0
- **Media Streams**: Bidirectional real-time audio streaming via WebSocket
- **TwiML Call Control**: Programmable call flows with XML-based instructions
- **Call Status Webhooks**: Real-time updates on call lifecycle events
- **Recording & Transcription**: Automated call recording with transcription services
- **Programmable Voice SDK**: Client SDKs for browser and mobile applications
- **SIP Integration**: Connect with existing phone systems

## Prerequisites

- Twilio account with Voice API access
- Account SID and Auth Token from https://console.twilio.com
- Twilio phone number(s) for outbound calling
- Webhook endpoints configured with HTTPS
- ElevenLabs account for ConversationRelay integration

## Authentication

### Node.js Example

```javascript
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

// Verify credentials
async function verifyAccount() {
  try {
    const account = await client.api.accounts(accountSid).fetch();
    console.log(`Account verified: ${account.friendlyName}`);
    return true;
  } catch (error) {
    console.error('Authentication failed:', error.message);
    return false;
  }
}
```

### .NET Example

```csharp
using Twilio;
using Twilio.Rest.Api.V2010.Account;

TwilioClient.Init(
    Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID"),
    Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN")
);

// Verify credentials
var account = await AccountResource.FetchAsync();
Console.WriteLine($"Account verified: {account.FriendlyName}");
```

## ConversationRelay with ElevenLabs

### Starting a Call with ElevenLabs AI

```javascript
// Initialize call with ElevenLabs ConversationRelay
async function startAICall(lead, property) {
  // First, create ElevenLabs conversation
  const elevenLabsConversation = await createElevenLabsConversation(lead, property);

  const call = await client.calls.create({
    from: process.env.TWILIO_PHONE_NUMBER,
    to: lead.phone,
    twiml: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <ConversationRelay
            url="wss://api.elevenlabs.io/v1/convai/conversation?conversation_id=${elevenLabsConversation.conversation_id}"
            dtmfDetection="true"
            debug="true">
            <Parameter name="api_key" value="${process.env.ELEVENLABS_API_KEY}" />
        </ConversationRelay>
    </Connect>
</Response>`,
    statusCallback: `${process.env.WEBHOOK_BASE_URL}/webhooks/twilio/status`,
    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    statusCallbackMethod: 'POST',
    record: true,
    recordingStatusCallback: `${process.env.WEBHOOK_BASE_URL}/webhooks/twilio/recording`,
  });

  // Log call initiation
  await logCallInitiated(lead._id, call.sid, elevenLabsConversation.conversation_id);

  return {
    callSid: call.sid,
    conversationId: elevenLabsConversation.conversation_id,
    status: call.status,
  };
}

async function createElevenLabsConversation(lead, property) {
  const axios = require('axios');

  const response = await axios.post(
    'https://api.elevenlabs.io/v1/convai/conversations',
    {
      agent: {
        prompt: {
          prompt: generateConversationPrompt(lead, property),
          llm: 'claude-3-5-sonnet-20250924',
        },
        first_message: `Hi ${lead.firstName}, this is calling from Next Level Real Estate about your property at ${property.address}. Do you have a moment to chat?`,
        language: 'en',
        voice: {
          voice_id: process.env.ELEVENLABS_VOICE_ID,
          model_id: 'eleven_flash_v2_5',
        },
      },
    },
    {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}
```

### .NET Example

```csharp
using Twilio.TwiML;
using Twilio.TwiML.Voice;

public async Task<CallResource> StartAICall(Lead lead, Property property)
{
    // Create ElevenLabs conversation
    var elevenLabsConversation = await CreateElevenLabsConversation(lead, property);

    var response = new VoiceResponse();
    var connect = new Connect();

    var relay = new ConversationRelay(
        url: $"wss://api.elevenlabs.io/v1/convai/conversation?conversation_id={elevenLabsConversation.ConversationId}",
        dtmfDetection: true
    );
    relay.Parameter("api_key", Environment.GetEnvironmentVariable("ELEVENLABS_API_KEY"));

    connect.Append(relay);
    response.Append(connect);

    var call = await CallResource.CreateAsync(
        from: new PhoneNumber(Environment.GetEnvironmentVariable("TWILIO_PHONE_NUMBER")),
        to: new PhoneNumber(lead.Phone),
        twiml: new Twilio.Types.Twiml(response.ToString()),
        statusCallback: new Uri($"{Environment.GetEnvironmentVariable("WEBHOOK_BASE_URL")}/webhooks/twilio/status"),
        statusCallbackEvent: new List<string> { "initiated", "ringing", "answered", "completed" },
        statusCallbackMethod: Twilio.Http.HttpMethod.Post,
        record: true,
        recordingStatusCallback: new Uri($"{Environment.GetEnvironmentVariable("WEBHOOK_BASE_URL")}/webhooks/twilio/recording")
    );

    return call;
}
```

## Media Streams for Custom Audio Processing

### WebSocket Bidirectional Audio

```javascript
const WebSocket = require('ws');
const express = require('express');

const app = express();

// Endpoint to start call with Media Streams
app.post('/api/calls/start-with-media-stream', async (req, res) => {
  const { leadId, phone } = req.body;

  const call = await client.calls.create({
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
    url: `${process.env.WEBHOOK_BASE_URL}/twiml/media-stream`,
    statusCallback: `${process.env.WEBHOOK_BASE_URL}/webhooks/twilio/status`,
  });

  res.json({ callSid: call.sid });
});

// TwiML endpoint to initiate Media Stream
app.post('/twiml/media-stream', (req, res) => {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Please wait while we connect your call.</Say>
    <Connect>
        <Stream url="wss://${process.env.DOMAIN}/media-stream" />
    </Connect>
</Response>`;

  res.type('text/xml');
  res.send(twiml);
});

// WebSocket server for Media Stream
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
  console.log('Twilio Media Stream connected');

  let streamSid = null;
  let callSid = null;

  ws.on('message', (message) => {
    const msg = JSON.parse(message);

    switch (msg.event) {
      case 'start':
        streamSid = msg.start.streamSid;
        callSid = msg.start.callSid;
        console.log(`Stream started: ${streamSid} for call ${callSid}`);

        // Initialize audio processing pipeline
        initializeAudioPipeline(ws, streamSid);
        break;

      case 'media':
        // Incoming audio from caller (mulaw, base64 encoded)
        const audioChunk = Buffer.from(msg.media.payload, 'base64');

        // Process audio (send to speech recognition, etc.)
        processIncomingAudio(audioChunk, streamSid);
        break;

      case 'stop':
        console.log(`Stream stopped: ${streamSid}`);
        cleanupAudioPipeline(streamSid);
        break;
    }
  });

  ws.on('close', () => {
    console.log('Media Stream disconnected');
  });
});

// Send audio back to caller
function sendAudioToTwilio(ws, audioBuffer, streamSid) {
  const payload = audioBuffer.toString('base64');

  ws.send(JSON.stringify({
    event: 'media',
    streamSid: streamSid,
    media: {
      payload: payload,
    },
  }));
}

// HTTP server upgrade for WebSocket
const server = app.listen(3000);

server.on('upgrade', (request, socket, head) => {
  if (request.url === '/media-stream') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});
```

## Call Status Webhooks

### Webhook Handler Implementation

```javascript
const express = require('express');
const { Kafka } = require('kafkajs');

const app = express();
app.use(express.urlencoded({ extended: true }));

const kafka = new Kafka({
  clientId: 'twilio-webhook-handler',
  brokers: process.env.KAFKA_BROKERS.split(','),
});

const producer = kafka.producer();

// Call status webhook
app.post('/webhooks/twilio/status', async (req, res) => {
  const {
    CallSid,
    CallStatus,
    From,
    To,
    Duration,
    CallDuration,
    Timestamp,
    RecordingUrl,
    RecordingSid,
  } = req.body;

  console.log(`Call ${CallSid} status: ${CallStatus}`);

  // Update call record in database
  await updateCallStatus(CallSid, {
    status: CallStatus,
    duration: parseInt(Duration || CallDuration || 0),
    timestamp: new Date(Timestamp),
  });

  // Emit event to Kafka
  await producer.send({
    topic: 'calls.status',
    messages: [{
      key: CallSid,
      value: JSON.stringify({
        eventType: 'CallStatusChanged',
        callSid: CallSid,
        status: CallStatus,
        from: From,
        to: To,
        duration: parseInt(Duration || CallDuration || 0),
        timestamp: new Date(),
      }),
    }],
  });

  // Handle specific statuses
  switch (CallStatus) {
    case 'initiated':
      await handleCallInitiated(CallSid);
      break;

    case 'ringing':
      await handleCallRinging(CallSid);
      break;

    case 'in-progress':
      await handleCallAnswered(CallSid);
      break;

    case 'completed':
      await handleCallCompleted(CallSid, Duration);
      break;

    case 'failed':
    case 'busy':
    case 'no-answer':
      await handleCallFailed(CallSid, CallStatus);
      break;
  }

  res.status(200).send('OK');
});

async function handleCallCompleted(callSid, duration) {
  // Mark call as completed
  await db.collection('calls').updateOne(
    { callSid },
    {
      $set: {
        status: 'completed',
        completedAt: new Date(),
        duration: parseInt(duration),
      }
    }
  );

  // Fetch recording and transcription
  setTimeout(async () => {
    await fetchAndProcessRecording(callSid);
  }, 5000); // Wait 5 seconds for recording to be ready
}

async function handleCallFailed(callSid, reason) {
  await db.collection('calls').updateOne(
    { callSid },
    {
      $set: {
        status: 'failed',
        failureReason: reason,
        failedAt: new Date(),
      }
    }
  );

  // Schedule retry if appropriate
  const call = await db.collection('calls').findOne({ callSid });
  const lead = await db.collection('leads').findOne({ _id: call.leadId });

  if (lead.callAttempts < 3 && reason !== 'busy') {
    await scheduleCallRetry(lead, 30 * 60 * 1000); // Retry in 30 minutes
  }
}
```

### .NET Webhook Handler

```csharp
using Microsoft.AspNetCore.Mvc;
using Confluent.Kafka;

[ApiController]
[Route("webhooks/twilio")]
public class TwilioWebhookController : ControllerBase
{
    private readonly IProducer<string, string> _kafkaProducer;
    private readonly ICallRepository _callRepository;

    [HttpPost("status")]
    public async Task<IActionResult> CallStatus([FromForm] CallStatusRequest request)
    {
        Console.WriteLine($"Call {request.CallSid} status: {request.CallStatus}");

        // Update database
        await _callRepository.UpdateStatus(request.CallSid, new CallStatusUpdate
        {
            Status = request.CallStatus,
            Duration = request.Duration ?? request.CallDuration ?? 0,
            Timestamp = DateTime.Parse(request.Timestamp)
        });

        // Emit to Kafka
        var message = new Message<string, string>
        {
            Key = request.CallSid,
            Value = JsonSerializer.Serialize(new
            {
                eventType = "CallStatusChanged",
                callSid = request.CallSid,
                status = request.CallStatus,
                from = request.From,
                to = request.To,
                duration = request.Duration ?? 0,
                timestamp = DateTime.UtcNow
            })
        };

        await _kafkaProducer.ProduceAsync("calls.status", message);

        // Handle status-specific logic
        switch (request.CallStatus)
        {
            case "completed":
                await HandleCallCompleted(request.CallSid, request.Duration ?? 0);
                break;
            case "failed":
            case "busy":
            case "no-answer":
                await HandleCallFailed(request.CallSid, request.CallStatus);
                break;
        }

        return Ok();
    }
}

public class CallStatusRequest
{
    public string CallSid { get; set; }
    public string CallStatus { get; set; }
    public string From { get; set; }
    public string To { get; set; }
    public int? Duration { get; set; }
    public int? CallDuration { get; set; }
    public string Timestamp { get; set; }
}
```

## Recording and Transcription

### Automatic Recording

```javascript
// Start call with recording enabled
async function startCallWithRecording(lead, conversationId) {
  const call = await client.calls.create({
    from: process.env.TWILIO_PHONE_NUMBER,
    to: lead.phone,
    twiml: generateCallTwiML(conversationId),
    record: true,
    recordingChannels: 'dual', // Separate tracks for caller and agent
    recordingStatusCallback: `${process.env.WEBHOOK_BASE_URL}/webhooks/twilio/recording`,
    recordingStatusCallbackMethod: 'POST',
    recordingStatusCallbackEvent: ['completed'],
    trim: 'trim-silence',
  });

  return call;
}

// Recording webhook handler
app.post('/webhooks/twilio/recording', async (req, res) => {
  const {
    RecordingSid,
    RecordingUrl,
    RecordingStatus,
    RecordingDuration,
    CallSid,
  } = req.body;

  if (RecordingStatus === 'completed') {
    console.log(`Recording completed for call ${CallSid}: ${RecordingSid}`);

    // Download recording
    const recordingAudioUrl = `${RecordingUrl}.mp3`;

    // Store recording metadata
    await db.collection('recordings').insertOne({
      recordingSid: RecordingSid,
      callSid: CallSid,
      url: recordingAudioUrl,
      duration: parseInt(RecordingDuration),
      status: RecordingStatus,
      createdAt: new Date(),
    });

    // Trigger transcription
    await transcribeRecording(RecordingSid, recordingAudioUrl);

    // Download and archive recording
    await downloadAndArchiveRecording(RecordingSid, recordingAudioUrl);
  }

  res.status(200).send('OK');
});

async function transcribeRecording(recordingSid, audioUrl) {
  // Option 1: Use Twilio's built-in transcription
  const recording = await client.recordings(recordingSid).fetch();

  // Request transcription
  await client.recordings(recordingSid).update({
    status: 'transcribe',
  });

  // Option 2: Use external service (OpenAI Whisper, AssemblyAI, etc.)
  const axios = require('axios');

  const response = await axios.post(
    'https://api.openai.com/v1/audio/transcriptions',
    {
      file: audioUrl,
      model: 'whisper-1',
      language: 'en',
      response_format: 'verbose_json',
      timestamp_granularities: ['word', 'segment'],
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  const transcript = response.data;

  // Store transcript
  await db.collection('transcripts').insertOne({
    recordingSid,
    text: transcript.text,
    segments: transcript.segments,
    words: transcript.words,
    duration: transcript.duration,
    language: transcript.language,
    createdAt: new Date(),
  });

  // Feed to knowledge base for improvement
  await updateKnowledgeBase(transcript);

  return transcript;
}
```

## TCPA Compliance Checkpoints

### Pre-Call Verification

```javascript
// Comprehensive TCPA compliance check
async function verifyTCPACompliance(lead) {
  const checks = {
    hasWrittenConsent: false,
    consentNotExpired: false,
    notOnDNC: false,
    automatedCallsAllowed: false,
    withinCallingHours: false,
    rateLimitOK: false,
  };

  // 1. Check written consent
  const consent = await db.collection('leads').findOne(
    { _id: lead._id },
    { projection: { consent: 1, dncStatus: 1 } }
  );

  checks.hasWrittenConsent = consent?.consent?.hasWrittenConsent === true;

  // 2. Check consent expiration
  if (consent?.consent?.expiresAt) {
    checks.consentNotExpired = new Date(consent.consent.expiresAt) > new Date();
  } else {
    checks.consentNotExpired = true; // No expiration set
  }

  // 3. Check DNC registry
  checks.notOnDNC = !consent?.dncStatus?.onNationalRegistry &&
                    !consent?.dncStatus?.internalDNC;

  // 4. Check automated call permission
  checks.automatedCallsAllowed = consent?.automatedCallsAllowed === true;

  // 5. Check calling hours (8 AM - 9 PM local time)
  const leadTimezone = lead.timezone || 'America/New_York';
  const localTime = new Date().toLocaleString('en-US', { timeZone: leadTimezone });
  const hour = new Date(localTime).getHours();
  checks.withinCallingHours = hour >= 8 && hour < 21;

  // 6. Check rate limit (max 3 calls per day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const callsToday = await db.collection('calls').countDocuments({
    leadId: lead._id,
    createdAt: { $gte: today },
  });

  checks.rateLimitOK = callsToday < 3;

  // Log compliance check
  await db.collection('compliance_checks').insertOne({
    leadId: lead._id,
    checks,
    timestamp: new Date(),
    passed: Object.values(checks).every(Boolean),
  });

  // Throw error if any check fails
  const failures = Object.entries(checks)
    .filter(([_, passed]) => !passed)
    .map(([check]) => check);

  if (failures.length > 0) {
    throw new Error(`TCPA_VIOLATION: Failed checks: ${failures.join(', ')}`);
  }

  return true;
}

// Wrapper for compliant calling
async function makeCompliantCall(lead, property) {
  try {
    // Verify TCPA compliance
    await verifyTCPACompliance(lead);

    // Make the call
    const call = await startAICall(lead, property);

    // Log call attempt
    await db.collection('leads').updateOne(
      { _id: lead._id },
      {
        $push: {
          callAttempts: {
            date: new Date(),
            type: 'automated',
            callSid: call.callSid,
            result: 'initiated',
          }
        }
      }
    );

    return call;

  } catch (error) {
    if (error.message.startsWith('TCPA_VIOLATION')) {
      console.error(`TCPA compliance check failed for lead ${lead._id}:`, error.message);

      // Flag lead for manual review
      await db.collection('leads').updateOne(
        { _id: lead._id },
        {
          $set: {
            tcpaViolationFlag: true,
            tcpaViolationReason: error.message,
            flaggedAt: new Date(),
          }
        }
      );

      return null;
    }

    throw error;
  }
}
```

### .NET TCPA Compliance

```csharp
public class TCPAComplianceService
{
    private readonly ILeadRepository _leadRepository;
    private readonly ICallRepository _callRepository;

    public async Task<bool> VerifyTCPACompliance(Lead lead)
    {
        var checks = new Dictionary<string, bool>();

        // 1. Written consent
        checks["hasWrittenConsent"] = lead.Consent?.HasWrittenConsent == true;

        // 2. Consent not expired
        checks["consentNotExpired"] = lead.Consent?.ExpiresAt == null ||
                                       lead.Consent.ExpiresAt > DateTime.UtcNow;

        // 3. Not on DNC
        checks["notOnDNC"] = !lead.DncStatus?.OnNationalRegistry == true &&
                             !lead.DncStatus?.InternalDNC == true;

        // 4. Automated calls allowed
        checks["automatedCallsAllowed"] = lead.AutomatedCallsAllowed == true;

        // 5. Within calling hours (8 AM - 9 PM)
        var leadTimezone = TimeZoneInfo.FindSystemTimeZoneById(lead.Timezone ?? "Eastern Standard Time");
        var localTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, leadTimezone);
        checks["withinCallingHours"] = localTime.Hour >= 8 && localTime.Hour < 21;

        // 6. Rate limit (max 3 calls per day)
        var today = DateTime.UtcNow.Date;
        var callsToday = await _callRepository.CountCallsToday(lead.Id, today);
        checks["rateLimitOK"] = callsToday < 3;

        // Log compliance check
        await LogComplianceCheck(lead.Id, checks);

        // Check if all passed
        var failures = checks.Where(c => !c.Value).Select(c => c.Key).ToList();

        if (failures.Any())
        {
            throw new TCPAViolationException($"Failed checks: {string.Join(", ", failures)}");
        }

        return true;
    }
}
```

## Outbound Call Examples

### Simple Outbound Call

```javascript
// Basic outbound call with TwiML
async function makeSimpleCall(toNumber, message) {
  const call = await client.calls.create({
    from: process.env.TWILIO_PHONE_NUMBER,
    to: toNumber,
    twiml: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Matthew">${message}</Say>
    <Pause length="2"/>
    <Say>Thank you for your time. Goodbye.</Say>
</Response>`,
    statusCallback: `${process.env.WEBHOOK_BASE_URL}/webhooks/twilio/status`,
  });

  return call;
}

// Call with gather (collect input)
async function makeCallWithInput(toNumber) {
  const call = await client.calls.create({
    from: process.env.TWILIO_PHONE_NUMBER,
    to: toNumber,
    url: `${process.env.WEBHOOK_BASE_URL}/twiml/gather-input`,
  });

  return call;
}

app.post('/twiml/gather-input', (req, res) => {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather action="/twiml/process-input" method="POST" numDigits="1" timeout="10">
        <Say>Press 1 to schedule a property viewing. Press 2 to speak with an agent. Press 3 to be removed from our list.</Say>
    </Gather>
    <Say>We didn't receive any input. Goodbye.</Say>
</Response>`;

  res.type('text/xml');
  res.send(twiml);
});

app.post('/twiml/process-input', async (req, res) => {
  const { Digits, CallSid, From } = req.body;

  let responseMessage = '';

  switch (Digits) {
    case '1':
      responseMessage = 'Thank you for your interest. An agent will contact you shortly to schedule a viewing.';
      await scheduleCallback(From, 'viewing');
      break;
    case '2':
      responseMessage = 'Connecting you to an agent now.';
      // Transfer to agent
      break;
    case '3':
      responseMessage = 'You have been removed from our call list. Thank you.';
      await addToDNCList(From);
      break;
    default:
      responseMessage = 'Invalid selection. Goodbye.';
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>${responseMessage}</Say>
</Response>`;

  res.type('text/xml');
  res.send(twiml);
});
```

## Error Handling

```javascript
async function safeCallExecution(lead, property) {
  try {
    // Verify phone number format
    if (!isValidPhoneNumber(lead.phone)) {
      throw new Error('INVALID_PHONE_NUMBER');
    }

    // TCPA compliance check
    await verifyTCPACompliance(lead);

    // Make the call
    const call = await startAICall(lead, property);

    return call;

  } catch (error) {
    if (error.code === 20003) {
      // Twilio authentication error
      console.error('Twilio authentication failed. Check credentials.');
      await alertOps('twilio_auth_failed');
    } else if (error.code === 21211) {
      // Invalid phone number
      console.error(`Invalid phone number: ${lead.phone}`);
      await flagLeadInvalidPhone(lead);
    } else if (error.code === 21215) {
      // Account not authorized for calls to this country
      console.error(`Not authorized for calls to ${lead.phone}`);
    } else if (error.code === 20429) {
      // Too many requests
      console.warn('Twilio rate limit hit. Backing off...');
      await sleep(5000);
      return safeCallExecution(lead, property);
    } else if (error.message.startsWith('TCPA_VIOLATION')) {
      console.error(`TCPA violation: ${error.message}`);
      await flagLeadForReview(lead, error.message);
    } else {
      console.error('Unexpected error:', error);
      throw error;
    }

    return null;
  }
}

function isValidPhoneNumber(phone) {
  // E.164 format: +1234567890
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}
```

## Monitoring & Observability

```javascript
const { trace } = require('@opentelemetry/api');

async function makeTracedCall(lead, property) {
  const tracer = trace.getTracer('twilio-integration');

  return tracer.startActiveSpan('twilio.make-call', async (span) => {
    try {
      span.setAttribute('service', 'twilio');
      span.setAttribute('lead_id', lead._id.toString());
      span.setAttribute('phone', lead.phone);

      const call = await startAICall(lead, property);

      span.setAttribute('call_sid', call.callSid);
      span.setAttribute('status', call.status);
      span.setStatus({ code: SpanStatusCode.OK });

      return call;

    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      throw error;

    } finally {
      span.end();
    }
  });
}

// Metrics collection
const callMetrics = {
  initiated: new Counter({ name: 'twilio_calls_initiated_total' }),
  completed: new Counter({ name: 'twilio_calls_completed_total' }),
  failed: new Counter({ name: 'twilio_calls_failed_total' }),
  duration: new Histogram({ name: 'twilio_call_duration_seconds' }),
};

async function handleCallCompleted(callSid, duration) {
  callMetrics.completed.inc();
  callMetrics.duration.observe(duration);

  // ... rest of logic
}
```

## Environment Variables

```bash
# .env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+15551234567
WEBHOOK_BASE_URL=https://your-domain.com
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=your_voice_id
```

## Best Practices

1. **Always Use HTTPS**: Twilio requires HTTPS for webhooks in production
2. **Validate Webhooks**: Verify Twilio signatures to prevent spoofing
3. **Handle Retries**: Twilio retries failed webhooks; ensure idempotency
4. **TCPA Compliance**: Always verify consent before calling
5. **Rate Limiting**: Respect Twilio's rate limits (1000 concurrent calls per account)
6. **Error Handling**: Handle all Twilio error codes gracefully
7. **Recording Retention**: Comply with data retention policies (delete after X days)
8. **Monitoring**: Track call metrics and alert on anomalies

## Resources

- [Twilio Voice API Documentation](https://www.twilio.com/docs/voice/api)
- [ConversationRelay Guide](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay)
- [Media Streams Documentation](https://www.twilio.com/docs/voice/media-streams)
- [TwiML Reference](https://www.twilio.com/docs/voice/twiml)
- [Error Codes](https://www.twilio.com/docs/api/errors)
- [TCPA Compliance Guide](https://www.twilio.com/docs/glossary/what-is-tcpa-compliance)
