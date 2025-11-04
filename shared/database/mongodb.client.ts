import { MongoClient, Db, Collection, CreateIndexesOptions, IndexSpecification } from 'mongodb';
import { logger } from '../utils/logger';

/**
 * MongoDB connection configuration
 */
export interface MongoDBConfig {
  uri: string;
  database: string;
  maxPoolSize?: number;
  minPoolSize?: number;
  maxIdleTimeMS?: number;
  serverSelectionTimeoutMS?: number;
  socketTimeoutMS?: number;
  retryWrites?: boolean;
  retryReads?: boolean;
}

/**
 * MongoDB client wrapper with connection pooling
 * Implements singleton pattern for efficient connection management
 */
export class MongoDBClient {
  private static instance: MongoDBClient;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private config: MongoDBConfig;
  private isConnecting = false;

  private constructor(config: MongoDBConfig) {
    this.config = {
      maxPoolSize: 50,
      minPoolSize: 10,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
      ...config,
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: MongoDBConfig): MongoDBClient {
    if (!MongoDBClient.instance) {
      if (!config) {
        throw new Error('MongoDB configuration required for first initialization');
      }
      MongoDBClient.instance = new MongoDBClient(config);
    }
    return MongoDBClient.instance;
  }

  /**
   * Connect to MongoDB
   */
  public async connect(): Promise<void> {
    if (this.client && this.db) {
      logger.debug('MongoDB already connected');
      return;
    }

    if (this.isConnecting) {
      logger.debug('MongoDB connection in progress, waiting...');
      await this.waitForConnection();
      return;
    }

    this.isConnecting = true;

    try {
      logger.info('Connecting to MongoDB...', {
        database: this.config.database,
        maxPoolSize: this.config.maxPoolSize,
      });

      this.client = new MongoClient(this.config.uri, {
        maxPoolSize: this.config.maxPoolSize,
        minPoolSize: this.config.minPoolSize,
        maxIdleTimeMS: this.config.maxIdleTimeMS,
        serverSelectionTimeoutMS: this.config.serverSelectionTimeoutMS,
        socketTimeoutMS: this.config.socketTimeoutMS,
        retryWrites: this.config.retryWrites,
        retryReads: this.config.retryReads,
      });

      await this.client.connect();
      this.db = this.client.db(this.config.database);

      // Test connection
      await this.db.admin().ping();

      logger.info('MongoDB connected successfully', {
        database: this.config.database,
      });
    } catch (error) {
      logger.error('Failed to connect to MongoDB', { error });
      this.client = null;
      this.db = null;
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Wait for connection to complete
   */
  private async waitForConnection(timeoutMs = 10000): Promise<void> {
    const startTime = Date.now();
    while (this.isConnecting) {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error('MongoDB connection timeout');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Disconnect from MongoDB
   */
  public async disconnect(): Promise<void> {
    if (!this.client) {
      logger.debug('MongoDB not connected');
      return;
    }

    try {
      logger.info('Disconnecting from MongoDB...');
      await this.client.close();
      this.client = null;
      this.db = null;
      logger.info('MongoDB disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB', { error });
      throw error;
    }
  }

  /**
   * Get database instance
   */
  public getDb(): Db {
    if (!this.db) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }
    return this.db;
  }

  /**
   * Get collection
   */
  public getCollection<T = any>(name: string): Collection<T> {
    return this.getDb().collection<T>(name);
  }

  /**
   * Create indexes for a collection
   */
  public async createIndexes(
    collectionName: string,
    indexes: { key: IndexSpecification; unique?: boolean; sparse?: boolean; partialFilterExpression?: any }[],
    options?: CreateIndexesOptions
  ): Promise<void> {
    try {
      const collection = this.getCollection(collectionName);

      const indexSpecs = indexes.map(({ key, unique, sparse, partialFilterExpression }) => ({
        key,
        unique,
        sparse,
        partialFilterExpression,
      }));

      await collection.createIndexes(indexSpecs, options);

      logger.info(`Created ${indexes.length} indexes for collection: ${collectionName}`);
    } catch (error) {
      logger.error(`Failed to create indexes for collection: ${collectionName}`, { error });
      throw error;
    }
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.db) {
        return false;
      }
      await this.db.admin().ping();
      return true;
    } catch (error) {
      logger.error('MongoDB health check failed', { error });
      return false;
    }
  }

  /**
   * Get connection stats
   */
  public async getStats(): Promise<any> {
    try {
      if (!this.db) {
        throw new Error('MongoDB not connected');
      }
      return await this.db.stats();
    } catch (error) {
      logger.error('Failed to get MongoDB stats', { error });
      throw error;
    }
  }
}

/**
 * Initialize MongoDB with environment variables
 */
export function initMongoDB(config?: MongoDBConfig): MongoDBClient {
  const mongoConfig: MongoDBConfig = config || {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    database: process.env.MONGODB_DATABASE || 'next_level_real_estate',
    maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '50'),
    minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '10'),
  };

  return MongoDBClient.getInstance(mongoConfig);
}
