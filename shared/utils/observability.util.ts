import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { logger } from './logger';

/**
 * OpenTelemetry configuration
 */
export interface OtelConfig {
  serviceName: string;
  serviceVersion?: string;
  otlpEndpoint?: string;
  enableAutoInstrumentation?: boolean;
  environment?: string;
}

/**
 * Initialize OpenTelemetry for distributed tracing
 */
export function initOpenTelemetry(config: OtelConfig): NodeSDK {
  const {
    serviceName,
    serviceVersion = '1.0.0',
    otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
    enableAutoInstrumentation = true,
    environment = process.env.NODE_ENV || 'development',
  } = config;

  try {
    logger.info('Initializing OpenTelemetry', {
      serviceName,
      serviceVersion,
      otlpEndpoint,
      environment,
    });

    const resource = Resource.default().merge(
      new Resource({
        [ATTR_SERVICE_NAME]: serviceName,
        [ATTR_SERVICE_VERSION]: serviceVersion,
        environment,
      })
    );

    const traceExporter = new OTLPTraceExporter({
      url: otlpEndpoint,
    });

    const sdk = new NodeSDK({
      resource,
      traceExporter,
      instrumentations: enableAutoInstrumentation
        ? [
            getNodeAutoInstrumentations({
              // Disable specific instrumentations if needed
              '@opentelemetry/instrumentation-fs': {
                enabled: false,
              },
            }),
          ]
        : [],
    });

    sdk.start();

    logger.info('OpenTelemetry initialized successfully');

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      try {
        await sdk.shutdown();
        logger.info('OpenTelemetry shut down successfully');
      } catch (error) {
        logger.error('Error shutting down OpenTelemetry', { error });
      }
    });

    return sdk;
  } catch (error) {
    logger.error('Failed to initialize OpenTelemetry', { error });
    throw error;
  }
}

/**
 * Create a tracer for manual instrumentation
 */
export function createTracer(name: string) {
  const { trace } = require('@opentelemetry/api');
  return trace.getTracer(name);
}

/**
 * Decorator for automatic span creation
 */
export function traced(operationName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const spanName = operationName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const { trace, context } = require('@opentelemetry/api');
      const tracer = trace.getTracer('manual-instrumentation');

      return tracer.startActiveSpan(spanName, async (span) => {
        try {
          const result = await originalMethod.apply(this, args);
          span.setStatus({ code: 1 }); // OK
          return result;
        } catch (error) {
          span.setStatus({
            code: 2, // ERROR
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          span.recordException(error as Error);
          throw error;
        } finally {
          span.end();
        }
      });
    };

    return descriptor;
  };
}
