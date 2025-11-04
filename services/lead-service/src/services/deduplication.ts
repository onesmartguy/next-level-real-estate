import crypto from 'crypto';
import { Lead, ILead } from '../models/Lead';
import logger from '../utils/logger';
import kafkaProducer from '../utils/kafka-producer';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { parsePhoneNumber } from 'libphonenumber-js';

const tracer = trace.getTracer('lead-service-deduplication');

export interface DeduplicationResult {
  isDuplicate: boolean;
  originalLead?: ILead;
  duplicateCheckHash: string;
}

class DeduplicationService {
  /**
   * Normalize phone number to E.164 format for consistent comparison
   */
  private normalizePhone(phone: string): string {
    try {
      // Remove all non-numeric characters
      const cleaned = phone.replace(/\D/g, '');

      // Try parsing as US number first
      const phoneNumber = parsePhoneNumber(cleaned, 'US');
      if (phoneNumber && phoneNumber.isValid()) {
        return phoneNumber.format('E.164');
      }

      // Fall back to cleaned number
      return cleaned;
    } catch (error) {
      logger.warn('Failed to parse phone number', { phone, error });
      return phone.replace(/\D/g, '');
    }
  }

  /**
   * Normalize email to lowercase and trim
   */
  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Generate a unique hash for duplicate checking
   * Uses email and phone to identify duplicates
   */
  generateDuplicateHash(email: string, phone: string): string {
    const normalizedEmail = this.normalizeEmail(email);
    const normalizedPhone = this.normalizePhone(phone);

    const hashInput = `${normalizedEmail}:${normalizedPhone}`;
    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }

  /**
   * Check if a lead is a duplicate based on email and phone
   */
  async checkDuplicate(
    email: string,
    phone: string
  ): Promise<DeduplicationResult> {
    const span = tracer.startSpan('deduplication.check');

    try {
      const normalizedEmail = this.normalizeEmail(email);
      const normalizedPhone = this.normalizePhone(phone);
      const duplicateCheckHash = this.generateDuplicateHash(email, phone);

      span.setAttributes({
        'lead.email': normalizedEmail,
        'lead.phone': normalizedPhone,
        'lead.hash': duplicateCheckHash
      });

      // First check by exact hash match
      const exactMatch = await Lead.findOne({
        duplicateCheckHash,
        isDuplicate: false
      }).sort({ createdAt: 1 });

      if (exactMatch) {
        logger.info('Exact duplicate found', {
          originalLeadId: exactMatch._id,
          email: normalizedEmail,
          phone: normalizedPhone
        });

        span.setStatus({ code: SpanStatusCode.OK });
        return {
          isDuplicate: true,
          originalLead: exactMatch,
          duplicateCheckHash
        };
      }

      // Check for partial matches (same email OR same phone)
      const partialMatches = await Lead.find({
        $or: [
          { email: normalizedEmail },
          { phone: normalizedPhone }
        ],
        isDuplicate: false
      }).sort({ createdAt: 1 });

      if (partialMatches.length > 0) {
        // Use the oldest lead as the original
        const originalLead = partialMatches[0];

        logger.info('Partial duplicate found', {
          originalLeadId: originalLead._id,
          matchType: originalLead.email === normalizedEmail ? 'email' : 'phone',
          email: normalizedEmail,
          phone: normalizedPhone
        });

        span.setStatus({ code: SpanStatusCode.OK });
        return {
          isDuplicate: true,
          originalLead,
          duplicateCheckHash
        };
      }

      // No duplicates found
      logger.debug('No duplicates found', {
        email: normalizedEmail,
        phone: normalizedPhone
      });

      span.setStatus({ code: SpanStatusCode.OK });
      return {
        isDuplicate: false,
        duplicateCheckHash
      };
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      logger.error('Error checking for duplicates', { email, phone, error });
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Mark a lead as a duplicate and link to original
   */
  async markAsDuplicate(
    duplicateLeadId: string,
    originalLeadId: string
  ): Promise<void> {
    const span = tracer.startSpan('deduplication.markAsDuplicate');

    try {
      await Lead.findByIdAndUpdate(duplicateLeadId, {
        isDuplicate: true,
        originalLeadId
      });

      // Send duplicate event to Kafka
      await kafkaProducer.sendLeadDuplicateEvent(duplicateLeadId, originalLeadId);

      logger.info('Lead marked as duplicate', {
        duplicateLeadId,
        originalLeadId
      });

      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      logger.error('Error marking lead as duplicate', {
        duplicateLeadId,
        originalLeadId,
        error
      });
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Merge duplicate lead data into original lead
   * Updates original lead with any new information from duplicate
   */
  async mergeDuplicateData(
    originalLeadId: string,
    duplicateLeadId: string
  ): Promise<ILead> {
    const span = tracer.startSpan('deduplication.mergeDuplicateData');

    try {
      const originalLead = await Lead.findById(originalLeadId);
      const duplicateLead = await Lead.findById(duplicateLeadId);

      if (!originalLead || !duplicateLead) {
        throw new Error('Lead not found');
      }

      // Merge property details if duplicate has more info
      if (duplicateLead.propertyDetails) {
        originalLead.propertyDetails = {
          ...originalLead.propertyDetails,
          ...duplicateLead.propertyDetails
        };
      }

      // Add alternate phone if different
      if (
        duplicateLead.phone !== originalLead.phone &&
        !originalLead.alternatePhone
      ) {
        originalLead.alternatePhone = duplicateLead.phone;
      }

      // Merge tags
      if (duplicateLead.tags && duplicateLead.tags.length > 0) {
        originalLead.tags = [
          ...new Set([...(originalLead.tags || []), ...duplicateLead.tags])
        ];
      }

      // Append notes
      if (duplicateLead.notes) {
        originalLead.notes = originalLead.notes
          ? `${originalLead.notes}\n\n[Merged from duplicate]: ${duplicateLead.notes}`
          : duplicateLead.notes;
      }

      // Update lead source if duplicate came from different source
      if (
        duplicateLead.leadSource.source !== originalLead.leadSource.source
      ) {
        if (!originalLead.notes) {
          originalLead.notes = '';
        }
        originalLead.notes += `\n\nAlso received from ${duplicateLead.leadSource.source} on ${duplicateLead.leadSource.receivedAt}`;
      }

      await originalLead.save();

      logger.info('Duplicate lead data merged', {
        originalLeadId,
        duplicateLeadId
      });

      span.setStatus({ code: SpanStatusCode.OK });
      return originalLead;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      logger.error('Error merging duplicate data', {
        originalLeadId,
        duplicateLeadId,
        error
      });
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Find all duplicates for a given lead
   */
  async findDuplicates(leadId: string): Promise<ILead[]> {
    const span = tracer.startSpan('deduplication.findDuplicates');

    try {
      const lead = await Lead.findById(leadId);
      if (!lead) {
        throw new Error('Lead not found');
      }

      const duplicates = await Lead.find({
        _id: { $ne: leadId },
        $or: [
          { email: lead.email },
          { phone: lead.phone },
          { originalLeadId: leadId }
        ]
      });

      logger.debug('Found duplicates', {
        leadId,
        duplicateCount: duplicates.length
      });

      span.setStatus({ code: SpanStatusCode.OK });
      return duplicates;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      logger.error('Error finding duplicates', { leadId, error });
      throw error;
    } finally {
      span.end();
    }
  }
}

export default new DeduplicationService();
