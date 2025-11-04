import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Logger } from '@next-level-real-estate/shared/utils';
import { CallManager } from '../services/call-manager';
import { Lead } from '@next-level-real-estate/shared/models';
import axios from 'axios';
import { config } from '../config';

const router = Router();
const logger = new Logger('CallsRoutes');
const callManager = new CallManager();

/**
 * POST /api/calls/initiate
 * Initiate an outbound call to a lead
 */
router.post(
  '/initiate',
  [
    body('leadId').isString().notEmpty().withMessage('leadId is required'),
    body('campaignId').optional().isString(),
    body('callType')
      .optional()
      .isIn(['manual', 'automated', 'agent'])
      .withMessage('callType must be manual, automated, or agent'),
    body('overrideTCPA').optional().isBoolean(),
  ],
  async (req: Request, res: Response) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { leadId, campaignId, callType, overrideTCPA } = req.body;

      logger.info('Received call initiation request', {
        leadId,
        campaignId,
        callType,
      });

      // Fetch lead data from Lead Service
      let lead: Lead;
      try {
        const response = await axios.get(
          `${config.leadServiceUrl}/api/leads/${leadId}`
        );
        lead = response.data;
      } catch (error) {
        logger.error('Failed to fetch lead', {
          leadId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return res.status(404).json({
          error: 'Lead not found',
          leadId,
        });
      }

      // Initiate call
      const result = await callManager.initiateCall({
        leadId,
        lead,
        campaignId,
        callType: callType || 'agent',
        overrideTCPA: overrideTCPA || false,
      });

      if (result.status === 'failed') {
        return res.status(400).json({
          error: result.error,
          tcpaViolations: result.tcpaViolations,
          callId: result.callId,
        });
      }

      logger.info('Call initiated successfully', {
        callId: result.callId,
        leadId,
      });

      return res.status(201).json({
        callId: result.callId,
        status: result.status,
        call: result.call,
      });
    } catch (error) {
      logger.error('Error initiating call', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/calls/:callId
 * Get call details by ID
 */
router.get(
  '/:callId',
  [param('callId').isString().notEmpty().withMessage('callId is required')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { callId } = req.params;

      const call = await callManager.getCall(callId);

      if (!call) {
        return res.status(404).json({
          error: 'Call not found',
          callId,
        });
      }

      return res.json(call);
    } catch (error) {
      logger.error('Error fetching call', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/calls/:callId/transcript
 * Get call transcript
 */
router.get(
  '/:callId/transcript',
  [param('callId').isString().notEmpty().withMessage('callId is required')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { callId } = req.params;

      const call = await callManager.getCall(callId);

      if (!call) {
        return res.status(404).json({
          error: 'Call not found',
          callId,
        });
      }

      if (!call.transcript) {
        return res.status(404).json({
          error: 'Transcript not available',
          callId,
        });
      }

      return res.json({
        callId,
        transcript: call.transcript,
        sentiment: call.sentiment,
        intent: call.intent,
      });
    } catch (error) {
      logger.error('Error fetching transcript', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/calls/lead/:leadId
 * Get all calls for a lead
 */
router.get(
  '/lead/:leadId',
  [param('leadId').isString().notEmpty().withMessage('leadId is required')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { leadId } = req.params;

      const calls = await callManager.getCallsForLead(leadId);

      return res.json({
        leadId,
        calls,
        count: calls.length,
      });
    } catch (error) {
      logger.error('Error fetching calls for lead', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/calls/active
 * Get all active calls
 */
router.get('/active/all', async (req: Request, res: Response) => {
  try {
    const activeCalls = await callManager.getActiveCalls();

    return res.json({
      calls: activeCalls,
      count: activeCalls.length,
    });
  } catch (error) {
    logger.error('Error fetching active calls', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
