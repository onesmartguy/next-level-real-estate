# Environment Variables - Complete Reference

This document lists all environment variables required to run the Next Level Real Estate platform.

## 🔑 Required API Keys (Must Have)

These are the minimum keys needed to run the core system:

| Variable | Required | Purpose | Where to Get |
|----------|----------|---------|--------------|
| `ANTHROPIC_API_KEY` | ✅ Yes | Claude AI for agents & conversations | https://console.anthropic.com/settings/keys |
| `OPENAI_API_KEY` | ✅ Yes | Embeddings for RAG (text-embedding-3-large) | https://platform.openai.com/api-keys |
| `MONGODB_URI` | ✅ Yes | Primary database | Local: `mongodb://localhost:27017/next_level_real_estate`<br/>Cloud: MongoDB Atlas |
| `JWT_SECRET` | ✅ Yes | API authentication | Generate: `openssl rand -base64 32` |

## 🎯 Core Features (Highly Recommended)

These enable the main calling and lead management features:

| Variable | Required | Purpose | Where to Get |
|----------|----------|---------|--------------|
| `ELEVENLABS_API_KEY` | 🟡 Recommended | AI voice conversations | https://elevenlabs.io/app/settings/api-keys |
| `TWILIO_ACCOUNT_SID` | 🟡 Recommended | Phone calling infrastructure | https://console.twilio.com/ |
| `TWILIO_AUTH_TOKEN` | 🟡 Recommended | Twilio authentication | https://console.twilio.com/ |
| `TWILIO_PHONE_NUMBER` | 🟡 Recommended | Outbound caller ID | Purchase in Twilio Console |

## 📊 Lead Sources (Optional but Important)

Enable these to receive leads from external sources:

| Variable | Required | Purpose | Where to Get |
|----------|----------|---------|--------------|
| `GOOGLE_ADS_CLIENT_ID` | 🔵 Optional | Google Ads lead import | https://ads.google.com/home/tools/api/ |
| `GOOGLE_ADS_CLIENT_SECRET` | 🔵 Optional | Google Ads authentication | Same as above |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | 🔵 Optional | Google Ads API access | Same as above |
| `GOOGLE_ADS_REFRESH_TOKEN` | 🔵 Optional | Google Ads OAuth | Same as above |
| `GOOGLE_ADS_CUSTOMER_ID` | 🔵 Optional | Your Google Ads account ID | Same as above |
| `ZILLOW_API_KEY` | 🔵 Optional | Zillow lead integration | Contact rentalfeeds@zillow.com |
| `ZILLOW_WEBHOOK_SECRET` | 🔵 Optional | Zillow webhook verification | Same as above |
| `REALGEEKS_API_USERNAME` | 🔵 Optional | RealGeeks integration | Email RealGeeks support |
| `REALGEEKS_API_PASSWORD` | 🔵 Optional | RealGeeks authentication | Same as above |

---

## Complete Variable List by Service

### 1. Root `.env` (Project-Wide)

```bash
# ============================================
# DATABASE CONFIGURATION
# ============================================
MONGODB_URI=mongodb://localhost:27017/next_level_real_estate
QDRANT_URL=http://localhost:6333
REDIS_URL=redis://localhost:6379

# ============================================
# MESSAGE QUEUE
# ============================================
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=next-level-real-estate

# ============================================
# AI SERVICES
# ============================================
# Required: Claude AI for agents
ANTHROPIC_API_KEY=your_anthropic_api_key

# Required: OpenAI for embeddings
OPENAI_API_KEY=your_openai_api_key_for_embeddings

# Optional: ElevenLabs for voice
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# ============================================
# COMMUNICATION
# ============================================
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+15551234567

# ============================================
# LEAD SOURCES
# ============================================
# Google Ads
GOOGLE_ADS_CLIENT_ID=your_google_ads_client_id
GOOGLE_ADS_CLIENT_SECRET=your_google_ads_client_secret
GOOGLE_ADS_DEVELOPER_TOKEN=your_google_ads_developer_token
GOOGLE_ADS_REFRESH_TOKEN=your_google_ads_refresh_token
GOOGLE_ADS_CUSTOMER_ID=1234567890

# Zillow
ZILLOW_API_KEY=your_zillow_api_key
ZILLOW_WEBHOOK_SECRET=your_zillow_webhook_secret

# RealGeeks
REALGEEKS_API_USERNAME=your_realgeeks_username
REALGEEKS_API_PASSWORD=your_realgeeks_password

# ============================================
# SERVICE PORTS
# ============================================
API_GATEWAY_PORT=3000
LEAD_SERVICE_PORT=3001
CALLING_SERVICE_PORT=3002
ANALYTICS_SERVICE_PORT=3003

# ============================================
# SECURITY
# ============================================
# Generate with: openssl rand -base64 32
JWT_SECRET=your_jwt_secret_at_least_32_characters_long
API_KEY_SALT=your_api_key_salt

# ============================================
# OBSERVABILITY
# ============================================
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
SIGNON_URL=http://localhost:3301

# ============================================
# ENVIRONMENT
# ============================================
NODE_ENV=development
LOG_LEVEL=debug
```

### 2. API Gateway `.env` (`services/api-gateway/.env`)

```bash
# Service Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
SERVICE_NAME=api-gateway

# Database
REDIS_URL=redis://localhost:6379

# Service URLs for Proxying
LEAD_SERVICE_URL=http://localhost:3001
CALLING_SERVICE_URL=http://localhost:3002
ANALYTICS_SERVICE_URL=http://localhost:3003

# Security
JWT_SECRET=your_jwt_secret_at_least_32_characters_long
API_KEY_SALT=your_api_key_salt

# Rate Limiting (Redis-backed)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3100

# Observability
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_SERVICE_NAME=api-gateway
```

### 3. Lead Service `.env` (`services/lead-service/.env`)

```bash
# Service Configuration
PORT=3001
NODE_ENV=development
LOG_LEVEL=debug
SERVICE_NAME=lead-service

# Database
MONGODB_URI=mongodb://localhost:27017/next_level_real_estate

# Message Queue
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=lead-service
KAFKA_GROUP_ID=lead-service-group

# Lead Sources
GOOGLE_ADS_CLIENT_ID=your_google_ads_client_id
GOOGLE_ADS_CLIENT_SECRET=your_google_ads_client_secret
GOOGLE_ADS_DEVELOPER_TOKEN=your_google_ads_developer_token
GOOGLE_ADS_REFRESH_TOKEN=your_google_ads_refresh_token

ZILLOW_API_KEY=your_zillow_api_key
ZILLOW_WEBHOOK_SECRET=your_zillow_webhook_secret

REALGEEKS_API_USERNAME=your_realgeeks_username
REALGEEKS_API_PASSWORD=your_realgeeks_password

# TCPA Compliance
ENABLE_TCPA_VALIDATION=true
REQUIRE_WRITTEN_CONSENT=true
DNC_REGISTRY_API_KEY=your_dnc_registry_api_key

# Deduplication
DUPLICATE_CHECK_WINDOW_DAYS=30

# Observability
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_SERVICE_NAME=lead-service
```

### 4. Calling Service `.env` (`services/calling-service/.env`)

```bash
# Service Configuration
PORT=3002
NODE_ENV=development
LOG_LEVEL=debug
SERVICE_NAME=calling-service

# Database
MONGODB_URI=mongodb://localhost:27017/next_level_real_estate

# Message Queue
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=calling-service
KAFKA_GROUP_ID=calling-service-group

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+15551234567

# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_agent_id
ELEVENLABS_VOICE_ID=your_voice_id
ELEVENLABS_MODEL=flash-2.5

# Claude AI Configuration (for MCP integration)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Service URLs
LEAD_SERVICE_URL=http://localhost:3001
ANALYTICS_SERVICE_URL=http://localhost:3003

# Property Data APIs (optional, using mock data if not provided)
ZILLOW_API_KEY=
ATTOM_API_KEY=

# DNC Registry API (optional, using mock checks if not provided)
DNC_API_KEY=

# TCPA Compliance
ENABLE_TCPA_VALIDATION=true
REQUIRE_WRITTEN_CONSENT=true

# Call Configuration
MAX_CALL_DURATION=1800
CALL_TIMEOUT=30
ENABLE_CALL_RECORDING=true
ENABLE_TRANSCRIPTION=true

# Observability
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_SERVICE_NAME=calling-service
```

### 5. AI Agents `.env` (`agents/.env`)

```bash
# ============================================
# REQUIRED: AI & EMBEDDINGS
# ============================================
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-...

# ============================================
# INFRASTRUCTURE
# ============================================
# Qdrant Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# Redis for Prompt Caching
REDIS_URL=redis://localhost:6379

# Kafka for Inter-Agent Messaging
KAFKA_BROKERS=localhost:9092

# MongoDB for Agent State
MONGODB_URI=mongodb://localhost:27017/next_level_real_estate

# ============================================
# OBSERVABILITY
# ============================================
METRICS_API_URL=http://localhost:4317
LOG_LEVEL=info
NODE_ENV=development

# ============================================
# AGENT MODEL CONFIGURATION
# ============================================
# Architecture Agent
ARCHITECT_MODEL=claude-3-5-sonnet-20241022
ARCHITECT_MAX_TOKENS=4096
ARCHITECT_TEMPERATURE=0.7

# Conversation Agent
CONVERSATION_MODEL=claude-3-5-sonnet-20241022
CONVERSATION_MAX_TOKENS=4096
CONVERSATION_TEMPERATURE=0.7

# Sales Agent
SALES_MODEL=claude-3-5-sonnet-20241022
SALES_MAX_TOKENS=4096
SALES_TEMPERATURE=0.7

# Realty Agent
REALTY_MODEL=claude-3-5-sonnet-20241022
REALTY_MAX_TOKENS=4096
REALTY_TEMPERATURE=0.7

# ============================================
# RAG CONFIGURATION
# ============================================
EMBEDDING_MODEL=text-embedding-3-large
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
VECTOR_DIMENSION=1536

# ============================================
# PROMPT CACHE CONFIGURATION
# ============================================
CACHE_STATIC_TTL=3600
CACHE_SEMI_STATIC_TTL=300
```

### 6. Admin Dashboard `.env.local` (`admin-dashboard/.env.local`)

```bash
# Backend Services Configuration
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3000
NEXT_PUBLIC_LEAD_SERVICE_URL=http://localhost:3001
NEXT_PUBLIC_CALLING_SERVICE_URL=http://localhost:3002
NEXT_PUBLIC_ANALYTICS_SERVICE_URL=http://localhost:3003
NEXT_PUBLIC_TENANT_SERVICE_URL=http://localhost:3004

# Authentication (NextAuth.js)
NEXTAUTH_URL=http://localhost:3100
NEXTAUTH_SECRET=your-secret-key-here

# Optional: External APIs (for dashboard features)
# GOOGLE_ADS_API_KEY=
# ZILLOW_API_KEY=
# ELEVENLABS_API_KEY=
```

---

## 🚀 Quick Setup Commands

### Generate Secrets

```bash
# JWT Secret
openssl rand -base64 32

# API Key Salt
openssl rand -base64 16

# NextAuth Secret
openssl rand -base64 32
```

### Validate Configuration

```bash
# Check if all required variables are set
npm run validate:env

# Test database connections
npm run test:connections

# Verify API keys
npm run test:api-keys
```

---

## 📝 Environment-Specific Configurations

### Development (Local)

```bash
NODE_ENV=development
LOG_LEVEL=debug
MONGODB_URI=mongodb://localhost:27017/next_level_real_estate
QDRANT_URL=http://localhost:6333
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
```

### Staging

```bash
NODE_ENV=staging
LOG_LEVEL=info
MONGODB_URI=mongodb+srv://user:pass@staging-cluster.mongodb.net/nlre
QDRANT_URL=https://qdrant-staging.example.com
REDIS_URL=redis://redis-staging.example.com:6379
KAFKA_BROKERS=kafka-staging-1:9092,kafka-staging-2:9092
```

### Production

```bash
NODE_ENV=production
LOG_LEVEL=warn
MONGODB_URI=mongodb+srv://user:pass@production-cluster.mongodb.net/nlre
QDRANT_URL=https://qdrant-production.example.com
REDIS_URL=redis://redis-production.example.com:6379
KAFKA_BROKERS=kafka-prod-1:9092,kafka-prod-2:9092,kafka-prod-3:9092
```

---

## 🔒 Security Best Practices

1. **Never commit `.env` files to Git**
   - Already in `.gitignore`
   - Use `.env.example` files as templates

2. **Use environment-specific secrets**
   - Different keys for dev/staging/prod
   - Rotate secrets regularly

3. **Use secret management in production**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault

4. **Minimum required permissions**
   - API keys should have least privilege
   - Database users with minimal permissions

5. **Monitor secret usage**
   - Track API key usage
   - Alert on unusual patterns

---

## 📊 Variable Priority

### Tier 1: Must Have (System Won't Start)
- `MONGODB_URI`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `JWT_SECRET`

### Tier 2: Core Features (Main functionality)
- `ELEVENLABS_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `KAFKA_BROKERS`
- `REDIS_URL`
- `QDRANT_URL`

### Tier 3: Lead Sources (Business growth)
- `GOOGLE_ADS_*` variables
- `ZILLOW_*` variables
- `REALGEEKS_*` variables

### Tier 4: Optional/Future
- `ATTOM_API_KEY` (property data)
- `DNC_API_KEY` (Do Not Call registry)
- Analytics integrations

---

## 🛠️ Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```bash
   # Check MongoDB is running
   docker compose ps mongodb
   # Test connection
   mongosh mongodb://localhost:27017/next_level_real_estate
   ```

2. **Kafka Connection Timeout**
   ```bash
   # Verify Kafka is running
   docker compose ps kafka
   # Check logs
   docker compose logs kafka
   ```

3. **Invalid API Key**
   ```bash
   # Test Anthropic key
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: $ANTHROPIC_API_KEY" \
     -H "anthropic-version: 2023-06-01"
   ```

4. **Redis Connection Error**
   ```bash
   # Test Redis
   redis-cli -h localhost -p 6379 ping
   ```

---

**Last Updated**: November 10, 2025
**Total Variables**: 70+
**Required for MVP**: 10
**Recommended**: 18
