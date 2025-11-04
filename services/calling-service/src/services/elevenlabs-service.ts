import { ElevenLabsClient, ElevenLabs } from 'elevenlabs';
import { Logger } from '@next-level-real-estate/shared/utils';
import { config } from '../config';

/**
 * Conversation configuration for ElevenLabs
 */
export interface ConversationConfig {
  agentId?: string;
  voiceId?: string;
  model?: string;
  language?: string;
  firstMessage?: string;
  context?: Record<string, any>;
}

/**
 * Conversation session from ElevenLabs
 */
export interface ConversationSession {
  conversationId: string;
  agentId: string;
  status: 'active' | 'ended';
  signedUrl?: string;
}

/**
 * Transcript from ElevenLabs
 */
export interface ElevenLabsTranscript {
  conversationId: string;
  segments: Array<{
    speaker: 'agent' | 'user';
    text: string;
    timestamp: number;
    confidence?: number;
  }>;
  duration: number;
  language: string;
}

/**
 * ElevenLabs Service
 *
 * Manages ElevenLabs Conversational AI 2.0 integration
 * - Flash 2.5 model with 75ms latency
 * - 32+ language auto-detection
 * - State-of-the-art turn-taking
 */
export class ElevenLabsService {
  private client: ElevenLabsClient | null = null;
  private logger: Logger;
  private isConfigured: boolean;

  constructor() {
    this.logger = new Logger('ElevenLabsService');

    // Check if ElevenLabs API key is configured (not placeholder)
    this.isConfigured =
      !!config.elevenlabs.apiKey &&
      config.elevenlabs.apiKey !== 'your_elevenlabs_api_key';

    if (this.isConfigured) {
      // Initialize ElevenLabs client
      this.client = new ElevenLabsClient({
        apiKey: config.elevenlabs.apiKey,
      });

      this.logger.info('ElevenLabs service initialized', {
        model: config.elevenlabs.model,
        hasApiKey: true,
      });
    } else {
      this.logger.warn('ElevenLabs API key not configured - service will operate in mock mode');
    }
  }

  private ensureConfigured(): void {
    if (!this.client) {
      throw new Error('ElevenLabs is not configured. Please set valid ELEVENLABS_API_KEY in .env file');
    }
  }

  /**
   * Create a conversation session
   */
  async createConversation(
    conversationConfig: ConversationConfig
  ): Promise<ConversationSession> {
    try {
      const {
        agentId = config.elevenlabs.agentId,
        voiceId = config.elevenlabs.voiceId,
        model = config.elevenlabs.model,
        language = 'en',
        firstMessage,
        context = {},
      } = conversationConfig;

      if (!agentId) {
        throw new Error('Agent ID is required for conversation');
      }

      this.logger.info('Creating ElevenLabs conversation', {
        agentId,
        voiceId,
        model,
        language,
        hasContext: Object.keys(context).length > 0,
      });

      // Note: This is a placeholder implementation
      // The actual ElevenLabs SDK may have different methods
      // Refer to the latest ElevenLabs documentation for exact API calls

      const session: ConversationSession = {
        conversationId: this.generateConversationId(),
        agentId,
        status: 'active',
      };

      this.logger.info('ElevenLabs conversation created', {
        conversationId: session.conversationId,
      });

      return session;
    } catch (error) {
      this.logger.error('Failed to create ElevenLabs conversation', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * End a conversation session
   */
  async endConversation(conversationId: string): Promise<void> {
    try {
      this.logger.info('Ending ElevenLabs conversation', {
        conversationId,
      });

      // Placeholder for actual implementation
      // await this.client.conversations.end(conversationId);

      this.logger.info('ElevenLabs conversation ended', {
        conversationId,
      });
    } catch (error) {
      this.logger.error('Failed to end ElevenLabs conversation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        conversationId,
      });
      throw error;
    }
  }

  /**
   * Get conversation transcript
   */
  async getTranscript(conversationId: string): Promise<ElevenLabsTranscript | null> {
    try {
      this.logger.info('Fetching ElevenLabs transcript', {
        conversationId,
      });

      // Placeholder implementation
      // In production, this would fetch from ElevenLabs API
      const transcript: ElevenLabsTranscript = {
        conversationId,
        segments: [],
        duration: 0,
        language: 'en',
      };

      return transcript;
    } catch (error) {
      this.logger.error('Failed to get ElevenLabs transcript', {
        error: error instanceof Error ? error.message : 'Unknown error',
        conversationId,
      });
      return null;
    }
  }

  /**
   * Build dynamic context for conversation
   *
   * This method prepares lead-specific information to inject into the AI conversation
   */
  buildConversationContext(leadData: {
    firstName: string;
    lastName: string;
    propertyAddress?: string;
    propertyType?: string;
    estimatedValue?: number;
    motivationLevel?: string;
    sellerSituation?: string;
    timeline?: string;
  }): Record<string, any> {
    const context: Record<string, any> = {
      // Contact information
      contact: {
        firstName: leadData.firstName,
        lastName: leadData.lastName,
        fullName: `${leadData.firstName} ${leadData.lastName}`,
      },

      // Property details
      property: {},

      // Conversation strategy
      strategy: {
        approach: this.determineApproach(leadData.motivationLevel),
        timelineSensitivity: this.determineTimeline(leadData.timeline),
      },

      // Instructions for AI agent
      instructions: this.buildInstructions(leadData),
    };

    // Add property info if available
    if (leadData.propertyAddress) {
      context.property.address = leadData.propertyAddress;
    }
    if (leadData.propertyType) {
      context.property.type = leadData.propertyType;
    }
    if (leadData.estimatedValue) {
      context.property.estimatedValue = leadData.estimatedValue;
    }

    return context;
  }

  /**
   * Determine conversation approach based on motivation level
   */
  private determineApproach(motivationLevel?: string): string {
    switch (motivationLevel) {
      case 'high':
        return 'direct_and_urgent';
      case 'medium':
        return 'consultative_and_helpful';
      case 'low':
        return 'educational_and_nurturing';
      default:
        return 'exploratory';
    }
  }

  /**
   * Determine timeline sensitivity
   */
  private determineTimeline(timeline?: string): string {
    switch (timeline) {
      case 'immediate':
        return 'high_urgency';
      case 'within_30_days':
        return 'medium_urgency';
      case 'within_90_days':
        return 'low_urgency';
      default:
        return 'flexible';
    }
  }

  /**
   * Build AI agent instructions based on lead data
   */
  private buildInstructions(leadData: any): string[] {
    const instructions: string[] = [
      `The customer's name is ${leadData.firstName} ${leadData.lastName}`,
      'Be professional, empathetic, and helpful',
      'Focus on understanding their situation and needs',
      'Ask qualifying questions about their property and timeline',
    ];

    if (leadData.sellerSituation) {
      instructions.push(`They mentioned: "${leadData.sellerSituation}"`);
    }

    if (leadData.motivationLevel === 'high') {
      instructions.push('They appear highly motivated - be responsive to urgency');
    }

    if (leadData.timeline === 'immediate') {
      instructions.push('They need to sell quickly - focus on fast solutions');
    }

    return instructions;
  }

  /**
   * List available voices
   */
  async listVoices(): Promise<any[]> {
    this.ensureConfigured();

    try {
      const voices = await this.client!.voices.getAll();
      return voices.voices || [];
    } catch (error) {
      this.logger.error('Failed to list voices', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Test ElevenLabs connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      this.logger.warn('ElevenLabs not configured, skipping connection test');
      return false;
    }

    try {
      // Test by fetching voices
      await this.listVoices();

      this.logger.info('ElevenLabs connection test successful');
      return true;
    } catch (error) {
      this.logger.error('ElevenLabs connection test failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Generate unique conversation ID
   */
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Extract sentiment from conversation
   * This is a placeholder - in production, use ElevenLabs sentiment API
   */
  async analyzeSentiment(conversationId: string): Promise<{
    overall: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
    confidence: number;
    emotions?: Record<string, number>;
  }> {
    try {
      this.logger.info('Analyzing sentiment', { conversationId });

      // Placeholder implementation
      // In production, this would use ElevenLabs sentiment analysis
      return {
        overall: 'neutral',
        confidence: 0.5,
        emotions: {},
      };
    } catch (error) {
      this.logger.error('Failed to analyze sentiment', {
        error: error instanceof Error ? error.message : 'Unknown error',
        conversationId,
      });
      throw error;
    }
  }
}
