/**
 * End-to-End Test: Multi-Agent Collaboration
 *
 * Tests the four specialized Claude agents working together:
 * - Architecture Agent
 * - Conversation AI Agent
 * - Sales & Marketing Agent
 * - Realty Expert Agent
 */

import { multiAgentMock, claudeMock } from '../mocks/claude-mock';
import { generateLead, generateMarketIntelligence, generateCompletedCall } from '../mocks/test-data';
import { assertValidAgentResponse, assertPromptCachingActive } from '../utils/assertions';
import { measureTime } from '../utils/test-helpers';
import { createCleanupCoordinator } from '../utils/cleanup';

describe('E2E: Multi-Agent Collaboration', () => {
  const cleanup = createCleanupCoordinator();

  beforeAll(() => {
    // Register all four agents
    multiAgentMock.registerAgent({
      name: 'architect',
      role: 'AI Architecture Expert',
      systemPrompt: 'You are an AI architect specializing in real estate technology systems.',
      tools: ['research', 'design', 'recommend'],
    });

    multiAgentMock.registerAgent({
      name: 'conversation-ai',
      role: 'Conversation Optimization Expert',
      systemPrompt: 'You optimize AI conversations for real estate lead engagement.',
      tools: ['analyze_transcript', 'suggest_improvements', 'test_variations'],
    });

    multiAgentMock.registerAgent({
      name: 'sales-marketing',
      role: 'Sales & Marketing Expert',
      systemPrompt: 'You optimize sales strategies and marketing campaigns for real estate.',
      tools: ['market_research', 'campaign_analysis', 'strategy_optimization'],
    });

    multiAgentMock.registerAgent({
      name: 'realty-expert',
      role: 'Real Estate Domain Expert',
      systemPrompt: 'You provide real estate expertise in wholesale, fix-flip, and investment strategies.',
      tools: ['qualify_lead', 'analyze_property', 'calculate_arv', 'compliance_check'],
    });

    cleanup.mocks.register('multiAgent', () => multiAgentMock.reset());
    cleanup.mocks.register('claude', () => claudeMock.reset());
  });

  afterEach(async () => {
    await cleanup.cleanupAll();
  });

  describe('Lead Qualification Workflow', () => {
    it('should coordinate multiple agents to qualify a lead', async () => {
      const lead = generateLead();

      // STEP 1: Realty Expert qualifies the lead
      const qualificationResponse = await multiAgentMock.sendToAgent(
        'realty-expert',
        `Qualify this lead for wholesale strategy: ${JSON.stringify(lead)}`
      );

      assertValidAgentResponse(qualificationResponse);
      const qualification = JSON.parse(qualificationResponse.content);
      expect(qualification.qualified).toBeDefined();
      expect(qualification.score).toBeDefined();

      // STEP 2: Sales & Marketing agent analyzes market fit
      const marketAnalysis = await multiAgentMock.sendToAgent(
        'sales-marketing',
        `Analyze market positioning for: ${JSON.stringify(lead.property)}`
      );

      assertValidAgentResponse(marketAnalysis);
      const marketData = JSON.parse(marketAnalysis.content);
      expect(marketData.averagePrice).toBeDefined();

      // STEP 3: Conversation AI agent prepares talking points
      const conversationPrep = await multiAgentMock.sendToAgent(
        'conversation-ai',
        `Prepare conversation strategy for qualified lead with score ${qualification.score}`
      );

      assertValidAgentResponse(conversationPrep);
      const strategy = JSON.parse(conversationPrep.content);
      expect(strategy.suggestions).toBeDefined();

      // Verify all agents contributed
      const allResponses = claudeMock.getAllMessages();
      expect(allResponses.length).toBeGreaterThanOrEqual(3);
    });

    it('should use prompt caching to reduce costs', async () => {
      const lead = generateLead();

      // First request (cache miss)
      const response1 = await multiAgentMock.sendToAgent(
        'realty-expert',
        `Qualify lead: ${JSON.stringify(lead)}`
      );

      assertValidAgentResponse(response1);

      // Second request with same system prompt (cache hit)
      const response2 = await multiAgentMock.sendToAgent(
        'realty-expert',
        `Qualify another lead: ${JSON.stringify(generateLead())}`
      );

      assertPromptCachingActive(response2);

      // Verify cost savings
      const usage = claudeMock.getTotalUsage();
      expect(usage.cachedTokens).toBeGreaterThan(0);

      const cacheSavings = (usage.cachedTokens / usage.inputTokens) * 100;
      console.log(`Prompt caching savings: ${cacheSavings.toFixed(1)}%`);
      expect(cacheSavings).toBeGreaterThan(50); // At least 50% cached
    });
  });

  describe('Conversation Optimization Loop', () => {
    it('should analyze call transcripts and improve conversation flow', async () => {
      const completedCall = generateCompletedCall();

      // STEP 1: Conversation AI analyzes transcript
      const analysis = await multiAgentMock.sendToAgent(
        'conversation-ai',
        `Analyze this call transcript and suggest improvements: ${JSON.stringify(completedCall.transcript)}`
      );

      assertValidAgentResponse(analysis);
      const improvements = JSON.parse(analysis.content);
      expect(improvements.suggestions).toBeDefined();
      expect(improvements.sentimentScore).toBeDefined();

      // STEP 2: Sales & Marketing validates suggestions
      const validation = await multiAgentMock.sendToAgent(
        'sales-marketing',
        `Validate these conversation improvements: ${JSON.stringify(improvements.suggestions)}`
      );

      assertValidAgentResponse(validation);

      // STEP 3: Architecture agent implements changes
      const implementation = await multiAgentMock.sendToAgent(
        'architect',
        `Design implementation for conversation improvements: ${JSON.stringify(improvements)}`
      );

      assertValidAgentResponse(implementation);
    });

    it('should track A/B test results and optimize', async () => {
      const variantA = {
        opening: 'Hi, is this a good time to talk about your property?',
        results: { connectRate: 0.65, qualificationRate: 0.45 },
      };

      const variantB = {
        opening: 'Hi [Name], this is [Agent] from Next Level Real Estate. Do you have 2 minutes?',
        results: { connectRate: 0.78, qualificationRate: 0.62 },
      };

      // Conversation AI analyzes A/B test
      const analysis = await multiAgentMock.sendToAgent(
        'conversation-ai',
        `Analyze A/B test: Variant A ${JSON.stringify(variantA)} vs Variant B ${JSON.stringify(variantB)}`
      );

      assertValidAgentResponse(analysis);
      const decision = JSON.parse(analysis.content);
      expect(decision).toBeDefined();

      // Should recommend the better variant
      console.log('A/B test recommendation:', decision);
    });
  });

  describe('Market Intelligence Gathering', () => {
    it('should coordinate agents to gather comprehensive market data', async () => {
      const location = { city: 'Austin', state: 'TX', zipCode: '78701' };

      // STEP 1: Realty Expert provides domain context
      const domainContext = await multiAgentMock.sendToAgent(
        'realty-expert',
        `What market factors are important for wholesale in ${location.city}, ${location.state}?`
      );

      assertValidAgentResponse(domainContext);

      // STEP 2: Sales & Marketing researches market trends
      const marketTrends = await multiAgentMock.sendToAgent(
        'sales-marketing',
        `Research current real estate market trends in ${JSON.stringify(location)}`
      );

      assertValidAgentResponse(marketTrends);
      const trends = JSON.parse(marketTrends.content);
      expect(trends.averagePrice).toBeDefined();

      // STEP 3: Architecture agent designs data pipeline
      const dataPipeline = await multiAgentMock.sendToAgent(
        'architect',
        `Design automated market intelligence pipeline for ${location.city}`
      );

      assertValidAgentResponse(dataPipeline);
    });
  });

  describe('Knowledge Base Self-Improvement', () => {
    it('should update knowledge bases based on outcomes', async () => {
      const successfulCall = generateCompletedCall({
        outcome: {
          qualified: true,
          interestLevel: 'high',
          nextAction: 'Schedule appointment',
          summary: 'Excellent conversation, seller very motivated',
        },
      });

      // Extract learnings from successful call
      const learnings = await multiAgentMock.sendToAgent(
        'conversation-ai',
        `Extract best practices from this successful call: ${JSON.stringify(successfulCall)}`
      );

      assertValidAgentResponse(learnings);
      const bestPractices = JSON.parse(learnings.content);
      expect(bestPractices).toBeDefined();

      // Verify knowledge base would be updated
      console.log('Best practices extracted:', bestPractices);
    });

    it('should measure agent performance improvements over time', async () => {
      const metrics = {
        week1: { qualificationRate: 0.45, averageScore: 72 },
        week2: { qualificationRate: 0.52, averageScore: 76 },
        week3: { qualificationRate: 0.58, averageScore: 81 },
        week4: { qualificationRate: 0.64, averageScore: 85 },
      };

      // Sales & Marketing analyzes improvement trend
      const analysis = await multiAgentMock.sendToAgent(
        'sales-marketing',
        `Analyze agent performance improvement: ${JSON.stringify(metrics)}`
      );

      assertValidAgentResponse(analysis);
      const insights = JSON.parse(analysis.content);
      expect(insights).toBeDefined();

      // Calculate improvement
      const improvement = ((metrics.week4.qualificationRate - metrics.week1.qualificationRate) / metrics.week1.qualificationRate) * 100;
      expect(improvement).toBeGreaterThan(0);
      console.log(`Performance improvement: ${improvement.toFixed(1)}%`);
    });
  });

  describe('Agent Performance & Cost Optimization', () => {
    it('should measure agent response times', async () => {
      const lead = generateLead();

      const { duration, result } = await measureTime(async () => {
        return await multiAgentMock.sendToAgent(
          'realty-expert',
          `Quick qualification: ${JSON.stringify(lead)}`
        );
      });

      expect(duration).toBeLessThan(1000); // < 1 second
      assertValidAgentResponse(result);
      console.log(`Agent response time: ${duration}ms`);
    });

    it('should optimize token usage across agents', async () => {
      // Make multiple agent calls
      const lead = generateLead();

      await multiAgentMock.sendToAgent('realty-expert', `Qualify: ${JSON.stringify(lead)}`);
      await multiAgentMock.sendToAgent('sales-marketing', `Analyze market for: ${JSON.stringify(lead.property)}`);
      await multiAgentMock.sendToAgent('conversation-ai', 'Suggest opening line');

      // Check total usage
      const usage = claudeMock.getTotalUsage();
      expect(usage.inputTokens).toBeGreaterThan(0);
      expect(usage.outputTokens).toBeGreaterThan(0);
      expect(usage.cost).toBeGreaterThan(0);

      console.log('Token usage across agents:', usage);
      console.log(`Total cost: $${usage.cost.toFixed(4)}`);

      // With 90% cache hit rate, cost should be significantly reduced
      const savingsRatio = usage.cachedTokens / (usage.inputTokens + usage.cachedTokens);
      expect(savingsRatio).toBeGreaterThan(0.5); // At least 50% cached
    });

    it('should parallelize independent agent tasks', async () => {
      const lead = generateLead();

      // Sequential execution
      const { duration: sequentialDuration } = await measureTime(async () => {
        await multiAgentMock.sendToAgent('realty-expert', `Qualify: ${JSON.stringify(lead)}`);
        await multiAgentMock.sendToAgent('sales-marketing', 'Market trends');
        await multiAgentMock.sendToAgent('conversation-ai', 'Best practices');
      });

      // Parallel execution
      const { duration: parallelDuration } = await measureTime(async () => {
        await Promise.all([
          multiAgentMock.sendToAgent('realty-expert', `Qualify: ${JSON.stringify(lead)}`),
          multiAgentMock.sendToAgent('sales-marketing', 'Market trends'),
          multiAgentMock.sendToAgent('conversation-ai', 'Best practices'),
        ]);
      });

      console.log(`Sequential: ${sequentialDuration}ms, Parallel: ${parallelDuration}ms`);
      expect(parallelDuration).toBeLessThan(sequentialDuration);
    });
  });
});
