/**
 * Integration Test: Calling Service
 *
 * Tests the calling service integration with Twilio and ElevenLabs.
 */

import request from 'supertest';
import { generateLead, generateCall } from '../mocks/test-data';
import { twilioMock } from '../mocks/twilio-mock';
import { elevenLabsMock } from '../mocks/elevenlabs-mock';
import {
  assertValidCall,
  assertCompletedCall,
  assertTCPACompliant,
  assertValidApiResponse,
} from '../utils/assertions';
import { createCleanupCoordinator } from '../utils/cleanup';
import { waitForCondition } from '../utils/test-helpers';

describe('Integration: Calling Service', () => {
  const cleanup = createCleanupCoordinator();
  const baseURL = process.env.CALLING_SERVICE_URL || 'http://localhost:3002';

  beforeEach(() => {
    cleanup.mocks.register('twilio', () => twilioMock.reset());
    cleanup.mocks.register('elevenlabs', () => elevenLabsMock.reset());
  });

  afterEach(async () => {
    await cleanup.cleanupAll();
  });

  describe('POST /api/calls/initiate', () => {
    it('should initiate a call with TCPA compliance check', async () => {
      const lead = generateLead();
      assertTCPACompliant(lead);

      const callRequest = {
        leadId: lead.leadId,
        phoneNumber: lead.contact.phone,
        context: {
          firstName: lead.contact.firstName,
          propertyAddress: lead.property.address.street,
        },
      };

      const response = await request(baseURL)
        .post('/api/calls/initiate')
        .send(callRequest)
        .expect(201);

      assertValidApiResponse(response, 201);
      assertValidCall(response.body);
      expect(response.body.leadId).toBe(lead.leadId);
      expect(response.body.status).toMatch(/queued|ringing/);

      cleanup.database.track('calls', response.body.callId);
    });

    it('should reject call without valid consent', async () => {
      const lead = generateLead({
        consent: { hasWrittenConsent: false },
      });

      const callRequest = {
        leadId: lead.leadId,
        phoneNumber: lead.contact.phone,
      };

      const response = await request(baseURL)
        .post('/api/calls/initiate')
        .send(callRequest)
        .expect(403);

      expect(response.body.error).toMatch(/tcpa|consent/i);
    });

    it('should create both Twilio and ElevenLabs sessions', async () => {
      const lead = generateLead();

      // Initiate call via API
      const response = await request(baseURL)
        .post('/api/calls/initiate')
        .send({
          leadId: lead.leadId,
          phoneNumber: lead.contact.phone,
        })
        .expect(201);

      // Verify Twilio call was created
      const twilioCall = await twilioMock.getCall(response.body.twilioCallSid);
      expect(twilioCall).toBeDefined();
      expect(twilioCall?.to).toBe(lead.contact.phone);

      // Verify ElevenLabs conversation was created
      const conversation = await elevenLabsMock.getConversation(response.body.conversationId);
      expect(conversation).toBeDefined();
      expect(conversation?.status).toMatch(/connecting|connected/);

      cleanup.database.track('calls', response.body.callId);
    });
  });

  describe('GET /api/calls/:callId', () => {
    it('should retrieve call details', async () => {
      const call = generateCall();

      // Create call first
      const createResponse = await request(baseURL)
        .post('/api/calls')
        .send(call)
        .expect(201);

      cleanup.database.track('calls', createResponse.body.callId);

      const response = await request(baseURL)
        .get(`/api/calls/${createResponse.body.callId}`)
        .expect(200);

      assertValidApiResponse(response);
      assertValidCall(response.body);
    });
  });

  describe('POST /api/calls/:callId/complete', () => {
    it('should mark call as completed with transcript', async () => {
      const call = generateCall();

      const createResponse = await request(baseURL)
        .post('/api/calls')
        .send(call)
        .expect(201);

      cleanup.database.track('calls', createResponse.body.callId);

      const completionData = {
        duration: 120,
        transcript: [
          { role: 'agent', message: 'Hello, is this a good time?', timestamp: new Date() },
          { role: 'user', message: 'Yes, I have a few minutes.', timestamp: new Date() },
        ],
        outcome: {
          qualified: true,
          interestLevel: 'high',
          nextAction: 'Schedule follow-up',
        },
      };

      const response = await request(baseURL)
        .post(`/api/calls/${createResponse.body.callId}/complete`)
        .send(completionData)
        .expect(200);

      assertValidApiResponse(response);
      assertCompletedCall(response.body);
      expect(response.body.duration).toBe(120);
    });
  });

  describe('GET /api/calls', () => {
    it('should list calls for a lead', async () => {
      const lead = generateLead();

      // Create multiple calls for the lead
      const calls = await Promise.all(
        Array.from({ length: 3 }, async () => {
          const call = generateCall({ leadId: lead.leadId });
          const res = await request(baseURL).post('/api/calls').send(call);
          cleanup.database.track('calls', res.body.callId);
          return res.body;
        })
      );

      const response = await request(baseURL)
        .get('/api/calls')
        .query({ leadId: lead.leadId })
        .expect(200);

      assertValidApiResponse(response);
      expect(response.body.calls.length).toBeGreaterThanOrEqual(3);
      response.body.calls.forEach((call: any) => {
        expect(call.leadId).toBe(lead.leadId);
      });
    });
  });

  describe('POST /api/calls/:callId/transcript', () => {
    it('should retrieve and store conversation transcript', async () => {
      const call = generateCall();

      const createResponse = await request(baseURL)
        .post('/api/calls')
        .send(call)
        .expect(201);

      cleanup.database.track('calls', createResponse.body.callId);

      // Get transcript from ElevenLabs
      const response = await request(baseURL)
        .get(`/api/calls/${createResponse.body.callId}/transcript`)
        .expect(200);

      assertValidApiResponse(response);
      expect(Array.isArray(response.body.transcript)).toBe(true);
    });
  });

  describe('POST /api/calls/:callId/sentiment', () => {
    it('should analyze conversation sentiment', async () => {
      const call = generateCall();

      const createResponse = await request(baseURL)
        .post('/api/calls')
        .send(call)
        .expect(201);

      cleanup.database.track('calls', createResponse.body.callId);

      const response = await request(baseURL)
        .post(`/api/calls/${createResponse.body.callId}/sentiment`)
        .expect(200);

      assertValidApiResponse(response);
      expect(response.body.overall).toMatch(/positive|neutral|negative/);
      expect(Array.isArray(response.body.details)).toBe(true);
    });
  });

  describe('Twilio Webhook Callbacks', () => {
    it('should handle call status updates via webhook', async () => {
      const call = generateCall();

      const createResponse = await request(baseURL)
        .post('/api/calls')
        .send(call)
        .expect(201);

      cleanup.database.track('calls', createResponse.body.callId);

      // Simulate Twilio status callback
      const statusUpdate = {
        CallSid: createResponse.body.twilioCallSid,
        CallStatus: 'completed',
        CallDuration: '120',
        From: '+15555555555',
        To: call.to,
      };

      const response = await request(baseURL)
        .post('/api/calls/webhook/twilio/status')
        .send(statusUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify call was updated
      const updatedCall = await request(baseURL)
        .get(`/api/calls/${createResponse.body.callId}`)
        .expect(200);

      expect(updatedCall.body.status).toBe('completed');
      expect(updatedCall.body.duration).toBe(120);
    });
  });

  describe('Call Retry Logic', () => {
    it('should schedule retry for failed calls', async () => {
      const lead = generateLead();

      const callRequest = {
        leadId: lead.leadId,
        phoneNumber: lead.contact.phone,
      };

      const response = await request(baseURL)
        .post('/api/calls/initiate')
        .send(callRequest)
        .expect(201);

      cleanup.database.track('calls', response.body.callId);

      // Simulate call failure
      await request(baseURL)
        .post(`/api/calls/${response.body.callId}/fail`)
        .send({ reason: 'no-answer' })
        .expect(200);

      // Check retry was scheduled
      const retryResponse = await request(baseURL)
        .get(`/api/calls/${response.body.callId}/retries`)
        .expect(200);

      expect(retryResponse.body.retryScheduled).toBe(true);
      expect(retryResponse.body.nextAttemptAt).toBeDefined();
    });

    it('should limit retry attempts', async () => {
      const lead = generateLead();

      // Create call
      const createResponse = await request(baseURL)
        .post('/api/calls')
        .send(generateCall({ leadId: lead.leadId }))
        .expect(201);

      cleanup.database.track('calls', createResponse.body.callId);

      // Simulate max retry attempts (3 attempts)
      for (let i = 0; i < 3; i++) {
        await request(baseURL)
          .post(`/api/calls/${createResponse.body.callId}/retry`)
          .expect(200);

        await request(baseURL)
          .post(`/api/calls/${createResponse.body.callId}/fail`)
          .send({ reason: 'no-answer' })
          .expect(200);
      }

      // Fourth retry should be rejected
      const response = await request(baseURL)
        .post(`/api/calls/${createResponse.body.callId}/retry`)
        .expect(400);

      expect(response.body.error).toMatch(/max.*retries/i);
    });
  });
});
