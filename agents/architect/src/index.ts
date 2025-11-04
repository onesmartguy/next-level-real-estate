/**
 * Architecture Agent entry point
 */

import dotenv from 'dotenv';
import { ArchitectAgent } from './agent';
import { logger, RagDocument } from '@next-level-re/agent-shared';

dotenv.config();

async function main() {
  logger.info('Starting Architecture Agent...');

  const agent = new ArchitectAgent();

  try {
    // Initialize agent
    await agent.initialize();

    // Example: Add some initial knowledge
    const initialKnowledge: RagDocument = {
      id: 'arch-001',
      content: `
# Microservices Architecture Best Practices

## Key Principles

1. **Single Responsibility**: Each service should have one clear purpose
2. **Loose Coupling**: Services should be independent and communicate via APIs
3. **High Cohesion**: Related functionality should be grouped together
4. **API Gateway Pattern**: Central entry point for all client requests
5. **Event-Driven Communication**: Use message queues for async operations

## Performance Optimization

- Implement caching at multiple layers (CDN, API, database)
- Use connection pooling for database connections
- Implement circuit breakers for fault tolerance
- Use asynchronous processing for non-critical operations
- Monitor and optimize slow queries

## Scalability Patterns

- Horizontal scaling with load balancing
- Database sharding for large datasets
- CQRS for read-heavy applications
- Event sourcing for audit trails
- Microservices decomposition

## Observability

- Distributed tracing with OpenTelemetry
- Centralized logging
- Metrics collection and alerting
- Health checks and readiness probes
`,
      metadata: {
        source: 'internal-documentation',
        timestamp: new Date(),
        category: 'design-patterns',
        agentId: 'architect-agent',
      },
    };

    await agent.addKnowledge(initialKnowledge);

    // Example queries
    logger.info('Running example queries...');

    const performanceAnalysis = await agent.analyzeSystemPerformance('api-gateway');
    logger.info('Performance analysis result:', { performanceAnalysis });

    const researchResult = await agent.researchTechnology('prompt caching strategies');
    logger.info('Research result:', { researchResult });

    // Check health
    const health = agent.getHealth();
    logger.info('Agent health:', health);

    // Keep agent running
    logger.info('Architecture Agent is running. Press Ctrl+C to stop.');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down...');
      await agent.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down...');
      await agent.shutdown();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Fatal error in Architecture Agent', { error });
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    logger.error('Unhandled error', { error });
    process.exit(1);
  });
}

export { ArchitectAgent };
