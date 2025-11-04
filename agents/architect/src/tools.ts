/**
 * Architecture Agent tool definitions
 */

import { AgentTool, ToolResult } from '@next-level-re/agent-shared';
import axios from 'axios';
import { logger } from '@next-level-re/agent-shared';

/**
 * Tool definitions for Claude
 */
export const ARCHITECT_TOOLS: AgentTool[] = [
  {
    name: 'query_system_metrics',
    description:
      'Query system performance metrics from OpenTelemetry/SigNoz. Returns metrics like latency, throughput, error rates for specific services or time ranges.',
    input_schema: {
      type: 'object',
      properties: {
        metric_type: {
          type: 'string',
          enum: ['latency', 'throughput', 'error_rate', 'resource_usage'],
          description: 'Type of metric to query',
        },
        service_name: {
          type: 'string',
          description: 'Name of the service to query metrics for (e.g., api-gateway, lead-service)',
        },
        time_range: {
          type: 'string',
          enum: ['1h', '6h', '24h', '7d', '30d'],
          description: 'Time range for metrics',
        },
      },
      required: ['metric_type', 'service_name'],
    },
  },
  {
    name: 'search_technical_research',
    description:
      'Search the web for latest technical research, best practices, or technology comparisons. Use this to stay current with AI/ML innovations and industry trends.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for technical research',
        },
        category: {
          type: 'string',
          enum: [
            'ai-ml',
            'architecture',
            'performance',
            'database',
            'messaging',
            'observability',
          ],
          description: 'Category of research',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'update_knowledge_base',
    description:
      'Add new technical knowledge to the architecture knowledge base. Use this after researching new technologies, patterns, or best practices.',
    input_schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: [
            'design-patterns',
            'performance',
            'technology-comparison',
            'research',
            'case-study',
          ],
          description: 'Category for the knowledge',
        },
        title: {
          type: 'string',
          description: 'Title of the knowledge article',
        },
        content: {
          type: 'string',
          description: 'Detailed content to add to knowledge base',
        },
        source: {
          type: 'string',
          description: 'Source URL or reference',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for searchability',
        },
      },
      required: ['category', 'title', 'content', 'source'],
    },
  },
  {
    name: 'analyze_database_performance',
    description:
      'Analyze MongoDB database performance including slow queries, index usage, and connection pool metrics.',
    input_schema: {
      type: 'object',
      properties: {
        database_name: {
          type: 'string',
          description: 'Name of the MongoDB database',
        },
        analysis_type: {
          type: 'string',
          enum: ['slow_queries', 'index_usage', 'connections', 'overall'],
          description: 'Type of analysis to perform',
        },
      },
      required: ['database_name'],
    },
  },
  {
    name: 'recommend_optimization',
    description:
      'Generate optimization recommendations based on current system metrics and best practices.',
    input_schema: {
      type: 'object',
      properties: {
        area: {
          type: 'string',
          enum: [
            'api_performance',
            'database',
            'caching',
            'messaging',
            'ai_costs',
            'overall',
          ],
          description: 'Area to optimize',
        },
        current_metrics: {
          type: 'object',
          description: 'Current performance metrics for the area',
        },
        constraints: {
          type: 'array',
          items: { type: 'string' },
          description: 'Constraints to consider (e.g., budget, timeline)',
        },
      },
      required: ['area'],
    },
  },
];

/**
 * Tool implementation handlers
 */
export class ArchitectTools {
  private metricsApiUrl: string;

  constructor() {
    this.metricsApiUrl = process.env.METRICS_API_URL || 'http://localhost:4317';
  }

  /**
   * Query system metrics from OpenTelemetry/SigNoz
   */
  async querySystemMetrics(input: {
    metric_type: string;
    service_name: string;
    time_range?: string;
  }): Promise<ToolResult> {
    try {
      logger.info('Querying system metrics', input);

      // In production, this would query SigNoz API
      // For now, return mock data
      const mockMetrics = {
        latency: {
          p50: 120,
          p95: 350,
          p99: 580,
          unit: 'ms',
        },
        throughput: {
          value: 450,
          unit: 'req/sec',
        },
        error_rate: {
          value: 0.08,
          unit: 'percent',
        },
        resource_usage: {
          cpu: 45,
          memory: 62,
          unit: 'percent',
        },
      };

      return {
        success: true,
        data: {
          service: input.service_name,
          time_range: input.time_range || '1h',
          metrics: mockMetrics[input.metric_type as keyof typeof mockMetrics],
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Failed to query metrics', { error, input });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Search technical research online
   */
  async searchTechnicalResearch(input: {
    query: string;
    category?: string;
  }): Promise<ToolResult> {
    try {
      logger.info('Searching technical research', input);

      // In production, this would use web search API
      // For now, return guidance to use knowledge base
      return {
        success: true,
        data: {
          message: 'Web search would be performed here. In development, consult knowledge base.',
          query: input.query,
          category: input.category,
          suggestions: [
            'Check Anthropic research blog for latest AI advances',
            'Review OpenTelemetry documentation for observability best practices',
            'Consult Qdrant documentation for vector database optimization',
          ],
        },
      };
    } catch (error) {
      logger.error('Failed to search research', { error, input });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update knowledge base (handled by agent)
   */
  async updateKnowledgeBase(input: {
    category: string;
    title: string;
    content: string;
    source: string;
    tags?: string[];
  }): Promise<ToolResult> {
    // This is handled by the agent itself
    return {
      success: true,
      data: {
        message: 'Knowledge base update queued',
        category: input.category,
        title: input.title,
      },
    };
  }

  /**
   * Analyze database performance
   */
  async analyzeDatabasePerformance(input: {
    database_name: string;
    analysis_type?: string;
  }): Promise<ToolResult> {
    try {
      logger.info('Analyzing database performance', input);

      // Mock database analysis results
      const mockAnalysis = {
        slow_queries: [
          {
            query: 'db.leads.find({ status: "new" }).sort({ createdAt: -1 })',
            avgDuration: 450,
            count: 1250,
            recommendation: 'Add index on status + createdAt',
          },
        ],
        index_usage: {
          total_indexes: 12,
          unused_indexes: 2,
          missing_indexes: ['status_createdAt', 'phone_consent'],
        },
        connections: {
          current: 45,
          available: 100,
          peak: 78,
        },
      };

      return {
        success: true,
        data: {
          database: input.database_name,
          analysis: mockAnalysis[input.analysis_type as keyof typeof mockAnalysis] || mockAnalysis,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Failed to analyze database', { error, input });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate optimization recommendations
   */
  async recommendOptimization(input: {
    area: string;
    current_metrics?: any;
    constraints?: string[];
  }): Promise<ToolResult> {
    try {
      logger.info('Generating optimization recommendations', input);

      // This would use RAG + Claude to generate recommendations
      // For now, return structured placeholder
      return {
        success: true,
        data: {
          area: input.area,
          recommendations: [
            {
              priority: 'high',
              title: 'Implement Redis caching for frequently accessed data',
              impact: 'Reduce database load by 60%, improve API response time by 40%',
              effort: 'medium',
              steps: [
                'Set up Redis cluster',
                'Implement cache-aside pattern',
                'Add cache invalidation logic',
              ],
            },
          ],
          constraints_considered: input.constraints || [],
        },
      };
    } catch (error) {
      logger.error('Failed to generate recommendations', { error, input });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute tool by name
   */
  async executeTool(toolName: string, input: any): Promise<ToolResult> {
    switch (toolName) {
      case 'query_system_metrics':
        return this.querySystemMetrics(input);
      case 'search_technical_research':
        return this.searchTechnicalResearch(input);
      case 'update_knowledge_base':
        return this.updateKnowledgeBase(input);
      case 'analyze_database_performance':
        return this.analyzeDatabasePerformance(input);
      case 'recommend_optimization':
        return this.recommendOptimization(input);
      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`,
        };
    }
  }
}
