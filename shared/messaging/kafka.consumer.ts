import { Kafka, Consumer, ConsumerConfig, EachMessagePayload, EachBatchPayload } from 'kafkajs';
import { logger } from '../utils/logger';

/**
 * Kafka consumer configuration
 */
export interface KafkaConsumerConfig {
  clientId: string;
  brokers: string[];
  groupId: string;
  consumerConfig?: ConsumerConfig;
  autoCommit?: boolean;
  retryConfig?: {
    maxRetries?: number;
    initialRetryTime?: number;
    retryMultiplier?: number;
  };
}

/**
 * Message handler function
 */
export type MessageHandler = (message: {
  topic: string;
  partition: number;
  key: string | null;
  value: any;
  headers?: Record<string, string>;
  offset: string;
}) => Promise<void>;

/**
 * Batch message handler function
 */
export type BatchMessageHandler = (batch: {
  topic: string;
  partition: number;
  messages: Array<{
    key: string | null;
    value: any;
    headers?: Record<string, string>;
    offset: string;
  }>;
}) => Promise<void>;

/**
 * Kafka consumer with error handling
 * Handles reliable message consumption from Kafka topics
 */
export class KafkaConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private config: KafkaConsumerConfig;
  private isConnected = false;
  private messageHandlers: Map<string, MessageHandler> = new Map();
  private batchHandlers: Map<string, BatchMessageHandler> = new Map();

  constructor(config: KafkaConsumerConfig) {
    this.config = {
      autoCommit: true,
      retryConfig: {
        maxRetries: 5,
        initialRetryTime: 300,
        retryMultiplier: 2,
      },
      ...config,
    };

    this.kafka = new Kafka({
      clientId: this.config.clientId,
      brokers: this.config.brokers,
      retry: {
        retries: this.config.retryConfig?.maxRetries || 5,
        initialRetryTime: this.config.retryConfig?.initialRetryTime || 300,
        multiplier: this.config.retryConfig?.retryMultiplier || 2,
      },
    });

    this.consumer = this.kafka.consumer({
      groupId: this.config.groupId,
      ...this.config.consumerConfig,
    });
  }

  /**
   * Connect to Kafka
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.debug('Kafka consumer already connected');
      return;
    }

    try {
      logger.info('Connecting Kafka consumer...', {
        clientId: this.config.clientId,
        groupId: this.config.groupId,
        brokers: this.config.brokers,
      });

      await this.consumer.connect();
      this.isConnected = true;

      logger.info('Kafka consumer connected successfully');
    } catch (error) {
      logger.error('Failed to connect Kafka consumer', { error });
      throw error;
    }
  }

  /**
   * Disconnect from Kafka
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      logger.debug('Kafka consumer not connected');
      return;
    }

    try {
      logger.info('Disconnecting Kafka consumer...');
      await this.consumer.disconnect();
      this.isConnected = false;
      logger.info('Kafka consumer disconnected successfully');
    } catch (error) {
      logger.error('Failed to disconnect Kafka consumer', { error });
      throw error;
    }
  }

  /**
   * Subscribe to topics
   */
  public async subscribe(topics: string[] | RegExp): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      if (Array.isArray(topics)) {
        await this.consumer.subscribe({ topics });
        logger.info(`Subscribed to topics: ${topics.join(', ')}`);
      } else {
        await this.consumer.subscribe({ topic: topics });
        logger.info(`Subscribed to topics matching pattern: ${topics}`);
      }
    } catch (error) {
      logger.error('Failed to subscribe to topics', { error });
      throw error;
    }
  }

  /**
   * Register message handler for specific topic
   */
  public onMessage(topic: string, handler: MessageHandler): void {
    this.messageHandlers.set(topic, handler);
    logger.debug(`Registered message handler for topic: ${topic}`);
  }

  /**
   * Register batch message handler for specific topic
   */
  public onBatch(topic: string, handler: BatchMessageHandler): void {
    this.batchHandlers.set(topic, handler);
    logger.debug(`Registered batch handler for topic: ${topic}`);
  }

  /**
   * Start consuming messages
   */
  public async run(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      await this.consumer.run({
        autoCommit: this.config.autoCommit,
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
        eachBatch: async (payload: EachBatchPayload) => {
          await this.handleBatch(payload);
        },
      });

      logger.info('Kafka consumer started successfully');
    } catch (error) {
      logger.error('Failed to start Kafka consumer', { error });
      throw error;
    }
  }

  /**
   * Handle individual message
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      const handler = this.messageHandlers.get(topic);
      if (!handler) {
        logger.warn(`No handler registered for topic: ${topic}`);
        return;
      }

      const parsedMessage = {
        topic,
        partition,
        key: message.key?.toString() || null,
        value: message.value ? JSON.parse(message.value.toString()) : null,
        headers: this.parseHeaders(message.headers),
        offset: message.offset,
      };

      await handler(parsedMessage);

      logger.debug(`Message processed from topic: ${topic}`, {
        partition,
        offset: message.offset,
      });
    } catch (error) {
      logger.error(`Error processing message from topic: ${topic}`, {
        error,
        partition,
        offset: message.offset,
      });

      // Don't throw - let Kafka handle retry based on consumer config
      // In production, consider sending to DLQ (Dead Letter Queue)
    }
  }

  /**
   * Handle batch of messages
   */
  private async handleBatch(payload: EachBatchPayload): Promise<void> {
    const { batch } = payload;
    const { topic, partition } = batch;

    try {
      const handler = this.batchHandlers.get(topic);
      if (!handler) {
        // Fallback to individual message handlers
        for (const message of batch.messages) {
          await this.handleMessage({
            topic,
            partition,
            message,
            heartbeat: payload.heartbeat,
            pause: payload.pause,
          });
        }
        return;
      }

      const parsedBatch = {
        topic,
        partition,
        messages: batch.messages.map(msg => ({
          key: msg.key?.toString() || null,
          value: msg.value ? JSON.parse(msg.value.toString()) : null,
          headers: this.parseHeaders(msg.headers),
          offset: msg.offset,
        })),
      };

      await handler(parsedBatch);

      logger.debug(`Batch processed from topic: ${topic}`, {
        partition,
        count: batch.messages.length,
      });
    } catch (error) {
      logger.error(`Error processing batch from topic: ${topic}`, {
        error,
        partition,
        messageCount: batch.messages.length,
      });
    }
  }

  /**
   * Parse message headers
   */
  private parseHeaders(headers: any): Record<string, string> | undefined {
    if (!headers) return undefined;

    const parsed: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (value) {
        parsed[key] = Buffer.isBuffer(value) ? value.toString() : String(value);
      }
    }
    return parsed;
  }

  /**
   * Manually commit offsets
   */
  public async commit(): Promise<void> {
    try {
      await this.consumer.commitOffsets([]);
      logger.debug('Committed offsets');
    } catch (error) {
      logger.error('Failed to commit offsets', { error });
      throw error;
    }
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }
      // Consumer is healthy if connected
      return true;
    } catch (error) {
      logger.error('Kafka consumer health check failed', { error });
      return false;
    }
  }
}

/**
 * Initialize Kafka consumer with environment variables
 */
export function createKafkaConsumer(
  groupId: string,
  config?: Partial<KafkaConsumerConfig>
): KafkaConsumer {
  const consumerConfig: KafkaConsumerConfig = {
    clientId: config?.clientId || process.env.KAFKA_CLIENT_ID || 'next-level-re',
    brokers: config?.brokers || (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    groupId,
    consumerConfig: config?.consumerConfig,
    autoCommit: config?.autoCommit,
    retryConfig: config?.retryConfig,
  };

  return new KafkaConsumer(consumerConfig);
}
