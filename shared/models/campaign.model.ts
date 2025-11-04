import { z } from 'zod';

/**
 * Campaign targeting rules
 */
export const TargetingRulesSchema = z.object({
  // Geographic targeting
  states: z.array(z.string()).optional(),
  cities: z.array(z.string()).optional(),
  zipCodes: z.array(z.string()).optional(),
  radius: z.number().optional(),
  centerLat: z.number().optional(),
  centerLon: z.number().optional(),

  // Property criteria
  propertyTypes: z.array(z.string()).optional(),
  minBedrooms: z.number().optional(),
  maxBedrooms: z.number().optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  condition: z.array(z.string()).optional(),

  // Lead criteria
  sources: z.array(z.string()).optional(),
  qualificationStatuses: z.array(z.string()).optional(),
  minQualificationScore: z.number().optional(),
  motivationLevels: z.array(z.string()).optional(),

  // Exclusions
  excludeContacted: z.boolean().default(false),
  excludeRecentDays: z.number().optional(),
  excludeDNC: z.boolean().default(true),
  excludeTags: z.array(z.string()).optional(),
});

/**
 * Calling schedule
 */
export const CallingScheduleSchema = z.object({
  timezone: z.string().default('America/New_York'),
  daysOfWeek: z.array(z.number().min(0).max(6)),
  startTime: z.string(),
  endTime: z.string(),
  maxCallsPerDay: z.number().optional(),
  maxCallsPerLead: z.number().default(3),
  minDaysBetweenCalls: z.number().default(1),
});

/**
 * Conversation template
 */
export const ConversationTemplateSchema = z.object({
  templateId: z.string(),
  name: z.string(),
  greeting: z.string(),
  qualificationQuestions: z.array(z.string()).optional(),
  objectionHandling: z.record(z.string()).optional(),
  closingScript: z.string().optional(),
  voiceId: z.string().optional(),
  model: z.string().default('flash-2.5'),
  customInstructions: z.string().optional(),
});

/**
 * Campaign performance metrics
 */
export const CampaignMetricsSchema = z.object({
  leadsTargeted: z.number().default(0),
  callsAttempted: z.number().default(0),
  callsConnected: z.number().default(0),
  callsCompleted: z.number().default(0),
  averageDuration: z.number().optional(),
  leadsQualified: z.number().default(0),
  appointmentsSet: z.number().default(0),
  conversions: z.number().default(0),

  // Rates
  connectRate: z.number().optional(),
  qualificationRate: z.number().optional(),
  conversionRate: z.number().optional(),

  // Costs
  totalCost: z.number().default(0),
  costPerCall: z.number().optional(),
  costPerQualified: z.number().optional(),
  costPerConversion: z.number().optional(),

  // Quality
  averageSentiment: z.number().optional(),
  averageQuality: z.number().optional(),

  // Updated timestamp
  lastUpdated: z.date(),
});

/**
 * A/B test variant
 */
export const ABTestVariantSchema = z.object({
  variantId: z.string(),
  name: z.string(),
  percentage: z.number().min(0).max(100),
  conversationTemplate: ConversationTemplateSchema,
  metrics: CampaignMetricsSchema,
  isControl: z.boolean().default(false),
});

/**
 * Main Campaign model
 * Defines automated calling campaigns with targeting and templates
 */
export const CampaignSchema = z.object({
  // Primary identifiers
  campaignId: z.string(),
  name: z.string(),
  description: z.string().optional(),

  // Campaign type and strategy
  type: z.enum(['outbound_cold', 'outbound_warm', 'follow_up', 'nurture', 'reactivation']),
  strategy: z.enum(['wholesale', 'fix_and_flip', 'rental', 'general']).default('wholesale'),

  // Status
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed', 'archived']).default('draft'),

  // Targeting
  targetingRules: TargetingRulesSchema,

  // Schedule
  schedule: CallingScheduleSchema,
  startDate: z.date().optional(),
  endDate: z.date().optional(),

  // Conversation
  conversationTemplate: ConversationTemplateSchema,

  // A/B testing
  isABTest: z.boolean().default(false),
  abTestVariants: z.array(ABTestVariantSchema).optional(),

  // Performance
  metrics: CampaignMetricsSchema,

  // Budget and limits
  budget: z.number().optional(),
  budgetSpent: z.number().default(0),
  maxLeads: z.number().optional(),

  // Automation
  autoQualify: z.boolean().default(true),
  autoSchedule: z.boolean().default(false),
  autoFollowUp: z.boolean().default(true),

  // Owner
  createdBy: z.string(),
  assignedTo: z.array(z.string()).optional(),

  // Compliance
  complianceChecked: z.boolean().default(false),
  tcpaCompliant: z.boolean().default(false),

  // Metadata
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),

  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().optional(),
});

export type TargetingRules = z.infer<typeof TargetingRulesSchema>;
export type CallingSchedule = z.infer<typeof CallingScheduleSchema>;
export type ConversationTemplate = z.infer<typeof ConversationTemplateSchema>;
export type CampaignMetrics = z.infer<typeof CampaignMetricsSchema>;
export type ABTestVariant = z.infer<typeof ABTestVariantSchema>;
export type Campaign = z.infer<typeof CampaignSchema>;

/**
 * MongoDB collection name
 */
export const CAMPAIGN_COLLECTION = 'campaigns';

/**
 * MongoDB indexes
 */
export const CAMPAIGN_INDEXES = [
  { key: { campaignId: 1 }, unique: true },
  { key: { status: 1, startDate: 1 } },
  { key: { type: 1, status: 1 } },
  { key: { createdBy: 1, createdAt: -1 } },
  { key: { startDate: 1, endDate: 1 } },
  { key: { tags: 1 } },
  { key: { createdAt: -1 } },
];
