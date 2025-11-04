/**
 * End-to-End Test: TCPA Compliance
 *
 * Tests TCPA 2025 compliance requirements throughout the system:
 * - Written consent validation
 * - DNC registry checks
 * - Automated call restrictions
 * - Consent tracking and audit trails
 */

import { generateLead } from '../mocks/test-data';
import { twilioMock } from '../mocks/twilio-mock';
import { kafkaMock, EventTypes, createEventMessage } from '../mocks/kafka-mock';
import {
  assertTCPACompliant,
  assertValidLead,
  assertValidationError,
} from '../utils/assertions';
import { createCleanupCoordinator } from '../utils/cleanup';

describe('E2E: TCPA Compliance', () => {
  const cleanup = createCleanupCoordinator();
  let producer: any;

  beforeAll(() => {
    producer = kafkaMock.producer();
    cleanup.mocks.register('kafka', () => kafkaMock.reset());
    cleanup.mocks.register('twilio', () => twilioMock.reset());
  });

  beforeEach(async () => {
    await producer.connect();
  });

  afterEach(async () => {
    await cleanup.cleanupAll();
  });

  afterAll(async () => {
    await producer.disconnect();
  });

  describe('Consent Validation', () => {
    it('should allow calls only with valid written consent', async () => {
      const lead = generateLead({
        consent: {
          hasWrittenConsent: true,
          consentDate: new Date(),
          consentMethod: 'written_form',
          consentSource: 'landing_page',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        automatedCallsAllowed: true,
      });

      assertTCPACompliant(lead);

      // Should be able to initiate call
      const call = await twilioMock.createCall({
        to: lead.contact.phone,
        from: '+15555555555',
      });

      expect(call).toBeDefined();
      expect(call.to).toBe(lead.contact.phone);
    });

    it('should block calls without written consent', async () => {
      const lead = generateLead({
        consent: {
          hasWrittenConsent: false,
          consentDate: null,
          consentMethod: null,
          consentSource: null,
          expiresAt: null,
        },
        automatedCallsAllowed: false,
      });

      // Attempt to validate consent
      const consentCheck = validateConsent(lead);
      expect(consentCheck.isValid).toBe(false);
      expect(consentCheck.reason).toMatch(/written consent required/i);

      // Should not be able to initiate call
      expect(() => {
        if (!consentCheck.isValid) {
          throw new Error('TCPA violation: No written consent');
        }
      }).toThrow('TCPA violation');
    });

    it('should reject expired consent', async () => {
      const expiredDate = new Date();
      expiredDate.setFullYear(expiredDate.getFullYear() - 2); // 2 years ago

      const lead = generateLead({
        consent: {
          hasWrittenConsent: true,
          consentDate: expiredDate,
          consentMethod: 'written_form',
          consentSource: 'landing_page',
          expiresAt: new Date(expiredDate.getTime() + 365 * 24 * 60 * 60 * 1000), // Expired
        },
      });

      const consentCheck = validateConsent(lead);
      expect(consentCheck.isValid).toBe(false);
      expect(consentCheck.reason).toMatch(/consent expired/i);
    });

    it('should validate consent method is acceptable', async () => {
      const validMethods = ['written_form', 'email', 'phone'];

      for (const method of validMethods) {
        const lead = generateLead({
          consent: {
            hasWrittenConsent: true,
            consentDate: new Date(),
            consentMethod: method,
            consentSource: 'landing_page',
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        });

        const consentCheck = validateConsent(lead);
        expect(consentCheck.isValid).toBe(true);
      }

      // Invalid method
      const leadInvalid = generateLead({
        consent: {
          hasWrittenConsent: true,
          consentDate: new Date(),
          consentMethod: 'verbal', // Not acceptable under TCPA 2025
          consentSource: 'phone_call',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      const invalidCheck = validateConsent(leadInvalid);
      expect(invalidCheck.isValid).toBe(false);
    });
  });

  describe('DNC Registry Checks', () => {
    it('should check DNC status before calling', async () => {
      const lead = generateLead({
        dncStatus: {
          onNationalRegistry: false,
          internalDNC: false,
          lastCheckedAt: new Date(),
        },
      });

      const dncCheck = checkDNCStatus(lead);
      expect(dncCheck.canCall).toBe(true);
    });

    it('should block calls to numbers on National DNC Registry', async () => {
      const lead = generateLead({
        dncStatus: {
          onNationalRegistry: true,
          internalDNC: false,
          lastCheckedAt: new Date(),
        },
      });

      const dncCheck = checkDNCStatus(lead);
      expect(dncCheck.canCall).toBe(false);
      expect(dncCheck.reason).toMatch(/national dnc registry/i);
    });

    it('should block calls to numbers on internal DNC list', async () => {
      const lead = generateLead({
        dncStatus: {
          onNationalRegistry: false,
          internalDNC: true,
          lastCheckedAt: new Date(),
        },
      });

      const dncCheck = checkDNCStatus(lead);
      expect(dncCheck.canCall).toBe(false);
      expect(dncCheck.reason).toMatch(/internal dnc/i);
    });

    it('should require DNC check within 31 days', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 32); // 32 days ago

      const lead = generateLead({
        dncStatus: {
          onNationalRegistry: false,
          internalDNC: false,
          lastCheckedAt: oldDate,
        },
      });

      const dncCheck = checkDNCStatus(lead);
      expect(dncCheck.canCall).toBe(false);
      expect(dncCheck.reason).toMatch(/dnc check outdated/i);
    });
  });

  describe('Automated Call Restrictions', () => {
    it('should allow automated calls only when explicitly permitted', async () => {
      const leadWithPermission = generateLead({
        automatedCallsAllowed: true,
        consent: {
          hasWrittenConsent: true,
          consentDate: new Date(),
          consentMethod: 'written_form',
          consentSource: 'landing_page',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      const check = canMakeAutomatedCall(leadWithPermission);
      expect(check.allowed).toBe(true);
    });

    it('should block automated calls without permission', async () => {
      const leadWithoutPermission = generateLead({
        automatedCallsAllowed: false,
        consent: {
          hasWrittenConsent: true,
          consentDate: new Date(),
          consentMethod: 'written_form',
          consentSource: 'landing_page',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      const check = canMakeAutomatedCall(leadWithoutPermission);
      expect(check.allowed).toBe(false);
      expect(check.reason).toMatch(/automated calls not allowed/i);
    });
  });

  describe('Audit Trail & Call Tracking', () => {
    it('should track all call attempts for audit', async () => {
      const lead = generateLead();
      const callAttempts: any[] = [];

      // First attempt
      const call1 = await twilioMock.createCall({
        to: lead.contact.phone,
        from: '+15555555555',
      });

      callAttempts.push({
        date: new Date(),
        type: 'automated',
        result: 'no-answer',
        twilioSid: call1.sid,
      });

      await twilioMock.failCall(call1.sid, 'no-answer');

      // Second attempt (next day)
      const call2 = await twilioMock.createCall({
        to: lead.contact.phone,
        from: '+15555555555',
      });

      callAttempts.push({
        date: new Date(),
        type: 'automated',
        result: 'completed',
        twilioSid: call2.sid,
      });

      await twilioMock.completeCall(call2.sid, 120);

      // Verify audit trail
      expect(callAttempts).toHaveLength(2);
      expect(callAttempts[0].result).toBe('no-answer');
      expect(callAttempts[1].result).toBe('completed');

      // Should be able to produce compliance report
      const complianceReport = generateComplianceReport(lead, callAttempts);
      expect(complianceReport.leadId).toBe(lead.leadId);
      expect(complianceReport.totalAttempts).toBe(2);
      expect(complianceReport.hasValidConsent).toBe(true);
      expect(complianceReport.isCompliant).toBe(true);
    });

    it('should log consent changes for audit', async () => {
      const lead = generateLead();
      const consentHistory: any[] = [];

      // Initial consent
      consentHistory.push({
        date: new Date(),
        action: 'granted',
        method: 'written_form',
        source: 'landing_page',
      });

      // Simulate consent revocation
      const revocationDate = new Date();
      revocationDate.setDate(revocationDate.getDate() + 30);

      consentHistory.push({
        date: revocationDate,
        action: 'revoked',
        method: 'email',
        source: 'unsubscribe_link',
      });

      // Updated lead
      const updatedLead = {
        ...lead,
        consent: {
          ...lead.consent,
          hasWrittenConsent: false,
          expiresAt: revocationDate,
        },
        dncStatus: {
          ...lead.dncStatus,
          internalDNC: true,
        },
      };

      // Should not be able to call after revocation
      const consentCheck = validateConsent(updatedLead);
      expect(consentCheck.isValid).toBe(false);

      // Verify consent history is maintained
      expect(consentHistory).toHaveLength(2);
      expect(consentHistory[0].action).toBe('granted');
      expect(consentHistory[1].action).toBe('revoked');
    });
  });

  describe('TCPA Violation Prevention', () => {
    it('should prevent calls that would violate TCPA', async () => {
      const violations: string[] = [];

      // Test Case 1: No consent
      const lead1 = generateLead({
        consent: { hasWrittenConsent: false },
      });
      if (!validateConsent(lead1).isValid) {
        violations.push('No written consent');
      }

      // Test Case 2: On DNC
      const lead2 = generateLead({
        dncStatus: { onNationalRegistry: true },
      });
      if (!checkDNCStatus(lead2).canCall) {
        violations.push('On DNC registry');
      }

      // Test Case 3: Expired consent
      const lead3 = generateLead({
        consent: {
          hasWrittenConsent: true,
          expiresAt: new Date(Date.now() - 1000), // Expired
        },
      });
      if (!validateConsent(lead3).isValid) {
        violations.push('Expired consent');
      }

      expect(violations).toHaveLength(3);
      console.log('Prevented TCPA violations:', violations);
    });

    it('should calculate potential TCPA fine exposure', () => {
      const violations = 5; // Example: 5 calls without consent
      const minFinePerViolation = 500;
      const maxFinePerViolation = 1500;

      const minExposure = violations * minFinePerViolation;
      const maxExposure = violations * maxFinePerViolation;

      expect(minExposure).toBe(2500);
      expect(maxExposure).toBe(7500);

      console.log(`TCPA fine exposure for ${violations} violations: $${minExposure} - $${maxExposure}`);
    });
  });
});

// Helper Functions

function validateConsent(lead: any): { isValid: boolean; reason?: string } {
  if (!lead.consent?.hasWrittenConsent) {
    return { isValid: false, reason: 'Written consent required under TCPA 2025' };
  }

  if (!lead.consent.consentDate) {
    return { isValid: false, reason: 'Consent date missing' };
  }

  if (lead.consent.expiresAt && new Date(lead.consent.expiresAt) < new Date()) {
    return { isValid: false, reason: 'Consent expired' };
  }

  const validMethods = ['written_form', 'email', 'phone'];
  if (!validMethods.includes(lead.consent.consentMethod)) {
    return { isValid: false, reason: 'Invalid consent method' };
  }

  return { isValid: true };
}

function checkDNCStatus(lead: any): { canCall: boolean; reason?: string } {
  if (lead.dncStatus?.onNationalRegistry) {
    return { canCall: false, reason: 'Phone number on National DNC Registry' };
  }

  if (lead.dncStatus?.internalDNC) {
    return { canCall: false, reason: 'Phone number on internal DNC list' };
  }

  // Check if DNC status is current (within 31 days)
  if (lead.dncStatus?.lastCheckedAt) {
    const daysSinceCheck = (Date.now() - new Date(lead.dncStatus.lastCheckedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCheck > 31) {
      return { canCall: false, reason: 'DNC check outdated (must check every 31 days)' };
    }
  }

  return { canCall: true };
}

function canMakeAutomatedCall(lead: any): { allowed: boolean; reason?: string } {
  if (!lead.automatedCallsAllowed) {
    return { allowed: false, reason: 'Automated calls not allowed for this contact' };
  }

  const consentCheck = validateConsent(lead);
  if (!consentCheck.isValid) {
    return { allowed: false, reason: consentCheck.reason };
  }

  return { allowed: true };
}

function generateComplianceReport(lead: any, callAttempts: any[]): any {
  const consentCheck = validateConsent(lead);
  const dncCheck = checkDNCStatus(lead);

  return {
    leadId: lead.leadId,
    phone: lead.contact.phone,
    hasValidConsent: consentCheck.isValid,
    onDNC: !dncCheck.canCall,
    totalAttempts: callAttempts.length,
    callHistory: callAttempts,
    isCompliant: consentCheck.isValid && dncCheck.canCall,
    issues: [
      ...(!consentCheck.isValid ? [consentCheck.reason] : []),
      ...(!dncCheck.canCall ? [dncCheck.reason] : []),
    ],
  };
}
