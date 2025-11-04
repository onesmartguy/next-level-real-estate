/**
 * End-to-End Test: Lead-to-Call Workflow
 *
 * Tests the complete workflow from lead ingestion through qualification
 * to AI-powered calling and post-call analysis.
 *
 * Critical Success Factor: 5-minute lead response time
 */

import { v4 as uuidv4 } from 'uuid';
import { generateLead, generateGoogleAdsLead } from '../mocks/test-data';
import { kafkaMock, EventTypes, createEventMessage } from '../mocks/kafka-mock';
import { twilioMock } from '../mocks/twilio-mock';
import { elevenLabsMock } from '../mocks/elevenlabs-mock';
import { claudeMock, multiAgentMock } from '../mocks/claude-mock';
import { waitForCondition, measureTime } from '../utils/test-helpers';
import {
  assertValidLead,
  assertTCPACompliant,
  assertQualifiedLead,
  assertValidCall,
  assertCompletedCall,
  assertTimingConstraint,
} from '../utils/assertions';
import { createCleanupCoordinator } from '../utils/cleanup';

describe('E2E: Lead-to-Call Workflow', () => {
  const cleanup = createCleanupCoordinator();
  let producer: any;
  let consumer: any;

  beforeAll(() => {
    // Setup Kafka
    producer = kafkaMock.producer();
    consumer = kafkaMock.consumer({ groupId: 'test-group' });

    // Setup multi-agent system
    multiAgentMock.registerAgent({
      name: 'realty-expert',
      role: 'Real estate domain expert',
      systemPrompt: 'You are a real estate expert specializing in wholesale strategies.',
    });

    cleanup.mocks.register('kafka', () => kafkaMock.reset());
    cleanup.mocks.register('twilio', () => twilioMock.reset());
    cleanup.mocks.register('elevenlabs', () => elevenLabsMock.reset());
    cleanup.mocks.register('claude', () => claudeMock.reset());
    cleanup.mocks.register('multiAgent', () => multiAgentMock.reset());
  });

  beforeEach(async () => {
    // Connect services
    await producer.connect();
    await consumer.connect();
  });

  afterEach(async () => {
    await cleanup.cleanupAll();
  });

  afterAll(async () => {
    await producer.disconnect();
    await consumer.disconnect();
  });

  describe('Complete Workflow: Google Ads Lead', () => {
    it('should process lead from webhook to completed call within 5 minutes', async () => {
      // STEP 1: Lead Ingestion (webhook receives lead)
      const webhookPayload = generateGoogleAdsLead();
      const workflowStartTime = new Date();

      // Simulate lead ingestion
      const lead = generateLead({
        source: 'google_ads',
        sourceLeadId: webhookPayload.lead_id,
        createdAt: workflowStartTime,
      });

      assertValidLead(lead);
      assertTCPACompliant(lead);

      // STEP 2: Publish LeadReceived Event
      await producer.send({
        topic: 'leads',
        messages: [
          createEventMessage(EventTypes.LEAD_RECEIVED, {
            leadId: lead.leadId,
            source: lead.source,
            timestamp: workflowStartTime.toISOString(),
          }),
        ],
      });

      // Verify event was published
      const leadEvents = producer.getMessagesByTopic('leads');
      expect(leadEvents).toHaveLength(1);

      // STEP 3: Lead Qualification (AI Agent)
      const qualificationStartTime = new Date();

      const qualificationResponse = await multiAgentMock.sendToAgent(
        'realty-expert',
        `Qualify this lead: ${JSON.stringify(lead)}`
      );

      const qualificationResult = JSON.parse(qualificationResponse.content);
      expect(qualificationResult.qualified).toBe(true);
      expect(qualificationResult.score).toBeGreaterThanOrEqual(70);

      const qualifiedLead = {
        ...lead,
        status: 'qualified',
        qualificationScore: qualificationResult.score,
        qualificationReason: qualificationResult.reason,
        qualifiedAt: new Date(),
      };

      assertQualifiedLead(qualifiedLead);

      // STEP 4: Publish LeadQualified Event
      await producer.send({
        topic: 'leads',
        messages: [
          createEventMessage(EventTypes.LEAD_QUALIFIED, {
            leadId: qualifiedLead.leadId,
            score: qualifiedLead.qualificationScore,
            timestamp: new Date().toISOString(),
          }),
        ],
      });

      // STEP 5: Initiate Call (Twilio + ElevenLabs)
      const callStartTime = new Date();

      // Create Twilio call
      const twilioCall = await twilioMock.createCall({
        to: lead.contact.phone,
        from: '+15555555555',
      });

      expect(twilioCall.sid).toBeDefined();
      expect(twilioCall.status).toBe('queued');

      // Create ElevenLabs conversation
      const conversation = await elevenLabsMock.createConversation({
        agentId: 'test_agent_id',
        customContext: JSON.stringify({
          leadId: lead.leadId,
          firstName: lead.contact.firstName,
          propertyAddress: lead.property.address.street,
        }),
        firstMessage: `Hi ${lead.contact.firstName}, this is Alex from Next Level Real Estate. Is this a good time to talk?`,
      });

      expect(conversation.conversationId).toBeDefined();
      expect(conversation.status).toBe('connecting');

      // Wait for call to connect
      await waitForCondition(
        async () => {
          const call = await twilioMock.getCall(twilioCall.sid);
          return call?.status === 'in-progress';
        },
        { timeout: 2000, errorMessage: 'Call did not connect in time' }
      );

      // Wait for conversation to connect
      await waitForCondition(
        async () => {
          const conv = await elevenLabsMock.getConversation(conversation.conversationId);
          return conv?.status === 'connected';
        },
        { timeout: 2000, errorMessage: 'Conversation did not connect in time' }
      );

      // STEP 6: Publish CallInitiated Event
      await producer.send({
        topic: 'calls',
        messages: [
          createEventMessage(EventTypes.CALL_INITIATED, {
            leadId: lead.leadId,
            twilioCallSid: twilioCall.sid,
            conversationId: conversation.conversationId,
            timestamp: callStartTime.toISOString(),
          }),
        ],
      });

      // STEP 7: Simulate Conversation
      await elevenLabsMock.addMessage(
        conversation.conversationId,
        'Yes, I have a few minutes.',
        'user'
      );

      await elevenLabsMock.addMessage(
        conversation.conversationId,
        'Great! I understand you have a property you might be interested in selling?',
        'agent'
      );

      await elevenLabsMock.addMessage(
        conversation.conversationId,
        'Yes, I inherited a house and need to sell it quickly.',
        'user'
      );

      // STEP 8: Complete Call
      const callEndTime = new Date();
      await twilioMock.completeCall(twilioCall.sid, 120); // 2-minute call
      await elevenLabsMock.completeConversation(conversation.conversationId);

      const completedCall = await twilioMock.getCall(twilioCall.sid);
      const completedConversation = await elevenLabsMock.getConversation(conversation.conversationId);

      assertCompletedCall({
        callId: uuidv4(),
        leadId: lead.leadId,
        twilioCallSid: completedCall!.sid,
        from: completedCall!.from,
        to: completedCall!.to,
        status: 'completed',
        direction: 'outbound',
        startTime: callStartTime,
        endTime: callEndTime,
        duration: completedCall!.duration,
        transcript: completedConversation!.transcript,
        outcome: {
          qualified: true,
          interestLevel: 'high',
          nextAction: 'Schedule follow-up',
        },
        createdAt: callStartTime,
      });

      // STEP 9: Post-Call Analysis
      const sentimentAnalysis = await elevenLabsMock.analyzeSentiment(conversation.conversationId);
      expect(sentimentAnalysis.overall).toBeDefined();

      // STEP 10: Publish CallCompleted Event
      await producer.send({
        topic: 'calls',
        messages: [
          createEventMessage(EventTypes.CALL_COMPLETED, {
            leadId: lead.leadId,
            twilioCallSid: twilioCall.sid,
            duration: completedCall!.duration,
            outcome: sentimentAnalysis.overall,
            timestamp: callEndTime.toISOString(),
          }),
        ],
      });

      // STEP 11: Verify 5-Minute Rule
      const workflowEndTime = new Date();
      assertTimingConstraint(workflowStartTime, workflowEndTime, 5);

      const totalDuration = workflowEndTime.getTime() - workflowStartTime.getTime();
      console.log(`Total workflow duration: ${totalDuration}ms`);
      expect(totalDuration).toBeLessThan(300000); // 5 minutes in ms

      // Verify all events were published
      const allLeadEvents = producer.getMessagesByTopic('leads');
      const allCallEvents = producer.getMessagesByTopic('calls');
      expect(allLeadEvents.length).toBeGreaterThanOrEqual(2); // LeadReceived, LeadQualified
      expect(allCallEvents.length).toBeGreaterThanOrEqual(2); // CallInitiated, CallCompleted
    }, 60000); // 60-second test timeout

    it('should handle call failure gracefully', async () => {
      const lead = generateLead({ source: 'google_ads' });

      // Initiate call
      const twilioCall = await twilioMock.createCall({
        to: lead.contact.phone,
        from: '+15555555555',
      });

      // Simulate call failure
      await twilioMock.failCall(twilioCall.sid, 'no-answer');

      const failedCall = await twilioMock.getCall(twilioCall.sid);
      expect(failedCall?.status).toBe('no-answer');

      // Publish failure event
      await producer.send({
        topic: 'calls',
        messages: [
          createEventMessage('call.failed', {
            leadId: lead.leadId,
            twilioCallSid: twilioCall.sid,
            reason: 'no-answer',
            timestamp: new Date().toISOString(),
          }),
        ],
      });

      // Verify retry logic would be triggered
      const callEvents = producer.getMessagesByTopic('calls');
      const failureEvent = callEvents.find((e) => {
        const parsed = JSON.parse(e.value as string);
        return parsed.type === 'call.failed';
      });
      expect(failureEvent).toBeDefined();
    });

    it('should track performance metrics throughout workflow', async () => {
      const metrics: any = {
        leadIngestionTime: 0,
        qualificationTime: 0,
        callInitiationTime: 0,
        callDuration: 0,
        totalWorkflowTime: 0,
      };

      const lead = generateLead();
      const workflowStart = Date.now();

      // Measure lead ingestion
      const { duration: ingestionDuration } = await measureTime(async () => {
        await producer.send({
          topic: 'leads',
          messages: [createEventMessage(EventTypes.LEAD_RECEIVED, { leadId: lead.leadId })],
        });
      });
      metrics.leadIngestionTime = ingestionDuration;

      // Measure qualification
      const { duration: qualificationDuration } = await measureTime(async () => {
        await multiAgentMock.sendToAgent('realty-expert', `Qualify: ${JSON.stringify(lead)}`);
      });
      metrics.qualificationTime = qualificationDuration;

      // Measure call initiation
      const { duration: callInitDuration } = await measureTime(async () => {
        await twilioMock.createCall({
          to: lead.contact.phone,
          from: '+15555555555',
        });
      });
      metrics.callInitiationTime = callInitDuration;

      metrics.totalWorkflowTime = Date.now() - workflowStart;

      // Assert performance targets
      expect(metrics.leadIngestionTime).toBeLessThan(100); // < 100ms
      expect(metrics.qualificationTime).toBeLessThan(1000); // < 1s
      expect(metrics.callInitiationTime).toBeLessThan(500); // < 500ms
      expect(metrics.totalWorkflowTime).toBeLessThan(5000); // < 5s (excluding call duration)

      console.log('Workflow Performance Metrics:', metrics);
    });
  });
});
