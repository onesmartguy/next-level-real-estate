/**
 * Architecture Agent - System design and optimization
 */

import {
  ClaudeClient,
  RagPipeline,
  VectorStore,
  AgentCoordinator,
  AgentConfig,
  AgentMessage,
  AgentEventType,
  RagDocument,
  logger,
} from '@next-level-re/agent-shared';
import { ARCHITECT_SYSTEM_PROMPT } from './prompts';
import { ARCHITECT_TOOLS, ArchitectTools } from './tools';
import { v4 as uuidv4 } from 'uuid';

export class ArchitectAgent {
  private config: AgentConfig;
  private claudeClient: ClaudeClient;
  private ragPipeline: RagPipeline;
  private coordinator: AgentCoordinator;
  private tools: ArchitectTools;
  private conversationHistory: Map<string, AgentMessage[]> = new Map();

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = {
      agentId: 'architect-agent',
      name: 'Architecture Agent',
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 4096,
      temperature: 0.7,
      vectorCollection: 'architect-knowledge',
      kafkaTopics: {
        consume: [
          'agent-messages-architect-agent',
          'agent-events-knowledge_update',
          'system-metrics',
        ],
        produce: ['agent-messages-*', 'agent-events-*'],
      },
      ...config,
    };

    this.claudeClient = new ClaudeClient({
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
    });

    const vectorStore = new VectorStore({
      collectionName: this.config.vectorCollection,
      vectorSize: 1536,
    });

    this.ragPipeline = new RagPipeline({
      vectorStore,
      embeddingModel: 'text-embedding-3-large',
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    this.coordinator = new AgentCoordinator({
      agentId: this.config.agentId,
      topics: this.config.kafkaTopics,
    });

    this.tools = new ArchitectTools();
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    logger.info('Initializing Architecture Agent', {
      agentId: this.config.agentId,
    });

    try {
      // Connect to Kafka
      await this.coordinator.connect();
      await this.coordinator.subscribe(this.config.kafkaTopics.consume);

      // Register event handlers
      this.coordinator.onEvent(AgentEventType.KNOWLEDGE_UPDATE, async (event) => {
        await this.handleKnowledgeUpdate(event);
      });

      // Register message handlers
      this.coordinator.onMessage('optimization_request', async (message) => {
        await this.handleOptimizationRequest(message);
      });

      this.coordinator.onMessage('architecture_review', async (message) => {
        await this.handleArchitectureReview(message);
      });

      logger.info('Architecture Agent initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Architecture Agent', { error });
      throw error;
    }
  }

  /**
   * Process a user query with RAG context
   */
  async query(userMessage: string, sessionId?: string): Promise<string> {
    const session = sessionId || uuidv4();

    logger.info('Processing architecture query', {
      sessionId: session,
      messageLength: userMessage.length,
    });

    try {
      // Retrieve relevant knowledge
      const ragResults = await this.ragPipeline.retrieve({
        query: userMessage,
        limit: 5,
        scoreThreshold: 0.7,
      });

      const context = RagPipeline.buildContext(ragResults);

      // Get conversation history
      const history = this.conversationHistory.get(session) || [];

      // Build messages with RAG context
      const messages: AgentMessage[] = [
        ...history,
        {
          role: 'user',
          content: `Context from knowledge base:\n${context}\n\nUser query: ${userMessage}`,
        },
      ];

      // Send to Claude
      let response = await this.claudeClient.sendMessage({
        systemPrompt: ARCHITECT_SYSTEM_PROMPT,
        messages,
        tools: ARCHITECT_TOOLS,
      });

      // Handle tool calls
      while (response.stopReason === 'tool_use') {
        const toolUses = ClaudeClient.extractToolUses(response);
        logger.debug('Tool calls requested', {
          toolCount: toolUses.length,
          tools: toolUses.map((t) => t.name),
        });

        // Execute tools
        const toolResults = await Promise.all(
          toolUses.map(async (toolUse) => {
            const result = await this.tools.executeTool(toolUse.name, toolUse.input);
            return ClaudeClient.buildToolResult(toolUse.id, result);
          })
        );

        // Add assistant response and tool results to messages
        messages.push({
          role: 'assistant',
          content: response.message.content,
        });

        messages.push({
          role: 'user',
          content: toolResults,
        });

        // Continue conversation with tool results
        response = await this.claudeClient.sendMessage({
          systemPrompt: ARCHITECT_SYSTEM_PROMPT,
          messages,
          tools: ARCHITECT_TOOLS,
        });
      }

      const finalResponse = ClaudeClient.extractText(response);

      // Update conversation history
      history.push({ role: 'user', content: userMessage });
      history.push({ role: 'assistant', content: finalResponse });
      this.conversationHistory.set(session, history.slice(-10)); // Keep last 10 messages

      logger.info('Query processed successfully', {
        sessionId: session,
        tokenUsage: response.usage,
        cacheHit: !!response.usage.cacheReadTokens,
      });

      return finalResponse;
    } catch (error) {
      logger.error('Failed to process query', { error, sessionId: session });
      throw error;
    }
  }

  /**
   * Add document to knowledge base
   */
  async addKnowledge(document: RagDocument): Promise<void> {
    logger.info('Adding knowledge to base', {
      documentId: document.id,
      category: document.metadata.category,
    });

    try {
      await this.ragPipeline.indexDocument(document);

      // Publish knowledge update event
      await this.coordinator.publishEvent({
        eventType: AgentEventType.KNOWLEDGE_UPDATE,
        data: {
          documents: [document],
          updateReason: 'Manual knowledge addition',
          source: this.config.agentId,
        },
      });

      logger.info('Knowledge added successfully', {
        documentId: document.id,
      });
    } catch (error) {
      logger.error('Failed to add knowledge', { error, documentId: document.id });
      throw error;
    }
  }

  /**
   * Analyze system performance
   */
  async analyzeSystemPerformance(serviceName?: string): Promise<string> {
    logger.info('Analyzing system performance', { serviceName });

    const query = serviceName
      ? `Analyze the performance of ${serviceName} service and provide optimization recommendations.`
      : 'Analyze overall system performance and identify bottlenecks.';

    return this.query(query);
  }

  /**
   * Research technology
   */
  async researchTechnology(topic: string): Promise<string> {
    logger.info('Researching technology', { topic });

    const query = `Research the latest developments in ${topic}. Provide a summary of innovations, best practices, and potential applications for our real estate AI platform.`;

    return this.query(query);
  }

  /**
   * Handle knowledge update events from other agents
   */
  private async handleKnowledgeUpdate(event: any): Promise<void> {
    logger.info('Received knowledge update event', {
      fromAgent: event.agentId,
      documentCount: event.data.documents?.length,
    });

    // Process and potentially integrate knowledge from other agents
    // For now, just log
  }

  /**
   * Handle optimization requests
   */
  private async handleOptimizationRequest(message: any): Promise<void> {
    logger.info('Received optimization request', {
      fromAgent: message.fromAgent,
      payload: message.payload,
    });

    const response = await this.query(
      `Optimization request: ${JSON.stringify(message.payload)}`
    );

    // Send response back
    await this.coordinator.sendMessage({
      toAgent: message.fromAgent,
      messageType: 'optimization_response',
      payload: { response },
      correlationId: message.correlationId,
    });
  }

  /**
   * Handle architecture review requests
   */
  private async handleArchitectureReview(message: any): Promise<void> {
    logger.info('Received architecture review request', {
      fromAgent: message.fromAgent,
    });

    const response = await this.query(
      `Architecture review request: ${JSON.stringify(message.payload)}`
    );

    await this.coordinator.sendMessage({
      toAgent: message.fromAgent,
      messageType: 'architecture_review_response',
      payload: { response },
      correlationId: message.correlationId,
    });
  }

  /**
   * Get agent health status
   */
  getHealth(): any {
    return {
      agentId: this.config.agentId,
      name: this.config.name,
      status: 'healthy',
      coordinator: this.coordinator.getStatus(),
      model: this.config.model,
    };
  }

  /**
   * Shutdown agent gracefully
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Architecture Agent');

    try {
      await this.coordinator.disconnect();
      logger.info('Architecture Agent shut down successfully');
    } catch (error) {
      logger.error('Error during shutdown', { error });
      throw error;
    }
  }
}
