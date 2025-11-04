import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import config from '../config';
import RedisClient from '../utils/redis-client';
import logger from '../utils/logger';

/**
 * Standard rate limiter for general API endpoints
 * 100 requests per minute per IP by default
 */
export const standardRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - RedisStore types are not compatible with ioredis
    sendCommand: (...args: string[]) => RedisClient.getInstance().call(...args),
    prefix: 'rl:standard:',
  }),
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
      },
    });
  },
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/health';
  },
});

/**
 * Strict rate limiter for sensitive endpoints (auth, etc.)
 * 20 requests per minute per IP
 */
export const strictRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: Math.floor(config.rateLimit.maxRequests / 5), // 20% of standard limit
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - RedisStore types are not compatible with ioredis
    sendCommand: (...args: string[]) => RedisClient.getInstance().call(...args),
    prefix: 'rl:strict:',
  }),
  handler: (req, res) => {
    logger.warn('Strict rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests to sensitive endpoint, please try again later',
        retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
      },
    });
  },
});

/**
 * Lenient rate limiter for public endpoints
 * 500 requests per minute per IP
 */
export const lenientRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests * 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - RedisStore types are not compatible with ioredis
    sendCommand: (...args: string[]) => RedisClient.getInstance().call(...args),
    prefix: 'rl:lenient:',
  }),
  handler: (req, res) => {
    logger.warn('Lenient rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
      },
    });
  },
});
