import { Kafka, Producer, ProducerConfig, Message, CompressionTypes } from 'kafkajs';
import { logger } from '../utils/logger';

/**
 * Kafka producer configuration
 */
export interface KafkaProducerConfig {
  clientId: string;
  brokers: string[];
  producerConfig?: ProducerConfig;
  retryConfig?: {
    maxRetries?: number;
    initialRetryTime?: number;
    retryMultiplier?: number;
  };
}

/**
 * Message to send
 */
export interface KafkaMessage {
  topic: string;
  key?: string;
  value: any;
  headers?: Record<string, string>;
  partition?: number;
}

/**
 * Kafka producer with retry logic
 * Handles reliable message publishing to Kafka topics
 */
export class KafkaProducer {
  private kafka: Kafka;
  private producer: Producer;
  private config: KafkaProducerConfig;
  private isConnected = false;

  constructor(config: KafkaProducerConfig) {
    this.config = {
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

    this.producer = this.kafka.producer({
      ...this.config.producerConfig,
      compression: CompressionTypes.GZIP,
      idempotent: true,
      maxInFlightRequests: 5,
      transactionalId: this.config.producerConfig?.transactionalId,
    });
  }

  /**
   * Connect to Kafka
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.debug('Kafka producer already connected');
      return;
    }

    try {
      logger.info('Connecting Kafka producer...', {
        clientId: this.config.clientId,
        brokers: this.config.brokers,
      });

      await this.producer.connect();
      this.isConnected = true;

      logger.info('Kafka producer connected successfully');
    } catch (error) {
      logger.error('Failed to connect Kafka producer', { error });
      throw error;
    }
  }

  /**
   * Disconnect from Kafka
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      logger.debug('Kafka producer not connected');
      return;
    }

    try {
      logger.info('Disconnecting Kafka producer...');
      await this.producer.disconnect();
      this.isConnected = false;
      logger.info('Kafka producer disconnected successfully');
    } catch (error) {
      logger.error('Failed to disconnect Kafka producer', { error });
      throw error;
    }
  }

  /**
   * Send a single message
   */
  public async send(message: KafkaMessage): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const kafkaMessage: Message = {
        key: message.key,
        value: JSON.stringify(message.value),
        headers: message.headers,
        partition: message.partition,
      };

      await this.producer.send({
        topic: message.topic,
        messages: [kafkaMessage],
      });

      logger.debug(`Message sent to topic: ${message.topic}`, {
        key: message.key,
      });
    } catch (error) {
      logger.error(`Failed to send message to topic: ${message.topic}`, { error });
      throw error;
    }
  }

  /**
   * Send multiple messages in batch
   */
  public async sendBatch(messages: KafkaMessage[]): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      // Group messages by topic
      const messagesByTopic = messages.reduce((acc, msg) => {
        if (!acc[msg.topic]) {
          acc[msg.topic] = [];
        }
        acc[msg.topic].push({
          key: msg.key,
          value: JSON.stringify(msg.value),
          headers: msg.headers,
          partition: msg.partition,
        });
        return acc;
      }, {} as Record<string, Message[]>);

      // Send batch for each topic
      const topicMessages = Object.entries(messagesByTopic).map(([topic, msgs]) => ({
        topic,
        messages: msgs,
      }));

      await this.producer.sendBatch({
        topicMessages,
      });

      logger.debug(`Batch of ${messages.length} messages sent`);
    } catch (error) {
      logger.error('Failed to send batch messages', { error });
      throw error;
    }
  }

  /**
   * Send message with retry logic
   */
  public async sendWithRetry(
    message: KafkaMessage,
    maxRetries = 3
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.send(message);
        return;
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Send attempt ${attempt} failed for topic: ${message.topic}`, {
          error,
          attempt,
          maxRetries,
        });

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    logger.error(`Failed to send message after ${maxRetries} attempts`, {
      topic: message.topic,
      error: lastError,
    });
    throw lastError;
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }
      // Try to get cluster metadata
      const admin = this.kafka.admin();
      await admin.connect();
      await admin.listTopics();
      await admin.disconnect();
      return true;
    } catch (error) {
      logger.error('Kafka producer health check failed', { error });
      return false;
    }
  }
}

/**
 * Initialize Kafka producer with environment variables
 */
export function createKafkaProducer(config?: Partial<KafkaProducerConfig>): KafkaProducer {
  const producerConfig: KafkaProducerConfig = {
    clientId: config?.clientId || process.env.KAFKA_CLIENT_ID || 'next-level-re',
    brokers: config?.brokers || (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    producerConfig: config?.producerConfig,
    retryConfig: config?.retryConfig,
  };

  return new KafkaProducer(producerConfig);
}
