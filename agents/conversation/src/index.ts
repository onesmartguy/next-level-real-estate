/**
 * Conversation Agent entry point
 */

import dotenv from 'dotenv';
import { ConversationAgent } from './agent';
import { logger, RagDocument } from '@next-level-re/agent-shared';

dotenv.config();

async function main() {
  logger.info('Starting Conversation Agent...');

  const agent = new ConversationAgent();

  try {
    await agent.initialize();

    // Add initial knowledge
    const initialKnowledge: RagDocument = {
      id: 'conv-001',
      content: `
# Effective Conversation Patterns for Real Estate AI Calls

## Top Performing Opening Scripts

1. **Warm Introduction (78% connect rate)**
   "Hi [Name], this is [Agent] calling about your recent inquiry regarding [Property Type] in [Area]. Is now a good time to chat for just 2 minutes?"

2. **Value-First Approach (65% qualification rate)**
   "Hi [Name], I noticed you were looking at properties in [Area]. I have 3 exclusive listings that just came on market that match exactly what you're looking for. Quick question - are you still actively looking?"

## Objection Handling Techniques

### "Price is too high"
- Acknowledge: "I understand, price is definitely important."
- Reframe: "Let me ask - if we could structure this to fit your budget, would this property otherwise meet your needs?"
- Alternative: "I have similar properties at different price points. What budget range works best for you?"

### "Need to think about it"
- Clarify: "Absolutely, what specific concerns do you need to think through?"
- Timeline: "When were you planning to make a decision? Would it help if I sent over some additional information?"

## Qualification Questions (in order)

1. Timeline: "How soon are you looking to move?" (filters urgency)
2. Motivation: "What's prompting the move?" (uncovers pain points)
3. Financial: "Have you spoken with a lender yet?" (assesses readiness)
4. Decision-maker: "Who else is involved in this decision?" (identifies stakeholders)
`,
      metadata: {
        source: 'internal-best-practices',
        timestamp: new Date(),
        category: 'conversation-patterns',
        agentId: 'conversation-agent',
      },
    };

    await agent.addKnowledge(initialKnowledge);

    // Example usage
    const mockTranscript = `
AI: Hi Sarah, this is Alex calling about your recent inquiry regarding single-family homes in Austin. Is now a good time to chat for just 2 minutes?
Human: Oh hi, yes I can talk briefly.
AI: Great! I noticed you were looking at properties in the East Austin area. I have 3 exclusive listings that just came on market. Quick question - are you still actively looking?
Human: Yes, but honestly the prices seem really high right now.
AI: I understand, price is definitely important. Let me ask - if we could structure this to fit your budget, would these properties otherwise meet your needs in terms of location and features?
Human: Well, yes the location is perfect.
AI: Excellent. What budget range works best for you? That way I can show you exactly what's available.
Human: We're looking at around $450-500k.
AI: Perfect, I have two properties in that range. How soon are you looking to move?
Human: Ideally within the next 3 months.
AI: Great! Have you spoken with a lender yet about pre-approval?
Human: Not yet, we need to do that.
AI: No problem. I can connect you with a great lender who can get you pre-approved quickly. Would you like me to set up a quick 15-minute call tomorrow to walk through these two properties and discuss next steps?
Human: Yes, that would be helpful.
AI: Wonderful! Does 2pm or 4pm work better for you tomorrow?
Human: 2pm works.
AI: Perfect, I'll send you a calendar invite for 2pm tomorrow. Looking forward to it Sarah!
    `;

    const analysis = await agent.analyzeTranscript(mockTranscript, {
      duration: 4.5,
      outcome: 'appointment_scheduled',
    });

    logger.info('Transcript analysis:', { analysis });

    const health = agent.getHealth();
    logger.info('Agent health:', health);

    logger.info('Conversation Agent is running. Press Ctrl+C to stop.');

    process.on('SIGINT', async () => {
      await agent.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await agent.shutdown();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Fatal error in Conversation Agent', { error });
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Unhandled error', { error });
    process.exit(1);
  });
}

export { ConversationAgent };
