// Vercel serverless function for Twilio + ElevenLabs webhook
const { VoiceResponse } = require('twilio').twiml;

module.exports = async function handler(req, res) {
  // Normalize request properties for Vercel
  const method = req.method || 'GET';
  const pathname = new URL(req.url || '', 'http://localhost').pathname;
  const queryParams = req.query || {};
  const body = req.body || {};

  // Health check
  if (pathname === '/health' || pathname === '/api/health') {
    return res.status(200).json({ status: 'ok', service: 'webhook-handler' });
  }

  // Twilio ConversationRelay endpoint
  if (pathname.includes('/conversation-relay') && method === 'POST') {
    const { agentId } = queryParams;
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

    if (!agentId) {
      console.error('[Webhook] Missing agentId in query params');
      return res.status(400).send('Missing agent ID');
    }

    console.log('[Webhook] ConversationRelay request:', {
      agentId,
      callSid: body.CallSid,
      from: body.From,
      to: body.To,
    });

    // Get signed URL from ElevenLabs
    try {
      const signedUrlResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
        {
          method: 'GET',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY
          }
        }
      );

      if (!signedUrlResponse.ok) {
        throw new Error(`Failed to get signed URL: ${signedUrlResponse.status}`);
      }

      const { signed_url } = await signedUrlResponse.json();

      // Create TwiML response
      const twiml = new VoiceResponse();
      const connect = twiml.connect();
      connect.stream({ url: signed_url });

      console.log('[Webhook] Returning TwiML for ConversationRelay');

      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send(twiml.toString());

    } catch (error) {
      console.error('[Webhook] Error:', error.message);
      const twiml = new VoiceResponse();
      twiml.say('Sorry, there was an error connecting to the agent.');
      res.setHeader('Content-Type', 'text/xml');
      return res.status(500).send(twiml.toString());
    }
  }

  // Twilio status callback
  if (pathname.includes('/status-callback') && method === 'POST') {
    const { CallSid, CallStatus, CallDuration, From, To } = body;

    console.log('[Webhook] Call status update:', {
      callSid: CallSid,
      status: CallStatus,
      duration: CallDuration,
      from: From,
      to: To,
    });

    return res.status(200).send('OK');
  }

  // Twilio recording callback
  if (pathname.includes('/recording-callback') && method === 'POST') {
    const { CallSid, RecordingSid, RecordingUrl, RecordingDuration } = body;

    console.log('[Webhook] Recording ready:', {
      callSid: CallSid,
      recordingSid: RecordingSid,
      url: RecordingUrl,
      duration: RecordingDuration,
    });

    return res.status(200).send('OK');
  }

  // Default response
  return res.status(404).json({ error: 'Not found' });
}
