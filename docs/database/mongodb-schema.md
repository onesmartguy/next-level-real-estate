# MongoDB Database Schema

## Overview

MongoDB serves as the primary datastore for the Next Level Real Estate platform, storing leads, campaigns, calls, analytics, and agent state. The schema is designed for:

- **Flexibility**: Dynamic property data from multiple sources
- **Performance**: Optimized indexes for real-time querying
- **Compliance**: TCPA consent tracking with audit trails
- **Scalability**: Sharded collections for high-volume data

## Database Structure

```
next_level_real_estate (Database)
├── leads (Collection)
├── contacts (Collection)
├── properties (Collection)
├── campaigns (Collection)
├── calls (Collection)
├── call_transcripts (Collection)
├── consent_logs (Collection)
├── dnc_registry (Collection)
├── agent_state (Collection)
├── knowledge_base (Collection)
├── analytics_events (Collection)
└── system_config (Collection)
```

## Collections

### 1. leads Collection

**Purpose**: Store all lead information with source attribution and qualification status.

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),

  // Source tracking
  source: "google_ads", // google_ads, zillow, realgeeks
  externalId: "GGL-12345678",
  receivedAt: ISODate("2025-10-24T15:30:00Z"),

  // Contact information
  contact: {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+15551234567",
    alternatePhone: "+15559876543",
    address: {
      street: "456 Buyer Lane",
      city: "Seattle",
      state: "WA",
      zipCode: "98101"
    }
  },

  // Property of interest
  propertyId: ObjectId("507f1f77bcf86cd799439012"),
  propertyAddress: "123 Main St, Seattle, WA 98101",

  // Lead intent & context
  intent: {
    type: "seller", // buyer, seller, investor
    message: "Need to sell quickly due to relocation",
    urgency: "high", // low, medium, high
    timeframe: "30_days",
    motivation: ["relocation", "financial_hardship"]
  },

  // Qualification
  qualification: {
    score: 0.85, // 0-1
    qualified: true,
    qualifiedAt: ISODate("2025-10-24T15:32:00Z"),
    criteria: {
      hasMinEquity: true,
      withinBudget: true,
      rightPropertyType: true,
      isMotivated: true
    },
    estimatedValue: 350000,
    estimatedEquity: 0.25,
    wholesalePotential: "high" // low, medium, high
  },

  // Campaign assignment
  campaignId: ObjectId("507f1f77bcf86cd799439013"),
  campaignName: "Wholesale - Motivated Sellers Q4 2025",
  assignedAt: ISODate("2025-10-24T15:32:30Z"),

  // Contact history
  contactAttempts: [
    {
      attemptId: ObjectId("507f1f77bcf86cd799439014"),
      timestamp: ISODate("2025-10-24T15:35:00Z"),
      type: "automated_call",
      callId: ObjectId("507f1f77bcf86cd799439015"),
      outcome: "answered",
      duration: 420, // seconds
      sentiment: 0.65,
      notes: "Interested in cash offer. Scheduled site visit for 10/26."
    }
  ],
  lastContactedAt: ISODate("2025-10-24T15:35:00Z"),
  nextFollowUp: ISODate("2025-10-26T10:00:00Z"),

  // TCPA Compliance
  consent: {
    hasWrittenConsent: true,
    consentMethod: "web_form", // web_form, email, phone, written
    consentDate: ISODate("2025-10-24T15:00:00Z"),
    consentSource: "zillow_lead_form",
    consentText: "I agree to receive calls and texts about my property inquiry",
    expiresAt: ISODate("2026-10-24T15:00:00Z"), // 1 year
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0...",
    automatedCallsAllowed: true,
    textMessagesAllowed: true
  },

  dncStatus: {
    onNationalRegistry: false,
    internalDNC: false,
    lastCheckedAt: ISODate("2025-10-24T15:31:00Z"),
    checkedBy: "system",
    notes: null
  },

  // Lead lifecycle
  status: "active", // new, contacted, qualified, nurturing, converted, lost, dnc
  stage: "negotiation", // new, contacted, qualified, site_visit, offer_made, negotiation, closed, lost

  // Enrichment data
  enrichment: {
    creditScore: 720,
    estimatedIncome: 85000,
    homeOwnership: true,
    propertyCount: 1
  },

  // Tags and categorization
  tags: ["motivated_seller", "wholesale", "quick_close"],

  // Audit trail
  createdAt: ISODate("2025-10-24T15:30:00Z"),
  updatedAt: ISODate("2025-10-24T15:35:00Z"),
  createdBy: "system",
  updatedBy: "agent_conversation_ai"
}
```

**Indexes**:
```javascript
db.leads.createIndex({ "contact.email": 1 });
db.leads.createIndex({ "contact.phone": 1 });
db.leads.createIndex({ source: 1, externalId: 1 }, { unique: true });
db.leads.createIndex({ status: 1, nextFollowUp: 1 });
db.leads.createIndex({ "qualification.qualified": 1, "qualification.score": -1 });
db.leads.createIndex({ receivedAt: -1 });
db.leads.createIndex({ "consent.hasWrittenConsent": 1, "dncStatus.onNationalRegistry": 1 });
```

### 2. properties Collection

**Purpose**: Store property details with market intelligence and valuation data.

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439012"),

  // Property identification
  address: {
    street: "123 Main St",
    unit: null,
    city: "Seattle",
    state: "WA",
    zipCode: "98101",
    county: "King",
    formatted: "123 Main St, Seattle, WA 98101"
  },

  // External IDs
  zpid: "48749425", // Zillow Property ID
  parcelId: "1234567890",
  mlsNumber: "NW987654",

  // Property details
  type: "single_family", // single_family, condo, townhouse, multi_family
  bedrooms: 3,
  bathrooms: 2.5,
  squareFeet: 2100,
  lotSize: 7500,
  yearBuilt: 1985,
  stories: 2,
  garage: "attached_2_car",

  // Condition & features
  condition: "needs_work", // excellent, good, fair, needs_work, poor
  features: [
    "hardwood_floors",
    "updated_kitchen",
    "finished_basement",
    "fenced_yard"
  ],
  repairNeeds: [
    { item: "roof", severity: "moderate", estimatedCost: 8000 },
    { item: "hvac", severity: "minor", estimatedCost: 2500 },
    { item: "plumbing", severity: "minor", estimatedCost: 1500 }
  ],
  totalRepairCost: 12000,

  // Valuation
  valuation: {
    listPrice: 425000,
    zestimate: 438000,
    rentZestimate: 2800,
    taxAssessedValue: 410000,
    afterRepairValue: 485000, // ARV
    wholesalePrice: 340000, // 70% ARV - repairs
    profitMargin: 133000, // ARV - repairs - wholesale
    updatedAt: ISODate("2025-10-24T12:00:00Z")
  },

  // Market comparables
  comparables: [
    {
      address: "125 Main St, Seattle, WA 98101",
      distance: 0.1, // miles
      soldDate: ISODate("2025-09-15T00:00:00Z"),
      soldPrice: 455000,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 2000,
      pricePerSqFt: 227.5
    },
    {
      address: "789 Oak Ave, Seattle, WA 98101",
      distance: 0.3,
      soldDate: ISODate("2025-08-20T00:00:00Z"),
      soldPrice: 470000,
      bedrooms: 3,
      bathrooms: 2.5,
      squareFeet: 2200,
      pricePerSqFt: 213.6
    }
  ],

  // Market intelligence
  marketData: {
    medianHomePrice: 525000,
    avgDaysOnMarket: 18,
    pricePerSqFt: 250,
    inventoryLevel: "low",
    marketTrend: "appreciating", // appreciating, stable, declining
    demandScore: 0.82, // 0-1
    neighborhoodRating: "A-"
  },

  // Ownership & history
  owner: {
    name: "John Doe",
    ownedSince: ISODate("2010-03-15T00:00:00Z"),
    ownershipYears: 15.6,
    lastSalePrice: 285000,
    equity: 153000,
    equityPercent: 0.35
  },

  liens: [
    { type: "mortgage", amount: 272000, holder: "First National Bank" }
  ],

  // Listing information
  listing: {
    active: true,
    listedDate: ISODate("2025-10-15T00:00:00Z"),
    daysOnMarket: 9,
    listingUrl: "https://www.zillow.com/homedetails/...",
    photos: [
      "https://photos.zillowstatic.com/...",
      "https://photos.zillowstatic.com/..."
    ],
    virtualTourUrl: null
  },

  // Lead associations
  leadIds: [ObjectId("507f1f77bcf86cd799439011")],

  // Audit trail
  createdAt: ISODate("2025-10-24T15:30:00Z"),
  updatedAt: ISODate("2025-10-24T15:30:00Z"),
  dataSource: "zillow"
}
```

**Indexes**:
```javascript
db.properties.createIndex({ "address.formatted": 1 }, { unique: true });
db.properties.createIndex({ zpid: 1 });
db.properties.createIndex({ "address.zipCode": 1, type: 1 });
db.properties.createIndex({ "valuation.wholesalePrice": 1 });
db.properties.createIndex({ "marketData.marketTrend": 1, "marketData.demandScore": -1 });
db.properties.createIndex({ leadIds: 1 });
```

### 3. calls Collection

**Purpose**: Track all outbound and inbound calls with outcomes and metadata.

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439015"),

  // Call identification
  callSid: "CA1234567890abcdef", // Twilio Call SID
  conversationId: "conv_xyz789", // ElevenLabs Conversation ID

  // Participants
  leadId: ObjectId("507f1f77bcf86cd799439011"),
  contactPhone: "+15551234567",
  fromPhone: "+15559998888", // Our Twilio number

  // Call timing
  initiatedAt: ISODate("2025-10-24T15:35:00Z"),
  answeredAt: ISODate("2025-10-24T15:35:03Z"),
  endedAt: ISODate("2025-10-24T15:42:00Z"),
  duration: 420, // seconds
  talkTime: 390, // actual conversation time

  // Call type & method
  direction: "outbound",
  type: "automated", // automated, manual
  campaignId: ObjectId("507f1f77bcf86cd799439013"),

  // Call outcome
  status: "completed", // initiated, ringing, answered, completed, busy, no_answer, failed
  outcome: "qualified", // qualified, not_interested, callback, voicemail, wrong_number
  disposition: "interested",

  // AI conversation metadata
  conversationMetrics: {
    agentTalkTime: 180, // seconds
    userTalkTime: 210,
    interruptionCount: 3,
    turnCount: 24,
    avgTurnDuration: 16.25, // seconds
    silenceDuration: 30
  },

  // Sentiment analysis
  sentiment: {
    overall: 0.65, // -1 to 1
    timeline: [
      { timestamp: 0, score: 0.3 },
      { timestamp: 60, score: 0.5 },
      { timestamp: 120, score: 0.7 },
      { timestamp: 180, score: 0.65 }
    ],
    emotions: {
      positive: 0.65,
      neutral: 0.25,
      negative: 0.10
    }
  },

  // Key moments
  keyMoments: [
    {
      type: "objection",
      timestamp: 45,
      userText: "I'm not sure about selling right now...",
      agentResponse: "I understand. What would need to change for you to consider it?",
      resolved: true
    },
    {
      type: "commitment",
      timestamp: 360,
      userText: "Yes, let's schedule a site visit for Thursday at 2pm",
      agentResponse: "Perfect! I'll send you a calendar invite for Thursday, October 26th at 2pm."
    }
  ],

  // Extracted information
  extractedInfo: {
    propertyCondition: "needs_work",
    motivationFactors: ["relocation", "time_sensitive"],
    timeframe: "30_days",
    priceExpectation: 400000,
    competingOffers: false,
    agentInvolved: false,
    decisionMakers: "spouse_approval_needed"
  },

  // Follow-up actions
  followUpActions: [
    {
      type: "site_visit",
      scheduledFor: ISODate("2025-10-26T14:00:00Z"),
      notes: "Bring comps and repair cost estimates",
      completed: false
    },
    {
      type: "send_email",
      scheduledFor: ISODate("2025-10-24T16:00:00Z"),
      template: "post_call_summary",
      completed: true
    }
  ],

  // Recording & transcript
  recordingUrl: "https://api.twilio.com/recordings/RE1234567890",
  recordingDuration: 420,
  transcriptId: ObjectId("507f1f77bcf86cd799439016"),

  // TCPA compliance
  consentVerified: true,
  dncChecked: true,
  complianceNotes: "Written consent on file, DNC check passed",

  // Quality scoring
  qualityScore: 0.88, // 0-1, based on conversation quality
  qualityFactors: {
    clearCommunication: 0.90,
    activeListening: 0.85,
    objectionHandling: 0.90,
    outcomeAchieved: 0.85
  },

  // Cost tracking
  cost: {
    twilioMinutes: 7.0,
    twilioRate: 0.013,
    elevenLabsCharacters: 2400,
    elevenLabsRate: 0.00018,
    totalCost: 0.52 // $0.091 + $0.432
  },

  // Audit trail
  createdAt: ISODate("2025-10-24T15:35:00Z"),
  updatedAt: ISODate("2025-10-24T15:42:00Z"),
  createdBy: "calling_service",
  updatedBy: "analytics_service"
}
```

**Indexes**:
```javascript
db.calls.createIndex({ leadId: 1, initiatedAt: -1 });
db.calls.createIndex({ callSid: 1 }, { unique: true });
db.calls.createIndex({ status: 1, outcome: 1 });
db.calls.createIndex({ initiatedAt: -1 });
db.calls.createIndex({ "sentiment.overall": -1 });
db.calls.createIndex({ campaignId: 1, initiatedAt: -1 });
```

### 4. call_transcripts Collection

**Purpose**: Store full conversation transcripts with speaker attribution.

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439016"),

  callId: ObjectId("507f1f77bcf86cd799439015"),
  leadId: ObjectId("507f1f77bcf86cd799439011"),

  // Transcript
  messages: [
    {
      speaker: "agent",
      text: "Hi John, this is calling from Next Level Real Estate. How are you doing today?",
      timestamp: 0,
      sentiment: 0.5,
      confidence: 0.95
    },
    {
      speaker: "user",
      text: "I'm doing well, thanks. What's this about?",
      timestamp: 4.2,
      sentiment: 0.3,
      confidence: 0.98
    },
    {
      speaker: "agent",
      text: "I'm reaching out about your property at 123 Main Street. I see you recently listed it. Do you have a few minutes to chat?",
      timestamp: 7.5,
      sentiment: 0.6,
      confidence: 0.96
    }
    // ... more messages
  ],

  // Full text
  fullTranscript: "Agent: Hi John, this is calling from...\nUser: I'm doing well...",

  // Metadata
  totalMessages: 24,
  agentMessages: 12,
  userMessages: 12,
  duration: 420,

  // Analysis
  topics: ["property_condition", "price_negotiation", "timeline", "site_visit"],
  keywords: ["sell", "cash offer", "repairs", "quick close", "schedule"],

  // Quality
  transcriptionQuality: 0.96, // average confidence

  createdAt: ISODate("2025-10-24T15:42:00Z")
}
```

**Indexes**:
```javascript
db.call_transcripts.createIndex({ callId: 1 }, { unique: true });
db.call_transcripts.createIndex({ leadId: 1 });
db.call_transcripts.createIndex({ topics: 1 });
```

### 5. campaigns Collection

**Purpose**: Define marketing campaigns with targeting and automation rules.

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439013"),

  name: "Wholesale - Motivated Sellers Q4 2025",
  description: "Target motivated sellers with quick close potential",

  // Campaign settings
  type: "wholesale", // wholesale, fix_flip, rental
  status: "active", // draft, active, paused, completed

  // Targeting criteria
  targeting: {
    leadSources: ["zillow", "google_ads", "realgeeks"],
    intent: ["seller"],
    qualification: {
      minScore: 0.7,
      minEquity: 0.20,
      maxPrice: 500000,
      propertyTypes: ["single_family", "condo", "townhouse"]
    },
    geography: {
      states: ["WA", "OR"],
      cities: ["Seattle", "Portland", "Tacoma"],
      zipCodes: []
    },
    motivationFactors: ["relocation", "financial_hardship", "inherited", "probate"]
  },

  // Campaign workflow
  workflow: {
    // Step 1: Initial call
    initialContact: {
      method: "automated_call",
      timing: "within_5_minutes", // from lead receipt
      maxAttempts: 3,
      retryDelay: 3600 // 1 hour
    },

    // Step 2: Follow-up sequence
    followUp: [
      {
        delay: 86400, // 24 hours
        method: "email",
        template: "follow_up_day_1"
      },
      {
        delay: 259200, // 3 days
        method: "sms",
        template: "follow_up_day_3"
      },
      {
        delay: 604800, // 7 days
        method: "automated_call",
        template: "follow_up_call_week_1"
      }
    ],

    // Step 3: Nurture sequence (if not qualified)
    nurture: {
      enabled: true,
      frequency: "weekly",
      duration: 90, // days
      content: ["market_updates", "success_stories", "tips"]
    }
  },

  // Conversation strategy
  conversationStrategy: {
    voiceId: "voice_abc123",
    openingScript: "Hi {firstName}, this is calling from Next Level Real Estate...",
    qualificationQuestions: [
      "What's your timeline for selling?",
      "What condition is the property in?",
      "Are there any repairs needed?",
      "What are you hoping to get for the property?"
    ],
    objectionHandlers: {
      "not_interested": "I understand. Just so you know...",
      "need_time": "Of course. When would be a better time?",
      "already_listed": "That's great! How's that going?"
    },
    callToAction: "Would you be open to a quick site visit this week?"
  },

  // Performance metrics
  metrics: {
    leadsReceived: 156,
    leadsContacted: 142,
    conversationsCompleted: 98,
    qualified: 47,
    siteVisits: 23,
    offersExtended: 12,
    dealsClosed: 5,

    avgQualificationScore: 0.72,
    avgSentiment: 0.58,
    avgCallDuration: 385,

    conversionRate: 0.031, // deals closed / leads received
    costPerLead: 45.50,
    costPerDeal: 1420,

    totalRevenue: 147000,
    totalCost: 7100,
    roi: 19.7 // (revenue - cost) / cost
  },

  // Budget & limits
  budget: {
    totalBudget: 10000,
    spent: 7100,
    costPerCall: 0.50,
    maxCallsPerDay: 50,
    maxLeadsPerDay: 100
  },

  // Schedule
  schedule: {
    startDate: ISODate("2025-10-01T00:00:00Z"),
    endDate: ISODate("2025-12-31T23:59:59Z"),
    callingHours: {
      timezone: "America/Los_Angeles",
      monday: { start: "09:00", end: "18:00" },
      tuesday: { start: "09:00", end: "18:00" },
      wednesday: { start: "09:00", end: "18:00" },
      thursday: { start: "09:00", end: "18:00" },
      friday: { start: "09:00", end: "18:00" },
      saturday: { start: "10:00", end: "14:00" },
      sunday: null // No calls on Sunday
    }
  },

  // Team assignment
  assignedTo: [
    { userId: ObjectId("..."), role: "campaign_manager" },
    { userId: ObjectId("..."), role: "closer" }
  ],

  // Audit trail
  createdAt: ISODate("2025-09-25T00:00:00Z"),
  updatedAt: ISODate("2025-10-24T15:00:00Z"),
  createdBy: ObjectId("..."),
  updatedBy: ObjectId("...")
}
```

**Indexes**:
```javascript
db.campaigns.createIndex({ status: 1, type: 1 });
db.campaigns.createIndex({ "schedule.startDate": 1, "schedule.endDate": 1 });
db.campaigns.createIndex({ "targeting.geography.states": 1 });
```

### 6. consent_logs Collection

**Purpose**: Immutable audit trail for all consent-related events (TCPA compliance).

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439020"),

  leadId: ObjectId("507f1f77bcf86cd799439011"),
  phone: "+15551234567",
  email: "john.doe@example.com",

  eventType: "consent_granted", // consent_granted, consent_revoked, dnc_added, dnc_removed

  consentDetails: {
    method: "web_form",
    source: "zillow_lead_form",
    consentText: "I agree to receive calls and texts about my property inquiry",
    automatedCallsAllowed: true,
    textMessagesAllowed: true,
    expiresAt: ISODate("2026-10-24T15:00:00Z")
  },

  // Request metadata
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  referrer: "https://www.zillow.com/...",

  // Audit
  timestamp: ISODate("2025-10-24T15:00:00Z"),
  recordedBy: "system",

  // Verification
  verified: true,
  verifiedAt: ISODate("2025-10-24T15:00:05Z"),
  verificationMethod: "double_opt_in_email"
}
```

**Indexes**:
```javascript
db.consent_logs.createIndex({ leadId: 1, timestamp: -1 });
db.consent_logs.createIndex({ phone: 1, timestamp: -1 });
db.consent_logs.createIndex({ eventType: 1, timestamp: -1 });
```

### 7. agent_state Collection

**Purpose**: Store AI agent state, decision history, and performance metrics.

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439025"),

  agentType: "conversation_ai", // architect, conversation_ai, sales, realty
  agentId: "agent_conv_001",

  // Current state
  state: {
    lastKnowledgeRefresh: ISODate("2025-10-24T12:00:00Z"),
    activeContexts: 3,
    cachedPrompts: 5,
    cacheHitRate: 0.92
  },

  // Decision history (last 100)
  decisionHistory: [
    {
      timestamp: ISODate("2025-10-24T15:35:00Z"),
      decision: "select_objection_handler",
      input: "User said: I'm not sure about selling right now",
      reasoning: "Detected hesitation objection, retrieved top handler from knowledge base",
      output: "I understand. What would need to change for you to consider it?",
      outcome: "successful",
      confidence: 0.89
    }
  ],

  // Performance metrics
  metrics: {
    totalRequests: 1247,
    successfulRequests: 1198,
    failedRequests: 49,
    avgResponseTime: 1250, // ms
    avgConfidence: 0.84,

    knowledgeBaseHits: 1089,
    knowledgeBaseMisses: 158,
    knowledgeBaseHitRate: 0.87,

    decisionsOverridden: 12,
    feedbackIncorporated: 45,

    costSavings: 1450.00, // from prompt caching
    totalCost: 156.50
  },

  // Learning & improvement
  learnings: [
    {
      timestamp: ISODate("2025-10-24T16:00:00Z"),
      source: "call_feedback",
      callId: ObjectId("507f1f77bcf86cd799439015"),
      insight: "Using specific dates ('next Tuesday') vs vague timeframes increased commitment rate",
      incorporated: true,
      improvedMetric: "commitment_rate",
      improvement: 0.15 // 15% increase
    }
  ],

  // Knowledge base version tracking
  knowledgeVersions: {
    "conversation-patterns": "v1.24",
    "objection-handlers": "v2.03",
    "market-intelligence": "v3.11"
  },

  updatedAt: ISODate("2025-10-24T16:00:00Z")
}
```

**Indexes**:
```javascript
db.agent_state.createIndex({ agentType: 1, agentId: 1 }, { unique: true });
db.agent_state.createIndex({ "metrics.avgResponseTime": 1 });
db.agent_state.createIndex({ updatedAt: -1 });
```

## Aggregation Pipelines

### Real-Time Analytics Dashboard

```javascript
// Campaign performance summary
db.calls.aggregate([
  {
    $match: {
      campaignId: ObjectId("507f1f77bcf86cd799439013"),
      initiatedAt: { $gte: ISODate("2025-10-01T00:00:00Z") }
    }
  },
  {
    $group: {
      _id: "$outcome",
      count: { $sum: 1 },
      avgDuration: { $avg: "$duration" },
      avgSentiment: { $avg: "$sentiment.overall" },
      totalCost: { $sum: "$cost.totalCost" }
    }
  },
  {
    $sort: { count: -1 }
  }
]);

// Lead qualification funnel
db.leads.aggregate([
  {
    $match: {
      receivedAt: { $gte: ISODate("2025-10-01T00:00:00Z") }
    }
  },
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 },
      avgScore: { $avg: "$qualification.score" }
    }
  },
  {
    $project: {
      status: "$_id",
      count: 1,
      avgScore: { $round: ["$avgScore", 2] },
      _id: 0
    }
  }
]);
```

## Data Retention & Archival

```javascript
// Archive old call transcripts (> 1 year)
db.call_transcripts.aggregate([
  {
    $match: {
      createdAt: { $lt: ISODate("2024-10-24T00:00:00Z") }
    }
  },
  {
    $out: "call_transcripts_archive_2024"
  }
]);

// Delete archived transcripts from main collection
db.call_transcripts.deleteMany({
  createdAt: { $lt: ISODate("2024-10-24T00:00:00Z") }
});
```

## Sharding Strategy

For high-volume deployments:

```javascript
// Enable sharding on database
sh.enableSharding("next_level_real_estate");

// Shard leads collection by receivedAt (time-based)
db.leads.createIndex({ receivedAt: 1 });
sh.shardCollection("next_level_real_estate.leads", { receivedAt: 1 });

// Shard calls collection by initiatedAt
db.calls.createIndex({ initiatedAt: 1 });
sh.shardCollection("next_level_real_estate.calls", { initiatedAt: 1 });
```

## Backup & Recovery

```bash
# Full database backup
mongodump --uri="mongodb://localhost:27017/next_level_real_estate" --out=/backups/$(date +%Y%m%d)

# Restore from backup
mongorestore --uri="mongodb://localhost:27017/next_level_real_estate" /backups/20251024
```

## Connection String

```bash
# Local development
MONGODB_URI=mongodb://localhost:27017/next_level_real_estate

# MongoDB Atlas (production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/next_level_real_estate?retryWrites=true&w=majority
```

## Resources

- [MongoDB Documentation](https://docs.mongodb.com/manual/)
- [Schema Design Best Practices](https://docs.mongodb.com/manual/core/data-modeling-introduction/)
- [Aggregation Pipeline](https://docs.mongodb.com/manual/aggregation/)
- [Indexes](https://docs.mongodb.com/manual/indexes/)
