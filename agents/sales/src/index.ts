import dotenv from 'dotenv';
import { SalesAgent } from './agent';
import { logger } from '@next-level-re/agent-shared';

dotenv.config();

async function main() {
  const agent = new SalesAgent();
  await agent.initialize();

  const result = await agent.query('Analyze market trends in Austin, TX and recommend campaign optimizations');
  logger.info('Query result:', { result });

  process.on('SIGINT', async () => {
    await agent.shutdown();
    process.exit(0);
  });
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Error:', { error });
    process.exit(1);
  });
}

export { SalesAgent };
