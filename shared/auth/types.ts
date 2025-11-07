/**
 * Authentication Types and Interfaces
 * Shared across MCP servers, webhooks, and Next.js admin
 */

/**
 * Authentication information attached to requests
 */
export interface AuthInfo {
  /** Authenticated: true if auth passed, false otherwise */
  authenticated: boolean;

  /** Authentication method used */
  method: 'none' | 'api-key' | 'oauth';

  /** User ID (for OAuth) */
  userId?: string;

  /** Email address (for OAuth) */
  email?: string;

  /** Access token (for OAuth) */
  accessToken?: string;

  /** Scopes granted (for OAuth) */
  scopes?: string[];

  /** API key client ID */
  clientId?: string;

  /** Request IP address */
  ipAddress?: string;

  /** Timestamp of authentication */
  authenticatedAt?: Date;

  /** Additional context from auth provider */
  metadata?: Record<string, any>;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  mode: 'none' | 'api-key' | 'oauth';
  apiKey?: string;
  oauthIssuer?: string;
  oauthAudience?: string;
  oauthClientId?: string;
  oauthClientSecret?: string;
  requiredScopes?: string[];
  headerName?: string; // for API key auth
  tokenEndpoint?: string;
  jwksUri?: string;
}

/**
 * Response format for auth errors
 */
export interface AuthError {
  error: string;
  message: string;
  code?: string;
  statusCode?: number;
}

/**
 * OAuth token response
 */
export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

/**
 * OAuth user info response
 */
export interface OAuthUserInfo {
  sub: string; // subject (user ID)
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  iss?: string; // issuer
  aud?: string; // audience
  exp?: number; // expiration
  iat?: number; // issued at
  [key: string]: any;
}

/**
 * JWKS (JSON Web Key Set) structure
 */
export interface JWKSResponse {
  keys: Array<{
    kid?: string;
    kty: string;
    use?: string;
    alg?: string;
    n?: string; // RSA modulus
    e?: string; // RSA exponent
    [key: string]: any;
  }>;
}

/**
 * Audit log entry for authentication events
 */
export interface AuthAuditLog {
  timestamp: Date;
  method: 'none' | 'api-key' | 'oauth';
  action: 'authenticate' | 'validate' | 'revoke' | 'refresh';
  success: boolean;
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Rate limit info
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  exceeded: boolean;
}

/**
 * Extended Express Request with auth info
 */
declare global {
  namespace Express {
    interface Request {
      mcpAuth?: AuthInfo;
      rateLimit?: RateLimitInfo;
    }
  }
}

/**
 * Extended Next.js Request with auth info
 */
export interface AuthenticatedNextRequest extends Request {
  mcpAuth?: AuthInfo;
  rateLimit?: RateLimitInfo;
}
