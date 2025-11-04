import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Lead, LeadStatus } from '../models/Lead';
import leadProcessor from '../processors/lead-processor';
import deduplicationService from '../services/deduplication';
import tcpaChecker from '../services/tcpa-checker';
import logger from '../utils/logger';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const router = Router();
const tracer = trace.getTracer('lead-service-routes');

/**
 * GET /leads - List leads with pagination and filtering
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isIn(Object.values(LeadStatus)),
    query('source').optional().isIn(['zillow', 'google_ads', 'realgeeks', 'manual', 'other']),
    query('isDuplicate').optional().isBoolean().toBoolean(),
    query('minScore').optional().isInt({ min: 0, max: 100 }).toInt(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  async (req: Request, res: Response): Promise<void> => {
    const span = tracer.startSpan('leads.list');

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Validation error' });
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const skip = (page - 1) * limit;

      // Build filter query
      const filter: any = {};
      if (req.query.status) filter.status = req.query.status;
      if (req.query.source) filter['leadSource.source'] = req.query.source;
      if (req.query.isDuplicate !== undefined) filter.isDuplicate = req.query.isDuplicate;
      if (req.query.minScore) filter.qualificationScore = { $gte: req.query.minScore };
      if (req.query.startDate || req.query.endDate) {
        filter.createdAt = {};
        if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate as string);
        if (req.query.endDate) filter.createdAt.$lte = new Date(req.query.endDate as string);
      }

      // Execute query
      const [leads, total] = await Promise.all([
        Lead.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Lead.countDocuments(filter)
      ]);

      span.setStatus({ code: SpanStatusCode.OK });
      res.json({
        success: true,
        data: leads,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      logger.error('Error listing leads', { error });
      res.status(500).json({ success: false, error: 'Failed to list leads' });
    } finally {
      span.end();
    }
  }
);

/**
 * GET /leads/:id - Get lead by ID
 */
router.get(
  '/:id',
  [param('id').isMongoId()],
  async (req: Request, res: Response): Promise<void> => {
    const span = tracer.startSpan('leads.getById');

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Validation error' });
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const lead = await Lead.findById(req.params.id);

      if (!lead) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Lead not found' });
        res.status(404).json({ success: false, error: 'Lead not found' });
        return;
      }

      // If duplicate, also fetch original lead
      let originalLead = null;
      if (lead.isDuplicate && lead.originalLeadId) {
        originalLead = await Lead.findById(lead.originalLeadId);
      }

      span.setStatus({ code: SpanStatusCode.OK });
      res.json({
        success: true,
        data: lead,
        originalLead: originalLead || undefined
      });
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      logger.error('Error getting lead', { leadId: req.params.id, error });
      res.status(500).json({ success: false, error: 'Failed to get lead' });
    } finally {
      span.end();
    }
  }
);

/**
 * PATCH /leads/:id - Update lead
 */
router.patch(
  '/:id',
  [
    param('id').isMongoId(),
    body('status').optional().isIn(Object.values(LeadStatus)),
    body('assignedTo').optional().isString(),
    body('notes').optional().isString(),
    body('tags').optional().isArray(),
    body('nextFollowUpAt').optional().isISO8601()
  ],
  async (req: Request, res: Response): Promise<void> => {
    const span = tracer.startSpan('leads.update');

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Validation error' });
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const lead = await Lead.findById(req.params.id);

      if (!lead) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Lead not found' });
        res.status(404).json({ success: false, error: 'Lead not found' });
        return;
      }

      // Update allowed fields
      if (req.body.status !== undefined) {
        await leadProcessor.updateLeadStatus(String(lead._id), req.body.status, req.body.notes);
      }
      if (req.body.assignedTo !== undefined) lead.assignedTo = req.body.assignedTo;
      if (req.body.notes !== undefined) {
        lead.notes = lead.notes ? `${lead.notes}\n\n${req.body.notes}` : req.body.notes;
      }
      if (req.body.tags !== undefined) lead.tags = req.body.tags;
      if (req.body.nextFollowUpAt !== undefined) {
        lead.nextFollowUpAt = new Date(req.body.nextFollowUpAt);
      }

      await lead.save();

      logger.info('Lead updated', { leadId: lead._id });
      span.setStatus({ code: SpanStatusCode.OK });
      res.json({
        success: true,
        data: lead
      });
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      logger.error('Error updating lead', { leadId: req.params.id, error });
      res.status(500).json({ success: false, error: 'Failed to update lead' });
    } finally {
      span.end();
    }
  }
);

/**
 * POST /leads/:id/call-attempts - Add call attempt
 */
router.post(
  '/:id/call-attempts',
  [
    param('id').isMongoId(),
    body('type').isIn(['manual', 'automated']),
    body('result').isString(),
    body('duration').optional().isInt({ min: 0 }),
    body('notes').optional().isString()
  ],
  async (req: Request, res: Response): Promise<void> => {
    const span = tracer.startSpan('leads.addCallAttempt');

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Validation error' });
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const lead = await Lead.findById(req.params.id);

      if (!lead) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Lead not found' });
        res.status(404).json({ success: false, error: 'Lead not found' });
        return;
      }

      (lead as any).addCallAttempt(
        req.body.type,
        req.body.result,
        req.body.duration,
        req.body.notes
      );

      await lead.save();

      logger.info('Call attempt added', { leadId: lead._id, result: req.body.result });
      span.setStatus({ code: SpanStatusCode.OK });
      res.json({
        success: true,
        data: lead
      });
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      logger.error('Error adding call attempt', { leadId: req.params.id, error });
      res.status(500).json({ success: false, error: 'Failed to add call attempt' });
    } finally {
      span.end();
    }
  }
);

/**
 * GET /leads/:id/duplicates - Find duplicates for a lead
 */
router.get(
  '/:id/duplicates',
  [param('id').isMongoId()],
  async (req: Request, res: Response): Promise<void> => {
    const span = tracer.startSpan('leads.findDuplicates');

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Validation error' });
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const duplicates = await deduplicationService.findDuplicates(req.params.id);

      span.setStatus({ code: SpanStatusCode.OK });
      res.json({
        success: true,
        data: duplicates,
        count: duplicates.length
      });
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      logger.error('Error finding duplicates', { leadId: req.params.id, error });
      res.status(500).json({ success: false, error: 'Failed to find duplicates' });
    } finally {
      span.end();
    }
  }
);

/**
 * POST /leads/:id/tcpa-check - Perform TCPA compliance check
 */
router.post(
  '/:id/tcpa-check',
  [param('id').isMongoId()],
  async (req: Request, res: Response): Promise<void> => {
    const span = tracer.startSpan('leads.tcpaCheck');

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Validation error' });
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const lead = await Lead.findById(req.params.id);

      if (!lead) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Lead not found' });
        res.status(404).json({ success: false, error: 'Lead not found' });
        return;
      }

      // Perform TCPA check
      const tcpaResult = await tcpaChecker.performTCPACheck(
        lead.phone,
        lead.consent,
        lead.dncStatus.internalDNC
      );

      // Update lead with fresh DNC status
      lead.dncStatus.onNationalRegistry = tcpaResult.onNationalDNC;
      lead.dncStatus.lastCheckedAt = tcpaResult.lastCheckedAt;
      lead.automatedCallsAllowed = tcpaChecker.canAutoCall(
        lead.consent.hasWrittenConsent,
        tcpaResult.onNationalDNC,
        lead.dncStatus.internalDNC,
        lead.consent.expiresAt ? new Date() > lead.consent.expiresAt : false
      );

      await lead.save();

      logger.info('TCPA check completed', {
        leadId: lead._id,
        canContact: tcpaResult.canContact
      });
      span.setStatus({ code: SpanStatusCode.OK });
      res.json({
        success: true,
        data: {
          canContact: tcpaResult.canContact,
          onNationalDNC: tcpaResult.onNationalDNC,
          automatedCallsAllowed: lead.automatedCallsAllowed,
          reason: tcpaResult.reason
        }
      });
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      logger.error('Error performing TCPA check', { leadId: req.params.id, error });
      res.status(500).json({ success: false, error: 'Failed to perform TCPA check' });
    } finally {
      span.end();
    }
  }
);

export default router;
