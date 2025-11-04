import request from 'supertest';
import express, { Application } from 'express';
import healthRouter from '../../routes/health';

// Mock Redis client
jest.mock('../../utils/redis-client', () => ({
  default: {
    getInstance: jest.fn(() => ({
      ping: jest.fn().mockResolvedValue('PONG'),
    })),
  },
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Health Check Routes', () => {
  let app: Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/health', healthRouter);
  });

  describe('GET /health', () => {
    it('should return healthy status when all services are up', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        services: {
          redis: {
            status: 'up',
          },
        },
      });
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThan(0);
      expect(response.body.version).toBeDefined();
      expect(response.body.environment).toBeDefined();
    });

    it('should return degraded status when Redis is down', async () => {
      const RedisClient = require('../../utils/redis-client').default;
      RedisClient.getInstance.mockImplementationOnce(() => ({
        ping: jest.fn().mockRejectedValue(new Error('Connection refused')),
      }));

      const response = await request(app).get('/health').expect(200);

      expect(response.body).toMatchObject({
        status: 'degraded',
        services: {
          redis: {
            status: 'down',
          },
        },
      });
    });

    it('should include latency for Redis when available', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body.services.redis.latency).toBeDefined();
      expect(typeof response.body.services.redis.latency).toBe('number');
    });
  });

  describe('GET /health/ready', () => {
    it('should return ready when Redis is available', async () => {
      const response = await request(app).get('/health/ready').expect(200);

      expect(response.body).toMatchObject({
        ready: true,
      });
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return not ready when Redis is unavailable', async () => {
      const RedisClient = require('../../utils/redis-client').default;
      RedisClient.getInstance.mockImplementationOnce(() => ({
        ping: jest.fn().mockRejectedValue(new Error('Connection refused')),
      }));

      const response = await request(app).get('/health/ready').expect(503);

      expect(response.body).toMatchObject({
        ready: false,
        error: 'Redis connection failed',
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /health/live', () => {
    it('should always return alive', async () => {
      const response = await request(app).get('/health/live').expect(200);

      expect(response.body).toMatchObject({
        alive: true,
      });
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return alive even if Redis is down', async () => {
      const RedisClient = require('../../utils/redis-client').default;
      RedisClient.getInstance.mockImplementationOnce(() => ({
        ping: jest.fn().mockRejectedValue(new Error('Connection refused')),
      }));

      const response = await request(app).get('/health/live').expect(200);

      expect(response.body).toMatchObject({
        alive: true,
      });
    });
  });
});
