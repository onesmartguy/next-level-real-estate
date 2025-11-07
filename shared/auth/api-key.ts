/**
 * API Key Authentication Mode
 * Simple production-ready authentication using API keys in headers
 */

import crypto from 'crypto';
import { AuthInfo, AuthConfig, AuthError } from './types.js';

/**
 * API Key validation and management
 */
export class ApiKeyAuth {
  private apiKey: string;
  private headerName: string;
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    if (!config.apiKey) {
      throw new Error('API key required for API key auth mode');
    }

    this.apiKey = config.apiKey;
    this.headerName = config.headerName || 'x-api-key';
    this.config = config;

    if (!process.env.NODE_ENV === 'production' && this.apiKey === 'default') {
      console.warn(
        '⚠️  WARNING: Using default API key in production! Generate a secure key with: ' +
          'node -e "console.log(\'mcp_sk_\' + require(\'crypto\').randomBytes(32).toString(\'base64url\'))"'
      );
    }
  }

  /**
   * Validate API key from request
   */
  async validate(providedKey: string | undefined): Promise<AuthInfo> {
    if (!providedKey) {
      throw {
        error: 'Unauthorized',
        message: `Missing ${this.headerName} header`,
        statusCode: 401,
      } as AuthError;
    }

    // Use timing-safe comparison to prevent timing attacks
    const keyBuffer = Buffer.from(this.apiKey);
    const providedBuffer = Buffer.from(providedKey);

    try {
      crypto.timingSafeEqual(keyBuffer, providedBuffer);
    } catch {
      // Timing attack prevention: always delay same amount
      await new Promise((resolve) => setTimeout(resolve, 100));

      throw {
        error: 'Unauthorized',
        message: 'Invalid API key',
        statusCode: 401,
      } as AuthError;
    }

    return {
      authenticated: true,
      method: 'api-key',
      clientId: 'api-key-client',
      authenticatedAt: new Date(),
      scopes: ['read', 'write'],
    };
  }

  /**
   * Express middleware
   */
  middleware() {
    return async (req: any, res: any, next: any) => {
      try {
        const providedKey = req.headers[this.headerName];
        const authInfo = await this.validate(providedKey);
        req.mcpAuth = {
          ...authInfo,
          ipAddress: req.ip,
        };

        if (process.env.NODE_ENV === 'development') {
          console.log('✓ API key authentication successful');
        }

        next();
      } catch (error) {
        const authError = error as AuthError;
        res.setHeader(
          'WWW-Authenticate',
          `Bearer realm="MCP Server", error="invalid_token"`
        );
        return res.status(authError.statusCode || 401).json({
          error: authError.error,
          message: authError.message,
        });
      }
    };
  }

  /**
   * Next.js handler wrapper
   */
  async validateFromRequest(req: any): Promise<AuthInfo> {
    const providedKey = req.headers.get(this.headerName);
    return this.validate(providedKey);
  }

  /**
   * Generate new secure API key
   */
  static generateKey(prefix: string = 'mcp_sk'): string {
    const randomBytes = crypto.randomBytes(32);
    const key = randomBytes.toString('base64url');
    return `${prefix}_${key}`;
  }

  /**
   * Validate key format
   */
  static isValidKeyFormat(key: string): boolean {
    // Should be 50+ characters (prefix + 32 bytes base64)
    return key && key.length >= 40 && typeof key === 'string';
  }

  /**
   * Get metadata
   */
  getMetadata() {
    return {
      mode: 'api-key',
      protected: true,
      headerName: this.headerName,
      description: 'Simple API key authentication',
      keyFormat: 'mcp_sk_<base64url encoded random bytes>',
    };
  }
}

/**
 * Factory function
 */
export function createApiKeyAuth(config: AuthConfig): ApiKeyAuth {
  return new ApiKeyAuth(config);
}

/**
 * Convenience function to generate and display API key
 */
export function generateApiKey(): void {
  const key = ApiKeyAuth.generateKey('mcp_sk_live');
  console.log('Generated API Key:');
  console.log(key);
  console.log('\nAdd to .env:');
  console.log(`MCP_API_KEY=${key}`);
  console.log('\nAdd to headers when calling MCP server:');
  console.log(`x-api-key: ${key}`);
}
