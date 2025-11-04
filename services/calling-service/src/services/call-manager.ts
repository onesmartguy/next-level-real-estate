import { v4 as uuidv4 } from 'uuid';
import { Logger } from '@next-level-real-estate/shared/utils';
import { Lead, Call } from '@next-level-real-estate/shared/models';
import { CallModel, CallDocument } from '../models/Call';
import { TwilioService } from './twilio-service';
import { ElevenLabsService } from './elevenlabs-service';
import { TCPAValidator } from './tcpa-validator';
import { EventEmitter } from '../utils/event-emitter';
import { config } from '../config';

/**
 * Call initiation request
 */
export interface InitiateCallRequest {
  leadId: string;
  lead: Lead;
  campaignId?: string;
  callType?: 'manual' | 'automated' | 'agent';
  overrideTCPA?: boolean;
}

/**
 * Call result
 */
export interface CallResult {
  callId: string;
  status: 'initiated' | 'failed';
  call?: CallDocument;
  error?: string;
  tcpaViolations?: string[];
}

/**
 * Call Manager Service
 *
 * Orchestrates the entire calling workflow:
 * 1. TCPA validation
 * 2. Lead data retrieval
 * 3. Context building
 * 4. Twilio call initiation
 * 5. ElevenLabs conversation setup
 * 6. Real-time monitoring
 * 7. Post-call processing
 */
export class CallManager {
  private logger: Logger;
  private twilioService: TwilioService;
  private elevenLabsService: ElevenLabsService;
  private tcpaValidator: TCPAValidator;
  private eventEmitter: EventEmitter;

  constructor(
    twilioService?: TwilioService,
    elevenLabsService?: ElevenLabsService,
    tcpaValidator?: TCPAValidator,
    eventEmitter?: EventEmitter
  ) {
    this.logger = new Logger('CallManager');
    this.twilioService = twilioService || new TwilioService();
    this.elevenLabsService = elevenLabsService || new ElevenLabsService();
    this.tcpaValidator = tcpaValidator || new TCPAValidator();
    this.eventEmitter = eventEmitter || EventEmitter.getInstance();
  }

  /**
   * Initiate an outbound call to a lead
   */
  async initiateCall(request: InitiateCallRequest): Promise<CallResult> {
    const {
      leadId,
      lead,
      campaignId,
      callType = 'agent',
      overrideTCPA = false,
    } = request;

    const callId = this.generateCallId();

    try {
      this.logger.info('Initiating call', {
        callId,
        leadId,
        callType,
        phone: lead.contact.phone,
      });

      // Step 1: TCPA Validation
      if (!overrideTCPA) {
        const tcpaResult = await this.tcpaValidator.validateCallPermission(lead, callType);

        if (!tcpaResult.isValid) {
          this.logger.warn('TCPA validation failed', {
            callId,
            leadId,
            violations: tcpaResult.violations,
            reason: tcpaResult.reason,
          });

          await this.eventEmitter.emit('CallFailed', {
            callId,
            leadId,
            reason: 'TCPA_VIOLATION',
            violations: tcpaResult.violations,
          });

          return {
            callId,
            status: 'failed',
            error: tcpaResult.reason,
            tcpaViolations: tcpaResult.violations,
          };
        }

        this.logger.info('TCPA validation passed', { callId, leadId });
      }

      // Step 2: Create call record
      const call = await this.createCallRecord(callId, leadId, lead, callType, campaignId);

      // Step 3: Build conversation context
      const context = this.buildCallContext(lead);

      // Step 4: Create ElevenLabs conversation
      let elevenLabsSession;
      if (callType === 'agent') {
        elevenLabsSession = await this.elevenLabsService.createConversation({
          context,
          firstMessage: this.generateGreeting(lead.contact.firstName),
        });

        // Update call with ElevenLabs details
        call.elevenlabs = {
          conversationId: elevenLabsSession.conversationId,
          agentId: elevenLabsSession.agentId,
          model: config.elevenlabs.model,
        };
        await call.save();
      }

      // Step 5: Initiate Twilio call
      const phoneNumber = this.twilioService.formatPhoneNumber(lead.contact.phone);
      const twilioCall = await this.twilioService.initiateCall({
        to: phoneNumber,
        timeout: config.call.timeout,
        record: config.call.enableRecording,
        statusCallback: `${this.getCallbackBaseUrl()}/webhooks/twilio/status`,
        recordingStatusCallback: `${this.getCallbackBaseUrl()}/webhooks/twilio/recording`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        machineDetection: 'DetectMessageEnd',
        url: `${this.getCallbackBaseUrl()}/webhooks/twilio/connect/${callId}`,
      });

      // Step 6: Update call with Twilio details
      call.twilio = {
        callSid: twilioCall.callSid,
        accountSid: config.twilio.accountSid,
        fromNumber: config.twilio.phoneNumber,
        toNumber: phoneNumber,
        status: twilioCall.status,
        direction: 'outbound',
      };
      call.context = context;
      await call.save();

      // Step 7: Emit call initiated event
      await this.eventEmitter.emit('CallInitiated', {
        callId,
        leadId,
        callSid: twilioCall.callSid,
        conversationId: elevenLabsSession?.conversationId,
        callType,
      });

      this.logger.info('Call initiated successfully', {
        callId,
        leadId,
        callSid: twilioCall.callSid,
        conversationId: elevenLabsSession?.conversationId,
      });

      return {
        callId,
        status: 'initiated',
        call,
      };
    } catch (error) {
      this.logger.error('Failed to initiate call', {
        callId,
        leadId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Emit failure event
      await this.eventEmitter.emit('CallFailed', {
        callId,
        leadId,
        reason: 'INITIATION_FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        callId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle call answered event
   */
  async handleCallAnswered(callSid: string): Promise<void> {
    try {
      const call = await CallModel.findByTwilioCallSid(callSid);
      if (!call) {
        this.logger.warn('Call not found for answered event', { callSid });
        return;
      }

      await call.markAnswered();

      this.logger.info('Call answered', {
        callId: call.callId,
        callSid,
      });

      await this.eventEmitter.emit('CallAnswered', {
        callId: call.callId,
        leadId: call.leadId,
        callSid,
      });
    } catch (error) {
      this.logger.error('Failed to handle call answered', {
        callSid,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle call completed event
   */
  async handleCallCompleted(callSid: string, status: string, duration?: number): Promise<void> {
    try {
      const call = await CallModel.findByTwilioCallSid(callSid);
      if (!call) {
        this.logger.warn('Call not found for completed event', { callSid });
        return;
      }

      await call.markEnded();

      if (call.twilio) {
        call.twilio.status = status;
      }

      if (duration !== undefined) {
        call.duration = duration;
      }

      await call.save();

      this.logger.info('Call completed', {
        callId: call.callId,
        callSid,
        status,
        duration,
      });

      // Start post-call processing
      await this.processCompletedCall(call);

      await this.eventEmitter.emit('CallCompleted', {
        callId: call.callId,
        leadId: call.leadId,
        callSid,
        status,
        duration,
      });
    } catch (error) {
      this.logger.error('Failed to handle call completed', {
        callSid,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Process completed call
   * - Fetch recording
   * - Fetch transcript
   * - Analyze sentiment
   * - Update lead status
   */
  private async processCompletedCall(call: CallDocument): Promise<void> {
    try {
      this.logger.info('Processing completed call', {
        callId: call.callId,
      });

      // Fetch recording from Twilio
      if (config.call.enableRecording && call.twilio?.callSid) {
        const recordingUrl = await this.twilioService.getCallRecording(call.twilio.callSid);
        if (recordingUrl) {
          call.recording = recordingUrl;
        }
      }

      // Fetch transcript from ElevenLabs
      if (config.call.enableTranscription && call.elevenlabs?.conversationId) {
        const elevenLabsTranscript = await this.elevenLabsService.getTranscript(
          call.elevenlabs.conversationId
        );

        if (elevenLabsTranscript) {
          call.transcript = {
            segments: elevenLabsTranscript.segments.map((seg) => ({
              speaker: seg.speaker === 'user' ? 'customer' : 'agent',
              text: seg.text,
              timestamp: seg.timestamp,
              confidence: seg.confidence,
            })),
            fullText: elevenLabsTranscript.segments
              .map((seg) => `${seg.speaker}: ${seg.text}`)
              .join('\n'),
            language: elevenLabsTranscript.language,
            duration: elevenLabsTranscript.duration,
          };

          // Analyze sentiment
          if (call.elevenlabs.conversationId) {
            const sentiment = await this.elevenLabsService.analyzeSentiment(
              call.elevenlabs.conversationId
            );
            call.sentiment = sentiment;
          }
        }
      }

      await call.save();

      this.logger.info('Call processing completed', {
        callId: call.callId,
        hasRecording: !!call.recording,
        hasTranscript: !!call.transcript,
      });

      // Emit event for conversation agent to analyze
      await this.eventEmitter.emit('CallTranscriptReady', {
        callId: call.callId,
        leadId: call.leadId,
        transcript: call.transcript,
        sentiment: call.sentiment,
      });
    } catch (error) {
      this.logger.error('Failed to process completed call', {
        callId: call.callId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Create call record in database
   */
  private async createCallRecord(
    callId: string,
    leadId: string,
    lead: Lead,
    callType: 'manual' | 'automated' | 'agent',
    campaignId?: string
  ): Promise<CallDocument> {
    const call = new CallModel({
      callId,
      leadId,
      contactPhone: lead.contact.phone,
      direction: 'outbound',
      callType,
      initiatedAt: new Date(),
      handledBy: callType === 'agent' ? 'ai' : 'human',
      consentVerified: lead.consent.hasWrittenConsent,
      recordingConsent: config.call.enableRecording,
      tags: campaignId ? [`campaign:${campaignId}`] : [],
    });

    await call.save();

    this.logger.info('Call record created', {
      callId,
      leadId,
    });

    return call;
  }

  /**
   * Build context for AI conversation
   */
  private buildCallContext(lead: Lead): Record<string, any> {
    return this.elevenLabsService.buildConversationContext({
      firstName: lead.contact.firstName,
      lastName: lead.contact.lastName,
      propertyAddress: lead.property?.address,
      propertyType: lead.property?.propertyType,
      estimatedValue: lead.property?.estimatedValue,
      motivationLevel: lead.qualification.motivationLevel,
      sellerSituation: lead.qualification.sellerSituation,
      timeline: lead.qualification.timeline,
    });
  }

  /**
   * Generate greeting message
   */
  private generateGreeting(firstName: string): string {
    return `Hi ${firstName}, this is Sarah from Next Level Real Estate. I'm calling about your property inquiry. Do you have a moment to chat?`;
  }

  /**
   * Generate unique call ID
   */
  private generateCallId(): string {
    return `call_${uuidv4()}`;
  }

  /**
   * Get callback base URL
   */
  private getCallbackBaseUrl(): string {
    // In production, this would come from environment or config
    return process.env.CALLBACK_BASE_URL || `http://localhost:${config.port}`;
  }

  /**
   * Get call by ID
   */
  async getCall(callId: string): Promise<CallDocument | null> {
    return CallModel.findByCallId(callId);
  }

  /**
   * Get calls for a lead
   */
  async getCallsForLead(leadId: string): Promise<CallDocument[]> {
    return CallModel.findByLeadId(leadId);
  }

  /**
   * Get active calls
   */
  async getActiveCalls(): Promise<CallDocument[]> {
    return CallModel.findActiveCalls();
  }
}
