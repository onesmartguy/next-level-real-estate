import winston from 'winston';
import { trace } from '@opentelemetry/api';

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level?: LogLevel;
  serviceName?: string;
  enableConsole?: boolean;
  enableFile?: boolean;
  logFilePath?: string;
  enableJson?: boolean;
}

/**
 * Custom format for adding OpenTelemetry trace context
 */
const addTraceContext = winston.format((info) => {
  const span = trace.getActiveSpan();
  if (span) {
    const spanContext = span.spanContext();
    info.traceId = spanContext.traceId;
    info.spanId = spanContext.spanId;
    info.traceFlags = spanContext.traceFlags;
  }
  return info;
});

/**
 * Create logger instance
 */
function createLogger(config: LoggerConfig = {}): winston.Logger {
  const {
    level = LogLevel.INFO,
    serviceName = 'next-level-re',
    enableConsole = true,
    enableFile = false,
    logFilePath = './logs/application.log',
    enableJson = process.env.NODE_ENV === 'production',
  } = config;

  const formats = [
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    addTraceContext(),
  ];

  // Add format based on environment
  if (enableJson) {
    formats.push(winston.format.json());
  } else {
    formats.push(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, service, traceId, spanId, ...meta }) => {
        let log = `${timestamp} [${level}] [${service || serviceName}]`;

        if (traceId && spanId && typeof traceId === 'string' && typeof spanId === 'string') {
          log += ` [trace:${traceId.substring(0, 8)}:${spanId.substring(0, 8)}]`;
        }

        log += `: ${message}`;

        if (Object.keys(meta).length > 0) {
          log += ` ${JSON.stringify(meta)}`;
        }

        return log;
      })
    );
  }

  const transports: winston.transport[] = [];

  // Console transport
  if (enableConsole) {
    transports.push(
      new winston.transports.Console({
        level,
      })
    );
  }

  // File transport
  if (enableFile) {
    transports.push(
      new winston.transports.File({
        filename: logFilePath,
        level,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      })
    );
  }

  return winston.createLogger({
    level,
    defaultMeta: { service: serviceName },
    format: winston.format.combine(...formats),
    transports,
  });
}

/**
 * Global logger instance
 */
export let logger = createLogger();

/**
 * Initialize logger with custom configuration
 */
export function initLogger(config: LoggerConfig): void {
  logger = createLogger(config);
}

/**
 * Logger utility class for structured logging
 */
export class Logger {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  private log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    logger.log(level, message, { service: this.serviceName, ...meta });
  }

  public error(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, meta);
  }

  public warn(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, meta);
  }

  public info(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, meta);
  }

  public debug(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, meta);
  }
}

/**
 * Create a child logger with service name
 */
export function createChildLogger(serviceName: string): Logger {
  return new Logger(serviceName);
}
