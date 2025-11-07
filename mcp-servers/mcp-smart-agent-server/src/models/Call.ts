/**
 * Call State Interface
 * Tracks the state and metadata of outbound calls
 */
export interface Call {
  callSid: string;
  leadId?: string;
  phoneNumber: string;
  fromNumber: string;
  agentId: string;
  status: CallStatus;
  startTime?: Date;
  endTime?: Date;
  duration?: number; // in seconds
  outcome?: CallOutcome;
  recordingUrl?: string;
  transcriptUrl?: string;
  complianceCheckPassed: boolean;
  complianceDetails?: ComplianceCheckResult;
  dynamicVariables?: Record<string, any>;
  conversationStateId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum CallStatus {
  INITIATED = "initiated",
  RINGING = "ringing",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled"
}

export enum CallOutcome {
  ANSWERED = "answered",
  NO_ANSWER = "no_answer",
  BUSY = "busy",
  FAILED = "failed",
  CANCELLED = "cancelled"
}

export interface ComplianceCheckResult {
  compliant: boolean;
  dncStatus: boolean;
  consentVerified: boolean;
  callFrequencyOk: boolean;
  blockingReason?: string;
  checkTimestamp: Date;
}
