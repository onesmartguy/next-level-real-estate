#!/bin/bash

# ElevenLabs + Twilio ngrok Setup Script
# This exposes your local relay server to the internet for Twilio webhooks

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     ElevenLabs + Twilio ngrok Setup                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed"
    echo "   Install from: https://ngrok.com/download"
    exit 1
fi

echo "✅ ngrok found"
echo ""

# Start relay server if not running
if ! curl -s http://localhost:3002/health > /dev/null; then
    echo "📡 Starting relay server on port 3002..."
    node websocket-relay-server.js > /tmp/relay-server.log 2>&1 &
    RELAY_PID=$!
    echo $RELAY_PID > /tmp/relay-server.pid
    sleep 2
    echo "✅ Relay server started (PID: $RELAY_PID)"
else
    echo "✅ Relay server already running"
fi

echo ""
echo "🌐 Starting ngrok tunnel..."
echo "   Local:     http://localhost:3002"
echo "   Exposing:  WebSocket relay server to internet"
echo ""

# Start ngrok
ngrok http 3002 \
  --log=stdout \
  --log-level=info

