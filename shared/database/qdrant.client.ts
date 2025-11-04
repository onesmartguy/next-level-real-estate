import { QdrantClient as QdrantSDK } from '@qdrant/js-client-rest';
import { logger } from '../utils/logger';

/**
 * Qdrant configuration
 */
export interface QdrantConfig {
  url: string;
  apiKey?: string;
  timeout?: number;
  grpcPort?: number;
}

/**
 * Vector search parameters
 */
export interface VectorSearchParams {
  vector: number[];
  limit?: number;
  scoreThreshold?: number;
  filter?: Record<string, any>;
  withPayload?: boolean;
  withVector?: boolean;
}

/**
 * Point (vector document) structure
 */
export interface VectorPoint {
  id: string | number;
  vector: number[];
  payload?: Record<string, any>;
}

/**
 * Qdrant client wrapper for vector database operations
 * Supports semantic search and RAG (Retrieval Augmented Generation)
 */
export class QdrantClient {
  private static instance: QdrantClient;
  private client: QdrantSDK;
  private config: QdrantConfig;

  private constructor(config: QdrantConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };

    this.client = new QdrantSDK({
      url: this.config.url,
      apiKey: this.config.apiKey,
      timeout: this.config.timeout,
    });

    logger.info('Qdrant client initialized', {
      url: this.config.url,
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: QdrantConfig): QdrantClient {
    if (!QdrantClient.instance) {
      if (!config) {
        throw new Error('Qdrant configuration required for first initialization');
      }
      QdrantClient.instance = new QdrantClient(config);
    }
    return QdrantClient.instance;
  }

  /**
   * Create a collection
   */
  public async createCollection(
    collectionName: string,
    vectorSize: number,
    distance: 'Cosine' | 'Euclid' | 'Dot' = 'Cosine'
  ): Promise<void> {
    try {
      const exists = await this.collectionExists(collectionName);

      if (exists) {
        logger.info(`Collection ${collectionName} already exists`);
        return;
      }

      await this.client.createCollection(collectionName, {
        vectors: {
          size: vectorSize,
          distance,
        },
      });

      logger.info(`Created Qdrant collection: ${collectionName}`, {
        vectorSize,
        distance,
      });
    } catch (error) {
      logger.error(`Failed to create collection: ${collectionName}`, { error });
      throw error;
    }
  }

  /**
   * Check if collection exists
   */
  public async collectionExists(collectionName: string): Promise<boolean> {
    try {
      const collections = await this.client.getCollections();
      return collections.collections.some(c => c.name === collectionName);
    } catch (error) {
      logger.error(`Failed to check collection existence: ${collectionName}`, { error });
      return false;
    }
  }

  /**
   * Delete a collection
   */
  public async deleteCollection(collectionName: string): Promise<void> {
    try {
      await this.client.deleteCollection(collectionName);
      logger.info(`Deleted Qdrant collection: ${collectionName}`);
    } catch (error) {
      logger.error(`Failed to delete collection: ${collectionName}`, { error });
      throw error;
    }
  }

  /**
   * Upsert points (vectors) into collection
   */
  public async upsertPoints(
    collectionName: string,
    points: VectorPoint[]
  ): Promise<void> {
    try {
      await this.client.upsert(collectionName, {
        wait: true,
        points: points.map(p => ({
          id: p.id,
          vector: p.vector,
          payload: p.payload || {},
        })),
      });

      logger.debug(`Upserted ${points.length} points to collection: ${collectionName}`);
    } catch (error) {
      logger.error(`Failed to upsert points to collection: ${collectionName}`, { error });
      throw error;
    }
  }

  /**
   * Search for similar vectors
   */
  public async search(
    collectionName: string,
    params: VectorSearchParams
  ): Promise<any[]> {
    try {
      const {
        vector,
        limit = 10,
        scoreThreshold = 0.7,
        filter,
        withPayload = true,
        withVector = false,
      } = params;

      const results = await this.client.search(collectionName, {
        vector,
        limit,
        score_threshold: scoreThreshold,
        filter,
        with_payload: withPayload,
        with_vector: withVector,
      });

      logger.debug(`Vector search in ${collectionName} returned ${results.length} results`);

      return results;
    } catch (error) {
      logger.error(`Failed to search in collection: ${collectionName}`, { error });
      throw error;
    }
  }

  /**
   * Get point by ID
   */
  public async getPoint(
    collectionName: string,
    pointId: string | number
  ): Promise<any> {
    try {
      const result = await this.client.retrieve(collectionName, {
        ids: [pointId],
        with_payload: true,
        with_vector: true,
      });

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      logger.error(`Failed to get point ${pointId} from collection: ${collectionName}`, { error });
      throw error;
    }
  }

  /**
   * Delete points by IDs
   */
  public async deletePoints(
    collectionName: string,
    pointIds: (string | number)[]
  ): Promise<void> {
    try {
      await this.client.delete(collectionName, {
        wait: true,
        points: pointIds,
      });

      logger.debug(`Deleted ${pointIds.length} points from collection: ${collectionName}`);
    } catch (error) {
      logger.error(`Failed to delete points from collection: ${collectionName}`, { error });
      throw error;
    }
  }

  /**
   * Delete points by filter
   */
  public async deleteByFilter(
    collectionName: string,
    filter: Record<string, any>
  ): Promise<void> {
    try {
      await this.client.delete(collectionName, {
        wait: true,
        filter,
      });

      logger.debug(`Deleted points by filter from collection: ${collectionName}`);
    } catch (error) {
      logger.error(`Failed to delete by filter from collection: ${collectionName}`, { error });
      throw error;
    }
  }

  /**
   * Get collection info
   */
  public async getCollectionInfo(collectionName: string): Promise<any> {
    try {
      return await this.client.getCollection(collectionName);
    } catch (error) {
      logger.error(`Failed to get collection info: ${collectionName}`, { error });
      throw error;
    }
  }

  /**
   * Count points in collection
   */
  public async countPoints(
    collectionName: string,
    filter?: Record<string, any>
  ): Promise<number> {
    try {
      const result = await this.client.count(collectionName, {
        filter,
        exact: true,
      });

      return result.count;
    } catch (error) {
      logger.error(`Failed to count points in collection: ${collectionName}`, { error });
      throw error;
    }
  }

  /**
   * Create payload index for filtering
   */
  public async createPayloadIndex(
    collectionName: string,
    fieldName: string,
    fieldType: 'keyword' | 'integer' | 'float' | 'geo' | 'text' = 'keyword'
  ): Promise<void> {
    try {
      await this.client.createPayloadIndex(collectionName, {
        field_name: fieldName,
        field_schema: fieldType,
      });

      logger.info(`Created payload index on ${fieldName} in collection: ${collectionName}`);
    } catch (error) {
      logger.error(`Failed to create payload index in collection: ${collectionName}`, { error });
      throw error;
    }
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.client.getCollections();
      return true;
    } catch (error) {
      logger.error('Qdrant health check failed', { error });
      return false;
    }
  }
}

/**
 * Initialize Qdrant with environment variables
 */
export function initQdrant(config?: QdrantConfig): QdrantClient {
  const qdrantConfig: QdrantConfig = config || {
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey: process.env.QDRANT_API_KEY,
    timeout: parseInt(process.env.QDRANT_TIMEOUT || '30000'),
  };

  return QdrantClient.getInstance(qdrantConfig);
}
