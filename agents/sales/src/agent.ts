import {
  ClaudeClient,
  RagPipeline,
  VectorStore,
  AgentCoordinator,
  AgentConfig,
  AgentMessage,
  logger,
} from '@next-level-re/agent-shared';
import { SALES_SYSTEM_PROMPT } from './prompts';
import { SALES_TOOLS, SalesTools } from './tools';
import { v4 as uuidv4 } from 'uuid';

export class SalesAgent {
  private config: AgentConfig;
  private claudeClient: ClaudeClient;
  private ragPipeline: RagPipeline;
  private coordinator: AgentCoordinator;
  private tools: SalesTools;
  private conversationHistory: Map<string, AgentMessage[]> = new Map();

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = {
      agentId: 'sales-agent',
      name: 'Sales & Marketing Agent',
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 4096,
      temperature: 0.7,
      vectorCollection: 'sales-knowledge',
      kafkaTopics: {
        consume: ['agent-messages-sales-agent', 'campaign-metrics'],
        produce: ['agent-messages-*', 'agent-events-*'],
      },
      ...config,
    };

    this.claudeClient = new ClaudeClient({ model: this.config.model });
    const vectorStore = new VectorStore({ collectionName: this.config.vectorCollection });
    this.ragPipeline = new RagPipeline({ vectorStore });
    this.coordinator = new AgentCoordinator({ agentId: this.config.agentId, topics: this.config.kafkaTopics });
    this.tools = new SalesTools();
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Sales Agent');
    await this.coordinator.connect();
    await this.coordinator.subscribe(this.config.kafkaTopics.consume);
    logger.info('Sales Agent initialized');
  }

  async query(userMessage: string, sessionId?: string): Promise<string> {
    const session = sessionId || uuidv4();
    const ragResults = await this.ragPipeline.retrieve({ query: userMessage, limit: 5 });
    const context = RagPipeline.buildContext(ragResults);
    const history = this.conversationHistory.get(session) || [];

    const messages: AgentMessage[] = [
      ...history,
      { role: 'user', content: `Context:\n${context}\n\nQuery: ${userMessage}` },
    ];

    let response = await this.claudeClient.sendMessage({
      systemPrompt: SALES_SYSTEM_PROMPT,
      messages,
      tools: SALES_TOOLS,
    });

    while (response.stopReason === 'tool_use') {
      const toolUses = ClaudeClient.extractToolUses(response);
      const toolResults = await Promise.all(
        toolUses.map(async (tu) => {
          const result = await this.tools.executeTool(tu.name, tu.input);
          return ClaudeClient.buildToolResult(tu.id, result);
        })
      );

      messages.push({ role: 'assistant', content: response.message.content });
      messages.push({ role: 'user', content: toolResults });

      response = await this.claudeClient.sendMessage({
        systemPrompt: SALES_SYSTEM_PROMPT,
        messages,
        tools: SALES_TOOLS,
      });
    }

    const finalResponse = ClaudeClient.extractText(response);
    history.push({ role: 'user', content: userMessage });
    history.push({ role: 'assistant', content: finalResponse });
    this.conversationHistory.set(session, history.slice(-10));

    return finalResponse;
  }

  getHealth() {
    return { agentId: this.config.agentId, status: 'healthy', model: this.config.model };
  }

  async shutdown() {
    await this.coordinator.disconnect();
  }
}
