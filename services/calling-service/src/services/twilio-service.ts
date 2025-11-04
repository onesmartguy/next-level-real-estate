import twilio from 'twilio';
import { Logger } from '@next-level-real-estate/shared/utils';
import { config } from '../config';

const { Twilio } = twilio;

/**
 * Twilio call options
 */
export interface TwilioCallOptions {
  to: string;
  from?: string;
  timeout?: number;
  record?: boolean;
  recordingStatusCallback?: string;
  statusCallback?: string;
  statusCallbackEvent?: string[];
  machineDetection?: 'Enable' | 'DetectMessageEnd';
  twiml?: string;
  url?: string;
}

/**
 * Call status from Twilio
 */
export interface TwilioCallStatus {
  callSid: string;
  status: string;
  direction: 'inbound' | 'outbound';
  from: string;
  to: string;
  duration?: string;
  price?: string;
  priceUnit?: string;
}

/**
 * Twilio Service
 *
 * Manages Twilio Voice API integration for outbound and inbound calls
 */
export class TwilioService {
  private client: twilio.Twilio | null = null;
  private logger: Logger;
  private isConfigured: boolean;

  constructor() {
    this.logger = new Logger('TwilioService');

    // Check if Twilio credentials are configured (not placeholders)
    this.isConfigured =
      config.twilio.accountSid &&
      config.twilio.accountSid.startsWith('AC') &&
      config.twilio.authToken &&
      config.twilio.authToken !== 'your_twilio_auth_token';

    if (this.isConfigured) {
      // Initialize Twilio client
      this.client = new Twilio(
        config.twilio.accountSid,
        config.twilio.authToken
      );

      this.logger.info('Twilio service initialized', {
        accountSid: config.twilio.accountSid.substring(0, 10) + '...',
        phoneNumber: config.twilio.phoneNumber,
      });
    } else {
      this.logger.warn('Twilio credentials not configured - service will operate in mock mode');
    }
  }

  private ensureConfigured(): void {
    if (!this.client) {
      throw new Error('Twilio is not configured. Please set valid TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env file');
    }
  }

  /**
   * Initiate an outbound call
   */
  async initiateCall(options: TwilioCallOptions): Promise<TwilioCallStatus> {
    this.ensureConfigured();

    try {
      const {
        to,
        from = config.twilio.phoneNumber,
        timeout = config.call.timeout,
        record = config.call.enableRecording,
        recordingStatusCallback,
        statusCallback,
        statusCallbackEvent = ['initiated', 'ringing', 'answered', 'completed'],
        machineDetection,
        twiml,
        url,
      } = options;

      this.logger.info('Initiating Twilio call', {
        to,
        from,
        timeout,
        record,
      });

      // Create call
      const call = await this.client!.calls.create({
        to,
        from,
        timeout,
        record,
        recordingStatusCallback,
        statusCallback,
        statusCallbackEvent,
        machineDetection,
        ...(twiml ? { twiml } : {}),
        ...(url ? { url } : {}),
      });

      this.logger.info('Twilio call initiated', {
        callSid: call.sid,
        status: call.status,
        to,
        from,
      });

      return {
        callSid: call.sid,
        status: call.status,
        direction: 'outbound',
        from,
        to,
      };
    } catch (error) {
      this.logger.error('Failed to initiate Twilio call', {
        error: error instanceof Error ? error.message : 'Unknown error',
        to: options.to,
      });
      throw error;
    }
  }

  /**
   * Update an active call
   */
  async updateCall(
    callSid: string,
    updates: { url?: string; twiml?: string; status?: 'completed' | 'canceled' }
  ): Promise<void> {
    this.ensureConfigured();

    try {
      this.logger.info('Updating Twilio call', {
        callSid,
        updates,
      });

      await this.client!.calls(callSid).update(updates);

      this.logger.info('Twilio call updated', { callSid });
    } catch (error) {
      this.logger.error('Failed to update Twilio call', {
        error: error instanceof Error ? error.message : 'Unknown error',
        callSid,
      });
      throw error;
    }
  }

  /**
   * Get call status
   */
  async getCallStatus(callSid: string): Promise<TwilioCallStatus> {
    this.ensureConfigured();

    try {
      const call = await this.client!.calls(callSid).fetch();

      return {
        callSid: call.sid,
        status: call.status,
        direction: call.direction as 'inbound' | 'outbound',
        from: call.from,
        to: call.to,
        duration: call.duration || undefined,
        price: call.price || undefined,
        priceUnit: call.priceUnit || undefined,
      };
    } catch (error) {
      this.logger.error('Failed to get call status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        callSid,
      });
      throw error;
    }
  }

  /**
   * Get call recording
   */
  async getCallRecording(callSid: string): Promise<string | null> {
    this.ensureConfigured();

    try {
      const recordings = await this.client!.recordings.list({
        callSid,
        limit: 1,
      });

      if (recordings.length === 0) {
        return null;
      }

      const recording = recordings[0];
      const recordingUrl = `https://api.twilio.com${recording.uri.replace('.json', '.mp3')}`;

      return recordingUrl;
    } catch (error) {
      this.logger.error('Failed to get call recording', {
        error: error instanceof Error ? error.message : 'Unknown error',
        callSid,
      });
      throw error;
    }
  }

  /**
   * Get call transcription
   */
  async getCallTranscription(callSid: string): Promise<string | null> {
    this.ensureConfigured();

    try {
      const recordings = await this.client!.recordings.list({
        callSid,
        limit: 1,
      });

      if (recordings.length === 0) {
        return null;
      }

      const recording = recordings[0];
      const transcriptions = await this.client!
        .transcriptions
        .list({ recordingSid: recording.sid, limit: 1 });

      if (transcriptions.length === 0) {
        return null;
      }

      return transcriptions[0].transcriptionText;
    } catch (error) {
      this.logger.error('Failed to get call transcription', {
        error: error instanceof Error ? error.message : 'Unknown error',
        callSid,
      });
      return null;
    }
  }

  /**
   * Generate TwiML for ElevenLabs ConversationRelay
   */
  generateElevenLabsConversationTwiML(conversationId: string): string {
    // This will be implemented when ElevenLabs integration is complete
    // For now, return a basic TwiML
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Please wait while we connect your call.</Say>
  <Pause length="1"/>
</Response>`;
  }

  /**
   * Generate TwiML for basic greeting
   */
  generateGreetingTwiML(message: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${this.escapeXml(message)}</Say>
</Response>`;
  }

  /**
   * Generate TwiML for voicemail
   */
  generateVoicemailTwiML(message: string, recordingUrl: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${this.escapeXml(message)}</Say>
  <Record maxLength="120" action="${recordingUrl}" transcribe="true" />
</Response>`;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    // E.164 format: +[country code][number]
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Format phone number to E.164
   */
  formatPhoneNumber(phoneNumber: string, defaultCountryCode = '+1'): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');

    // If it starts with 1, assume it's US/Canada
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }

    // If it's 10 digits, add default country code
    if (digits.length === 10) {
      return `${defaultCountryCode}${digits}`;
    }

    // If it already has a +, return as is
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }

    // Otherwise, add + to the beginning
    return `+${digits}`;
  }

  /**
   * Test Twilio credentials
   */
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      this.logger.warn('Twilio not configured, skipping connection test');
      return false;
    }

    try {
      // Fetch account details to verify credentials
      const account = await this.client!.api.accounts(config.twilio.accountSid).fetch();

      this.logger.info('Twilio connection test successful', {
        accountSid: account.sid,
        status: account.status,
      });

      return true;
    } catch (error) {
      this.logger.error('Twilio connection test failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}
