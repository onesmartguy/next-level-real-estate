import { Router } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import config from '../config';
import logger from '../utils/logger';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * Common proxy configuration
 */
const createProxyConfig = (target: string, pathRewrite?: Record<string, string>): Options => ({
  target,
  changeOrigin: true,
  pathRewrite,
  timeout: config.requestTimeout,
  on: {
    error: (err: any, req: any, res: any) => {
      logger.error('Proxy error', {
        error: err.message,
        target,
        path: req.url,
        method: req.method,
      });

      if (!res.headersSent) {
        res.status(502).json({
          success: false,
          error: {
            code: 'PROXY_ERROR',
            message: 'Error communicating with downstream service',
          },
        });
      }
    },
    proxyReq: (proxyReq: any, req: any, _res: any) => {
      // Forward user information to downstream services
      const user = (req as any).user;
      if (user) {
        proxyReq.setHeader('X-User-ID', user.userId);
        proxyReq.setHeader('X-User-Email', user.email);
        proxyReq.setHeader('X-User-Role', user.role);
      }

      // Forward request ID
      const requestId = (req as any).id;
      if (requestId) {
        proxyReq.setHeader('X-Request-ID', requestId);
      }

      logger.debug('Proxying request', {
        target,
        path: req.url,
        method: req.method,
        userId: user?.userId,
      });
    },
    proxyRes: (proxyRes: any, req: any, _res: any) => {
      logger.debug('Proxy response', {
        target,
        path: req.url,
        method: req.method,
        statusCode: proxyRes.statusCode,
      });
    },
  },
});

/**
 * Lead Service Routes
 * /api/v1/leads/*
 */
router.use(
  '/leads',
  authenticate,
  createProxyMiddleware(
    createProxyConfig(config.services.lead, {
      '^/api/v1/leads': '/api/v1/leads',
    })
  )
);

/**
 * Campaign Service Routes
 * /api/v1/campaigns/*
 */
router.use(
  '/campaigns',
  authenticate,
  createProxyMiddleware(
    createProxyConfig(config.services.campaign, {
      '^/api/v1/campaigns': '/api/v1/campaigns',
    })
  )
);

/**
 * Call Service Routes
 * /api/v1/calls/*
 */
router.use(
  '/calls',
  authenticate,
  createProxyMiddleware(
    createProxyConfig(config.services.call, {
      '^/api/v1/calls': '/api/v1/calls',
    })
  )
);

/**
 * Analytics Service Routes
 * /api/v1/analytics/*
 */
router.use(
  '/analytics',
  authenticate,
  createProxyMiddleware(
    createProxyConfig(config.services.analytics, {
      '^/api/v1/analytics': '/api/v1/analytics',
    })
  )
);

export default router;
