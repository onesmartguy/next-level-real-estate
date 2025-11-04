# Next Level Real Estate Documentation

Comprehensive documentation for the Next Level Real Estate AI-powered platform.

## Documentation Overview

### Core Architecture
- **[ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md)** - Complete system architecture with Mermaid diagrams for all major components
- **[CONTEXT_MANAGEMENT_ARCHITECTURE.md](./CONTEXT_MANAGEMENT_ARCHITECTURE.md)** - Multi-agent context management and prompt caching strategies

### Database & Storage
- **[database/mongodb-schema.md](./database/mongodb-schema.md)** - MongoDB collections, schemas, and indexes
- **[database/qdrant-schema.md](./database/qdrant-schema.md)** - Qdrant vector database collections for RAG knowledge bases

### API Integrations
- **[api/claude-sdk.md](./api/claude-sdk.md)** - Anthropic Claude Agent SDK integration
- **[api/elevenlabs.md](./api/elevenlabs.md)** - ElevenLabs Conversational AI 2.0 integration
- **[api/twilio.md](./api/twilio.md)** - Twilio Voice API for phone calls
- **[api/google-ads.md](./api/google-ads.md)** - Google Ads API v19.1 lead generation
- **[api/zillow.md](./api/zillow.md)** - Zillow Lead API integration
- **[api/realgeeks.md](./api/realgeeks.md)** - RealGeeks CRM API integration

### AI Agents
- **[agents/AGENT_IMPLEMENTATION_GUIDE.md](./agents/AGENT_IMPLEMENTATION_GUIDE.md)** - Complete implementation guide for all four specialized Claude agents

### Operations
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide for local, staging, and production environments
- **[TESTING.md](./TESTING.md)** - Testing strategy including unit, integration, E2E, load, and compliance testing

## Quick Start

1. **Local Development Setup**: See [DEPLOYMENT.md](./DEPLOYMENT.md#local-development-setup)
2. **Running Tests**: See [TESTING.md](./TESTING.md#running-tests)
3. **Deploying to Production**: See [DEPLOYMENT.md](./DEPLOYMENT.md#production-deployment)

## Key Concepts

### Four Specialized Claude Agents
1. **Architecture Agent** - System design and optimization
2. **Conversation AI Agent** - Call analysis and pattern extraction
3. **Sales & Marketing Agent** - Campaign optimization and market analysis
4. **Realty Expert Agent** - Domain expertise and compliance

### Technology Stack
- **Backend**: Node.js (TypeScript) + .NET Core 9
- **Database**: MongoDB Atlas + Qdrant Vector DB
- **Message Queue**: Kafka
- **AI**: Claude 3.5 Sonnet, ElevenLabs Conversational AI 2.0
- **Telephony**: Twilio Voice API
- **Observability**: OpenTelemetry + SigNoz

### Lead Processing Flow
```
Lead Sources → Webhook → Deduplication → TCPA Check → Qualification → Calling → Analysis → Knowledge Update
```

## File Structure

```
docs/
├── README.md                              # This file
├── ARCHITECTURE_DIAGRAMS.md               # System architecture diagrams
├── CONTEXT_MANAGEMENT_ARCHITECTURE.md     # Multi-agent context strategy
├── DEPLOYMENT.md                          # Deployment and environment setup
├── TESTING.md                             # Testing strategy and tools
├── agents/
│   └── AGENT_IMPLEMENTATION_GUIDE.md     # Four Claude agents implementation
├── api/
│   ├── claude-sdk.md                     # Claude Agent SDK
│   ├── elevenlabs.md                     # ElevenLabs integration
│   ├── twilio.md                         # Twilio Voice API
│   ├── google-ads.md                     # Google Ads API
│   ├── zillow.md                         # Zillow Lead API
│   └── realgeeks.md                      # RealGeeks API
└── database/
    ├── mongodb-schema.md                 # MongoDB collections
    └── qdrant-schema.md                  # Qdrant vector database
```

## Documentation Statistics

- **Total Files**: 14 comprehensive markdown files
- **Total Size**: ~200KB of production-ready documentation
- **Code Examples**: 100+ working examples in Node.js, .NET, and configuration files
- **Architecture Diagrams**: 8 detailed Mermaid diagrams

## Contributing

When adding new documentation:
1. Follow the existing format and style
2. Include realistic code examples
3. Reference related documentation
4. Update this README with new files

## Resources

- [Project CLAUDE.md](../CLAUDE.md) - Main project instructions and context
- [GitHub Repository](https://github.com/your-org/next-level-real-estate)

---

Last Updated: October 24, 2025
