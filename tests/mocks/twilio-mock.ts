/**
 * Twilio API Mock
 *
 * Provides mock implementations of Twilio Voice API for testing.
 * Simulates call creation, status updates, and webhook events.
 */

export interface MockCall {
  sid: string;
  from: string;
  to: string;
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer';
  direction: 'inbound' | 'outbound-api';
  duration?: number;
  startTime?: Date;
  endTime?: Date;
  price?: string;
  priceUnit?: string;
}

export interface MockCallOptions {
  to: string;
  from: string;
  url?: string;
  statusCallback?: string;
  statusCallbackEvent?: string[];
  timeout?: number;
  record?: boolean;
}

/**
 * Mock Twilio Client
 */
export class TwilioMock {
  private calls: Map<string, MockCall> = new Map();
  private callSidCounter = 1;

  /**
   * Create a new call
   */
  async createCall(options: MockCallOptions): Promise<MockCall> {
    const callSid = `CA${this.generateSid()}`;

    const call: MockCall = {
      sid: callSid,
      from: options.from,
      to: options.to,
      status: 'queued',
      direction: 'outbound-api',
      startTime: new Date(),
    };

    this.calls.set(callSid, call);

    // Simulate call progression
    setTimeout(() => this.updateCallStatus(callSid, 'ringing'), 100);
    setTimeout(() => this.updateCallStatus(callSid, 'in-progress'), 500);

    return call;
  }

  /**
   * Get call by SID
   */
  async getCall(callSid: string): Promise<MockCall | null> {
    return this.calls.get(callSid) || null;
  }

  /**
   * Update call (e.g., hangup)
   */
  async updateCall(callSid: string, updates: Partial<MockCall>): Promise<MockCall | null> {
    const call = this.calls.get(callSid);
    if (!call) return null;

    Object.assign(call, updates);
    this.calls.set(callSid, call);

    return call;
  }

  /**
   * List calls with filters
   */
  async listCalls(filters?: {
    to?: string;
    from?: string;
    status?: MockCall['status'];
  }): Promise<MockCall[]> {
    let calls = Array.from(this.calls.values());

    if (filters?.to) {
      calls = calls.filter((c) => c.to === filters.to);
    }
    if (filters?.from) {
      calls = calls.filter((c) => c.from === filters.from);
    }
    if (filters?.status) {
      calls = calls.filter((c) => c.status === filters.status);
    }

    return calls;
  }

  /**
   * Simulate call completion
   */
  async completeCall(callSid: string, duration: number = 60): Promise<MockCall | null> {
    const call = this.calls.get(callSid);
    if (!call) return null;

    call.status = 'completed';
    call.duration = duration;
    call.endTime = new Date();
    call.price = '-0.0085';
    call.priceUnit = 'USD';

    this.calls.set(callSid, call);

    return call;
  }

  /**
   * Simulate call failure
   */
  async failCall(callSid: string, reason: 'busy' | 'no-answer' | 'failed' = 'failed'): Promise<MockCall | null> {
    const call = this.calls.get(callSid);
    if (!call) return null;

    call.status = reason;
    call.endTime = new Date();

    this.calls.set(callSid, call);

    return call;
  }

  /**
   * Update call status (internal method)
   */
  private updateCallStatus(callSid: string, status: MockCall['status']): void {
    const call = this.calls.get(callSid);
    if (call) {
      call.status = status;
      this.calls.set(callSid, call);
    }
  }

  /**
   * Generate mock SID
   */
  private generateSid(): string {
    const chars = '0123456789abcdef';
    let sid = '';
    for (let i = 0; i < 32; i++) {
      sid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return sid;
  }

  /**
   * Reset all calls (for test cleanup)
   */
  reset(): void {
    this.calls.clear();
    this.callSidCounter = 1;
  }

  /**
   * Get all calls (for testing assertions)
   */
  getAllCalls(): MockCall[] {
    return Array.from(this.calls.values());
  }
}

/**
 * Mock TwiML Response
 */
export class TwiMLMock {
  private instructions: any[] = [];

  say(options: { voice?: string; language?: string }, message: string): this {
    this.instructions.push({ type: 'Say', voice: options.voice, language: options.language, message });
    return this;
  }

  play(url: string): this {
    this.instructions.push({ type: 'Play', url });
    return this;
  }

  dial(number: string): this {
    this.instructions.push({ type: 'Dial', number });
    return this;
  }

  hangup(): this {
    this.instructions.push({ type: 'Hangup' });
    return this;
  }

  record(options?: { transcribe?: boolean; transcribeCallback?: string }): this {
    this.instructions.push({ type: 'Record', ...options });
    return this;
  }

  toString(): string {
    return JSON.stringify(this.instructions);
  }

  getInstructions(): any[] {
    return this.instructions;
  }
}

/**
 * Create mock Twilio client instance
 */
export function createTwilioMock(): TwilioMock {
  return new TwilioMock();
}

/**
 * Mock webhook payload generator
 */
export function generateTwilioWebhook(call: MockCall, event: string = 'completed'): Record<string, string> {
  return {
    CallSid: call.sid,
    From: call.from,
    To: call.to,
    CallStatus: call.status,
    Direction: call.direction,
    CallDuration: call.duration?.toString() || '0',
    Timestamp: new Date().toISOString(),
    AccountSid: 'AC' + '0'.repeat(32),
  };
}

// Export singleton instance for tests
export const twilioMock = createTwilioMock();
