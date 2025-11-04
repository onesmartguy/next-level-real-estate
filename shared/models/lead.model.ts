import { z } from 'zod';

/**
 * TCPA consent tracking schema
 * As of January 2025, strict one-to-one consent requirements
 */
export const ConsentSchema = z.object({
  hasWrittenConsent: z.boolean(),
  consentDate: z.date().optional(),
  consentMethod: z.enum(['written_form', 'email', 'phone', 'website', 'none']),
  consentSource: z.string().optional(),
  consentText: z.string().optional(),
  expiresAt: z.date().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

/**
 * Do Not Call (DNC) status tracking
 */
export const DNCStatusSchema = z.object({
  onNationalRegistry: z.boolean().default(false),
  internalDNC: z.boolean().default(false),
  lastCheckedAt: z.date().optional(),
  dncReason: z.string().optional(),
});

/**
 * Lead source tracking
 */
export const LeadSourceSchema = z.object({
  source: z.enum(['google_ads', 'zillow', 'realgeeks', 'manual', 'referral', 'other']),
  sourceId: z.string().optional(),
  campaign: z.string().optional(),
  adGroup: z.string().optional(),
  keyword: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  receivedAt: z.date(),
});

/**
 * Contact information
 */
export const ContactInfoSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(10),
  alternatePhone: z.string().optional(),
  preferredContactMethod: z.enum(['phone', 'email', 'text']).default('phone'),
  timezone: z.string().optional(),
});

/**
 * Property information
 */
export const PropertyInfoSchema = z.object({
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  propertyType: z.enum(['single_family', 'multi_family', 'condo', 'townhouse', 'land', 'commercial', 'other']),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  squareFeet: z.number().optional(),
  lotSize: z.number().optional(),
  yearBuilt: z.number().optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor', 'unknown']).optional(),
  estimatedValue: z.number().optional(),
  mortgageBalance: z.number().optional(),
  estimatedEquity: z.number().optional(),
});

/**
 * Lead qualification data
 */
export const QualificationSchema = z.object({
  qualificationScore: z.number().min(0).max(100).optional(),
  qualificationStatus: z.enum(['unqualified', 'qualified', 'hot', 'cold', 'pending']).default('pending'),
  motivationLevel: z.enum(['high', 'medium', 'low', 'unknown']).default('unknown'),
  sellerSituation: z.string().optional(),
  timeline: z.enum(['immediate', 'within_30_days', 'within_90_days', 'flexible', 'unknown']).optional(),
  reasonForSelling: z.string().optional(),
  isMotivatedSeller: z.boolean().default(false),
});

/**
 * Call attempt tracking
 */
export const CallAttemptSchema = z.object({
  attemptedAt: z.date(),
  callType: z.enum(['manual', 'automated', 'agent']),
  result: z.enum(['connected', 'no_answer', 'busy', 'voicemail', 'disconnected', 'failed']),
  duration: z.number().optional(),
  callId: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Main Lead model
 * Central data structure for all lead management
 */
export const LeadSchema = z.object({
  // Primary identifiers
  leadId: z.string(),
  externalId: z.string().optional(),

  // Contact information
  contact: ContactInfoSchema,

  // Property information
  property: PropertyInfoSchema.optional(),

  // Lead source tracking
  source: LeadSourceSchema,

  // TCPA compliance
  consent: ConsentSchema,
  dncStatus: DNCStatusSchema,
  automatedCallsAllowed: z.boolean().default(false),

  // Qualification
  qualification: QualificationSchema,

  // Call tracking
  callAttempts: z.array(CallAttemptSchema).default([]),
  lastContactedAt: z.date().optional(),
  nextFollowUpAt: z.date().optional(),

  // Assignment
  assignedTo: z.string().optional(),
  assignedAt: z.date().optional(),

  // Status
  status: z.enum(['new', 'contacted', 'qualified', 'nurturing', 'converted', 'dead', 'unresponsive']).default('new'),
  stage: z.enum(['lead', 'prospect', 'opportunity', 'closed_won', 'closed_lost']).default('lead'),

  // Metadata
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  customFields: z.record(z.any()).optional(),

  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().optional(),
});

export type Consent = z.infer<typeof ConsentSchema>;
export type DNCStatus = z.infer<typeof DNCStatusSchema>;
export type LeadSource = z.infer<typeof LeadSourceSchema>;
export type ContactInfo = z.infer<typeof ContactInfoSchema>;
export type PropertyInfo = z.infer<typeof PropertyInfoSchema>;
export type Qualification = z.infer<typeof QualificationSchema>;
export type CallAttempt = z.infer<typeof CallAttemptSchema>;
export type Lead = z.infer<typeof LeadSchema>;

/**
 * MongoDB collection name
 */
export const LEAD_COLLECTION = 'leads';

/**
 * MongoDB indexes for optimal query performance
 */
export const LEAD_INDEXES = [
  { key: { leadId: 1 }, unique: true },
  { key: { 'contact.phone': 1 } },
  { key: { 'contact.email': 1 } },
  { key: { 'source.source': 1, 'source.receivedAt': -1 } },
  { key: { status: 1, createdAt: -1 } },
  { key: { assignedTo: 1, status: 1 } },
  { key: { nextFollowUpAt: 1 }, partialFilterExpression: { nextFollowUpAt: { $exists: true } } },
  { key: { createdAt: -1 } },
  { key: { 'qualification.qualificationStatus': 1, createdAt: -1 } },
];
