# TCPA 2025 Compliance Guide

**Version**: 1.0
**Last Updated**: 2025-11-07
**Regulatory**: FCC TCPA Requirements (Updated January 2025)

---

## Overview

The Telephone Consumer Protection Act (TCPA) was updated in January 2025 with stricter requirements. The MCP Smart Agent Server includes built-in compliance checking to prevent violations.

**Violation Penalties**: $500-$1,500 **per violation call**

---

## TCPA 2025 Key Requirements

### 1. Written Consent (No Verbal Agreements)

**Requirement**: Each recipient must have **written** consent before automated or AI calls

**What Counts**:
- ✅ Email consent form signed
- ✅ Web form submission with checkbox
- ✅ PDF contract with initials
- ❌ Verbal consent
- ❌ Implied consent
- ❌ Pre-checked checkboxes

**Implementation in System**:
```typescript
interface ConsentRecord {
  hasWrittenConsent: boolean;    // Must be TRUE
  consentDate: Date;              // Date consent obtained
  consentMethod: 'email' | 'form' | 'contract' | 'other';
  consentSource: string;          // URL or document reference
  expiresAt?: Date;               // Optional expiration
}
```

**Compliance Check**:
```typescript
const checkConsent = (lead: Lead): boolean => {
  return lead.consent.hasWrittenConsent &&
         lead.consent.consentDate <= new Date() &&
         (!lead.consent.expiresAt || lead.consent.expiresAt > new Date());
};
```

---

### 2. One-to-One Consent Per Company

**Requirement**: Each recipient needs **separate** consent for **each** company calling

**Scenario**:
- John gives consent to "Real Estate Co A" to call
- "Real Estate Co B" cannot use that same consent
- Each company needs its own written consent

**Implementation**:
```typescript
interface ConsentRecord {
  leadId: string;
  companyId: string;           // Each company separate
  hasWrittenConsent: boolean;
  consentDate: Date;
  // ...
}
```

**Compliance Check**:
```typescript
// Must check BOTH lead and company
const canCall = (leadId, companyId) => {
  const consent = getConsentRecord(leadId, companyId);
  return consent?.hasWrittenConsent || false;
};
```

---

### 3. Call Type Restrictions

### Manual Dialing (Preferred)
- ✅ **Allowed for**: Cold prospects without consent
- ✅ **Feature**: Human agent dials manually
- ❌ **Cannot use**: Auto-dialing or IVR

### Automated/Prerecorded Calls
- ✅ **Allowed for**: Consented leads only
- ❌ **Cannot use**: For cold prospecting
- ⚠️ **Risk**: AI voice still counts as automated

### Our ElevenLabs Agent
- **Type**: Automated conversational AI
- **Requires**: Written consent for all calls
- **Restriction**: Cannot cold call without consent

**Compliance Rule**:
```
IF call_type == "automated" OR call_type == "ai_agent"
  THEN require written consent
  ELSE if call_type == "manual" THEN may call without consent
END
```

---

### 4. Do Not Call (DNC) Registry

**National Do Not Call Registry**:
- Maintained by FTC
- Consumers can add themselves to block unwanted calls
- **Required check**: Before any outreach attempt
- **Penalty for violation**: $500+ per call

**Compliance Requirements**:
1. **Pre-Call Check**: Query national DNC registry
2. **Update Frequency**: 31-day scrub cycle minimum
3. **Internal DNC**: Maintain list of people who asked not to be called
4. **Immediate Opt-Out**: Respect opt-out requests immediately

**Implementation in TCPAChecker**:

```typescript
async function checkDNC(phone: string): Promise<DNCStatus> {
  // Check internal DNC list
  const internalDNC = await getInternalDNCList(phone);
  if (internalDNC) {
    return { onRegistry: true, source: 'internal', reason: 'opted_out' };
  }

  // Check national registry (mock for now)
  const nationalDNC = await checkNationalDNC(phone);
  if (nationalDNC) {
    return { onRegistry: true, source: 'national', reason: 'dnc_registry' };
  }

  return { onRegistry: false, source: null, reason: null };
}
```

**Internal DNC Tracking**:
```typescript
// When prospect says "don't call me"
await addToInternalDNC({
  phone: '+1234567890',
  reason: 'requested_during_call',
  timestamp: new Date(),
  requestedBy: 'agent', // or 'customer_service'
  companyId: 'company_1'
});
```

**National DNC Integration** (Future):
- Consider Twilio's Do Not Call API
- Or FTC's official DNC registry
- Update list every 31 days

---

### 5. Call Frequency Limits

**Requirement**: Don't repeatedly call the same person

**Rules**:
- Minimum 24 hours between calls to same person
- Maximum 3 calls per 7-day period
- Respect lead's preferred contact times
- Honor request for no further contact

**Implementation**:

```typescript
async function checkCallFrequency(leadId: string): Promise<boolean> {
  const lead = await getLead(leadId);
  const callAttempts = lead.callAttempts || [];

  // Check last call
  const lastCall = callAttempts[callAttempts.length - 1];
  const hoursSinceLastCall = (Date.now() - lastCall.timestamp) / (1000 * 60 * 60);

  if (hoursSinceLastCall < 24) {
    return false; // Too soon
  }

  // Check 7-day frequency
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const callsThisWeek = callAttempts.filter(c => c.timestamp > weekAgo).length;

  if (callsThisWeek >= 3) {
    return false; // Too many calls this week
  }

  return true;
}
```

---

### 6. CRM Compliance Tracking

**Requirement**: Document all compliance-related actions

**Track**:
- ✅ When consent was obtained
- ✅ How consent was obtained (email, form, etc)
- ✅ Who provided consent
- ✅ Date and time of each call attempt
- ✅ Call outcome
- ✅ Any opt-outs
- ✅ All DNC checks

**Compliance Record**:

```typescript
interface ComplianceRecord {
  recordId: string;
  leadId: string;
  timestamp: Date;

  // Pre-call checks
  consentVerified: boolean;
  consentStatus: 'approved' | 'missing' | 'expired';

  dncVerified: boolean;
  dncStatus: 'clean' | 'blocked' | 'internal_dnc';

  callFrequencyValid: boolean;
  daysSinceLast: number;
  callsThisWeek: number;

  // Result
  callAllowed: boolean;
  blockReason?: string;

  // Audit trail
  checkedBy: 'system' | string;
  checkedAt: Date;
}
```

**Query for Audit**:
```typescript
// Get all compliance decisions for a lead
const auditTrail = await getComplianceHistory(leadId);

// Should show:
// - 2025-11-01 10:30 APPROVED (consent verified, DNC clean, frequency ok)
// - 2025-11-02 14:15 BLOCKED (consent verified, DNC BLOCKED)
// - 2025-11-03 09:00 APPROVED (all checks passed)
```

---

## Compliance Decision Workflow

### Pre-Call Validation

```
User requests: "Call John about his property"
  │
  ▼
1. Verify Consent
   ├─ Has written consent? → NO → BLOCK
   ├─ For this company? → NO → BLOCK
   └─ Not expired? → NO → BLOCK
  │
  ▼
2. Check DNC Registry
   ├─ On national DNC? → YES → BLOCK
   └─ On internal DNC? → YES → BLOCK
  │
  ▼
3. Check Call Frequency
   ├─ Called in last 24h? → YES → BLOCK
   └─ 3+ calls this week? → YES → BLOCK
  │
  ▼
4. All Clear → Proceed with Call
  │
  ▼
Record Compliance Decision (Audit Trail)
```

### Implementation in Tool

```typescript
async function checkTCPACompliance(
  leadId: string,
  companyId: string
): Promise<ComplianceDecision> {
  const lead = await getLead(leadId);
  const decision: ComplianceDecision = {
    approved: true,
    reasons: []
  };

  // Check 1: Consent
  const hasConsent = lead.consent?.hasWrittenConsent &&
    lead.consent.companyId === companyId;
  if (!hasConsent) {
    decision.approved = false;
    decision.reasons.push('No written consent for this company');
  }

  // Check 2: DNC
  if (!decision.approved) return decision; // Early exit if already blocked

  const dncStatus = await checkDNC(lead.phone);
  if (dncStatus.onRegistry) {
    decision.approved = false;
    decision.reasons.push(`On ${dncStatus.source} DNC registry`);
  }

  // Check 3: Frequency
  if (!decision.approved) return decision;

  const frequencyOk = await checkCallFrequency(leadId);
  if (!frequencyOk) {
    decision.approved = false;
    decision.reasons.push('Too many recent calls or too soon');
  }

  // Record decision
  await recordComplianceDecision(leadId, decision);

  return decision;
}
```

---

## Opt-Out Handling

### Immediate Opt-Out

When a prospect says "don't call me again":

```typescript
async function handleOptOut(
  leadId: string,
  companyId: string,
  method: 'during_call' | 'callback' | 'email'
) {
  // Add to internal DNC immediately
  await addToInternalDNC({
    leadId,
    companyId,
    phone: lead.phone,
    requestedDate: new Date(),
    method,
    compliedDate: new Date()
  });

  // Log for audit
  await logComplianceEvent({
    leadId,
    event: 'opt_out_requested',
    timestamp: new Date(),
    source: method
  });

  // Future calls blocked
  // All subsequent checkTCPACompliance() calls will be blocked
}
```

### Respecting Opt-Outs

```typescript
// This check runs automatically before every call
if (await isOptedOut(leadId, companyId)) {
  return {
    approved: false,
    reason: 'Lead has opted out'
  };
}
```

---

## Testing Compliance Logic

### Test Cases

```typescript
describe('TCPA Compliance', () => {
  test('Blocks call without consent', async () => {
    const lead = { consent: { hasWrittenConsent: false } };
    const result = await checkTCPACompliance(lead.id, company.id);
    expect(result.approved).toBe(false);
  });

  test('Blocks call to DNC number', async () => {
    const dncNumber = '+15551234567';
    await addToInternalDNC(dncNumber);
    const result = await checkDNC(dncNumber);
    expect(result.onRegistry).toBe(true);
  });

  test('Blocks second call within 24h', async () => {
    await makeFirstCall(leadId);
    const result = await checkCallFrequency(leadId);
    expect(result).toBe(false); // Too soon
  });

  test('Allows call after 24h', async () => {
    lead.callAttempts = [{
      timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25h ago
    }];
    const result = await checkCallFrequency(leadId);
    expect(result).toBe(true);
  });
});
```

---

## Compliance Dashboard (Future)

Track key metrics:
- Total calls attempted
- Calls blocked by reason
- Compliance decision breakdown
- Opt-out count
- Recent changes to DNC list

```typescript
interface ComplianceMetrics {
  totalCalls: number;
  blockedByConsent: number;
  blockedByDNC: number;
  blockedByFrequency: number;
  successRate: number;
  optOuts: number;
  lastDNCSync: Date;
}
```

---

## Best Practices

### 1. Collect Consent Early
- Add consent checkbox to lead intake forms
- Email confirmation with consent details
- Keep records of consent documentation

### 2. Maintain Consent Records
- Store: date, method, source, who signed
- Never assume consent
- Update consent if lead changes

### 3. Respect Opt-Outs Immediately
- Log every opt-out request
- Add to DNC list same day
- Never call opted-out leads again

### 4. Monitor Compliance Metrics
- Track blocked calls and reasons
- Review compliance decisions weekly
- Flag patterns of non-compliance

### 5. Train Your Team
- Educate on TCPA requirements
- Document procedures
- Regular compliance training

### 6. Audit Trail
- Keep detailed records
- Export compliance reports monthly
- Be ready for FCC audits

---

## Common Violations & Penalties

| Violation | Penalty | How to Avoid |
|-----------|---------|------------|
| Call without consent | $500-$1,500 | Verify written consent before calling |
| Ignore DNC request | $500-$1,500 | Check DNC before every call |
| Call opted-out lead | $500-$1,500 | Respect opt-outs immediately |
| Call before 8am/after 9pm | $500-$1,500 | Respect time zone and quiet hours |
| No caller ID | $500-$1,500 | Always show Caller ID |
| Don't maintain DNC | $500-$1,500 | Update DNC list every 31 days |

---

## Legal Disclaimer

This guide is for informational purposes and reflects our understanding of TCPA regulations as of January 2025. Requirements may change. Consult with legal counsel to ensure full compliance with applicable laws in your jurisdiction.

**Not Legal Advice**: This document should not be considered legal advice. Consult your legal team for compliance requirements.

---

## Related Documents

- [Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md)
- [MCP Tools Specification](./MCP_TOOLS_SPECIFICATION.md)
- [Webhook Endpoints](./WEBHOOK_ENDPOINTS_SPEC.md)
