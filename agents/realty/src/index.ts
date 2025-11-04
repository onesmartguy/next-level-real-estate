import dotenv from 'dotenv';
import { RealtyAgent } from './agent';
import { logger } from '@next-level-re/agent-shared';

dotenv.config();

async function main() {
  const agent = new RealtyAgent();
  await agent.initialize();

  const result = await agent.query(
    'Analyze this wholesale deal: Purchase price $280k, ARV $420k, repair costs $45k. Is this a good deal?'
  );
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

export { RealtyAgent };
