/**
 * Multi-tier prompt caching manager
 */

import Redis from 'ioredis';
import { logger } from './logger';
import { CacheTier } from './types';

export interface CacheEntry {
  value: string;
  tier: CacheTier;
  createdAt: Date;
  expiresAt: Date;
}

export class PromptCacheManager {
  private redis: Redis;
  private readonly prefix = 'prompt-cache:';

  // TTL values in seconds
  private readonly ttlMap: Record<CacheTier, number> = {
    [CacheTier.STATIC]: 3600, // 1 hour for batches
    [CacheTier.SEMI_STATIC]: 300, // 5 minutes
    [CacheTier.DYNAMIC]: 0, // No caching
  };

  constructor(redisUrl?: string) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');

    this.redis.on('error', (error) => {
      logger.error('Redis connection error', { error });
    });

    this.redis.on('connect', () => {
      logger.info('Connected to Redis for prompt caching');
    });
  }

  /**
   * Get cached value
   */
  async get(key: string): Promise<string | null> {
    try {
      const cacheKey = this.prefix + key;
      const value = await this.redis.get(cacheKey);

      if (value) {
        logger.debug('Cache hit', { key, cached: true });
        return value;
      }

      logger.debug('Cache miss', { key, cached: false });
      return null;
    } catch (error) {
      logger.error('Cache get error', { error, key });
      return null; // Fail gracefully
    }
  }

  /**
   * Set cached value with tier-based TTL
   */
  async set(key: string, value: string, tier: CacheTier): Promise<void> {
    try {
      if (tier === CacheTier.DYNAMIC) {
        // Don't cache dynamic content
        return;
      }

      const cacheKey = this.prefix + key;
      const ttl = this.ttlMap[tier];

      await this.redis.setex(cacheKey, ttl, value);

      logger.debug('Cache set', {
        key,
        tier,
        ttl,
        valueLength: value.length,
      });
    } catch (error) {
      logger.error('Cache set error', { error, key });
      // Fail gracefully - don't throw
    }
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<void> {
    try {
      const cacheKey = this.prefix + key;
      await this.redis.del(cacheKey);
      logger.debug('Cache deleted', { key });
    } catch (error) {
      logger.error('Cache delete error', { error, key });
    }
  }

  /**
   * Clear all cached values for a tier
   */
  async clearTier(tier: CacheTier): Promise<void> {
    try {
      const pattern = `${this.prefix}*:${tier}:*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.info('Cache tier cleared', { tier, keysDeleted: keys.length });
      }
    } catch (error) {
      logger.error('Cache clear tier error', { error, tier });
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsed: string;
    hitRate: number;
  }> {
    try {
      const info = await this.redis.info('stats');
      const memInfo = await this.redis.info('memory');

      // Parse Redis INFO output
      const parseInfo = (infoStr: string): Record<string, string> => {
        const result: Record<string, string> = {};
        infoStr.split('\r\n').forEach((line) => {
          if (line && !line.startsWith('#')) {
            const [key, value] = line.split(':');
            if (key && value) {
              result[key] = value;
            }
          }
        });
        return result;
      };

      const stats = parseInfo(info);
      const memStats = parseInfo(memInfo);

      const hits = parseInt(stats.keyspace_hits || '0', 10);
      const misses = parseInt(stats.keyspace_misses || '0', 10);
      const hitRate = hits + misses > 0 ? hits / (hits + misses) : 0;

      const keys = await this.redis.keys(`${this.prefix}*`);

      return {
        totalKeys: keys.length,
        memoryUsed: memStats.used_memory_human || 'N/A',
        hitRate: Math.round(hitRate * 100) / 100,
      };
    } catch (error) {
      logger.error('Failed to get cache stats', { error });
      return {
        totalKeys: 0,
        memoryUsed: 'N/A',
        hitRate: 0,
      };
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
    logger.info('Prompt cache manager closed');
  }

  /**
   * Generate cache key for agent prompts
   */
  static generateKey(agentId: string, promptType: string, version: string): string {
    return `${agentId}:${promptType}:${version}`;
  }
}
