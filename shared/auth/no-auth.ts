/**
 * No-Auth Mode Implementation
 * For development and local testing only
 * NEVER use in production
 */

import { AuthInfo, AuthConfig } from './types.js';

/**
 * No-Auth Mode
 * - Accepts all requests without authentication
 * - Logs warning in production
 * - Suitable only for local development and testing
 */
export class NoAuthMode {
  private config: AuthConfig;

  constructor(config?: Partial<AuthConfig>) {
    this.config = {
      mode: 'none',
      ...config,
    };

    // Warn in production
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '⚠️  WARNING: No-auth mode is enabled in production! This is a security risk. ' +
          'Please set MCP_AUTH_MODE to "api-key" or "oauth".'
      );
    }
  }

  /**
   * Validate request - always returns true for no-auth mode
   */
  async validate(): Promise<AuthInfo> {
    return {
      authenticated: true,
      method: 'none',
      authenticatedAt: new Date(),
    };
  }

  /**
   * Express middleware for no-auth mode
   */
  middleware() {
    return async (req: any, res: any, next: any) => {
      req.mcpAuth = {
        authenticated: true,
        method: 'none',
        ipAddress: req.ip,
        authenticatedAt: new Date(),
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('✓ No-auth mode - request allowed');
      }

      next();
    };
  }

  /**
   * Next.js middleware for no-auth mode
   */
  nextMiddleware() {
    return async (req: any) => {
      req.mcpAuth = {
        authenticated: true,
        method: 'none',
        ipAddress: req.headers.get('x-forwarded-for'),
        authenticatedAt: new Date(),
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('✓ No-auth mode - request allowed');
      }

      return req;
    };
  }

  /**
   * Get metadata about this auth mode
   */
  getMetadata() {
    return {
      mode: 'none',
      protected: false,
      description: 'No authentication - development mode only',
      warning:
        'This should NEVER be used in production. It accepts all requests.',
    };
  }
}

/**
 * Factory function
 */
export function createNoAuthMode(config?: Partial<AuthConfig>): NoAuthMode {
  return new NoAuthMode(config);
}
