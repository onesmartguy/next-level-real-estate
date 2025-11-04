import validator from 'validator';
import { logger } from './logger';

/**
 * Email validation result
 */
export interface EmailValidationResult {
  isValid: boolean;
  normalized?: string;
  error?: string;
}

/**
 * Validate email address
 */
export function validateEmail(email: string): EmailValidationResult {
  try {
    const trimmed = email.trim();

    if (!trimmed) {
      return {
        isValid: false,
        error: 'Email is required',
      };
    }

    if (!validator.isEmail(trimmed)) {
      return {
        isValid: false,
        error: 'Invalid email format',
      };
    }

    return {
      isValid: true,
      normalized: normalizeEmail(trimmed),
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Normalize email address (lowercase, trim)
 */
export function normalizeEmail(email: string): string {
  return validator.normalizeEmail(email, {
    all_lowercase: true,
    gmail_remove_dots: false,
    gmail_remove_subaddress: false,
  }) || email.toLowerCase().trim();
}

/**
 * Check if email domain is valid
 */
export function isValidEmailDomain(email: string): boolean {
  try {
    const domain = email.split('@')[1];
    if (!domain) {
      return false;
    }

    return validator.isFQDN(domain);
  } catch (error) {
    logger.debug('Failed to validate email domain', { email, error });
    return false;
  }
}

/**
 * Extract domain from email
 */
export function getEmailDomain(email: string): string | null {
  try {
    const parts = email.split('@');
    if (parts.length !== 2) {
      return null;
    }
    return parts[1].toLowerCase();
  } catch (error) {
    logger.debug('Failed to extract email domain', { email, error });
    return null;
  }
}

/**
 * Check if email is from a disposable/temporary email provider
 */
export function isDisposableEmail(email: string): boolean {
  const domain = getEmailDomain(email);
  if (!domain) {
    return false;
  }

  // Common disposable email domains
  const disposableDomains = [
    'tempmail.com',
    'throwaway.email',
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
    'maildrop.cc',
    'temp-mail.org',
    'fakeinbox.com',
    'trashmail.com',
  ];

  return disposableDomains.includes(domain);
}

/**
 * Mask email for privacy (e.g., j***n@example.com)
 */
export function maskEmail(email: string): string {
  try {
    const [local, domain] = email.split('@');
    if (!local || !domain) {
      return email;
    }

    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }

    const masked = local[0] + '*'.repeat(local.length - 2) + local[local.length - 1];
    return `${masked}@${domain}`;
  } catch (error) {
    logger.debug('Failed to mask email', { email, error });
    return email;
  }
}

/**
 * Compare two emails for equality
 */
export function areEmailsEqual(email1: string, email2: string): boolean {
  const normalized1 = normalizeEmail(email1);
  const normalized2 = normalizeEmail(email2);
  return normalized1 === normalized2;
}
