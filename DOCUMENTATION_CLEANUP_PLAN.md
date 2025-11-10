# Documentation Cleanup Plan

**Date**: November 10, 2025
**Based On**: Comprehensive audit of 67 markdown files vs. actual codebase

This document provides an actionable plan to fix all documentation inconsistencies found in the audit.

---

## 🎯 CLEANUP OBJECTIVES

1. **Accuracy**: Ensure all docs reflect actual implementation
2. **Clarity**: Remove ambiguous "production ready" claims
3. **Completeness**: Document what exists, clearly mark what doesn't
4. **Maintainability**: Remove static dates, use git metadata

---

## 📋 EXECUTION PLAN (Prioritized)

### Phase 1: Critical Fixes (This Session - 1 hour)

#### 1.1 Update Project Status - README.md

**File**: `/README.md`

**Changes**:
```markdown
Line 245: Change from:
**Status**: ✅ Production Ready (Stages 1 & 3 Complete)

To:
**Status**: 🚧 Alpha Development (Core Infrastructure Complete)
**Infrastructure**: ✅ MongoDB, Redis, Kafka, Qdrant running
**Services**: ✅ API Gateway, Lead Service implemented
**Calling**: 🟡 Code complete, integration testing needed
**AI Agents**: 🟡 Code complete, validation pending
**Testing**: 🔴 Limited (9 test files)
**Multi-Tenancy**: 📋 Designed only, not implemented
```

Line 5: Remove CI/CD badge (no workflow exists):
```markdown
DELETE:
[![CI/CD](https://github.com/your-org/next-level-real-estate/actions/workflows/ci.yml/badge.svg)]
```

Line 248: Update date:
```markdown
**Last Updated**: November 10, 2025
```

---

#### 1.2 Fix Service Port Mappings

**File**: `/services/api-gateway/README.md`

**Lines 28-32**: Change from:
```markdown
API Gateway (Port 3000)
├─ Lead Service (Port 3001)
├─ Campaign Service (Port 3002)
├─ Call Service (Port 3003)
└─ Analytics Service (Port 3004)
```

To:
```markdown
API Gateway (Port 3000)
├─ Lead Service (Port 3001)
└─ Calling Service (Port 3002)

Future Services (Not Yet Implemented):
├─ Analytics Service (Planned)
└─ Campaign Service (Planned)
```

**Lines 144-147**: Remove non-existent service routes:
```markdown
DELETE:
- Campaign Service: GET|POST|PUT|PATCH|DELETE /api/v1/campaigns/*
- Analytics Service: GET /api/v1/analytics/*
```

---

#### 1.3 Remove Non-Existent Service References

**Files to Update**:

1. **/.env.example** - Lines 37-39:
```bash
# Services
API_GATEWAY_PORT=3000
LEAD_SERVICE_PORT=3001
CALLING_SERVICE_PORT=3002

# Future Services (Not Yet Implemented)
# ANALYTICS_SERVICE_PORT=3003
# CAMPAIGN_SERVICE_PORT=3004
```

2. **/PROJECT_STATUS.md** - Lines 239-241:
```markdown
services/
├── api-gateway/        ✅ Running (Port 3000)
├── lead-service/       ✅ Running (Port 3001)
├── calling-service/    🟡 Code Complete (Port 3002)
├── analytics-service/  📋 Planned
├── campaign-service/   📋 Planned
└── tenant-service/     📋 Designed (see MULTI_TENANT_ARCHITECTURE.md)
```

3. **/services/calling-service/src/config/index.ts** - Line 2:
```typescript
// REMOVE or comment out:
analyticsServiceUrl: z.string().default('http://localhost:3003')

// Or change to:
// analyticsServiceUrl: z.string().optional() // Future: Analytics integration
```

---

#### 1.4 Create Missing Config File

**File**: `/config/otel-collector-config.yaml` (CREATE NEW)

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:

exporters:
  logging:
    loglevel: debug
  # Future: Add Jaeger, Prometheus, etc.

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [logging]
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [logging]
```

**Also create**: `/config/` directory

---

### Phase 2: High Priority Fixes (Next 2 hours)

#### 2.1 Update MongoDB Initialization Script

**File**: `/scripts/mongo-init.js`

**Add Missing Collections**:
```javascript
// After existing collections, add:

// Contacts collection (for lead contacts)
db.createCollection('contacts');
db.contacts.createIndex({ email: 1 }, { unique: true, sparse: true });
db.contacts.createIndex({ phone: 1 });

// Call Transcripts collection
db.createCollection('call_transcripts');
db.call_transcripts.createIndex({ callId: 1 });
db.call_transcripts.createIndex({ createdAt: -1 });

// Consent Logs collection (TCPA compliance)
db.createCollection('consent_logs');
db.consent_logs.createIndex({ leadId: 1 });
db.consent_logs.createIndex({ phone: 1 });
db.consent_logs.createIndex({ createdAt: -1 });

// DNC Registry cache
db.createCollection('dnc_registry');
db.dnc_registry.createIndex({ phone: 1 }, { unique: true });
db.dnc_registry.createIndex({ lastChecked: 1 });

// Knowledge Base documents
db.createCollection('knowledge_base');
db.knowledge_base.createIndex({ agentType: 1 });
db.knowledge_base.createIndex({ category: 1 });
db.knowledge_base.createIndex({ vectorId: 1 }); // Link to Qdrant

// Analytics Events (for future analytics service)
db.createCollection('analytics_events');
db.analytics_events.createIndex({ eventType: 1 });
db.analytics_events.createIndex({ timestamp: -1 });
db.analytics_events.createIndex({ entityId: 1, entityType: 1 });

// System Configuration
db.createCollection('system_config');
db.system_config.createIndex({ key: 1 }, { unique: true });

print('✓ All 12 collections created with indexes');
```

**Also fix**: Line 85 - Change `agent_states` to `agent_state` (match docs) OR update docs to `agent_states`

---

#### 2.2 Add Calling Service to Docker Compose

**File**: `/docker-compose.yml`

**Add after lead-service**:
```yaml
  calling-service:
    build:
      context: ./services/calling-service
      dockerfile: Dockerfile
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongodb:27017/next_level_real_estate
      - KAFKA_BROKERS=kafka:9092
      - REDIS_URL=redis://redis:6379
      - PORT=3002
    depends_on:
      - mongodb
      - kafka
      - redis
    networks:
      - nlre-network
    restart: unless-stopped
```

---

#### 2.3 Update Environment Variable Documentation

**File**: `/ENVIRONMENT_VARIABLES.md`

**Add Missing Variables** (around line 170):
```markdown
# TCPA Compliance (Calling Service)
ENABLE_TCPA_VALIDATION=true
REQUIRE_WRITTEN_CONSENT=true

# Call Configuration (Calling Service)
MAX_CALL_DURATION=1800
CALL_TIMEOUT=30
ENABLE_CALL_RECORDING=true
ENABLE_TRANSCRIPTION=true

# Security (API Gateway)
API_KEY_SALT=your_api_key_salt
```

**Mark as Optional/Unused** (lines 119, 193, 239, 243):
```markdown
# Observability (Optional - Not Currently Integrated)
# SIGNON_URL=http://localhost:3301

# Optional APIs (Not Currently Integrated)
# DNC_REGISTRY_API_KEY=your_dnc_registry_api_key
# ATTOM_API_KEY=your_attom_api_key
```

---

#### 2.4 Update MCP Servers Status

**File**: `/MCP_SERVERS_COMPLETE.md`

**Lines 430-432**: Change from:
```markdown
**Status**: ✅ COMPLETE - Ready for Testing! 🚀
```

To:
```markdown
**Status**: 🟡 Code Complete - Integration Testing Required

**What's Done**:
- ✅ All 4 MCP servers implemented and compiled
- ✅ TypeScript builds successfully
- ✅ API endpoints created in Calling Service
- ✅ ClaudeAgentService integration code complete

**What's Needed**:
- ⏳ End-to-end integration testing
- ⏳ Validation of Claude SDK + MCP communication
- ⏳ Performance testing under load
- ⏳ Documentation of test results
```

---

### Phase 3: Medium Priority (Next Week)

#### 3.1 Standardize Collection Names

**Choose One**:
- **Option A**: Use singular everywhere (`agent_state`, `lead`, `call`)
- **Option B**: Use plural everywhere (`agent_states`, `leads`, `calls`)

**Recommended**: Option A (singular) - matches RESTful conventions

**Files to Update**:
1. `/scripts/mongo-init.js` - Change `agent_states` to `agent_state`
2. `/docs/database/mongodb-schema.md` - Verify all use singular
3. All model files in `/shared/models/` - Update if needed

---

#### 3.2 Update Admin Dashboard Status

**File**: `/PROJECT_STATUS.md`

**Lines 295-298**: Change from:
```markdown
6. ⏳ **Build Admin Dashboard** (Next.js)
   - Call initiation form
   - Aspire-style monitoring
```

To:
```markdown
6. 🟡 **Admin Dashboard** (Next.js)
   - ✅ UI scaffolded with 20+ components
   - ✅ Dashboard pages (analytics, leads, settings, tenants)
   - ✅ Tailwind CSS v4 configured
   - ⏳ API integration pending
   - ⏳ Authentication setup needed
   - ⏳ Real-time data connections needed
```

---

#### 3.3 Clarify Agent Implementation Status

**File**: `/PROJECT_SUMMARY.md`

**Lines 199-222**: Add status details:
```markdown
#### 2. **Architecture Agent**
- **Role**: System design, performance optimization, technical research
- **Status**: ✅ Code Complete | ⏳ Validation Pending
- **Tools**: 5 specialized tools (implemented)
- **Knowledge Base**: Schema defined, population pending
- **Testing**: Unit tests needed

#### 3. **Conversation AI Agent**
- **Role**: Call analysis, pattern extraction, conversation optimization
- **Status**: ✅ Code Complete | ⏳ Validation Pending
- **Tools**: 5 tools (implemented)
- **Knowledge Base**: Schema defined, population pending
- **Testing**: Integration tests needed

[Similar for Sales and Realty agents]
```

---

#### 3.4 Update Technology Version Documentation

**File**: `/README.md`, `/CLAUDE.md`, `/LOCAL_SETUP_GUIDE.md`

**Standardize to**:
```markdown
- **Node.js**: >= 20.0.0 (LTS)
- **npm**: >= 10.0.0
- **TypeScript**: 5.7+
- **MongoDB**: 7.0+
- **Redis**: 7.2+
- **Kafka**: 7.5.3+
```

**Add to package.json**:
```json
"engines": {
  "node": ">=20.0.0",
  "npm": ">=10.0.0"
}
```

**Remove** .NET references (not used):
```markdown
DELETE from /CLAUDE.md line 19:
+ .NET Core 9 (C#) - polyglot microservices
```

---

#### 3.5 Create or Remove Multi-Tenancy Docs

**Option A: Create the Documented File**

**File**: `/docs/MULTI_TENANT_ARCHITECTURE.md` (CREATE NEW)
```markdown
# Multi-Tenant Architecture Design

**Status**: 📋 Design Only - Not Yet Implemented

This document describes the planned multi-tenant architecture for the Next Level Real Estate platform.

## Current Status
- ✅ Design complete
- ✅ UI mockups exist in admin-dashboard
- ❌ Backend implementation NOT started
- ❌ Database schema NOT updated
- ❌ Middleware NOT implemented

## Implementation Roadmap
Planned for Stage 3 - Multi-Tenancy (Weeks 17-20)

[Rest of design docs...]
```

**Option B: Remove References**
- Remove from `/PROJECT_STATUS.md` line 47
- Remove tenant pages from admin-dashboard
- Remove from documentation index

**Recommended**: Option A (keep design docs, clarify status)

---

### Phase 4: Low Priority Cleanup (Ongoing)

#### 4.1 Update All Timestamps

**Automated Solution** - Add to `package.json`:
```json
"scripts": {
  "docs:update-dates": "node scripts/update-doc-dates.js"
}
```

**Create**: `/scripts/update-doc-dates.js`
```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all markdown files
const mdFiles = execSync('find . -name "*.md" -not -path "./node_modules/*"')
  .toString()
  .split('\n')
  .filter(Boolean);

const today = new Date().toISOString().split('T')[0];

mdFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace various timestamp formats
  content = content.replace(
    /Last Updated: \d{4}-\d{2}-\d{2}/g,
    `Last Updated: ${today}`
  );
  content = content.replace(
    /\*\*Last Updated\*\*: .+/g,
    `**Last Updated**: ${today}`
  );

  fs.writeFileSync(file, content);
});

console.log(`Updated ${mdFiles.length} markdown files`);
```

**Or**: Remove all static dates, rely on git commit dates

---

#### 4.2 Update GitHub URLs

**Replace** in all files:
```markdown
FROM: https://github.com/your-org/next-level-real-estate
TO: https://github.com/onesmartguy/next-level-real-estate
```

**Files**:
- /README.md
- /PROJECT_SUMMARY.md
- /docs/README.md

---

#### 4.3 Update Contact Information

**File**: `/README.md` line 234

**Change from**:
```markdown
- **Contact**: support@nextlevelre.com
```

**To**:
```markdown
- **Contact**: [Your contact method]
- **GitHub Issues**: https://github.com/onesmartguy/next-level-real-estate/issues
```

---

#### 4.4 Update Cost Analysis Disclaimer

**File**: `/PROJECT_STATUS.md` lines 326-336

**Add disclaimer**:
```markdown
**AI Calls** (ESTIMATED - with Claude Agent SDK + prompt caching):
- Claude API: ~$0.08 per 5-minute call (estimated)
- Total: **~$0.033/call** (vs. ~$0.46 without caching)

**Note**: These are ESTIMATES based on:
- Assumed 90% cache hit rate (not yet measured)
- Standard Claude 3.5 Sonnet pricing
- Estimated token usage per call
- Prompt caching enabled (implementation pending validation)

Actual costs may vary. Production measurements needed for accurate pricing.
```

---

#### 4.5 Document Actual Test Coverage

**File**: `/README.md` lines 133-149

**Replace**:
```markdown
### Run Tests

```bash
# All tests
npm test

# Current test coverage: 9 test files
# Tests exist for:
#   - TCPA validator (calling-service)
#   - Basic service health checks
#   - (More tests in development)

# With coverage (when available)
npm test -- --coverage
```

**Future**: Comprehensive test suite planned
- Unit tests for all services
- Integration tests for workflows
- E2E tests for complete flows
```

---

## 📊 TRACKING PROGRESS

### Checklist

**Phase 1: Critical (Complete This Session)**
- [ ] Update README.md status from "Production Ready" to "Alpha Development"
- [ ] Remove CI/CD badge
- [ ] Fix API Gateway port mappings
- [ ] Create /config/otel-collector-config.yaml
- [ ] Remove Campaign Service references
- [ ] Clarify Analytics Service as planned
- [ ] Update all "Last Updated" to Nov 10, 2025

**Phase 2: High Priority (Next 2 Hours)**
- [ ] Add missing collections to mongo-init.js
- [ ] Add Calling Service to docker-compose.yml
- [ ] Update .env.example with missing variables
- [ ] Update MCP status to "Code Complete - Testing Needed"
- [ ] Fix calling-service config references to non-existent services

**Phase 3: Medium Priority (This Week)**
- [ ] Standardize collection names (singular vs plural)
- [ ] Update Admin Dashboard status
- [ ] Clarify Agent implementation status
- [ ] Update technology version docs
- [ ] Create or remove multi-tenancy architecture doc
- [ ] Add Node.js engines to package.json

**Phase 4: Low Priority (Ongoing)**
- [ ] Automate timestamp updates
- [ ] Update GitHub URLs
- [ ] Update contact information
- [ ] Add cost analysis disclaimer
- [ ] Document actual test coverage

---

## 🔧 AUTOMATION SCRIPTS

### Quick Fix Script

**Create**: `/scripts/fix-critical-docs.sh`
```bash
#!/bin/bash

echo "🔧 Fixing critical documentation issues..."

# 1. Update README status
sed -i 's/Production Ready/Alpha Development/' README.md
echo "✓ Updated README status"

# 2. Update dates
TODAY=$(date +%Y-%m-%d)
find . -name "*.md" -not -path "./node_modules/*" -exec sed -i "s/Last Updated: .*/Last Updated: $TODAY/" {} \;
echo "✓ Updated all dates to $TODAY"

# 3. Create config directory
mkdir -p config
echo "✓ Created config directory"

# 4. Add Calling Service to docker-compose (manual review needed)
echo "⚠️  Review docker-compose.yml manually to add calling-service"

echo ""
echo "✅ Critical fixes applied!"
echo "📋 Review changes before committing"
```

---

## 📝 DOCUMENTATION MAINTENANCE POLICY (Going Forward)

### Rules:
1. **No Static Dates**: Use git commit dates or auto-update scripts
2. **Status Clarity**: Use emojis: ✅ Complete, 🟡 In Progress, ⏳ Pending, 🔴 Not Started, 📋 Designed
3. **Service Registry**: Maintain single source of truth for services in SERVICES.md
4. **Pre-Commit Checks**: Validate docs match code before commits
5. **Quarterly Audit**: Review all docs vs. codebase every 3 months

### Pre-Commit Hook (Create `.git/hooks/pre-commit`):
```bash
#!/bin/bash

# Validate documented services exist
for service in api-gateway lead-service calling-service; do
  if [ ! -d "services/$service" ]; then
    echo "ERROR: Documented service not found: $service"
    exit 1
  fi
done

# Ensure .env.example is up to date
if git diff --cached --name-only | grep -q "\.env"; then
  echo "⚠️  .env files changed - update .env.example"
fi

echo "✅ Documentation validation passed"
```

---

## ✅ SUCCESS CRITERIA

Documentation cleanup is complete when:
- [ ] All port mappings are accurate
- [ ] No references to non-existent services
- [ ] All "Production Ready" claims removed or justified
- [ ] docker-compose.yml starts without errors
- [ ] All .env.example variables exist in code
- [ ] MongoDB init creates all documented collections
- [ ] Test coverage accurately documented
- [ ] All Phase 1 & 2 items checked off

---

**Last Updated**: November 10, 2025
**Owner**: Development Team
**Review Frequency**: Every commit + quarterly audit
