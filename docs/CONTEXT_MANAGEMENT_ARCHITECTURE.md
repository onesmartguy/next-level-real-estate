# Context Management Architecture

## Executive Summary

This document defines how context flows through the Next Level Real Estate platform's multi-agent system. Context management is critical for:

1. **Cost Optimization**: Prompt caching reduces API costs by 90% through intelligent context reuse
2. **Performance**: Multi-tier context layers reduce latency from 3s to 1s for real-time calling
3. **Knowledge Continuity**: Self-improving feedback loops require consistent context across agents and sessions
4. **Compliance**: TCPA context (consent, DNC status) flows through entire system
5. **Domain Intelligence**: Market data, property info, and strategy rules available in real-time

## System Architecture

### Context Hierarchy (4 Tiers)

```
Tier 1: STATIC CACHED
├─ System prompts (never change)
├─ Compliance rules (TCPA, HIPAA)
├─ Strategy frameworks
└─ Agent role definitions
Cache TTL: 1 hour | Hit Rate: >95% | Cost Savings: 90%

Tier 2: SEMI-STATIC CACHED
├─ Market intelligence (daily updates)
├─ Best practices documentation
├─ Top conversation openers
└─ Agent knowledge bases
Cache TTL: 5 minutes | Hit Rate: 70-80% | Cost Savings: 75%

Tier 3: SESSION CONTEXT
├─ Agent state (decision history)
├─ Conversation memory
├─ User preferences
└─ Interaction history
NO CACHING | Real-time updates | Cost: baseline

Tier 4: REAL-TIME STREAMING
├─ Lead data (current)
├─ Call sentiment analysis
├─ Market data (tick by tick)
└─ Agent performance metrics
NO CACHING | Latest data critical | Cost: baseline
```

## Multi-Agent Context Orchestration

### Context Flow Between Agents

```
┌─────────────────────────────────────────────────┐
│         Central Context Manager                 │
│    (MongoDB + Vector DB + Cache Layer)          │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┼──────────┬──────────┬──────────┐
        │          │          │          │          │
    ┌───▼──┐  ┌───▼──┐  ┌───▼──┐  ┌───▼──┐
    │ARCH  │  │CONV  │  │SALES │  │REALTY│
    │Agent │  │Agent │  │Agent │  │Agent │
    └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘
       │         │         │         │
       │    ┌────┴─────────┴─────────┴────┐
       │    │                              │
       └────▶ Shared Knowledge Base (RAG)  │
            │                              │
            │ - Market Intelligence        │
            │ - Best Practices             │
            │ - Conversation Patterns      │
            │ - Domain Rules               │
            └──────────────────────────────┘
```

### Agent-Specific Context Requirements

**Architecture Agent**:
- INPUT: System metrics, performance data, latest research
- PROCESS: Analyze trends, design improvements
- OUTPUT: System design docs, optimization recommendations
- KNOWLEDGE: Tech stack, design patterns, benchmarks

**Conversation AI Agent**:
- INPUT: Call transcripts, sentiment scores, lead data
- PROCESS: Extract patterns, refine workflows
- OUTPUT: Updated conversation templates, new strategies
- KNOWLEDGE: Conversation openers, objection handling, talking points

**Sales & Marketing Agent**:
- INPUT: Campaign performance, market trends, competitor data
- PROCESS: Analyze ROI, identify best practices
- OUTPUT: Campaign strategies, target market lists
- KNOWLEDGE: Market trends, seasonal patterns, competitor tactics

**Realty Expert Agent**:
- INPUT: Property data, market conditions, regulatory changes
- PROCESS: Evaluate opportunities, ensure compliance
- OUTPUT: Investment recommendations, strategy guidance
- KNOWLEDGE: Valuation methods, investment criteria, regulations

## Vector Database Strategy

### Qdrant Configuration (Recommended)

**Why Qdrant?**
- Self-hostable or managed options
- Superior hybrid search (keyword + semantic)
- Excellent filtering and metadata handling
- Built for low-latency retrieval (1-10ms)
- Strong community and production deployments

### Collection Structure

**Per-Agent Collections** (with embedded vectors):

```yaml
Collections:
  architect-knowledge:
    vector_size: 1536          # text-embedding-3-large
    distance: Cosine
    indexing: HNSW
    metadata:
      source: 'research_paper' | 'design_doc' | 'benchmark'
      date_updated: timestamp
      version: string
      relevance_score: float

  conversation-patterns:
    vector_size: 1536
    distance: Cosine
    indexing: HNSW
    metadata:
      category: 'opener' | 'objection' | 'close'
      success_rate: float
      tested_with_leads: integer
      last_updated: timestamp

  market-intelligence:
    vector_size: 1536
    distance: Cosine
    indexing: HNSW
    metadata:
      region: string
      property_type: string
      data_source: string
      timestamp: datetime
      confidence: float

  realty-domain:
    vector_size: 1536
    distance: Cosine
    indexing: HNSW
    metadata:
      strategy_type: 'wholesale' | 'fix-flip' | 'rental'
      category: 'valuation' | 'compliance' | 'investment'
      jurisdiction: string
      effective_date: datetime
```

### Embedding Strategy

**text-embedding-3-large** (recommended):
- Dimension: 1536
- Semantic understanding: Excellent
- Speed: 2.2x faster than v2
- Cost: $0.13 per 1M tokens
- Context window: Up to 8192 tokens

**Chunking Strategy**:
1. Document preparation (remove headers, formatting)
2. Chunk size: 500-1000 tokens (overlap: 100 tokens)
3. Chunk encoding: `"[SECTION] {section_title}\n{content}"`
4. Metadata extraction: Source, date, category, version
5. Embedding generation (batch in off-peak hours)
6. Upsert to Qdrant with vectors + metadata

**Hybrid Search Implementation**:
```
Query Processing:
1. Keyword match on metadata (fast, exact)
2. Vector semantic search (slow, relevant)
3. Combine results: sort by hybrid score
   score = 0.3 * keyword_relevance + 0.7 * vector_similarity
```

## RAG Implementation Pipeline

### 5-Step RAG Cycle

```
STEP 1: Document Ingestion
└─ Receive market research, best practices, strategies
   Convert to text, clean formatting

STEP 2: Chunking & Embedding
└─ Split into 500-1000 token chunks
   Generate embeddings (batch during low-traffic)
   Attach metadata (source, date, category)

STEP 3: Storage & Indexing
└─ Upsert vectors to Qdrant
   Create metadata indexes for filtering
   Tag with version and timestamp

STEP 4: Retrieval & Augmentation
└─ Agent queries for context
   Hybrid search (keyword + vector)
   Retrieve top-k results with metadata
   Rank by relevance and recency

STEP 5: Generation & Feedback
└─ Claude generates response with context
   Log query, context, and response
   Collect feedback from outcomes
   Update knowledge base with new insights
```

### Query Augmentation Pattern

```python
class RAGRetriever:
    def retrieve_context(self, query: str, agent_type: str, filters: dict):
        # Step 1: Expand query with synonyms
        expanded = expand_query(query)

        # Step 2: Build metadata filters
        filters = {
            "agent_type": agent_type,
            "date_updated": {"gt": now - timedelta(days=90)},
            **custom_filters
        }

        # Step 3: Hybrid search
        keyword_results = qdrant.search_keyword(expanded, filters)
        vector_results = qdrant.search_vector(
            query_embedding,
            limit=20,
            filters=filters
        )

        # Step 4: Combine and rank
        combined = merge_results(keyword_results, vector_results)
        ranked = rank_by_relevance(combined)

        # Step 5: Format for Claude
        context = format_context(ranked[:5])  # Top 5
        return context
```

## Real-Time Context Injection for Calling

### Pre-Call Context Assembly (<500ms target)

When ElevenLabs call starts, assemble context in parallel:

```
Call Initiated (t=0ms)
│
├─ Fetch Lead Data (t=50ms)
│  └─ Get lead record from MongoDB
│     ├─ Demographics, contact history
│     ├─ Consent status, DNC check
│     ├─ Previous calls and notes
│
├─ Fetch Property Context (t=50ms)
│  └─ Get property address from Zillow/RealGeeks
│     ├─ Current market value
│     ├─ Property condition
│     ├─ Recent comparable sales
│
├─ Fetch Strategy Rules (t=50ms - cached!)
│  └─ Get wholesale criteria from cache
│     ├─ Minimum equity threshold
│     ├─ Target repair budget
│     ├─ Decision criteria
│
├─ Fetch Talking Points (t=100ms - cached!)
│  └─ Get conversation strategy from vector DB
│     ├─ Greeting for this market
│     ├─ Top 3 objection handlers
│     ├─ Closing techniques
│
└─ Assemble Dynamic Prompt (t=200ms)
   └─ Combine all context for ElevenLabs
      "You are calling {lead.firstName} about..."
      "Property details: {property.address}, ARV ${property.arv}"
      "Key points: {talking_points}"

Context Ready (t=300ms) - Call can start!
```

### ElevenLabs Prompt Template

```
You are a professional real estate wholesaler calling to evaluate a potential investment property.

LEAD INFORMATION:
- Name: {lead.firstName} {lead.lastName}
- Phone: {lead.phone}
- Property: {property.address}
- Estimated Value: ${property.estimatedValue}
- Condition: {property.condition}

CONTEXT:
- This is a {strategy} opportunity
- Our profit threshold: {profit_threshold}
- Similar properties in this area: {comparables}
- Market trend: {market_trend}

YOUR APPROACH:
1. Start with: "{opening_greeting}"
2. If they express concern about {common_objection}, use: "{objection_handler}"
3. Closing approach: "{closing_technique}"
4. Track their sentiment and adjust tone accordingly

CONSTRAINTS:
- Verify consent before discussing specifics
- Check DNC status before offering callback
- Document all key information for follow-up
- Never guarantee property values
```

## Prompt Caching Optimization

### Caching Strategy (Multi-Tier)

**Tier 1: Static System Context** (1-hour TTL)
```
Cache Writes:
┌─────────────────────────────────────┐
│ System Prompt                        │
│ ├─ Agent role definition            │
│ ├─ Compliance rules (TCPA, HIPAA)   │
│ ├─ Strategy frameworks              │
│ └─ Output format specifications     │
│                                     │
│ Est. Tokens: 2000                   │
│ Cost per write: 2000 * 0.0003 = $0.60  │
│ Reuse per day: 100+ → cost $0.006  │
│ vs. baseline $0.60 → 99% savings!   │
└─────────────────────────────────────┘

Read Pattern:
- Each agent message includes cache control
- Cost: 2000 * 0.00003 = $0.06 per read
- vs. baseline $0.60 → 90% savings
```

**Tier 2: Daily Knowledge Updates** (5-minute TTL)
```
Market Intelligence Documents:
- Top 20 market trends
- Top 20 competitor tactics
- Top 20 successful call patterns
- Est. Tokens: 5000 per agent
- Update frequency: Once per day
- Cache hits per day: 50+ per agent
- Savings: 75% vs. baseline
```

**Tier 3: Session Context** (No caching)
- Lead-specific data (changes per call)
- Call history (unique per interaction)
- Agent decision state (ephemeral)
- Real-time market data (must be fresh)

**Tier 4: Real-Time Streaming** (No caching)
- Sentiment analysis (during call)
- Market tick data (millisecond-level)
- Live agent metrics (continuous updates)

### Cost Impact Analysis

```
Without Caching (Baseline):
- 1000 calls/day
- 2000 token system prompt per call
- $0.60 per 1K input tokens
- Cost: 1000 * 2000 * $0.60 / 1000 = $1,200/day

With Caching (Tier 1 + 2):
- System context: cached once, reused 1000 times
  - Write: $0.60 (one-time)
  - Reads: 1000 * 2000 * $0.00003 = $60/day

- Knowledge: cached once per day
  - Write: $2.50 (5000 tokens * 0.0005)
  - Reads: 1000 * 5000 * $0.00003 = $150/day

- Total: $60 + $150 = $210/day
- SAVINGS: $1,200 - $210 = $990/day = 82.5%

With Batch Processing (1-hour TTL):
- Batch 1000 calls during low-traffic hours
- Cache time extends to full hour
- Hit rate improves to 95%+
- SAVINGS: Up to 95% reduction!
```

## Cross-System Synchronization

### Data Consistency Pattern

```
┌─────────────────────────────────────────────────┐
│           Event Bus (Kafka)                    │
│                                                 │
│ Events: DataUpdated, KnowledgeUpdated,         │
│         MetricRecorded, FeedbackCollected      │
└────────────┬────────────────────────────────────┘
             │
    ┌────────┼────────┬──────────┬───────────┐
    │        │        │          │           │
    ▼        ▼        ▼          ▼           ▼
 MongoDB  Redis    Qdrant    ELK Stack   Agent State
 (Primary) (Cache) (RAG)     (Metrics)   (Memory)

Sync Pattern:
1. Write to MongoDB (source of truth)
2. Emit event to Kafka
3. Subscribers update their local copies:
   - Redis for hot data
   - Qdrant for vector search
   - Agent state for in-memory access
4. Vector DB updates from scheduled jobs
5. Agent knowledge bases refresh on schedule
```

### Eventual Consistency Model

```
Strong Consistency for: Consent, DNC, Compliance
├─ MongoDB write → Event → Update Redis/Vector DB
├─ Latency: <100ms
├─ Guaranteed correctness

Eventual Consistency for: Market data, Best practices
├─ MongoDB write → Scheduled batch update
├─ Latency: Can be 5-60 minutes
├─ Performance optimized

Real-time Sync for: Call sentiment, Metrics
├─ Stream processing with Kafka Streams
├─ Latency: <1 second
├─ Critical for live decisions
```

## Self-Improvement Feedback Loops

### Continuous Learning Cycle

```
Call Complete
    │
    ├─ Transcription Service
    │  └─ Convert audio to text
    │
    ├─ Sentiment Analysis
    │  └─ Extract caller emotions, intent
    │
    ├─ Conversation Analyzer (Gong-style)
    │  ├─ Identify successful patterns
    │  ├─ Flag objections and responses
    │  └─ Rate call quality
    │
    ├─ Outcome Recording
    │  ├─ Lead qualified? Callback requested? Follow-up needed?
    │  └─ Store in MongoDB
    │
    └─ Knowledge Base Update
       ├─ What worked? (add to best practices)
       ├─ What didn't? (refine approach)
       ├─ New market insight? (update intelligence)
       └─ Update vector DB with new learnings

Agent reviews changes
    │
    └─ Next call uses improved context
```

### Example: Conversation Learning

```
SCENARIO: Call closes sale successfully

1. Transcription extracted:
   "Great, let's schedule the inspection next Tuesday"

2. Sentiment: Very positive (0.92/1.0)

3. Patterns identified:
   - Used "next Tuesday" instead of vague "soon"
   - Caller used first name 4x in conversation
   - Property objection handled with comps data

4. Vector embedding created:
   "When caller expresses concern about condition,
    reference recent comparable sales with photos.
    Schedule specific dates (e.g., 'next Tuesday')
    rather than vague timeframes."

5. Stored in qdrant/conversation-patterns:
   {
     "content": "Use specific dates like 'next Tuesday'...",
     "vector": [...1536 dimensions...],
     "metadata": {
       "category": "closing_technique",
       "success_rate": 0.92,
       "tested_with_leads": 1,
       "date_discovered": "2025-10-24",
       "source": "call_123456"
     }
   }

6. Next agent request for closing techniques:
   Vector search finds this pattern
   → Agent gets improved technique
   → Better success rate
```

## Knowledge Base Versioning

### Version Control Strategy

```
Each knowledge document includes:
- content_hash: SHA256 of content
- version: Incrementing integer
- created_at: ISO timestamp
- updated_at: ISO timestamp
- source: human | agent | feedback
- feedback_source: call_id | agent_id | research

Example MongoDB schema:
{
  _id: ObjectId,
  title: "Objection Handler: 'Need to think about it'",
  content: "When the caller says...",
  vector: [...],
  version: 5,
  versions: [
    { v: 1, updated_at: 2025-01-01, source: "human_created" },
    { v: 2, updated_at: 2025-01-15, source: "call_456_feedback" },
    { v: 3, updated_at: 2025-02-01, source: "call_789_feedback" },
    { v: 4, updated_at: 2025-02-20, source: "agent_review" },
    { v: 5, updated_at: 2025-10-24, source: "market_research" }
  ],
  effectiveness: {
    calls_used: 127,
    success_rate: 0.84,
    trend: "improving"
  },
  related_feedback: [
    "call_456", "call_789", "call_901"
  ]
}
```

## Agent State Management

### Per-Agent Memory Structure

```
Agent State (in Redis + MongoDB):
├─ Decision History
│  └─ [timestamp, decision, reasoning, outcome]
│
├─ Knowledge Base Refresh Time
│  └─ Last updated from vector DB
│
├─ Performance Metrics
│  ├─ Response time
│  ├─ Decision accuracy
│  ├─ Knowledge base hit rate
│  └─ Feedback incorporation rate
│
├─ Active Contexts
│  └─ Current request context (2MB max)
│
└─ Cache Hit Tracking
   └─ Monitor which caches are hot/cold
```

## Observability for Context

### Key Metrics

```
Context Retrieval Performance:
- Latency P50 / P95 / P99 (target: <100ms)
- Vector search time (target: <50ms)
- Cache hit rate (target: >80%)
- Knowledge base freshness (updated <24h ago: >90%)

Agent Context Usage:
- Avg context tokens per request
- Context reuse rate (same context twice)
- Knowledge base sections used most
- Agent-to-agent context handoff rate

Cost Metrics:
- Cached token reads vs. full tokens
- Cost savings from caching (target: 80%+)
- Knowledge base update cost
- Vector DB storage and query costs

Quality Metrics:
- Call outcome improvement after knowledge update
- Agent decision accuracy
- Customer satisfaction with responses
- Knowledge base relevance score
```

## Implementation Roadmap

### Phase 1 (Weeks 1-4): Foundation
- [ ] Vector database (Qdrant) setup and indexing
- [ ] Basic RAG retrieval pipeline
- [ ] Lead context assembly for calling
- [ ] Prompt caching infrastructure (no actual caching yet)

### Phase 2 (Weeks 5-8): Agent Integration
- [ ] Claude Agent SDK integration
- [ ] Per-agent knowledge bases
- [ ] Agent-to-agent context passing
- [ ] Prompt caching activation (Tier 1)

### Phase 3 (Weeks 9-12): Self-Improvement
- [ ] Feedback collection from calls
- [ ] Knowledge base update pipeline
- [ ] Versioning and history tracking
- [ ] Sentiment analysis integration

### Phase 4 (Weeks 13+): Optimization
- [ ] Advanced prompt caching (Tier 2)
- [ ] Cost monitoring and optimization
- [ ] Performance tuning based on metrics
- [ ] Multi-agent knowledge synthesis

## Conclusion

Context management is foundational to system success. A well-designed context architecture enables:
- **Cost Efficiency**: 90% reduction through intelligent caching
- **Performance**: Sub-second response times for real-time calling
- **Autonomy**: Self-improving agents that learn from experience
- **Compliance**: Context flows ensuring legal requirements
- **Intelligence**: Real-time access to domain knowledge
