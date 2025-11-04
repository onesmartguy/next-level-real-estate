/**
 * Kafka Mock
 *
 * Provides mock implementations of KafkaJS for testing.
 * Simulates event publishing, consuming, and message processing.
 */

export interface MockMessage {
  key?: string | Buffer;
  value: string | Buffer;
  headers?: Record<string, string>;
  timestamp?: string;
  partition?: number;
  offset?: string;
}

export interface MockProducerRecord {
  topic: string;
  messages: MockMessage[];
}

export interface MockConsumerConfig {
  groupId: string;
  topics: string[];
}

/**
 * Mock Kafka Producer
 */
export class KafkaProducerMock {
  private sentMessages: Map<string, MockMessage[]> = new Map();
  private connected = false;

  /**
   * Connect to Kafka
   */
  async connect(): Promise<void> {
    this.connected = true;
    await new Promise((resolve) => setTimeout(resolve, 10)); // Simulate connection delay
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect(): Promise<void> {
    this.connected = false;
  }

  /**
   * Send messages to topic
   */
  async send(record: MockProducerRecord): Promise<void> {
    if (!this.connected) {
      throw new Error('Producer not connected');
    }

    const { topic, messages } = record;

    // Add metadata to messages
    const enrichedMessages = messages.map((msg, index) => ({
      ...msg,
      timestamp: msg.timestamp || new Date().toISOString(),
      partition: msg.partition !== undefined ? msg.partition : 0,
      offset: msg.offset || String(this.getNextOffset(topic)),
    }));

    // Store messages
    const existing = this.sentMessages.get(topic) || [];
    this.sentMessages.set(topic, [...existing, ...enrichedMessages]);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 5));
  }

  /**
   * Send batch of messages
   */
  async sendBatch(records: MockProducerRecord[]): Promise<void> {
    for (const record of records) {
      await this.send(record);
    }
  }

  /**
   * Get messages sent to a topic
   */
  getMessagesByTopic(topic: string): MockMessage[] {
    return this.sentMessages.get(topic) || [];
  }

  /**
   * Get all sent messages
   */
  getAllMessages(): Map<string, MockMessage[]> {
    return new Map(this.sentMessages);
  }

  /**
   * Get next offset for topic
   */
  private getNextOffset(topic: string): number {
    const messages = this.sentMessages.get(topic) || [];
    return messages.length;
  }

  /**
   * Clear all messages (for test cleanup)
   */
  clear(): void {
    this.sentMessages.clear();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}

/**
 * Mock Kafka Consumer
 */
export class KafkaConsumerMock {
  private connected = false;
  private subscriptions: Set<string> = new Set();
  private messageHandlers: Map<string, (message: MockMessage) => void | Promise<void>> = new Map();
  private running = false;

  constructor(private config: MockConsumerConfig) {}

  /**
   * Connect to Kafka
   */
  async connect(): Promise<void> {
    this.connected = true;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect(): Promise<void> {
    this.connected = false;
    this.running = false;
  }

  /**
   * Subscribe to topics
   */
  async subscribe(topics: { topics: string[]; fromBeginning?: boolean }): Promise<void> {
    if (!this.connected) {
      throw new Error('Consumer not connected');
    }

    topics.topics.forEach((topic) => this.subscriptions.add(topic));
  }

  /**
   * Run consumer
   */
  async run(config: {
    eachMessage: (payload: {
      topic: string;
      partition: number;
      message: MockMessage;
    }) => void | Promise<void>;
  }): Promise<void> {
    if (!this.connected) {
      throw new Error('Consumer not connected');
    }

    this.running = true;

    // Store message handler for manual triggering
    this.subscriptions.forEach((topic) => {
      this.messageHandlers.set(topic, async (message) => {
        await config.eachMessage({
          topic,
          partition: message.partition || 0,
          message,
        });
      });
    });
  }

  /**
   * Manually trigger message processing (for testing)
   */
  async processMessage(topic: string, message: MockMessage): Promise<void> {
    if (!this.subscriptions.has(topic)) {
      throw new Error(`Not subscribed to topic ${topic}`);
    }

    const handler = this.messageHandlers.get(topic);
    if (handler) {
      await handler(message);
    }
  }

  /**
   * Commit offsets
   */
  async commitOffsets(offsets?: any[]): Promise<void> {
    // Mock implementation - no-op
  }

  /**
   * Pause consumption
   */
  pause(topics?: { topics: string[] }): void {
    this.running = false;
  }

  /**
   * Resume consumption
   */
  resume(topics?: { topics: string[] }): void {
    this.running = true;
  }

  /**
   * Get subscribed topics
   */
  getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }

  /**
   * Check if consumer is running
   */
  isRunning(): boolean {
    return this.running;
  }
}

/**
 * Mock Kafka Admin
 */
export class KafkaAdminMock {
  private connected = false;
  private topics: Set<string> = new Set();

  /**
   * Connect to Kafka
   */
  async connect(): Promise<void> {
    this.connected = true;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect(): Promise<void> {
    this.connected = false;
  }

  /**
   * Create topics
   */
  async createTopics(config: {
    topics: Array<{ topic: string; numPartitions?: number; replicationFactor?: number }>;
  }): Promise<boolean> {
    if (!this.connected) {
      throw new Error('Admin not connected');
    }

    config.topics.forEach((topicConfig) => {
      this.topics.add(topicConfig.topic);
    });

    return true;
  }

  /**
   * Delete topics
   */
  async deleteTopics(config: { topics: string[] }): Promise<void> {
    if (!this.connected) {
      throw new Error('Admin not connected');
    }

    config.topics.forEach((topic) => {
      this.topics.delete(topic);
    });
  }

  /**
   * List topics
   */
  async listTopics(): Promise<string[]> {
    if (!this.connected) {
      throw new Error('Admin not connected');
    }

    return Array.from(this.topics);
  }

  /**
   * Check if topic exists
   */
  hasTopics(topic: string): boolean {
    return this.topics.has(topic);
  }
}

/**
 * Mock Kafka Client
 */
export class KafkaMock {
  private producers: Map<string, KafkaProducerMock> = new Map();
  private consumers: Map<string, KafkaConsumerMock> = new Map();
  private admin: KafkaAdminMock = new KafkaAdminMock();

  /**
   * Create producer
   */
  producer(): KafkaProducerMock {
    const producer = new KafkaProducerMock();
    const id = `producer_${Date.now()}`;
    this.producers.set(id, producer);
    return producer;
  }

  /**
   * Create consumer
   */
  consumer(config: { groupId: string }): KafkaConsumerMock {
    const consumer = new KafkaConsumerMock({ groupId: config.groupId, topics: [] });
    this.consumers.set(config.groupId, consumer);
    return consumer;
  }

  /**
   * Create admin client
   */
  admin(): KafkaAdminMock {
    return this.admin;
  }

  /**
   * Get all producers
   */
  getAllProducers(): KafkaProducerMock[] {
    return Array.from(this.producers.values());
  }

  /**
   * Get all consumers
   */
  getAllConsumers(): KafkaConsumerMock[] {
    return Array.from(this.consumers.values());
  }

  /**
   * Reset all (for test cleanup)
   */
  reset(): void {
    this.producers.forEach((producer) => producer.clear());
    this.producers.clear();
    this.consumers.clear();
    this.admin = new KafkaAdminMock();
  }
}

/**
 * Create mock Kafka instance
 */
export function createKafkaMock(): KafkaMock {
  return new KafkaMock();
}

/**
 * Event type definitions for the platform
 */
export const EventTypes = {
  LEAD_RECEIVED: 'lead.received',
  LEAD_QUALIFIED: 'lead.qualified',
  LEAD_UPDATED: 'lead.updated',
  CALL_INITIATED: 'call.initiated',
  CALL_COMPLETED: 'call.completed',
  CONVERSATION_ANALYZED: 'conversation.analyzed',
  KNOWLEDGE_UPDATED: 'knowledge.updated',
  CAMPAIGN_OPTIMIZED: 'campaign.optimized',
} as const;

/**
 * Create event message
 */
export function createEventMessage<T = any>(
  eventType: string,
  payload: T,
  metadata?: Record<string, string>
): MockMessage {
  return {
    key: eventType,
    value: JSON.stringify({
      type: eventType,
      payload,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
    }),
    headers: {
      'event-type': eventType,
      'event-version': '1.0',
      ...(metadata || {}),
    },
  };
}

// Export singleton instance for tests
export const kafkaMock = createKafkaMock();
