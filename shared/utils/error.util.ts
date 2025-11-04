import { logger } from './logger';

/**
 * Base application error
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(
    message: string,
    statusCode = 500,
    isOperational = true,
    code?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    Error.captureStackTrace(this);
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message, 400, true, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, true, 'NOT_FOUND');
  }
}

/**
 * Unauthorized error
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, true, 'UNAUTHORIZED');
  }
}

/**
 * Forbidden error
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, true, 'FORBIDDEN');
  }
}

/**
 * Conflict error
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true, 'CONFLICT');
  }
}

/**
 * Database error
 */
export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, 500, false, 'DATABASE_ERROR');
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(service: string, message: string, originalError?: Error) {
    super(message, 502, true, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

/**
 * TCPA compliance error
 */
export class TCPAComplianceError extends AppError {
  constructor(message: string) {
    super(message, 400, true, 'TCPA_COMPLIANCE_ERROR');
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, true, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * Error handler utility
 */
export class ErrorHandler {
  /**
   * Handle error and log appropriately
   */
  public static handle(error: Error | AppError): void {
    if (error instanceof AppError) {
      if (error.isOperational) {
        logger.warn('Operational error occurred', {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
        });
      } else {
        logger.error('Non-operational error occurred', {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
          stack: error.stack,
        });
      }
    } else {
      logger.error('Unexpected error occurred', {
        message: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Check if error is operational
   */
  public static isOperational(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  }

  /**
   * Convert error to API response format
   */
  public static toResponse(error: Error | AppError): {
    success: false;
    error: {
      code?: string;
      message: string;
      statusCode: number;
      details?: any;
    };
  } {
    if (error instanceof AppError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
          details: error instanceof ValidationError ? error.errors : undefined,
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : error.message,
        statusCode: 500,
      },
    };
  }
}

/**
 * Async error wrapper for request handlers
 */
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      ErrorHandler.handle(error as Error);
      throw error;
    }
  };
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    multiplier?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    multiplier = 2,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        break;
      }

      const delay = Math.min(initialDelay * Math.pow(multiplier, attempt - 1), maxDelay);

      if (onRetry) {
        onRetry(attempt, lastError);
      } else {
        logger.warn(`Retry attempt ${attempt} after ${delay}ms`, {
          error: lastError.message,
        });
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
