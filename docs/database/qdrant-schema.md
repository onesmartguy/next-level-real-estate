# Qdrant Vector Database Schema

## Overview

Qdrant is the chosen vector database for Next Level Real Estate's RAG (Retrieval-Augmented Generation) system, powering the knowledge bases for all four specialized Claude agents. Qdrant provides high-performance semantic search, hybrid keyword+vector search, and rich metadata filtering capabilities.

## Why Qdrant?

### Selection Criteria

**Chosen Over Alternatives**:
- **Pinecone**: Qdrant offers self-hosted deployment, avoiding vendor lock-in and reducing costs by ~60%
- **ChromaDB**: Qdrant provides production-grade performance with HNSW indexing vs. ChromaDB's simpler flat indexing
- **Weaviate**: Qdrant has simpler configuration and better Python/Node.js SDKs
- **Milvus**: Qdrant offers lower operational complexity with built-in clustering

**Key Advantages**:
1. **Performance**: HNSW algorithm with 95%+ recall at <50ms latency
2. **Hybrid Search**: Native keyword + semantic search in single query
3. **Filtering**: Rich metadata filtering without index degradation
4. **Scalability**: Horizontal scaling with automatic sharding
5. **Cost**: Self-hosted deployment reduces costs vs. managed services
6. **Flexibility**: Supports multiple distance metrics (cosine, euclidean, dot product)

## Architecture

### Deployment Options

```yaml
# Self-Hosted (Recommended for Production)
deployment:
  mode: cluster
  nodes: 3
  storage: persistent
  backup: automated
  cost: ~$300/month (AWS)

# Cloud Managed (Development/Testing)
deployment:
  provider: qdrant-cloud
  tier: startup
  storage: 10GB
  cost: ~$50/month
```

### Infrastructure

```javascript
// Docker Compose for local development
version: '3.8'

services:
  qdrant:
    image: qdrant/qdrant:v1.7.4
    ports:
      - "6333:6333"  # HTTP API
      - "6334:6334"  # gRPC
    volumes:
      - ./qdrant_storage:/qdrant/storage
    environment:
      - QDRANT__SERVICE__GRPC_PORT=6334
      - QDRANT__SERVICE__HTTP_PORT=6333
      - QDRANT__STORAGE__STORAGE_PATH=/qdrant/storage
      - QDRANT__STORAGE__WAL_CAPACITY_MB=1024
    restart: unless-stopped
```

## Collection Structure

### Collection Overview

Four specialized collections for the four Claude agents:

1. **architect-knowledge**: System design patterns, AI research, optimization techniques
2. **conversation-patterns**: Call strategies, objection handling, sentiment-driven responses
3. **market-intelligence**: Property data, market trends, competitor analysis
4. **realty-domain**: Real estate expertise, compliance rules, investment criteria

### Vector Configuration

```javascript
const VECTOR_CONFIG = {
  size: 1536,              // text-embedding-3-large dimensions
  distance: 'Cosine',      // Cosine similarity (range: -1 to 1)
  on_disk: false,          // Keep vectors in RAM for speed
  hnsw_config: {
    m: 16,                 // Number of edges per node
    ef_construct: 100,     // Construction time/quality tradeoff
    full_scan_threshold: 10000, // Switch to HNSW at this size
  },
};

const SPARSE_VECTOR_CONFIG = {
  // For hybrid keyword search
  modifier: 'idf',         // Inverse document frequency
};
```

## Collection Schemas

### 1. Architecture Agent Collection

```javascript
// Collection: architect-knowledge
const architectCollection = {
  name: 'architect-knowledge',

  vectors: {
    // Dense semantic embedding
    text: {
      size: 1536,
      distance: 'Cosine',
      on_disk: false,
      hnsw_config: {
        m: 16,
        ef_construct: 100,
        full_scan_threshold: 10000,
      },
    },

    // Sparse keyword embedding for hybrid search
    text_sparse: {
      modifier: 'idf',
    },
  },

  // Payload schema for metadata
  payload_schema: {
    // Core metadata
    documentId: { type: 'keyword', indexed: true },
    title: { type: 'text', indexed: true },
    content: { type: 'text', indexed: false },
    category: { type: 'keyword', indexed: true },

    // Source information
    source: { type: 'keyword', indexed: true },
    sourceUrl: { type: 'keyword', indexed: false },
    author: { type: 'keyword', indexed: true },

    // Temporal data
    createdAt: { type: 'datetime', indexed: true },
    updatedAt: { type: 'datetime', indexed: true },
    publishedDate: { type: 'datetime', indexed: true },

    // Performance tracking
    usageCount: { type: 'integer', indexed: true },
    successRate: { type: 'float', indexed: true },
    avgRelevanceScore: { type: 'float', indexed: true },

    // Categorization
    tags: { type: 'keyword[]', indexed: true },
    technologies: { type: 'keyword[]', indexed: true },
    difficulty: { type: 'keyword', indexed: true }, // beginner, intermediate, advanced

    // Quality metrics
    verified: { type: 'bool', indexed: true },
    confidence: { type: 'float', indexed: true },

    // Chunking metadata
    chunkIndex: { type: 'integer', indexed: true },
    totalChunks: { type: 'integer', indexed: false },
    parentDocumentId: { type: 'keyword', indexed: true },
  },
};

// Example document
const architectExample = {
  id: 'arch-001-chunk-0',

  vector: {
    text: [0.123, -0.456, 0.789, ...], // 1536 dimensions
    text_sparse: {
      indices: [42, 123, 456],
      values: [0.8, 0.6, 0.4],
    },
  },

  payload: {
    documentId: 'arch-001',
    title: 'Event-Driven Microservices with Kafka',
    content: 'Event-driven architecture enables loose coupling between services...',
    category: 'architecture-patterns',

    source: 'research-paper',
    sourceUrl: 'https://arxiv.org/abs/2024.12345',
    author: 'Jane Smith',

    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-15T10:30:00Z',
    publishedDate: '2024-12-01T00:00:00Z',

    usageCount: 42,
    successRate: 0.87,
    avgRelevanceScore: 0.92,

    tags: ['event-driven', 'microservices', 'kafka', 'scalability'],
    technologies: ['Kafka', 'RabbitMQ', 'Node.js', '.NET'],
    difficulty: 'intermediate',

    verified: true,
    confidence: 0.95,

    chunkIndex: 0,
    totalChunks: 3,
    parentDocumentId: 'arch-001',
  },
};
```

### 2. Conversation AI Agent Collection

```javascript
// Collection: conversation-patterns
const conversationCollection = {
  name: 'conversation-patterns',

  vectors: {
    text: {
      size: 1536,
      distance: 'Cosine',
      on_disk: false,
      hnsw_config: {
        m: 16,
        ef_construct: 100,
        full_scan_threshold: 10000,
      },
    },
    text_sparse: {
      modifier: 'idf',
    },
  },

  payload_schema: {
    // Core metadata
    documentId: { type: 'keyword', indexed: true },
    title: { type: 'text', indexed: true },
    content: { type: 'text', indexed: false },
    patternType: { type: 'keyword', indexed: true },

    // Conversation context
    scenario: { type: 'keyword', indexed: true },
    objectionType: { type: 'keyword', indexed: true },
    sellerMotivation: { type: 'keyword', indexed: true },
    propertyCondition: { type: 'keyword', indexed: true },

    // Performance metrics
    usageCount: { type: 'integer', indexed: true },
    successRate: { type: 'float', indexed: true },
    conversionRate: { type: 'float', indexed: true },
    avgSentimentScore: { type: 'float', indexed: true },

    // Call metadata
    avgCallDuration: { type: 'float', indexed: true },
    interruptionRate: { type: 'float', indexed: true },

    // Source
    source: { type: 'keyword', indexed: true },
    callId: { type: 'keyword', indexed: true },

    // Temporal
    createdAt: { type: 'datetime', indexed: true },
    updatedAt: { type: 'datetime', indexed: true },
    lastUsedAt: { type: 'datetime', indexed: true },

    // Classification
    tags: { type: 'keyword[]', indexed: true },
    intent: { type: 'keyword', indexed: true },
    emotion: { type: 'keyword', indexed: true },

    // Quality
    verified: { type: 'bool', indexed: true },
    confidence: { type: 'float', indexed: true },

    // Chunking
    chunkIndex: { type: 'integer', indexed: true },
    totalChunks: { type: 'integer', indexed: false },
    parentDocumentId: { type: 'keyword', indexed: true },
  },
};

// Example document
const conversationExample = {
  id: 'conv-042-chunk-0',

  vector: {
    text: [0.234, -0.567, 0.890, ...], // 1536 dimensions
    text_sparse: {
      indices: [15, 89, 234],
      values: [0.9, 0.7, 0.5],
    },
  },

  payload: {
    documentId: 'conv-042',
    title: 'Handling Price Objection - Motivated Seller',
    content: 'When seller says price is too low, acknowledge their concern and pivot to their timeline and motivation...',
    patternType: 'objection-handling',

    scenario: 'price-negotiation',
    objectionType: 'price-too-low',
    sellerMotivation: 'urgent-timeline',
    propertyCondition: 'needs-repair',

    usageCount: 127,
    successRate: 0.82,
    conversionRate: 0.68,
    avgSentimentScore: 0.45,

    avgCallDuration: 320.5, // seconds
    interruptionRate: 0.12,

    source: 'call-analysis',
    callId: 'call-2024-12-15-1234',

    createdAt: '2024-12-15T14:22:00Z',
    updatedAt: '2025-01-10T09:15:00Z',
    lastUsedAt: '2025-01-20T16:45:00Z',

    tags: ['objection', 'price', 'negotiation', 'motivated-seller'],
    intent: 'negotiate',
    emotion: 'concerned',

    verified: true,
    confidence: 0.88,

    chunkIndex: 0,
    totalChunks: 1,
    parentDocumentId: 'conv-042',
  },
};
```

### 3. Sales & Marketing Agent Collection

```javascript
// Collection: market-intelligence
const marketCollection = {
  name: 'market-intelligence',

  vectors: {
    text: {
      size: 1536,
      distance: 'Cosine',
      on_disk: false,
      hnsw_config: {
        m: 16,
        ef_construct: 100,
        full_scan_threshold: 10000,
      },
    },
    text_sparse: {
      modifier: 'idf',
    },
  },

  payload_schema: {
    // Core metadata
    documentId: { type: 'keyword', indexed: true },
    title: { type: 'text', indexed: true },
    content: { type: 'text', indexed: false },
    dataType: { type: 'keyword', indexed: true },

    // Geographic data
    city: { type: 'keyword', indexed: true },
    state: { type: 'keyword', indexed: true },
    zipCode: { type: 'keyword', indexed: true },
    marketArea: { type: 'keyword', indexed: true },

    // Property data
    propertyType: { type: 'keyword', indexed: true },
    priceRange: { type: 'keyword', indexed: true },
    avgPrice: { type: 'float', indexed: true },

    // Market metrics
    daysOnMarket: { type: 'float', indexed: true },
    inventoryLevel: { type: 'integer', indexed: true },
    absorptionRate: { type: 'float', indexed: true },
    priceChangePercent: { type: 'float', indexed: true },

    // Campaign data
    campaignId: { type: 'keyword', indexed: true },
    leadSource: { type: 'keyword', indexed: true },
    conversionRate: { type: 'float', indexed: true },
    costPerLead: { type: 'float', indexed: true },
    roi: { type: 'float', indexed: true },

    // Temporal
    reportDate: { type: 'datetime', indexed: true },
    createdAt: { type: 'datetime', indexed: true },
    updatedAt: { type: 'datetime', indexed: true },

    // Source
    source: { type: 'keyword', indexed: true },
    sourceUrl: { type: 'keyword', indexed: false },

    // Performance
    usageCount: { type: 'integer', indexed: true },
    relevanceScore: { type: 'float', indexed: true },

    // Classification
    tags: { type: 'keyword[]', indexed: true },
    trendDirection: { type: 'keyword', indexed: true },

    // Quality
    verified: { type: 'bool', indexed: true },
    confidence: { type: 'float', indexed: true },

    // Chunking
    chunkIndex: { type: 'integer', indexed: true },
    totalChunks: { type: 'integer', indexed: false },
    parentDocumentId: { type: 'keyword', indexed: true },
  },
};

// Example document
const marketExample = {
  id: 'market-2025-01-austin-sfr',

  vector: {
    text: [0.345, -0.678, 0.901, ...], // 1536 dimensions
    text_sparse: {
      indices: [23, 145, 678],
      values: [0.85, 0.65, 0.45],
    },
  },

  payload: {
    documentId: 'market-2025-01-austin-sfr',
    title: 'Austin Single-Family Market Report - January 2025',
    content: 'Austin market showing strong demand with avg days on market at 28...',
    dataType: 'market-report',

    city: 'Austin',
    state: 'TX',
    zipCode: '78704',
    marketArea: 'South Austin',

    propertyType: 'single-family',
    priceRange: '300k-500k',
    avgPrice: 425000.0,

    daysOnMarket: 28.5,
    inventoryLevel: 456,
    absorptionRate: 3.2,
    priceChangePercent: 2.8,

    campaignId: null,
    leadSource: null,
    conversionRate: null,
    costPerLead: null,
    roi: null,

    reportDate: '2025-01-15T00:00:00Z',
    createdAt: '2025-01-16T08:00:00Z',
    updatedAt: '2025-01-16T08:00:00Z',

    source: 'mls-data',
    sourceUrl: 'https://austinmls.com/reports/2025-01',

    usageCount: 34,
    relevanceScore: 0.91,

    tags: ['austin', 'sfr', 'market-report', 'q1-2025'],
    trendDirection: 'upward',

    verified: true,
    confidence: 0.94,

    chunkIndex: 0,
    totalChunks: 1,
    parentDocumentId: 'market-2025-01-austin-sfr',
  },
};
```

### 4. Realty Expert Agent Collection

```javascript
// Collection: realty-domain
const realtyCollection = {
  name: 'realty-domain',

  vectors: {
    text: {
      size: 1536,
      distance: 'Cosine',
      on_disk: false,
      hnsw_config: {
        m: 16,
        ef_construct: 100,
        full_scan_threshold: 10000,
      },
    },
    text_sparse: {
      modifier: 'idf',
    },
  },

  payload_schema: {
    // Core metadata
    documentId: { type: 'keyword', indexed: true },
    title: { type: 'text', indexed: true },
    content: { type: 'text', indexed: false },
    knowledgeType: { type: 'keyword', indexed: true },

    // Domain classification
    strategy: { type: 'keyword', indexed: true },
    regulationType: { type: 'keyword', indexed: true },
    propertyType: { type: 'keyword', indexed: true },

    // Legal/Compliance
    jurisdiction: { type: 'keyword', indexed: true },
    lawType: { type: 'keyword', indexed: true },
    complianceLevel: { type: 'keyword', indexed: true },

    // Investment analysis
    analysisType: { type: 'keyword', indexed: true },
    riskLevel: { type: 'keyword', indexed: true },
    minEquityPercent: { type: 'float', indexed: true },
    targetROI: { type: 'float', indexed: true },

    // Source
    source: { type: 'keyword', indexed: true },
    sourceUrl: { type: 'keyword', indexed: false },
    author: { type: 'keyword', indexed: true },

    // Temporal
    effectiveDate: { type: 'datetime', indexed: true },
    expirationDate: { type: 'datetime', indexed: true },
    createdAt: { type: 'datetime', indexed: true },
    updatedAt: { type: 'datetime', indexed: true },

    // Performance
    usageCount: { type: 'integer', indexed: true },
    successRate: { type: 'float', indexed: true },

    // Classification
    tags: { type: 'keyword[]', indexed: true },

    // Quality
    verified: { type: 'bool', indexed: true },
    confidence: { type: 'float', indexed: true },
    critical: { type: 'bool', indexed: true },

    // Chunking
    chunkIndex: { type: 'integer', indexed: true },
    totalChunks: { type: 'integer', indexed: false },
    parentDocumentId: { type: 'keyword', indexed: true },
  },
};

// Example document
const realtyExample = {
  id: 'realty-tcpa-2025',

  vector: {
    text: [0.456, -0.789, 0.012, ...], // 1536 dimensions
    text_sparse: {
      indices: [8, 92, 345],
      values: [0.95, 0.75, 0.55],
    },
  },

  payload: {
    documentId: 'realty-tcpa-2025',
    title: 'TCPA 2025 Regulations - One-to-One Consent Requirement',
    content: 'As of January 2025, TCPA requires one-to-one written consent for automated calls...',
    knowledgeType: 'compliance-rule',

    strategy: 'wholesale',
    regulationType: 'federal',
    propertyType: 'all',

    jurisdiction: 'federal',
    lawType: 'TCPA',
    complianceLevel: 'critical',

    analysisType: null,
    riskLevel: 'high',
    minEquityPercent: null,
    targetROI: null,

    source: 'fcc-regulation',
    sourceUrl: 'https://fcc.gov/tcpa-2025',
    author: 'FCC',

    effectiveDate: '2025-01-01T00:00:00Z',
    expirationDate: null,
    createdAt: '2024-12-15T10:00:00Z',
    updatedAt: '2025-01-05T14:30:00Z',

    usageCount: 892,
    successRate: 1.0,

    tags: ['tcpa', 'compliance', 'calling', 'consent', 'critical'],

    verified: true,
    confidence: 1.0,
    critical: true,

    chunkIndex: 0,
    totalChunks: 2,
    parentDocumentId: 'realty-tcpa-2025',
  },
};
```

## Embedding Strategy

### Text Embedding with OpenAI

```javascript
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate dense vector embedding
async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
    dimensions: 1536,
  });

  return response.data[0].embedding;
}

// Generate sparse vector for keyword search
function generateSparseEmbedding(text) {
  // Tokenize and calculate TF-IDF
  const tokens = tokenize(text.toLowerCase());
  const tf = calculateTermFrequency(tokens);
  const idf = calculateInverseDocumentFrequency(tokens);

  const sparseVector = {
    indices: [],
    values: [],
  };

  // Create sparse representation (top 100 terms)
  const tfidf = Object.entries(tf)
    .map(([term, freq]) => ({
      term,
      score: freq * (idf[term] || 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 100);

  tfidf.forEach(({ term, score }) => {
    const index = termToIndex(term);
    sparseVector.indices.push(index);
    sparseVector.values.push(score);
  });

  return sparseVector;
}

// Helper: Tokenize text
function tokenize(text) {
  return text
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}
```

## Chunking and Indexing Pipeline

### Document Processing

```javascript
const { QdrantClient } = require('@qdrant/js-client-rest');

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY,
});

// Process and index document
async function indexDocument(document, collectionName) {
  // 1. Chunk document
  const chunks = chunkDocument(document.content, {
    maxTokens: 1000,
    overlap: 200,
  });

  // 2. Process each chunk
  const points = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    // Generate embeddings
    const denseVector = await generateEmbedding(chunk.text);
    const sparseVector = generateSparseEmbedding(chunk.text);

    // Create point
    const point = {
      id: `${document.id}-chunk-${i}`,
      vector: {
        text: denseVector,
        text_sparse: sparseVector,
      },
      payload: {
        ...document.metadata,
        content: chunk.text,
        chunkIndex: i,
        totalChunks: chunks.length,
        parentDocumentId: document.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    points.push(point);
  }

  // 3. Upsert to Qdrant
  await qdrant.upsert(collectionName, {
    wait: true,
    points,
  });

  return {
    documentId: document.id,
    chunksCreated: chunks.length,
    collectionName,
  };
}

// Chunk document with overlap
function chunkDocument(text, options = {}) {
  const maxTokens = options.maxTokens || 1000;
  const overlap = options.overlap || 200;

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let currentChunk = [];
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);

    if (currentTokens + sentenceTokens > maxTokens && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        text: currentChunk.join(' '),
        tokens: currentTokens,
      });

      // Start new chunk with overlap
      const overlapSentences = currentChunk.slice(-2); // Last 2 sentences
      currentChunk = overlapSentences;
      currentTokens = overlapSentences.reduce(
        (sum, s) => sum + estimateTokens(s),
        0
      );
    }

    currentChunk.push(sentence);
    currentTokens += sentenceTokens;
  }

  // Add final chunk
  if (currentChunk.length > 0) {
    chunks.push({
      text: currentChunk.join(' '),
      tokens: currentTokens,
    });
  }

  return chunks;
}

// Estimate token count
function estimateTokens(text) {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}
```

## Hybrid Search Implementation

### Search Function

```javascript
// Hybrid keyword + semantic search
async function hybridSearch(query, collectionName, options = {}) {
  const {
    limit = 10,
    filter = null,
    scoreThreshold = 0.7,
    semanticWeight = 0.7,
    keywordWeight = 0.3,
  } = options;

  // 1. Generate query embeddings
  const denseQuery = await generateEmbedding(query);
  const sparseQuery = generateSparseEmbedding(query);

  // 2. Search with hybrid vectors
  const searchResult = await qdrant.search(collectionName, {
    vector: {
      name: 'text',
      vector: denseQuery,
    },
    // Sparse vector for keyword boost
    sparse_vector: {
      name: 'text_sparse',
      vector: sparseQuery,
    },
    limit: limit * 2, // Get more candidates for re-ranking
    filter,
    with_payload: true,
    with_vector: false,
    score_threshold: scoreThreshold,
  });

  // 3. Re-rank with hybrid scoring
  const reranked = searchResult.map(result => {
    const semanticScore = result.score;
    const keywordScore = calculateKeywordMatch(query, result.payload.content);

    const hybridScore =
      semanticWeight * semanticScore +
      keywordWeight * keywordScore;

    return {
      ...result,
      hybridScore,
      semanticScore,
      keywordScore,
    };
  })
  .sort((a, b) => b.hybridScore - a.hybridScore)
  .slice(0, limit);

  return reranked;
}

// Calculate keyword match score
function calculateKeywordMatch(query, text) {
  const queryTokens = new Set(tokenize(query.toLowerCase()));
  const textTokens = tokenize(text.toLowerCase());

  const matches = textTokens.filter(t => queryTokens.has(t)).length;
  const score = matches / Math.max(queryTokens.size, 1);

  return Math.min(score, 1.0);
}

// Example: Search with metadata filters
async function searchConversationPatterns(scenario, objectionType) {
  const query = `How to handle ${objectionType} objection in ${scenario} scenario`;

  const results = await hybridSearch(query, 'conversation-patterns', {
    limit: 5,
    filter: {
      must: [
        { key: 'scenario', match: { value: scenario } },
        { key: 'objectionType', match: { value: objectionType } },
        { key: 'verified', match: { value: true } },
      ],
      should: [
        { key: 'successRate', range: { gte: 0.7 } },
      ],
    },
    scoreThreshold: 0.75,
  });

  return results;
}
```

## RAG Retrieval Patterns

### Basic RAG

```javascript
// Simple RAG: Retrieve and generate
async function simpleRAG(question, collectionName, agentType) {
  // 1. Retrieve relevant documents
  const results = await hybridSearch(question, collectionName, {
    limit: 5,
    scoreThreshold: 0.75,
  });

  // 2. Format context
  const context = results
    .map((r, i) => `[${i + 1}] ${r.payload.content}`)
    .join('\n\n');

  // 3. Generate with Claude
  const prompt = `You are a ${agentType} agent. Answer the question using the provided context.

CONTEXT:
${context}

QUESTION:
${question}

ANSWER:`;

  const response = await claude.messages.create({
    model: 'claude-3-5-sonnet-20250924',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  return {
    answer: response.content[0].text,
    sources: results.map(r => ({
      documentId: r.payload.documentId,
      title: r.payload.title,
      score: r.hybridScore,
    })),
  };
}
```

### Advanced RAG with Re-ranking

```javascript
const { Anthropic } = require('@anthropic-ai/sdk');

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Advanced RAG with multi-stage retrieval
async function advancedRAG(question, collectionName, agentType) {
  // 1. Initial broad retrieval
  const initialResults = await hybridSearch(question, collectionName, {
    limit: 20,
    scoreThreshold: 0.6,
  });

  // 2. Re-rank with Claude
  const reranked = await rerankWithClaude(question, initialResults);

  // 3. Select top results
  const topResults = reranked.slice(0, 5);

  // 4. Build hierarchical context
  const context = buildHierarchicalContext(topResults);

  // 5. Generate with prompt caching
  const systemPrompt = getAgentSystemPrompt(agentType);

  const response = await claude.messages.create({
    model: 'claude-3-5-sonnet-20250924',
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' }, // Cache system prompt
      },
      {
        type: 'text',
        text: context,
        cache_control: { type: 'ephemeral' }, // Cache context
      },
    ],
    messages: [{ role: 'user', content: question }],
  });

  return {
    answer: response.content[0].text,
    sources: topResults.map(r => ({
      documentId: r.payload.documentId,
      title: r.payload.title,
      score: r.rerankScore,
      originalScore: r.hybridScore,
    })),
    usage: response.usage,
  };
}

// Re-rank using Claude
async function rerankWithClaude(question, results) {
  const documents = results.map((r, i) => ({
    id: i,
    text: r.payload.content,
  }));

  const prompt = `Rank the following documents by relevance to the question.
Question: ${question}

Documents:
${documents.map(d => `[${d.id}] ${d.text.substring(0, 500)}...`).join('\n\n')}

Return only the document IDs in order of relevance (most relevant first), comma-separated:`;

  const response = await claude.messages.create({
    model: 'claude-3-haiku-20240307', // Fast model for re-ranking
    max_tokens: 100,
    messages: [{ role: 'user', content: prompt }],
  });

  const ranking = response.content[0].text
    .split(',')
    .map(id => parseInt(id.trim()));

  return ranking.map((id, rank) => ({
    ...results[id],
    rerankScore: 1 - rank / ranking.length,
  }));
}

// Build hierarchical context
function buildHierarchicalContext(results) {
  const grouped = {};

  results.forEach(r => {
    const parentId = r.payload.parentDocumentId;
    if (!grouped[parentId]) {
      grouped[parentId] = [];
    }
    grouped[parentId].push(r);
  });

  let context = 'KNOWLEDGE BASE:\n\n';

  Object.entries(grouped).forEach(([parentId, chunks]) => {
    context += `Document: ${chunks[0].payload.title}\n`;
    context += `Source: ${chunks[0].payload.source}\n`;
    context += `Confidence: ${chunks[0].payload.confidence}\n\n`;

    chunks.forEach(chunk => {
      context += `${chunk.payload.content}\n\n`;
    });

    context += '---\n\n';
  });

  return context;
}
```

## Performance Tuning and Optimization

### Index Optimization

```javascript
// Create optimized collection
async function createOptimizedCollection(collectionName, config = {}) {
  await qdrant.createCollection(collectionName, {
    vectors: {
      text: {
        size: 1536,
        distance: 'Cosine',
        on_disk: false, // Keep in RAM for speed
        hnsw_config: {
          m: config.m || 16,              // Edges per node (higher = better recall)
          ef_construct: config.efConstruct || 100, // Construction quality
          full_scan_threshold: config.fullScanThreshold || 10000,
        },
      },
      text_sparse: {
        modifier: 'idf',
      },
    },

    // Optimize for payload filtering
    optimizers_config: {
      deleted_threshold: 0.2,
      vacuum_min_vector_number: 1000,
      default_segment_number: 4,
      max_segment_size: 200000,
      memmap_threshold: 50000,
      indexing_threshold: 20000,
      flush_interval_sec: 5,
      max_optimization_threads: 4,
    },

    // Quantization for memory efficiency
    quantization_config: {
      scalar: {
        type: 'int8',
        quantile: 0.99,
        always_ram: true,
      },
    },
  });
}

// Tune search parameters
async function tuneSearch(query, collectionName) {
  // Test different ef values
  const efValues = [64, 128, 256, 512];
  const results = {};

  for (const ef of efValues) {
    const start = Date.now();

    const searchResult = await qdrant.search(collectionName, {
      vector: {
        name: 'text',
        vector: await generateEmbedding(query),
      },
      limit: 10,
      params: {
        hnsw_ef: ef, // Adjust search quality
      },
    });

    const latency = Date.now() - start;

    results[ef] = {
      latency,
      resultsCount: searchResult.length,
      avgScore: searchResult.reduce((sum, r) => sum + r.score, 0) / searchResult.length,
    };
  }

  return results;
}
```

### Monitoring and Metrics

```javascript
// Collection statistics
async function getCollectionStats(collectionName) {
  const info = await qdrant.getCollection(collectionName);

  return {
    vectorsCount: info.vectors_count,
    pointsCount: info.points_count,
    segmentsCount: info.segments_count,
    indexedVectorsCount: info.indexed_vectors_count,
    status: info.status,
    optimizerStatus: info.optimizer_status,
  };
}

// Query performance tracking
async function trackQueryPerformance(query, collectionName) {
  const start = process.hrtime.bigint();

  const results = await hybridSearch(query, collectionName);

  const end = process.hrtime.bigint();
  const latencyMs = Number(end - start) / 1e6;

  // Log to monitoring
  await logMetric({
    metric: 'qdrant_query_latency_ms',
    value: latencyMs,
    tags: {
      collection: collectionName,
      resultCount: results.length,
    },
  });

  return {
    results,
    latencyMs,
  };
}
```

## Backup and Disaster Recovery

### Snapshot Management

```javascript
// Create collection snapshot
async function createSnapshot(collectionName) {
  const snapshot = await qdrant.createSnapshot(collectionName);

  console.log(`Snapshot created: ${snapshot.name}`);

  // Download snapshot for backup
  const snapshotData = await qdrant.getSnapshot(collectionName, snapshot.name);

  // Upload to S3
  await uploadToS3(snapshotData, {
    bucket: 'qdrant-backups',
    key: `${collectionName}/${snapshot.name}`,
  });

  return snapshot;
}

// Restore from snapshot
async function restoreFromSnapshot(collectionName, snapshotName) {
  // Download from S3
  const snapshotData = await downloadFromS3({
    bucket: 'qdrant-backups',
    key: `${collectionName}/${snapshotName}`,
  });

  // Restore collection
  await qdrant.restoreSnapshot(collectionName, snapshotData);

  console.log(`Restored ${collectionName} from ${snapshotName}`);
}

// Scheduled backup
async function scheduleBackups() {
  const collections = [
    'architect-knowledge',
    'conversation-patterns',
    'market-intelligence',
    'realty-domain',
  ];

  // Daily backups at 2 AM
  cron.schedule('0 2 * * *', async () => {
    for (const collection of collections) {
      try {
        await createSnapshot(collection);
        console.log(`Backup completed: ${collection}`);
      } catch (error) {
        console.error(`Backup failed for ${collection}:`, error);
        await alertOps(`Backup failed for ${collection}`);
      }
    }
  });
}
```

## Client Implementation

### Node.js Client

```javascript
const { QdrantClient } = require('@qdrant/js-client-rest');

class KnowledgeBaseClient {
  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
    });
  }

  async search(query, collection, options = {}) {
    return hybridSearch(query, collection, options);
  }

  async index(document, collection) {
    return indexDocument(document, collection);
  }

  async getStats(collection) {
    return getCollectionStats(collection);
  }

  async backup(collection) {
    return createSnapshot(collection);
  }
}

module.exports = KnowledgeBaseClient;
```

### .NET Client

```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

public class KnowledgeBaseClient
{
    private readonly QdrantClient _client;
    private readonly string _url;
    private readonly string _apiKey;

    public KnowledgeBaseClient(string url, string apiKey)
    {
        _url = url ?? "http://localhost:6334";
        _apiKey = apiKey;

        _client = new QdrantClient(_url, https: false);
    }

    public async Task<List<ScoredPoint>> SearchAsync(
        string collectionName,
        float[] queryVector,
        int limit = 10,
        Filter filter = null)
    {
        var searchResult = await _client.SearchAsync(
            collectionName: collectionName,
            vector: queryVector,
            limit: (ulong)limit,
            filter: filter,
            payloadSelector: true
        );

        return searchResult.ToList();
    }

    public async Task<UpdateResult> IndexAsync(
        string collectionName,
        List<PointStruct> points)
    {
        return await _client.UpsertAsync(
            collectionName: collectionName,
            points: points,
            wait: true
        );
    }

    public async Task<CollectionInfo> GetStatsAsync(string collectionName)
    {
        return await _client.GetCollectionInfoAsync(collectionName);
    }
}
```

## Environment Variables

```bash
# .env
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_GRPC_PORT=6334
QDRANT_TIMEOUT_MS=30000

# OpenAI for embeddings
OPENAI_API_KEY=your_openai_api_key

# Anthropic for RAG
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## Resources

- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Qdrant Client Libraries](https://qdrant.tech/documentation/frameworks/)
- [HNSW Algorithm](https://arxiv.org/abs/1603.09320)
- [Hybrid Search Guide](https://qdrant.tech/documentation/tutorials/hybrid-search/)
- [RAG Best Practices](https://qdrant.tech/documentation/tutorials/rag/)
