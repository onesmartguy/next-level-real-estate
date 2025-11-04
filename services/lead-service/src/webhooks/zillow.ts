import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import config from '../config';
import leadProcessor, { LeadInput } from '../processors/lead-processor';
import logger from '../utils/logger';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('lead-service-webhook-zillow');

/**
 * Verify Zillow webhook signature
 */
export function verifyZillowSignature(req: Request, res: Response, next: NextFunction): void {
  const span = tracer.startSpan('zillow.verifySignature');

  try {
    const signature = req.headers['x-zillow-signature'] as string;
    const timestamp = req.headers['x-zillow-timestamp'] as string;

    if (!signature || !timestamp) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: 'Missing signature or timestamp'
      });
      logger.warn('Zillow webhook missing signature headers');
      res.status(401).json({ error: 'Missing signature headers' });
      return;
    }

    // Verify timestamp is recent (within 5 minutes)
    const requestTime = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - requestTime) > 300) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: 'Timestamp too old'
      });
      logger.warn('Zillow webhook timestamp too old', { timestamp, currentTime });
      res.status(401).json({ error: 'Request timestamp too old' });
      return;
    }

    // Verify signature
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', config.webhooks.zillow.secret)
      .update(`${timestamp}.${body}`)
      .digest('hex');

    if (signature !== expectedSignature) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: 'Invalid signature'
      });
      logger.warn('Zillow webhook signature verification failed');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    span.setStatus({ code: SpanStatusCode.OK });
    next();
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    logger.error('Error verifying Zillow signature', { error });
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    span.end();
  }
}

/**
 * Zillow lead webhook payload interface
 * Based on Zillow's webhook format
 */
interface ZillowLeadPayload {
  lead_id: string;
  contact: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    phone_alt?: string;
  };
  property: {
    street_address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    property_type?: string;
    estimated_value?: number;
  };
  message?: string;
  timeline?: string;
  consent?: {
    has_written_consent: boolean;
    consent_date?: string;
    consent_method?: string;
  };
  campaign_id?: string;
  received_at: string;
}

/**
 * Handle Zillow lead webhook
 */
export async function handleZillowLead(req: Request, res: Response): Promise<void> {
  const span = tracer.startSpan('zillow.handleLead', {
    attributes: {
      'webhook.source': 'zillow'
    }
  });

  try {
    const payload: ZillowLeadPayload = req.body;

    logger.info('Received Zillow lead webhook', {
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
      logger.warn('Zillow webhook missing required fields', { payload });
      res.status(400).json({ error: 'Missing required fields: email, phone' });
      return;
    }

    // Transform Zillow payload to internal LeadInput format
    const leadInput: LeadInput = {
      firstName: payload.contact.first_name,
      lastName: payload.contact.last_name,
      email: payload.contact.email,
      phone: payload.contact.phone,
      alternatePhone: payload.contact.phone_alt,
      source: 'zillow',
      sourceId: payload.lead_id,
      campaignId: payload.campaign_id,
      propertyDetails: {
        address: payload.property?.street_address,
        city: payload.property?.city,
        state: payload.property?.state,
        zipCode: payload.property?.zip_code,
        propertyType: payload.property?.property_type,
        estimatedValue: payload.property?.estimated_value
      },
      consent: payload.consent ? {
        hasWrittenConsent: payload.consent.has_written_consent,
        consentDate: payload.consent.consent_date ? new Date(payload.consent.consent_date) : undefined,
        consentMethod: payload.consent.consent_method as any,
        consentSource: 'zillow'
      } : undefined,
      notes: payload.message,
      timeline: payload.timeline,
      tags: ['zillow', 'web-lead']
    };

    // Process the lead
    const result = await leadProcessor.processLead(leadInput);

    logger.info('Zillow lead processed successfully', {
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
    logger.error('Error processing Zillow lead webhook', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to process lead'
    });
  } finally {
    span.end();
  }
}
