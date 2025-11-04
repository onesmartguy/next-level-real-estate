# Quick Start Guide - AI Agent System

Get all four Claude AI agents running in under 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed
- Anthropic API key
- OpenAI API key

## 1. Setup (2 minutes)

```bash
cd /home/onesmartguy/projects/next-level-real-estate/agents

# Run automated setup
./setup.sh
```

This script will:
- ✓ Check Node.js and Docker
- ✓ Create `.env` from template
- ✓ Start infrastructure (Kafka, Redis, Qdrant, MongoDB)
- ✓ Install all dependencies
- ✓ Build all agents

## 2. Configure API Keys (30 seconds)

Edit `/home/onesmartguy/projects/next-level-real-estate/agents/.env`:

```bash
# Add your keys
ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY-HERE
OPENAI_API_KEY=sk-YOUR-KEY-HERE
```

## 3. Start Agents (1 minute)

### Option A: All agents in separate terminals (recommended)

```bash
# Terminal 1 - Architecture Agent
cd /home/onesmartguy/projects/next-level-real-estate/agents/architect
npm run dev

# Terminal 2 - Conversation Agent
cd /home/onesmartguy/projects/next-level-real-estate/agents/conversation
npm run dev

# Terminal 3 - Sales Agent
cd /home/onesmartguy/projects/next-level-real-estate/agents/sales
npm run dev

# Terminal 4 - Realty Agent
cd /home/onesmartguy/projects/next-level-real-estate/agents/realty
npm run dev
```

### Option B: Test individual agent

```bash
cd /home/onesmartguy/projects/next-level-real-estate/agents/architect
npm run dev
```

## 4. Verify Everything Works (30 seconds)

### Check Infrastructure

```bash
# Check Kafka
docker compose ps kafka

# Check Redis
docker compose ps redis

# Check Qdrant
docker compose ps qdrant
curl http://localhost:6333/collections

# Check MongoDB
docker compose ps mongodb
```

### Test an Agent

Create `/home/onesmartguy/projects/next-level-real-estate/test-agent.ts`:

```typescript
import { ArchitectAgent } from './agents/architect/src/agent';

async function test() {
  const agent = new ArchitectAgent();
  await agent.initialize();

  const result = await agent.query(
    'What are the best practices for implementing prompt caching?'
  );

  console.log('Agent response:', result);

  await agent.shutdown();
  process.exit(0);
}

test();
```

Run it:

```bash
cd /home/onesmartguy/projects/next-level-real-estate
npx ts-node test-agent.ts
```

## Common Issues

### "Cannot find module '@next-level-re/agent-shared'"

```bash
cd agents/shared
npm install
npm run build
```

### "ECONNREFUSED localhost:6379" (Redis)

```bash
docker compose up -d redis
```

### "ECONNREFUSED localhost:9092" (Kafka)

```bash
docker compose up -d kafka
```

### "ANTHROPIC_API_KEY not set"

Edit `agents/.env` and add your API key.

## Next Steps

1. **Add Knowledge**: Index documents into agent knowledge bases
2. **Test Queries**: Try different queries for each agent
3. **Monitor**: Check OpenTelemetry traces at http://localhost:3301
4. **Integrate**: Connect to lead sources and telephony

## Example Queries

### Architecture Agent

```typescript
const agent = new ArchitectAgent();
await agent.initialize();

// System optimization
await agent.query('Analyze API gateway performance. Current p95 is 850ms. Recommend optimizations.');

// Technology research
await agent.query('Compare Qdrant vs Pinecone for our vector database needs.');

// Database analysis
await agent.query('MongoDB leads collection has slow queries. Analyze and recommend indexes.');
```

### Conversation Agent

```typescript
const agent = new ConversationAgent();
await agent.initialize();

// Transcript analysis
await agent.analyzeTranscript(callTranscript, {
  duration: 4.5,
  outcome: 'appointment_scheduled'
});

// Design conversation
await agent.query('Design a conversation flow for cold outreach to seller leads.');

// Extract patterns
await agent.query('What are the top 3 objections from last month and best responses?');
```

### Sales Agent

```typescript
const agent = new SalesAgent();
await agent.initialize();

// Market analysis
await agent.query('Analyze Austin TX market trends for single-family homes.');

// Campaign optimization
await agent.query('Google Ads CPL is $62, Zillow is $48. Recommend budget allocation.');

// Competitor research
await agent.query('Research top 3 competitors in Dallas market. What are they doing well?');
```

### Realty Agent

```typescript
const agent = new RealtyAgent();
await agent.initialize();

// Deal analysis
await agent.query('Wholesale deal: Buy $280k, ARV $420k, Repairs $45k. Is this good?');

// Compliance check
await agent.query('Check TCPA compliance for lead #12345.');

// Property valuation
await agent.query('Find comparable sales for 123 Main St, Austin TX 78701.');
```

## File Structure

```
agents/
├── shared/              # Shared infrastructure (Claude, RAG, Vector, Cache, Messaging)
├── architect/           # System design & optimization agent
├── conversation/        # Call transcript & conversation optimization agent
├── sales/              # Market research & campaign optimization agent
├── realty/             # Property analysis & compliance agent
├── .env                # API keys and configuration
├── setup.sh            # Automated setup script
├── README.md           # Full documentation
└── QUICK_START.md      # This file
```

## Agent Capabilities Summary

| Agent | Purpose | Key Tools |
|-------|---------|-----------|
| **Architect** | System optimization, tech research | Query metrics, analyze DB, research tech |
| **Conversation** | Call analysis, conversation design | Analyze transcripts, extract patterns, design flows |
| **Sales** | Market research, campaign optimization | Analyze markets, query campaigns, research competitors |
| **Realty** | Property analysis, compliance | Analyze properties, get comps, check TCPA |

## Resources

- **Full Documentation**: `/home/onesmartguy/projects/next-level-real-estate/agents/README.md`
- **Implementation Guide**: `/home/onesmartguy/projects/next-level-real-estate/agents/IMPLEMENTATION_COMPLETE.md`
- **Shared Infrastructure**: `/home/onesmartguy/projects/next-level-real-estate/agents/shared/README.md`
- **Architecture Agent**: `/home/onesmartguy/projects/next-level-real-estate/agents/architect/README.md`

## Support

For issues or questions:
1. Check the full README.md
2. Review IMPLEMENTATION_COMPLETE.md
3. Check Docker logs: `docker compose logs [service]`
4. Verify API keys in `.env`

---

**You're all set! The AI agent system is ready to use.**
