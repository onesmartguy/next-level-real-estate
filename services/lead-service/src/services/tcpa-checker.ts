import axios from 'axios';
import config from '../config';
import logger from '../utils/logger';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('lead-service-tcpa');

export interface TCPACheckResult {
  canContact: boolean;
  onNationalDNC: boolean;
  reason?: string;
  lastCheckedAt: Date;
}

export interface ConsentVerificationResult {
  isValid: boolean;
  hasWrittenConsent: boolean;
  isExpired: boolean;
  reason?: string;
}

class TCPACheckerService {
  /**
   * Check if a phone number is on the National Do Not Call Registry
   * Note: In production, this should integrate with actual DNC registry API
   */
  async checkDNCRegistry(phone: string): Promise<boolean> {
    const span = tracer.startSpan('tcpa.checkDNCRegistry');

    try {
      span.setAttribute('phone', phone);

      // If no API key configured, skip DNC check (development mode)
      if (!config.dnc.apiKey) {
        logger.warn('DNC API key not configured, skipping DNC check', { phone });
        span.setStatus({ code: SpanStatusCode.OK });
        return false;
      }

      // In production, integrate with actual DNC API
      // Example: https://www.donotcall.gov/api or third-party service
      try {
        const response = await axios.post(
          `${config.dnc.apiEndpoint}/check`,
          { phone },
          {
            headers: {
              'Authorization': `Bearer ${config.dnc.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          }
        );

        const isOnDNC = response.data?.onRegistry || false;
        logger.debug('DNC registry check completed', { phone, isOnDNC });

        span.setStatus({ code: SpanStatusCode.OK });
        return isOnDNC;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          logger.error('DNC API request failed', {
            phone,
            status: error.response?.status,
            message: error.message
          });
        } else {
          logger.error('Unexpected error checking DNC registry', { phone, error });
        }

        // Fail open: if API is down, allow contact but log warning
        logger.warn('DNC check failed, defaulting to allow contact', { phone });
        span.setStatus({ code: SpanStatusCode.ERROR });
        return false;
      }
    } finally {
      span.end();
    }
  }

  /**
   * Verify if consent is valid according to TCPA 2025 requirements
   */
  verifyConsent(consent: {
    hasWrittenConsent: boolean;
    consentDate?: Date;
    consentMethod?: string;
    expiresAt?: Date;
  }): ConsentVerificationResult {
    const span = tracer.startSpan('tcpa.verifyConsent');

    try {
      // TCPA 2025: Written consent required
      if (!consent.hasWrittenConsent) {
        span.setStatus({ code: SpanStatusCode.OK });
        return {
          isValid: false,
          hasWrittenConsent: false,
          isExpired: false,
          reason: 'No written consent provided (required by TCPA 2025)'
        };
      }

      // Check if consent has expired
      if (consent.expiresAt) {
        const now = new Date();
        if (now > consent.expiresAt) {
          span.setStatus({ code: SpanStatusCode.OK });
          return {
            isValid: false,
            hasWrittenConsent: true,
            isExpired: true,
            reason: 'Consent has expired'
          };
        }
      }

      // Verify consent method is acceptable
      const acceptableMethods = ['written_form', 'email', 'online_form'];
      if (consent.consentMethod && !acceptableMethods.includes(consent.consentMethod)) {
        span.setStatus({ code: SpanStatusCode.OK });
        return {
          isValid: false,
          hasWrittenConsent: true,
          isExpired: false,
          reason: `Consent method '${consent.consentMethod}' not acceptable. Must be one of: ${acceptableMethods.join(', ')}`
        };
      }

      // Consent is valid
      span.setStatus({ code: SpanStatusCode.OK });
      return {
        isValid: true,
        hasWrittenConsent: true,
        isExpired: false
      };
    } finally {
      span.end();
    }
  }

  /**
   * Comprehensive TCPA compliance check
   */
  async performTCPACheck(
    phone: string,
    consent: {
      hasWrittenConsent: boolean;
      consentDate?: Date;
      consentMethod?: string;
      expiresAt?: Date;
    },
    internalDNC: boolean = false
  ): Promise<TCPACheckResult> {
    const span = tracer.startSpan('tcpa.performTCPACheck');

    try {
      span.setAttributes({
        'phone': phone,
        'consent.hasWritten': consent.hasWrittenConsent,
        'internalDNC': internalDNC
      });

      const lastCheckedAt = new Date();

      // Check internal DNC list first
      if (internalDNC) {
        logger.info('Phone on internal DNC list', { phone });
        span.setStatus({ code: SpanStatusCode.OK });
        return {
          canContact: false,
          onNationalDNC: false,
          reason: 'Phone number is on internal Do Not Call list',
          lastCheckedAt
        };
      }

      // Verify consent
      const consentCheck = this.verifyConsent(consent);
      if (!consentCheck.isValid) {
        logger.info('Consent verification failed', {
          phone,
          reason: consentCheck.reason
        });
        span.setStatus({ code: SpanStatusCode.OK });
        return {
          canContact: false,
          onNationalDNC: false,
          reason: consentCheck.reason,
          lastCheckedAt
        };
      }

      // Check National DNC Registry
      const onNationalDNC = await this.checkDNCRegistry(phone);
      if (onNationalDNC) {
        logger.info('Phone on National DNC Registry', { phone });
        span.setStatus({ code: SpanStatusCode.OK });
        return {
          canContact: false,
          onNationalDNC: true,
          reason: 'Phone number is on National Do Not Call Registry',
          lastCheckedAt
        };
      }

      // All checks passed
      logger.debug('TCPA check passed', { phone });
      span.setStatus({ code: SpanStatusCode.OK });
      return {
        canContact: true,
        onNationalDNC: false,
        lastCheckedAt
      };
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      logger.error('Error performing TCPA check', { phone, error });

      // Fail safe: if check fails, don't allow contact
      return {
        canContact: false,
        onNationalDNC: false,
        reason: 'Error performing TCPA compliance check',
        lastCheckedAt: new Date()
      };
    } finally {
      span.end();
    }
  }

  /**
   * Calculate if DNC scrub is needed based on last check date
   */
  needsDNCScrub(lastCheckedAt: Date): boolean {
    const now = new Date();
    const daysSinceCheck = Math.floor(
      (now.getTime() - lastCheckedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceCheck >= config.dnc.scrubIntervalDays;
  }

  /**
   * Validate consent data before storing
   */
  validateConsentData(consent: {
    hasWrittenConsent: boolean;
    consentDate?: Date;
    consentMethod?: string;
    consentSource?: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (consent.hasWrittenConsent) {
      if (!consent.consentDate) {
        errors.push('Consent date required when written consent is provided');
      }

      if (!consent.consentMethod) {
        errors.push('Consent method required when written consent is provided');
      }

      if (!consent.consentSource) {
        errors.push('Consent source required when written consent is provided');
      }

      const acceptableMethods = ['written_form', 'email', 'phone', 'online_form'];
      if (consent.consentMethod && !acceptableMethods.includes(consent.consentMethod)) {
        errors.push(`Invalid consent method. Must be one of: ${acceptableMethods.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate consent expiration date (typically 1 year from consent date)
   */
  generateConsentExpiration(consentDate: Date, yearsValid: number = 1): Date {
    const expirationDate = new Date(consentDate);
    expirationDate.setFullYear(expirationDate.getFullYear() + yearsValid);
    return expirationDate;
  }

  /**
   * Check if automated calling is allowed based on TCPA requirements
   */
  canAutoCall(
    hasWrittenConsent: boolean,
    onNationalDNC: boolean,
    internalDNC: boolean,
    consentExpired: boolean
  ): boolean {
    // TCPA 2025: Automated calls require written consent and not on any DNC list
    return (
      hasWrittenConsent &&
      !onNationalDNC &&
      !internalDNC &&
      !consentExpired
    );
  }
}

export default new TCPACheckerService();
