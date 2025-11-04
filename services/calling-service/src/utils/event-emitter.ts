import { Kafka, Producer, Message } from 'kafkajs';
import { Logger } from '@next-level-real-estate/shared/utils';
import { config } from '../config';

/**
 * Event types for calling service
 */
export enum CallEventType {
  CALL_INITIATED = 'CallInitiated',
  CALL_ANSWERED = 'CallAnswered',
  CALL_COMPLETED = 'CallCompleted',
  CALL_FAILED = 'CallFailed',
  CALL_TRANSCRIPT_READY = 'CallTranscriptReady',
}

/**
 * Base event interface
 */
export interface CallEvent {
  eventType: CallEventType;
  timestamp: Date;
  callId: string;
  leadId: string;
  data: Record<string, any>;
}

/**
 * Event Emitter Service
 *
 * Emits events to Kafka for consumption by other services
 */
export class EventEmitter {
  private static instance: EventEmitter;
  private kafka: Kafka;
  private producer: Producer;
  private logger: Logger;
  private isConnected: boolean = false;

  private constructor() {
    this.logger = new Logger('EventEmitter');

    // Initialize Kafka
    this.kafka = new Kafka({
      clientId: config.kafkaClientId,
      brokers: config.kafkaBrokers.split(','),
    });

    this.producer = this.kafka.producer();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): EventEmitter {
    if (!EventEmitter.instance) {
      EventEmitter.instance = new EventEmitter();
    }
    return EventEmitter.instance;
  }

  /**
   * Connect to Kafka
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.info('Connected to Kafka', {
        brokers: config.kafkaBrokers,
      });
    } catch (error) {
      this.logger.error('Failed to connect to Kafka', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.producer.disconnect();
      this.isConnected = false;
      this.logger.info('Disconnected from Kafka');
    } catch (error) {
      this.logger.error('Failed to disconnect from Kafka', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Emit an event to Kafka
   */
  async emit(
    eventType: CallEventType | string,
    data: Record<string, any>
  ): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const event: CallEvent = {
        eventType: eventType as CallEventType,
        timestamp: new Date(),
        callId: data.callId || '',
        leadId: data.leadId || '',
        data,
      };

      const message: Message = {
        key: event.callId,
        value: JSON.stringify(event),
        headers: {
          eventType: eventType,
          timestamp: event.timestamp.toISOString(),
        },
      };

      await this.producer.send({
        topic: this.getTopicForEvent(eventType),
        messages: [message],
      });

      this.logger.info('Event emitted', {
        eventType,
        callId: event.callId,
        leadId: event.leadId,
      });
    } catch (error) {
      this.logger.error('Failed to emit event', {
        eventType,
        error: error instanceof Error ? error.message : 'Unknown error',
        data,
      });
      // Don't throw - we don't want event emission failures to break the main flow
    }
  }

  /**
   * Get topic name for event type
   */
  private getTopicForEvent(eventType: string): string {
    // Map event types to Kafka topics
    const topicMap: Record<string, string> = {
      [CallEventType.CALL_INITIATED]: 'calls.initiated',
      [CallEventType.CALL_ANSWERED]: 'calls.answered',
      [CallEventType.CALL_COMPLETED]: 'calls.completed',
      [CallEventType.CALL_FAILED]: 'calls.failed',
      [CallEventType.CALL_TRANSCRIPT_READY]: 'calls.transcripts',
    };

    return topicMap[eventType] || 'calls.events';
  }

  /**
   * Emit multiple events in batch
   */
  async emitBatch(
    events: Array<{ eventType: CallEventType | string; data: Record<string, any> }>
  ): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const messagesByTopic = new Map<string, Message[]>();

      for (const { eventType, data } of events) {
        const event: CallEvent = {
          eventType: eventType as CallEventType,
          timestamp: new Date(),
          callId: data.callId || '',
          leadId: data.leadId || '',
          data,
        };

        const message: Message = {
          key: event.callId,
          value: JSON.stringify(event),
          headers: {
            eventType,
            timestamp: event.timestamp.toISOString(),
          },
        };

        const topic = this.getTopicForEvent(eventType);
        if (!messagesByTopic.has(topic)) {
          messagesByTopic.set(topic, []);
        }
        messagesByTopic.get(topic)!.push(message);
      }

      // Send all messages by topic
      for (const [topic, messages] of messagesByTopic) {
        await this.producer.send({
          topic,
          messages,
        });
      }

      this.logger.info('Batch events emitted', {
        count: events.length,
        topics: Array.from(messagesByTopic.keys()),
      });
    } catch (error) {
      this.logger.error('Failed to emit batch events', {
        error: error instanceof Error ? error.message : 'Unknown error',
        count: events.length,
      });
    }
  }
}
