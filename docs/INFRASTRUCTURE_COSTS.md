# Infrastructure Cost Analysis

## Overview

This document provides a comprehensive breakdown of infrastructure costs for hosting the Next Level Real Estate platform across different environments: **local development, cloud hosting (AWS, Azure, GCP), and hybrid solutions**.

---

## 🏠 Local Development / Self-Hosted (FREE to $50/month)

### ✅ **Best For**: Development, testing, small-scale production (<100 calls/day)

### Hardware Requirements

**Minimum Specs** (Can run on a decent desktop/laptop):
- **CPU**: 4 cores (Intel i5 or AMD Ryzen 5 equivalent)
- **RAM**: 16GB
- **Storage**: 100GB SSD
- **Network**: Stable internet with public IP or ngrok

**Recommended Specs** (For production-like environment):
- **CPU**: 8 cores (Intel i7 or AMD Ryzen 7)
- **RAM**: 32GB
- **Storage**: 500GB SSD
- **Network**: Dedicated server with static IP

### Software Stack (All FREE!)

| Component | Software | Cost | Notes |
|-----------|----------|------|-------|
| **Container Runtime** | Docker Desktop / Docker Engine | **FREE** | Required for all services |
| **Database** | MongoDB Community | **FREE** | Self-hosted |
| **Vector DB** | Qdrant (self-hosted) | **FREE** | Self-hosted Docker container |
| **Cache** | Redis (self-hosted) | **FREE** | Docker container |
| **Message Queue** | Kafka (self-hosted) | **FREE** | Docker Compose setup |
| **Monitoring** | Grafana + Prometheus | **FREE** | Open source |
| **Tracing** | SigNoz (self-hosted) | **FREE** | Open source OpenTelemetry |

### Optional Local Costs

| Service | Purpose | Cost | Alternative |
|---------|---------|------|-------------|
| **ngrok Pro** | Expose local webhooks | $10/month | FREE tier (limited) |
| **Domain name** | Custom domain | $12/year | Use ngrok domain (free) |
| **Static IP** | For webhooks | $0-30/month | Most ISPs, or use ngrok |
| **Electricity** | Server power | ~$10/month | Laptop: negligible |

### Total Monthly Cost: **$0 - $50**
- **Bare minimum**: $0 (use free tiers + existing hardware)
- **Production-ready local**: $10-20/month (ngrok + domain)
- **Dedicated server**: $30-50/month (electricity + static IP)

### Pros & Cons

**Pros** ✅:
- **Zero cloud costs** for infrastructure
- **Complete control** over data and services
- **No egress fees** for data transfer
- **Great for development** and testing
- **Privacy** - all data stays local

**Cons** ⚠️:
- **No built-in redundancy** (single point of failure)
- **Manual backups** required
- **Limited scalability** (hardware constraints)
- **Uptime depends** on your server/internet
- **No auto-scaling** for traffic spikes
- **Webhook delivery** requires public IP or ngrok

---

## ☁️ AWS (Amazon Web Services)

### Small Deployment (100-500 calls/day)

| Service | Specification | Monthly Cost |
|---------|---------------|--------------|
| **Compute** | 2x t3.medium (2 vCPU, 4GB RAM) | $60 |
| **Database** | MongoDB Atlas M10 (Shared) | $57 |
| **Vector DB** | Qdrant Cloud 1GB | $95 |
| **Cache** | ElastiCache Redis (cache.t3.micro) | $12 |
| **Message Queue** | MSK Serverless (Kafka) | $150 |
| **Load Balancer** | Application Load Balancer | $23 |
| **Storage** | 100GB EBS gp3 | $8 |
| **Data Transfer** | 100GB outbound | $9 |
| **CloudWatch** | Logs + Metrics | $15 |
| **Route53** | DNS hosting | $1 |
| **Total** | | **$430/month** |

### Medium Deployment (500-2,000 calls/day)

| Service | Specification | Monthly Cost |
|---------|---------------|--------------|
| **Compute** | 3x t3.large (2 vCPU, 8GB RAM) | $180 |
| **Database** | MongoDB Atlas M30 (Dedicated) | $250 |
| **Vector DB** | Qdrant Cloud 4GB | $275 |
| **Cache** | ElastiCache Redis (cache.t3.small) | $25 |
| **Message Queue** | MSK Serverless | $250 |
| **Load Balancer** | ALB with SSL | $25 |
| **Storage** | 500GB EBS gp3 | $40 |
| **Data Transfer** | 500GB outbound | $45 |
| **CloudWatch** | Enhanced monitoring | $30 |
| **Backup** | Automated backups | $20 |
| **Total** | | **$1,140/month** |

### Large Deployment (2,000-10,000 calls/day)

| Service | Specification | Monthly Cost |
|---------|---------------|--------------|
| **Compute (EKS)** | 5x t3.xlarge (4 vCPU, 16GB) | $750 |
| **Database** | MongoDB Atlas M50 (Replica Set) | $580 |
| **Vector DB** | Qdrant Cloud 16GB | $950 |
| **Cache** | ElastiCache Redis (cache.m5.large) | $150 |
| **Message Queue** | MSK Provisioned (3 brokers) | $500 |
| **Load Balancer** | ALB + WAF | $50 |
| **Storage** | 2TB EBS gp3 | $160 |
| **Data Transfer** | 2TB outbound | $180 |
| **CloudWatch** | Enterprise monitoring | $75 |
| **Backup & DR** | Cross-region replication | $100 |
| **EKS** | Kubernetes control plane | $73 |
| **Total** | | **$3,568/month** |

---

## 🔷 Azure (Microsoft Azure)

### Small Deployment (100-500 calls/day)

| Service | Specification | Monthly Cost |
|---------|---------------|--------------|
| **Compute** | 2x B2s VMs (2 vCPU, 4GB RAM) | $60 |
| **Database** | Azure Cosmos DB (MongoDB API) | $100 |
| **Vector DB** | Qdrant Cloud 1GB | $95 |
| **Cache** | Azure Cache for Redis (Basic) | $15 |
| **Message Queue** | Event Hubs Standard | $80 |
| **Load Balancer** | Application Gateway | $30 |
| **Storage** | 100GB Premium SSD | $15 |
| **Bandwidth** | 100GB outbound | $8 |
| **Monitoring** | Azure Monitor | $20 |
| **Total** | | **$423/month** |

### Medium Deployment (500-2,000 calls/day)

| Service | Specification | Monthly Cost |
|---------|---------------|--------------|
| **Compute** | 3x D2s v3 (2 vCPU, 8GB RAM) | $220 |
| **Database** | Azure Cosmos DB (Provisioned) | $350 |
| **Vector DB** | Qdrant Cloud 4GB | $275 |
| **Cache** | Azure Cache for Redis (Standard) | $45 |
| **Message Queue** | Event Hubs Standard (3 TUs) | $150 |
| **Load Balancer** | Application Gateway v2 | $40 |
| **Storage** | 500GB Premium SSD | $75 |
| **Bandwidth** | 500GB outbound | $40 |
| **Monitoring** | Azure Monitor + App Insights | $50 |
| **Total** | | **$1,245/month** |

---

## 🟢 GCP (Google Cloud Platform)

### Small Deployment (100-500 calls/day)

| Service | Specification | Monthly Cost |
|---------|---------------|--------------|
| **Compute** | 2x e2-medium (2 vCPU, 4GB RAM) | $50 |
| **Database** | MongoDB Atlas M10 | $57 |
| **Vector DB** | Qdrant Cloud 1GB | $95 |
| **Cache** | Memorystore Redis (Basic) | $25 |
| **Message Queue** | Pub/Sub | $50 |
| **Load Balancer** | Cloud Load Balancing | $20 |
| **Storage** | 100GB SSD Persistent Disk | $17 |
| **Network** | 100GB egress | $12 |
| **Monitoring** | Cloud Monitoring | $15 |
| **Total** | | **$341/month** |

### Medium Deployment (500-2,000 calls/day)

| Service | Specification | Monthly Cost |
|---------|---------------|--------------|
| **Compute** | 3x n2-standard-2 (2 vCPU, 8GB) | $195 |
| **Database** | MongoDB Atlas M30 | $250 |
| **Vector DB** | Qdrant Cloud 4GB | $275 |
| **Cache** | Memorystore Redis (Standard) | $60 |
| **Message Queue** | Pub/Sub (higher throughput) | $100 |
| **Load Balancer** | Cloud Load Balancing | $25 |
| **Storage** | 500GB SSD Persistent Disk | $85 |
| **Network** | 500GB egress | $60 |
| **Monitoring** | Cloud Monitoring + Tracing | $40 |
| **Total** | | **$1,090/month** |

---

## 📊 Cost Comparison Summary

### By Scale (Monthly Costs)

| Deployment Size | Local | AWS | Azure | GCP |
|-----------------|-------|-----|-------|-----|
| **Development** | $0-50 | - | - | - |
| **Small (100-500 calls/day)** | $50 | $430 | $423 | $341 |
| **Medium (500-2K calls/day)** | N/A | $1,140 | $1,245 | $1,090 |
| **Large (2K-10K calls/day)** | N/A | $3,568 | $3,800+ | $3,200+ |

### Winner by Category

- 🏆 **Cheapest Overall**: **GCP** ($341-$3,200/month)
- 🏆 **Best for Startups**: **Local** ($0-50/month)
- 🏆 **Best Ecosystem**: **AWS** (most services and integrations)
- 🏆 **Best for Microsoft Shops**: **Azure** (tight integration)
- 🏆 **Best for AI/ML**: **GCP** (AI/ML tools, competitive pricing)

---

## 🏠 Local Development Setup Guide

### ✅ YES, You Can Serve This Locally!

**Perfect for**:
- Development and testing
- Proof of concept
- Small-scale production (<100 calls/day)
- Privacy-focused deployments
- Cost-conscious startups

### Hardware You Need

**Option 1: Laptop/Desktop** (Recommended for dev)
```
✅ Modern laptop with:
   - 16GB RAM (32GB better)
   - Intel i5/i7 or AMD Ryzen 5/7
   - 100GB+ free disk space
   - Stable internet connection
```

**Option 2: Home Server** (Recommended for small production)
```
✅ Dedicated machine:
   - Intel NUC, Mac Mini, or custom build
   - 32GB RAM
   - 500GB SSD
   - Wired ethernet connection
   - UPS for power backup
```

**Option 3: Raspberry Pi Cluster** (Budget option)
```
⚠️ Possible but limited:
   - 3x Raspberry Pi 4 (8GB model)
   - 256GB+ SD cards
   - Good for learning, not production
```

### Step-by-Step Local Setup

#### 1. Install Prerequisites

```bash
# Install Docker Desktop (Mac/Windows)
# Download from: https://www.docker.com/products/docker-desktop

# Or Docker Engine (Linux)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js 20+
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Verify installations
docker --version
docker compose version
node --version
npm --version
```

#### 2. Clone and Configure

```bash
# Clone repository
cd ~/projects
git clone <your-repo-url> next-level-real-estate
cd next-level-real-estate

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Edit .env with your API keys:
# - ANTHROPIC_API_KEY (required)
# - OPENAI_API_KEY (required)
# - TWILIO_* (required for calling)
# - ELEVENLABS_API_KEY (required for calling)
# - Others can use defaults for local
```

#### 3. Start Infrastructure

```bash
# Start all infrastructure services
docker compose up -d

# Verify services are running
docker compose ps

# Expected output:
# - mongodb (healthy)
# - qdrant (healthy)
# - redis (healthy)
# - kafka (healthy)
# - zookeeper (running)
# - otel-collector (running)

# Check logs
docker compose logs -f mongodb
docker compose logs -f qdrant

# Initialize databases
cd scripts
npm install
npm run init:mongo
npm run init:qdrant
```

#### 4. Start Application Services

```bash
# Terminal 1: API Gateway
cd services/api-gateway
npm install
npm run dev
# Runs on http://localhost:3000

# Terminal 2: Lead Service
cd services/lead-service
npm install
npm run dev
# Runs on http://localhost:3001

# Terminal 3: Calling Service
cd services/calling-service
npm install
npm run dev
# Runs on http://localhost:3002
```

#### 5. Start AI Agents (Optional for testing)

```bash
# Terminal 4: Architect Agent
cd agents/architect
npm install
npm run dev

# Terminal 5: Conversation Agent
cd agents/conversation
npm install
npm run dev

# Terminal 6: Sales Agent
cd agents/sales
npm install
npm run dev

# Terminal 7: Realty Agent
cd agents/realty
npm install
npm run dev
```

#### 6. Expose Webhooks (For External Services)

**Option A: ngrok (Recommended)**
```bash
# Install ngrok
# Mac: brew install ngrok
# Linux: snap install ngrok
# Windows: Download from https://ngrok.com/download

# Authenticate
ngrok config add-authtoken <your-token>

# Expose Lead Service webhooks
ngrok http 3001
# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)

# Configure in webhook providers:
# - Zillow: https://abc123.ngrok.io/webhooks/zillow/leads
# - Google Ads: https://abc123.ngrok.io/webhooks/google-ads/leads
```

**Option B: Cloudflare Tunnel (Free alternative)**
```bash
# Install cloudflared
# Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation

# Create tunnel
cloudflared tunnel --url http://localhost:3001

# Use the generated URL for webhooks
```

#### 7. Test the System

```bash
# Health checks
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health

# Test lead ingestion (simulated webhook)
curl -X POST http://localhost:3001/webhooks/zillow/leads \
  -H "Content-Type: application/json" \
  -H "X-Zillow-Signature: test" \
  -H "X-Zillow-Timestamp: $(date +%s)" \
  -d '{
    "lead_id": "local-test-001",
    "contact": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "+12025551234"
    },
    "property": {
      "city": "Seattle",
      "state": "WA"
    },
    "consent": {
      "has_written_consent": true,
      "consent_date": "2025-01-20",
      "consent_method": "online_form"
    }
  }'

# Check if lead was created
curl http://localhost:3001/api/leads
```

### Local Resource Usage

**Expected Resource Consumption**:
- **CPU**: 20-40% average (spikes during calls)
- **RAM**: 8-12GB total
  - MongoDB: 1-2GB
  - Qdrant: 1-2GB
  - Redis: 100-200MB
  - Kafka: 1-2GB
  - Node services: 500MB-1GB each
  - AI agents: 300-500MB each
- **Disk**: 10-20GB (grows with data)
- **Network**: Minimal (<1GB/day for development)

### Local Limitations

⚠️ **Be Aware**:
1. **No auto-scaling**: Fixed resources
2. **Single point of failure**: If server goes down, everything stops
3. **Manual backups**: Set up cron jobs for MongoDB/Qdrant backups
4. **Internet dependency**: Need stable internet for API calls
5. **Webhook reliability**: ngrok free tier can be unstable
6. **No redundancy**: Data loss if disk fails
7. **Performance**: Limited by hardware

### When to Move to Cloud

Consider cloud when:
- **>100 calls/day consistently**
- **Need 99.9% uptime**
- **Team needs remote access**
- **Multiple environments** (dev/staging/prod)
- **Auto-scaling** required
- **Global distribution** needed
- **Compliance** requires cloud provider

---

## 💡 Hybrid Approach (Best of Both Worlds)

### Strategy: Local + Managed Services

**What to keep local**:
- Application services (API Gateway, Lead Service, Calling Service)
- Development and testing

**What to use managed**:
- **MongoDB Atlas** ($57/month for M10): Automatic backups, scaling
- **Qdrant Cloud** ($95/month for 1GB): Managed vector DB
- **Kafka** (keep local with Docker): Save $150/month

**Total hybrid cost**: $150/month + local hardware
**Savings vs. full cloud**: ~$200/month (47% cheaper than AWS small)

---

## 📈 Cost Projection by Business Growth

### Year 1 (Startup Phase)
- **Months 1-3**: Local development ($0-50/month)
- **Months 4-6**: Local + managed DBs ($150/month)
- **Months 7-12**: Cloud small deployment ($400/month)
- **Total Year 1 Cost**: ~$3,000

### Year 2 (Growth Phase)
- **Q1-Q2**: Cloud medium deployment ($1,100/month)
- **Q3-Q4**: Scale as needed
- **Total Year 2 Cost**: ~$13,000

### Cost per Lead (Infrastructure Only)

| Calls/Day | Monthly Infra | Cost per Call |
|-----------|---------------|---------------|
| 50 | $150 (hybrid) | $0.10 |
| 100 | $340 (GCP small) | $0.11 |
| 500 | $400 (AWS small) | $0.03 |
| 1,000 | $1,090 (GCP med) | $0.04 |
| 5,000 | $3,200 (GCP large) | $0.02 |

**Economies of scale**: Infrastructure cost per call drops significantly with volume!

---

## 🎯 Recommendation

### For You Right Now: **Start Local!**

**Why**:
1. ✅ **$0 infrastructure cost** while testing
2. ✅ **Full control** over data and testing
3. ✅ **Easy debugging** with local access
4. ✅ **No cloud bill surprise** while developing
5. ✅ **Can handle 50-100 calls/day** easily

**Your Setup**:
```
Hardware: Existing laptop/desktop (16GB+ RAM)
Software: Docker Compose (all services local)
External: ngrok for webhooks ($0-10/month)
APIs: Twilio, ElevenLabs, Claude (pay per use)

Total: $0-10/month for infrastructure
```

**When to Migrate**:
- Consistently >100 calls/day
- Need 24/7 uptime
- Multiple team members
- Customer-facing production

### Migration Path

```
Stage 1: Local Development (Now)
   ↓
Stage 2: Hybrid (DBs in cloud, apps local)
   Cost: ~$150/month
   ↓
Stage 3: Cloud Small (AWS/GCP/Azure)
   Cost: ~$350-430/month
   Trigger: >200 calls/day
   ↓
Stage 4: Cloud Medium (Dedicated resources)
   Cost: ~$1,100/month
   Trigger: >1,000 calls/day
   ↓
Stage 5: Enterprise (Multi-region, HA)
   Cost: $3,000+/month
   Trigger: >5,000 calls/day
```

---

## 📦 Quick Start: Local Setup

```bash
# 1. Install Docker Desktop
# Download from https://docker.com

# 2. Clone and setup
git clone <repo> && cd next-level-real-estate
npm install
cp .env.example .env
# Add your API keys to .env

# 3. Start infrastructure
docker compose up -d

# 4. Initialize databases
cd scripts && npm install && npm run init:mongo && npm run init:qdrant

# 5. Start services (separate terminals)
cd services/api-gateway && npm install && npm run dev
cd services/lead-service && npm install && npm run dev
cd services/calling-service && npm install && npm run dev

# 6. (Optional) Expose webhooks
ngrok http 3001

# You're running! 🚀
# Total cost: $0 (using existing hardware + free tiers)
```

---

*Last Updated: October 24, 2025*
*Pricing subject to change - verify with providers*
