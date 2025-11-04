# Claude Agent SDK Integration

## Overview

The Claude Agent SDK enables building sophisticated AI agents with tool use, prompt caching, streaming responses, and multi-agent coordination. This integration powers four specialized agents (Architect, Conversation, Sales, and Realty) that collaborate to optimize real estate wholesale operations.

## Key Features

- **Tool Use & MCP Connectors**: Function calling for external APIs and custom tools
- **Prompt Caching**: 90% cost reduction, 85% latency reduction with 1-hour TTL
- **Streaming Responses**: Real-time token streaming with context propagation
- **Files API**: Handle documents, images, PDFs for knowledge processing
- **Multi-Agent Coordination**: Agent-to-agent communication patterns
- **Code Execution**: Sandboxed environment for data analysis and automation
- **Web Search Integration**: Real-time market research and trend analysis

## Prerequisites

- Anthropic API key from https://console.anthropic.com
- Node.js 18+ or .NET Core 9
- MongoDB for agent state persistence
- Qdrant (or similar) vector database for RAG knowledge bases
- Kafka or RabbitMQ for agent-to-agent messaging

## Authentication

### Node.js/TypeScript Example

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Verify API access
async function verifyConnection() {
  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20250924',
      max_tokens: 100,
      messages: [{ role: 'user', content: 'Hello' }],
    });

    console.log('Claude API connected successfully');
    return true;
  } catch (error) {
    console.error('Authentication failed:', error.message);
    return false;
  }
}
```

### .NET Example

```csharp
using Anthropic.SDK;

var client = new AnthropicClient(
    Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
);

// Verify connection
var message = await client.Messages.CreateAsync(new MessageRequest
{
    Model = "claude-3-5-sonnet-20250924",
    MaxTokens = 100,
    Messages = new List<Message>
    {
        new() { Role = "user", Content = "Hello" }
    }
});

Console.WriteLine("Claude API connected successfully");
```

## Four Specialized Agents

### 1. Architecture Agent

```typescript
// Architecture Agent: Research and system design
class ArchitectureAgent {
  private client: Anthropic;
  private knowledgeBase: VectorDB;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.knowledgeBase = new QdrantClient({
      url: process.env.QDRANT_URL,
      collection: 'architecture-knowledge',
    });
  }

  async researchLatestPractices(topic: string) {
    // Retrieve relevant knowledge from RAG
    const context = await this.knowledgeBase.search({
      query: topic,
      limit: 10,
    });

    const systemPrompt = `You are an expert AI architect specializing in real-time systems, microservices, and AI integration.

Your responsibilities:
1. Research latest AI innovations and best practices
2. Design system improvements and new features
3. Make technical decision recommendations
4. Maintain technical roadmap
5. Ensure scalability and performance

Current knowledge context:
${context.map(c => c.content).join('\n\n')}

When researching, prioritize:
- Real-time processing capabilities
- Cost optimization strategies
- Scalability patterns
- AI integration best practices
- Security and compliance`;

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20250924',
      max_tokens: 4096,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' }, // Cache system prompt
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Research and provide recommendations for: ${topic}`,
        },
      ],
      tools: [
        {
          name: 'web_search',
          description: 'Search the web for latest information on a topic',
          input_schema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
            },
            required: ['query'],
          },
        },
        {
          name: 'update_knowledge_base',
          description: 'Store new findings in the knowledge base',
          input_schema: {
            type: 'object',
            properties: {
              content: { type: 'string', description: 'Knowledge to store' },
              tags: { type: 'array', items: { type: 'string' } },
            },
            required: ['content'],
          },
        },
      ],
    });

    // Handle tool use
    if (response.stop_reason === 'tool_use') {
      return await this.processToolCalls(response);
    }

    return response.content;
  }

  async processToolCalls(response: any) {
    const toolResults = [];

    for (const block of response.content) {
      if (block.type === 'tool_use') {
        let result;

        switch (block.name) {
          case 'web_search':
            result = await this.performWebSearch(block.input.query);
            break;
          case 'update_knowledge_base':
            result = await this.updateKnowledge(
              block.input.content,
              block.input.tags
            );
            break;
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }
    }

    // Continue conversation with tool results
    const followUp = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20250924',
      max_tokens: 4096,
      messages: [
        { role: 'user', content: 'Research latest AI practices' },
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults },
      ],
    });

    return followUp.content;
  }

  async performWebSearch(query: string) {
    // Implement web search via external API
    const axios = require('axios');

    const response = await axios.get('https://api.search.com/search', {
      params: { q: query },
      headers: { Authorization: `Bearer ${process.env.SEARCH_API_KEY}` },
    });

    return response.data.results;
  }

  async updateKnowledge(content: string, tags: string[]) {
    // Store in vector database
    await this.knowledgeBase.insert({
      content,
      metadata: { tags, timestamp: new Date(), source: 'agent_research' },
    });

    return { success: true, stored: content.length };
  }
}
```

### 2. Conversation AI Agent

```typescript
// Conversation Agent: Optimize calling strategies
class ConversationAgent {
  private client: Anthropic;
  private knowledgeBase: VectorDB;

  async designConversationFlow(leadContext: any, propertyContext: any) {
    // Retrieve successful conversation patterns
    const successfulPatterns = await this.knowledgeBase.search({
      query: `successful conversation patterns for ${leadContext.intent} leads`,
      filter: { success_rate: { $gte: 0.7 } },
      limit: 5,
    });

    const systemPrompt = `You are a conversation design expert specializing in real estate wholesale sales calls.

Your responsibilities:
1. Design and optimize ElevenLabs conversation workflows
2. Manage dynamic context injection for calls
3. Implement self-improvement based on call transcripts
4. Handle conversation strategy refinement
5. A/B test conversation variations

Successful conversation patterns:
${successfulPatterns.map(p => `- ${p.content} (Success rate: ${p.metadata.success_rate})`).join('\n')}

Design principles:
- Start with rapport building
- Ask open-ended questions
- Listen actively and empathetically
- Identify seller motivation
- Address objections with validated techniques
- Close with clear next steps`;

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20250924',
      max_tokens: 4096,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Design a conversation flow for:
Lead: ${JSON.stringify(leadContext)}
Property: ${JSON.stringify(propertyContext)}`,
        },
      ],
      tools: [
        {
          name: 'query_conversation_analytics',
          description: 'Query analytics on past conversation performance',
          input_schema: {
            type: 'object',
            properties: {
              filters: { type: 'object', description: 'Analytics filters' },
            },
            required: ['filters'],
          },
        },
        {
          name: 'retrieve_objection_handlers',
          description: 'Get proven objection handling techniques',
          input_schema: {
            type: 'object',
            properties: {
              objection_type: { type: 'string' },
            },
            required: ['objection_type'],
          },
        },
      ],
    });

    return response.content;
  }

  async analyzeCallTranscript(transcript: any) {
    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20250924',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Analyze this call transcript and extract:
1. What worked well
2. What could be improved
3. Objections raised and how they were handled
4. Overall sentiment progression
5. Key moments (positive and negative)
6. Recommended improvements for future calls

Transcript:
${JSON.stringify(transcript, null, 2)}`,
        },
      ],
    });

    // Extract insights and update knowledge base
    const insights = this.parseAnalysis(response.content);
    await this.updateConversationKnowledge(insights);

    return insights;
  }

  async updateConversationKnowledge(insights: any) {
    // Store successful patterns
    if (insights.successfulTechniques) {
      for (const technique of insights.successfulTechniques) {
        await this.knowledgeBase.insert({
          content: technique.description,
          metadata: {
            type: 'successful_technique',
            context: technique.context,
            success_rate: technique.estimated_success_rate,
            timestamp: new Date(),
          },
        });
      }
    }

    // Update objection handling database
    if (insights.objectionHandling) {
      for (const objection of insights.objectionHandling) {
        await this.knowledgeBase.insert({
          content: objection.handler,
          metadata: {
            type: 'objection_handler',
            objection_type: objection.type,
            effectiveness: objection.effectiveness,
            timestamp: new Date(),
          },
        });
      }
    }
  }
}
```

### 3. Sales & Marketing Agent

```typescript
// Sales Agent: Market research and campaign optimization
class SalesAgent {
  private client: Anthropic;
  private knowledgeBase: VectorDB;

  async conductMarketResearch(region: string, propertyType: string) {
    const historicalData = await this.knowledgeBase.search({
      query: `market trends ${region} ${propertyType}`,
      limit: 20,
    });

    const systemPrompt = `You are a sales and marketing expert specializing in real estate wholesale.

Your responsibilities:
1. Conduct deep market research and trend analysis
2. Optimize campaign strategies and talking points
3. Analyze competitor tactics and industry best practices
4. Maintain and update sales strategy documentation
5. Identify market opportunities

Historical market data:
${historicalData.map(d => d.content).join('\n\n')}

Focus areas:
- Market absorption rates
- Pricing trends by property type
- Seasonal patterns
- Competitor analysis
- Lead source performance
- Campaign ROI optimization`;

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20250924',
      max_tokens: 4096,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Analyze the market for ${propertyType} properties in ${region}. Provide:
1. Current market conditions
2. Pricing trends
3. Supply/demand analysis
4. Recommended wholesale strategies
5. Campaign optimization suggestions`,
        },
      ],
      tools: [
        {
          name: 'fetch_market_data',
          description: 'Retrieve real-time market data from external sources',
          input_schema: {
            type: 'object',
            properties: {
              region: { type: 'string' },
              property_type: { type: 'string' },
              date_range: { type: 'string' },
            },
            required: ['region'],
          },
        },
        {
          name: 'analyze_campaign_performance',
          description: 'Analyze historical campaign performance metrics',
          input_schema: {
            type: 'object',
            properties: {
              campaign_type: { type: 'string' },
              time_period: { type: 'string' },
            },
          },
        },
      ],
    });

    return response.content;
  }

  async optimizeCampaign(campaignData: any) {
    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20250924',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Analyze this campaign and provide optimization recommendations:

Campaign: ${JSON.stringify(campaignData, null, 2)}

Provide:
1. Performance assessment
2. Underperforming areas
3. Specific optimization tactics
4. A/B test recommendations
5. Expected impact of changes`,
        },
      ],
    });

    return response.content;
  }
}
```

### 4. Realty Expert Agent

```typescript
// Realty Agent: Domain expertise and compliance
class RealtyAgent {
  private client: Anthropic;
  private knowledgeBase: VectorDB;

  async evaluateProperty(property: any) {
    const marketComps = await this.knowledgeBase.search({
      query: `comparable properties ${property.city} ${property.state}`,
      filter: {
        bedrooms: property.bedrooms,
        propertyType: property.type,
      },
      limit: 10,
    });

    const systemPrompt = `You are a real estate investment expert specializing in wholesale strategies.

Your responsibilities:
1. Provide domain expertise in buying/selling strategies
2. Analyze market conditions and investment opportunities
3. Ensure regulatory compliance (TCPA, RESPA, Fair Housing)
4. Document best practices per real estate strategy
5. Evaluate property wholesale potential

Market comparables:
${marketComps.map(c => `${c.content} (Sold: $${c.metadata.price})`).join('\n')}

Investment criteria:
- Minimum 20% equity
- Motivated seller indicators
- Property condition suitable for rehab
- Market absorption rate < 90 days
- Clear title and no major liens`;

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20250924',
      max_tokens: 4096,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Evaluate this property for wholesale potential:

Property: ${JSON.stringify(property, null, 2)}

Provide:
1. Wholesale potential score (0-100)
2. Estimated ARV (After Repair Value)
3. Repair cost estimate
4. Profit margin estimate
5. Risk factors
6. Recommendation (pursue/pass)`,
        },
      ],
      tools: [
        {
          name: 'calculate_arv',
          description: 'Calculate After Repair Value based on comparables',
          input_schema: {
            type: 'object',
            properties: {
              property: { type: 'object' },
              comparables: { type: 'array' },
            },
            required: ['property', 'comparables'],
          },
        },
        {
          name: 'estimate_repair_costs',
          description: 'Estimate repair costs based on property condition',
          input_schema: {
            type: 'object',
            properties: {
              property_type: { type: 'string' },
              condition: { type: 'string' },
              square_feet: { type: 'number' },
            },
            required: ['property_type', 'square_feet'],
          },
        },
      ],
    });

    return response.content;
  }

  async checkCompliance(action: string, context: any) {
    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20250924',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Check if this action complies with real estate regulations:

Action: ${action}
Context: ${JSON.stringify(context, null, 2)}

Verify compliance with:
- TCPA (2025 regulations)
- RESPA (Real Estate Settlement Procedures Act)
- Fair Housing Act
- State-specific real estate laws
- Professional ethics standards

Provide:
1. Compliance status (compliant/violation/needs_review)
2. Relevant regulations
3. Risk assessment
4. Recommendations`,
        },
      ],
    });

    return response.content;
  }
}
```

## Prompt Caching for 90% Cost Reduction

### Multi-Tier Caching Strategy

```typescript
class CachedAgentClient {
  private client: Anthropic;

  async createMessageWithCaching(
    systemPrompt: string,
    userMessage: string,
    tools?: any[]
  ) {
    // Tier 1: Static cached (system prompts, compliance rules)
    const staticCachedSystem = {
      type: 'text' as const,
      text: systemPrompt,
      cache_control: { type: 'ephemeral' as const },
    };

    // Tier 2: Semi-static cached (knowledge base context)
    const knowledgeContext = await this.getKnowledgeContext(userMessage);
    const knowledgeCached = {
      type: 'text' as const,
      text: `Relevant knowledge:\n\n${knowledgeContext}`,
      cache_control: { type: 'ephemeral' as const },
    };

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20250924',
      max_tokens: 4096,
      system: [staticCachedSystem, knowledgeCached],
      messages: [{ role: 'user', content: userMessage }],
      tools,
    });

    // Log cache metrics
    this.logCacheMetrics(response);

    return response;
  }

  logCacheMetrics(response: any) {
    const usage = response.usage;

    console.log('Cache Performance:');
    console.log(`  Input tokens: ${usage.input_tokens}`);
    console.log(`  Cache creation tokens: ${usage.cache_creation_input_tokens || 0}`);
    console.log(`  Cache read tokens: ${usage.cache_read_input_tokens || 0}`);

    if (usage.cache_read_input_tokens > 0) {
      const savingsPercent =
        (usage.cache_read_input_tokens /
          (usage.input_tokens + usage.cache_read_input_tokens)) *
        100;
      console.log(`  Cost savings: ${savingsPercent.toFixed(1)}%`);
    }
  }

  async getKnowledgeContext(query: string) {
    // Retrieve from vector DB
    const results = await vectorDB.search({
      query,
      limit: 10,
    });

    return results.map(r => r.content).join('\n\n');
  }
}
```

### Batch Processing with Caching

```typescript
// Process multiple leads with shared cached context
async function batchProcessLeads(leads: Lead[]) {
  const agent = new CachedAgentClient();

  // Shared cached system prompt
  const systemPrompt = `You are a lead qualification expert...`;

  const results = [];

  for (const lead of leads) {
    // First call creates cache
    // Subsequent calls read from cache (90% cheaper)
    const result = await agent.createMessageWithCaching(
      systemPrompt,
      `Qualify this lead: ${JSON.stringify(lead)}`
    );

    results.push(result);

    // Small delay to batch within cache TTL window
    await sleep(100);
  }

  return results;
}
```

## Streaming Responses

### Real-Time Token Streaming

```typescript
async function streamAgentResponse(userMessage: string) {
  const stream = await client.messages.create({
    model: 'claude-3-5-sonnet-20250924',
    max_tokens: 4096,
    messages: [{ role: 'user', content: userMessage }],
    stream: true,
  });

  let fullResponse = '';

  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      const delta = event.delta;

      if (delta.type === 'text_delta') {
        process.stdout.write(delta.text);
        fullResponse += delta.text;
      }
    }

    if (event.type === 'message_stop') {
      console.log('\n[Stream complete]');
    }
  }

  return fullResponse;
}

// WebSocket streaming to client
function streamToWebSocket(ws: WebSocket, userMessage: string) {
  const stream = client.messages.create({
    model: 'claude-3-5-sonnet-20250924',
    max_tokens: 4096,
    messages: [{ role: 'user', content: userMessage }],
    stream: true,
  });

  stream.then(async (streamResponse) => {
    for await (const event of streamResponse) {
      if (event.type === 'content_block_delta') {
        ws.send(JSON.stringify({
          type: 'token',
          content: event.delta.text,
        }));
      }

      if (event.type === 'message_stop') {
        ws.send(JSON.stringify({ type: 'complete' }));
      }
    }
  });
}
```

## Agent-to-Agent Communication

### Event-Driven Agent Coordination

```typescript
class AgentOrchestrator {
  private agents: Map<string, any>;
  private eventBus: Kafka;

  constructor() {
    this.agents = new Map([
      ['architect', new ArchitectureAgent()],
      ['conversation', new ConversationAgent()],
      ['sales', new SalesAgent()],
      ['realty', new RealtyAgent()],
    ]);

    this.eventBus = new Kafka({
      clientId: 'agent-orchestrator',
      brokers: process.env.KAFKA_BROKERS.split(','),
    });
  }

  async handleLeadQualification(lead: Lead) {
    // 1. Realty agent evaluates property
    const propertyEval = await this.agents
      .get('realty')
      .evaluateProperty(lead.property);

    // 2. If qualified, sales agent optimizes approach
    if (propertyEval.score >= 70) {
      const marketStrategy = await this.agents
        .get('sales')
        .conductMarketResearch(lead.property.city, lead.property.type);

      // 3. Conversation agent designs call flow
      const conversationFlow = await this.agents
        .get('conversation')
        .designConversationFlow(lead, {
          ...lead.property,
          evaluation: propertyEval,
          strategy: marketStrategy,
        });

      // 4. Emit event for calling service
      await this.eventBus.send({
        topic: 'leads.qualified',
        messages: [
          {
            key: lead._id,
            value: JSON.stringify({
              lead,
              propertyEval,
              marketStrategy,
              conversationFlow,
              timestamp: new Date(),
            }),
          },
        ],
      });

      return { qualified: true, conversationFlow };
    }

    return { qualified: false, reason: propertyEval.reason };
  }

  async handleCallCompleted(callData: any) {
    // 1. Conversation agent analyzes transcript
    const analysis = await this.agents
      .get('conversation')
      .analyzeCallTranscript(callData.transcript);

    // 2. Sales agent updates campaign metrics
    await this.agents.get('sales').updateCampaignMetrics({
      leadSource: callData.lead.source,
      outcome: callData.outcome,
      duration: callData.duration,
      sentiment: analysis.avgSentiment,
    });

    // 3. If successful technique identified, architect evaluates for system update
    if (analysis.successfulTechniques?.length > 0) {
      await this.agents.get('architect').evaluateSystemUpdate({
        type: 'conversation_improvement',
        techniques: analysis.successfulTechniques,
      });
    }

    return analysis;
  }
}
```

## Files API for Knowledge Processing

### Processing Documents

```typescript
async function processDocuments(filePaths: string[]) {
  const fileContents = [];

  for (const path of filePaths) {
    const fileBuffer = fs.readFileSync(path);
    const base64Content = fileBuffer.toString('base64');

    // Determine media type
    const ext = path.split('.').pop();
    const mediaTypeMap = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
    };

    fileContents.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaTypeMap[ext],
        data: base64Content,
      },
    });
  }

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20250924',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          ...fileContents,
          {
            type: 'text',
            text: 'Analyze these documents and extract key information for our knowledge base.',
          },
        ],
      },
    ],
  });

  return response.content;
}
```

## Error Handling

```typescript
async function safeAgentExecution<T>(
  agentFn: () => Promise<T>
): Promise<T | null> {
  try {
    return await agentFn();
  } catch (error: any) {
    if (error.status === 429) {
      // Rate limit - retry with exponential backoff
      console.warn('Rate limit hit, retrying...');
      await sleep(5000);
      return safeAgentExecution(agentFn);
    } else if (error.status === 529) {
      // Overloaded - wait and retry
      console.warn('API overloaded, waiting...');
      await sleep(10000);
      return safeAgentExecution(agentFn);
    } else if (error.status === 401) {
      // Authentication error
      console.error('Authentication failed. Check API key.');
      return null;
    } else {
      console.error('Unexpected error:', error.message);
      throw error;
    }
  }
}
```

## Monitoring & Observability

```typescript
const agentMetrics = {
  requests: new Counter({ name: 'claude_agent_requests_total' }),
  latency: new Histogram({ name: 'claude_agent_latency_seconds' }),
  cacheHits: new Counter({ name: 'claude_cache_hits_total' }),
  errors: new Counter({ name: 'claude_agent_errors_total' }),
};

async function trackedAgentCall(agentName: string, fn: () => Promise<any>) {
  const start = Date.now();

  agentMetrics.requests.inc({ agent: agentName });

  try {
    const result = await fn();

    // Track cache performance
    if (result.usage?.cache_read_input_tokens > 0) {
      agentMetrics.cacheHits.inc({ agent: agentName });
    }

    agentMetrics.latency.observe(
      { agent: agentName },
      (Date.now() - start) / 1000
    );

    return result;
  } catch (error) {
    agentMetrics.errors.inc({ agent: agentName, error: error.message });
    throw error;
  }
}
```

## Environment Variables

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-api03-...
QDRANT_URL=http://localhost:6333
KAFKA_BROKERS=localhost:9092
MONGODB_URI=mongodb://localhost:27017/next-level-real-estate
```

## Best Practices

1. **Use Prompt Caching**: Cache static system prompts and knowledge context for 90% savings
2. **Batch Processing**: Group similar requests within cache TTL window (1 hour)
3. **Stream When Possible**: Use streaming for better UX and reduced latency
4. **Tool Use**: Leverage tools for external data access instead of hardcoding
5. **Agent Specialization**: Keep agents focused on specific domains
6. **Knowledge Base Updates**: Feed agent learnings back into vector DB
7. **Error Handling**: Implement retries with exponential backoff
8. **Monitoring**: Track cache hit rates, latency, and token usage

## Resources

- [Claude API Documentation](https://docs.anthropic.com/)
- [Prompt Caching Guide](https://docs.anthropic.com/en/docs/prompt-caching)
- [Tool Use Reference](https://docs.anthropic.com/en/docs/tool-use)
- [Streaming Guide](https://docs.anthropic.com/en/api/streaming)
- [Vision & Files API](https://docs.anthropic.com/en/docs/vision)
- [Agent SDK Examples](https://github.com/anthropics/anthropic-sdk-typescript)
