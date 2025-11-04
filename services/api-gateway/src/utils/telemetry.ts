import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import config from '../config';
import logger from './logger';

let sdk: NodeSDK | null = null;

export function initTelemetry(): void {
  if (!config.otel.enabled) {
    logger.info('OpenTelemetry is disabled');
    return;
  }

  try {
    const traceExporter = new OTLPTraceExporter({
      url: config.otel.endpoint,
    });

    sdk = new NodeSDK({
      resource: new Resource({
        [SEMRESATTRS_SERVICE_NAME]: config.otel.serviceName,
      }),
      traceExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': {
            enabled: false, // Disable file system instrumentation to reduce noise
          },
        }),
      ],
    });

    sdk.start();
    logger.info('OpenTelemetry initialized', {
      service: config.otel.serviceName,
      endpoint: config.otel.endpoint,
    });
  } catch (error) {
    logger.error('Error initializing OpenTelemetry:', error);
  }
}

export async function shutdownTelemetry(): Promise<void> {
  if (sdk) {
    try {
      await sdk.shutdown();
      logger.info('OpenTelemetry shut down successfully');
    } catch (error) {
      logger.error('Error shutting down OpenTelemetry:', error);
    }
  }
}

// Initialize on module load if enabled
if (config.otel.enabled) {
  initTelemetry();
}
