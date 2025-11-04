# Local Setup Guide - Next Level Real Estate

## Current Status
✅ Node.js 18.20.8 installed (Need 20+)
✅ npm 10.8.2 installed
⚠️ Docker needs WSL 2 integration enabled

## Step-by-Step Setup

### 1. Enable Docker for WSL 2

You're running WSL 2 and need to enable Docker Desktop integration:

**Option A: Enable in Docker Desktop (Easiest)**
1. Open Docker Desktop on Windows
2. Go to **Settings** → **Resources** → **WSL Integration**
3. Enable integration with your WSL 2 distro (Ubuntu)
4. Click **Apply & Restart**
5. In WSL, run: `docker --version` to verify

**Option B: Install Docker directly in WSL (Alternative)**
```bash
# Update package list
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Start Docker service
sudo service docker start

# Verify
docker --version
```

### 2. Upgrade Node.js to 20+

Your current Node.js (18.20.8) is slightly outdated. Upgrade to Node 20:

```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### 3. Install Project Dependencies

```bash
cd /home/onesmartguy/projects/next-level-real-estate

# Install root dependencies
npm install

# This will install dependencies for all workspaces:
# - services/api-gateway
# - services/lead-service
# - services/calling-service
# - agents/* (all 4 agents)
# - shared
```

### 4. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit the .env file
nano .env  # or use your preferred editor
```

**Required API Keys** (Get these from respective providers):
```bash
# Claude AI (Required)
ANTHROPIC_API_KEY=sk-ant-xxx  # Get from: https://console.anthropic.com/

# OpenAI Embeddings (Required for RAG)
OPENAI_API_KEY=sk-xxx  # Get from: https://platform.openai.com/api-keys

# Twilio (Required for calling)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1555xxx

# ElevenLabs (Required for AI voice)
ELEVENLABS_API_KEY=xxx  # Get from: https://elevenlabs.io/app/settings/api-keys

# Optional: Lead sources (for webhook testing)
GOOGLE_ADS_CLIENT_ID=xxx
ZILLOW_API_KEY=xxx
REALGEEKS_API_USERNAME=xxx
```

**Local Database URLs** (Use these defaults):
```bash
MONGODB_URI=mongodb://localhost:27017/next_level_real_estate
QDRANT_URL=http://localhost:6333
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
```

### 5. Start Docker Infrastructure

```bash
# Make sure you're in the project root
cd /home/onesmartguy/projects/next-level-real-estate

# Start all infrastructure services
docker compose up -d

# This starts:
# - MongoDB (port 27017)
# - Qdrant (port 6333)
# - Redis (port 6379)
# - Kafka + Zookeeper (port 9092)
# - OpenTelemetry Collector (port 4317)

# Wait ~30 seconds for services to initialize
sleep 30

# Check service status
docker compose ps

# Expected output - all should be "Up" or "healthy":
# NAME                  STATUS
# nlre-mongodb          Up (healthy)
# nlre-qdrant           Up (healthy)
# nlre-redis            Up (healthy)
# nlre-kafka            Up (healthy)
# nlre-zookeeper        Up
# nlre-otel-collector   Up
```

### 6. Initialize Databases

```bash
# Navigate to scripts directory
cd scripts

# Install script dependencies
npm install

# Initialize MongoDB (creates collections and indexes)
npm run init:mongo

# Initialize Qdrant (creates vector collections)
npm run init:qdrant

# You should see success messages for both
```

### 7. Start Application Services

Open **4 separate terminal windows/tabs**:

**Terminal 1: API Gateway**
```bash
cd /home/onesmartguy/projects/next-level-real-estate/services/api-gateway
npm install
npm run dev

# Should see:
# API Gateway listening on port 3000
# Health check: http://localhost:3000/health
```

**Terminal 2: Lead Service**
```bash
cd /home/onesmartguy/projects/next-level-real-estate/services/lead-service
npm install
npm run dev

# Should see:
# Lead Service listening on port 3001
# Connected to MongoDB
# Connected to Kafka
```

**Terminal 3: Calling Service**
```bash
cd /home/onesmartguy/projects/next-level-real-estate/services/calling-service
npm install
npm run dev

# Should see:
# Calling Service listening on port 3002
# Twilio client initialized
# ElevenLabs client initialized
```

**Terminal 4: AI Agents (Optional for testing)**
```bash
# Start the Conversation Agent (most important for calls)
cd /home/onesmartguy/projects/next-level-real-estate/agents/conversation
npm install
npm run dev

# For full system, also start:
# - agents/architect
# - agents/sales
# - agents/realty
# (Each in separate terminals)
```

### 8. Verify Everything is Running

```bash
# Test health endpoints
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Lead Service
curl http://localhost:3002/health  # Calling Service

# All should return: {"status":"ok","service":"..."}

# Check Docker services
docker compose ps

# Check logs if anything fails
docker compose logs mongodb
docker compose logs qdrant
docker compose logs kafka
```

### 9. Test with Sample Lead

```bash
# Send a test lead to the system
curl -X POST http://localhost:3001/webhooks/zillow/leads \
  -H "Content-Type: application/json" \
  -H "X-Zillow-Signature: test-signature" \
  -H "X-Zillow-Timestamp: $(date +%s)" \
  -d '{
    "lead_id": "test-001",
    "contact": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "phone": "+12025551234"
    },
    "property": {
      "city": "Seattle",
      "state": "WA",
      "address": "123 Main St"
    },
    "consent": {
      "has_written_consent": true,
      "consent_date": "2025-01-20",
      "consent_method": "online_form"
    },
    "received_at": "2025-01-20T10:00:00Z"
  }'

# Should return: {"received":true,"leadId":"..."}

# Verify lead was created
curl http://localhost:3001/api/leads | jq

# Check MongoDB directly
docker exec -it nlre-mongodb mongosh next_level_real_estate --eval "db.leads.find().pretty()"
```

### 10. (Optional) Set Up Webhooks for External Testing

If you want to test with real webhooks from Zillow/Google Ads:

```bash
# Install ngrok
# Mac: brew install ngrok
# Linux:
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | \
  sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && \
  echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | \
  sudo tee /etc/apt/sources.list.d/ngrok.list && \
  sudo apt update && sudo apt install ngrok

# Authenticate (get token from https://dashboard.ngrok.com/get-started/your-authtoken)
ngrok config add-authtoken YOUR_TOKEN

# Expose Lead Service
ngrok http 3001

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Configure in webhook providers:
# - Zillow: https://abc123.ngrok.io/webhooks/zillow/leads
# - Google Ads: https://abc123.ngrok.io/webhooks/google-ads/leads
```

## Troubleshooting

### Docker not starting
```bash
# Check Docker Desktop is running (Windows)
# Or start Docker service (Linux)
sudo service docker start

# Check Docker status
sudo service docker status

# Restart Docker
docker compose down
docker compose up -d
```

### MongoDB connection failed
```bash
# Check MongoDB is running
docker compose ps mongodb

# View MongoDB logs
docker compose logs mongodb

# Restart MongoDB
docker compose restart mongodb

# Test connection
docker exec -it nlre-mongodb mongosh --eval "db.adminCommand('ping')"
```

### Port already in use
```bash
# Find what's using the port (e.g., 3000)
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different ports in .env:
API_GATEWAY_PORT=3010
LEAD_SERVICE_PORT=3011
CALLING_SERVICE_PORT=3012
```

### npm install fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Out of memory
```bash
# Increase Docker memory limit in Docker Desktop settings
# Or increase Node.js memory:
export NODE_OPTIONS="--max-old-space-size=4096"

# Then restart services
```

## Daily Development Workflow

```bash
# Start your day
cd /home/onesmartguy/projects/next-level-real-estate

# Start infrastructure
docker compose up -d

# Start services (in separate terminals)
npm run dev  # Or use the terminal commands above

# During development
# - Code changes auto-reload (nodemon)
# - Check logs in terminal windows
# - Test with curl or Postman

# End of day
docker compose stop  # Stops containers, preserves data
# Or: docker compose down  # Stops and removes containers
```

## Resource Usage

**Expected resource consumption**:
- **RAM**: 8-12GB total
- **CPU**: 20-40% average
- **Disk**: ~10GB (grows with data)

**Monitor resources**:
```bash
# Docker stats
docker stats

# System resources
htop  # or top
```

## Next Steps

Once everything is running locally:

1. ✅ Test lead ingestion with sample data
2. ✅ Test TCPA validation
3. ✅ Test deduplication
4. ✅ Test AI agent responses
5. ✅ (Optional) Test actual calling with Twilio/ElevenLabs
6. ✅ Review logs and monitoring
7. ✅ Set up your first real campaign

## Getting Help

If you encounter issues:

1. Check service logs: `docker compose logs <service-name>`
2. Check application logs in terminal windows
3. Review documentation in `docs/`
4. Check `.env` configuration
5. Verify all API keys are valid

## Summary Checklist

- [ ] Docker Desktop running with WSL 2 integration enabled
- [ ] Node.js 20+ installed
- [ ] Project dependencies installed (`npm install`)
- [ ] `.env` file configured with API keys
- [ ] Docker services running (`docker compose ps`)
- [ ] Databases initialized (`npm run init:mongo`, `npm run init:qdrant`)
- [ ] Application services running (API Gateway, Lead Service, Calling Service)
- [ ] Health checks passing (all return 200 OK)
- [ ] Test lead created successfully
- [ ] Ready to develop! 🚀

---

**Estimated Setup Time**: 30-60 minutes
**Monthly Cost**: $0 (using local resources + API usage only)
**Capacity**: 50-100 calls/day comfortably

*Last Updated: October 24, 2025*
