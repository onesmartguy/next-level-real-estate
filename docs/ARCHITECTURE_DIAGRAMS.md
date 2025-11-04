# Architecture Diagrams

## 1. High-Level System Architecture

This diagram shows the complete platform with all major components and their interactions.

```mermaid
graph TB
    subgraph external["External Services"]
        GA["Google Ads API v19.1"]
        ZA["Zillow API"]
        RG["RealGeeks API"]
        EL["ElevenLabs Conversational AI 2.0"]
        TW["Twilio Voice API"]
        CA["Claude Agent SDK"]
    end

    subgraph platform["Next Level Real Estate Platform"]
        subgraph api["API & Gateway Layer"]
            GW["API Gateway<br/>Node.js<br/>Auth, Rate Limit, Route"]
        end

        subgraph services["Microservices"]
            subgraph node["Node.js Services<br/>Real-time Processing"]
                LS["Lead Ingestion<br/>Service"]
                WH["Webhook<br/>Processor"]
                CS["Calling<br/>Service"]
            end

            subgraph dotnet[".NET Core Services<br/>Business Logic"]
                QS["Qualification<br/>Service"]
                AS["Analytics<br/>Service"]
                BS["Business<br/>Service"]
            end
        end

        subgraph data["Data Layer"]
            MongoDB["MongoDB<br/>Lead/Campaign/Call Data"]
            Redis["Redis<br/>Cache Layer"]
        end

        subgraph agents["Claude Agents"]
            AA["Architecture<br/>Agent"]
            CA_Agent["Conversation AI<br/>Agent"]
            SA["Sales & Marketing<br/>Agent"]
            RA["Realty Expert<br/>Agent"]
        end

        subgraph kb["Knowledge Systems"]
            VectorDB["Vector DB<br/>Qdrant<br/>RAG Knowledge"]
            KB["Knowledge<br/>Base<br/>Market Intelligence"]
        end

        subgraph messaging["Event Bus"]
            Kafka["Kafka/RabbitMQ<br/>Event Streaming"]
        end

        subgraph observability["Observability"]
            OTel["OpenTelemetry<br/>Collector"]
            SigNoz["SigNoz<br/>Monitoring"]
        end
    end

    GA -->|Webhook| WH
    ZA -->|Webhook| WH
    RG -->|API| WH

    WH -->|Events| Kafka
    LS -->|Events| Kafka
    QS -->|Events| Kafka
    CS -->|Events| Kafka
    AS -->|Events| Kafka

    GW -->|Route| LS
    GW -->|Route| CS
    GW -->|Route| QS
    GW -->|Route| AS

    LS -->|Write| MongoDB
    QS -->|Query/Write| MongoDB
    CS -->|Query| MongoDB
    AS -->|Query| MongoDB

    MongoDB -->|Cache| Redis
    Redis -->|Read| CS
    Redis -->|Read| QS

    Kafka -->|Subscribe| QS
    Kafka -->|Subscribe| CS
    Kafka -->|Subscribe| AS

    AA -->|API| CA
    CA_Agent -->|API| CA
    SA -->|API| CA
    RA -->|API| CA

    AA -->|Query/Update| VectorDB
    CA_Agent -->|Query/Update| VectorDB
    SA -->|Query/Update| VectorDB
    RA -->|Query/Update| VectorDB

    CS -->|Route Call| TW
    TW -->|WebSocket| EL
    EL -->|Context| CS

    AS -->|Query| MongoDB
    AS -->|Emit Metrics| OTel

    CS -->|Trace| OTel
    LS -->|Trace| OTel
    OTel -->|Visualize| SigNoz

    style external fill:#ff9999
    style api fill:#99ccff
    style node fill:#99ff99
    style dotnet fill:#cc99ff
    style data fill:#ffcc99
    style agents fill:#ff99cc
    style kb fill:#99ffcc
    style messaging fill:#ffffcc
    style observability fill:#ccffff
```

**Key Design Decisions**:
- API Gateway in Node.js for real-time routing and WebSocket support
- Node.js microservices for real-time operations (calling, webhooks)
- .NET Core for complex business logic with strong typing
- MongoDB for flexible schema with aggregation pipelines
- Kafka for event-driven decoupling between services
- Four specialized Claude agents with shared knowledge bases
- Qdrant vector database for RAG-powered context retrieval
- OpenTelemetry for distributed tracing across polyglot services

---

## 2. Lead Processing Flow

Real-time flow from lead creation through qualification and calling.

```mermaid
graph LR
    subgraph sources["Lead Sources"]
        GA["Google Ads"]
        ZA["Zillow"]
        RG["RealGeeks"]
    end

    subgraph ingestion["Ingestion"]
        WH["Webhook<br/>Handler"]
        DF["Duplicate<br/>Filter"]
    end

    subgraph enrichment["Enrichment"]
        EC["Context<br/>Manager"]
        TCPA["TCPA<br/>Checker<br/>5-min Rule"]
    end

    subgraph qualification["Qualification"]
        QE["Qualification<br/>Engine<br/>AI Scoring"]
    end

    subgraph assignment["Assignment"]
        CM["Campaign<br/>Matcher"]
        RA["Route to<br/>Agent"]
    end

    subgraph calling["Calling"]
        EL["ElevenLabs<br/>Conversation"]
        TW["Twilio<br/>Outbound"]
        SA["Sentiment<br/>Analysis"]
    end

    subgraph feedback["Feedback"]
        TR["Transcript<br/>Analysis"]
        KU["Knowledge<br/>Base<br/>Update"]
    end

    GA -->|Event| WH
    ZA -->|Event| WH
    RG -->|Event| WH

    WH -->|Deduplicate| DF
    DF -->|New Lead| EC

    EC -->|Enrich| TCPA
    TCPA -->|Check Consent<br/>& DNC| QE

    QE -->|Score| CM
    CM -->|Select Campaign| RA
    RA -->|Dispatch| TW

    TW -->|Call| EL
    EL -->|Conversation| TW
    TW -->|Monitor| SA

    TW -->|On Complete| TR
    TR -->|Extract Patterns| KU
    KU -->|Update Vector DB| EC

    style sources fill:#ff9999
    style ingestion fill:#ffcccc
    style enrichment fill:#ffddaa
    style qualification fill:#ffffcc
    style assignment fill:#ddffaa
    style calling fill:#aaffaa
    style feedback fill:#aaffdd
```

**Critical Timing**:
- Webhook to first context assembly: <500ms
- First contact within: <5 minutes (Harvard research: 21x qualification increase)
- Call initiation to ElevenLabs start: <1 second

**TCPA Compliance Checkpoints**:
1. Verify written consent in database
2. Check national Do-Not-Call registry
3. Verify property owner (not representative)
4. Log all contact attempts with timestamp and method

---

## 3. Multi-Agent Workflow Architecture

Four specialized Claude agents collaborating with shared knowledge.

```mermaid
graph TB
    subgraph input["Information Sources"]
        AI["AI Research<br/>Arxiv, Papers"]
        MR["Market<br/>Research"]
        CT["Call<br/>Transcripts"]
        PM["Performance<br/>Metrics"]
    end

    subgraph agents["Specialized Claude Agents"]
        subgraph arch["Architecture Agent"]
            AA_IN["Inputs"]
            AA_PROC["Process:<br/>Research trends<br/>Design systems<br/>Optimize tech"]
            AA_OUT["Outputs"]
        end

        subgraph conv["Conversation AI Agent"]
            CA_IN["Inputs"]
            CA_PROC["Process:<br/>Analyze calls<br/>Extract patterns<br/>Optimize flows"]
            CA_OUT["Outputs"]
        end

        subgraph sales["Sales & Marketing Agent"]
            SA_IN["Inputs"]
            SA_PROC["Process:<br/>Market analysis<br/>ROI tracking<br/>Strategy ops"]
            SA_OUT["Outputs"]
        end

        subgraph realty["Realty Expert Agent"]
            RA_IN["Inputs"]
            RA_PROC["Process:<br/>Property analysis<br/>Compliance check<br/>Market intel"]
            RA_OUT["Outputs"]
        end
    end

    subgraph rag["Shared Knowledge Systems"]
        VDB["Vector DB<br/>Qdrant<br/>RAG Retrieval"]
        Cache["Prompt Cache<br/>Static & Semi-Static<br/>90% Cost Savings"]
    end

    subgraph feedback["Feedback Loops"]
        CO["Campaign<br/>Outcomes"]
        KU["Knowledge<br/>Updates"]
        IM["Improvement<br/>Metrics"]
    end

    AI -->|Research| AA_IN
    MR -->|Data| SA_IN
    CT -->|Transcripts| CA_IN
    PM -->|Metrics| RA_IN

    AA_IN -->|Query RAG| VDB
    CA_IN -->|Query RAG| VDB
    SA_IN -->|Query RAG| VDB
    RA_IN -->|Query RAG| VDB

    VDB -->|Context| AA_PROC
    VDB -->|Context| CA_PROC
    VDB -->|Context| SA_PROC
    VDB -->|Context| RA_PROC

    AA_PROC -->|Decisions| AA_OUT
    CA_PROC -->|Optimizations| CA_OUT
    SA_PROC -->|Strategies| SA_OUT
    RA_PROC -->|Guidance| RA_OUT

    AA_OUT -->|Share insights| VDB
    CA_OUT -->|Share patterns| VDB
    SA_OUT -->|Share tactics| VDB
    RA_OUT -->|Share rules| VDB

    AA_OUT -->|Feed| Cache
    CA_OUT -->|Feed| Cache
    SA_OUT -->|Feed| Cache
    RA_OUT -->|Feed| Cache

    CO -->|Analyze| KU
    KU -->|Embed & Store| VDB
    VDB -->|Metrics| IM

    style arch fill:#ff99cc
    style conv fill:#99ccff
    style sales fill:#ffcc99
    style realty fill:#99ff99
    style rag fill:#ffff99
    style feedback fill:#cc99ff
```

**Agent Collaboration Patterns**:
1. **Parallel Processing**: All 4 agents process independently
2. **Shared Knowledge**: All read from same RAG vector database
3. **Async Updates**: Agents update knowledge asynchronously
4. **Cross-Validation**: Agent A's output reviewed by relevant Agent B
5. **Prompt Caching**: Shared system prompts reduce cost 90%

---

## 4. AI Calling System Sequence

Detailed sequence diagram for the calling flow with parallel context assembly.

```mermaid
sequenceDiagram
    participant Lead as Lead<br/>Phone
    participant Twilio as Twilio<br/>Voice
    participant Context as Context<br/>Manager
    participant EL as ElevenLabs<br/>AI
    participant Sentiment as Sentiment<br/>Analysis
    participant Transcription as Transcription<br/>Service
    participant KB as Knowledge<br/>Base Update

    Lead ->> Twilio: Answers call

    par Context Assembly (300ms target)
        Twilio ->> Context: Fetch lead data
        Context -->> Twilio: Name, history, consent
    and
        Twilio ->> Context: Fetch property info
        Context -->> Twilio: Address, ARV, comparables
    and
        Twilio ->> Context: Get strategy rules (cached!)
        Context -->> Twilio: Qualification criteria
    and
        Twilio ->> Context: Get talking points (cached!)
        Context -->> Twilio: Openers, objection handlers
    end

    Twilio ->> EL: Initialize with context

    loop Real-time Conversation (75ms per turn)
        EL ->> EL: Process speech
        EL ->> Sentiment: Analyze emotion
        Sentiment -->> EL: Sentiment score
        EL ->> Lead: Speak response
        Lead -->> EL: Next utterance
    end

    Lead ->> Twilio: Call ends

    Twilio ->> Transcription: Send recording
    Transcription ->> Transcription: Generate transcript
    Transcription ->> Sentiment: Full call sentiment
    Sentiment -->> Transcription: Overall mood, key moments

    Transcription ->> KB: Extract patterns
    KB ->> KB: Embed new insights
    KB ->> KB: Update vector database

    KB ->> Context: Knowledge updated
    Context ->> Context: Next call uses new knowledge

    style Lead fill:#ff9999
    style Twilio fill:#99ccff
    style Context fill:#ffcc99
    style EL fill:#99ff99
    style Sentiment fill:#ffff99
    style Transcription fill:#cc99ff
    style KB fill:#99ffcc
```

**Timing Details**:
- Lead answers: 0ms
- Context assembly (parallel): 300ms
- ElevenLabs ready: 300ms
- First agent response: 375ms (75ms model latency)
- Sentiment analysis: Real-time, <50ms per update
- Call completion to KB update: <5 seconds
- Next call benefits from learnings: Immediate

---

## 5. Knowledge Base & RAG Architecture

Complete pipeline for document processing, embedding, retrieval, and continuous learning.

```mermaid
graph TB
    subgraph input["Document Sources"]
        HR["Human Research<br/>& Expertise"]
        CR["Call Results<br/>Feedback"]
        MR["Market<br/>Intelligence"]
        AR["AI Research<br/>Papers"]
    end

    subgraph processing["Processing Pipeline"]
        Clean["Clean &<br/>Format"]
        Chunk["Chunk<br/>500-1K tokens"]
        Embed["Generate<br/>Embeddings<br/>text-embedding-3-large"]
        Meta["Extract<br/>Metadata"]
    end

    subgraph storage["Storage & Indexing"]
        VDB["Qdrant<br/>Vector Database"]
        KB["Knowledge<br/>Base Metadata"]
        VER["Version<br/>Control<br/>& History"]
    end

    subgraph retrieval["Retrieval"]
        QUERY["Query<br/>Augmentation"]
        SEARCH["Hybrid Search<br/>Keyword + Vector"]
        RANK["Rank &<br/>Filter"]
    end

    subgraph generation["Generation"]
        CONTEXT["Format for<br/>Claude"]
        CLAUDE["Claude<br/>Response"]
    end

    subgraph feedback["Feedback Loop"]
        OUTCOME["Outcome<br/>Tracking"]
        SUCCESS["Success<br/>Rate"]
        UPDATE["Knowledge<br/>Update<br/>Decision"]
    end

    HR -->|Document| Clean
    CR -->|Transcripts| Clean
    MR -->|Data| Clean
    AR -->|Research| Clean

    Clean -->|Text| Chunk
    Chunk -->|Chunks| Embed
    Embed -->|Vectors| Meta

    Meta -->|Vector + Meta| VDB
    Meta -->|Index| KB
    Meta -->|Timestamp| VER

    QUERY -->|Expanded Query| SEARCH
    SEARCH -->|Keyword + Vector| RANK
    RANK -->|Top-K Results| CONTEXT

    CONTEXT -->|Formatted Context| CLAUDE
    CLAUDE -->|Response| OUTCOME

    OUTCOME -->|Result| SUCCESS
    SUCCESS -->|Decision: Update?| UPDATE

    UPDATE -->|Yes| Embed
    UPDATE -->|No| RANK

    style input fill:#ff9999
    style processing fill:#ffcccc
    style storage fill:#ffddaa
    style retrieval fill:#ffffcc
    style generation fill:#ddffaa
    style feedback fill:#aaffaa
```

**Knowledge Base Features**:
- **Per-Agent Collections**: Architect, Conversation, Sales, Realty
- **Versioning**: Track all changes with timestamps
- **Metadata Filtering**: Source, date, category, success rate
- **Hybrid Search**: Keyword match + semantic similarity
- **Continuous Updates**: Feedback loops train on real outcomes
- **Quality Metrics**: Success rate tracking per knowledge item

---

## 6. Context Management Flow

Multi-tier context architecture showing caching strategy and cost optimization.

```mermaid
graph TB
    subgraph tier1["Tier 1: Static Cached<br/>1-hour TTL<br/>90% Cost Savings"]
        SP["System Prompts"]
        CR["Compliance Rules"]
        SF["Strategy Frameworks"]
    end

    subgraph tier2["Tier 2: Semi-Static Cached<br/>5-min TTL<br/>75% Cost Savings"]
        MI["Market Intelligence"]
        BP["Best Practices"]
        CO["Conversation Openers"]
    end

    subgraph tier3["Tier 3: Session Context<br/>No Caching<br/>Ephemeral"]
        AS["Agent State"]
        CM["Conversation Memory"]
        UP["User Preferences"]
    end

    subgraph tier4["Tier 4: Real-Time Streaming<br/>No Caching<br/>Latest Data"]
        LD["Lead Data"]
        SENT["Sentiment Analysis"]
        MD["Market Data"]
    end

    subgraph cache["Caching Infrastructure"]
        PC["Prompt Cache<br/>Claude API<br/>Cache Writes: 25% more<br/>Cache Reads: 10% cost"]
        REDIS["Redis<br/>Hot Data Cache"]
        VDB["Vector DB<br/>Knowledge Cache"]
    end

    subgraph usage["Usage Pattern"]
        REQ["Request"]
        CHECK["Check Cache"]
        HIT["Cache Hit"]
        MISS["Cache Miss"]
        WRITE["Cache Write"]
    end

    subgraph metrics["Cost Impact"]
        BASELINE["Baseline: $1,200/day<br/>1K calls × 2K tokens"]
        OPTIMIZED["Optimized: $210/day<br/>82.5% savings"]
        BATCH["Batch Mode: $60/day<br/>95% savings"]
    end

    SP -->|Write Once| PC
    CR -->|Write Once| PC
    SF -->|Write Once| PC

    MI -->|Update Daily| REDIS
    BP -->|Update Daily| REDIS
    CO -->|Update Daily| REDIS

    LD -->|Per Call| REDIS
    SENT -->|Real-time| REDIS
    MD -->|Tick-level| REDIS

    PC -->|Serve Cache Tier 1| CACHE
    REDIS -->|Serve Cache Tier 2| CACHE
    VDB -->|Serve Knowledge| CACHE

    REQ -->|Query| CHECK
    CHECK -->|Hit?| HIT
    CHECK -->|Miss| MISS
    MISS -->|Fetch| WRITE
    WRITE -->|Cache| HIT

    HIT -->|10% cost| BASELINE
    MISS -->|100% cost| BASELINE

    style tier1 fill:#99ff99
    style tier2 fill:#ffff99
    style tier3 fill:#ffcc99
    style tier4 fill:#ff9999
    style cache fill:#99ccff
    style usage fill:#cc99ff
    style metrics fill:#99ffcc
```

**Cost Optimization Strategy**:
- **Tier 1** (Static): Cache system prompts → 90% savings on those tokens
- **Tier 2** (Market Data): Cache daily updates → 75% savings
- **Batch Processing**: Group 1000 calls in 1-hour window → 95% savings
- **Annual Impact**: ~$365K/year cost reduction with 1000 calls/day

---

## 7. Event-Driven Architecture

Event bus design with multiple event types and service consumers.

```mermaid
graph TB
    subgraph sources["Event Sources"]
        LS["Lead<br/>Service"]
        QS["Qualification<br/>Service"]
        CS["Calling<br/>Service"]
        AS["Analytics<br/>Service"]
    end

    subgraph bus["Event Bus"]
        KB["Kafka Broker<br/>or<br/>RabbitMQ"]
    end

    subgraph events["Event Types"]
        LE["LeadReceived<br/>{leadId, source, timestamp}"]
        LQ["LeadQualified<br/>{leadId, score, campaign}"]
        CI["CallInitiated<br/>{leadId, callId, timestamp}"]
        CC["CallCompleted<br/>{callId, duration, sentiment}"]
        CA["ConversationAnalyzed<br/>{callId, patterns, feedback}"]
        KU["KnowledgeUpdated<br/>{type, version, timestamp}"]
        CU["CampaignUpdated<br/>{campaignId, newRules}"]
    end

    subgraph consumers["Service Consumers"]
        C1["Lead Service:<br/>Update lead status<br/>Cache invalidation"]
        C2["Qualification Service:<br/>Score updates<br/>Model retraining"]
        C3["Calling Service:<br/>Campaign rules<br/>Context updates"]
        C4["Analytics Service:<br/>Metrics aggregation<br/>Reporting"]
        C5["Agent Service:<br/>Knowledge updates<br/>Performance metrics"]
    end

    subgraph dlq["Error Handling"]
        DLQ["Dead Letter Queue<br/>Retry logic<br/>Error logging"]
        ALERT["Alerting<br/>on DLQ depth"]
    end

    LS -->|Emit| LE
    QS -->|Emit| LQ
    CS -->|Emit| CI
    CS -->|Emit| CC
    AS -->|Emit| CA
    AS -->|Emit| KU
    QS -->|Emit| CU

    LE -->|Publish| KB
    LQ -->|Publish| KB
    CI -->|Publish| KB
    CC -->|Publish| KB
    CA -->|Publish| KB
    KU -->|Publish| KB
    CU -->|Publish| KB

    KB -->|Subscribe| C1
    KB -->|Subscribe| C2
    KB -->|Subscribe| C3
    KB -->|Subscribe| C4
    KB -->|Subscribe| C5

    C1 -->|Error| DLQ
    C2 -->|Error| DLQ
    C3 -->|Error| DLQ
    C4 -->|Error| DLQ
    C5 -->|Error| DLQ

    DLQ -->|Monitor| ALERT

    style sources fill:#ff9999
    style bus fill:#ffff99
    style events fill:#ffcc99
    style consumers fill:#99ff99
    style dlq fill:#ff99cc
```

**Event Guarantees**:
- **Exactly-Once Semantics**: Idempotent processing
- **Ordering**: Events ordered per lead ID
- **Retention**: 7-day event history for replay
- **Dead Letter Queue**: Failed messages for manual review
- **Latency**: <1 second from emission to consumer processing

---

## 8. Microservices Communication & Observability

Service-to-service patterns with distributed tracing and resilience.

```mermaid
graph TB
    subgraph clients["Clients"]
        MOBILE["Mobile App"]
        WEB["Web Dashboard"]
        API["External API"]
    end

    subgraph gateway["API Gateway"]
        GW["Load Balancer<br/>Authentication<br/>Rate Limiting<br/>Logging"]
    end

    subgraph services["Microservices"]
        subgraph service1["Lead Service"]
            LS1["Endpoint 1: POST /leads"]
            LS2["Endpoint 2: GET /leads/:id"]
        end

        subgraph service2["Calling Service"]
            CS1["Endpoint 1: POST /calls"]
            CS2["Endpoint 2: GET /calls/:id/transcript"]
        end

        subgraph service3["Analytics Service"]
            AS1["Endpoint 1: GET /metrics"]
            AS2["Endpoint 2: POST /events"]
        end
    end

    subgraph communication["Communication Patterns"]
        REST["REST/HTTP<br/>Synchronous<br/>Request-Response"]
        GRPC["gRPC<br/>Low-Latency<br/>Streaming"]
        EVENT["Events<br/>Asynchronous<br/>Eventual Consistency"]
        WS["WebSocket<br/>Real-time<br/>Bidirectional"]
    end

    subgraph resilience["Resilience Patterns"]
        CB["Circuit Breaker<br/>Fail fast on errors"]
        RT["Retry Logic<br/>Exponential backoff<br/>Max 3 attempts"]
        TM["Timeout<br/>Default: 5 seconds"]
    end

    subgraph tracing["Distributed Tracing"]
        OTel["OpenTelemetry<br/>SDK in each service"]
        TRACE["Trace Context<br/>Propagated across<br/>service calls"]
        SG["SigNoz<br/>Trace visualization<br/>& analysis"]
    end

    subgraph metrics["Monitoring"]
        MET["Metrics<br/>Request latency<br/>Error rate<br/>Queue depth"]
        LOG["Logging<br/>Request/response<br/>Error details<br/>Debug info"]
        ALERT["Alerting<br/>Latency >1s<br/>Error rate >0.1%<br/>DLQ depth"]
    end

    MOBILE -->|HTTP| GW
    WEB -->|HTTP| GW
    API -->|HTTP| GW

    GW -->|Route| REST
    GW -->|Route| GRPC
    GW -->|Route| WS

    REST -->|HTTP| LS1
    REST -->|HTTP| CS1
    REST -->|HTTP| AS1

    GRPC -->|gRPC| LS2
    GRPC -->|gRPC| CS2

    WS -->|WebSocket| AS2

    LS1 -->|Call| CB
    CS1 -->|Call| RT
    AS1 -->|Call| TM

    CB -->|Trace| OTel
    RT -->|Trace| OTel
    TM -->|Trace| OTel

    OTel -->|Context| TRACE
    TRACE -->|Send| SG

    OTel -->|Emit| MET
    OTel -->|Emit| LOG

    MET -->|Alert| ALERT
    LOG -->|Alert| ALERT

    style clients fill:#ff9999
    style gateway fill:#ffcc99
    style service1 fill:#99ff99
    style service2 fill:#99ff99
    style service3 fill:#99ff99
    style communication fill:#ffff99
    style resilience fill:#cc99ff
    style tracing fill:#99ccff
    style metrics fill:#99ffcc
```

**Service Communication Matrix**:

| Source | Target | Pattern | Latency Target | Use Case |
|--------|--------|---------|-----------------|----------|
| API Gateway | All Services | REST | <100ms | General requests |
| Lead Service | Calling Service | gRPC | <50ms | Real-time routing |
| Calling Service | Analytics | Events | N/A | Async reporting |
| Any Service | Any Service | Circuit Breaker | Fail-fast | Error handling |
| All Services | SigNoz | OpenTelemetry | <100ms | Distributed tracing |

**Observability Key Metrics**:
- P50/P95/P99 latency per endpoint
- Error rate and error types
- Cache hit rate
- Event queue depth
- Agent response time

---

## Implementation Timeline

### 6-Stage Rollout Plan

```mermaid
gantt
    title Next Level Real Estate Implementation Timeline
    dateFormat YYYY-MM-DD

    section Stage 1
    Foundation (Weeks 1-4) :s1, 2025-01-01, 28d
    API Gateway & Services :s1a, 2025-01-01, 14d
    MongoDB & Basic Schema :s1b, 2025-01-08, 14d

    section Stage 2
    Conversation System (Weeks 5-8) :s2, 2025-01-29, 28d
    ElevenLabs Integration :s2a, 2025-01-29, 14d
    Twilio Setup & Calling :s2b, 2025-02-05, 14d

    section Stage 3
    Agentic Intelligence (Weeks 9-16) :s3, 2025-02-26, 56d
    Vector DB & RAG :s3a, 2025-02-26, 28d
    Agent Deployment :s3b, 2025-03-12, 28d

    section Stage 4
    Multi-Source Leads (Weeks 17-20) :s4, 2025-04-23, 28d
    Google Ads Integration :s4a, 2025-04-23, 14d
    Zillow & RealGeeks :s4b, 2025-04-30, 14d

    section Stage 5
    Knowledge Systems (Weeks 21-24) :s5, 2025-05-21, 28d
    Self-Improvement Loops :s5a, 2025-05-21, 14d
    Analytics Dashboard :s5b, 2025-05-28, 14d

    section Stage 6
    Multi-Strategy (Weeks 25+) :s6, 2025-06-18, 28d
    Strategy Framework :s6a, 2025-06-18, 14d
    Additional Strategies :s6b, 2025-07-02, 28d
```

---

## Conclusion

These diagrams provide the architectural blueprint for the Next Level Real Estate platform. Key highlights:

1. **Polyglot Microservices**: Node.js for real-time, .NET Core for logic
2. **Multi-Agent Intelligence**: Four specialized Claude agents with RAG
3. **Event-Driven**: Kafka for loose coupling and scalability
4. **Real-Time Calling**: ElevenLabs + Twilio with dynamic context
5. **Cost Optimization**: Prompt caching reducing costs 90%
6. **Observability**: OpenTelemetry tracing across all services
7. **TCPA Compliance**: Consent tracking integrated at every step

Each diagram supports implementation with specific technology choices based on 2025 best practices.
