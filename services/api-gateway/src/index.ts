import './utils/telemetry'; // Must be imported first for instrumentation
import app from './app';
import config from './config';
import logger from './utils/logger';
import RedisClient from './utils/redis-client';
import { shutdownTelemetry } from './utils/telemetry';

const startServer = async () => {
  try {
    // Initialize Redis connection
    const redis = RedisClient.getInstance();
    await redis.ping();
    logger.info('Redis connection established');

    // Start Express server
    const server = app.listen(config.port, () => {
      logger.info(`API Gateway started successfully`, {
        port: config.port,
        environment: config.env,
        nodeVersion: process.version,
        pid: process.pid,
      });
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown`);

      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Close Redis connection
          await RedisClient.disconnect();

          // Shutdown OpenTelemetry
          await shutdownTelemetry();

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
