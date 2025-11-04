import { Request, Response, NextFunction } from 'express';
import config from '../config';
import leadProcessor, { LeadInput } from '../processors/lead-processor';
import logger from '../utils/logger';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('lead-service-webhook-realgeeks');

/**
 * Verify RealGeeks webhook authentication
 * Uses Basic Auth with API credentials
 */
export function verifyRealGeeksAuth(req: Request, res: Response, next: NextFunction): void {
  const span = tracer.startSpan('realgeeks.verifyAuth');

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: 'Missing authorization header'
      });
      logger.warn('RealGeeks webhook missing authorization header');
      res.status(401).json({ error: 'Missing authorization header' });
      return;
    }

    // Decode Basic Auth credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    // Verify credentials
    if (
      username !== config.webhooks.realgeeks.username ||
      password !== config.webhooks.realgeeks.password
    ) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: 'Invalid credentials'
      });
      logger.warn('RealGeeks webhook authentication failed');
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    span.setStatus({ code: SpanStatusCode.OK });
    next();
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    logger.error('Error verifying RealGeeks auth', { error });
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    span.end();
  }
}

/**
 * RealGeeks lead webhook payload interface
 */
interface RealGeeksLeadPayload {
  lead_id: string;
  contact: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    phone_mobile?: string;
  };
  property?: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    property_type?: string;
    list_price?: number;
    bedrooms?: number;
    bathrooms?: number;
    square_feet?: number;
    year_built?: number;
  };
  lead_source?: string;
  lead_type?: string;
  timeline?: string;
  motivation?: string;
  notes?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

/**
 * Handle RealGeeks lead webhook
 */
export async function handleRealGeeksLead(req: Request, res: Response): Promise<void> {
  const span = tracer.startSpan('realgeeks.handleLead', {
    attributes: {
      'webhook.source': 'realgeeks'
    }
  });

  try {
    const payload: RealGeeksLeadPayload = req.body;

    logger.info('Received RealGeeks lead webhook', {
      leadId: payload.lead_id,
      email: payload.contact.email,
      phone: payload.contact.phone
    });

    // Validate required fields
    if (!payload.contact?.email || !payload.contact?.phone) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: 'Missing required fields'
      });
      logger.warn('RealGeeks webhook missing required fields', { payload });
      res.status(400).json({ error: 'Missing required fields: email, phone' });
      return;
    }

    // Transform RealGeeks payload to internal LeadInput format
    const leadInput: LeadInput = {
      firstName: payload.contact.first_name,
      lastName: payload.contact.last_name,
      email: payload.contact.email,
      phone: payload.contact.phone,
      alternatePhone: payload.contact.phone_mobile,
      source: 'realgeeks',
      sourceId: payload.lead_id,
      propertyDetails: payload.property ? {
        address: payload.property.address,
        city: payload.property.city,
        state: payload.property.state,
        zipCode: payload.property.zip,
        propertyType: payload.property.property_type,
        estimatedValue: payload.property.list_price,
        squareFeet: payload.property.square_feet,
        yearBuilt: payload.property.year_built
      } : undefined,
      motivation: payload.motivation,
      timeline: payload.timeline,
      notes: payload.notes,
      tags: [
        'realgeeks',
        payload.lead_type,
        payload.lead_source,
        ...(payload.tags || [])
      ].filter(Boolean) as string[]
    };

    // Process the lead
    const result = await leadProcessor.processLead(leadInput);

    logger.info('RealGeeks lead processed successfully', {
      leadId: result.lead._id,
      isDuplicate: result.isDuplicate,
      qualificationScore: result.lead.qualificationScore
    });

    span.setStatus({ code: SpanStatusCode.OK });
    res.status(200).json({
      success: true,
      leadId: result.lead._id,
      isDuplicate: result.isDuplicate,
      status: result.lead.status,
      qualificationScore: result.lead.qualificationScore
    });
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    logger.error('Error processing RealGeeks lead webhook', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to process lead'
    });
  } finally {
    span.end();
  }
}

/**
 * Handle RealGeeks lead update webhook
 */
export async function handleRealGeeksLeadUpdate(req: Request, res: Response): Promise<void> {
  const span = tracer.startSpan('realgeeks.handleLeadUpdate', {
    attributes: {
      'webhook.source': 'realgeeks',
      'webhook.type': 'update'
    }
  });

  try {
    const payload: RealGeeksLeadPayload = req.body;

    logger.info('Received RealGeeks lead update webhook', {
      leadId: payload.lead_id,
      email: payload.contact.email
    });

    // Find existing lead by source ID or email/phone
    const { Lead } = await import('../models/Lead');
    let lead = await Lead.findOne({
      'leadSource.source': 'realgeeks',
      'leadSource.sourceId': payload.lead_id
    });

    if (!lead) {
      // Try finding by email/phone
      lead = await Lead.findOne({
        $or: [
          { email: payload.contact.email.toLowerCase() },
          { phone: payload.contact.phone }
        ]
      });
    }

    if (!lead) {
      // Lead doesn't exist, create new one
      logger.info('Lead not found, creating new lead', { leadId: payload.lead_id });
      await handleRealGeeksLead(req, res);
      return;
    }

    // Update existing lead
    if (payload.motivation) lead.motivation = payload.motivation;
    if (payload.timeline) lead.timeline = payload.timeline;
    if (payload.notes) {
      lead.notes = lead.notes
        ? `${lead.notes}\n\n[RealGeeks Update]: ${payload.notes}`
        : payload.notes;
    }
    if (payload.tags) {
      lead.tags = [...new Set([...(lead.tags || []), ...payload.tags])];
    }
    if (payload.property) {
      lead.propertyDetails = {
        ...lead.propertyDetails,
        address: payload.property.address,
        city: payload.property.city,
        state: payload.property.state,
        zipCode: payload.property.zip,
        propertyType: payload.property.property_type,
        estimatedValue: payload.property.list_price,
        squareFeet: payload.property.square_feet,
        yearBuilt: payload.property.year_built
      };
    }

    await lead.save();

    // Emit update event
    const kafkaProducer = await import('../utils/kafka-producer');
    await kafkaProducer.default.sendLeadUpdatedEvent(lead._id.toString(), {
      leadId: lead._id,
      source: 'realgeeks',
      updateType: 'webhook_update',
      updatedAt: new Date()
    });

    logger.info('RealGeeks lead updated successfully', {
      leadId: lead._id
    });

    span.setStatus({ code: SpanStatusCode.OK });
    res.status(200).json({
      success: true,
      leadId: lead._id,
      status: lead.status
    });
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    logger.error('Error processing RealGeeks lead update webhook', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update lead'
    });
  } finally {
    span.end();
  }
}
