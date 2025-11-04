import dotenv from 'dotenv';

dotenv.config();

interface Config {
  env: string;
  port: number;
  apiVersion: string;
  jwt: {
    secret: string;
    expiresIn: string;
    issuer: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  otel: {
    enabled: boolean;
    endpoint: string;
    serviceName: string;
    logLevel: string;
  };
  services: {
    lead: string;
    campaign: string;
    call: string;
    analytics: string;
  };
  logging: {
    level: string;
    format: string;
  };
  requestTimeout: number;
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiVersion: process.env.API_VERSION || 'v1',
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: process.env.JWT_ISSUER || 'next-level-real-estate',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
  otel: {
    enabled: process.env.OTEL_ENABLED === 'true',
    endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    serviceName: process.env.OTEL_SERVICE_NAME || 'api-gateway',
    logLevel: process.env.OTEL_LOG_LEVEL || 'info',
  },
  services: {
    lead: process.env.LEAD_SERVICE_URL || 'http://localhost:3001',
    campaign: process.env.CAMPAIGN_SERVICE_URL || 'http://localhost:3002',
    call: process.env.CALL_SERVICE_URL || 'http://localhost:3003',
    analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3004',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10),
};

// Validate critical configuration
if (config.env === 'production') {
  if (config.jwt.secret === 'your-super-secret-jwt-key-change-in-production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }
}

export default config;
