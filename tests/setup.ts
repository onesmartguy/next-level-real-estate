/**
 * Jest Setup File
 *
 * Runs after the test framework is installed but before test suites execute.
 * Used for configuring test environment and extending Jest matchers.
 */

import { TextEncoder, TextDecoder } from 'util';

// Global polyfills
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Extend Jest matchers with custom assertions
expect.extend({
  /**
   * Check if a value is a valid UUID
   */
  toBeValidUuid(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },

  /**
   * Check if a value is a valid phone number
   */
  toBeValidPhoneNumber(received: string) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const pass = phoneRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid phone number`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid phone number`,
        pass: false,
      };
    }
  },

  /**
   * Check if a value is a valid ISO 8601 date string
   */
  toBeValidISODate(received: string) {
    const date = new Date(received);
    const pass = !isNaN(date.getTime()) && received === date.toISOString();

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ISO date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ISO date`,
        pass: false,
      };
    }
  },

  /**
   * Check if an object has TCPA consent fields
   */
  toHaveTCPAConsent(received: any) {
    const hasConsent = received.consent &&
      typeof received.consent.hasWrittenConsent === 'boolean' &&
      received.consent.consentDate &&
      received.consent.consentMethod &&
      received.consent.consentSource;

    if (hasConsent) {
      return {
        message: () => `expected object not to have TCPA consent fields`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected object to have TCPA consent fields (hasWrittenConsent, consentDate, consentMethod, consentSource)`,
        pass: false,
      };
    }
  },
});

// Extend Jest matchers type definitions
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUuid(): R;
      toBeValidPhoneNumber(): R;
      toBeValidISODate(): R;
      toHaveTCPAConsent(): R;
    }
  }
}

// Global test timeout warning
const originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
beforeAll(() => {
  if (process.env.CI) {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000; // 1 minute in CI
  }
});

afterAll(() => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
});

// Suppress console warnings during tests unless explicitly needed
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  console.warn = jest.fn((...args) => {
    if (process.env.VERBOSE_TESTS === 'true') {
      originalConsoleWarn(...args);
    }
  });

  console.error = jest.fn((...args) => {
    // Always show errors unless they're expected
    if (!args[0]?.toString().includes('Expected error')) {
      originalConsoleError(...args);
    }
  });
});

afterAll(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});
