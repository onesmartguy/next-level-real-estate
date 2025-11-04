import Redis, { RedisOptions } from 'ioredis';
import { logger } from '../utils/logger';

/**
 * Redis configuration
 */
export interface RedisConfig extends RedisOptions {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  maxRetriesPerRequest?: number;
  enableReadyCheck?: boolean;
  enableOfflineQueue?: boolean;
}

/**
 * Cache entry options
 */
export interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

/**
 * Redis client wrapper for caching
 * Supports standard caching patterns with TTL and prefixes
 */
export class RedisClient {
  private static instance: RedisClient;
  private client: Redis;
  private config: RedisConfig;

  private constructor(config: RedisConfig) {
    this.config = {
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        logger.warn(`Redis retry attempt ${times}, waiting ${delay}ms`);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: true,
      ...config,
    };

    this.client = new Redis(this.config);

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready', {
        host: this.config.host,
        port: this.config.port,
        db: this.config.db,
      });
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error', { error });
    });

    this.client.on('close', () => {
      logger.warn('Redis connection closed');
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: RedisConfig): RedisClient {
    if (!RedisClient.instance) {
      if (!config) {
        throw new Error('Redis configuration required for first initialization');
      }
      RedisClient.instance = new RedisClient(config);
    }
    return RedisClient.instance;
  }

  /**
   * Get the underlying Redis client
   */
  public getClient(): Redis {
    return this.client;
  }

  /**
   * Build cache key with prefix
   */
  private buildKey(key: string, prefix?: string): string {
    const finalPrefix = prefix || this.config.keyPrefix || '';
    return finalPrefix ? `${finalPrefix}:${key}` : key;
  }

  /**
   * Set cache value
   */
  public async set(
    key: string,
    value: any,
    options?: CacheOptions
  ): Promise<void> {
    try {
      const finalKey = this.buildKey(key, options?.prefix);
      const serialized = JSON.stringify(value);

      if (options?.ttl) {
        await this.client.setex(finalKey, options.ttl, serialized);
      } else {
        await this.client.set(finalKey, serialized);
      }

      logger.debug(`Cache set: ${finalKey}`, { ttl: options?.ttl });
    } catch (error) {
      logger.error(`Failed to set cache for key: ${key}`, { error });
      throw error;
    }
  }

  /**
   * Get cache value
   */
  public async get<T = any>(
    key: string,
    options?: CacheOptions
  ): Promise<T | null> {
    try {
      const finalKey = this.buildKey(key, options?.prefix);
      const value = await this.client.get(finalKey);

      if (!value) {
        logger.debug(`Cache miss: ${finalKey}`);
        return null;
      }

      logger.debug(`Cache hit: ${finalKey}`);
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Failed to get cache for key: ${key}`, { error });
      throw error;
    }
  }

  /**
   * Delete cache value
   */
  public async delete(key: string, options?: CacheOptions): Promise<void> {
    try {
      const finalKey = this.buildKey(key, options?.prefix);
      await this.client.del(finalKey);
      logger.debug(`Cache deleted: ${finalKey}`);
    } catch (error) {
      logger.error(`Failed to delete cache for key: ${key}`, { error });
      throw error;
    }
  }

  /**
   * Check if key exists
   */
  public async exists(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const finalKey = this.buildKey(key, options?.prefix);
      const result = await this.client.exists(finalKey);
      return result === 1;
    } catch (error) {
      logger.error(`Failed to check existence for key: ${key}`, { error });
      throw error;
    }
  }

  /**
   * Set expiration on key
   */
  public async expire(
    key: string,
    ttl: number,
    options?: CacheOptions
  ): Promise<void> {
    try {
      const finalKey = this.buildKey(key, options?.prefix);
      await this.client.expire(finalKey, ttl);
      logger.debug(`Set expiration on ${finalKey}: ${ttl}s`);
    } catch (error) {
      logger.error(`Failed to set expiration for key: ${key}`, { error });
      throw error;
    }
  }

  /**
   * Get keys by pattern
   */
  public async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error(`Failed to get keys by pattern: ${pattern}`, { error });
      throw error;
    }
  }

  /**
   * Delete keys by pattern
   */
  public async deleteByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      await this.client.del(...keys);
      logger.debug(`Deleted ${keys.length} keys matching pattern: ${pattern}`);
      return keys.length;
    } catch (error) {
      logger.error(`Failed to delete keys by pattern: ${pattern}`, { error });
      throw error;
    }
  }

  /**
   * Increment counter
   */
  public async increment(
    key: string,
    options?: CacheOptions
  ): Promise<number> {
    try {
      const finalKey = this.buildKey(key, options?.prefix);
      return await this.client.incr(finalKey);
    } catch (error) {
      logger.error(`Failed to increment key: ${key}`, { error });
      throw error;
    }
  }

  /**
   * Decrement counter
   */
  public async decrement(
    key: string,
    options?: CacheOptions
  ): Promise<number> {
    try {
      const finalKey = this.buildKey(key, options?.prefix);
      return await this.client.decr(finalKey);
    } catch (error) {
      logger.error(`Failed to decrement key: ${key}`, { error });
      throw error;
    }
  }

  /**
   * Flush all cache
   */
  public async flush(): Promise<void> {
    try {
      await this.client.flushdb();
      logger.warn('Flushed all Redis cache');
    } catch (error) {
      logger.error('Failed to flush cache', { error });
      throw error;
    }
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed', { error });
      return false;
    }
  }

  /**
   * Disconnect
   */
  public async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      logger.info('Redis client disconnected');
    } catch (error) {
      logger.error('Failed to disconnect Redis client', { error });
      throw error;
    }
  }
}

/**
 * Initialize Redis with environment variables
 */
export function initRedis(config?: RedisConfig): RedisClient {
  const redisConfig: RedisConfig = config || {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'nlre',
  };

  return RedisClient.getInstance(redisConfig);
}
