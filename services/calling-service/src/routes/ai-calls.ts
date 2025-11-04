import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Logger } from '@next-level-real-estate/shared/utils';
import { claudeAgent } from '../services/claude-agent';
import axios from 'axios';
import { config } from '../config';

const router = Router();
const logger = new Logger('AICallsRoutes');

/**
 * POST /api/ai-calls/initiate
 * Initiate an AI-powered call using Claude Agent SDK with MCP tools
 */
router.post(
  '/initiate',
  [
    body('leadId').isString().notEmpty().withMessage('leadId is required'),
    body('phoneNumber')
      .optional()
      .isString()
      .matches(/^\+1[0-9]{10}$/)
      .withMessage('phoneNumber must be in E.164 format (+1XXXXXXXXXX)'),
    body('leadName').optional().isString(),
    body('address').optional().isString(),
    body('callObjective')
      .optional()
      .isString()
      .withMessage('callObjective must be a string'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const { leadId, phoneNumber, leadName, address, callObjective } = req.body;

      logger.info('Received AI call initiation request', {
        leadId,
        phoneNumber,
        leadName,
      });

      // Fetch lead data if not provided
      let lead: any;
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
        res.status(404).json({
          error: 'Lead not found',
          leadId,
        });
        return;
      }

      // Use lead data if fields not provided
      const finalPhoneNumber = phoneNumber || lead.phone;
      const finalLeadName = leadName || `${lead.firstName} ${lead.lastName}`;
      const finalAddress = address || lead.address?.fullAddress || '';

      if (!finalPhoneNumber) {
        res.status(400).json({
          error: 'Phone number is required',
        });
        return;
      }

      if (!finalAddress) {
        res.status(400).json({
          error: 'Address is required',
        });
        return;
      }

      // Initialize Claude Agent if not already initialized
      await claudeAgent.initialize();

      // Start AI conversation
      const result = await claudeAgent.startConversation({
        leadId,
        leadName: finalLeadName,
        phoneNumber: finalPhoneNumber,
        address: finalAddress,
        callObjective,
      });

      logger.info('AI call initiated successfully', {
        conversationId: result.conversationId,
        leadId,
      });

      res.status(201).json({
        success: true,
        conversationId: result.conversationId,
        initialMessage: result.initialMessage,
        leadId,
        phoneNumber: finalPhoneNumber,
        leadName: finalLeadName,
        address: finalAddress,
      });
      return;
    } catch (error: any) {
      logger.error('Error initiating AI call', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Check for TCPA violations
      if (error.message && error.message.includes('TCPA')) {
        res.status(403).json({
          error: 'TCPA Compliance Failed',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return;
    }
  }
);

/**
 * POST /api/ai-calls/:conversationId/message
 * Send a message to an ongoing AI conversation
 */
router.post(
  '/:conversationId/message',
  [
    param('conversationId').isString().notEmpty().withMessage('conversationId is required'),
    body('message').isString().notEmpty().withMessage('message is required'),
    body('context').optional().isObject(),
    body('conversationHistory').optional().isArray(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const { conversationId } = req.params;
      const { message, context, conversationHistory = [] } = req.body;

      logger.info('Processing AI conversation message', {
        conversationId,
        messageLength: message.length,
      });

      const response = await claudeAgent.continueConversation(
        conversationId,
        context,
        message,
        conversationHistory
      );

      res.json({
        success: true,
        conversationId,
        response,
      });
      return;
    } catch (error) {
      logger.error('Error processing AI conversation message', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return;
    }
  }
);

/**
 * GET /api/ai-calls/tools
 * Get available MCP tools
 */
router.get('/tools', async (req: Request, res: Response): Promise<void> => {
  try {
    await claudeAgent.initialize();
    const tools = await claudeAgent.getAvailableTools();

    res.json({
      success: true,
      tools,
      count: tools.length,
    });
    return;
  } catch (error) {
    logger.error('Error fetching available tools', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
});

/**
 * POST /api/ai-calls/tools/execute
 * Execute an MCP tool directly (for testing)
 */
router.post(
  '/tools/execute',
  [
    body('toolName').isString().notEmpty().withMessage('toolName is required'),
    body('parameters').isObject().withMessage('parameters must be an object'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const { toolName, parameters } = req.body;

      logger.info('Executing MCP tool', {
        toolName,
        parameters,
      });

      await claudeAgent.initialize();
      const result = await claudeAgent.executeTool(toolName, parameters);

      res.json({
        success: true,
        toolName,
        result,
      });
      return;
    } catch (error) {
      logger.error('Error executing MCP tool', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return;
    }
  }
);

/**
 * GET /api/ai-calls/health
 * Check AI calling system health
 */
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    await claudeAgent.initialize();

    res.json({
      success: true,
      status: 'healthy',
      message: 'AI calling system operational',
      mcpServersInitialized: true,
    });
    return;
  } catch (error) {
    logger.error('AI calling system health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
});

export default router;

// ---
// Changelog:
// - 2025-10-24: Initial implementation by Claude Agent (MCP Integration Initiative)
//   * Created AI-powered calling endpoints with Claude SDK integration
//   * Added TCPA compliance checking via MCP tools
//   * Implemented conversation management and tool execution endpoints
