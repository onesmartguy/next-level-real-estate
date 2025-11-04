# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Next Level Real Estate** is an AI-powered platform designed to revolutionize real estate wholesale operations through intelligent lead management, AI-driven customer engagement, and specialized agentic workflows. The system orchestrates multi-source lead generation, real-time conversational AI calling, and continuous market intelligence across four collaborative AI agents.

### Critical Success Factors
- **5-minute lead response rule**: Harvard research shows leads contacted within 5 minutes are 21x more likely to qualify
- **Real-time processing**: Webhook-based event-driven architecture for instant lead ingestion
- **AI-powered conversion**: 26% increase in closed deals with AI CRM automation
- **Compliance-first**: TCPA 2025 regulations strictly enforced (one-to-one consent, $500-$1,500 per violation)

## Technology Stack (2025)

### Core Infrastructure
- **Backend**: Node.js (TypeScript) + .NET Core 9 (C#) - polyglot microservices
- **Database**: MongoDB Atlas with aggregation pipelines for real-time analytics
- **Message Queue**: Kafka or RabbitMQ for event-driven architecture
- **Observability**: OpenTelemetry + SigNoz for distributed tracing

### AI & Communication
- **Conversational AI**: ElevenLabs Conversational AI 2.0 (Flash 2.5 model, 75ms latency)
  - 32+ language auto-detection with seamless mid-conversation switching
  - State-of-the-art turn-taking model to eliminate awkward pauses
  - HIPAA compliant for healthcare interactions
  - 5,000+ voices across 31 languages

- **Telephony**: Twilio Voice API with native ElevenLabs ConversationRelay integration
  - OpenAI Realtime API support for multimodal conversations
  - Media Streams for real-time bidirectional audio processing
  - Built-in TCPA compliance checkpoints

- **AI Agents**: Claude Agent SDK (Anthropic)
  - Tool ecosystem: file operations, code execution, web search, MCP connectors
  - Prompt caching: up to 90% cost reduction, 85% latency reduction, 1-hour TTL for batches
  - Streaming responses with automatic context propagation
  - No longer counts cached reads against ITPM rate limits

### Data & ML
- **Vector Databases**: Qdrant (recommended), Pinecone, ChromaDB, or Weaviate
  - RAG pattern: chunk → embed → index → retrieve
  - Hybrid keyword + vector search for semantic and exact matching
  - Knowledge graph support for relationship modeling

- **Lead Sources**:
  - Google Ads API v19.1 (April 2025): LocalServicesLeadService, conversion forecasting
  - Zillow Lead API: HTTP POST webhooks, real-time lead delivery
  - RealGeeks API: 2-way sync via API Nation, real-time updates

## Development Commands

### Node.js Projects
```bash
# Setup
npm install
npm run setup        # Database migrations, seed data

# Development
npm run dev          # Start dev server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run lint         # Run ESLint + Prettier
npm run format       # Auto-fix linting issues

# Testing
npm test             # Run all tests
npm test -- --watch # Watch mode for development
npm test -- --testNamePattern="<pattern>" # Run single test

# Production
npm run build:prod   # Optimized production build
npm start            # Start production server

# Docker
docker compose up    # Start full local environment
```

### .NET Core Projects
```bash
# Setup
dotnet restore      # Restore dependencies
dotnet ef migrations add <name> # Create database migration
dotnet ef database update       # Apply migrations

# Development
dotnet build        # Build solution
dotnet run          # Run application
dotnet watch run    # Watch mode with auto-rebuild
dotnet format       # Format code

# Testing
dotnet test         # Run all tests
dotnet test --filter "FullyQualifiedName~<TestName>" # Run single test
dotnet test /p:CollectCoverage=true                   # With coverage

# Production
dotnet publish -c Release -o ./publish # Create production build
```

### Common Tasks
```bash
# Docker Compose (full stack)
docker compose up -d              # Start all services
docker compose down               # Stop all services
docker compose logs -f <service>  # Stream logs

# Database
npm run db:seed                   # Seed test data (Node)
dotnet ef database update         # Apply migrations (.NET)

# Monitoring
npm run otel:start                # Start OpenTelemetry collector
curl http://localhost:4317        # Verify OTel endpoint
```

## High-Level Architecture

### System Design Overview

The platform is structured as a **distributed microservices system** with the following layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Node.js)                    │
│            (Authentication, Rate Limiting, Routing)         │
└──────────┬──────────────────────────────────────────────────┘
           │
    ┌──────┴──────────────┬──────────────┬──────────────┐
    │                     │              │              │
┌───▼────────┐   ┌────────▼──┐   ┌──────▼────┐   ┌────▼──────┐
│ Node.js    │   │ Node.js    │   │ .NET Core │   │ .NET Core │
│ Real-Time  │   │ Webhooks   │   │ Business  │   │ Analytics │
│ Services   │   │ Processor  │   │ Logic     │   │ Engine    │
└─────┬──────┘   └──────┬─────┘   └─────┬─────┘   └────┬──────┘
      │                │               │             │
      └────────────────┴───────────────┴─────────────┘
              │
         ┌────▼─────────────────────┐
         │   Event Bus (Kafka)      │
         │  (LeadReceived, Called,  │
         │   Updated, Completed)    │
         └────┬──────────────────────┘
              │
    ┌─────────┴──────────────┬──────────────┐
    │                        │              │
┌───▼──────────┐   ┌────────▼──┐   ┌──────▼────┐
│   MongoDB    │   │   Vector   │   │ Redis     │
│   (Primary)  │   │   DB       │   │ (Cache)   │
└──────────────┘   │  (RAG)     │   └───────────┘
                   └────────────┘
```

### Four Specialized Claude Agents

The system employs **four collaborative AI agents** that operate continuously:

1. **Architecture Agent** (`claude-ai-architect`)
   - Researches latest AI innovations and practices
   - Designs system improvements and new features
   - Makes technical decision recommendations
   - Maintains technical roadmap

2. **Conversation AI Agent** (`claude-ai-conversation`)
   - Designs and optimizes ElevenLabs conversation workflows
   - Manages dynamic context injection for calls
   - Implements self-improvement based on call transcripts
   - Handles conversation strategy refinement

3. **Sales & Marketing Expert Agent** (`claude-ai-sales`)
   - Conducts deep market research and trend analysis
   - Optimizes campaign strategies and talking points
   - Analyzes competitor tactics and industry best practices
   - Maintains and updates sales strategy documentation

4. **Realty Expert Agent** (`claude-ai-realty`)
   - Provides domain expertise in buying/selling strategies
   - Analyzes market conditions and investment opportunities
   - Ensures regulatory compliance (TCPA, RESPA, Fair Housing)
   - Documents best practices per real estate strategy

Each agent follows the **agentic workflow pattern**:
```
Gather Context → Take Action → Verify Work → Collect Feedback → Update Knowledge → Repeat
```

### Lead Processing Pipeline

**Real-time flow** (target: <5 minutes from lead creation to first contact):

```
Lead Sources          Event Bus           Processing         Action
(Google Ads)    ──→ (Webhook) ──→ Lead Ingestion ──→ Qualification
(Zillow)        ──→ (Event)   ──→ Deduplication  ──→ Assignment
(RealGeeks)     ──→ (Stream)  ──→ Enrichment    ──→ Campaign
                                  Context Prep   ──→ Calling
                                  Knowledge KB   ──→ Analytics
```

### AI Calling System

**ElevenLabs + Twilio Integration**:
- Twilio initiates outbound call with phone number
- ElevenLabs Conversational AI 2.0 answers with customized greeting
- Dynamic context injected at call start: lead data, property info, strategy rules
- Real-time conversation with 75ms model latency and human-like turn-taking
- Sentiment analysis during call identifies buyer motivation
- Post-call transcription fed to knowledge bases for continuous improvement

## Staged Implementation Plan

A six-stage approach de-risks development and enables continuous learning:

### Stage 1: Foundation (Weeks 1-4)
**Goal**: Establish core infrastructure and basic lead handling

- Project scaffolding (Node.js API, .NET services, MongoDB setup)
- Single lead source integration (start with one: Google Ads, Zillow, or RealGeeks)
- Lead ingestion and storage service
- Basic lead model with consent tracking (TCPA compliance)
- Local Docker Compose environment
- CI/CD pipeline setup (GitHub Actions)
- Basic observability (OpenTelemetry + SigNoz)

**Key Deliverables**:
- Running API Gateway
- Lead ingestion service with webhook handler
- MongoDB schema for leads and campaigns
- Docker Compose with all services

### Stage 2: Conversation System (Weeks 5-8)
**Goal**: Implement real-time AI calling

- ElevenLabs account setup and integration
- Twilio account and phone numbers
- ConversationRelay configuration with native ElevenLabs support
- Basic conversation flows (greeting, qualification, follow-up)
- Call logging and recording
- Basic analytics (call duration, outcome, transcript)
- Real-time context injection for lead-specific info

**Key Deliverables**:
- End-to-end outbound calling workflow
- Call transcription pipeline
- Basic sentiment analysis
- Call analytics dashboard

### Stage 3: Agentic Intelligence (Weeks 9-16)
**Goal**: Deploy Claude agents with RAG knowledge systems

- Claude Agent SDK integration
- Vector database setup (Qdrant)
- Knowledge base schema design per agent
- RAG pipeline: document chunking, embedding, indexing, retrieval
- Prompt caching implementation (target: 90% cost reduction)
- Four specialized agents deployed
- Inter-agent communication patterns
- Knowledge base self-improvement loops

**Key Deliverables**:
- Fully functional agent framework
- Vector database with 1000+ indexed documents
- Prompt caching reducing API costs 90%
- Conversation optimization loop (transcripts → knowledge update)

### Stage 4: Multi-Source Lead Management (Weeks 17-20)
**Goal**: Scale lead generation across multiple sources

- Google Ads API v19.1 integration (LocalServicesLeadService)
- Zillow Lead API integration (webhook handling)
- RealGeeks API 2-way sync
- Lead deduplication across sources
- Source attribution and performance tracking
- Multi-source campaign coordination
- Lead scoring and qualification automation

**Key Deliverables**:
- 3+ lead sources live and synchronized
- Deduplication engine with source tracking
- Lead scoring model
- Multi-source analytics dashboard

### Stage 5: Knowledge Systems (Weeks 21-24)
**Goal**: Implement self-improving feedback loops

- Market trend analysis pipeline
- Conversation quality metrics (from call analytics)
- A/B testing framework for conversation strategies
- Automated knowledge base updates from campaign results
- Version control for all knowledge (with timestamps)
- Agent performance metrics and self-review
- Continuous learning dashboard

**Key Deliverables**:
- Automated knowledge base updates
- Market intelligence pipeline
- A/B testing dashboard
- Agent performance metrics

### Stage 6: Advanced Multi-Strategy (Weeks 25+)
**Goal**: Support multiple real estate strategies beyond wholesale

- Strategy framework and abstraction layer
- Fix-and-flip strategy implementation
- Wholesaling strategy optimization
- Market analysis per strategy
- Strategy-specific conversation flows
- Opportunity matching to strategy
- Advanced market analysis

**Key Deliverables**:
- Multi-strategy framework
- 2+ strategies live and profitable
- Strategy-specific lead qualification
- Strategy recommendation engine

## Key Architectural Patterns

### Event-Driven Architecture
All major state changes flow through the event bus:
- **LeadReceived**: New lead imported from source
- **LeadQualified**: Passed qualification threshold
- **CallInitiated**: Outbound call started
- **CallCompleted**: Call ended with outcome
- **ConversationAnalyzed**: Sentiment and intent extracted
- **KnowledgeUpdated**: Knowledge base updated from feedback
- **CampaignOptimized**: Strategy or talking points updated

Microservices subscribe to relevant events and update their data accordingly. This ensures loose coupling and enables services to scale independently.

### API Gateway Pattern
All external requests route through a single Node.js API Gateway that handles:
- Request authentication (API keys, JWT tokens)
- Rate limiting per client
- Request/response logging
- Load balancing across backend services
- Protocol translation if needed

### Database Per Service
Each microservice owns its MongoDB collections:
- **Lead Service**: leads, contacts, interactions
- **Campaign Service**: campaigns, templates, rules
- **Call Service**: calls, recordings, transcripts
- **Analytics Service**: metrics, aggregations, reports

Shared data synced via events to prevent tight coupling.

### Prompt Caching for Cost Reduction
Implement multi-tier caching:
1. **Static Cached** (unchanged): System prompts, compliance rules, strategy guides
   - Cache ttl: 1 hour (for batch processing)
   - Hit rate: >95%
   - Cost savings: 90%

2. **Semi-Static Cached** (updated daily): Market intelligence, top practices, examples
   - Cache ttl: 5 minutes
   - Hit rate: 70-80%

3. **Session Context** (per conversation): Agent state, decision history, user preferences
   - No caching (updated continuously)

4. **Real-Time Context** (streaming): Market data, sentiment, dynamic updates
   - No caching (requires latest data)

## Compliance & Regulations

### TCPA 2025 Requirements
As of January 2025, strict new regulations took effect:

- **One-to-One Consent**: Each company needs separate written consent from recipient
  - Verbal agreements no longer acceptable
  - Consent must be documented in CRM

- **Automated Calling Restrictions**:
  - Automated calls/prerecorded messages require written consent
  - Manual dialing recommended for cold prospects
  - Automated systems only for opted-in contacts

- **Do Not Call Registry**:
  - Check against national DNC before any outreach
  - Maintain internal DNC list
  - 31-day scrub cycle

- **CRM Tracking Requirements**:
  - Track consent date, method, and source
  - Log all opt-outs immediately
  - Maintain audit trail of all contacts

**Violations**: $500-$1,500 per violation call

### HIPAA Compliance
When handling healthcare or sensitive data:
- ElevenLabs HIPAA compliance enabled
- Twilio HIPAA account configuration
- MongoDB encryption at rest
- All data access logged and audited
- Data retention policies enforced

### Implementation in Code
MongoDB schema enforces TCPA requirements:
```javascript
{
  leadId: String,
  phone: String,
  consent: {
    hasWrittenConsent: Boolean,
    consentDate: Date,
    consentMethod: 'written_form' | 'email' | 'phone',
    consentSource: String,
    expiresAt: Date
  },
  dncStatus: {
    onNationalRegistry: Boolean,
    internalDNC: Boolean,
    lastCheckedAt: Date
  },
  automatedCallsAllowed: Boolean,
  callAttempts: [
    { date: Date, type: 'manual' | 'automated', result: String }
  ]
}
```

## Real Estate Domain Knowledge

### Wholesale Strategy
The initial focus: buying properties below market value and selling to investors or end buyers.

**Lead Qualification Criteria**:
- Motivated sellers (probate, foreclosure, distressed)
- Estimated equity >20%
- Property condition issues (good ARV fix candidates)
- Time-sensitive situations

**Market Intelligence Needed**:
- After-repair value (ARV) for property type and location
- Comparable recent sales
- Repair cost estimates
- Investor buyer network and their criteria
- Market absorption rates

**AI Agent Role (Realty Expert)**:
- Analyze property listing for wholesale potential
- Extract market comps data
- Calculate estimated profit margins
- Identify comparable deals
- Track market trends by geography

### Key Metrics (from research)
- **AI CRM Automation**: 26% increase in closed deals
- **Task Automation**: 80% of wholesaling tasks can be automated
- **Response Time Impact**: 5-minute response = 21x more likely to qualify (vs. 30+ minutes)
- **Lead Quality**: AI qualification 25% more accurate than manual screening

## Integration Points

### Google Ads API v19.1 (April 2025)
- **Lead Form Assets**: Pull leads submitted via Google ads
- **LocalServicesLeadService**: New service for rating and feedback on leads
- **Conversion Forecasting**: Predict expected conversion rates
- **Webhook Integration**: Real-time lead delivery
- **Developer Token**: Required for API access

### Zillow Lead API
- **Webhook Delivery**: HTTP POST with lead data
- **Payload Format**: URL-encoded with property and contact info
- **Contact**: rentalfeeds@zillow.com for implementation
- **Deduplication**: Cross-reference with other leads

### RealGeeks API
- **2-Way Sync**: Changes sync bidirectionally in real-time
- **API Nation**: Integration platform for 15,000+ automations
- **Connected Apps**: Google Contacts, Zillow, MailChimp, eRelocation, etc.
- **Authentication**: API username/password (emailed upon request)

### ElevenLabs Conversational AI 2.0
- **Model**: Flash 2.5 (75ms latency, high quality)
- **Languages**: 32+ with auto-detection
- **Turn-Taking**: State-of-the-art interruption handling
- **Custom LLM**: Support for Claude, GPT-4o, Gemini, or custom
- **WebSocket API**: Real-time bidirectional audio
- **Webhook Events**: Call started/ended, transcription ready

### Twilio Voice API
- **ConversationRelay**: Native ElevenLabs integration
- **Media Streams**: Bidirectional real-time audio
- **TwiML**: Call control instructions
- **Phone Numbers**: Owned numbers or toll-free
- **Webhooks**: Call status updates (initiated, ringing, answered, completed)

### Claude Agent SDK (Anthropic)
- **Tool Use**: Function calling for external APIs
- **Prompt Caching**: Store long contexts, reuse across messages
- **MCP Connectors**: Extend with custom tools
- **Streaming**: Real-time token streaming
- **Files API**: Handle documents, images, etc.

## Knowledge Base Architecture

### RAG Implementation
1. **Document Preparation**: Market research, best practices, strategies
2. **Chunking**: Split documents into 500-1000 token chunks
3. **Embedding**: Use text-embedding-3-large for semantic search
4. **Indexing**: Store in Qdrant with metadata filters
5. **Retrieval**: Hybrid search (keyword + semantic)
6. **Generation**: Claude generates response with retrieved context
7. **Feedback**: Call outcomes fed back into knowledge base

### Per-Agent Knowledge Domains

**Architecture Agent KB**:
- Latest AI research papers and whitepapers
- System design patterns (microservices, event-driven, etc.)
- Performance benchmarks and optimization techniques
- Technology comparison matrices

**Conversation AI Agent KB**:
- Top 100 conversation openings and their success rates
- Objection handling techniques by objection type
- Sentiment-driven response patterns
- A/B test results for conversation variations

**Sales & Marketing Agent KB**:
- Market trends by region and property type
- Competitor analysis and tactics
- Campaign performance metrics (CTR, conversion, cost/lead)
- Seasonal trends and optimal campaign timing
- Successful email sequences and follow-up patterns

**Realty Expert Agent KB**:
- Property valuation methodologies
- Investment criteria by strategy type
- Regulatory requirements (TCPA, Fair Housing, etc.)
- Tax implications and legal structures
- Market reports and trend analysis

## Performance Optimization

### 1. Prompt Caching (90% Cost Reduction)
- Store system prompts once, reuse across calls
- Cache strategy guides and best practices daily
- Batch process updates during low-traffic windows
- Monitor cache hit rates and adjust TTLs

### 2. Real-Time Processing
- Webhook-based lead ingestion (instant vs. polling)
- Event bus for asynchronous processing
- Parallel context assembly for calling (reduce 3s → 1s)
- Stream processing with Kafka Streams

### 3. Database Optimization
- MongoDB aggregation pipelines for real-time analytics
- Indexes on frequently queried fields (phone, email, source)
- Time-series collections for call metrics
- Partitioning by date for lead data

### 4. Vector Database Tuning
- Configure Qdrant with appropriate vector dimensions
- Set query parameters for latency vs. accuracy tradeoff
- Use metadata filtering to reduce search space
- Cache frequently retrieved documents

## Observability & Monitoring

### Distributed Tracing (OpenTelemetry)
- Trace every lead through the system
- Identify bottlenecks and slow services
- Track context propagation between agents
- Monitor cache hit rates

### Key Metrics
- **Lead Metrics**: Ingestion rate, deduplication rate, qualification rate
- **Call Metrics**: Connect rate, call duration, sentiment score, transcript quality
- **Agent Metrics**: Response time, decision accuracy, knowledge base update frequency
- **System Metrics**: API response times, queue depth, error rates, cache performance

### Alerting
- Lead response time >5 minutes
- Call connect rate <80%
- Agent response time >5 seconds
- System error rate >0.1%

## Project Structure (To Establish)

```
next-level-real-estate/
├── CLAUDE.md                          # This file
├── docs/
│   ├── CONTEXT_MANAGEMENT.md          # Multi-agent context strategy
│   ├── ARCHITECTURE_DIAGRAMS.md       # Mermaid diagrams
│   └── api/
│       ├── google-ads.md
│       ├── zillow.md
│       ├── realgeeks.md
│       ├── elevenlabs.md
│       ├── twilio.md
│       ├── claude-sdk.md
│       ├── mongodb.md
│       ├── qdrant.md
│       └── examples/
├── services/
│   ├── api-gateway/                   # Node.js
│   ├── lead-service/                  # Node.js or .NET
│   ├── calling-service/               # Node.js (real-time)
│   ├── agent-service/                 # .NET Core
│   ├── analytics-service/             # .NET Core
│   └── event-processor/               # Node.js
├── agents/
│   ├── architect-agent/
│   ├── conversation-agent/
│   ├── sales-agent/
│   └── realty-agent/
├── shared/
│   ├── models/                        # Shared data models
│   ├── constants/                     # TCPA rules, strategies, etc.
│   └── utils/                         # Shared utilities
├── docker-compose.yml
├── .github/
│   └── workflows/                     # CI/CD pipelines
└── README.md
```

## Useful Resources & References

### 2025 Latest Documentation
- **ElevenLabs**: https://elevenlabs.io/docs/conversational-ai/overview
- **Twilio**: https://www.twilio.com/docs/voice/api
- **Claude Agent SDK**: https://docs.claude.com/en/api/agent-sdk/overview
- **MongoDB**: https://docs.mongodb.com/manual/
- **OpenTelemetry**: https://opentelemetry.io/docs/

### Real Estate Industry
- **Real Estate Wholesale**: https://www.investopedia.com/articles/personal-finance/120515/wholesaling-real-estate.asp
- **TCPA Compliance 2025**: Check FCC.gov for latest regulations
- **Fair Housing**: https://www.hud.gov/program_offices/fair_housing_equal_opp

### AI Agents & Multi-Agent Systems
- **Agentic AI Patterns**: https://research.anthropic.com/ (Anthropic research)
- **Multi-Agent Architectures**: https://medium.com/@anil.jain.baba/agentic-ai-architectures-and-design-patterns-288ac589179a
- **RAG Best Practices**: https://deeplearning.ai/short-courses/agentic-knowledge-graph-construction/

## Notes for Future Development

1. **Early Focus**: Get Stage 1 & 2 complete quickly to validate the market and product
2. **Cost Optimization**: Use prompt caching from day 1 - it compounds savings over time
3. **TCPA Compliance**: Build consent tracking from the start, not later as an afterthought
4. **Agent Knowledge**: Start with structured knowledge bases, add self-improvement feedback loops incrementally
5. **Real Estate Domain**: Hire domain experts to refine wholesale qualification criteria and market intelligence
6. **Monitoring**: Implement observability early - distributed tracing will save debugging time later
