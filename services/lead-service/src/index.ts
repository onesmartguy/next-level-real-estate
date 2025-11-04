import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import config from './config';
import logger from './utils/logger';
import kafkaProducer from './utils/kafka-producer';
import { initTelemetry, shutdownTelemetry } from './config/telemetry';
import leadsRouter from './routes/leads';
import webhooksRouter from './routes/webhooks';

// Initialize OpenTelemetry first (before any other imports)
initTelemetry();

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(compression() as any); // Compress responses
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for webhooks (they have their own auth)
  skip: (req: any) => req.path.startsWith('/webhooks/')
});
app.use('/api/', limiter as any);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });

  next();
});

// Health check endpoint (before auth)
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'lead-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Routes
app.use('/webhooks', webhooksRouter);
app.use('/api/leads', leadsRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  logger.warn('Route not found', { path: req.path, method: req.method });
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    success: false,
    error: config.nodeEnv === 'production' ? 'Internal server error' : err.message
  });
});

// Database connection
async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri, {
      dbName: config.mongodb.dbName,
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    logger.info('MongoDB connected successfully', {
      uri: config.mongodb.uri.replace(/\/\/.*@/, '//***@'), // Hide credentials
      dbName: config.mongodb.dbName
    });

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error', { error });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
}

// Kafka connection
async function connectKafka(): Promise<void> {
  try {
    await kafkaProducer.connect();
    logger.info('Kafka producer connected successfully');
  } catch (error) {
    logger.error('Failed to connect Kafka producer', { error });
    // Don't throw - continue without Kafka
  }
}

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, starting graceful shutdown`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Disconnect Kafka
      await kafkaProducer.disconnect();
      logger.info('Kafka disconnected');
    } catch (error) {
      logger.error('Error disconnecting Kafka', { error });
    }

    try {
      // Disconnect MongoDB
      await mongoose.connection.close();
      logger.info('MongoDB disconnected');
    } catch (error) {
      logger.error('Error disconnecting MongoDB', { error });
    }

    try {
      // Shutdown telemetry
      await shutdownTelemetry();
    } catch (error) {
      logger.error('Error shutting down telemetry', { error });
    }

    logger.info('Graceful shutdown completed');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

// Start server
let server: any;

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Connect to Kafka
    await connectKafka();

    // Start HTTP server
    server = app.listen(config.port, () => {
      logger.info('Lead Service started', {
        port: config.port,
        nodeEnv: config.nodeEnv,
        serviceName: config.opentelemetry.serviceName
      });
    });

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error });
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason, promise });
      gracefulShutdown('unhandledRejection');
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  startServer();
}

export default app;
