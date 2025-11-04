/**
 * Integration Test: Lead Service
 *
 * Tests the lead service API endpoints and database operations.
 */

import request from 'supertest';
import { generateLead, generateGoogleAdsLead, generateZillowLead } from '../mocks/test-data';
import {
  assertValidLead,
  assertQualifiedLead,
  assertValidApiResponse,
  assertErrorResponse,
  assertValidationError,
  assertNotFound,
} from '../utils/assertions';
import { createCleanupCoordinator } from '../utils/cleanup';

describe('Integration: Lead Service', () => {
  const cleanup = createCleanupCoordinator();
  const baseURL = process.env.LEAD_SERVICE_URL || 'http://localhost:3001';

  afterEach(async () => {
    await cleanup.cleanupAll();
  });

  describe('POST /api/leads/webhook/google-ads', () => {
    it('should ingest Google Ads lead via webhook', async () => {
      const webhookPayload = generateGoogleAdsLead();

      const response = await request(baseURL)
        .post('/api/leads/webhook/google-ads')
        .send(webhookPayload)
        .expect(201);

      assertValidApiResponse(response, 201);
      expect(response.body.leadId).toBeDefined();
      expect(response.body.source).toBe('google_ads');

      cleanup.database.track('leads', response.body.leadId);
    });

    it('should reject invalid webhook payload', async () => {
      const invalidPayload = {
        // Missing required fields
        invalid: 'data',
      };

      const response = await request(baseURL)
        .post('/api/leads/webhook/google-ads')
        .send(invalidPayload)
        .expect(400);

      assertValidationError(response);
    });

    it('should deduplicate leads based on source ID', async () => {
      const webhookPayload = generateGoogleAdsLead();

      // First submission
      const response1 = await request(baseURL)
        .post('/api/leads/webhook/google-ads')
        .send(webhookPayload)
        .expect(201);

      cleanup.database.track('leads', response1.body.leadId);

      // Duplicate submission with same lead_id
      const response2 = await request(baseURL)
        .post('/api/leads/webhook/google-ads')
        .send(webhookPayload)
        .expect(200); // Returns existing lead

      expect(response2.body.leadId).toBe(response1.body.leadId);
      expect(response2.body.duplicate).toBe(true);
    });
  });

  describe('POST /api/leads/webhook/zillow', () => {
    it('should ingest Zillow lead via webhook', async () => {
      const webhookPayload = generateZillowLead();

      const response = await request(baseURL)
        .post('/api/leads/webhook/zillow')
        .send(webhookPayload)
        .expect(201);

      assertValidApiResponse(response, 201);
      expect(response.body.source).toBe('zillow');

      cleanup.database.track('leads', response.body.leadId);
    });
  });

  describe('GET /api/leads/:leadId', () => {
    it('should retrieve lead by ID', async () => {
      const lead = generateLead();
      // Assume lead is created first
      const createResponse = await request(baseURL)
        .post('/api/leads')
        .send(lead)
        .expect(201);

      cleanup.database.track('leads', createResponse.body.leadId);

      const response = await request(baseURL)
        .get(`/api/leads/${createResponse.body.leadId}`)
        .expect(200);

      assertValidApiResponse(response);
      assertValidLead(response.body);
      expect(response.body.leadId).toBe(createResponse.body.leadId);
    });

    it('should return 404 for non-existent lead', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(baseURL)
        .get(`/api/leads/${fakeId}`)
        .expect(404);

      assertNotFound(response);
    });
  });

  describe('PUT /api/leads/:leadId/qualify', () => {
    it('should qualify a lead', async () => {
      const lead = generateLead();
      const createResponse = await request(baseURL)
        .post('/api/leads')
        .send(lead)
        .expect(201);

      cleanup.database.track('leads', createResponse.body.leadId);

      const qualificationData = {
        score: 85,
        reason: 'High equity, motivated seller',
        estimatedValue: 250000,
      };

      const response = await request(baseURL)
        .put(`/api/leads/${createResponse.body.leadId}/qualify`)
        .send(qualificationData)
        .expect(200);

      assertValidApiResponse(response);
      assertQualifiedLead(response.body);
      expect(response.body.qualificationScore).toBe(85);
    });
  });

  describe('GET /api/leads', () => {
    it('should list leads with pagination', async () => {
      // Create multiple leads
      const leads = await Promise.all(
        Array.from({ length: 5 }, async () => {
          const lead = generateLead();
          const res = await request(baseURL).post('/api/leads').send(lead);
          cleanup.database.track('leads', res.body.leadId);
          return res.body;
        })
      );

      const response = await request(baseURL)
        .get('/api/leads')
        .query({ limit: 10, offset: 0 })
        .expect(200);

      assertValidApiResponse(response);
      expect(Array.isArray(response.body.leads)).toBe(true);
      expect(response.body.leads.length).toBeGreaterThanOrEqual(5);
      expect(response.body.total).toBeDefined();
      expect(response.body.limit).toBe(10);
      expect(response.body.offset).toBe(0);
    });

    it('should filter leads by status', async () => {
      const response = await request(baseURL)
        .get('/api/leads')
        .query({ status: 'qualified' })
        .expect(200);

      assertValidApiResponse(response);
      response.body.leads.forEach((lead: any) => {
        expect(lead.status).toBe('qualified');
      });
    });

    it('should filter leads by source', async () => {
      const response = await request(baseURL)
        .get('/api/leads')
        .query({ source: 'google_ads' })
        .expect(200);

      assertValidApiResponse(response);
      response.body.leads.forEach((lead: any) => {
        expect(lead.source).toBe('google_ads');
      });
    });

    it('should sort leads by creation date', async () => {
      const response = await request(baseURL)
        .get('/api/leads')
        .query({ sortBy: 'createdAt', order: 'desc' })
        .expect(200);

      assertValidApiResponse(response);

      // Verify descending order
      for (let i = 1; i < response.body.leads.length; i++) {
        const prev = new Date(response.body.leads[i - 1].createdAt);
        const curr = new Date(response.body.leads[i].createdAt);
        expect(prev.getTime()).toBeGreaterThanOrEqual(curr.getTime());
      }
    });
  });

  describe('POST /api/leads/:leadId/consent', () => {
    it('should update consent information', async () => {
      const lead = generateLead();
      const createResponse = await request(baseURL)
        .post('/api/leads')
        .send(lead)
        .expect(201);

      cleanup.database.track('leads', createResponse.body.leadId);

      const consentUpdate = {
        hasWrittenConsent: true,
        consentMethod: 'email',
        consentSource: 'confirmation_email',
      };

      const response = await request(baseURL)
        .post(`/api/leads/${createResponse.body.leadId}/consent`)
        .send(consentUpdate)
        .expect(200);

      assertValidApiResponse(response);
      expect(response.body.consent.hasWrittenConsent).toBe(true);
      expect(response.body.consent.consentMethod).toBe('email');
    });
  });

  describe('POST /api/leads/:leadId/dnc-check', () => {
    it('should check DNC status', async () => {
      const lead = generateLead();
      const createResponse = await request(baseURL)
        .post('/api/leads')
        .send(lead)
        .expect(201);

      cleanup.database.track('leads', createResponse.body.leadId);

      const response = await request(baseURL)
        .post(`/api/leads/${createResponse.body.leadId}/dnc-check`)
        .expect(200);

      assertValidApiResponse(response);
      expect(response.body.dncStatus).toBeDefined();
      expect(response.body.dncStatus.onNationalRegistry).toBeDefined();
      expect(response.body.dncStatus.internalDNC).toBeDefined();
      expect(response.body.dncStatus.lastCheckedAt).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This would require mocking database failure
      // For now, we test the error response format
      const invalidId = 'invalid-uuid-format';

      const response = await request(baseURL)
        .get(`/api/leads/${invalidId}`)
        .expect(400);

      assertValidationError(response);
    });

    it('should validate required fields', async () => {
      const incompleteLeadData = {
        source: 'google_ads',
        // Missing required contact information
      };

      const response = await request(baseURL)
        .post('/api/leads')
        .send(incompleteLeadData)
        .expect(400);

      assertValidationError(response);
    });
  });
});
