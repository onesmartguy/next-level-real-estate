import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  mongodb: {
    uri: string;
    dbName: string;
  };
  kafka: {
    brokers: string[];
    clientId: string;
    groupId: string;
  };
  opentelemetry: {
    endpoint: string;
    serviceName: string;
  };
  webhooks: {
    zillow: {
      secret: string;
    };
    googleAds: {
      secret: string;
    };
    realgeeks: {
      username: string;
      password: string;
    };
  };
  dnc: {
    apiKey?: string;
    apiEndpoint?: string;
    scrubIntervalDays: number;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGODB_DB_NAME || 'next_level_real_estate'
  },

  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'lead-service',
    groupId: process.env.KAFKA_GROUP_ID || 'lead-service-group'
  },

  opentelemetry: {
    endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    serviceName: process.env.OTEL_SERVICE_NAME || 'lead-service'
  },

  webhooks: {
    zillow: {
      secret: process.env.ZILLOW_WEBHOOK_SECRET || 'your-zillow-secret'
    },
    googleAds: {
      secret: process.env.GOOGLE_ADS_WEBHOOK_SECRET || 'your-google-ads-secret'
    },
    realgeeks: {
      username: process.env.REALGEEKS_API_USERNAME || 'your-realgeeks-username',
      password: process.env.REALGEEKS_API_PASSWORD || 'your-realgeeks-password'
    }
  },

  dnc: {
    apiKey: process.env.DNC_API_KEY,
    apiEndpoint: process.env.DNC_API_ENDPOINT || 'https://api.dnc-registry.com',
    scrubIntervalDays: parseInt(process.env.DNC_SCRUB_INTERVAL_DAYS || '31', 10)
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
  }
};

export default config;
