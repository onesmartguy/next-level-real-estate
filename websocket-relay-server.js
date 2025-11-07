#!/usr/bin/env node

/**
 * ElevenLabs WebSocket Relay Server for Twilio
 *
 * This server acts as a bridge between Twilio's voice API and ElevenLabs' WebSocket API.
 * When Twilio connects via Media Streams, this server relays audio between Twilio and ElevenLabs agents.
 *
 * Architecture:
 * Twilio Call ──▶ WebSocket (this server) ──▶ ElevenLabs Agent
 *                     ▲                               │
 *                     └───────────────────────────────┘
 */

require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const PORT = process.env.CALLING_SERVICE_PORT || 3002;
const ELEVENLABS_AGENT_ID = 'agent_2201k95pnb1beqp9m0k7rs044b1c';
const MAX_CONCURRENT_CONNECTIONS = process.env.MAX_CONNECTIONS || 10;

// Store active connections
const connections = new Map();

/**
 * TwiML Response Generator
 * Returns TwiML that tells Twilio to connect to our WebSocket relay server
 */
function generateRelayTwiML(relayUrl, agentId, variables = {}) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${relayUrl}" />
  </Connect>
</Response>`;
}

/**
 * Setup Express app
 */
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeConnections: connections.size,
    maxConnections: MAX_CONCURRENT_CONNECTIONS,
    capacityPercent: Math.round((connections.size / MAX_CONCURRENT_CONNECTIONS) * 100),
    elevenlabsAgent: ELEVENLABS_AGENT_ID,
    integrationMethod: 'Custom WebSocket Relay'
  });
});

/**
 * Endpoint that Twilio calls to get TwiML instructions
 * This is set as the "Call comes in" webhook in Twilio console
 */
app.post('/voice/incoming', async (req, res) => {
  const callSid = req.body.CallSid;
  const from = req.body.From;
  const to = req.body.To;

  console.log(`\n📞 Incoming call received`);
  console.log(`   Call SID: ${callSid}`);
  console.log(`   From: ${from}`);
  console.log(`   To: ${to}`);

  // Check connection limit
  if (connections.size >= MAX_CONCURRENT_CONNECTIONS) {
    console.log(`\n⚠️  Connection limit reached (${connections.size}/${MAX_CONCURRENT_CONNECTIONS})`);
    console.log(`   Rejecting call: ${callSid}`);

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>We are currently at maximum capacity. Please try again later.</Say>
  <Hangup/>
</Response>`;

    res.type('application/xml');
    return res.send(twiml);
  }

  // Get ngrok URL from environment or fallback to localhost
  let NGROK_URL = process.env.NGROK_URL;
  if (!NGROK_URL) {
    // If not in env, try to fetch from ngrok API
    try {
      const http = require('http');
      const ngrokData = await new Promise((resolve, reject) => {
        http.get('http://localhost:4040/api/tunnels', (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            const tunnels = JSON.parse(data);
            const publicUrl = tunnels.tunnels[0]?.public_url;
            resolve(publicUrl?.replace('https://', 'wss://') || `wss://localhost:${PORT}`);
          });
        }).on('error', reject);
      });
      NGROK_URL = ngrokData;
    } catch (e) {
      NGROK_URL = `wss://localhost:${PORT}`;
    }
  } else {
    // Convert https to wss if needed
    NGROK_URL = NGROK_URL.replace('https://', 'wss://').replace('http://', 'ws://');
  }
  const relayUrl = `${NGROK_URL}/voice/relay/${callSid}`;

  // Variables can be extracted from caller info, database, etc.
  const variables = {
    homeowner_first_name: 'Caller',
    homeowner_last_name: 'Name',
    property_address_street: 'Unknown',
    property_city: 'Unknown',
    property_state: 'TX'
  };

  // Generate TwiML that tells Twilio to connect to our WebSocket relay
  const twiml = generateRelayTwiML(relayUrl, ELEVENLABS_AGENT_ID, variables);

  console.log(`   Agent ID: ${ELEVENLABS_AGENT_ID}`);
  console.log(`   Relay URL: ${relayUrl}`);
  console.log(`   Sending TwiML response...`);

  res.type('application/xml');
  res.send(twiml);
});

/**
 * Webhook for Twilio call status updates
 * Set this in Twilio console: Call Status Callbacks
 */
app.post('/voice/status', (req, res) => {
  const callSid = req.body.CallSid;
  const callStatus = req.body.CallStatus;
  const from = req.body.From;
  const to = req.body.To;

  console.log(`\n📊 Call status update`);
  console.log(`   Call SID: ${callSid}`);
  console.log(`   Status: ${callStatus}`);
  console.log(`   From: ${from}`);
  console.log(`   To: ${to}`);

  // Store call status for analytics
  const conn = connections.get(callSid);
  if (conn) {
    conn.status = callStatus;
    conn.lastUpdated = Date.now();
  }

  res.status(200).send();
});

/**
 * Webhook for recording ready
 * Set this in Twilio console: Recording Status Callbacks
 */
app.post('/voice/recording', (req, res) => {
  const recordingSid = req.body.RecordingSid;
  const callSid = req.body.CallSid;
  const recordingStatus = req.body.RecordingStatus;

  console.log(`\n🎙️  Recording status`);
  console.log(`   Recording SID: ${recordingSid}`);
  console.log(`   Call SID: ${callSid}`);
  console.log(`   Status: ${recordingStatus}`);

  if (recordingStatus === 'completed') {
    console.log(`   URL: https://api.twilio.com${req.body.RecordingUrl}`);
  }

  res.status(200).send();
});

/**
 * Endpoint for outbound call setup
 * POST /voice/initiate with { to: "+15551234567" }
 */
app.post('/voice/initiate', (req, res) => {
  const toNumber = req.body.to;

  if (!toNumber) {
    return res.status(400).json({ error: 'Missing "to" parameter' });
  }

  console.log(`\n📞 Initiating outbound call`);
  console.log(`   To: ${toNumber}`);

  // In production, you would use Twilio SDK here
  // const twilio = require('twilio');
  // const client = twilio(ACCOUNT_SID, AUTH_TOKEN);
  // const call = await client.calls.create({...});

  res.json({
    status: 'initiated',
    to: toNumber,
    message: 'Use Twilio SDK to make the actual call',
    instructions: 'See test-call-with-twilio.js for implementation'
  });
});

/**
 * Create HTTP server
 */
const server = http.createServer(app);

/**
 * Setup WebSocket server for relay
 */
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const url = request.url;

  // Handle WebSocket upgrade for relay endpoint
  if (url.startsWith('/voice/relay/')) {
    const callSid = url.split('/').pop();

    console.log(`\n🔗 WebSocket upgrade request`);
    console.log(`   Call SID: ${callSid}`);

    // Check connection limit at WebSocket upgrade time
    if (connections.size >= MAX_CONCURRENT_CONNECTIONS) {
      console.log(`\n⚠️  WebSocket connection limit reached (${connections.size}/${MAX_CONCURRENT_CONNECTIONS})`);
      console.log(`   Rejecting upgrade for: ${callSid}`);

      socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      handleRelayConnection(ws, callSid);
    });
  } else {
    socket.destroy();
  }
});

/**
 * Handle relay WebSocket connection
 * This receives audio from Twilio and relays to ElevenLabs
 */
function handleRelayConnection(twilioWs, callSid) {
  console.log(`✅ Twilio WebSocket connected`);
  console.log(`   Call SID: ${callSid}`);

  let elevenlabsWs = null;
  let isConnectedToElevenLabs = false;

  // Store connection
  connections.set(callSid, { twilioWs, elevenlabsWs, startTime: Date.now() });

  // Connect to ElevenLabs agent
  console.log(`   Connecting to ElevenLabs...`);

  // Include agent_id in the WebSocket URL query parameters
  const elevenLabsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?xi-api-key=${ELEVENLABS_API_KEY}&agent_id=${ELEVENLABS_AGENT_ID}`;

  elevenlabsWs = new WebSocket(elevenLabsUrl);

  elevenlabsWs.on('open', () => {
    isConnectedToElevenLabs = true;
    console.log(`✅ Connected to ElevenLabs agent`);
    console.log(`   Agent: ${ELEVENLABS_AGENT_ID}`);

    // Send agent initialization message
    const initMessage = {
      type: 'user_input',
      user_input_type: 'text',
      text: '',
      variables: {
        homeowner_first_name: 'Caller',
        homeowner_last_name: 'Name'
      }
    };

    console.log(`   Sending init message...`);
    elevenlabsWs.send(JSON.stringify(initMessage));
  });

  // Relay messages from ElevenLabs to Twilio
  elevenlabsWs.on('message', (data) => {
    try {
      // Try to parse as JSON first (for control messages)
      let message;
      let isJson = false;
      try {
        message = JSON.parse(data);
        isJson = true;
        console.log(`   🎤 ElevenLabs ${message.type || 'message'}:`,
          message.type === 'user_interruption_frame' ? 'User interrupted' :
          message.type === 'audio_frame' ? 'Audio frame' :
          message.type === 'conversation_initiation_metadata' ? 'Conversation metadata' :
          '');
      } catch (e) {
        // Not JSON, treat as binary audio
        message = data;
        console.log(`   🎤 ElevenLabs audio: ${Buffer.byteLength(data)} bytes`);
      }

      // Relay to Twilio
      if (twilioWs.readyState === WebSocket.OPEN) {
        if (isJson) {
          twilioWs.send(JSON.stringify(message));
        } else {
          // Send binary audio as-is
          twilioWs.send(data);
        }
      }
    } catch (error) {
      console.error(`   Error relaying message:`, error.message);
    }
  });

  // Handle ElevenLabs errors
  elevenlabsWs.on('error', (error) => {
    console.error(`❌ ElevenLabs WebSocket error:`, error.message);
  });

  // Handle ElevenLabs close
  elevenlabsWs.on('close', (code, reason) => {
    console.log(`📉 ElevenLabs WebSocket closed`);
    console.log(`   Code: ${code}, Reason: ${reason}`);
    isConnectedToElevenLabs = false;

    // Close Twilio connection too
    if (twilioWs.readyState === WebSocket.OPEN) {
      twilioWs.close(code, reason);
    }
  });

  // Handle messages from Twilio
  twilioWs.on('message', (data) => {
    try {
      // Try to parse as JSON (Twilio Media Streams sends JSON)
      let message;
      try {
        message = JSON.parse(data);

        // Log different message types
        if (message.event === 'start') {
          console.log(`   📨 Twilio START: Media stream started`);
        } else if (message.event === 'media') {
          // Media event contains base64 audio payload
          console.log(`   📨 Twilio MEDIA: ${Buffer.byteLength(JSON.stringify(message))} bytes, payload ${message.media?.payload ? message.media.payload.substring(0, 20) : 'N/A'}...`);
        } else if (message.event === 'stop') {
          console.log(`   📨 Twilio STOP: Media stream stopped`);
        } else if (message.event === 'mark') {
          console.log(`   📨 Twilio MARK: ${message.mark?.name || 'unnamed'}`);
        }

        // Relay to ElevenLabs if connected
        if (isConnectedToElevenLabs && elevenlabsWs.readyState === WebSocket.OPEN) {
          elevenlabsWs.send(JSON.stringify(message));
        }
      } catch (e) {
        // If not JSON, it's binary audio (shouldn't happen with Twilio Media Streams)
        console.log(`   📨 Twilio BINARY: ${Buffer.byteLength(data)} bytes`);
        if (isConnectedToElevenLabs && elevenlabsWs.readyState === WebSocket.OPEN) {
          elevenlabsWs.send(data);
        }
      }
    } catch (error) {
      console.error(`   Error relaying Twilio message:`, error.message);
    }
  });

  // Handle Twilio errors
  twilioWs.on('error', (error) => {
    console.error(`❌ Twilio WebSocket error:`, error.message);
  });

  // Handle Twilio close
  twilioWs.on('close', (code, reason) => {
    console.log(`📉 Twilio WebSocket closed`);
    console.log(`   Call SID: ${callSid}`);
    console.log(`   Code: ${code}, Reason: ${reason}`);

    // Clean up
    if (elevenlabsWs) {
      elevenlabsWs.close();
    }

    // Remove connection
    if (connections.has(callSid)) {
      const conn = connections.get(callSid);
      const duration = Math.round((Date.now() - conn.startTime) / 1000);
      console.log(`   Call duration: ${duration}s`);
      connections.delete(callSid);
    }
  });

  // Store updated connection
  connections.set(callSid, { twilioWs, elevenlabsWs, startTime: Date.now() });
}

/**
 * Start server
 */
server.listen(PORT, () => {
  console.log('\n');
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(6) + 'ElevenLabs WebSocket Relay Server' + ' '.repeat(18) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');

  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(`\n📋 Endpoints:`);
  console.log(`   POST /voice/incoming     - Twilio webhook for incoming calls`);
  console.log(`   POST /voice/status       - Twilio call status updates`);
  console.log(`   POST /voice/recording    - Twilio recording status updates`);
  console.log(`   POST /voice/initiate     - Initiate outbound calls`);
  console.log(`   GET  /health             - Health check`);
  console.log(`   WSS  /voice/relay/:sid   - WebSocket relay endpoint`);

  console.log(`\n🤖 Agent Configuration:`);
  console.log(`   Agent ID: ${ELEVENLABS_AGENT_ID}`);
  console.log(`   Agent: Production Agent (Sydney - Real Estate)`);

  console.log(`\n🔗 Configuration:`);
  console.log(`   API Key: ${ELEVENLABS_API_KEY.substring(0, 10)}...`);
  console.log(`   WSS URL: wss://localhost:${PORT}/voice/relay/:callSid`);
  console.log(`   Max Concurrent Connections: ${MAX_CONCURRENT_CONNECTIONS}`);

  console.log(`\n📞 Twilio Webhook Setup:`);
  console.log(`   Method: POST`);
  console.log(`   URL: https://your-domain.com/voice/incoming`);

  console.log(`\n💡 Testing:`);
  console.log(`   Health: curl http://localhost:${PORT}/health`);
  console.log(`   Call: node test-call-with-twilio.js +15551234567`);

  console.log('\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n📡 Shutting down...');
  connections.forEach(({ twilioWs, elevenlabsWs }) => {
    if (twilioWs) twilioWs.close();
    if (elevenlabsWs) elevenlabsWs.close();
  });
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, generateRelayTwiML };
