# Multi-Tenant Architecture Design

**Status**: 📋 Design Only - Not Yet Implemented

**Last Updated**: November 10, 2025

---

## Overview

This document describes the planned multi-tenant architecture for the Next Level Real Estate platform. Multi-tenancy will allow multiple real estate businesses to use the same infrastructure while maintaining complete data isolation and customizable configurations.

## Current Status

- ✅ Design complete
- ✅ UI mockups exist in admin-dashboard (tenant pages)
- ❌ Backend implementation NOT started
- ❌ Database schema NOT updated for multi-tenancy
- ❌ Middleware NOT implemented
- ❌ Authentication NOT updated for tenant context
- ❌ API routes NOT updated for tenant isolation

## Implementation Roadmap

**Planned for**: Stage 3 - Multi-Tenancy (Weeks 17-20)

**Prerequisites**:
- Stage 1: Foundation (Complete)
- Stage 2: Conversation System (In Progress)
- Full testing of single-tenant system

---

## Architecture Design

### 1. Tenant Isolation Strategy

We will use **hybrid isolation** combining database-level and application-level controls:

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway                          │
│              (Tenant Context Middleware)                │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┴──────────┬──────────────┐
        │                      │              │
┌───────▼────────┐   ┌─────────▼──────┐   ┌──▼──────────┐
│  Lead Service  │   │ Calling Service│   │Email Service│
│ (Tenant Filter)│   │ (Tenant Filter)│   │(Tenant Ctx) │
└───────┬────────┘   └────────┬───────┘   └──┬──────────┘
        │                     │               │
        └─────────────────────┴───────────────┘
                      │
              ┌───────▼────────┐
              │    MongoDB     │
              │ (Shared Schema,│
              │  Tenant Field) │
              └────────────────┘
```

### 2. Database Schema Changes

All existing collections will add a `tenantId` field:

```javascript
{
  tenantId: ObjectId("507f1f77bcf86cd799439011"), // NEW FIELD
  leadId: "lead_123",
  contact: { ... },
  // ... rest of lead document
}
```

**New Collections**:

#### tenants Collection
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  tenantId: "tenant_abc123", // Human-readable ID

  // Business Information
  businessName: "Acme Real Estate Wholesalers",
  businessType: "wholesale", // wholesale, fix_flip, rental, etc.

  // Owner/Admin
  ownerName: "John Doe",
  ownerEmail: "john@acmere.com",
  ownerPhone: "+15551234567",

  // Subscription
  plan: "professional", // free, starter, professional, enterprise
  status: "active", // active, suspended, canceled
  trialEndsAt: ISODate("2025-12-10T00:00:00Z"),
  subscriptionEndsAt: ISODate("2026-11-10T00:00:00Z"),

  // Usage Limits (based on plan)
  limits: {
    maxLeads: 10000,
    maxCalls: 5000,
    maxAgents: 4,
    maxUsers: 10,
    storageGB: 100
  },

  // Current Usage
  usage: {
    leads: 247,
    calls: 89,
    agents: 4,
    users: 3,
    storageGB: 2.4
  },

  // Configuration
  config: {
    timezone: "America/Los_Angeles",
    locale: "en-US",
    dateFormat: "MM/DD/YYYY",

    // AI Settings
    aiConfig: {
      model: "claude-sonnet-4-5-20250929",
      temperature: 0.7,
      enablePromptCaching: true
    },

    // Calling Settings
    callingConfig: {
      defaultCallerId: "+15559876543",
      maxCallDuration: 1800,
      enableRecording: true,
      enableTranscription: true
    },

    // Compliance
    tcpaConfig: {
      requireWrittenConsent: true,
      enableDNCCheck: true,
      callWindowStart: "09:00",
      callWindowEnd: "20:00",
      callWindowTimezone: "America/Los_Angeles"
    }
  },

  // Branding
  branding: {
    logo: "https://cdn.example.com/tenants/abc123/logo.png",
    primaryColor: "#1a73e8",
    secondaryColor: "#34a853",
    fontFamily: "Inter"
  },

  // API Keys (tenant-specific)
  apiKeys: {
    anthropic: "encrypted_key_hash",
    openai: "encrypted_key_hash",
    elevenlabs: "encrypted_key_hash",
    twilio: {
      accountSid: "encrypted",
      authToken: "encrypted",
      phoneNumber: "+15559876543"
    }
  },

  // Audit
  createdAt: ISODate("2025-11-10T12:00:00Z"),
  updatedAt: ISODate("2025-11-10T12:00:00Z"),
  createdBy: "system",
  lastLoginAt: ISODate("2025-11-10T15:30:00Z")
}
```

#### tenant_users Collection
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439012"),
  tenantId: ObjectId("507f1f77bcf86cd799439011"),

  userId: "user_xyz789",
  email: "jane@acmere.com",
  name: "Jane Smith",

  role: "admin", // owner, admin, agent, viewer
  permissions: [
    "leads.read",
    "leads.write",
    "calls.initiate",
    "analytics.view",
    "settings.edit"
  ],

  // Authentication
  passwordHash: "bcrypt_hash",
  lastLoginAt: ISODate("2025-11-10T14:00:00Z"),
  lastLoginIP: "192.168.1.100",

  // Status
  status: "active", // active, inactive, suspended

  // MFA
  mfaEnabled: true,
  mfaSecret: "encrypted_totp_secret",

  createdAt: ISODate("2025-11-10T12:00:00Z"),
  updatedAt: ISODate("2025-11-10T12:00:00Z")
}
```

### 3. Application-Level Changes

#### Middleware: Tenant Context Injection

```typescript
// middleware/tenant-context.ts
export async function tenantContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Extract tenant from JWT or API key
  const tenantId = extractTenantFromAuth(req);

  if (!tenantId) {
    return res.status(401).json({ error: 'No tenant context' });
  }

  // Load tenant configuration
  const tenant = await Tenant.findById(tenantId);

  if (!tenant || tenant.status !== 'active') {
    return res.status(403).json({ error: 'Tenant inactive or not found' });
  }

  // Check usage limits
  if (tenant.usage.leads >= tenant.limits.maxLeads) {
    return res.status(429).json({ error: 'Lead limit exceeded' });
  }

  // Attach to request
  req.tenant = tenant;
  req.tenantId = tenantId;

  next();
}
```

#### Database Queries: Automatic Tenant Filtering

```typescript
// Before (single-tenant):
const leads = await db.collection('leads').find({ status: 'new' });

// After (multi-tenant):
const leads = await db.collection('leads').find({
  tenantId: req.tenantId,  // Always filter by tenant
  status: 'new'
});
```

#### Mongoose Model Enhancement

```typescript
// shared/models/lead.model.ts
export const LeadSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
  leadId: { type: String, required: true },
  // ... other fields
});

// Compound unique index (tenant + leadId)
LeadSchema.index({ tenantId: 1, leadId: 1 }, { unique: true });

// Auto-inject tenant ID on save
LeadSchema.pre('save', function(next) {
  if (!this.tenantId && this.$locals.tenantId) {
    this.tenantId = this.$locals.tenantId;
  }
  next();
});

// Add query helper for tenant filtering
LeadSchema.query.byTenant = function(tenantId: string) {
  return this.where({ tenantId });
};
```

### 4. Authentication Updates

**JWT Token Structure**:
```json
{
  "userId": "user_xyz789",
  "tenantId": "507f1f77bcf86cd799439011",
  "role": "admin",
  "permissions": ["leads.read", "leads.write"],
  "iat": 1699628400,
  "exp": 1699714800
}
```

**API Key Structure**:
- Prefix: `nlre_` (platform) + `tenant_abc123_` (tenant) + random hash
- Example: `nlre_tenant_abc123_sk_live_1234567890abcdef`

### 5. Data Isolation Guarantees

**Database Indexes**:
```javascript
// All collections MUST have tenantId index
db.leads.createIndex({ tenantId: 1 });
db.calls.createIndex({ tenantId: 1 });
db.properties.createIndex({ tenantId: 1 });
db.campaigns.createIndex({ tenantId: 1 });
db.agent_states.createIndex({ tenantId: 1 });

// Compound indexes for common queries
db.leads.createIndex({ tenantId: 1, status: 1, createdAt: -1 });
db.calls.createIndex({ tenantId: 1, leadId: 1, initiatedAt: -1 });
```

**Query Safety**:
- All queries MUST include `tenantId` filter
- Database wrapper enforces tenantId injection
- Audit log for cross-tenant access attempts

### 6. Pricing & Plans

| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| Monthly Price | $0 | $99 | $299 | Custom |
| Leads | 100 | 1,000 | 10,000 | Unlimited |
| AI Calls | 10 | 500 | 5,000 | Unlimited |
| Users | 1 | 3 | 10 | Unlimited |
| Agents | 2 | 4 | 4 | Custom |
| Storage | 1 GB | 10 GB | 100 GB | Unlimited |
| Call Recording | ❌ | ✅ | ✅ | ✅ |
| Custom Branding | ❌ | ❌ | ✅ | ✅ |
| API Access | ❌ | ✅ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ✅ | ✅ |
| Dedicated Instance | ❌ | ❌ | ❌ | ✅ |

---

## Migration Plan

### Phase 1: Schema Updates (Week 1)
1. Create `tenants` and `tenant_users` collections
2. Add `tenantId` field to all existing collections
3. Create default tenant for existing data
4. Update all indexes to include `tenantId`

### Phase 2: Application Updates (Week 2)
1. Implement tenant context middleware
2. Update all database queries to include tenant filter
3. Update authentication to include tenant context
4. Add tenant-aware error handling

### Phase 3: UI Updates (Week 3)
1. Add tenant selection/switching UI
2. Implement tenant settings page
3. Add usage metrics dashboard
4. Build tenant user management

### Phase 4: Testing & Rollout (Week 4)
1. Integration testing with multiple tenants
2. Security testing (cross-tenant access attempts)
3. Performance testing with 100+ tenants
4. Staged rollout to production

---

## Security Considerations

1. **Data Isolation**:
   - Database-level filtering on every query
   - Application-level validation
   - Audit logging for all data access

2. **API Key Security**:
   - Tenant-specific API keys stored encrypted
   - Never share keys between tenants
   - Key rotation policy (90 days)

3. **Resource Isolation**:
   - Rate limiting per tenant
   - Usage quotas enforced
   - Prevent resource exhaustion attacks

4. **Compliance**:
   - GDPR: Tenant data export/deletion
   - TCPA: Per-tenant consent tracking
   - SOC 2: Audit trail per tenant

---

## Performance Considerations

1. **Database Performance**:
   - Shard by `tenantId` for horizontal scaling
   - Tenant-specific read replicas for large customers
   - Cache tenant configurations (Redis)

2. **Query Optimization**:
   - Compound indexes: `{ tenantId: 1, <other fields> }`
   - Avoid cross-tenant aggregations
   - Use projection to limit data transfer

3. **Caching Strategy**:
   - Tenant config cached for 5 minutes
   - Lead data cached with `tenant:leadId` keys
   - Invalidate on tenant updates

---

## Open Questions

1. **Tenant Creation**:
   - Self-service signup?
   - Admin approval required?
   - Payment required upfront?

2. **Billing**:
   - Stripe integration for subscriptions?
   - Usage-based billing for overages?
   - Annual vs. monthly pricing?

3. **Data Retention**:
   - How long to retain data after cancellation?
   - Offer data export before deletion?
   - Automatic purge policy?

4. **Support Model**:
   - Shared support queue or per-tenant?
   - SLA guarantees per plan?
   - Dedicated support for Enterprise?

---

## References

- [Tenant Isolation Patterns](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/approaches/overview)
- [MongoDB Multi-Tenancy Best Practices](https://www.mongodb.com/docs/manual/core/data-model-design/)
- [SaaS Pricing Models](https://www.priceintelligently.com/blog/saas-pricing-models)

---

**Note**: This is a design document only. Implementation has NOT begun. Before implementing, validate assumptions with stakeholders and conduct technical feasibility review.
