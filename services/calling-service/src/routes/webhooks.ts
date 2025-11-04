import { Router, Request, Response } from 'express';
import { Logger } from '@next-level-real-estate/shared/utils';
import { CallManager } from '../services/call-manager';
import { TwilioService } from '../services/twilio-service';

const router = Router();
const logger = new Logger('WebhooksRoutes');
const callManager = new CallManager();
const twilioService = new TwilioService();

/**
 * POST /webhooks/twilio/status
 * Webhook for Twilio call status updates
 */
router.post('/twilio/status', async (req: Request, res: Response) => {
  try {
    const {
      CallSid,
      CallStatus,
      CallDuration,
      From,
      To,
    } = req.body;

    logger.info('Received Twilio status webhook', {
      callSid: CallSid,
      status: CallStatus,
      duration: CallDuration,
    });

    // Handle different status events
    switch (CallStatus) {
      case 'initiated':
      case 'queued':
        logger.info('Call initiated/queued', { callSid: CallSid });
        break;

      case 'ringing':
        logger.info('Call ringing', { callSid: CallSid });
        break;

      case 'in-progress':
        await callManager.handleCallAnswered(CallSid);
        break;

      case 'completed':
      case 'busy':
      case 'failed':
      case 'no-answer':
      case 'canceled':
        await callManager.handleCallCompleted(
          CallSid,
          CallStatus,
          CallDuration ? parseInt(CallDuration, 10) : undefined
        );
        break;

      default:
        logger.warn('Unknown call status', {
          callSid: CallSid,
          status: CallStatus,
        });
    }

    // Respond to Twilio
    return res.status(200).send('OK');
  } catch (error) {
    logger.error('Error handling Twilio status webhook', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
    });
    // Still return 200 to Twilio to prevent retries
    return res.status(200).send('OK');
  }
});

/**
 * POST /webhooks/twilio/recording
 * Webhook for Twilio recording status updates
 */
router.post('/twilio/recording', async (req: Request, res: Response) => {
  try {
    const {
      CallSid,
      RecordingSid,
      RecordingUrl,
      RecordingStatus,
      RecordingDuration,
    } = req.body;

    logger.info('Received Twilio recording webhook', {
      callSid: CallSid,
      recordingSid: RecordingSid,
      status: RecordingStatus,
      duration: RecordingDuration,
    });

    // Recording is handled in post-call processing
    // This webhook confirms the recording is ready

    return res.status(200).send('OK');
  } catch (error) {
    logger.error('Error handling Twilio recording webhook', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
    });
    return res.status(200).send('OK');
  }
});

/**
 * POST /webhooks/twilio/connect/:callId
 * Webhook for Twilio to connect the call
 * Returns TwiML instructions
 */
router.post('/twilio/connect/:callId', async (req: Request, res: Response) => {
  try {
    const { callId } = req.params;
    const { AnsweredBy, CallSid } = req.body;

    logger.info('Received Twilio connect webhook', {
      callId,
      callSid: CallSid,
      answeredBy: AnsweredBy,
    });

    // Check if answered by machine
    if (AnsweredBy === 'machine_start' || AnsweredBy === 'machine_end_beep') {
      logger.info('Call answered by machine', { callId, callSid: CallSid });

      // Return voicemail TwiML
      const twiml = twilioService.generateVoicemailTwiML(
        'Hello, this is Sarah from Next Level Real Estate. ' +
        'I was calling about your property inquiry. ' +
        'Please give us a call back at your earliest convenience. Thank you!',
        `/webhooks/twilio/voicemail/${callId}`
      );

      res.type('text/xml');
      return res.send(twiml);
    }

    // Human answered - connect to AI agent
    // For now, use a simple greeting
    // In production, this would connect to ElevenLabs ConversationRelay
    const call = await callManager.getCall(callId);

    if (!call) {
      logger.error('Call not found for connect webhook', { callId });
      const twiml = twilioService.generateGreetingTwiML(
        'We apologize, but there was an error connecting your call. Please try again later.'
      );
      res.type('text/xml');
      return res.send(twiml);
    }

    // Generate greeting TwiML
    const firstName = call.context?.lead?.name?.first || 'there';
    const twiml = twilioService.generateGreetingTwiML(
      `Hi ${firstName}, this is Sarah from Next Level Real Estate. ` +
      `I'm calling about your property inquiry. Do you have a moment to chat?`
    );

    res.type('text/xml');
    return res.send(twiml);
  } catch (error) {
    logger.error('Error handling Twilio connect webhook', {
      error: error instanceof Error ? error.message : 'Unknown error',
      callId: req.params.callId,
    });

    // Return error TwiML
    const twiml = twilioService.generateGreetingTwiML(
      'We apologize, but there was an error. Please try again later.'
    );
    res.type('text/xml');
    return res.send(twiml);
  }
});

/**
 * POST /webhooks/twilio/voicemail/:callId
 * Webhook for voicemail recording
 */
router.post('/twilio/voicemail/:callId', async (req: Request, res: Response) => {
  try {
    const { callId } = req.params;
    const { RecordingUrl, RecordingSid } = req.body;

    logger.info('Received voicemail recording', {
      callId,
      recordingSid: RecordingSid,
      recordingUrl: RecordingUrl,
    });

    // Voicemail recorded - hang up
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Thank you. Goodbye.</Say>
  <Hangup/>
</Response>`;

    res.type('text/xml');
    return res.send(twiml);
  } catch (error) {
    logger.error('Error handling voicemail webhook', {
      error: error instanceof Error ? error.message : 'Unknown error',
      callId: req.params.callId,
    });

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Hangup/>
</Response>`;
    res.type('text/xml');
    return res.send(twiml);
  }
});

/**
 * POST /webhooks/elevenlabs/conversation
 * Webhook for ElevenLabs conversation events
 */
router.post('/elevenlabs/conversation', async (req: Request, res: Response) => {
  try {
    const { conversationId, event, data } = req.body;

    logger.info('Received ElevenLabs conversation webhook', {
      conversationId,
      event,
    });

    // Handle different ElevenLabs events
    // This is a placeholder - actual implementation depends on ElevenLabs webhook spec

    return res.status(200).json({ status: 'received' });
  } catch (error) {
    logger.error('Error handling ElevenLabs webhook', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
    });
    return res.status(200).json({ status: 'error' });
  }
});

export default router;
