import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import config from '../config';
import leadProcessor, { LeadInput } from '../processors/lead-processor';
import logger from '../utils/logger';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('lead-service-webhook-google-ads');

/**
 * Verify Google Ads webhook signature
 */
export function verifyGoogleAdsSignature(req: Request, res: Response, next: NextFunction): void {
  const span = tracer.startSpan('googleAds.verifySignature');

  try {
    const signature = req.headers['x-goog-signature'] as string;

    if (!signature) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: 'Missing signature'
      });
      logger.warn('Google Ads webhook missing signature header');
      res.status(401).json({ error: 'Missing signature header' });
      return;
    }

    // Verify signature
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', config.webhooks.googleAds.secret)
      .update(body)
      .digest('base64');

    if (signature !== expectedSignature) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: 'Invalid signature'
      });
      logger.warn('Google Ads webhook signature verification failed');
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
    logger.error('Error verifying Google Ads signature', { error });
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    span.end();
  }
}

/**
 * Google Ads Lead Form webhook payload interface
 * Based on Google Ads API v19.1 LocalServicesLeadService
 */
interface GoogleAdsLeadPayload {
  lead_id: string;
  user_column_data: Array<{
    column_id: string;
    string_value?: string;
    phone_number_value?: string;
  }>;
  campaign_id: string;
  ad_group_id: string;
  creative_id?: string;
  gclid?: string;
  api_version: string;
  form_id: string;
  google_key?: string;
  is_test: boolean;
}

/**
 * Extract field value from Google Ads user_column_data
 */
function extractFieldValue(
  userColumnData: GoogleAdsLeadPayload['user_column_data'],
  fieldName: string
): string | undefined {
  const column = userColumnData.find(col => col.column_id === fieldName);
  return column?.string_value || column?.phone_number_value;
}

/**
 * Handle Google Ads lead webhook
 */
export async function handleGoogleAdsLead(req: Request, res: Response): Promise<void> {
  const span = tracer.startSpan('googleAds.handleLead', {
    attributes: {
      'webhook.source': 'google_ads'
    }
  });

  try {
    const payload: GoogleAdsLeadPayload = req.body;

    logger.info('Received Google Ads lead webhook', {
      leadId: payload.lead_id,
      campaignId: payload.campaign_id,
      isTest: payload.is_test
    });

    // Skip test leads in production
    if (payload.is_test && config.nodeEnv === 'production') {
      logger.info('Skipping test lead in production', { leadId: payload.lead_id });
      span.setStatus({ code: SpanStatusCode.OK });
      res.status(200).json({ success: true, message: 'Test lead skipped' });
      return;
    }

    // Extract user data from column data
    const firstName = extractFieldValue(payload.user_column_data, 'FIRST_NAME') || 'Unknown';
    const lastName = extractFieldValue(payload.user_column_data, 'LAST_NAME') || 'Unknown';
    const email = extractFieldValue(payload.user_column_data, 'EMAIL');
    const phone = extractFieldValue(payload.user_column_data, 'PHONE_NUMBER');
    const address = extractFieldValue(payload.user_column_data, 'STREET_ADDRESS');
    const city = extractFieldValue(payload.user_column_data, 'CITY');
    const state = extractFieldValue(payload.user_column_data, 'REGION');
    const zipCode = extractFieldValue(payload.user_column_data, 'POSTAL_CODE');
    const propertyType = extractFieldValue(payload.user_column_data, 'PROPERTY_TYPE');
    const timeline = extractFieldValue(payload.user_column_data, 'TIMELINE');
    const message = extractFieldValue(payload.user_column_data, 'MESSAGE');

    // Validate required fields
    if (!email || !phone) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: 'Missing required fields'
      });
      logger.warn('Google Ads webhook missing required fields', { payload });
      res.status(400).json({ error: 'Missing required fields: email, phone' });
      return;
    }

    // Transform Google Ads payload to internal LeadInput format
    const leadInput: LeadInput = {
      firstName,
      lastName,
      email,
      phone,
      source: 'google_ads',
      sourceId: payload.lead_id,
      campaignId: payload.campaign_id,
      adGroupId: payload.ad_group_id,
      keyword: payload.gclid, // Store GCLID as keyword for tracking
      propertyDetails: {
        address,
        city,
        state,
        zipCode,
        propertyType
      },
      timeline,
      notes: message,
      tags: ['google-ads', 'ppc-lead', payload.is_test ? 'test' : 'live'].filter(Boolean)
    };

    // Process the lead
    const result = await leadProcessor.processLead(leadInput);

    logger.info('Google Ads lead processed successfully', {
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
    logger.error('Error processing Google Ads lead webhook', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to process lead'
    });
  } finally {
    span.end();
  }
}

/**
 * Handle Google Ads webhook verification (challenge request)
 */
export function handleGoogleAdsVerification(req: Request, res: Response): void {
  const challenge = req.query.challenge as string;

  if (challenge) {
    logger.info('Google Ads webhook verification request', { challenge });
    res.status(200).send(challenge);
  } else {
    logger.warn('Google Ads verification request missing challenge');
    res.status(400).json({ error: 'Missing challenge parameter' });
  }
}
