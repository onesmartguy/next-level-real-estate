import { Logger } from '@next-level-real-estate/shared/utils';
import { Lead, Consent, DNCStatus } from '@next-level-real-estate/shared/models';
import { config } from '../config';

/**
 * TCPA validation error types
 */
export enum TCPAViolationType {
  NO_CONSENT = 'NO_CONSENT',
  EXPIRED_CONSENT = 'EXPIRED_CONSENT',
  WRONG_CONSENT_METHOD = 'WRONG_CONSENT_METHOD',
  ON_DNC_REGISTRY = 'ON_DNC_REGISTRY',
  INTERNAL_DNC = 'INTERNAL_DNC',
  AUTOMATED_CALL_NOT_ALLOWED = 'AUTOMATED_CALL_NOT_ALLOWED',
}

/**
 * TCPA validation result
 */
export interface TCPAValidationResult {
  isValid: boolean;
  violations: TCPAViolationType[];
  reason?: string;
  canCallManually: boolean;
  canCallAutomated: boolean;
  warnings: string[];
}

/**
 * TCPA Validator Service
 *
 * Enforces TCPA 2025 compliance requirements:
 * - One-to-one written consent required
 * - No automated calls without explicit permission
 * - DNC registry checking
 * - Consent expiration tracking
 */
export class TCPAValidator {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('TCPAValidator');
  }

  /**
   * Validate if a call can be made to a lead
   */
  async validateCallPermission(
    lead: Lead,
    callType: 'manual' | 'automated' | 'agent'
  ): Promise<TCPAValidationResult> {
    const result: TCPAValidationResult = {
      isValid: true,
      violations: [],
      canCallManually: true,
      canCallAutomated: true,
      warnings: [],
    };

    // Skip validation if disabled (development only)
    if (!config.tcpa.enableValidation) {
      this.logger.warn('TCPA validation is disabled - skipping checks', {
        leadId: lead.leadId,
      });
      result.warnings.push('TCPA validation is disabled');
      return result;
    }

    // Check DNC status
    const dncViolation = this.checkDNCStatus(lead.dncStatus);
    if (dncViolation) {
      result.violations.push(dncViolation);
      result.canCallManually = false;
      result.canCallAutomated = false;
      result.isValid = false;
    }

    // Check consent for automated/AI calls
    if (callType === 'automated' || callType === 'agent') {
      const consentViolations = this.checkConsent(lead.consent, callType);
      if (consentViolations.length > 0) {
        result.violations.push(...consentViolations);
        result.canCallAutomated = false;

        // AI calls are considered automated under TCPA
        if (callType === 'agent') {
          result.isValid = false;
        }
      }

      // Check if automated calls are explicitly allowed
      if (!lead.automatedCallsAllowed) {
        result.violations.push(TCPAViolationType.AUTOMATED_CALL_NOT_ALLOWED);
        result.canCallAutomated = false;
        if (callType === 'automated' || callType === 'agent') {
          result.isValid = false;
        }
      }
    }

    // Build reason message
    if (!result.isValid) {
      result.reason = this.buildViolationMessage(result.violations);
    }

    // Add warnings for borderline cases
    if (lead.consent.expiresAt) {
      const daysUntilExpiration = Math.floor(
        (lead.consent.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilExpiration <= 30 && daysUntilExpiration > 0) {
        result.warnings.push(
          `Consent expires in ${daysUntilExpiration} days - consider renewal`
        );
      }
    }

    // Log validation result
    this.logger.info('TCPA validation completed', {
      leadId: lead.leadId,
      callType,
      isValid: result.isValid,
      violations: result.violations,
      warnings: result.warnings,
    });

    return result;
  }

  /**
   * Check DNC status
   */
  private checkDNCStatus(dncStatus: DNCStatus): TCPAViolationType | null {
    if (dncStatus.onNationalRegistry) {
      return TCPAViolationType.ON_DNC_REGISTRY;
    }

    if (dncStatus.internalDNC) {
      return TCPAViolationType.INTERNAL_DNC;
    }

    return null;
  }

  /**
   * Check consent validity
   */
  private checkConsent(
    consent: Consent,
    callType: 'manual' | 'automated' | 'agent'
  ): TCPAViolationType[] {
    const violations: TCPAViolationType[] = [];

    // Check if consent exists
    if (!consent.hasWrittenConsent) {
      if (config.tcpa.requireWrittenConsent) {
        violations.push(TCPAViolationType.NO_CONSENT);
      }
      return violations; // No point checking further
    }

    // Check consent method (must be written for automated calls)
    if (callType === 'automated' || callType === 'agent') {
      const validMethods = ['written_form', 'email', 'website'];
      if (!validMethods.includes(consent.consentMethod)) {
        violations.push(TCPAViolationType.WRONG_CONSENT_METHOD);
      }
    }

    // Check expiration
    if (consent.expiresAt && consent.expiresAt < new Date()) {
      violations.push(TCPAViolationType.EXPIRED_CONSENT);
    }

    return violations;
  }

  /**
   * Build human-readable violation message
   */
  private buildViolationMessage(violations: TCPAViolationType[]): string {
    const messages: Record<TCPAViolationType, string> = {
      [TCPAViolationType.NO_CONSENT]: 'No written consent on file',
      [TCPAViolationType.EXPIRED_CONSENT]: 'Consent has expired',
      [TCPAViolationType.WRONG_CONSENT_METHOD]: 'Consent method not valid for automated calls',
      [TCPAViolationType.ON_DNC_REGISTRY]: 'Contact is on National Do Not Call Registry',
      [TCPAViolationType.INTERNAL_DNC]: 'Contact is on internal Do Not Call list',
      [TCPAViolationType.AUTOMATED_CALL_NOT_ALLOWED]:
        'Automated calls not explicitly allowed',
    };

    return violations.map((v) => messages[v]).join('; ');
  }

  /**
   * Check if DNC registry needs to be checked
   * TCPA requires 31-day scrub cycle
   */
  shouldCheckDNCRegistry(dncStatus: DNCStatus): boolean {
    if (!dncStatus.lastCheckedAt) {
      return true;
    }

    const daysSinceCheck = Math.floor(
      (Date.now() - dncStatus.lastCheckedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceCheck >= 31;
  }

  /**
   * Estimate TCPA violation fine
   * $500-$1,500 per violation
   */
  estimateViolationFine(violations: TCPAViolationType[]): number {
    // Base fine per violation: $500-$1,500
    // Use average of $1,000 for estimation
    return violations.length * 1000;
  }
}
