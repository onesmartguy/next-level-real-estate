import { Lead, ILead, LeadStatus } from '../models/Lead';
import deduplicationService from '../services/deduplication';
import tcpaChecker from '../services/tcpa-checker';
import kafkaProducer from '../utils/kafka-producer';
import logger from '../utils/logger';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('lead-service-processor');

export interface LeadInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  source: 'zillow' | 'google_ads' | 'realgeeks' | 'manual' | 'other';
  sourceId?: string;
  campaignId?: string;
  adGroupId?: string;
  keyword?: string;
  propertyDetails?: {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    propertyType?: string;
    estimatedValue?: number;
    condition?: string;
    yearBuilt?: number;
    squareFeet?: number;
  };
  consent?: {
    hasWrittenConsent: boolean;
    consentDate?: Date;
    consentMethod?: 'written_form' | 'email' | 'phone' | 'online_form';
    consentSource?: string;
  };
  motivation?: string;
  timeline?: string;
  notes?: string;
  tags?: string[];
}

export interface ProcessedLeadResult {
  lead: ILead;
  isDuplicate: boolean;
  originalLeadId?: string;
  tcpaCompliant: boolean;
}

class LeadProcessor {
  /**
   * Process incoming lead: deduplication, TCPA check, enrichment, storage
   */
  async processLead(input: LeadInput): Promise<ProcessedLeadResult> {
    const span = tracer.startSpan('leadProcessor.processLead', {
      attributes: {
        'lead.source': input.source,
        'lead.email': input.email,
        'lead.phone': input.phone
      }
    });

    try {
      logger.info('Processing new lead', {
        source: input.source,
        email: input.email,
        phone: input.phone
      });

      // Step 1: Check for duplicates
      const dupeResult = await deduplicationService.checkDuplicate(
        input.email,
        input.phone
      );

      if (dupeResult.isDuplicate && dupeResult.originalLead) {
        logger.info('Duplicate lead detected', {
          email: input.email,
          phone: input.phone,
          originalLeadId: dupeResult.originalLead._id
        });

        // Create duplicate lead record
        const duplicateLead = await this.createDuplicateLead(
          input,
          dupeResult.originalLead._id.toString(),
          dupeResult.duplicateCheckHash
        );

        // Merge data into original lead
        const updatedOriginal = await deduplicationService.mergeDuplicateData(
          dupeResult.originalLead._id.toString(),
          duplicateLead._id.toString()
        );

        // Emit duplicate event
        await kafkaProducer.sendLeadDuplicateEvent(
          duplicateLead._id.toString(),
          dupeResult.originalLead._id.toString()
        );

        span.setStatus({ code: SpanStatusCode.OK });
        return {
          lead: updatedOriginal,
          isDuplicate: true,
          originalLeadId: dupeResult.originalLead._id.toString(),
          tcpaCompliant: updatedOriginal.consent.hasWrittenConsent
        };
      }

      // Step 2: TCPA compliance check
      const consent = input.consent || {
        hasWrittenConsent: false
      };

      const tcpaResult = await tcpaChecker.performTCPACheck(
        input.phone,
        consent,
        false // Not on internal DNC by default
      );

      // Step 3: Enrich lead data
      const enrichedData = await this.enrichLeadData(input);

      // Step 4: Calculate qualification score
      const qualificationScore = this.calculateQualificationScore(input, tcpaResult);

      // Step 5: Determine consent expiration
      const consentExpiration = consent.hasWrittenConsent && consent.consentDate
        ? tcpaChecker.generateConsentExpiration(consent.consentDate)
        : undefined;

      // Step 6: Create lead in database
      const lead = new Lead({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email.toLowerCase(),
        phone: input.phone,
        alternatePhone: input.alternatePhone,
        leadSource: {
          source: input.source,
          sourceId: input.sourceId,
          campaignId: input.campaignId,
          adGroupId: input.adGroupId,
          keyword: input.keyword,
          receivedAt: new Date()
        },
        propertyDetails: input.propertyDetails,
        consent: {
          hasWrittenConsent: consent.hasWrittenConsent,
          consentDate: consent.consentDate,
          consentMethod: consent.consentMethod,
          consentSource: consent.consentSource,
          expiresAt: consentExpiration
        },
        dncStatus: {
          onNationalRegistry: tcpaResult.onNationalDNC,
          internalDNC: false,
          lastCheckedAt: tcpaResult.lastCheckedAt
        },
        automatedCallsAllowed: tcpaChecker.canAutoCall(
          consent.hasWrittenConsent,
          tcpaResult.onNationalDNC,
          false,
          false
        ),
        status: LeadStatus.NEW,
        qualificationScore,
        qualificationReason: this.getQualificationReason(qualificationScore),
        motivation: input.motivation,
        timeline: input.timeline,
        notes: input.notes,
        tags: input.tags || [],
        enrichedAt: new Date(),
        enrichmentData: enrichedData,
        isDuplicate: false,
        duplicateCheckHash: dupeResult.duplicateCheckHash
      });

      await lead.save();

      logger.info('Lead created successfully', {
        leadId: lead._id,
        source: input.source,
        qualificationScore,
        tcpaCompliant: tcpaResult.canContact
      });

      // Step 7: Emit LeadReceived event
      await kafkaProducer.sendLeadReceivedEvent(lead._id.toString(), {
        leadId: lead._id,
        source: input.source,
        status: lead.status,
        qualificationScore,
        tcpaCompliant: tcpaResult.canContact,
        automatedCallsAllowed: lead.automatedCallsAllowed
      });

      // Step 8: If qualified, emit LeadQualified event
      if (qualificationScore >= 70) {
        await kafkaProducer.sendLeadQualifiedEvent(lead._id.toString(), {
          leadId: lead._id,
          qualificationScore,
          qualificationReason: lead.qualificationReason,
          priority: qualificationScore >= 85 ? 'high' : 'medium'
        });

        // Update status to qualified
        lead.status = LeadStatus.QUALIFIED;
        await lead.save();
      }

      span.setStatus({ code: SpanStatusCode.OK });
      return {
        lead,
        isDuplicate: false,
        tcpaCompliant: tcpaResult.canContact
      };
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      logger.error('Error processing lead', {
        source: input.source,
        email: input.email,
        error
      });
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Create a duplicate lead record for tracking
   */
  private async createDuplicateLead(
    input: LeadInput,
    originalLeadId: string,
    duplicateCheckHash: string
  ): Promise<ILead> {
    const lead = new Lead({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email.toLowerCase(),
      phone: input.phone,
      alternatePhone: input.alternatePhone,
      leadSource: {
        source: input.source,
        sourceId: input.sourceId,
        campaignId: input.campaignId,
        adGroupId: input.adGroupId,
        keyword: input.keyword,
        receivedAt: new Date()
      },
      propertyDetails: input.propertyDetails,
      consent: {
        hasWrittenConsent: input.consent?.hasWrittenConsent || false,
        consentDate: input.consent?.consentDate,
        consentMethod: input.consent?.consentMethod,
        consentSource: input.consent?.consentSource
      },
      dncStatus: {
        onNationalRegistry: false,
        internalDNC: false,
        lastCheckedAt: new Date()
      },
      automatedCallsAllowed: false,
      status: LeadStatus.NEW,
      motivation: input.motivation,
      timeline: input.timeline,
      notes: input.notes,
      tags: input.tags || [],
      isDuplicate: true,
      originalLeadId,
      duplicateCheckHash
    });

    await lead.save();
    return lead;
  }

  /**
   * Enrich lead data with additional information
   */
  private async enrichLeadData(input: LeadInput): Promise<Record<string, any>> {
    const enrichedData: Record<string, any> = {};

    // Extract domain from email
    const emailDomain = input.email.split('@')[1];
    enrichedData.emailDomain = emailDomain;

    // Determine property equity if value is known
    if (input.propertyDetails?.estimatedValue) {
      // Placeholder: In production, fetch mortgage data or use estimation algorithm
      enrichedData.estimatedEquity = Math.round(input.propertyDetails.estimatedValue * 0.20);
    }

    // Categorize urgency based on keywords
    if (input.motivation || input.notes) {
      const urgentKeywords = ['urgent', 'asap', 'immediately', 'foreclosure', 'probate', 'divorce'];
      const text = `${input.motivation || ''} ${input.notes || ''}`.toLowerCase();
      enrichedData.urgencyDetected = urgentKeywords.some(keyword => text.includes(keyword));
    }

    return enrichedData;
  }

  /**
   * Calculate lead qualification score (0-100)
   */
  private calculateQualificationScore(
    input: LeadInput,
    tcpaResult: { canContact: boolean }
  ): number {
    let score = 50; // Base score

    // TCPA compliance (+20 points)
    if (tcpaResult.canContact) {
      score += 20;
    }

    // Written consent (+10 points)
    if (input.consent?.hasWrittenConsent) {
      score += 10;
    }

    // Property details provided (+15 points)
    if (input.propertyDetails?.address && input.propertyDetails?.city) {
      score += 15;
    }

    // Motivation provided (+10 points)
    if (input.motivation) {
      score += 10;
    }

    // High-value property (+5 points)
    if (input.propertyDetails?.estimatedValue && input.propertyDetails.estimatedValue > 200000) {
      score += 5;
    }

    // Source quality bonus
    if (input.source === 'realgeeks') {
      score += 5; // RealGeeks typically has higher quality leads
    }

    // Timeline provided (+5 points)
    if (input.timeline) {
      score += 5;
    }

    // Cap at 100
    return Math.min(score, 100);
  }

  /**
   * Get human-readable qualification reason
   */
  private getQualificationReason(score: number): string {
    if (score >= 85) {
      return 'High-quality lead with complete information and TCPA compliance';
    } else if (score >= 70) {
      return 'Good lead with sufficient information for contact';
    } else if (score >= 50) {
      return 'Average lead, may need additional qualification';
    } else {
      return 'Low-quality lead, missing key information or compliance issues';
    }
  }

  /**
   * Update lead status
   */
  async updateLeadStatus(
    leadId: string,
    status: LeadStatus,
    notes?: string
  ): Promise<ILead> {
    const span = tracer.startSpan('leadProcessor.updateLeadStatus');

    try {
      const lead = await Lead.findById(leadId);
      if (!lead) {
        throw new Error('Lead not found');
      }

      const previousStatus = lead.status;
      lead.status = status;

      if (notes) {
        lead.notes = lead.notes
          ? `${lead.notes}\n\n[Status Update]: ${notes}`
          : notes;
      }

      await lead.save();

      // Emit status update event
      await kafkaProducer.sendLeadUpdatedEvent(leadId, {
        leadId,
        previousStatus,
        newStatus: status,
        updatedAt: new Date()
      });

      logger.info('Lead status updated', {
        leadId,
        previousStatus,
        newStatus: status
      });

      span.setStatus({ code: SpanStatusCode.OK });
      return lead;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      logger.error('Error updating lead status', { leadId, status, error });
      throw error;
    } finally {
      span.end();
    }
  }
}

export default new LeadProcessor();
