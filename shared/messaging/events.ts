/**
 * Event type definitions for the Next Level Real Estate platform
 * All events follow the format: {domain}.{entity}.{action}
 */

/**
 * Base event interface
 */
export interface BaseEvent {
  eventId: string;
  eventType: string;
  timestamp: Date;
  version: string;
  source: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

/**
 * Lead events
 */
export enum LeadEventType {
  RECEIVED = 'lead.received',
  QUALIFIED = 'lead.qualified',
  DISQUALIFIED = 'lead.disqualified',
  ASSIGNED = 'lead.assigned',
  UPDATED = 'lead.updated',
  STATUS_CHANGED = 'lead.status_changed',
  DELETED = 'lead.deleted',
}

export interface LeadReceivedEvent extends BaseEvent {
  eventType: LeadEventType.RECEIVED;
  data: {
    leadId: string;
    source: string;
    sourceId?: string;
    contactInfo: {
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
    };
    propertyInfo?: any;
  };
}

export interface LeadQualifiedEvent extends BaseEvent {
  eventType: LeadEventType.QUALIFIED;
  data: {
    leadId: string;
    qualificationScore: number;
    qualificationStatus: string;
    motivationLevel: string;
  };
}

/**
 * Call events
 */
export enum CallEventType {
  INITIATED = 'call.initiated',
  ANSWERED = 'call.answered',
  COMPLETED = 'call.completed',
  FAILED = 'call.failed',
  TRANSCRIPT_READY = 'call.transcript_ready',
  ANALYZED = 'call.analyzed',
}

export interface CallInitiatedEvent extends BaseEvent {
  eventType: CallEventType.INITIATED;
  data: {
    callId: string;
    leadId: string;
    contactPhone: string;
    direction: 'inbound' | 'outbound';
    callType: 'manual' | 'automated' | 'agent';
  };
}

export interface CallCompletedEvent extends BaseEvent {
  eventType: CallEventType.COMPLETED;
  data: {
    callId: string;
    leadId: string;
    duration: number;
    outcome: string;
    sentiment?: string;
    appointmentScheduled?: boolean;
  };
}

export interface CallAnalyzedEvent extends BaseEvent {
  eventType: CallEventType.ANALYZED;
  data: {
    callId: string;
    leadId: string;
    sentiment: any;
    intent: any;
    quality: any;
  };
}

/**
 * Campaign events
 */
export enum CampaignEventType {
  CREATED = 'campaign.created',
  STARTED = 'campaign.started',
  PAUSED = 'campaign.paused',
  COMPLETED = 'campaign.completed',
  UPDATED = 'campaign.updated',
  METRICS_UPDATED = 'campaign.metrics_updated',
}

export interface CampaignStartedEvent extends BaseEvent {
  eventType: CampaignEventType.STARTED;
  data: {
    campaignId: string;
    name: string;
    type: string;
    targetingRules: any;
  };
}

export interface CampaignMetricsUpdatedEvent extends BaseEvent {
  eventType: CampaignEventType.METRICS_UPDATED;
  data: {
    campaignId: string;
    metrics: {
      leadsTargeted: number;
      callsAttempted: number;
      callsConnected: number;
      leadsQualified: number;
      conversions: number;
    };
  };
}

/**
 * Property events
 */
export enum PropertyEventType {
  CREATED = 'property.created',
  UPDATED = 'property.updated',
  VALUATION_UPDATED = 'property.valuation_updated',
  ANALYSIS_COMPLETED = 'property.analysis_completed',
}

export interface PropertyValuationUpdatedEvent extends BaseEvent {
  eventType: PropertyEventType.VALUATION_UPDATED;
  data: {
    propertyId: string;
    leadId?: string;
    valuation: {
      estimatedValue: number;
      confidence: string;
      valuationMethod: string;
    };
  };
}

export interface PropertyAnalysisCompletedEvent extends BaseEvent {
  eventType: PropertyEventType.ANALYSIS_COMPLETED;
  data: {
    propertyId: string;
    leadId?: string;
    arv?: any;
    investmentAnalysis?: any;
    wholesalePotential?: string;
  };
}

/**
 * Agent events
 */
export enum AgentEventType {
  TASK_STARTED = 'agent.task_started',
  TASK_COMPLETED = 'agent.task_completed',
  TASK_FAILED = 'agent.task_failed',
  DECISION_MADE = 'agent.decision_made',
  KNOWLEDGE_UPDATED = 'agent.knowledge_updated',
  ERROR = 'agent.error',
}

export interface AgentTaskCompletedEvent extends BaseEvent {
  eventType: AgentEventType.TASK_COMPLETED;
  data: {
    agentId: string;
    agentType: string;
    taskId: string;
    taskType: string;
    result: any;
  };
}

export interface AgentKnowledgeUpdatedEvent extends BaseEvent {
  eventType: AgentEventType.KNOWLEDGE_UPDATED;
  data: {
    agentId: string;
    agentType: string;
    updateId: string;
    category: string;
    source: string;
    importance: number;
  };
}

/**
 * System events
 */
export enum SystemEventType {
  HEALTH_CHECK = 'system.health_check',
  ERROR = 'system.error',
  ALERT = 'system.alert',
}

/**
 * Union type of all events
 */
export type PlatformEvent =
  | LeadReceivedEvent
  | LeadQualifiedEvent
  | CallInitiatedEvent
  | CallCompletedEvent
  | CallAnalyzedEvent
  | CampaignStartedEvent
  | CampaignMetricsUpdatedEvent
  | PropertyValuationUpdatedEvent
  | PropertyAnalysisCompletedEvent
  | AgentTaskCompletedEvent
  | AgentKnowledgeUpdatedEvent;

/**
 * Event type guard helpers
 */
export function isLeadEvent(event: BaseEvent): event is LeadReceivedEvent | LeadQualifiedEvent {
  return event.eventType.startsWith('lead.');
}

export function isCallEvent(event: BaseEvent): event is CallInitiatedEvent | CallCompletedEvent | CallAnalyzedEvent {
  return event.eventType.startsWith('call.');
}

export function isCampaignEvent(event: BaseEvent): event is CampaignStartedEvent | CampaignMetricsUpdatedEvent {
  return event.eventType.startsWith('campaign.');
}

export function isPropertyEvent(event: BaseEvent): event is PropertyValuationUpdatedEvent | PropertyAnalysisCompletedEvent {
  return event.eventType.startsWith('property.');
}

export function isAgentEvent(event: BaseEvent): event is AgentTaskCompletedEvent | AgentKnowledgeUpdatedEvent {
  return event.eventType.startsWith('agent.');
}

/**
 * Topic names for Kafka
 */
export const KAFKA_TOPICS = {
  LEADS: 'leads',
  CALLS: 'calls',
  CAMPAIGNS: 'campaigns',
  PROPERTIES: 'properties',
  AGENTS: 'agents',
  SYSTEM: 'system',
  DEAD_LETTER: 'dead-letter-queue',
} as const;
