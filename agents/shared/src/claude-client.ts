/**
 * Claude SDK wrapper with prompt caching, streaming, and tool use
 */

import Anthropic from '@anthropic-ai/sdk';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { logger } from './logger';
import {
  AgentMessage,
  AgentTool,
  CacheTier,
  ClaudeResponse,
  PromptTemplate,
  StreamingChunk,
} from './types';

const tracer = trace.getTracer('claude-client');

export class ClaudeClient {
  private client: Anthropic;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor(config: {
    apiKey?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}) {
    this.client = new Anthropic({
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
    });
    this.model = config.model || 'claude-3-5-sonnet-20241022';
    this.maxTokens = config.maxTokens || 4096;
    this.temperature = config.temperature || 0.7;
  }

  /**
   * Send a message to Claude with optional prompt caching
   */
  async sendMessage(params: {
    systemPrompt: PromptTemplate;
    messages: AgentMessage[];
    tools?: AgentTool[];
    temperature?: number;
    maxTokens?: number;
  }): Promise<ClaudeResponse> {
    return tracer.startActiveSpan('claude.sendMessage', async (span) => {
      try {
        const { systemPrompt, messages, tools, temperature, maxTokens } = params;

        // Build system prompt with caching
        const systemBlocks = this.buildSystemPrompt(systemPrompt);

        // Convert messages to Anthropic format
        const anthropicMessages: Anthropic.MessageParam[] = messages.map((msg) => ({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : msg.content,
        }));

        const requestParams: Anthropic.MessageCreateParams = {
          model: this.model,
          max_tokens: maxTokens || this.maxTokens,
          temperature: temperature ?? this.temperature,
          system: systemBlocks,
          messages: anthropicMessages,
        };

        if (tools && tools.length > 0) {
          requestParams.tools = tools as Anthropic.Tool[];
        }

        logger.debug('Sending Claude request', {
          model: this.model,
          messageCount: messages.length,
          hasTools: !!tools?.length,
          cacheTier: systemPrompt.cacheTier,
        });

        const response = await this.client.messages.create(requestParams);

        const usage = {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          cacheCreationTokens: (response.usage as any).cache_creation_input_tokens,
          cacheReadTokens: (response.usage as any).cache_read_input_tokens,
        };

        logger.info('Claude response received', {
          usage,
          stopReason: response.stop_reason,
          cacheHit: !!usage.cacheReadTokens,
        });

        span.setStatus({ code: SpanStatusCode.OK });
        span.setAttribute('tokens.input', usage.inputTokens);
        span.setAttribute('tokens.output', usage.outputTokens);
        span.setAttribute('cache.hit', !!usage.cacheReadTokens);

        return {
          message: response,
          usage,
          stopReason: response.stop_reason || 'unknown',
        };
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.recordException(error as Error);
        logger.error('Claude request failed', { error });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Stream a message from Claude
   */
  async *streamMessage(params: {
    systemPrompt: PromptTemplate;
    messages: AgentMessage[];
    tools?: AgentTool[];
    temperature?: number;
    maxTokens?: number;
  }): AsyncGenerator<StreamingChunk> {
    const { systemPrompt, messages, tools, temperature, maxTokens } = params;

    const systemBlocks = this.buildSystemPrompt(systemPrompt);

    const anthropicMessages: Anthropic.MessageParam[] = messages.map((msg) => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : msg.content,
    }));

    const requestParams: Anthropic.MessageStreamParams = {
      model: this.model,
      max_tokens: maxTokens || this.maxTokens,
      temperature: temperature ?? this.temperature,
      system: systemBlocks,
      messages: anthropicMessages,
    };

    if (tools && tools.length > 0) {
      requestParams.tools = tools as Anthropic.Tool[];
    }

    logger.debug('Streaming Claude request', {
      model: this.model,
      messageCount: messages.length,
    });

    const stream = await this.client.messages.stream(requestParams);

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        yield {
          type: 'content_block_delta',
          delta: event.delta as any,
        };
      } else if (event.type === 'content_block_start') {
        yield {
          type: 'content_block_start',
          content_block: event.content_block as any,
        };
      } else if (event.type === 'message_start') {
        yield {
          type: 'message_start',
          message: event.message,
        };
      } else if (event.type === 'message_delta') {
        yield {
          type: 'message_delta',
          delta: event.delta as any,
          usage: event.usage as any,
        };
      } else if (event.type === 'message_stop') {
        yield {
          type: 'message_stop',
        };
      }
    }
  }

  /**
   * Build system prompt with appropriate cache control
   */
  private buildSystemPrompt(template: PromptTemplate): Anthropic.TextBlockParam[] {
    const blocks: Anthropic.TextBlockParam[] = [];

    // Interpolate variables if any
    let systemContent = template.system;
    if (template.variables) {
      Object.entries(template.variables).forEach(([key, value]) => {
        systemContent = systemContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
    }

    // Apply cache control based on tier
    const cacheControl = this.getCacheControl(template.cacheTier);

    if (cacheControl) {
      blocks.push({
        type: 'text',
        text: systemContent,
        cache_control: cacheControl as any,
      });
    } else {
      blocks.push({
        type: 'text',
        text: systemContent,
      });
    }

    return blocks;
  }

  /**
   * Get cache control settings based on tier
   */
  private getCacheControl(tier: CacheTier): { type: 'ephemeral' } | null {
    switch (tier) {
      case CacheTier.STATIC:
      case CacheTier.SEMI_STATIC:
        // Use ephemeral cache (5 minutes default)
        return { type: 'ephemeral' };
      case CacheTier.DYNAMIC:
      default:
        return null;
    }
  }

  /**
   * Extract text from Claude response
   */
  static extractText(response: ClaudeResponse): string {
    const textBlocks = response.message.content.filter(
      (block) => block.type === 'text'
    ) as Anthropic.TextBlock[];

    return textBlocks.map((block) => block.text).join('\n');
  }

  /**
   * Extract tool uses from Claude response
   */
  static extractToolUses(
    response: ClaudeResponse
  ): Array<{ id: string; name: string; input: any }> {
    const toolBlocks = response.message.content.filter(
      (block) => block.type === 'tool_use'
    ) as Anthropic.ToolUseBlock[];

    return toolBlocks.map((block) => ({
      id: block.id,
      name: block.name,
      input: block.input,
    }));
  }

  /**
   * Build tool result for continuation
   */
  static buildToolResult(toolUseId: string, result: any): Anthropic.ToolResultBlockParam {
    return {
      type: 'tool_result',
      tool_use_id: toolUseId,
      content: typeof result === 'string' ? result : JSON.stringify(result),
    };
  }
}
