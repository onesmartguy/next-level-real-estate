/**
 * Test Helpers
 *
 * Common utility functions for testing across the platform.
 */

import { setTimeout } from 'timers/promises';

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  options: {
    timeout?: number;
    interval?: number;
    errorMessage?: string;
  } = {}
): Promise<void> {
  const { timeout = 5000, interval = 100, errorMessage = 'Condition not met within timeout' } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await setTimeout(interval);
  }

  throw new Error(errorMessage);
}

/**
 * Wait for a specific duration
 */
export async function wait(ms: number): Promise<void> {
  await setTimeout(ms);
}

/**
 * Retry a function until it succeeds or max attempts reached
 */
export async function retry<T>(
  fn: () => T | Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: boolean;
    onError?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoff = true, onError } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (onError) {
        onError(lastError, attempt);
      }

      if (attempt < maxAttempts) {
        const waitTime = backoff ? delay * attempt : delay;
        await setTimeout(waitTime);
      }
    }
  }

  throw new Error(`Failed after ${maxAttempts} attempts. Last error: ${lastError!.message}`);
}

/**
 * Create a mock request object
 */
export function createMockRequest(overrides: any = {}): any {
  return {
    body: {},
    query: {},
    params: {},
    headers: {},
    method: 'GET',
    url: '/',
    ...overrides,
  };
}

/**
 * Create a mock response object
 */
export function createMockResponse(): any {
  const res: any = {
    statusCode: 200,
    headers: {},
    body: null,
  };

  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res;
  });

  res.json = jest.fn((data: any) => {
    res.body = data;
    return res;
  });

  res.send = jest.fn((data: any) => {
    res.body = data;
    return res;
  });

  res.set = jest.fn((key: string, value: string) => {
    res.headers[key] = value;
    return res;
  });

  res.header = res.set;

  return res;
}

/**
 * Create a mock next function
 */
export function createMockNext(): jest.Mock {
  return jest.fn();
}

/**
 * Simulate async operation
 */
export async function simulateAsync<T>(value: T, delay: number = 10): Promise<T> {
  await setTimeout(delay);
  return value;
}

/**
 * Simulate async error
 */
export async function simulateAsyncError(error: Error, delay: number = 10): Promise<never> {
  await setTimeout(delay);
  throw error;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if two objects are deeply equal
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

/**
 * Generate random string
 */
export function randomString(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate random number in range
 */
export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get random element from array
 */
export function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Shuffle array
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Create a test database name
 */
export function createTestDbName(testName: string): string {
  return `test_${testName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}`;
}

/**
 * Measure execution time
 */
export async function measureTime<T>(fn: () => T | Promise<T>): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  const result = await fn();
  const duration = Date.now() - startTime;
  return { result, duration };
}

/**
 * Assert timing (useful for performance tests)
 */
export function assertTiming(actual: number, expected: number, tolerance: number = 100): void {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(
      `Timing assertion failed: expected ${expected}ms (±${tolerance}ms), got ${actual}ms (diff: ${diff}ms)`
    );
  }
}

/**
 * Create a spy that tracks calls
 */
export function createSpy<T extends (...args: any[]) => any>(): jest.Mock<ReturnType<T>, Parameters<T>> {
  return jest.fn();
}

/**
 * Capture console output
 */
export class ConsoleCapture {
  private originalConsole: {
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
    info: typeof console.info;
  };
  private logs: string[] = [];
  private warnings: string[] = [];
  private errors: string[] = [];
  private infos: string[] = [];

  constructor() {
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
    };
  }

  start(): void {
    console.log = (...args: any[]) => {
      this.logs.push(args.join(' '));
    };
    console.warn = (...args: any[]) => {
      this.warnings.push(args.join(' '));
    };
    console.error = (...args: any[]) => {
      this.errors.push(args.join(' '));
    };
    console.info = (...args: any[]) => {
      this.infos.push(args.join(' '));
    };
  }

  stop(): void {
    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.info = this.originalConsole.info;
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  getWarnings(): string[] {
    return [...this.warnings];
  }

  getErrors(): string[] {
    return [...this.errors];
  }

  getInfos(): string[] {
    return [...this.infos];
  }

  clear(): void {
    this.logs = [];
    this.warnings = [];
    this.errors = [];
    this.infos = [];
  }
}

/**
 * Capture console output within a function
 */
export async function withConsoleCapture<T>(
  fn: () => T | Promise<T>
): Promise<{
  result: T;
  logs: string[];
  warnings: string[];
  errors: string[];
  infos: string[];
}> {
  const capture = new ConsoleCapture();
  capture.start();

  try {
    const result = await fn();
    return {
      result,
      logs: capture.getLogs(),
      warnings: capture.getWarnings(),
      errors: capture.getErrors(),
      infos: capture.getInfos(),
    };
  } finally {
    capture.stop();
  }
}

/**
 * Mock environment variables
 */
export function withEnv(env: Record<string, string>, fn: () => void | Promise<void>): () => Promise<void> {
  return async () => {
    const originalEnv = { ...process.env };

    // Set test env vars
    Object.entries(env).forEach(([key, value]) => {
      process.env[key] = value;
    });

    try {
      await fn();
    } finally {
      // Restore original env
      process.env = originalEnv;
    }
  };
}

/**
 * Create a test timeout
 */
export function createTimeout(ms: number, message?: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(message || `Test timeout after ${ms}ms`));
    }, ms);
  });
}

/**
 * Race with timeout
 */
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message?: string): Promise<T> {
  return Promise.race([promise, createTimeout(timeoutMs, message)]);
}

/**
 * Assert that a promise rejects
 */
export async function assertRejects(
  promise: Promise<any>,
  expectedError?: string | RegExp | Error
): Promise<void> {
  try {
    await promise;
    throw new Error('Expected promise to reject, but it resolved');
  } catch (error) {
    if (expectedError) {
      if (typeof expectedError === 'string') {
        expect((error as Error).message).toContain(expectedError);
      } else if (expectedError instanceof RegExp) {
        expect((error as Error).message).toMatch(expectedError);
      } else if (expectedError instanceof Error) {
        expect((error as Error).message).toBe(expectedError.message);
      }
    }
  }
}

/**
 * Assert that a promise resolves
 */
export async function assertResolves<T>(promise: Promise<T>): Promise<T> {
  return promise;
}

/**
 * Create a controlled promise (for testing async flows)
 */
export class ControlledPromise<T> {
  public promise: Promise<T>;
  public resolve!: (value: T) => void;
  public reject!: (error: Error) => void;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

/**
 * Create multiple controlled promises
 */
export function createControlledPromises<T>(count: number): ControlledPromise<T>[] {
  return Array.from({ length: count }, () => new ControlledPromise<T>());
}
