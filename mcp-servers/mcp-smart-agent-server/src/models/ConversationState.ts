/**
 * Conversation State Interface
 * Tracks active conversations and their context
 */
export interface ConversationState {
  conversationId: string;
  callSid: string;
  agentId: string;
  leadId?: string;
  phoneNumber: string;
  status: ConversationStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  sentiment?: ConversationSentiment;
  keyTopics?: string[];
  nextAction?: string;
  notes?: string;
  variables: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum ConversationStatus {
  INITIATED = "initiated",
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
  FAILED = "failed"
}

export enum ConversationSentiment {
  VERY_NEGATIVE = "very_negative",
  NEGATIVE = "negative",
  NEUTRAL = "neutral",
  POSITIVE = "positive",
  VERY_POSITIVE = "very_positive"
}

export interface DynamicVariable {
  key: string;
  value: any;
  type: "string" | "number" | "boolean" | "object";
  injectedAt: Date;
}
