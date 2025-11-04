/**
 * Qdrant vector database initialization script
 * Creates collections for RAG knowledge bases
 *
 * Usage:
 *   npm run init:qdrant
 *   or
 *   ts-node scripts/qdrant-init.ts
 */

import { QdrantClient } from '../shared/database/qdrant.client';
import { logger } from '../shared/utils/logger';

/**
 * Collection configurations
 * Using text-embedding-3-large dimensions (1536)
 */
const COLLECTIONS = [
  {
    name: 'architect_knowledge',
    description: 'Architecture agent knowledge base - AI research, system patterns, best practices',
    vectorSize: 1536,
    distance: 'Cosine' as const,
    payloadIndexes: [
      { field: 'category', type: 'keyword' as const },
      { field: 'source', type: 'keyword' as const },
      { field: 'importance', type: 'float' as const },
      { field: 'created_at', type: 'integer' as const },
    ],
  },
  {
    name: 'conversation_knowledge',
    description: 'Conversation AI agent knowledge base - conversation strategies, objection handling, scripts',
    vectorSize: 1536,
    distance: 'Cosine' as const,
    payloadIndexes: [
      { field: 'category', type: 'keyword' as const },
      { field: 'conversation_type', type: 'keyword' as const },
      { field: 'success_rate', type: 'float' as const },
      { field: 'sentiment', type: 'keyword' as const },
    ],
  },
  {
    name: 'sales_knowledge',
    description: 'Sales & Marketing agent knowledge base - market trends, campaigns, competitor analysis',
    vectorSize: 1536,
    distance: 'Cosine' as const,
    payloadIndexes: [
      { field: 'category', type: 'keyword' as const },
      { field: 'market', type: 'keyword' as const },
      { field: 'effectiveness', type: 'float' as const },
      { field: 'date', type: 'integer' as const },
    ],
  },
  {
    name: 'realty_knowledge',
    description: 'Realty Expert agent knowledge base - property strategies, regulations, valuation methods',
    vectorSize: 1536,
    distance: 'Cosine' as const,
    payloadIndexes: [
      { field: 'category', type: 'keyword' as const },
      { field: 'strategy', type: 'keyword' as const },
      { field: 'compliance_required', type: 'keyword' as const },
      { field: 'region', type: 'keyword' as const },
    ],
  },
  {
    name: 'market_intelligence',
    description: 'Market intelligence data - property comps, trends, neighborhood data',
    vectorSize: 1536,
    distance: 'Cosine' as const,
    payloadIndexes: [
      { field: 'location', type: 'keyword' as const },
      { field: 'property_type', type: 'keyword' as const },
      { field: 'date', type: 'integer' as const },
      { field: 'price_range', type: 'keyword' as const },
    ],
  },
  {
    name: 'call_transcripts',
    description: 'Call transcripts for continuous learning and improvement',
    vectorSize: 1536,
    distance: 'Cosine' as const,
    payloadIndexes: [
      { field: 'outcome', type: 'keyword' as const },
      { field: 'sentiment', type: 'keyword' as const },
      { field: 'call_date', type: 'integer' as const },
      { field: 'lead_quality', type: 'keyword' as const },
    ],
  },
];

/**
 * Initialize Qdrant collections
 */
async function initQdrant(): Promise<void> {
  try {
    logger.info('Starting Qdrant initialization...');

    // Initialize Qdrant client
    const qdrant = QdrantClient.getInstance({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
    });

    // Health check
    const isHealthy = await qdrant.healthCheck();
    if (!isHealthy) {
      throw new Error('Qdrant is not healthy. Please check the connection.');
    }

    logger.info('Qdrant connection verified');

    // Create collections
    for (const collection of COLLECTIONS) {
      logger.info(`Creating collection: ${collection.name}`);
      logger.info(`  Description: ${collection.description}`);
      logger.info(`  Vector size: ${collection.vectorSize}`);
      logger.info(`  Distance: ${collection.distance}`);

      await qdrant.createCollection(
        collection.name,
        collection.vectorSize,
        collection.distance
      );

      // Create payload indexes
      for (const index of collection.payloadIndexes) {
        logger.info(`  Creating payload index: ${index.field} (${index.type})`);
        await qdrant.createPayloadIndex(
          collection.name,
          index.field,
          index.type
        );
      }

      logger.info(`Collection ${collection.name} created successfully`);
    }

    // Verify all collections
    logger.info('\nVerifying collections...');
    for (const collection of COLLECTIONS) {
      const info = await qdrant.getCollectionInfo(collection.name);
      logger.info(`${collection.name}: ${info.vectors_count || 0} vectors`);
    }

    logger.info('\nQdrant initialization completed successfully!');
    logger.info(`Total collections created: ${COLLECTIONS.length}`);
    logger.info('\nCollection names:');
    COLLECTIONS.forEach(c => logger.info(`  - ${c.name}`));

  } catch (error) {
    logger.error('Failed to initialize Qdrant', { error });
    throw error;
  }
}

/**
 * Main execution
 */
if (require.main === module) {
  initQdrant()
    .then(() => {
      logger.info('Initialization complete. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Initialization failed', { error });
      process.exit(1);
    });
}

export { initQdrant };
