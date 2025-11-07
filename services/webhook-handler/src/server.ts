import express from 'express'
import { VoiceResponse } from 'twilio/lib/twiml/VoiceResponse.js'
import { config } from 'dotenv'

config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'webhook-handler' })
})

// Twilio ConversationRelay endpoint
app.post('/twilio/conversation-relay', (req, res) => {
  const { conversationId, agentId } = req.query

  if (!conversationId || !agentId) {
    console.error('[Webhook] Missing conversationId or agentId in query params')
    return res.status(400).send('Missing required parameters')
  }

  console.log('[Webhook] ConversationRelay request:', {
    conversationId,
    agentId,
    callSid: req.body.CallSid,
    from: req.body.From,
    to: req.body.To,
  })

  const twiml = new VoiceResponse()
  const connect = twiml.connect()

  // Stream to ElevenLabs
  connect.stream({
    url: `wss://api.elevenlabs.io/v1/convai/conversations/${conversationId}/stream`,
    parameters: {
      apiKey: process.env.ELEVENLABS_API_KEY || '',
      agentId: agentId as string,
    },
  })

  console.log('[Webhook] Returning TwiML for ConversationRelay')

  res.type('text/xml')
  res.send(twiml.toString())
})

// Twilio status callback endpoint
app.post('/twilio/status-callback', (req, res) => {
  const { CallSid, CallStatus, CallDuration, From, To } = req.body

  console.log('[Webhook] Call status update:', {
    callSid: CallSid,
    status: CallStatus,
    duration: CallDuration,
    from: From,
    to: To,
  })

  // TODO: Store call status in database or forward to analytics service

  res.sendStatus(200)
})

// Twilio recording callback endpoint
app.post('/twilio/recording-callback', (req, res) => {
  const { CallSid, RecordingSid, RecordingUrl, RecordingDuration } = req.body

  console.log('[Webhook] Recording ready:', {
    callSid: CallSid,
    recordingSid: RecordingSid,
    url: RecordingUrl,
    duration: RecordingDuration,
  })

  // TODO: Download and store recording, trigger transcription service

  res.sendStatus(200)
})

app.listen(PORT, () => {
  console.log(`[Server] Webhook handler listening on port ${PORT}`)
  console.log(`[Server] ConversationRelay endpoint: http://localhost:${PORT}/twilio/conversation-relay`)
  console.log(`[Server] Status callback endpoint: http://localhost:${PORT}/twilio/status-callback`)
  console.log(`[Server] Recording callback endpoint: http://localhost:${PORT}/twilio/recording-callback`)
})
