/**
 * Twilio + ElevenLabs Integration with Variable Injection
 *
 * Handles outbound calls using Twilio Voice API with ElevenLabs ConversationRelay
 * and dynamic variable injection for personalized conversations.
 */

import twilio from 'twilio';
import {
  variableInjectionService,
  LeadData,
  DEFAULT_FIRST_MESSAGE_TEMPLATE,
  DEFAULT_SYSTEM_PROMPT_TEMPLATE
} from '../variable-injection';

export interface TwilioCallConfig {
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  elevenlabsAgentId: string;
  webhookBaseUrl: string; // Your server's base URL for webhooks
}

export interface CallResult {
  success: boolean;
  call_sid?: string;
  error?: string;
  warnings?: string[];
}

/**
 * Twilio + ElevenLabs Calling Service
 */
export class TwilioElevenLabsService {
  private twilioClient: twilio.Twilio;
  private config: TwilioCallConfig;

  constructor(config: TwilioCallConfig) {
    this.config = config;
    this.twilioClient = twilio(config.twilioAccountSid, config.twilioAuthToken);
  }

  /**
   * Initiate an outbound call with dynamic variable injection
   */
  public async initiateCall(leadData: LeadData): Promise<CallResult> {
    try {
      // Step 1: Inject variables into templates
      const injectionResult = variableInjectionService.injectVariables(
        DEFAULT_FIRST_MESSAGE_TEMPLATE,
        DEFAULT_SYSTEM_PROMPT_TEMPLATE,
        leadData
      );

      // Check for compliance errors
      if (!injectionResult.success) {
        return {
          success: false,
          error: `Variable injection failed: ${injectionResult.errors.join(', ')}`
        };
      }

      // Step 2: Create TwiML with ElevenLabs ConversationRelay
      const twiml = this.generateTwiML(
        injectionResult.first_message,
        injectionResult.system_prompt,
        leadData
      );

      // Step 3: Make the call via Twilio
      const call = await this.twilioClient.calls.create({
        to: leadData.phone_number,
        from: this.config.twilioPhoneNumber,
        twiml: twiml,
        statusCallback: `${this.config.webhookBaseUrl}/webhooks/twilio/call-status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST',
        recordingStatusCallback: `${this.config.webhookBaseUrl}/webhooks/twilio/recording-status`,
        recordingStatusCallbackMethod: 'POST'
      });

      return {
        success: true,
        call_sid: call.sid,
        warnings: injectionResult.warnings
      };

    } catch (error: any) {
      console.error('Twilio call initiation failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown error during call initiation'
      };
    }
  }

  /**
   * Generate TwiML with ElevenLabs ConversationRelay
   */
  private generateTwiML(
    firstMessage: string,
    systemPrompt: string,
    leadData: LeadData
  ): string {
    // ElevenLabs ConversationRelay configuration
    const conversationConfig = {
      agent_id: this.config.elevenlabsAgentId,
      first_message: firstMessage,
      system_prompt: systemPrompt,
      // Additional context for real-time injection
      context: {
        lead_id: leadData.lead_id,
        lead_source: leadData.lead_source,
        motivation_level: leadData.motivation_level,
        situation_type: leadData.situation_type,
        call_timestamp: new Date().toISOString()
      }
    };

    // Build TwiML
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay url="wss://api.elevenlabs.io/v1/convai/conversation" dtmfDetection="true">
      <Parameter name="agent_id" value="${conversationConfig.agent_id}" />
      <Parameter name="authorization" value="Bearer ${process.env.ELEVENLABS_API_KEY}" />
      <Parameter name="first_message" value="${this.escapeXml(conversationConfig.first_message)}" />
      <Parameter name="override_agent_prompt" value="${this.escapeXml(conversationConfig.system_prompt)}" />
      <Parameter name="context" value="${this.escapeXml(JSON.stringify(conversationConfig.context))}" />
    </ConversationRelay>
  </Connect>
  <Say voice="Polly.Joanna">The call has ended. Thank you.</Say>
</Response>`;

    return twiml;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Handle Twilio call status webhook
   */
  public handleCallStatusWebhook(webhookData: any): void {
    const {
      CallSid,
      CallStatus,
      CallDuration,
      From,
      To,
      Direction
    } = webhookData;

    console.log(`Call ${CallSid} status: ${CallStatus}`, {
      duration: CallDuration,
      from: From,
      to: To,
      direction: Direction
    });

    // Update database with call status
    // TODO: Implement database update logic here
    // Example: await db.calls.update({ call_sid: CallSid }, { status: CallStatus, duration: CallDuration });
  }

  /**
   * Handle Twilio recording status webhook
   */
  public handleRecordingStatusWebhook(webhookData: any): void {
    const {
      CallSid,
      RecordingSid,
      RecordingUrl,
      RecordingStatus,
      RecordingDuration
    } = webhookData;

    console.log(`Recording ${RecordingSid} status: ${RecordingStatus}`, {
      call_sid: CallSid,
      duration: RecordingDuration,
      url: RecordingUrl
    });

    // Save recording URL to database
    // TODO: Implement database update logic
    // Example: await db.calls.update({ call_sid: CallSid }, { recording_url: RecordingUrl });
  }
}

/**
 * Example usage
 */
export async function exampleTwilioUsage() {
  // Initialize service
  const service = new TwilioElevenLabsService({
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID!,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN!,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER!,
    elevenlabsAgentId: process.env.ELEVENLABS_AGENT_ID!,
    webhookBaseUrl: process.env.WEBHOOK_BASE_URL!
  });

  // Lead data from your CRM/database
  const leadData: LeadData = {
    lead_id: 'lead_12345',
    homeowner_first_name: 'Jeff',
    homeowner_last_name: 'Price',
    phone_number: '+19725551234',
    email: 'jeff@example.com',

    property_address_street: '829 Lake Bluff Drive',
    property_city: 'Flower Mound',
    property_state: 'TX',
    property_zip: '75022',

    estimated_value: '$450,000',
    property_size: '3,200',
    bedrooms: 4,
    bathrooms: 3,
    year_built: 2010,
    years_owned: '12',
    property_type: 'single_family',

    lead_source: 'google_ads',
    motivation_level: 'medium',
    situation_type: 'downsizing',

    has_consent: true,
    on_dnc_list: false,
    consent_date: new Date('2024-10-15')
  };

  // Make the call
  const result = await service.initiateCall(leadData);

  if (result.success) {
    console.log(`Call initiated successfully! Call SID: ${result.call_sid}`);
    if (result.warnings && result.warnings.length > 0) {
      console.warn('Warnings:', result.warnings);
    }
  } else {
    console.error(`Call failed: ${result.error}`);
  }
}
