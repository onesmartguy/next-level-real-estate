import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 * Must be registered after all routes
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.userId,
  });

  // Handle known AppError instances
  if (error instanceof AppError) {
    const errorResponse: any = {
      success: false,
      error: {
        code: error.code || 'APPLICATION_ERROR',
        message: error.message,
      },
    };

    if (error.details) {
      errorResponse.error.details = error.details;
    }

    res.status(error.statusCode).json(errorResponse);
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      },
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
      },
    });
    return;
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
      },
    });
    return;
  }

  // Handle MongoDB duplicate key errors
  if ((error as any).code === 11000) {
    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_RESOURCE',
        message: 'A resource with this identifier already exists',
      },
    });
    return;
  }

  // Handle axios errors (from microservice calls)
  if ((error as any).isAxiosError) {
    const axiosError = error as any;
    const status = axiosError.response?.status || 500;
    const message = axiosError.response?.data?.message || 'Error communicating with downstream service';

    res.status(status).json({
      success: false,
      error: {
        code: 'DOWNSTREAM_SERVICE_ERROR',
        message,
      },
    });
    return;
  }

  // Default to 500 Internal Server Error for unknown errors
  const defaultErrorResponse: any = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  };

  // Only include error details in development
  if (process.env.NODE_ENV === 'development') {
    defaultErrorResponse.error.details = {
      message: error.message,
      stack: error.stack,
    };
  }

  res.status(500).json(defaultErrorResponse);
};

/**
 * 404 Not Found handler
 * Should be registered after all routes but before error handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
