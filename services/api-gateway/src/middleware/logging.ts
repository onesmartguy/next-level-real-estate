import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import logger from '../utils/logger';
import config from '../config';

/**
 * Custom token for morgan to log user ID
 */
morgan.token('user-id', (req: any) => {
  return req.user?.userId || 'anonymous';
});

/**
 * Custom token for morgan to log request ID (if available)
 */
morgan.token('request-id', (req: any) => {
  return req.id || '-';
});

/**
 * Custom format for morgan
 */
const morganFormat =
  ':method :url :status :response-time ms - :res[content-length] bytes - user: :user-id - req-id: :request-id';

/**
 * Stream for morgan to use winston logger
 */
const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

/**
 * Morgan middleware for HTTP request logging
 */
export const httpLogger = morgan(morganFormat, {
  stream,
  skip: (req: Request) => {
    // Skip logging for health check in production
    return config.env === 'production' && req.path === '/health';
  },
});

/**
 * Request ID middleware - adds unique ID to each request
 */
export const requestId = (req: any, res: Response, next: NextFunction): void => {
  req.id = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  res.setHeader('X-Request-ID', req.id);
  next();
};

/**
 * Request timing middleware - adds timing information
 */
export const requestTiming = (req: any, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Log slow requests (> 1 second)
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration,
        statusCode: res.statusCode,
        userId: req.user?.userId,
        requestId: req.id,
      });
    }
  });

  next();
};

/**
 * Request body logger (for debugging - use sparingly)
 */
export const logRequestBody = (req: Request, res: Response, next: NextFunction): void => {
  if (config.env === 'development' && Object.keys(req.body || {}).length > 0) {
    logger.debug('Request body', {
      method: req.method,
      url: req.url,
      body: req.body,
    });
  }
  next();
};
