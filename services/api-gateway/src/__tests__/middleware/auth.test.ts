import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, authorize, optionalAuth, JWTPayload, AuthenticatedRequest } from '../../middleware/auth';
import config from '../../config';

// Mock config
jest.mock('../../config', () => ({
  default: {
    jwt: {
      secret: 'test-secret',
      expiresIn: '24h',
      issuer: 'test-issuer',
    },
  },
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  default: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Authentication Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  describe('authenticate', () => {
    it('should authenticate valid JWT token', () => {
      const payload: JWTPayload = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'admin',
      };

      const token = jwt.sign(payload, config.jwt.secret, {
        issuer: config.jwt.issuer,
      });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toMatchObject(payload);
    });

    it('should reject request without authorization header', () => {
      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MISSING_AUTH_HEADER',
          message: 'Authorization header is required',
        },
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request with invalid authorization format', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token123',
      };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_AUTH_FORMAT',
          message: 'Authorization header must be in format: Bearer <token>',
        },
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject expired token', () => {
      const payload: JWTPayload = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'admin',
      };

      const token = jwt.sign(payload, config.jwt.secret, {
        issuer: config.jwt.issuer,
        expiresIn: '-1h', // Expired 1 hour ago
      });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired',
        },
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject token with invalid signature', () => {
      const payload: JWTPayload = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'admin',
      };

      const token = jwt.sign(payload, 'wrong-secret', {
        issuer: config.jwt.issuer,
      });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
        },
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('should allow user with correct role', () => {
      mockRequest.user = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'admin',
      };

      const middleware = authorize('admin', 'superadmin');
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject user with incorrect role', () => {
      mockRequest.user = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'user',
      };

      const middleware = authorize('admin', 'superadmin');
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions to access this resource',
        },
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated user', () => {
      mockRequest.user = undefined;

      const middleware = authorize('admin');
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'User must be authenticated',
        },
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should attach user if valid token provided', () => {
      const payload: JWTPayload = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'admin',
      };

      const token = jwt.sign(payload, config.jwt.secret, {
        issuer: config.jwt.issuer,
      });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      optionalAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toMatchObject(payload);
    });

    it('should continue without user if no token provided', () => {
      optionalAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should continue without user if invalid token provided', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      optionalAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
