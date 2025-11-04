import { Kafka, Producer, ProducerRecord } from 'kafkajs';
import config from '../config';
import logger from './logger';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('lead-service-kafka');

class KafkaProducer {
  private kafka: Kafka;
  private producer: Producer;
  private isConnected: boolean = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.producer.connect();
      this.isConnected = true;
      logger.info('Kafka producer connected successfully');
    } catch (error) {
      logger.error('Failed to connect Kafka producer', { error });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.producer.disconnect();
      this.isConnected = false;
      logger.info('Kafka producer disconnected');
    } catch (error) {
      logger.error('Error disconnecting Kafka producer', { error });
      throw error;
    }
  }

  async sendEvent(
    topic: string,
    key: string,
    value: Record<string, any>,
    headers?: Record<string, string>
  ): Promise<void> {
    const span = tracer.startSpan('kafka.send', {
      attributes: {
        'messaging.system': 'kafka',
        'messaging.destination': topic,
        'messaging.operation': 'send'
      }
    });

    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const message = {
        key,
        value: JSON.stringify(value),
        headers: headers || {},
        timestamp: Date.now().toString()
      };

      const record: ProducerRecord = {
        topic,
        messages: [message]
      };

      await this.producer.send(record);

      span.setStatus({ code: SpanStatusCode.OK });
      logger.debug('Event sent to Kafka', { topic, key });
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      logger.error('Failed to send event to Kafka', { topic, key, error });
      throw error;
    } finally {
      span.end();
    }
  }

  async sendLeadReceivedEvent(leadId: string, leadData: Record<string, any>): Promise<void> {
    await this.sendEvent(
      'lead.received',
      leadId,
      {
        eventType: 'LeadReceived',
        leadId,
        timestamp: new Date().toISOString(),
        data: leadData
      }
    );
  }

  async sendLeadQualifiedEvent(leadId: string, qualificationData: Record<string, any>): Promise<void> {
    await this.sendEvent(
      'lead.qualified',
      leadId,
      {
        eventType: 'LeadQualified',
        leadId,
        timestamp: new Date().toISOString(),
        data: qualificationData
      }
    );
  }

  async sendLeadUpdatedEvent(leadId: string, updateData: Record<string, any>): Promise<void> {
    await this.sendEvent(
      'lead.updated',
      leadId,
      {
        eventType: 'LeadUpdated',
        leadId,
        timestamp: new Date().toISOString(),
        data: updateData
      }
    );
  }

  async sendLeadDuplicateEvent(leadId: string, originalLeadId: string): Promise<void> {
    await this.sendEvent(
      'lead.duplicate',
      leadId,
      {
        eventType: 'LeadDuplicate',
        leadId,
        originalLeadId,
        timestamp: new Date().toISOString()
      }
    );
  }
}

// Singleton instance
const kafkaProducer = new KafkaProducer();

export default kafkaProducer;
