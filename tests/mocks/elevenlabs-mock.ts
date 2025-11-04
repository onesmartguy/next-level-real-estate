/**
 * ElevenLabs Conversational AI Mock
 *
 * Provides mock implementations of ElevenLabs API for testing.
 * Simulates conversation creation, streaming, and transcription.
 */

export interface MockConversation {
  conversationId: string;
  agentId: string;
  status: 'idle' | 'connecting' | 'connected' | 'processing' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  transcript?: MockTranscript[];
  metadata?: Record<string, any>;
}

export interface MockTranscript {
  role: 'agent' | 'user';
  message: string;
  timestamp: Date;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface ConversationConfig {
  agentId: string;
  customContext?: string;
  customLLMPrompt?: string;
  firstMessage?: string;
  language?: string;
}

/**
 * Mock ElevenLabs Client
 */
export class ElevenLabsMock {
  private conversations: Map<string, MockConversation> = new Map();
  private conversationCounter = 1;

  /**
   * Create a new conversation
   */
  async createConversation(config: ConversationConfig): Promise<MockConversation> {
    const conversationId = `conv_${this.generateId()}`;

    const conversation: MockConversation = {
      conversationId,
      agentId: config.agentId,
      status: 'connecting',
      startTime: new Date(),
      transcript: [],
      metadata: {
        customContext: config.customContext,
        language: config.language || 'en-US',
      },
    };

    this.conversations.set(conversationId, conversation);

    // Simulate connection
    setTimeout(() => this.updateStatus(conversationId, 'connected'), 100);

    // Add first message if provided
    if (config.firstMessage) {
      setTimeout(() => {
        this.addTranscriptEntry(conversationId, {
          role: 'agent',
          message: config.firstMessage!,
          timestamp: new Date(),
          sentiment: 'neutral',
        });
      }, 200);
    }

    return conversation;
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<MockConversation | null> {
    return this.conversations.get(conversationId) || null;
  }

  /**
   * Add message to conversation
   */
  async addMessage(
    conversationId: string,
    message: string,
    role: 'agent' | 'user' = 'user'
  ): Promise<MockTranscript> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const entry: MockTranscript = {
      role,
      message,
      timestamp: new Date(),
      sentiment: this.analyzeSentiment(message),
    };

    conversation.transcript?.push(entry);
    this.conversations.set(conversationId, conversation);

    // Simulate agent response
    if (role === 'user') {
      setTimeout(() => {
        this.simulateAgentResponse(conversationId, message);
      }, 300);
    }

    return entry;
  }

  /**
   * Complete conversation
   */
  async completeConversation(conversationId: string): Promise<MockConversation | null> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return null;

    conversation.status = 'completed';
    conversation.endTime = new Date();
    conversation.duration = conversation.startTime
      ? (conversation.endTime.getTime() - conversation.startTime.getTime()) / 1000
      : 0;

    this.conversations.set(conversationId, conversation);

    return conversation;
  }

  /**
   * Get conversation transcript
   */
  async getTranscript(conversationId: string): Promise<MockTranscript[]> {
    const conversation = this.conversations.get(conversationId);
    return conversation?.transcript || [];
  }

  /**
   * Analyze conversation sentiment
   */
  async analyzeSentiment(conversationId: string): Promise<{
    overall: 'positive' | 'neutral' | 'negative';
    details: Array<{ timestamp: Date; sentiment: string; confidence: number }>;
  }> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation || !conversation.transcript) {
      return { overall: 'neutral', details: [] };
    }

    const sentiments = conversation.transcript.map((entry) => entry.sentiment || 'neutral');
    const positiveCount = sentiments.filter((s) => s === 'positive').length;
    const negativeCount = sentiments.filter((s) => s === 'negative').length;

    let overall: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (positiveCount > negativeCount) overall = 'positive';
    else if (negativeCount > positiveCount) overall = 'negative';

    const details = conversation.transcript.map((entry) => ({
      timestamp: entry.timestamp,
      sentiment: entry.sentiment || 'neutral',
      confidence: 0.85,
    }));

    return { overall, details };
  }

  /**
   * Simulate agent response (internal method)
   */
  private simulateAgentResponse(conversationId: string, userMessage: string): void {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return;

    // Generate mock response based on user message
    let agentMessage = 'I understand. How can I help you with that?';

    if (userMessage.toLowerCase().includes('price') || userMessage.toLowerCase().includes('cost')) {
      agentMessage = 'The property is priced competitively based on market comps. Would you like more details?';
    } else if (userMessage.toLowerCase().includes('interested') || userMessage.toLowerCase().includes('yes')) {
      agentMessage = 'Great! Let me get some information from you to proceed.';
    } else if (userMessage.toLowerCase().includes('not interested') || userMessage.toLowerCase().includes('no')) {
      agentMessage = 'I understand. Thank you for your time. Have a great day!';
    }

    const entry: MockTranscript = {
      role: 'agent',
      message: agentMessage,
      timestamp: new Date(),
      sentiment: 'neutral',
    };

    conversation.transcript?.push(entry);
    this.conversations.set(conversationId, conversation);
  }

  /**
   * Analyze sentiment of a message (internal method)
   */
  private analyzeSentiment(message: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['yes', 'great', 'interested', 'love', 'excellent', 'perfect'];
    const negativeWords = ['no', 'not interested', 'expensive', 'bad', 'terrible', 'never'];

    const lowerMessage = message.toLowerCase();
    const hasPositive = positiveWords.some((word) => lowerMessage.includes(word));
    const hasNegative = negativeWords.some((word) => lowerMessage.includes(word));

    if (hasPositive && !hasNegative) return 'positive';
    if (hasNegative && !hasPositive) return 'negative';
    return 'neutral';
  }

  /**
   * Update conversation status (internal method)
   */
  private updateStatus(conversationId: string, status: MockConversation['status']): void {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.status = status;
      this.conversations.set(conversationId, conversation);
    }
  }

  /**
   * Add transcript entry (internal method)
   */
  private addTranscriptEntry(conversationId: string, entry: MockTranscript): void {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.transcript?.push(entry);
      this.conversations.set(conversationId, conversation);
    }
  }

  /**
   * Generate mock ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Reset all conversations (for test cleanup)
   */
  reset(): void {
    this.conversations.clear();
    this.conversationCounter = 1;
  }

  /**
   * Get all conversations (for testing assertions)
   */
  getAllConversations(): MockConversation[] {
    return Array.from(this.conversations.values());
  }
}

/**
 * Create mock ElevenLabs client instance
 */
export function createElevenLabsMock(): ElevenLabsMock {
  return new ElevenLabsMock();
}

/**
 * Mock conversation outcome generator
 */
export function generateConversationOutcome(conversation: MockConversation): {
  qualified: boolean;
  interest_level: 'high' | 'medium' | 'low';
  next_action: string;
  summary: string;
} {
  const transcript = conversation.transcript || [];
  const userMessages = transcript.filter((t) => t.role === 'user');

  // Simple heuristic based on sentiment
  const positiveSentiments = transcript.filter((t) => t.sentiment === 'positive').length;
  const negativeSentiments = transcript.filter((t) => t.sentiment === 'negative').length;

  const qualified = positiveSentiments > negativeSentiments && userMessages.length >= 3;
  let interest_level: 'high' | 'medium' | 'low' = 'medium';

  if (positiveSentiments >= 3) interest_level = 'high';
  else if (negativeSentiments >= 2) interest_level = 'low';

  const next_action = qualified ? 'Schedule follow-up appointment' : 'Add to nurture campaign';
  const summary = `Conversation lasted ${conversation.duration || 0}s with ${userMessages.length} user responses.`;

  return { qualified, interest_level, next_action, summary };
}

// Export singleton instance for tests
export const elevenLabsMock = createElevenLabsMock();
