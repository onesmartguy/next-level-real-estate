/**
 * Conversation AI Agent - Transcript analysis and conversation optimization
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
import { CONVERSATION_SYSTEM_PROMPT } from './prompts';
import { CONVERSATION_TOOLS, ConversationTools } from './tools';
import { v4 as uuidv4 } from 'uuid';

export class ConversationAgent {
  private config: AgentConfig;
  private claudeClient: ClaudeClient;
  private ragPipeline: RagPipeline;
  private coordinator: AgentCoordinator;
  private tools: ConversationTools;
  private conversationHistory: Map<string, AgentMessage[]> = new Map();

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = {
      agentId: 'conversation-agent',
      name: 'Conversation AI Agent',
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 4096,
      temperature: 0.7,
      vectorCollection: 'conversation-knowledge',
      kafkaTopics: {
        consume: [
          'agent-messages-conversation-agent',
          'call-transcripts',
          'call-completed',
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

    this.tools = new ConversationTools();
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Conversation Agent');

    await this.coordinator.connect();
    await this.coordinator.subscribe(this.config.kafkaTopics.consume);

    this.coordinator.onMessage('transcript_analysis_request', async (message) => {
      await this.handleTranscriptAnalysisRequest(message);
    });

    this.coordinator.onMessage('conversation_design_request', async (message) => {
      await this.handleConversationDesignRequest(message);
    });

    logger.info('Conversation Agent initialized successfully');
  }

  async query(userMessage: string, sessionId?: string): Promise<string> {
    const session = sessionId || uuidv4();

    const ragResults = await this.ragPipeline.retrieve({
      query: userMessage,
      limit: 5,
      scoreThreshold: 0.7,
    });

    const context = RagPipeline.buildContext(ragResults);
    const history = this.conversationHistory.get(session) || [];

    const messages: AgentMessage[] = [
      ...history,
      {
        role: 'user',
        content: `Context from knowledge base:\n${context}\n\nUser query: ${userMessage}`,
      },
    ];

    let response = await this.claudeClient.sendMessage({
      systemPrompt: CONVERSATION_SYSTEM_PROMPT,
      messages,
      tools: CONVERSATION_TOOLS,
    });

    while (response.stopReason === 'tool_use') {
      const toolUses = ClaudeClient.extractToolUses(response);

      const toolResults = await Promise.all(
        toolUses.map(async (toolUse) => {
          const result = await this.tools.executeTool(toolUse.name, toolUse.input);
          return ClaudeClient.buildToolResult(toolUse.id, result);
        })
      );

      messages.push({ role: 'assistant', content: response.message.content });
      messages.push({ role: 'user', content: toolResults });

      response = await this.claudeClient.sendMessage({
        systemPrompt: CONVERSATION_SYSTEM_PROMPT,
        messages,
        tools: CONVERSATION_TOOLS,
      });
    }

    const finalResponse = ClaudeClient.extractText(response);

    history.push({ role: 'user', content: userMessage });
    history.push({ role: 'assistant', content: finalResponse });
    this.conversationHistory.set(session, history.slice(-10));

    return finalResponse;
  }

  async analyzeTranscript(transcript: string, metadata?: any): Promise<string> {
    logger.info('Analyzing call transcript', {
      transcriptLength: transcript.length,
    });

    const query = `Analyze this call transcript and provide insights:\n\n${transcript}\n\nMetadata: ${JSON.stringify(metadata || {})}`;
    return this.query(query);
  }

  async designConversationFlow(useCase: string, targetOutcome: string): Promise<string> {
    const query = `Design a conversation flow for ${useCase} with target outcome: ${targetOutcome}`;
    return this.query(query);
  }

  async addKnowledge(document: RagDocument): Promise<void> {
    await this.ragPipeline.indexDocument(document);

    await this.coordinator.publishEvent({
      eventType: AgentEventType.KNOWLEDGE_UPDATE,
      data: {
        documents: [document],
        updateReason: 'Conversation knowledge addition',
        source: this.config.agentId,
      },
    });
  }

  private async handleTranscriptAnalysisRequest(message: any): Promise<void> {
    const analysis = await this.analyzeTranscript(
      message.payload.transcript,
      message.payload.metadata
    );

    await this.coordinator.sendMessage({
      toAgent: message.fromAgent,
      messageType: 'transcript_analysis_response',
      payload: { analysis },
      correlationId: message.correlationId,
    });
  }

  private async handleConversationDesignRequest(message: any): Promise<void> {
    const design = await this.designConversationFlow(
      message.payload.use_case,
      message.payload.target_outcome
    );

    await this.coordinator.sendMessage({
      toAgent: message.fromAgent,
      messageType: 'conversation_design_response',
      payload: { design },
      correlationId: message.correlationId,
    });
  }

  getHealth(): any {
    return {
      agentId: this.config.agentId,
      name: this.config.name,
      status: 'healthy',
      coordinator: this.coordinator.getStatus(),
      model: this.config.model,
    };
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Conversation Agent');
    await this.coordinator.disconnect();
  }
}
