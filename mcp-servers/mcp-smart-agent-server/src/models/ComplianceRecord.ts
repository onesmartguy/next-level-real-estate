/**
 * TCPA Compliance Record Interface
 * Audit trail for all compliance checks and decisions
 */
export interface ComplianceRecord {
  recordId: string;
  leadId: string;
  phoneNumber: string;
  checkType: ComplianceCheckType;
  passed: boolean;
  dncStatus: {
    onNationalRegistry: boolean;
    onInternalList: boolean;
  };
  consentStatus: {
    hasConsent: boolean;
    consentDate?: Date;
    consentMethod?: string;
  };
  callFrequency: {
    callsInLast24Hours: number;
    callsInLast30Days: number;
    maxAllowed: number;
    withinLimits: boolean;
  };
  blockingReasons: string[];
  checkedAt: Date;
  checkedBy?: string; // service or agent identifier
  notes?: string;
}

export enum ComplianceCheckType {
  PRE_CALL = "pre_call",
  SCHEDULED = "scheduled",
  MANUAL = "manual"
}

export interface ComplianceAuditLog {
  timestamp: Date;
  action: string;
  leadId: string;
  phoneNumber: string;
  details: Record<string, any>;
}
