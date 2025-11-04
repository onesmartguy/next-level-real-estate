/**
 * Claude Agent SDK Mock
 *
 * Provides mock implementations of Claude/Anthropic API for testing.
 * Simulates agent responses, tool use, and prompt caching.
 */

export interface MockMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model: string;
  stopReason?: 'end_turn' | 'max_tokens' | 'stop_sequence';
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationInputTokens?: number;
    cacheReadInputTokens?: number;
  };
}

export interface MockToolCall {
  name: string;
  input: Record<string, any>;
}

export interface MockToolResult {
  toolUseId: string;
  content: string;
  isError?: boolean;
}

export interface MessageRequest {
  model: string;
  maxTokens: number;
  messages: Array<{ role: string; content: string }>;
  system?: string;
  tools?: any[];
  temperature?: number;
}

/**
 * Mock Claude Client
 */
export class ClaudeMock {
  private messages: Map<string, MockMessage> = new Map();
  private messageCounter = 1;
  private cacheHitRate = 0.9; // 90% cache hit rate for testing

  /**
   * Create a message
   */
  async createMessage(request: MessageRequest): Promise<MockMessage> {
    const messageId = `msg_${this.generateId()}`;

    // Simulate prompt caching behavior
    const hasCachedContent = request.system && request.system.length > 1024;
    const cacheReadTokens = hasCachedContent && Math.random() < this.cacheHitRate
      ? Math.floor(request.system!.length / 4) // Rough token estimate
      : 0;

    const inputTokens = Math.floor(
      request.messages.reduce((acc, msg) => acc + msg.content.length, 0) / 4
    );

    // Generate mock response based on input
    const response = this.generateResponse(request);

    const message: MockMessage = {
      id: messageId,
      role: 'assistant',
      content: response,
      model: request.model,
      stopReason: 'end_turn',
      usage: {
        inputTokens,
        outputTokens: Math.floor(response.length / 4),
        cacheReadInputTokens: cacheReadTokens,
        cacheCreationInputTokens: hasCachedContent && cacheReadTokens === 0 ? inputTokens : 0,
      },
    };

    this.messages.set(messageId, message);

    return message;
  }

  /**
   * Create a streaming message
   */
  async *createMessageStream(request: MessageRequest): AsyncGenerator<Partial<MockMessage>> {
    const response = this.generateResponse(request);
    const words = response.split(' ');

    // Yield chunks
    for (const word of words) {
      await new Promise((resolve) => setTimeout(resolve, 10)); // Simulate latency
      yield {
        role: 'assistant',
        content: word + ' ',
      };
    }

    // Yield final message with usage
    yield {
      stopReason: 'end_turn',
      usage: {
        inputTokens: 100,
        outputTokens: words.length,
        cacheReadInputTokens: 50,
      },
    };
  }

  /**
   * Create message with tool use
   */
  async createMessageWithTools(
    request: MessageRequest,
    toolCalls: MockToolCall[]
  ): Promise<{ message: MockMessage; toolCalls: MockToolCall[] }> {
    const messageId = `msg_${this.generateId()}`;

    const message: MockMessage = {
      id: messageId,
      role: 'assistant',
      content: 'I need to use some tools to help you.',
      model: request.model,
      stopReason: 'end_turn',
      usage: {
        inputTokens: 150,
        outputTokens: 50,
      },
    };

    this.messages.set(messageId, message);

    return { message, toolCalls };
  }

  /**
   * Generate response based on request (internal method)
   */
  private generateResponse(request: MessageRequest): string {
    const lastMessage = request.messages[request.messages.length - 1];
    const userInput = lastMessage?.content.toLowerCase() || '';

    // Lead qualification responses
    if (userInput.includes('qualify') || userInput.includes('lead')) {
      return JSON.stringify({
        qualified: true,
        score: 85,
        reason: 'High equity, motivated seller, good property condition',
        nextAction: 'Schedule property viewing',
        estimatedValue: 250000,
      });
    }

    // Market analysis responses
    if (userInput.includes('market') || userInput.includes('analysis')) {
      return JSON.stringify({
        averagePrice: 280000,
        medianPrice: 265000,
        daysOnMarket: 35,
        inventory: 'low',
        trend: 'increasing',
        comparable: [
          { address: '123 Main St', price: 275000, soldDate: '2025-10-01' },
          { address: '456 Oak Ave', price: 290000, soldDate: '2025-09-28' },
        ],
      });
    }

    // Conversation optimization responses
    if (userInput.includes('conversation') || userInput.includes('optimize')) {
      return JSON.stringify({
        suggestions: [
          'Use more empathetic language in opening',
          'Add clarifying questions about timeline',
          'Emphasize quick closing process',
        ],
        sentimentScore: 0.7,
        engagementLevel: 'medium',
        improvementAreas: ['active listening', 'urgency building'],
      });
    }

    // TCPA compliance check
    if (userInput.includes('tcpa') || userInput.includes('consent')) {
      return JSON.stringify({
        compliant: true,
        hasConsent: true,
        consentDate: '2025-10-15T10:30:00Z',
        onDNC: false,
        safeToContact: true,
      });
    }

    // Default response
    return 'Based on the information provided, I recommend proceeding with the lead qualification process. The property shows strong potential for wholesale opportunity.';
  }

  /**
   * Generate mock ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set cache hit rate for testing
   */
  setCacheHitRate(rate: number): void {
    this.cacheHitRate = Math.max(0, Math.min(1, rate));
  }

  /**
   * Reset all messages (for test cleanup)
   */
  reset(): void {
    this.messages.clear();
    this.messageCounter = 1;
    this.cacheHitRate = 0.9;
  }

  /**
   * Get all messages (for testing assertions)
   */
  getAllMessages(): MockMessage[] {
    return Array.from(this.messages.values());
  }

  /**
   * Get total token usage
   */
  getTotalUsage(): {
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    cost: number;
  } {
    const messages = this.getAllMessages();
    const inputTokens = messages.reduce((acc, msg) => acc + (msg.usage?.inputTokens || 0), 0);
    const outputTokens = messages.reduce((acc, msg) => acc + (msg.usage?.outputTokens || 0), 0);
    const cachedTokens = messages.reduce((acc, msg) => acc + (msg.usage?.cacheReadInputTokens || 0), 0);

    // Approximate cost calculation (as of 2025)
    const inputCost = (inputTokens / 1_000_000) * 3.0; // $3 per million input tokens
    const outputCost = (outputTokens / 1_000_000) * 15.0; // $15 per million output tokens
    const cacheCost = (cachedTokens / 1_000_000) * 0.3; // $0.30 per million cached tokens

    return {
      inputTokens,
      outputTokens,
      cachedTokens,
      cost: inputCost + outputCost + cacheCost,
    };
  }
}

/**
 * Mock agent configuration
 */
export interface MockAgentConfig {
  name: string;
  role: string;
  systemPrompt: string;
  tools?: string[];
  temperature?: number;
}

/**
 * Mock multi-agent system
 */
export class MultiAgentMock {
  private agents: Map<string, MockAgentConfig> = new Map();
  private claudeClient: ClaudeMock;

  constructor() {
    this.claudeClient = new ClaudeMock();
  }

  /**
   * Register an agent
   */
  registerAgent(config: MockAgentConfig): void {
    this.agents.set(config.name, config);
  }

  /**
   * Send message to specific agent
   */
  async sendToAgent(agentName: string, message: string): Promise<MockMessage> {
    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new Error(`Agent ${agentName} not found`);
    }

    return this.claudeClient.createMessage({
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 4096,
      messages: [{ role: 'user', content: message }],
      system: agent.systemPrompt,
      temperature: agent.temperature || 0.7,
    });
  }

  /**
   * Coordinate between multiple agents
   */
  async coordinateAgents(
    agents: string[],
    task: string
  ): Promise<Map<string, MockMessage>> {
    const results = new Map<string, MockMessage>();

    for (const agentName of agents) {
      const response = await this.sendToAgent(agentName, task);
      results.set(agentName, response);
    }

    return results;
  }

  /**
   * Reset all agents
   */
  reset(): void {
    this.agents.clear();
    this.claudeClient.reset();
  }

  /**
   * Get Claude client for direct access
   */
  getClaudeClient(): ClaudeMock {
    return this.claudeClient;
  }
}

/**
 * Create mock Claude client instance
 */
export function createClaudeMock(): ClaudeMock {
  return new ClaudeMock();
}

/**
 * Create mock multi-agent system
 */
export function createMultiAgentMock(): MultiAgentMock {
  return new MultiAgentMock();
}

// Export singleton instances for tests
export const claudeMock = createClaudeMock();
export const multiAgentMock = createMultiAgentMock();
