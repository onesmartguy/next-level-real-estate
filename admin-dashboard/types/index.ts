/**
 * Core type definitions for Next Level Real Estate Admin Dashboard
 */

// Lead Types
export type LeadSource = 'google_ads' | 'zillow' | 'realgeeks' | 'manual' | 'referral';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted' | 'lost';
export type ConsentMethod = 'written_form' | 'email' | 'phone' | 'website';
export type CallType = 'manual' | 'automated';

export interface Lead {
  id: string;
  tenantId: string;
  source: LeadSource;
  status: LeadStatus;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  propertyAddress?: string;
  propertyType?: string;
  estimatedValue?: number;
  notes?: string;
  consent: LeadConsent;
  dncStatus: DNCStatus;
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt?: Date;
  convertedAt?: Date;
}

export interface LeadConsent {
  hasWrittenConsent: boolean;
  consentDate?: Date;
  consentMethod?: ConsentMethod;
  consentSource?: string;
  expiresAt?: Date;
}

export interface DNCStatus {
  onNationalRegistry: boolean;
  internalDNC: boolean;
  lastCheckedAt?: Date;
}

// Tenant Types
export type TenantStatus = 'active' | 'inactive' | 'trial' | 'suspended';
export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise';

export interface Tenant {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  status: TenantStatus;
  subscriptionTier: SubscriptionTier;
  apiKey: string;
  webhookUrl?: string;
  settings: TenantSettings;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt?: Date;
}

export interface TenantSettings {
  maxLeadsPerMonth: number;
  maxCallsPerMonth: number;
  enabledLeadSources: LeadSource[];
  aiCallingEnabled: boolean;
  complianceMode: 'strict' | 'standard';
  customDomain?: string;
}

// Call Types
export type CallStatus = 'initiated' | 'ringing' | 'answered' | 'completed' | 'failed' | 'busy' | 'no_answer';
export type CallOutcome = 'connected' | 'voicemail' | 'no_answer' | 'busy' | 'failed' | 'dnc_request';
export type SentimentScore = 'positive' | 'neutral' | 'negative';

export interface Call {
  id: string;
  tenantId: string;
  leadId: string;
  phoneNumber: string;
  status: CallStatus;
  outcome?: CallOutcome;
  duration?: number; // in seconds
  recordingUrl?: string;
  transcriptUrl?: string;
  sentiment?: SentimentScore;
  sentimentScore?: number; // 0-100
  aiInsights?: string;
  startedAt: Date;
  endedAt?: Date;
  createdAt: Date;
}

// Analytics Types
export interface DashboardMetrics {
  totalLeads: number;
  leadsChange: number; // percentage change from previous period
  activeTenants: number;
  tenantsChange: number;
  apiCallsToday: number;
  apiCallsChange: number;
  conversionRate: number;
  conversionRateChange: number;
  averageResponseTime: number; // in minutes
  callConnectRate: number; // percentage
}

export interface LeadTrendData {
  date: string;
  leads: number;
  converted: number;
}

export interface LeadsBySource {
  source: LeadSource;
  count: number;
  percentage: number;
}

export interface ConversionFunnelData {
  stage: string;
  count: number;
  percentage: number;
}

export interface TopTenant {
  id: string;
  name: string;
  companyName: string;
  leadsCount: number;
  conversionRate: number;
  revenue: number;
  subscriptionTier: SubscriptionTier;
}

// Activity Types
export type ActivityType = 'lead_created' | 'lead_updated' | 'call_completed' | 'tenant_created' | 'system_event';

export interface Activity {
  id: string;
  type: ActivityType;
  tenantId?: string;
  leadId?: string;
  callId?: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LeadFilters extends PaginationParams {
  status?: LeadStatus;
  source?: LeadSource;
  tenantId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

// User/Auth Types
export type UserRole = 'admin' | 'manager' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  expiresAt: Date;
}

// Settings Types
export interface SystemSettings {
  maintenanceMode: boolean;
  allowSignups: boolean;
  maxTenantsPerUser: number;
  defaultSubscriptionTier: SubscriptionTier;
  tcpaComplianceEnabled: boolean;
  aiCallingEnabled: boolean;
}

// Webhook Event Types
export type WebhookEventType = 'lead.created' | 'lead.updated' | 'call.completed' | 'tenant.updated';

export interface WebhookEvent {
  id: string;
  tenantId: string;
  type: WebhookEventType;
  payload: Record<string, unknown>;
  deliveredAt?: Date;
  failedAt?: Date;
  retryCount: number;
  createdAt: Date;
}
