import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Logger, initLogger } from '@next-level-real-estate/shared/utils';
import { config } from './config';
import callsRouter from './routes/calls';
import aiCallsRouter from './routes/ai-calls';
import webhooksRouter from './routes/webhooks';
import { EventEmitter } from './utils/event-emitter';
import { TwilioService } from './services/twilio-service';
import { ElevenLabsService } from './services/elevenlabs-service';

// Initialize logger
initLogger({
  level: config.logLevel as any,
  serviceName: config.serviceName,
  enableConsole: true,
  enableJson: config.nodeEnv === 'production',
});

const logger = new Logger('CallingService');

/**
 * Initialize OpenTelemetry
 */
function initializeOpenTelemetry(): NodeSDK | null {
  if (!config.otel.endpoint) {
    logger.warn('OpenTelemetry endpoint not configured - tracing disabled');
    return null;
  }

  try {
    const sdk = new NodeSDK({
      traceExporter: new OTLPTraceExporter({
        url: config.otel.endpoint,
      }),
      instrumentations: [getNodeAutoInstrumentations()],
      serviceName: config.otel.serviceName,
    });

    sdk.start();
    logger.info('OpenTelemetry initialized', {
      endpoint: config.otel.endpoint,
      serviceName: config.otel.serviceName,
    });

    return sdk;
  } catch (error) {
    logger.error('Failed to initialize OpenTelemetry', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Connect to MongoDB
 */
async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongoUri);
    logger.info('Connected to MongoDB', {
      uri: config.mongoUri.replace(/\/\/.*:.*@/, '//<credentials>@'),
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Initialize Kafka event emitter
 */
async function initializeEventEmitter(): Promise<void> {
  try {
    const eventEmitter = EventEmitter.getInstance();
    await eventEmitter.connect();
    logger.info('Kafka event emitter initialized');
  } catch (error) {
    logger.error('Failed to initialize Kafka', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Don't throw - service can operate without Kafka in degraded mode
  }
}

/**
 * Test external service connections
 */
async function testExternalServices(): Promise<void> {
  const twilioService = new TwilioService();
  const elevenLabsService = new ElevenLabsService();

  try {
    const twilioConnected = await twilioService.testConnection();
    if (twilioConnected) {
      logger.info('Twilio connection test passed');
    } else {
      logger.warn('Twilio connection test failed');
    }
  } catch (error) {
    logger.error('Twilio connection test error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  try {
    const elevenLabsConnected = await elevenLabsService.testConnection();
    if (elevenLabsConnected) {
      logger.info('ElevenLabs connection test passed');
    } else {
      logger.warn('ElevenLabs connection test failed');
    }
  } catch (error) {
    logger.error('ElevenLabs connection test error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Create Express application
 */
function createApp(): Express {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info('Incoming request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
    });
    next();
  });

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: config.serviceName,
      timestamp: new Date().toISOString(),
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
  });

  // Routes
  app.use('/api/calls', callsRouter);
  app.use('/api/ai-calls', aiCallsRouter);
  app.use('/webhooks', webhooksRouter);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not found',
      path: req.path,
    });
  });

  // Error handler
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
    });

    res.status(500).json({
      error: 'Internal server error',
      message: config.nodeEnv === 'development' ? err.message : 'An error occurred',
    });
  });

  return app;
}

/**
 * Start the server
 */
async function start(): Promise<void> {
  try {
    logger.info('Starting Calling Service...', {
      nodeEnv: config.nodeEnv,
      port: config.port,
    });

    // Initialize OpenTelemetry
    const otelSdk = initializeOpenTelemetry();

    // Connect to MongoDB
    await connectDatabase();

    // Initialize Kafka
    await initializeEventEmitter();

    // Test external services
    await testExternalServices();

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(config.port, () => {
      logger.info('Calling Service started successfully', {
        port: config.port,
        nodeEnv: config.nodeEnv,
      });
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      // Close server
      server.close(() => {
        logger.info('HTTP server closed');
      });

      // Disconnect from MongoDB
      await mongoose.disconnect();
      logger.info('MongoDB disconnected');

      // Disconnect from Kafka
      const eventEmitter = EventEmitter.getInstance();
      await eventEmitter.disconnect();
      logger.info('Kafka disconnected');

      // Shutdown OpenTelemetry
      if (otelSdk) {
        await otelSdk.shutdown();
        logger.info('OpenTelemetry shutdown');
      }

      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start Calling Service', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Start the service
start();
