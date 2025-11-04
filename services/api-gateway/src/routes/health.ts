import { Router, Request, Response } from 'express';
import RedisClient from '../utils/redis-client';
import logger from '../utils/logger';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    redis: {
      status: 'up' | 'down';
      latency?: number;
    };
  };
  version: string;
  environment: string;
}

/**
 * GET /health
 * Health check endpoint - returns service status
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const redis = RedisClient.getInstance();

    // Check Redis connection
    let redisStatus: 'up' | 'down' = 'down';
    let redisLatency: number | undefined;

    try {
      const pingStart = Date.now();
      await redis.ping();
      redisLatency = Date.now() - pingStart;
      redisStatus = 'up';
    } catch (error) {
      logger.error('Redis health check failed:', error);
      redisStatus = 'down';
    }

    const overallStatus: 'healthy' | 'degraded' | 'unhealthy' =
      redisStatus === 'up' ? 'healthy' : 'degraded';

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        redis: {
          status: redisStatus,
          ...(redisLatency !== undefined && { latency: redisLatency }),
        },
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    res.status(statusCode).json(response);
  })
);

/**
 * GET /health/ready
 * Readiness check - indicates if service is ready to accept traffic
 */
router.get(
  '/ready',
  asyncHandler(async (_req: Request, res: Response) => {
    const redis = RedisClient.getInstance();

    try {
      await redis.ping();
      res.status(200).json({
        ready: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Readiness check failed:', error);
      res.status(503).json({
        ready: false,
        timestamp: new Date().toISOString(),
        error: 'Redis connection failed',
      });
    }
  })
);

/**
 * GET /health/live
 * Liveness check - indicates if service is alive (basic check)
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
  });
});

export default router;
