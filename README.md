# Next Level Real Estate

> AI-powered real estate wholesale platform with multi-agent intelligence

[![CI/CD](https://github.com/your-org/next-level-real-estate/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/next-level-real-estate/actions)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.3-blue.svg)](https://www.typescriptlang.org/)

## Overview

Next Level Real Estate is a comprehensive AI-powered platform that revolutionizes real estate wholesale operations through:

- 🤖 **Four Specialized AI Agents** for architecture, conversation, sales, and real estate expertise
- 📞 **AI-Powered Calling** with ElevenLabs Conversational AI 2.0 and Twilio
- 🎯 **Multi-Source Lead Integration** from Google Ads, Zillow, and RealGeeks
- ✅ **TCPA 2025 Compliant** with written consent tracking and DNC checking
- 📊 **Real-Time Analytics** with distributed tracing and observability
- 💰 **90% Cost Reduction** via intelligent prompt caching

## Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/next-level-real-estate.git
cd next-level-real-estate

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Start infrastructure
docker compose up -d

# Verify services
docker compose ps
curl http://localhost:3000/health
```

## Project Structure

```
next-level-real-estate/
├── services/           # Microservices (API Gateway, Lead Service)
├── agents/            # Four specialized Claude AI agents
├── shared/            # Shared models, database clients, utilities
├── docs/              # Comprehensive documentation (400KB+)
├── scripts/           # Database initialization scripts
└── tests/             # Unit, integration, and E2E tests
```

## Documentation

📚 **[Complete Documentation Index](docs/README.md)**

### Quick Links

- [Architecture Diagrams](docs/ARCHITECTURE_DIAGRAMS.md) - System architecture with Mermaid diagrams
- [Deployment Guide](docs/DEPLOYMENT.md) - Local and production deployment
- [Testing Strategy](docs/TESTING.md) - Unit, integration, and E2E testing
- [API Documentation](docs/api/) - Integration guides for all external services
- [Agent Guide](docs/agents/AGENT_IMPLEMENTATION_GUIDE.md) - AI agent implementation
- [Project Summary](PROJECT_SUMMARY.md) - Complete implementation overview

## Features

### Multi-Agent AI System
- **Architecture Agent**: System design and optimization recommendations
- **Conversation AI Agent**: Call analysis and pattern extraction
- **Sales & Marketing Agent**: Market research and campaign optimization
- **Realty Expert Agent**: Property evaluation and compliance verification

### Lead Management
- Multi-source webhook integration (Zillow, Google Ads, RealGeeks)
- SHA-256 hash-based deduplication
- Automatic qualification scoring (0-100)
- TCPA 2025 compliance verification
- Real-time event emission via Kafka

### Infrastructure
- Event-driven microservices architecture
- MongoDB for operational data (7 collections, 36 indexes)
- Qdrant vector database for RAG (6 collections, 1536 dimensions)
- Redis caching with configurable TTL
- Kafka message queue for event streaming
- OpenTelemetry distributed tracing

## Technology Stack

- **Backend**: Node.js 20+ with TypeScript, Express.js
- **AI**: Anthropic Claude 3.5 Sonnet, OpenAI Embeddings
- **Databases**: MongoDB 7.0, Qdrant 1.7.4, Redis 7.2
- **Message Queue**: Kafka with Zookeeper
- **Observability**: OpenTelemetry, Winston logging
- **Infrastructure**: Docker, Docker Compose

## Development

### Prerequisites
- Node.js >= 20.0.0
- Docker & Docker Compose
- npm >= 10.0.0

### Install Dependencies

```bash
npm install
```

### Start Services

```bash
# Start all infrastructure
docker compose up -d

# Start API Gateway
cd services/api-gateway && npm run dev

# Start Lead Service
cd services/lead-service && npm run dev

# Start AI Agents
cd agents/architect && npm run dev
cd agents/conversation && npm run dev
cd agents/sales && npm run dev
cd agents/realty && npm run dev
```

### Run Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# With coverage
npm test -- --coverage
```

### Linting & Formatting

```bash
# Run ESLint
npm run lint

# Auto-fix with Prettier
npm run format
```

## Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete deployment instructions.

### Quick Deploy to AWS

```bash
# Build Docker images
docker compose build

# Push to ECR
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-west-2.amazonaws.com

docker tag nlre/api-gateway:latest <account>.dkr.ecr.us-west-2.amazonaws.com/nlre-api-gateway:latest
docker push <account>.dkr.ecr.us-west-2.amazonaws.com/nlre-api-gateway:latest

# Deploy to ECS
aws ecs update-service --cluster nlre-production --service api-gateway --force-new-deployment
```

## Environment Variables

See [.env.example](.env.example) for all required environment variables.

Key variables:
- `ANTHROPIC_API_KEY` - Claude AI API key
- `OPENAI_API_KEY` - OpenAI embeddings API key
- `MONGODB_URI` - MongoDB connection string
- `QDRANT_URL` - Qdrant vector database URL
- `KAFKA_BROKERS` - Kafka broker addresses
- `TWILIO_*` - Twilio credentials for calling
- `ELEVENLABS_API_KEY` - ElevenLabs voice synthesis

## Architecture

### System Overview

```
Lead Sources → API Gateway → Lead Service → MongoDB
                                ↓
                              Kafka Events
                                ↓
                          AI Agents (4)
                                ↓
                        Knowledge Bases (RAG)
                                ↓
                          Optimizations
```

### Key Design Patterns

- **Event-Driven Architecture**: Kafka for loose coupling between services
- **Microservices**: Independent services with clear boundaries
- **RAG (Retrieval-Augmented Generation)**: Vector search for context retrieval
- **Prompt Caching**: Multi-tier caching for 90% cost reduction
- **CQRS**: Separate read and write paths for scalability

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Proprietary - All rights reserved

## Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/next-level-real-estate/issues)
- **Contact**: support@nextlevelre.com

## Acknowledgments

- [Anthropic](https://www.anthropic.com/) for Claude AI
- [ElevenLabs](https://elevenlabs.io/) for Conversational AI
- [Twilio](https://www.twilio.com/) for telephony infrastructure
- [Qdrant](https://qdrant.tech/) for vector database

---

**Status**: ✅ Production Ready (Stages 1 & 3 Complete)
**Next**: Stage 2 - AI Calling System Integration
**Version**: 1.0.0
**Last Updated**: October 24, 2025
