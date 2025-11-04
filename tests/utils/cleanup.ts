/**
 * Test Cleanup Utilities
 *
 * Helpers for cleaning up test data and resources.
 */

/**
 * Database cleanup helper
 */
export class DatabaseCleanup {
  private collections: Map<string, Set<string>> = new Map();

  /**
   * Track a record for cleanup
   */
  track(collection: string, id: string): void {
    if (!this.collections.has(collection)) {
      this.collections.set(collection, new Set());
    }
    this.collections.get(collection)!.add(id);
  }

  /**
   * Track multiple records for cleanup
   */
  trackMany(collection: string, ids: string[]): void {
    ids.forEach((id) => this.track(collection, id));
  }

  /**
   * Get tracked IDs for a collection
   */
  getTracked(collection: string): string[] {
    return Array.from(this.collections.get(collection) || []);
  }

  /**
   * Clear tracking for a collection
   */
  clearTracking(collection: string): void {
    this.collections.delete(collection);
  }

  /**
   * Clear all tracking
   */
  clearAll(): void {
    this.collections.clear();
  }

  /**
   * Cleanup all tracked records (requires DB connection)
   */
  async cleanup(db: any): Promise<void> {
    for (const [collection, ids] of this.collections.entries()) {
      try {
        await db.collection(collection).deleteMany({
          _id: { $in: Array.from(ids) },
        });
      } catch (error) {
        console.error(`Failed to cleanup collection ${collection}:`, error);
      }
    }
    this.clearAll();
  }
}

/**
 * Mock service cleanup helper
 */
export class MockServiceCleanup {
  private mocks: Array<{ name: string; reset: () => void }> = [];

  /**
   * Register a mock service for cleanup
   */
  register(name: string, resetFn: () => void): void {
    this.mocks.push({ name, reset: resetFn });
  }

  /**
   * Reset all registered mocks
   */
  resetAll(): void {
    this.mocks.forEach((mock) => {
      try {
        mock.reset();
      } catch (error) {
        console.error(`Failed to reset mock ${mock.name}:`, error);
      }
    });
  }

  /**
   * Clear registration
   */
  clear(): void {
    this.mocks = [];
  }
}

/**
 * File cleanup helper
 */
export class FileCleanup {
  private files: Set<string> = new Set();
  private directories: Set<string> = new Set();

  /**
   * Track a file for cleanup
   */
  trackFile(path: string): void {
    this.files.add(path);
  }

  /**
   * Track a directory for cleanup
   */
  trackDirectory(path: string): void {
    this.directories.add(path);
  }

  /**
   * Cleanup all tracked files and directories
   */
  async cleanup(): Promise<void> {
    const fs = await import('fs/promises');

    // Delete files
    for (const file of this.files) {
      try {
        await fs.unlink(file);
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          console.error(`Failed to delete file ${file}:`, error);
        }
      }
    }

    // Delete directories
    for (const dir of this.directories) {
      try {
        await fs.rm(dir, { recursive: true, force: true });
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          console.error(`Failed to delete directory ${dir}:`, error);
        }
      }
    }

    this.files.clear();
    this.directories.clear();
  }
}

/**
 * Event cleanup helper (for Kafka events)
 */
export class EventCleanup {
  private events: Map<string, any[]> = new Map();

  /**
   * Track an event for cleanup
   */
  track(topic: string, event: any): void {
    if (!this.events.has(topic)) {
      this.events.set(topic, []);
    }
    this.events.get(topic)!.push(event);
  }

  /**
   * Get tracked events for a topic
   */
  getTracked(topic: string): any[] {
    return this.events.get(topic) || [];
  }

  /**
   * Clear tracking for a topic
   */
  clearTracking(topic: string): void {
    this.events.delete(topic);
  }

  /**
   * Clear all tracking
   */
  clearAll(): void {
    this.events.clear();
  }
}

/**
 * Master cleanup coordinator
 */
export class CleanupCoordinator {
  public database: DatabaseCleanup;
  public mocks: MockServiceCleanup;
  public files: FileCleanup;
  public events: EventCleanup;

  constructor() {
    this.database = new DatabaseCleanup();
    this.mocks = new MockServiceCleanup();
    this.files = new FileCleanup();
    this.events = new EventCleanup();
  }

  /**
   * Cleanup all resources
   */
  async cleanupAll(db?: any): Promise<void> {
    // Cleanup in reverse order of creation
    this.events.clearAll();
    this.mocks.resetAll();
    await this.files.cleanup();

    if (db) {
      await this.database.cleanup(db);
    }
  }

  /**
   * Reset all tracking
   */
  reset(): void {
    this.database.clearAll();
    this.mocks.clear();
    this.files = new FileCleanup();
    this.events.clearAll();
  }
}

/**
 * Create cleanup coordinator
 */
export function createCleanupCoordinator(): CleanupCoordinator {
  return new CleanupCoordinator();
}

/**
 * Setup cleanup hooks for Jest
 */
export function setupCleanupHooks(coordinator: CleanupCoordinator, db?: any): void {
  afterEach(async () => {
    await coordinator.cleanupAll(db);
  });

  afterAll(async () => {
    coordinator.reset();
  });
}

/**
 * Wait for cleanup to complete
 */
export async function waitForCleanup(ms: number = 100): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Cleanup with retry
 */
export async function cleanupWithRetry(
  cleanupFn: () => Promise<void>,
  maxAttempts: number = 3
): Promise<void> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await cleanupFn();
      return;
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  console.error(`Cleanup failed after ${maxAttempts} attempts:`, lastError);
}

/**
 * Ensure cleanup runs even on test failure
 */
export function withCleanup<T>(
  setup: () => T | Promise<T>,
  cleanup: (resource: T) => void | Promise<void>
): () => Promise<void> {
  return async () => {
    let resource: T | undefined;
    try {
      resource = await setup();
      // Test code runs here (caller's responsibility)
    } finally {
      if (resource) {
        await cleanup(resource);
      }
    }
  };
}
