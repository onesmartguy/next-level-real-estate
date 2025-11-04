/**
 * Kafka-based inter-agent communication coordinator
 */

import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { logger } from './logger';
import { InterAgentMessage, AgentEvent, AgentEventType } from './types';
import { v4 as uuidv4 } from 'uuid';

const tracer = trace.getTracer('agent-coordinator');

export interface CoordinatorConfig {
  agentId: string;
  kafkaBrokers?: string[];
  groupId?: string;
  topics: {
    consume: string[];
    produce: string[];
  };
}

export type MessageHandler = (message: InterAgentMessage) => Promise<void>;
export type EventHandler = (event: AgentEvent) => Promise<void>;

export class AgentCoordinator {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private agentId: string;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private eventHandlers: Map<AgentEventType, EventHandler[]> = new Map();
  private isConnected: boolean = false;

  constructor(config: CoordinatorConfig) {
    this.agentId = config.agentId;

    this.kafka = new Kafka({
      clientId: config.agentId,
      brokers: config.kafkaBrokers || (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      retry: {
        retries: 5,
        initialRetryTime: 300,
        maxRetryTime: 30000,
      },
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });

    this.consumer = this.kafka.consumer({
      groupId: config.groupId || `${config.agentId}-group`,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });
  }

  /**
   * Connect to Kafka
   */
  async connect(): Promise<void> {
    return tracer.startActiveSpan('agentCoordinator.connect', async (span) => {
      try {
        await this.producer.connect();
        await this.consumer.connect();

        this.isConnected = true;
        logger.info('Agent coordinator connected to Kafka', {
          agentId: this.agentId,
        });

        span.setStatus({ code: SpanStatusCode.OK });
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.recordException(error as Error);
        logger.error('Failed to connect to Kafka', { error });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Subscribe to topics and start consuming
   */
  async subscribe(topics: string[]): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Coordinator not connected. Call connect() first.');
    }

    try {
      for (const topic of topics) {
        await this.consumer.subscribe({ topic, fromBeginning: false });
        logger.info('Subscribed to topic', { topic, agentId: this.agentId });
      }

      // Start consuming messages
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      logger.info('Started consuming messages', {
        agentId: this.agentId,
        topics,
      });
    } catch (error) {
      logger.error('Failed to subscribe to topics', { error, topics });
      throw error;
    }
  }

  /**
   * Send message to another agent
   */
  async sendMessage(message: Omit<InterAgentMessage, 'fromAgent' | 'timestamp'>): Promise<void> {
    return tracer.startActiveSpan('agentCoordinator.sendMessage', async (span) => {
      try {
        if (!this.isConnected) {
          throw new Error('Coordinator not connected');
        }

        const fullMessage: InterAgentMessage = {
          ...message,
          fromAgent: this.agentId,
          timestamp: new Date(),
        };

        const topic = `agent-messages-${message.toAgent}`;

        await this.producer.send({
          topic,
          messages: [
            {
              key: fullMessage.correlationId || uuidv4(),
              value: JSON.stringify(fullMessage),
              headers: {
                fromAgent: this.agentId,
                messageType: message.messageType,
              },
            },
          ],
        });

        logger.debug('Message sent to agent', {
          fromAgent: this.agentId,
          toAgent: message.toAgent,
          messageType: message.messageType,
        });

        span.setStatus({ code: SpanStatusCode.OK });
        span.setAttribute('message.toAgent', message.toAgent);
        span.setAttribute('message.type', message.messageType);
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.recordException(error as Error);
        logger.error('Failed to send message', { error, message });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Publish event to all agents
   */
  async publishEvent(event: Omit<AgentEvent, 'eventId' | 'agentId' | 'timestamp'>): Promise<void> {
    return tracer.startActiveSpan('agentCoordinator.publishEvent', async (span) => {
      try {
        if (!this.isConnected) {
          throw new Error('Coordinator not connected');
        }

        const fullEvent: AgentEvent = {
          ...event,
          eventId: uuidv4(),
          agentId: this.agentId,
          timestamp: new Date(),
        };

        const topic = `agent-events-${event.eventType}`;

        await this.producer.send({
          topic,
          messages: [
            {
              key: fullEvent.eventId,
              value: JSON.stringify(fullEvent),
              headers: {
                agentId: this.agentId,
                eventType: event.eventType,
              },
            },
          ],
        });

        logger.debug('Event published', {
          agentId: this.agentId,
          eventType: event.eventType,
          eventId: fullEvent.eventId,
        });

        span.setStatus({ code: SpanStatusCode.OK });
        span.setAttribute('event.type', event.eventType);
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.recordException(error as Error);
        logger.error('Failed to publish event', { error, event });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Register message handler
   */
  onMessage(messageType: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(messageType) || [];
    handlers.push(handler);
    this.messageHandlers.set(messageType, handlers);

    logger.debug('Message handler registered', {
      agentId: this.agentId,
      messageType,
    });
  }

  /**
   * Register event handler
   */
  onEvent(eventType: AgentEventType, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    handlers.push(handler);
    this.eventHandlers.set(eventType, handlers);

    logger.debug('Event handler registered', {
      agentId: this.agentId,
      eventType,
    });
  }

  /**
   * Handle incoming Kafka message
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    return tracer.startActiveSpan('agentCoordinator.handleMessage', async (span) => {
      try {
        const { topic, partition, message } = payload;

        if (!message.value) {
          logger.warn('Received message with no value', { topic, partition });
          return;
        }

        const data = JSON.parse(message.value.toString());

        // Determine if it's an inter-agent message or event
        if (topic.startsWith('agent-messages-')) {
          await this.processInterAgentMessage(data as InterAgentMessage);
        } else if (topic.startsWith('agent-events-')) {
          await this.processAgentEvent(data as AgentEvent);
        }

        span.setStatus({ code: SpanStatusCode.OK });
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.recordException(error as Error);
        logger.error('Failed to handle message', { error, payload });
      } finally {
        span.end();
      }
    });
  }

  /**
   * Process inter-agent message
   */
  private async processInterAgentMessage(message: InterAgentMessage): Promise<void> {
    const handlers = this.messageHandlers.get(message.messageType) || [];

    if (handlers.length === 0) {
      logger.debug('No handlers for message type', {
        messageType: message.messageType,
      });
      return;
    }

    logger.debug('Processing inter-agent message', {
      fromAgent: message.fromAgent,
      toAgent: message.toAgent,
      messageType: message.messageType,
    });

    await Promise.all(handlers.map((handler) => handler(message)));
  }

  /**
   * Process agent event
   */
  private async processAgentEvent(event: AgentEvent): Promise<void> {
    // Don't process own events
    if (event.agentId === this.agentId) {
      return;
    }

    const handlers = this.eventHandlers.get(event.eventType) || [];

    if (handlers.length === 0) {
      logger.debug('No handlers for event type', {
        eventType: event.eventType,
      });
      return;
    }

    logger.debug('Processing agent event', {
      fromAgent: event.agentId,
      eventType: event.eventType,
    });

    await Promise.all(handlers.map((handler) => handler(event)));
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect(): Promise<void> {
    try {
      await this.consumer.disconnect();
      await this.producer.disconnect();

      this.isConnected = false;
      logger.info('Agent coordinator disconnected', {
        agentId: this.agentId,
      });
    } catch (error) {
      logger.error('Failed to disconnect from Kafka', { error });
      throw error;
    }
  }

  /**
   * Get connection status
   */
  getStatus(): { connected: boolean; agentId: string } {
    return {
      connected: this.isConnected,
      agentId: this.agentId,
    };
  }
}
