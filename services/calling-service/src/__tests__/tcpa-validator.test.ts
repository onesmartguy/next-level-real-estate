import { TCPAValidator, TCPAViolationType } from '../services/tcpa-validator';
import { Lead } from '@next-level-real-estate/shared/models';

describe('TCPAValidator', () => {
  let validator: TCPAValidator;

  beforeEach(() => {
    validator = new TCPAValidator();
  });

  describe('validateCallPermission', () => {
    it('should allow manual calls with valid consent', async () => {
      const lead: Partial<Lead> = {
        leadId: 'test_lead',
        contact: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+15551234567',
          preferredContactMethod: 'phone',
        },
        consent: {
          hasWrittenConsent: true,
          consentDate: new Date(),
          consentMethod: 'written_form',
          consentSource: 'website',
        },
        dncStatus: {
          onNationalRegistry: false,
          internalDNC: false,
        },
        automatedCallsAllowed: true,
      };

      const result = await validator.validateCallPermission(lead as Lead, 'manual');

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.canCallManually).toBe(true);
    });

    it('should reject calls to DNC registry numbers', async () => {
      const lead: Partial<Lead> = {
        leadId: 'test_lead',
        contact: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+15551234567',
          preferredContactMethod: 'phone',
        },
        consent: {
          hasWrittenConsent: true,
          consentDate: new Date(),
          consentMethod: 'written_form',
          consentSource: 'website',
        },
        dncStatus: {
          onNationalRegistry: true,
          internalDNC: false,
        },
        automatedCallsAllowed: false,
      };

      const result = await validator.validateCallPermission(lead as Lead, 'agent');

      expect(result.isValid).toBe(false);
      expect(result.violations).toContain(TCPAViolationType.ON_DNC_REGISTRY);
      expect(result.canCallManually).toBe(false);
      expect(result.canCallAutomated).toBe(false);
    });

    it('should reject automated calls without consent', async () => {
      const lead: Partial<Lead> = {
        leadId: 'test_lead',
        contact: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+15551234567',
          preferredContactMethod: 'phone',
        },
        consent: {
          hasWrittenConsent: false,
          consentMethod: 'none',
        },
        dncStatus: {
          onNationalRegistry: false,
          internalDNC: false,
        },
        automatedCallsAllowed: false,
      };

      const result = await validator.validateCallPermission(lead as Lead, 'automated');

      expect(result.isValid).toBe(false);
      expect(result.violations).toContain(TCPAViolationType.NO_CONSENT);
      expect(result.canCallAutomated).toBe(false);
    });

    it('should reject calls with expired consent', async () => {
      const expiredDate = new Date();
      expiredDate.setFullYear(expiredDate.getFullYear() - 1);

      const lead: Partial<Lead> = {
        leadId: 'test_lead',
        contact: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+15551234567',
          preferredContactMethod: 'phone',
        },
        consent: {
          hasWrittenConsent: true,
          consentDate: new Date('2020-01-01'),
          consentMethod: 'written_form',
          consentSource: 'website',
          expiresAt: expiredDate,
        },
        dncStatus: {
          onNationalRegistry: false,
          internalDNC: false,
        },
        automatedCallsAllowed: true,
      };

      const result = await validator.validateCallPermission(lead as Lead, 'agent');

      expect(result.isValid).toBe(false);
      expect(result.violations).toContain(TCPAViolationType.EXPIRED_CONSENT);
    });

    it('should warn about upcoming consent expiration', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15); // 15 days from now

      const lead: Partial<Lead> = {
        leadId: 'test_lead',
        contact: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+15551234567',
          preferredContactMethod: 'phone',
        },
        consent: {
          hasWrittenConsent: true,
          consentDate: new Date(),
          consentMethod: 'written_form',
          consentSource: 'website',
          expiresAt: futureDate,
        },
        dncStatus: {
          onNationalRegistry: false,
          internalDNC: false,
        },
        automatedCallsAllowed: true,
      };

      const result = await validator.validateCallPermission(lead as Lead, 'agent');

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('expires in');
    });
  });

  describe('estimateViolationFine', () => {
    it('should estimate $1000 per violation', () => {
      const violations = [
        TCPAViolationType.NO_CONSENT,
        TCPAViolationType.ON_DNC_REGISTRY,
      ];

      const fine = validator.estimateViolationFine(violations);

      expect(fine).toBe(2000); // $1000 × 2 violations
    });
  });
});
