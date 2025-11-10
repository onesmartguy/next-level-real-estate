/**
 * MongoDB initialization script
 * Creates collections and indexes for Next Level Real Estate platform
 *
 * Usage:
 *   node mongo-init.js
 * Or from MongoDB shell:
 *   mongosh mongodb://localhost:27017/next_level_real_estate mongo-init.js
 */

// Database name
const dbName = 'next_level_real_estate';

// Switch to database
db = db.getSiblingDB(dbName);

print('Initializing MongoDB database: ' + dbName);

// Drop existing collections if they exist (only for fresh setup)
// Uncomment if you want to reset the database
// db.leads.drop();
// db.properties.drop();
// db.calls.drop();
// db.campaigns.drop();
// db.agent_states.drop();

print('Creating collections...');

// Create collections
db.createCollection('leads');
db.createCollection('properties');
db.createCollection('calls');
db.createCollection('campaigns');
db.createCollection('agent_states');
db.createCollection('contacts');
db.createCollection('call_transcripts');
db.createCollection('consent_logs');
db.createCollection('dnc_registry');
db.createCollection('knowledge_base');
db.createCollection('analytics_events');
db.createCollection('system_config');

print('Collections created successfully (12 collections)');

print('Creating indexes for leads collection...');
db.leads.createIndex({ leadId: 1 }, { unique: true });
db.leads.createIndex({ 'contact.phone': 1 });
db.leads.createIndex({ 'contact.email': 1 });
db.leads.createIndex({ 'source.source': 1, 'source.receivedAt': -1 });
db.leads.createIndex({ status: 1, createdAt: -1 });
db.leads.createIndex({ assignedTo: 1, status: 1 });
db.leads.createIndex(
  { nextFollowUpAt: 1 },
  { partialFilterExpression: { nextFollowUpAt: { $exists: true } } }
);
db.leads.createIndex({ createdAt: -1 });
db.leads.createIndex({ 'qualification.qualificationStatus': 1, createdAt: -1 });

print('Creating indexes for properties collection...');
db.properties.createIndex({ propertyId: 1 }, { unique: true });
db.properties.createIndex({ leadId: 1 });
db.properties.createIndex({ address: 1, city: 1, state: 1 });
db.properties.createIndex({ zipCode: 1 });
db.properties.createIndex({ latitude: 1, longitude: 1 });
db.properties.createIndex({ wholesalePotential: 1, createdAt: -1 });
db.properties.createIndex({ 'investmentAnalysis.dealScore': -1 });
db.properties.createIndex({ createdAt: -1 });

print('Creating indexes for calls collection...');
db.calls.createIndex({ callId: 1 }, { unique: true });
db.calls.createIndex({ leadId: 1, initiatedAt: -1 });
db.calls.createIndex({ contactPhone: 1, initiatedAt: -1 });
db.calls.createIndex({ 'twilio.callSid': 1 }, { sparse: true });
db.calls.createIndex({ 'elevenlabs.conversationId': 1 }, { sparse: true });
db.calls.createIndex({ initiatedAt: -1 });
db.calls.createIndex({ 'outcome.result': 1, initiatedAt: -1 });
db.calls.createIndex({ handledBy: 1, initiatedAt: -1 });

print('Creating indexes for campaigns collection...');
db.campaigns.createIndex({ campaignId: 1 }, { unique: true });
db.campaigns.createIndex({ status: 1, startDate: 1 });
db.campaigns.createIndex({ type: 1, status: 1 });
db.campaigns.createIndex({ createdBy: 1, createdAt: -1 });
db.campaigns.createIndex({ startDate: 1, endDate: 1 });
db.campaigns.createIndex({ tags: 1 });
db.campaigns.createIndex({ createdAt: -1 });

print('Creating indexes for agent_states collection...');
db.agent_states.createIndex({ agentId: 1 }, { unique: true });
db.agent_states.createIndex({ agentType: 1 });
db.agent_states.createIndex({ status: 1 });
db.agent_states.createIndex({ lastHeartbeat: 1 });
db.agent_states.createIndex({ 'performance.lastUpdated': -1 });

print('Creating indexes for contacts collection...');
db.contacts.createIndex({ email: 1 }, { unique: true, sparse: true });
db.contacts.createIndex({ phone: 1 });
db.contacts.createIndex({ leadId: 1 });
db.contacts.createIndex({ createdAt: -1 });

print('Creating indexes for call_transcripts collection...');
db.call_transcripts.createIndex({ callId: 1 });
db.call_transcripts.createIndex({ leadId: 1 });
db.call_transcripts.createIndex({ createdAt: -1 });
db.call_transcripts.createIndex({ 'sentiment.overall': 1 });

print('Creating indexes for consent_logs collection (TCPA compliance)...');
db.consent_logs.createIndex({ leadId: 1 });
db.consent_logs.createIndex({ phone: 1 });
db.consent_logs.createIndex({ email: 1 });
db.consent_logs.createIndex({ createdAt: -1 });
db.consent_logs.createIndex({ consentType: 1, createdAt: -1 });
db.consent_logs.createIndex({ hasConsent: 1, expiresAt: 1 });

print('Creating indexes for dnc_registry collection...');
db.dnc_registry.createIndex({ phone: 1 }, { unique: true });
db.dnc_registry.createIndex({ lastChecked: 1 });
db.dnc_registry.createIndex({ source: 1 });

print('Creating indexes for knowledge_base collection...');
db.knowledge_base.createIndex({ agentType: 1 });
db.knowledge_base.createIndex({ category: 1 });
db.knowledge_base.createIndex({ vectorId: 1 }); // Link to Qdrant
db.knowledge_base.createIndex({ tags: 1 });
db.knowledge_base.createIndex({ createdAt: -1 });
db.knowledge_base.createIndex({ 'performance.successRate': -1 });

print('Creating indexes for analytics_events collection...');
db.analytics_events.createIndex({ eventType: 1 });
db.analytics_events.createIndex({ timestamp: -1 });
db.analytics_events.createIndex({ entityId: 1, entityType: 1 });
db.analytics_events.createIndex({ agentType: 1, timestamp: -1 });

print('Creating indexes for system_config collection...');
db.system_config.createIndex({ key: 1 }, { unique: true });
db.system_config.createIndex({ category: 1 });

print('All indexes created successfully (12 collections with indexes)');

// Create initial agent states
print('Creating initial agent states...');

const now = new Date();
const agents = [
  {
    agentId: 'architect-agent-001',
    agentType: 'architect',
    name: 'Architecture Agent',
    status: 'offline',
    config: {
      model: 'claude-sonnet-4-5-20250929',
      temperature: 0.7,
      maxTokens: 4096,
      enablePromptCaching: true,
      cacheStrategy: 'aggressive',
      tools: ['web_search', 'file_operations', 'code_execution'],
    },
    memory: {
      shortTerm: {},
      longTerm: [],
      recentDecisions: [],
      cachedPrompts: {},
      sessionState: {},
    },
    recentTasks: [],
    recentDecisions: [],
    recentKnowledgeUpdates: [],
    performance: {
      tasksCompleted: 0,
      tasksSuccessful: 0,
      tasksFailed: 0,
      decisionsCount: 0,
      knowledgeUpdates: 0,
      promptCacheHits: 0,
      promptCacheMisses: 0,
      apiCalls: 0,
      apiErrors: 0,
      totalCost: 0,
      costSavingsFromCache: 0,
      lastUpdated: now,
    },
    lastHeartbeat: now,
    consecutiveErrors: 0,
    version: '1.0.0',
    createdAt: now,
    updatedAt: now,
  },
  {
    agentId: 'conversation-agent-001',
    agentType: 'conversation',
    name: 'Conversation AI Agent',
    status: 'offline',
    config: {
      model: 'claude-sonnet-4-5-20250929',
      temperature: 0.8,
      maxTokens: 4096,
      enablePromptCaching: true,
      cacheStrategy: 'aggressive',
      tools: ['elevenlabs', 'twilio', 'sentiment_analysis'],
    },
    memory: {
      shortTerm: {},
      longTerm: [],
      recentDecisions: [],
      cachedPrompts: {},
      sessionState: {},
    },
    recentTasks: [],
    recentDecisions: [],
    recentKnowledgeUpdates: [],
    performance: {
      tasksCompleted: 0,
      tasksSuccessful: 0,
      tasksFailed: 0,
      decisionsCount: 0,
      knowledgeUpdates: 0,
      promptCacheHits: 0,
      promptCacheMisses: 0,
      apiCalls: 0,
      apiErrors: 0,
      totalCost: 0,
      costSavingsFromCache: 0,
      lastUpdated: now,
    },
    lastHeartbeat: now,
    consecutiveErrors: 0,
    version: '1.0.0',
    createdAt: now,
    updatedAt: now,
  },
  {
    agentId: 'sales-agent-001',
    agentType: 'sales',
    name: 'Sales & Marketing Expert Agent',
    status: 'offline',
    config: {
      model: 'claude-sonnet-4-5-20250929',
      temperature: 0.7,
      maxTokens: 4096,
      enablePromptCaching: true,
      cacheStrategy: 'moderate',
      tools: ['web_search', 'market_research', 'competitor_analysis'],
    },
    memory: {
      shortTerm: {},
      longTerm: [],
      recentDecisions: [],
      cachedPrompts: {},
      sessionState: {},
    },
    recentTasks: [],
    recentDecisions: [],
    recentKnowledgeUpdates: [],
    performance: {
      tasksCompleted: 0,
      tasksSuccessful: 0,
      tasksFailed: 0,
      decisionsCount: 0,
      knowledgeUpdates: 0,
      promptCacheHits: 0,
      promptCacheMisses: 0,
      apiCalls: 0,
      apiErrors: 0,
      totalCost: 0,
      costSavingsFromCache: 0,
      lastUpdated: now,
    },
    lastHeartbeat: now,
    consecutiveErrors: 0,
    version: '1.0.0',
    createdAt: now,
    updatedAt: now,
  },
  {
    agentId: 'realty-agent-001',
    agentType: 'realty',
    name: 'Realty Expert Agent',
    status: 'offline',
    config: {
      model: 'claude-sonnet-4-5-20250929',
      temperature: 0.6,
      maxTokens: 4096,
      enablePromptCaching: true,
      cacheStrategy: 'moderate',
      tools: ['property_valuation', 'market_analysis', 'compliance_check'],
    },
    memory: {
      shortTerm: {},
      longTerm: [],
      recentDecisions: [],
      cachedPrompts: {},
      sessionState: {},
    },
    recentTasks: [],
    recentDecisions: [],
    recentKnowledgeUpdates: [],
    performance: {
      tasksCompleted: 0,
      tasksSuccessful: 0,
      tasksFailed: 0,
      decisionsCount: 0,
      knowledgeUpdates: 0,
      promptCacheHits: 0,
      promptCacheMisses: 0,
      apiCalls: 0,
      apiErrors: 0,
      totalCost: 0,
      costSavingsFromCache: 0,
      lastUpdated: now,
    },
    lastHeartbeat: now,
    consecutiveErrors: 0,
    version: '1.0.0',
    createdAt: now,
    updatedAt: now,
  },
];

agents.forEach((agent) => {
  db.agent_states.insertOne(agent);
  print('Created agent: ' + agent.name);
});

print('\nMongoDB initialization completed successfully!');
print('Database: ' + dbName);
print('Collections (12):');
print('  - leads, properties, calls, campaigns, agent_states');
print('  - contacts, call_transcripts, consent_logs');
print('  - dnc_registry, knowledge_base, analytics_events, system_config');
print('Agents initialized: ' + agents.length);
