# Agent Implementation Guide

## Overview

This guide provides comprehensive implementation details for the four specialized Claude agents that power Next Level Real Estate's AI-driven workflows. Each agent operates continuously, gathering context, making decisions, and updating shared knowledge bases to improve system performance.

## Table of Contents

1. [Four-Agent Architecture](#four-agent-architecture)
2. [Architecture Agent](#architecture-agent)
3. [Conversation AI Agent](#conversation-ai-agent)
4. [Sales & Marketing Agent](#sales--marketing-agent)
5. [Realty Expert Agent](#realty-expert-agent)
6. [Agent Communication](#agent-communication)
7. [Knowledge Base Management](#knowledge-base-management)
8. [Prompt Caching Strategies](#prompt-caching-strategies)
9. [Tool Use and MCP Connectors](#tool-use-and-mcp-connectors)
10. [Self-Improvement Loops](#self-improvement-loops)
11. [Performance Metrics](#performance-metrics)
12. [Code Examples](#code-examples)

## Four-Agent Architecture

### System Design

The Next Level Real Estate platform employs four specialized Claude agents, each with distinct responsibilities:

```
┌─────────────────────────────────────────────────────────────┐
│                   Shared Knowledge Base                     │
│                  (Qdrant Vector Database)                   │
│  ┌──────────────┬──────────────┬──────────────┬──────────┐ │
│  │ architect-   │ conversation-│ market-      │ realty-  │ │
│  │ knowledge    │ patterns     │ intelligence │ domain   │ │
│  └──────────────┴──────────────┴──────────────┴──────────┘ │
└─────────────────────────────────────────────────────────────┘
         ▲              ▲              ▲              ▲
         │              │              │              │
    ┌────┴────┐    ┌────┴────┐    ┌────┴────┐    ┌────┴────┐
    │ Architect│    │Conversation│ │ Sales & │    │ Realty  │
    │  Agent   │    │ AI Agent  │  │Marketing│    │ Expert  │
    │          │    │           │  │  Agent  │    │  Agent  │
    └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘
         │              │              │              │
         └──────────────┴──────────────┴──────────────┘
                         │
                    ┌────▼────┐
                    │  Kafka  │
                    │Event Bus│
                    └─────────┘
```

**Key Principles**:
- Each agent runs independently in its own process
- Agents communicate via Kafka event bus (async, decoupled)
- All agents share access to Qdrant vector database for RAG
- Prompt caching reduces costs by 90% for static context
- Continuous learning loops update knowledge based on outcomes

### Agent Responsibilities

| Agent | Primary Role | Input Sources | Output |
|-------|-------------|---------------|--------|
| Architecture | System design, optimization | Research papers, performance metrics | Architecture decisions, tech recommendations |
| Conversation AI | Call strategy, pattern analysis | Call transcripts, sentiment data | Conversation flows, objection handlers |
| Sales & Marketing | Campaign optimization, market analysis | Lead performance, competitor data | Campaign strategies, market insights |
| Realty Expert | Domain expertise, compliance | Regulations, market reports | Investment criteria, compliance rules |

## Architecture Agent

### Responsibilities

The Architecture Agent researches latest AI innovations, designs system improvements, and makes technical recommendations.

**Core Functions**:
1. Research emerging technologies and best practices
2. Design scalable system architectures
3. Recommend performance optimizations
4. Maintain technical roadmap
5. Evaluate new tools and frameworks

### Implementation

#### Agent Configuration

```javascript
// agents/architect-agent/config.js
module.exports = {
  agentId: 'claude-ai-architect',
  model: 'claude-3-5-sonnet-20250924',
  maxTokens: 8192,

  // System prompt (cached for 90% cost reduction)
  systemPrompt: {
    role: 'system',
    content: `You are the Architecture Agent for Next Level Real Estate.

RESPONSIBILITIES:
- Research latest AI and software engineering innovations
- Design scalable, maintainable system architectures
- Recommend performance optimizations
- Evaluate new technologies and frameworks
- Maintain technical roadmap and decision log

KNOWLEDGE DOMAINS:
- Distributed systems and microservices
- Event-driven architecture
- Real-time processing
- AI/ML infrastructure
- Database design and optimization
- Cloud infrastructure (AWS, Azure, GCP)

DECISION FRAMEWORK:
1. Gather context from multiple sources
2. Analyze trade-offs (performance, cost, complexity)
3. Consult knowledge base for similar decisions
4. Make recommendation with rationale
5. Document decision for future reference
6. Monitor outcome and adjust if needed

CONSTRAINTS:
- Prioritize maintainability over cleverness
- Consider total cost of ownership
- Ensure compliance with TCPA and data privacy regulations
- Design for horizontal scalability`,
    cacheControl: { type: 'ephemeral' }, // Cache this prompt
  },

  // Knowledge base collection
  knowledgeCollection: 'architect-knowledge',

  // Tools available to agent
  tools: [
    {
      name: 'search_research_papers',
      description: 'Search arxiv, ACM, IEEE for research papers',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          yearStart: { type: 'number' },
        },
        required: ['query'],
      },
    },
    {
      name: 'analyze_performance_metrics',
      description: 'Analyze system performance metrics from monitoring',
      inputSchema: {
        type: 'object',
        properties: {
          service: { type: 'string' },
          metricType: { type: 'string', enum: ['latency', 'throughput', 'errors'] },
          timeRange: { type: 'string' },
        },
        required: ['service', 'metricType'],
      },
    },
    {
      name: 'query_knowledge_base',
      description: 'Search architecture knowledge base',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          filters: { type: 'object' },
        },
        required: ['query'],
      },
    },
    {
      name: 'update_knowledge_base',
      description: 'Add new architectural knowledge',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          category: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'content', 'category'],
      },
    },
  ],
};
```

#### Agent Implementation

```javascript
// agents/architect-agent/agent.js
const Anthropic = require('@anthropic-ai/sdk');
const { QdrantClient } = require('@qdrant/js-client-rest');
const kafka = require('../../shared/utils/kafka');
const config = require('./config');

class ArchitectureAgent {
  constructor() {
    this.claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.qdrant = new QdrantClient({
      url: process.env.QDRANT_URL,
    });

    this.conversationHistory = [];
  }

  async start() {
    console.log('Architecture Agent starting...');

    // Subscribe to relevant events
    await this.subscribeToEvents();

    // Start periodic research cycles
    this.startResearchCycle();
  }

  async subscribeToEvents() {
    const consumer = kafka.consumer({ groupId: 'architect-agent' });

    await consumer.subscribe({
      topics: [
        'system-performance-alert',
        'deployment-completed',
        'tech-decision-requested',
      ],
    });

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        const event = JSON.parse(message.value.toString());

        switch (topic) {
          case 'system-performance-alert':
            await this.analyzePerformanceIssue(event);
            break;
          case 'deployment-completed':
            await this.validateDeployment(event);
            break;
          case 'tech-decision-requested':
            await this.makeArchitecturalDecision(event);
            break;
        }
      },
    });
  }

  async makeArchitecturalDecision(request) {
    const { question, context } = request;

    // 1. Query knowledge base for similar decisions
    const relevantKnowledge = await this.queryKnowledgeBase(question);

    // 2. Build context with prompt caching
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `QUESTION:\n${question}\n\nCONTEXT:\n${JSON.stringify(context, null, 2)}`,
          },
          {
            type: 'text',
            text: `RELEVANT KNOWLEDGE:\n${this.formatKnowledge(relevantKnowledge)}`,
            cache_control: { type: 'ephemeral' },
          },
        ],
      },
    ];

    // 3. Get Claude's recommendation
    const response = await this.claude.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      system: [config.systemPrompt],
      messages,
      tools: config.tools,
    });

    // 4. Handle tool use
    let finalResponse = response;
    while (finalResponse.stop_reason === 'tool_use') {
      finalResponse = await this.handleToolUse(finalResponse);
    }

    // 5. Extract decision and rationale
    const decision = this.extractDecision(finalResponse);

    // 6. Log decision
    await this.logDecision(question, decision, context);

    // 7. Update knowledge base
    await this.updateKnowledgeBase(decision);

    return decision;
  }

  async handleToolUse(response) {
    const toolUse = response.content.find(block => block.type === 'tool_use');

    if (!toolUse) return response;

    let toolResult;

    switch (toolUse.name) {
      case 'search_research_papers':
        toolResult = await this.searchResearchPapers(toolUse.input);
        break;
      case 'analyze_performance_metrics':
        toolResult = await this.analyzePerformanceMetrics(toolUse.input);
        break;
      case 'query_knowledge_base':
        toolResult = await this.queryKnowledgeBase(toolUse.input.query, toolUse.input.filters);
        break;
      case 'update_knowledge_base':
        toolResult = await this.updateKnowledgeBase(toolUse.input);
        break;
    }

    // Continue conversation with tool result
    this.conversationHistory.push({
      role: 'assistant',
      content: response.content,
    });

    this.conversationHistory.push({
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(toolResult),
        },
      ],
    });

    const nextResponse = await this.claude.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      system: [config.systemPrompt],
      messages: this.conversationHistory,
      tools: config.tools,
    });

    return nextResponse;
  }

  async queryKnowledgeBase(query, filters = {}) {
    // Generate query embedding
    const embedding = await this.generateEmbedding(query);

    // Search Qdrant
    const results = await this.qdrant.search(config.knowledgeCollection, {
      vector: embedding,
      limit: 5,
      filter: filters,
      with_payload: true,
    });

    return results;
  }

  async updateKnowledgeBase(knowledge) {
    const { title, content, category, tags } = knowledge;

    // Generate embedding
    const embedding = await this.generateEmbedding(content);

    // Create point
    const point = {
      id: `arch-${Date.now()}`,
      vector: embedding,
      payload: {
        documentId: `arch-${Date.now()}`,
        title,
        content,
        category,
        tags: tags || [],
        source: 'architecture-agent',
        createdAt: new Date().toISOString(),
        verified: false,
        confidence: 0.8,
      },
    };

    // Upsert to Qdrant
    await this.qdrant.upsert(config.knowledgeCollection, {
      points: [point],
    });

    console.log(`Knowledge base updated: ${title}`);
  }

  async generateEmbedding(text) {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
      dimensions: 1536,
    });

    return response.data[0].embedding;
  }

  startResearchCycle() {
    // Run daily at 2 AM
    const cron = require('node-cron');

    cron.schedule('0 2 * * *', async () => {
      console.log('Starting daily research cycle...');

      const topics = [
        'event-driven architecture patterns',
        'prompt caching optimization',
        'real-time AI processing',
        'microservices scalability',
      ];

      for (const topic of topics) {
        await this.researchTopic(topic);
      }
    });
  }

  async researchTopic(topic) {
    const papers = await this.searchResearchPapers({ query: topic, yearStart: 2024 });

    for (const paper of papers.slice(0, 3)) {
      const summary = await this.summarizePaper(paper);
      await this.updateKnowledgeBase({
        title: paper.title,
        content: summary,
        category: 'research',
        tags: [topic, 'research-paper', '2025'],
      });
    }
  }

  async searchResearchPapers({ query, yearStart = 2024 }) {
    // Integration with arxiv, Google Scholar, etc.
    // Simplified for example
    return [
      {
        title: 'Efficient Prompt Caching for Large Language Models',
        authors: ['Smith, J.', 'Doe, A.'],
        abstract: 'We present a novel approach to prompt caching...',
        url: 'https://arxiv.org/abs/2024.12345',
        year: 2024,
      },
    ];
  }

  extractDecision(response) {
    const textContent = response.content.find(block => block.type === 'text');

    return {
      recommendation: textContent.text,
      confidence: 0.85,
      timestamp: new Date().toISOString(),
      reasoning: textContent.text,
    };
  }

  async logDecision(question, decision, context) {
    await kafka.producer.send({
      topic: 'architecture-decision',
      messages: [
        {
          value: JSON.stringify({
            question,
            decision,
            context,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });
  }
}

module.exports = ArchitectureAgent;
```

## Conversation AI Agent

### Responsibilities

The Conversation AI Agent analyzes call transcripts, identifies successful patterns, and continuously optimizes conversation strategies.

**Core Functions**:
1. Analyze call transcripts for patterns
2. Extract objection handling techniques
3. Identify sentiment-driven responses
4. Optimize conversation flows via A/B testing
5. Update conversation knowledge base

### Implementation

```javascript
// agents/conversation-agent/agent.js
const Anthropic = require('@anthropic-ai/sdk');
const { QdrantClient } = require('@qdrant/js-client-rest');
const kafka = require('../../shared/utils/kafka');

class ConversationAIAgent {
  constructor() {
    this.claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.qdrant = new QdrantClient({
      url: process.env.QDRANT_URL,
    });

    this.systemPrompt = {
      role: 'system',
      content: `You are the Conversation AI Agent for Next Level Real Estate.

RESPONSIBILITIES:
- Analyze call transcripts to identify successful patterns
- Extract effective objection handling techniques
- Identify sentiment-driven response strategies
- Optimize conversation flows based on outcomes
- Create and update conversation knowledge base

ANALYSIS FRAMEWORK:
1. Extract key moments (objections, commitments, sentiment shifts)
2. Identify what worked and what didn't
3. Generalize patterns for reuse
4. A/B test variations
5. Update knowledge base with learnings

SUCCESS METRICS:
- Conversion rate (interested → scheduled visit)
- Average call duration
- Sentiment score trajectory
- Objection resolution rate

OUTPUT FORMAT:
- Pattern description
- Success rate
- Context/scenario
- Example usage`,
      cacheControl: { type: 'ephemeral' },
    };
  }

  async start() {
    console.log('Conversation AI Agent starting...');
    await this.subscribeToCallEvents();
  }

  async subscribeToCallEvents() {
    const consumer = kafka.consumer({ groupId: 'conversation-agent' });

    await consumer.subscribe({ topics: ['call-completed'] });

    await consumer.run({
      eachMessage: async ({ message }) => {
        const event = JSON.parse(message.value.toString());
        await this.analyzeCall(event);
      },
    });
  }

  async analyzeCall(callEvent) {
    const { callId, transcript, outcome, sentiment, duration } = callEvent;

    // 1. Build analysis prompt
    const analysisPrompt = `Analyze this sales call transcript and extract learnings.

CALL METADATA:
- Duration: ${duration}s
- Outcome: ${outcome}
- Overall Sentiment: ${sentiment.score}

TRANSCRIPT:
${this.formatTranscript(transcript)}

ANALYSIS TASKS:
1. Identify key moments (objections, commitments, sentiment shifts)
2. Extract successful techniques used
3. Identify areas for improvement
4. Suggest reusable patterns
5. Rate overall call quality (0-10)`;

    // 2. Get Claude's analysis with cached system prompt
    const response = await this.claude.messages.create({
      model: 'claude-3-5-sonnet-20250924',
      max_tokens: 4096,
      system: [this.systemPrompt],
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
    });

    const analysis = response.content[0].text;

    // 3. Extract patterns
    const patterns = await this.extractPatterns(analysis, callEvent);

    // 4. Update knowledge base
    for (const pattern of patterns) {
      await this.updateConversationKnowledge(pattern);
    }

    // 5. Emit insights event
    await this.emitInsights(callId, analysis, patterns);
  }

  async extractPatterns(analysis, callEvent) {
    const patterns = [];

    // Use Claude to extract structured patterns
    const extractionPrompt = `From this call analysis, extract reusable conversation patterns.

ANALYSIS:
${analysis}

Extract patterns in this JSON format:
{
  "patterns": [
    {
      "type": "objection-handling" | "opening" | "closing" | "value-proposition",
      "scenario": "description of when to use",
      "technique": "what to say/do",
      "successIndicators": ["list of indicators"],
      "example": "exact quote from transcript"
    }
  ]
}`;

    const response = await this.claude.messages.create({
      model: 'claude-3-haiku-20240307', // Fast model for extraction
      max_tokens: 2048,
      messages: [{ role: 'user', content: extractionPrompt }],
    });

    try {
      const extracted = JSON.parse(response.content[0].text);
      return extracted.patterns.map(p => ({
        ...p,
        callId: callEvent.callId,
        outcome: callEvent.outcome,
        sentimentScore: callEvent.sentiment.score,
        extractedAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Failed to extract patterns:', error);
      return [];
    }
  }

  async updateConversationKnowledge(pattern) {
    const { type, scenario, technique, example } = pattern;

    // Generate embedding
    const embedding = await this.generateEmbedding(
      `${type}: ${scenario}. ${technique}`
    );

    // Create point
    const point = {
      id: `conv-${Date.now()}-${Math.random()}`,
      vector: embedding,
      payload: {
        documentId: `conv-${Date.now()}`,
        title: `${type}: ${scenario}`,
        content: technique,
        patternType: type,
        scenario,
        example,
        source: 'conversation-agent',
        callId: pattern.callId,
        outcome: pattern.outcome,
        sentimentScore: pattern.sentimentScore,
        usageCount: 0,
        successRate: pattern.outcome === 'interested' ? 1.0 : 0.0,
        createdAt: new Date().toISOString(),
        verified: false,
        confidence: 0.7,
      },
    };

    // Upsert to Qdrant
    await this.qdrant.upsert('conversation-patterns', {
      points: [point],
    });

    console.log(`Conversation pattern added: ${type} - ${scenario}`);
  }

  formatTranscript(transcript) {
    return transcript
      .map(turn => `[${turn.timestamp}s] ${turn.speaker}: ${turn.text}`)
      .join('\n');
  }

  async generateEmbedding(text) {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
      dimensions: 1536,
    });

    return response.data[0].embedding;
  }

  async emitInsights(callId, analysis, patterns) {
    await kafka.producer.send({
      topic: 'conversation-insights',
      messages: [
        {
          value: JSON.stringify({
            callId,
            analysis,
            patternsExtracted: patterns.length,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });
  }
}

module.exports = ConversationAIAgent;
```

## Sales & Marketing Agent

### Responsibilities

The Sales & Marketing Agent conducts market research, optimizes campaigns, and tracks ROI across all lead sources.

**Core Functions**:
1. Analyze market trends and competitor tactics
2. Optimize campaign performance (CTR, conversion, cost/lead)
3. Track ROI by lead source and geography
4. Recommend budget allocation
5. Update market intelligence knowledge base

### Implementation

```javascript
// agents/sales-agent/agent.js
class SalesMarketingAgent {
  constructor() {
    this.claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.qdrant = new QdrantClient({
      url: process.env.QDRANT_URL,
    });

    this.systemPrompt = {
      role: 'system',
      content: `You are the Sales & Marketing Agent for Next Level Real Estate.

RESPONSIBILITIES:
- Analyze market trends by geography and property type
- Track campaign performance across lead sources
- Recommend budget allocation and bidding strategies
- Identify competitor tactics and opportunities
- Optimize conversion funnels

ANALYSIS FRAMEWORK:
1. Gather performance data (CTR, CPC, conversion rate, ROI)
2. Identify trends and anomalies
3. Compare to historical baselines
4. Recommend optimizations
5. A/B test changes
6. Update market intelligence

KEY METRICS:
- Cost per lead (CPL)
- Lead-to-qualified conversion rate
- Qualified-to-close conversion rate
- Return on ad spend (ROAS)
- Customer acquisition cost (CAC)

OPTIMIZATION PRIORITIES:
1. Reduce CPL without sacrificing quality
2. Improve conversion rates at each funnel stage
3. Maximize ROAS
4. Identify high-value market segments`,
      cacheControl: { type: 'ephemeral' },
    };
  }

  async start() {
    console.log('Sales & Marketing Agent starting...');

    // Subscribe to campaign events
    await this.subscribeToCampaignEvents();

    // Start daily market analysis
    this.startMarketAnalysisCycle();
  }

  async subscribeToCampaignEvents() {
    const consumer = kafka.consumer({ groupId: 'sales-agent' });

    await consumer.subscribe({
      topics: ['lead-qualified', 'campaign-performance-daily'],
    });

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        const event = JSON.parse(message.value.toString());

        if (topic === 'lead-qualified') {
          await this.trackLeadConversion(event);
        } else if (topic === 'campaign-performance-daily') {
          await this.analyzeCampaignPerformance(event);
        }
      },
    });
  }

  async analyzeCampaignPerformance(performanceData) {
    const { campaignId, metrics, dateRange } = performanceData;

    // 1. Query historical performance
    const historicalData = await this.getHistoricalPerformance(campaignId);

    // 2. Build analysis prompt
    const analysisPrompt = `Analyze this campaign performance and recommend optimizations.

CURRENT PERFORMANCE (${dateRange}):
- Impressions: ${metrics.impressions}
- Clicks: ${metrics.clicks}
- CTR: ${metrics.ctr}%
- Cost: $${metrics.cost}
- Leads: ${metrics.leads}
- CPL: $${metrics.cpl}
- Conversion Rate: ${metrics.conversionRate}%

HISTORICAL BASELINE (30-day avg):
${JSON.stringify(historicalData, null, 2)}

ANALYSIS TASKS:
1. Identify performance trends (improving/declining)
2. Pinpoint bottlenecks in conversion funnel
3. Recommend specific optimizations
4. Suggest A/B tests to run
5. Estimate impact of recommendations`;

    // 3. Get Claude's analysis
    const response = await this.claude.messages.create({
      model: 'claude-3-5-sonnet-20250924',
      max_tokens: 4096,
      system: [this.systemPrompt],
      messages: [{ role: 'user', content: analysisPrompt }],
    });

    const analysis = response.content[0].text;

    // 4. Extract recommendations
    const recommendations = await this.extractRecommendations(analysis);

    // 5. Update market intelligence
    await this.updateMarketIntelligence({
      campaignId,
      analysis,
      recommendations,
      dateRange,
    });

    // 6. Emit optimization event
    await this.emitOptimizationRecommendations(campaignId, recommendations);
  }

  async updateMarketIntelligence(intel) {
    const { campaignId, analysis, recommendations, dateRange } = intel;

    const embedding = await this.generateEmbedding(analysis);

    const point = {
      id: `market-${Date.now()}`,
      vector: embedding,
      payload: {
        documentId: `market-${Date.now()}`,
        title: `Campaign ${campaignId} Analysis - ${dateRange}`,
        content: analysis,
        dataType: 'campaign-analysis',
        campaignId,
        recommendations,
        reportDate: new Date().toISOString(),
        source: 'sales-agent',
        verified: false,
        confidence: 0.85,
      },
    };

    await this.qdrant.upsert('market-intelligence', {
      points: [point],
    });
  }

  startMarketAnalysisCycle() {
    const cron = require('node-cron');

    // Daily at 8 AM
    cron.schedule('0 8 * * *', async () => {
      console.log('Starting daily market analysis...');

      // Analyze each market
      const markets = ['Austin-TX', 'Dallas-TX', 'Houston-TX'];

      for (const market of markets) {
        await this.analyzeMarketTrends(market);
      }
    });
  }

  async analyzeMarketTrends(market) {
    // Fetch market data (MLS, Zillow, etc.)
    const marketData = await this.fetchMarketData(market);

    // Analyze with Claude
    const analysisPrompt = `Analyze real estate market trends for ${market}.

MARKET DATA:
${JSON.stringify(marketData, null, 2)}

Provide:
1. Key trends (price, inventory, DOM, absorption rate)
2. Opportunity assessment for wholesale investors
3. Recommended marketing strategies
4. Forecasted market conditions (next 30 days)`;

    const response = await this.claude.messages.create({
      model: 'claude-3-5-sonnet-20250924',
      max_tokens: 4096,
      system: [this.systemPrompt],
      messages: [{ role: 'user', content: analysisPrompt }],
    });

    // Store in knowledge base
    await this.updateMarketIntelligence({
      market,
      analysis: response.content[0].text,
      data: marketData,
      dateRange: new Date().toISOString().split('T')[0],
    });
  }

  async generateEmbedding(text) {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
      dimensions: 1536,
    });

    return response.data[0].embedding;
  }
}

module.exports = SalesMarketingAgent;
```

## Realty Expert Agent

### Responsibilities

The Realty Expert Agent provides domain expertise in real estate strategies, compliance, and investment analysis.

**Core Functions**:
1. Validate TCPA and RESPA compliance
2. Analyze property investment potential
3. Provide market-specific guidance
4. Maintain compliance rules knowledge base
5. Calculate ARV and repair estimates

### Implementation (.NET)

```csharp
// agents/realty-agent/RealtyExpertAgent.cs
using Anthropic.SDK;
using Qdrant.Client;

public class RealtyExpertAgent
{
    private readonly AnthropicClient _claude;
    private readonly QdrantClient _qdrant;
    private readonly IKafkaProducer _kafka;
    private readonly ILogger<RealtyExpertAgent> _logger;

    private const string SystemPrompt = @"You are the Realty Expert Agent for Next Level Real Estate.

RESPONSIBILITIES:
- Ensure TCPA, RESPA, and Fair Housing compliance
- Analyze property investment potential
- Calculate ARV (After-Repair Value)
- Estimate repair costs
- Assess market conditions
- Provide domain expertise on wholesale, fix-flip, and rental strategies

COMPLIANCE FOCUS:
- TCPA 2025: One-to-one written consent, DNC registry checks
- RESPA: Kickback and referral fee restrictions
- Fair Housing: No discriminatory practices
- State-specific regulations

ANALYSIS FRAMEWORK:
1. Property valuation (comparables, condition, location)
2. Equity calculation (value - mortgage - repair costs)
3. Investment strategy recommendation
4. Risk assessment
5. Exit strategy evaluation

WHOLESALE CRITERIA:
- Minimum 20% equity after repairs
- Motivated seller (timeline, condition, situation)
- Property suitable for rehab
- Strong buyer demand in area";

    public RealtyExpertAgent(
        AnthropicClient claude,
        QdrantClient qdrant,
        IKafkaProducer kafka,
        ILogger<RealtyExpertAgent> logger)
    {
        _claude = claude;
        _qdrant = qdrant;
        _kafka = kafka;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Realty Expert Agent starting...");

        // Subscribe to events
        await SubscribeToPropertyEventsAsync(cancellationToken);
    }

    private async Task SubscribeToPropertyEventsAsync(CancellationToken cancellationToken)
    {
        var consumer = _kafka.CreateConsumer("realty-agent");

        await consumer.SubscribeAsync(new[] { "property-evaluation-requested" });

        await consumer.ConsumeAsync(async (message) =>
        {
            var propertyEvent = JsonSerializer.Deserialize<PropertyEvent>(message.Value);
            await EvaluatePropertyAsync(propertyEvent);
        }, cancellationToken);
    }

    public async Task<PropertyEvaluation> EvaluatePropertyAsync(PropertyEvent propertyEvent)
    {
        var property = propertyEvent.Property;

        // 1. Query knowledge base for comparables and market data
        var marketData = await QueryMarketDataAsync(property.City, property.State);

        // 2. Build evaluation prompt
        var evaluationPrompt = $@"Evaluate this property for wholesale investment potential.

PROPERTY DETAILS:
- Address: {property.Address}, {property.City}, {property.State} {property.ZipCode}
- Type: {property.PropertyType}
- Bedrooms: {property.Bedrooms}, Bathrooms: {property.Bathrooms}
- Square Feet: {property.SquareFeet}
- Year Built: {property.YearBuilt}
- Condition: {property.Condition}

FINANCIAL:
- Estimated Value: ${property.EstimatedValue:N0}
- Mortgage Balance: ${property.MortgageBalance:N0}

SELLER CONTEXT:
- Motivation: {propertyEvent.SellerMotivation}
- Timeline: {propertyEvent.Timeline}

MARKET DATA:
{JsonSerializer.Serialize(marketData, new JsonSerializerOptions { WriteIndented = true })}

ANALYSIS REQUIRED:
1. Calculate ARV (After-Repair Value)
2. Estimate repair costs
3. Calculate equity percentage
4. Assess wholesale investment potential (score 0-10)
5. Identify risks and opportunities
6. Recommend offer range
7. Suggest conversation strategy for seller";

        // 3. Get Claude's analysis
        var response = await _claude.Messages.CreateAsync(new MessageRequest
        {
            Model = "claude-3-5-sonnet-20250924",
            MaxTokens = 4096,
            System = new[]
            {
                new SystemMessage
                {
                    Text = SystemPrompt,
                    CacheControl = new CacheControl { Type = "ephemeral" }
                }
            },
            Messages = new[]
            {
                new Message
                {
                    Role = "user",
                    Content = evaluationPrompt
                }
            }
        });

        var analysis = response.Content.OfType<TextContent>().First().Text;

        // 4. Extract structured evaluation
        var evaluation = await ExtractEvaluationAsync(analysis, property);

        // 5. Update knowledge base
        await UpdateRealtyKnowledgeAsync(evaluation);

        // 6. Emit evaluation result
        await EmitEvaluationAsync(propertyEvent.PropertyId, evaluation);

        return evaluation;
    }

    public async Task<bool> ValidateTCPAComplianceAsync(Lead lead)
    {
        // Query compliance rules from knowledge base
        var complianceRules = await _qdrant.SearchAsync(
            collectionName: "realty-domain",
            vector: await GenerateEmbeddingAsync("TCPA compliance requirements 2025"),
            limit: 5,
            filter: new Filter
            {
                Must = new[]
                {
                    new Condition
                    {
                        Key = "knowledgeType",
                        Match = new Match { Value = "compliance-rule" }
                    },
                    new Condition
                    {
                        Key = "lawType",
                        Match = new Match { Value = "TCPA" }
                    }
                }
            }
        );

        // Build compliance check prompt
        var checkPrompt = $@"Verify TCPA compliance for this lead.

LEAD DATA:
{JsonSerializer.Serialize(lead, new JsonSerializerOptions { WriteIndented = true })}

COMPLIANCE RULES:
{FormatComplianceRules(complianceRules)}

CHECK:
1. Written consent present and valid?
2. Consent not expired?
3. Not on National DNC Registry?
4. Not on internal DNC list?
5. Automated calls permitted?

Return JSON:
{{
  ""compliant"": true/false,
  ""violations"": [""list of violations""],
  ""recommendation"": ""action to take""
}}";

        var response = await _claude.Messages.CreateAsync(new MessageRequest
        {
            Model = "claude-3-haiku-20240307", // Fast model for compliance
            MaxTokens = 1024,
            Messages = new[] { new Message { Role = "user", Content = checkPrompt } }
        });

        var result = JsonSerializer.Deserialize<ComplianceResult>(
            response.Content.OfType<TextContent>().First().Text
        );

        return result.Compliant;
    }

    private async Task<float[]> GenerateEmbeddingAsync(string text)
    {
        // Use OpenAI embedding service
        var openai = new OpenAIClient(Environment.GetEnvironmentVariable("OPENAI_API_KEY"));

        var response = await openai.Embeddings.CreateAsync(new EmbeddingRequest
        {
            Model = "text-embedding-3-large",
            Input = text,
            Dimensions = 1536
        });

        return response.Data[0].Embedding;
    }

    private async Task UpdateRealtyKnowledgeAsync(PropertyEvaluation evaluation)
    {
        var embedding = await GenerateEmbeddingAsync(
            $"Property evaluation: {evaluation.Address}, {evaluation.City}, {evaluation.State}"
        );

        var point = new PointStruct
        {
            Id = $"realty-{DateTime.UtcNow.Ticks}",
            Vector = embedding,
            Payload = new Dictionary<string, object>
            {
                ["documentId"] = $"realty-{DateTime.UtcNow.Ticks}",
                ["title"] = $"Property Evaluation: {evaluation.Address}",
                ["content"] = evaluation.Analysis,
                ["knowledgeType"] = "property-evaluation",
                ["propertyType"] = evaluation.PropertyType,
                ["city"] = evaluation.City,
                ["state"] = evaluation.State,
                ["investmentScore"] = evaluation.InvestmentScore,
                ["arv"] = evaluation.ARV,
                ["estimatedRepairCost"] = evaluation.EstimatedRepairCost,
                ["equityPercent"] = evaluation.EquityPercent,
                ["source"] = "realty-agent",
                ["createdAt"] = DateTime.UtcNow.ToString("O"),
                ["verified"] = false,
                ["confidence"] = 0.9
            }
        };

        await _qdrant.UpsertAsync(
            collectionName: "realty-domain",
            points: new[] { point },
            wait: true
        );

        _logger.LogInformation($"Realty knowledge updated: {evaluation.Address}");
    }
}

public record PropertyEvaluation(
    string Address,
    string City,
    string State,
    string PropertyType,
    decimal ARV,
    decimal EstimatedRepairCost,
    decimal EquityPercent,
    int InvestmentScore,
    string Analysis,
    List<string> Risks,
    List<string> Opportunities,
    string RecommendedOfferRange
);
```

## Agent Communication

### Kafka Event Bus

```javascript
// shared/utils/kafka.js
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'nlre-agents',
  brokers: process.env.KAFKA_BROKERS.split(','),
});

const producer = kafka.producer();
const admin = kafka.admin();

// Initialize topics
async function initializeTopics() {
  await admin.connect();

  const topics = [
    'architecture-decision',
    'conversation-insights',
    'campaign-optimization',
    'property-evaluation',
    'knowledge-update',
  ];

  for (const topic of topics) {
    await admin.createTopics({
      topics: [{ topic, numPartitions: 3, replicationFactor: 1 }],
    });
  }

  await admin.disconnect();
}

// Emit event
async function emitEvent(topic, event) {
  await producer.send({
    topic,
    messages: [
      {
        key: event.id || Date.now().toString(),
        value: JSON.stringify(event),
        timestamp: Date.now().toString(),
      },
    ],
  });
}

module.exports = {
  kafka,
  producer,
  admin,
  initializeTopics,
  emitEvent,
};
```

## Knowledge Base Management

### Versioning and Updates

```javascript
// shared/utils/knowledge-base.js
class KnowledgeBaseManager {
  constructor(qdrant, collectionName) {
    this.qdrant = qdrant;
    this.collectionName = collectionName;
  }

  async addKnowledge(knowledge) {
    const { title, content, metadata } = knowledge;

    // Generate embedding
    const embedding = await this.generateEmbedding(content);

    // Check for duplicates
    const duplicates = await this.findDuplicates(embedding);

    if (duplicates.length > 0) {
      console.log(`Duplicate knowledge found: ${title}`);
      return await this.mergeKnowledge(knowledge, duplicates[0]);
    }

    // Create new point
    const point = {
      id: `${this.collectionName}-${Date.now()}`,
      vector: embedding,
      payload: {
        ...metadata,
        title,
        content,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    await this.qdrant.upsert(this.collectionName, {
      points: [point],
    });

    return point.id;
  }

  async updateKnowledge(documentId, updates) {
    // Fetch existing
    const existing = await this.qdrant.retrieve(this.collectionName, {
      ids: [documentId],
    });

    if (!existing || existing.length === 0) {
      throw new Error('Document not found');
    }

    const current = existing[0];

    // Merge updates
    const updated = {
      ...current.payload,
      ...updates,
      version: current.payload.version + 1,
      updatedAt: new Date().toISOString(),
    };

    // Re-generate embedding if content changed
    let vector = current.vector;
    if (updates.content) {
      vector = await this.generateEmbedding(updates.content);
    }

    // Upsert
    await this.qdrant.upsert(this.collectionName, {
      points: [
        {
          id: documentId,
          vector,
          payload: updated,
        },
      ],
    });

    console.log(`Knowledge updated: ${documentId} (v${updated.version})`);
  }

  async findDuplicates(embedding, threshold = 0.95) {
    const results = await this.qdrant.search(this.collectionName, {
      vector: embedding,
      limit: 5,
      score_threshold: threshold,
    });

    return results;
  }

  async mergeKnowledge(newKnowledge, existingKnowledge) {
    // Combine knowledge entries
    const merged = {
      content: `${existingKnowledge.payload.content}\n\nADDENDUM:\n${newKnowledge.content}`,
      usageCount: existingKnowledge.payload.usageCount + 1,
    };

    await this.updateKnowledge(existingKnowledge.id, merged);
    return existingKnowledge.id;
  }

  async generateEmbedding(text) {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
      dimensions: 1536,
    });

    return response.data[0].embedding;
  }
}

module.exports = KnowledgeBaseManager;
```

## Prompt Caching Strategies

### Multi-Tier Caching

```javascript
// shared/utils/prompt-cache.js
class PromptCacheManager {
  constructor() {
    this.staticPrompts = new Map(); // Tier 1: Static (1 hour TTL)
    this.semiStaticPrompts = new Map(); // Tier 2: Semi-static (5 min TTL)
  }

  // Tier 1: Static system prompts (90% cost savings)
  getCachedSystemPrompt(agentType) {
    return {
      type: 'text',
      text: this.getSystemPromptForAgent(agentType),
      cache_control: { type: 'ephemeral' },
    };
  }

  // Tier 2: Semi-static context (75% cost savings)
  getCachedMarketData(market, ttl = 300000) {
    const cacheKey = `market-${market}`;

    if (this.semiStaticPrompts.has(cacheKey)) {
      const cached = this.semiStaticPrompts.get(cacheKey);

      if (Date.now() - cached.timestamp < ttl) {
        return {
          type: 'text',
          text: cached.data,
          cache_control: { type: 'ephemeral' },
        };
      }
    }

    // Fetch fresh data
    const marketData = this.fetchMarketData(market);

    this.semiStaticPrompts.set(cacheKey, {
      data: marketData,
      timestamp: Date.now(),
    });

    return {
      type: 'text',
      text: marketData,
      cache_control: { type: 'ephemeral' },
    };
  }

  // Build message with multi-tier caching
  buildCachedMessage(agentType, context, query) {
    return {
      model: 'claude-3-5-sonnet-20250924',
      max_tokens: 4096,
      system: [
        this.getCachedSystemPrompt(agentType), // Tier 1
        this.getCachedMarketData(context.market), // Tier 2
      ],
      messages: [
        {
          role: 'user',
          content: query, // Tier 4: Real-time (no caching)
        },
      ],
    };
  }

  getSystemPromptForAgent(agentType) {
    const prompts = {
      architect: 'You are the Architecture Agent...',
      conversation: 'You are the Conversation AI Agent...',
      sales: 'You are the Sales & Marketing Agent...',
      realty: 'You are the Realty Expert Agent...',
    };

    return prompts[agentType];
  }
}

module.exports = PromptCacheManager;
```

## Tool Use and MCP Connectors

### Custom Tools

```javascript
// agents/shared/tools.js
const tools = {
  // Search research papers
  search_research_papers: async ({ query, yearStart }) => {
    // Integration with arxiv, Google Scholar
    const papers = await arxiv.search({
      query,
      start_year: yearStart,
      max_results: 10,
    });

    return papers;
  },

  // Query vector database
  query_knowledge_base: async ({ collection, query, filters }) => {
    const embedding = await generateEmbedding(query);

    const results = await qdrant.search(collection, {
      vector: embedding,
      limit: 5,
      filter: filters,
    });

    return results;
  },

  // Update knowledge base
  update_knowledge_base: async ({ collection, title, content, metadata }) => {
    const kbManager = new KnowledgeBaseManager(qdrant, collection);

    const id = await kbManager.addKnowledge({
      title,
      content,
      metadata,
    });

    return { success: true, id };
  },

  // Analyze performance metrics
  analyze_performance_metrics: async ({ service, metricType, timeRange }) => {
    const metrics = await prometheus.query({
      query: `rate(${service}_${metricType}[${timeRange}])`,
    });

    return metrics;
  },

  // Fetch market data
  fetch_market_data: async ({ city, state, propertyType }) => {
    const data = await mls.query({
      city,
      state,
      property_type: propertyType,
      date_range: 'last_30_days',
    });

    return data;
  },
};

module.exports = tools;
```

## Self-Improvement Loops

### Feedback Integration

```javascript
// agents/shared/feedback-loop.js
class FeedbackLoop {
  constructor(agent, collectionName) {
    this.agent = agent;
    this.collectionName = collectionName;
  }

  async processOutcome(eventId, outcome, metadata) {
    // 1. Retrieve knowledge used for this event
    const knowledgeUsed = await this.getKnowledgeUsed(eventId);

    // 2. Update success rates
    for (const knowledge of knowledgeUsed) {
      await this.updateSuccessRate(knowledge.id, outcome);
    }

    // 3. If successful, reinforce pattern
    if (outcome === 'success') {
      await this.reinforcePattern(knowledgeUsed);
    }

    // 4. If failed, analyze and adapt
    if (outcome === 'failure') {
      await this.analyzeFailure(eventId, knowledgeUsed, metadata);
    }
  }

  async updateSuccessRate(knowledgeId, outcome) {
    const knowledge = await this.qdrant.retrieve(this.collectionName, {
      ids: [knowledgeId],
    });

    if (!knowledge || knowledge.length === 0) return;

    const current = knowledge[0].payload;
    const usageCount = current.usageCount || 0;
    const successCount = current.successCount || 0;

    const newUsageCount = usageCount + 1;
    const newSuccessCount = outcome === 'success' ? successCount + 1 : successCount;
    const newSuccessRate = newSuccessCount / newUsageCount;

    await this.qdrant.setPayload(this.collectionName, {
      points: [knowledgeId],
      payload: {
        usageCount: newUsageCount,
        successCount: newSuccessCount,
        successRate: newSuccessRate,
        lastUsedAt: new Date().toISOString(),
      },
    });

    console.log(
      `Knowledge ${knowledgeId} updated: ${newSuccessCount}/${newUsageCount} (${(newSuccessRate * 100).toFixed(1)}%)`
    );
  }

  async reinforcePattern(knowledgeUsed) {
    // Increase confidence scores for successful patterns
    for (const knowledge of knowledgeUsed) {
      const currentConfidence = knowledge.payload.confidence || 0.5;
      const newConfidence = Math.min(currentConfidence + 0.05, 1.0);

      await this.qdrant.setPayload(this.collectionName, {
        points: [knowledge.id],
        payload: {
          confidence: newConfidence,
          verified: newConfidence >= 0.9,
        },
      });
    }
  }

  async analyzeFailure(eventId, knowledgeUsed, metadata) {
    // Use Claude to analyze why the approach failed
    const analysisPrompt = `Analyze why this approach failed and suggest improvements.

EVENT: ${eventId}
KNOWLEDGE USED:
${JSON.stringify(knowledgeUsed, null, 2)}

METADATA:
${JSON.stringify(metadata, null, 2)}

Provide:
1. Root cause analysis
2. Suggested improvements
3. Alternative approaches to try`;

    const response = await this.agent.claude.messages.create({
      model: 'claude-3-5-sonnet-20250924',
      max_tokens: 2048,
      messages: [{ role: 'user', content: analysisPrompt }],
    });

    const analysis = response.content[0].text;

    // Store analysis for future reference
    await this.agent.updateKnowledgeBase({
      title: `Failure Analysis: ${eventId}`,
      content: analysis,
      category: 'failure-analysis',
      tags: ['failure', 'analysis', eventId],
    });
  }

  async getKnowledgeUsed(eventId) {
    // Retrieve from event log
    const event = await db.collection('event_log').findOne({ eventId });

    if (!event || !event.knowledgeIds) return [];

    const knowledge = await this.qdrant.retrieve(this.collectionName, {
      ids: event.knowledgeIds,
    });

    return knowledge;
  }
}

module.exports = FeedbackLoop;
```

## Performance Metrics

### Agent Monitoring

```javascript
// agents/shared/metrics.js
class AgentMetrics {
  constructor(agentName) {
    this.agentName = agentName;
    this.metrics = {
      decisionsМаde: 0,
      knowledgeUpdates: 0,
      avgResponseTime: 0,
      successRate: 0,
      cacheHitRate: 0,
    };
  }

  async trackDecision(decisionTime, outcome) {
    this.metrics.decisionsМаde++;

    // Update avg response time
    this.metrics.avgResponseTime =
      (this.metrics.avgResponseTime * (this.metrics.decisionsМаde - 1) + decisionTime) /
      this.metrics.decisionsМаde;

    // Update success rate
    if (outcome === 'success') {
      this.metrics.successRate =
        (this.metrics.successRate * (this.metrics.decisionsМаde - 1) + 1) /
        this.metrics.decisionsМаde;
    } else {
      this.metrics.successRate =
        (this.metrics.successRate * (this.metrics.decisionsМаde - 1)) /
        this.metrics.decisionsМаde;
    }

    // Emit to OpenTelemetry
    await this.emitMetric('agent_decision_time', decisionTime);
    await this.emitMetric('agent_success_rate', this.metrics.successRate);
  }

  async trackKnowledgeUpdate() {
    this.metrics.knowledgeUpdates++;
    await this.emitMetric('agent_knowledge_updates', this.metrics.knowledgeUpdates);
  }

  async trackCacheHit(isHit) {
    const currentHits = this.metrics.cacheHitRate * this.metrics.decisionsМаde;
    const newHits = currentHits + (isHit ? 1 : 0);

    this.metrics.cacheHitRate = newHits / (this.metrics.decisionsМаde + 1);

    await this.emitMetric('agent_cache_hit_rate', this.metrics.cacheHitRate);
  }

  async emitMetric(name, value) {
    // OpenTelemetry metrics
    const { MeterProvider } = require('@opentelemetry/sdk-metrics');

    const meter = new MeterProvider().getMeter(this.agentName);
    const counter = meter.createCounter(name);

    counter.add(value, { agent: this.agentName });
  }

  async getMetrics() {
    return {
      agent: this.agentName,
      ...this.metrics,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = AgentMetrics;
```

## Environment Variables

```bash
# .env (agents)

# Anthropic
ANTHROPIC_API_KEY=sk-ant-your-api-key

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-your-openai-api-key

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=nlre-agents

# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_SERVICE_NAME=nlre-agents

# Agent-specific
AGENT_TYPE=architect|conversation|sales|realty
ENABLE_PROMPT_CACHING=true
KNOWLEDGE_BASE_COLLECTION=architect-knowledge
```

## Resources

- [Claude Agent SDK Documentation](https://docs.claude.com/en/api/agent-sdk/overview)
- [Anthropic Prompt Caching](https://docs.anthropic.com/claude/docs/prompt-caching)
- [Qdrant Vector Database](https://qdrant.tech/documentation/)
- [Kafka Streams](https://kafka.apache.org/documentation/streams/)
- [OpenTelemetry](https://opentelemetry.io/docs/)
