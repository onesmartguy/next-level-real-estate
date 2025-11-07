/**
 * Lead Data Interface
 * Represents a real estate lead with contact and compliance information
 */
export interface Lead {
  leadId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  source: LeadSource;
  propertyAddress?: string;
  propertyType?: string;
  estimatedEquity?: number;
  motivation?: string;
  status: LeadStatus;
  consent: ConsentInfo;
  dncStatus: DNCStatus;
  callHistory: CallHistoryEntry[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum LeadSource {
  GOOGLE_ADS = "google_ads",
  ZILLOW = "zillow",
  REALGEEKS = "realgeeks",
  MANUAL = "manual"
}

export enum LeadStatus {
  NEW = "new",
  CONTACTED = "contacted",
  QUALIFIED = "qualified",
  DISQUALIFIED = "disqualified",
  CONVERTED = "converted"
}

export interface ConsentInfo {
  hasWrittenConsent: boolean;
  consentDate?: Date;
  consentMethod?: "written_form" | "email" | "phone";
  consentSource?: string;
  expiresAt?: Date;
}

export interface DNCStatus {
  onNationalRegistry: boolean;
  internalDNC: boolean;
  lastCheckedAt?: Date;
}

export interface CallHistoryEntry {
  callSid: string;
  timestamp: Date;
  duration: number;
  outcome: string;
}
