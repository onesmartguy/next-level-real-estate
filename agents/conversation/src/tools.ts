/**
 * Conversation AI Agent tool definitions
 */

import { AgentTool, ToolResult, logger } from '@next-level-re/agent-shared';
import { SentimentAnalyzer } from 'natural';

export const CONVERSATION_TOOLS: AgentTool[] = [
  {
    name: 'analyze_transcript',
    description:
      'Analyze a call transcript for patterns, sentiment, effectiveness, and insights. Returns structured analysis.',
    input_schema: {
      type: 'object',
      properties: {
        transcript: {
          type: 'string',
          description: 'Full conversation transcript',
        },
        call_metadata: {
          type: 'object',
          description: 'Metadata about the call (duration, outcome, lead info)',
        },
      },
      required: ['transcript'],
    },
  },
  {
    name: 'extract_patterns',
    description:
      'Extract successful patterns from multiple transcripts. Identifies common techniques in high-performing calls.',
    input_schema: {
      type: 'object',
      properties: {
        transcripts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of successful call transcripts',
        },
        outcome_filter: {
          type: 'string',
          enum: ['qualified', 'appointment', 'sale', 'all'],
          description: 'Filter by call outcome',
        },
      },
      required: ['transcripts'],
    },
  },
  {
    name: 'design_conversation_flow',
    description:
      'Design a new conversation flow or optimize an existing one for a specific use case.',
    input_schema: {
      type: 'object',
      properties: {
        use_case: {
          type: 'string',
          description: 'Use case for the conversation (e.g., cold outreach, follow-up, qualification)',
        },
        target_outcome: {
          type: 'string',
          description: 'Desired outcome of the conversation',
        },
        constraints: {
          type: 'array',
          items: { type: 'string' },
          description: 'Constraints or requirements',
        },
      },
      required: ['use_case', 'target_outcome'],
    },
  },
  {
    name: 'update_conversation_knowledge',
    description:
      'Update the conversation knowledge base with new patterns, objection handlers, or techniques.',
    input_schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: [
            'conversation-patterns',
            'objection-handlers',
            'qualification-techniques',
            'sentiment-signals',
            'ab-test-results',
          ],
          description: 'Category for the knowledge',
        },
        title: {
          type: 'string',
          description: 'Title of the knowledge entry',
        },
        content: {
          type: 'string',
          description: 'Detailed content',
        },
        metrics: {
          type: 'object',
          description: 'Performance metrics (conversion rate, success rate, etc.)',
        },
      },
      required: ['category', 'title', 'content'],
    },
  },
  {
    name: 'query_call_analytics',
    description:
      'Query call analytics and performance metrics for a time period or specific criteria.',
    input_schema: {
      type: 'object',
      properties: {
        metric_type: {
          type: 'string',
          enum: [
            'conversion_rate',
            'avg_duration',
            'sentiment_distribution',
            'top_objections',
            'qualification_rate',
          ],
          description: 'Type of metric to query',
        },
        time_range: {
          type: 'string',
          enum: ['24h', '7d', '30d', '90d'],
          description: 'Time range for analytics',
        },
        filters: {
          type: 'object',
          description: 'Additional filters (campaign, lead source, etc.)',
        },
      },
      required: ['metric_type'],
    },
  },
];

export class ConversationTools {
  private sentimentAnalyzer: SentimentAnalyzer;

  constructor() {
    this.sentimentAnalyzer = new SentimentAnalyzer('English', null, 'afinn');
  }

  async analyzeTranscript(input: {
    transcript: string;
    call_metadata?: any;
  }): Promise<ToolResult> {
    try {
      logger.info('Analyzing transcript', {
        transcriptLength: input.transcript.length,
      });

      // Perform sentiment analysis
      const sentiment = this.sentimentAnalyzer.getSentiment(
        input.transcript.split(' ')
      );

      // Extract speaker turns
      const turns = this.extractSpeakerTurns(input.transcript);

      // Analyze conversation flow
      const analysis = {
        sentiment: sentiment > 0 ? 'positive' : sentiment < 0 ? 'negative' : 'neutral',
        sentimentScore: sentiment,
        totalTurns: turns.length,
        aiTurns: turns.filter((t) => t.speaker === 'AI').length,
        humanTurns: turns.filter((t) => t.speaker === 'Human').length,
        avgTurnLength: turns.reduce((sum, t) => sum + t.text.split(' ').length, 0) / turns.length,
        objections: this.extractObjections(input.transcript),
        questions: this.extractQuestions(input.transcript),
        metadata: input.call_metadata || {},
      };

      return {
        success: true,
        data: analysis,
      };
    } catch (error) {
      logger.error('Failed to analyze transcript', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async extractPatterns(input: {
    transcripts: string[];
    outcome_filter?: string;
  }): Promise<ToolResult> {
    try {
      logger.info('Extracting patterns from transcripts', {
        transcriptCount: input.transcripts.length,
      });

      const patterns: any[] = [];

      // Analyze each transcript
      for (const transcript of input.transcripts) {
        const opening = this.extractOpening(transcript);
        const closing = this.extractClosing(transcript);

        patterns.push({
          opening,
          closing,
          length: transcript.length,
        });
      }

      // Find common patterns
      const commonOpenings = this.findCommonPhrases(patterns.map((p) => p.opening));
      const commonClosings = this.findCommonPhrases(patterns.map((p) => p.closing));

      return {
        success: true,
        data: {
          totalAnalyzed: input.transcripts.length,
          commonOpenings: commonOpenings.slice(0, 5),
          commonClosings: commonClosings.slice(0, 5),
          avgLength: patterns.reduce((sum, p) => sum + p.length, 0) / patterns.length,
        },
      };
    } catch (error) {
      logger.error('Failed to extract patterns', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async designConversationFlow(input: {
    use_case: string;
    target_outcome: string;
    constraints?: string[];
  }): Promise<ToolResult> {
    try {
      logger.info('Designing conversation flow', input);

      // Return template conversation flow
      const flow = {
        use_case: input.use_case,
        target_outcome: input.target_outcome,
        stages: [
          {
            stage: 'opening',
            purpose: 'Build rapport and establish reason for call',
            script_template:
              'Hi {{name}}, this is {{agent_name}} calling about your recent inquiry regarding {{property_type}} in {{area}}.',
          },
          {
            stage: 'qualification',
            purpose: 'Assess buyer motivation and fit',
            questions: [
              'What prompted you to start looking for properties?',
              'What timeline are you working with?',
              'Have you been pre-approved for financing?',
            ],
          },
          {
            stage: 'value_proposition',
            purpose: 'Present relevant opportunities',
            script_template:
              'Based on what you shared, I have {{count}} properties that might be a great fit...',
          },
          {
            stage: 'objection_handling',
            purpose: 'Address concerns and build trust',
            common_objections: [
              'Price too high',
              'Need to think about it',
              'Want to see more options',
            ],
          },
          {
            stage: 'closing',
            purpose: 'Secure next step',
            script_template:
              'I'd love to schedule a quick 15-minute call to show you these properties. Does {{day}} at {{time}} work for you?',
          },
        ],
        constraints: input.constraints || [],
      };

      return {
        success: true,
        data: flow,
      };
    } catch (error) {
      logger.error('Failed to design conversation flow', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async updateConversationKnowledge(input: {
    category: string;
    title: string;
    content: string;
    metrics?: any;
  }): Promise<ToolResult> {
    // Handled by agent
    return {
      success: true,
      data: {
        message: 'Conversation knowledge update queued',
        category: input.category,
        title: input.title,
      },
    };
  }

  async queryCallAnalytics(input: {
    metric_type: string;
    time_range?: string;
    filters?: any;
  }): Promise<ToolResult> {
    try {
      logger.info('Querying call analytics', input);

      // Mock analytics data
      const mockData: Record<string, any> = {
        conversion_rate: {
          overall: 23.5,
          by_source: {
            'google-ads': 28.2,
            zillow: 19.8,
            realgeeks: 25.1,
          },
          trend: '+2.3% vs last period',
        },
        avg_duration: {
          overall: 6.2,
          qualified: 8.5,
          not_interested: 2.1,
          unit: 'minutes',
        },
        sentiment_distribution: {
          positive: 45,
          neutral: 38,
          negative: 17,
        },
        top_objections: [
          { objection: 'Price too high', count: 124, success_rate: 38 },
          { objection: 'Not ready yet', count: 98, success_rate: 22 },
          { objection: 'Need to discuss with spouse', count: 76, success_rate: 65 },
        ],
        qualification_rate: {
          overall: 42.1,
          by_campaign: {
            'cold-outreach': 28.5,
            'warm-follow-up': 58.2,
            'hot-leads': 71.3,
          },
        },
      };

      return {
        success: true,
        data: {
          metric: input.metric_type,
          time_range: input.time_range || '30d',
          filters: input.filters || {},
          data: mockData[input.metric_type],
        },
      };
    } catch (error) {
      logger.error('Failed to query analytics', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async executeTool(toolName: string, input: any): Promise<ToolResult> {
    switch (toolName) {
      case 'analyze_transcript':
        return this.analyzeTranscript(input);
      case 'extract_patterns':
        return this.extractPatterns(input);
      case 'design_conversation_flow':
        return this.designConversationFlow(input);
      case 'update_conversation_knowledge':
        return this.updateConversationKnowledge(input);
      case 'query_call_analytics':
        return this.queryCallAnalytics(input);
      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`,
        };
    }
  }

  private extractSpeakerTurns(transcript: string): Array<{ speaker: string; text: string }> {
    const lines = transcript.split('\n');
    const turns: Array<{ speaker: string; text: string }> = [];

    for (const line of lines) {
      if (line.startsWith('AI:')) {
        turns.push({ speaker: 'AI', text: line.substring(3).trim() });
      } else if (line.startsWith('Human:') || line.startsWith('Caller:')) {
        turns.push({ speaker: 'Human', text: line.split(':')[1].trim() });
      }
    }

    return turns;
  }

  private extractObjections(transcript: string): string[] {
    const objectionKeywords = [
      'but',
      'however',
      'not sure',
      'expensive',
      'think about',
      'maybe later',
      'not interested',
    ];

    const objections: string[] = [];
    const sentences = transcript.split(/[.!?]/);

    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      if (objectionKeywords.some((keyword) => lower.includes(keyword))) {
        objections.push(sentence.trim());
      }
    }

    return objections.slice(0, 5);
  }

  private extractQuestions(transcript: string): string[] {
    return transcript
      .split('\n')
      .filter((line) => line.includes('?'))
      .map((line) => line.trim())
      .slice(0, 10);
  }

  private extractOpening(transcript: string): string {
    const lines = transcript.split('\n').filter((l) => l.trim());
    return lines.slice(0, 2).join(' ');
  }

  private extractClosing(transcript: string): string {
    const lines = transcript.split('\n').filter((l) => l.trim());
    return lines.slice(-2).join(' ');
  }

  private findCommonPhrases(phrases: string[]): string[] {
    const wordFreq: Record<string, number> = {};

    phrases.forEach((phrase) => {
      const words = phrase.toLowerCase().split(/\s+/);
      words.forEach((word) => {
        if (word.length > 3) {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
      });
    });

    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);
  }
}
