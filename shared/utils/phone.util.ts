import { parsePhoneNumber, CountryCode, PhoneNumber } from 'libphonenumber-js';
import { logger } from './logger';

/**
 * Phone number validation result
 */
export interface PhoneValidationResult {
  isValid: boolean;
  normalized?: string;
  country?: string;
  type?: string;
  error?: string;
}

/**
 * Normalize phone number to E.164 format
 * E.164: +[country code][subscriber number] (e.g., +14155552671)
 */
export function normalizePhoneNumber(
  phone: string,
  defaultCountry: CountryCode = 'US'
): string | null {
  try {
    const phoneNumber = parsePhoneNumber(phone, defaultCountry);

    if (!phoneNumber || !phoneNumber.isValid()) {
      return null;
    }

    return phoneNumber.format('E.164');
  } catch (error) {
    logger.debug('Failed to normalize phone number', { phone, error });
    return null;
  }
}

/**
 * Validate phone number
 */
export function validatePhoneNumber(
  phone: string,
  defaultCountry: CountryCode = 'US'
): PhoneValidationResult {
  try {
    const phoneNumber = parsePhoneNumber(phone, defaultCountry);

    if (!phoneNumber) {
      return {
        isValid: false,
        error: 'Invalid phone number format',
      };
    }

    if (!phoneNumber.isValid()) {
      return {
        isValid: false,
        error: 'Phone number is not valid',
      };
    }

    return {
      isValid: true,
      normalized: phoneNumber.format('E.164'),
      country: phoneNumber.country,
      type: phoneNumber.getType(),
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(
  phone: string,
  format: 'NATIONAL' | 'INTERNATIONAL' | 'E.164' | 'RFC3966' = 'NATIONAL',
  defaultCountry: CountryCode = 'US'
): string | null {
  try {
    const phoneNumber = parsePhoneNumber(phone, defaultCountry);

    if (!phoneNumber || !phoneNumber.isValid()) {
      return null;
    }

    return phoneNumber.format(format);
  } catch (error) {
    logger.debug('Failed to format phone number', { phone, format, error });
    return null;
  }
}

/**
 * Extract country code from phone number
 */
export function getCountryCode(
  phone: string,
  defaultCountry: CountryCode = 'US'
): string | null {
  try {
    const phoneNumber = parsePhoneNumber(phone, defaultCountry);

    if (!phoneNumber || !phoneNumber.isValid()) {
      return null;
    }

    return phoneNumber.country || null;
  } catch (error) {
    logger.debug('Failed to get country code', { phone, error });
    return null;
  }
}

/**
 * Check if phone number is mobile
 */
export function isMobileNumber(
  phone: string,
  defaultCountry: CountryCode = 'US'
): boolean {
  try {
    const phoneNumber = parsePhoneNumber(phone, defaultCountry);

    if (!phoneNumber || !phoneNumber.isValid()) {
      return false;
    }

    const type = phoneNumber.getType();
    return type === 'MOBILE' || type === 'FIXED_LINE_OR_MOBILE';
  } catch (error) {
    logger.debug('Failed to check if mobile number', { phone, error });
    return false;
  }
}

/**
 * Compare two phone numbers for equality
 */
export function arePhoneNumbersEqual(
  phone1: string,
  phone2: string,
  defaultCountry: CountryCode = 'US'
): boolean {
  const normalized1 = normalizePhoneNumber(phone1, defaultCountry);
  const normalized2 = normalizePhoneNumber(phone2, defaultCountry);

  if (!normalized1 || !normalized2) {
    return false;
  }

  return normalized1 === normalized2;
}

/**
 * Sanitize phone number (remove all non-digit characters)
 */
export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}
