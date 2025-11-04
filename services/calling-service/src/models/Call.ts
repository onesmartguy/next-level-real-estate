import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  Call as ICall,
  CallSchema as CallZodSchema,
  CALL_COLLECTION,
  CALL_INDEXES,
} from '@next-level-real-estate/shared/models';

/**
 * Mongoose document interface extending base Call type
 */
export interface CallDocument extends Omit<ICall, 'createdAt' | 'updatedAt'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for Call
 */
const CallMongooseSchema = new Schema<CallDocument>(
  {
    // Primary identifiers
    callId: { type: String, required: true, unique: true, index: true },
    leadId: { type: String, required: true, index: true },
    contactPhone: { type: String, required: true, index: true },

    // Call details
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true
    },
    callType: {
      type: String,
      enum: ['manual', 'automated', 'agent'],
      required: true
    },

    // Timing
    initiatedAt: { type: Date, required: true, index: true },
    answeredAt: { type: Date },
    endedAt: { type: Date },
    duration: { type: Number },

    // Service integration
    elevenlabs: {
      conversationId: { type: String, index: true, sparse: true },
      agentId: { type: String },
      voiceId: { type: String },
      model: { type: String, default: 'flash-2.5' },
      language: { type: String },
      turnsTaken: { type: Number },
      averageLatency: { type: Number },
    },

    twilio: {
      callSid: { type: String, unique: true, sparse: true, index: true },
      accountSid: { type: String },
      fromNumber: { type: String },
      toNumber: { type: String },
      status: {
        type: String,
        enum: [
          'queued',
          'ringing',
          'in-progress',
          'completed',
          'busy',
          'failed',
          'no-answer',
          'canceled',
        ],
      },
      direction: { type: String, enum: ['inbound', 'outbound'] },
      price: { type: Number },
      priceUnit: { type: String },
    },

    // Conversation content
    transcript: {
      segments: [{
        speaker: {
          type: String,
          enum: ['agent', 'customer', 'system']
        },
        text: { type: String },
        timestamp: { type: Number },
        confidence: { type: Number },
        sentiment: {
          overall: {
            type: String,
            enum: ['very_positive', 'positive', 'neutral', 'negative', 'very_negative']
          },
          confidence: { type: Number },
          emotions: { type: Map, of: Number },
          keywords: [{ type: String }],
        },
      }],
      fullText: { type: String },
      language: { type: String, default: 'en' },
      duration: { type: Number },
    },
    recording: { type: String },

    // Analysis
    sentiment: {
      overall: {
        type: String,
        enum: ['very_positive', 'positive', 'neutral', 'negative', 'very_negative']
      },
      confidence: { type: Number },
      emotions: { type: Map, of: Number },
      keywords: [{ type: String }],
    },

    intent: {
      primary: { type: String },
      secondary: [{ type: String }],
      confidence: { type: Number },
      entities: { type: Map, of: Schema.Types.Mixed },
    },

    quality: {
      audioQuality: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor']
      },
      latency: { type: Number },
      interruptions: { type: Number, default: 0 },
      silencePercentage: { type: Number },
      talkTimeRatio: { type: Number },
    },

    // Outcome
    outcome: {
      result: {
        type: String,
        enum: [
          'qualified',
          'not_interested',
          'callback_requested',
          'voicemail',
          'wrong_number',
          'no_answer',
          'appointment_set',
          'information_provided',
          'objection',
          'other',
        ],
      },
      appointmentScheduled: { type: Boolean, default: false },
      appointmentDate: { type: Date },
      callbackRequested: { type: Boolean, default: false },
      callbackDate: { type: Date },
      nextSteps: { type: String },
      tags: [{ type: String }],
    },

    // Context used during call
    context: { type: Map, of: Schema.Types.Mixed },

    // Agent/operator
    handledBy: {
      type: String,
      enum: ['ai', 'human', 'hybrid'],
      required: true
    },
    agentId: { type: String },
    operatorId: { type: String },

    // Compliance
    consentVerified: { type: Boolean, default: false },
    recordingConsent: { type: Boolean, default: false },

    // Metadata
    notes: { type: String },
    tags: [{ type: String }],

    // Errors and issues
    errors: [{ type: String }],
  },
  {
    timestamps: true,
    collection: CALL_COLLECTION,
  }
);

// Create indexes from shared model definition
CALL_INDEXES.forEach((indexDef) => {
  CallMongooseSchema.index(indexDef.key, {
    unique: indexDef.unique,
    sparse: indexDef.sparse,
  });
});

/**
 * Static methods
 */
CallMongooseSchema.statics.findByCallId = function(callId: string) {
  return this.findOne({ callId });
};

CallMongooseSchema.statics.findByLeadId = function(leadId: string) {
  return this.find({ leadId }).sort({ initiatedAt: -1 });
};

CallMongooseSchema.statics.findByTwilioCallSid = function(callSid: string) {
  return this.findOne({ 'twilio.callSid': callSid });
};

CallMongooseSchema.statics.findByElevenLabsConversationId = function(conversationId: string) {
  return this.findOne({ 'elevenlabs.conversationId': conversationId });
};

CallMongooseSchema.statics.findActiveCalls = function() {
  return this.find({
    endedAt: { $exists: false },
  }).sort({ initiatedAt: -1 });
};

/**
 * Instance methods
 */
CallMongooseSchema.methods.markAnswered = function(answeredAt?: Date) {
  this.answeredAt = answeredAt || new Date();
  return this.save();
};

CallMongooseSchema.methods.markEnded = function(endedAt?: Date) {
  this.endedAt = endedAt || new Date();
  if (this.answeredAt) {
    this.duration = Math.floor((this.endedAt.getTime() - this.answeredAt.getTime()) / 1000);
  }
  return this.save();
};

CallMongooseSchema.methods.addTranscriptSegment = function(segment: {
  speaker: 'agent' | 'customer' | 'system';
  text: string;
  timestamp: number;
  confidence?: number;
}) {
  if (!this.transcript) {
    this.transcript = {
      segments: [],
      fullText: '',
      language: 'en',
      duration: 0,
    };
  }

  this.transcript.segments.push(segment);
  this.transcript.fullText += `${segment.speaker}: ${segment.text}\n`;

  return this.save();
};

/**
 * Model interface with static methods
 */
export interface CallModel extends Model<CallDocument> {
  findByCallId(callId: string): Promise<CallDocument | null>;
  findByLeadId(leadId: string): Promise<CallDocument[]>;
  findByTwilioCallSid(callSid: string): Promise<CallDocument | null>;
  findByElevenLabsConversationId(conversationId: string): Promise<CallDocument | null>;
  findActiveCalls(): Promise<CallDocument[]>;
}

/**
 * Export the Mongoose model
 */
export const CallModel = mongoose.model<CallDocument, CallModel>(
  'Call',
  CallMongooseSchema,
  CALL_COLLECTION
);
