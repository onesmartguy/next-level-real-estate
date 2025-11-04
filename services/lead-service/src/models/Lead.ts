import mongoose, { Schema, Document } from 'mongoose';

export interface IConsent {
  hasWrittenConsent: boolean;
  consentDate?: Date;
  consentMethod?: 'written_form' | 'email' | 'phone' | 'online_form';
  consentSource?: string;
  expiresAt?: Date;
}

export interface IDNCStatus {
  onNationalRegistry: boolean;
  internalDNC: boolean;
  lastCheckedAt: Date;
}

export interface ICallAttempt {
  date: Date;
  type: 'manual' | 'automated';
  result: string;
  duration?: number;
  notes?: string;
}

export interface IPropertyDetails {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  propertyType?: string;
  estimatedValue?: number;
  estimatedEquity?: number;
  condition?: string;
  yearBuilt?: number;
  squareFeet?: number;
}

export interface ILeadSource {
  source: 'zillow' | 'google_ads' | 'realgeeks' | 'manual' | 'other';
  sourceId?: string;
  campaignId?: string;
  adGroupId?: string;
  keyword?: string;
  receivedAt: Date;
}

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  UNQUALIFIED = 'unqualified',
  NURTURE = 'nurture',
  DEAL = 'deal',
  CLOSED = 'closed',
  LOST = 'lost'
}

export interface ILead extends Document {
  // Contact Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone?: string;

  // Lead Source
  leadSource: ILeadSource;

  // Property Information
  propertyDetails?: IPropertyDetails;

  // TCPA Compliance
  consent: IConsent;
  dncStatus: IDNCStatus;
  automatedCallsAllowed: boolean;

  // Status & Qualification
  status: LeadStatus;
  qualificationScore?: number;
  qualificationReason?: string;

  // Communication History
  callAttempts: ICallAttempt[];
  lastContactedAt?: Date;
  nextFollowUpAt?: Date;

  // Motivation & Notes
  motivation?: string;
  timeline?: string;
  notes?: string;

  // Enrichment Data
  enrichedAt?: Date;
  enrichmentData?: Record<string, any>;

  // Deduplication
  isDuplicate: boolean;
  originalLeadId?: string;
  duplicateCheckHash: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  tags?: string[];
}

const ConsentSchema = new Schema<IConsent>({
  hasWrittenConsent: { type: Boolean, required: true, default: false },
  consentDate: { type: Date },
  consentMethod: {
    type: String,
    enum: ['written_form', 'email', 'phone', 'online_form']
  },
  consentSource: { type: String },
  expiresAt: { type: Date }
}, { _id: false });

const DNCStatusSchema = new Schema<IDNCStatus>({
  onNationalRegistry: { type: Boolean, required: true, default: false },
  internalDNC: { type: Boolean, required: true, default: false },
  lastCheckedAt: { type: Date, required: true, default: Date.now }
}, { _id: false });

const CallAttemptSchema = new Schema<ICallAttempt>({
  date: { type: Date, required: true, default: Date.now },
  type: { type: String, enum: ['manual', 'automated'], required: true },
  result: { type: String, required: true },
  duration: { type: Number },
  notes: { type: String }
}, { _id: false });

const PropertyDetailsSchema = new Schema<IPropertyDetails>({
  address: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  propertyType: { type: String },
  estimatedValue: { type: Number },
  estimatedEquity: { type: Number },
  condition: { type: String },
  yearBuilt: { type: Number },
  squareFeet: { type: Number }
}, { _id: false });

const LeadSourceSchema = new Schema<ILeadSource>({
  source: {
    type: String,
    enum: ['zillow', 'google_ads', 'realgeeks', 'manual', 'other'],
    required: true
  },
  sourceId: { type: String },
  campaignId: { type: String },
  adGroupId: { type: String },
  keyword: { type: String },
  receivedAt: { type: Date, required: true, default: Date.now }
}, { _id: false });

const LeadSchema = new Schema<ILead>({
  // Contact Information
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  alternatePhone: { type: String, trim: true },

  // Lead Source
  leadSource: { type: LeadSourceSchema, required: true },

  // Property Information
  propertyDetails: { type: PropertyDetailsSchema },

  // TCPA Compliance
  consent: { type: ConsentSchema, required: true },
  dncStatus: { type: DNCStatusSchema, required: true },
  automatedCallsAllowed: { type: Boolean, required: true, default: false },

  // Status & Qualification
  status: {
    type: String,
    enum: Object.values(LeadStatus),
    required: true,
    default: LeadStatus.NEW,
    index: true
  },
  qualificationScore: { type: Number, min: 0, max: 100 },
  qualificationReason: { type: String },

  // Communication History
  callAttempts: { type: [CallAttemptSchema], default: [] },
  lastContactedAt: { type: Date },
  nextFollowUpAt: { type: Date, index: true },

  // Motivation & Notes
  motivation: { type: String },
  timeline: { type: String },
  notes: { type: String },

  // Enrichment Data
  enrichedAt: { type: Date },
  enrichmentData: { type: Schema.Types.Mixed },

  // Deduplication
  isDuplicate: { type: Boolean, required: true, default: false, index: true },
  originalLeadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
  duplicateCheckHash: { type: String, required: true, index: true },

  // Metadata
  assignedTo: { type: String },
  tags: { type: [String], default: [] }
}, {
  timestamps: true,
  collection: 'leads'
});

// Indexes for performance
LeadSchema.index({ email: 1, phone: 1 });
LeadSchema.index({ 'leadSource.source': 1, 'leadSource.receivedAt': -1 });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ status: 1, nextFollowUpAt: 1 });
LeadSchema.index({ duplicateCheckHash: 1 }, { unique: true });

// Virtual for full name
LeadSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for days since created
LeadSchema.virtual('daysSinceCreated').get(function() {
  const now = new Date();
  const created = this.createdAt;
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to check if lead can be auto-called
LeadSchema.methods.canAutoCall = function(): boolean {
  return this.automatedCallsAllowed &&
         this.consent.hasWrittenConsent &&
         !this.dncStatus.onNationalRegistry &&
         !this.dncStatus.internalDNC;
};

// Method to add call attempt
LeadSchema.methods.addCallAttempt = function(
  type: 'manual' | 'automated',
  result: string,
  duration?: number,
  notes?: string
): void {
  this.callAttempts.push({
    date: new Date(),
    type,
    result,
    duration,
    notes
  });
  this.lastContactedAt = new Date();

  if (result === 'connected' || result === 'voicemail') {
    this.status = LeadStatus.CONTACTED;
  }
};

// Static method to find duplicates
LeadSchema.statics.findDuplicates = async function(
  email: string,
  phone: string
): Promise<ILead[]> {
  return this.find({
    $or: [
      { email: email.toLowerCase() },
      { phone }
    ],
    isDuplicate: false
  }).sort({ createdAt: 1 });
};

export const Lead = mongoose.model<ILead>('Lead', LeadSchema);
