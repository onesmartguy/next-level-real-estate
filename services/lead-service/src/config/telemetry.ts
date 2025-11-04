import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import config from './index';
import logger from '../utils/logger';

let sdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry SDK
 */
export function initTelemetry(): void {
  try {
    // Create OTLP exporter
    const traceExporter = new OTLPTraceExporter({
      url: config.opentelemetry.endpoint,
      headers: {},
    });

    // Create resource with service information
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: config.opentelemetry.serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.nodeEnv,
    });

    // Initialize SDK with auto-instrumentation
    sdk = new NodeSDK({
      resource,
      traceExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          // Auto-instrument common libraries
          '@opentelemetry/instrumentation-http': {
            enabled: true,
            ignoreIncomingPaths: ['/health', '/metrics']
          },
          '@opentelemetry/instrumentation-express': {
            enabled: true
          },
          '@opentelemetry/instrumentation-mongodb': {
            enabled: true,
            enhancedDatabaseReporting: true
          }
        } as any)
      ]
    });

    // Start the SDK
    sdk.start();

    logger.info('OpenTelemetry initialized successfully', {
      serviceName: config.opentelemetry.serviceName,
      endpoint: config.opentelemetry.endpoint
    });

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      try {
        await sdk?.shutdown();
        logger.info('OpenTelemetry SDK shut down successfully');
      } catch (error) {
        logger.error('Error shutting down OpenTelemetry SDK', { error });
      }
    });
  } catch (error) {
    logger.error('Failed to initialize OpenTelemetry', { error });
    // Don't throw - continue without telemetry rather than crashing
  }
}

/**
 * Shutdown OpenTelemetry SDK
 */
export async function shutdownTelemetry(): Promise<void> {
  if (sdk) {
    try {
      await sdk.shutdown();
      logger.info('OpenTelemetry SDK shut down');
    } catch (error) {
      logger.error('Error shutting down OpenTelemetry SDK', { error });
    }
  }
}
