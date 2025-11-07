# Migration Guide: Old MCP Servers → mcp-smart-agent-server

**Version**: 1.0
**Last Updated**: 2025-11-07
**Status**: Ready for Migration

---

## Overview

This guide explains how to migrate from the four separate MCP servers to the unified mcp-smart-agent-server.

**Servers Being Consolidated**:
- ❌ `mcp-elevenlabs-server`
- ❌ `mcp-twilio-server`
- ❌ `mcp-realgeeks-server` (features preserved)
- ❌ Scattered calling/TCPA logic

**New Single Server**:
- ✅ `mcp-smart-agent-server` (unified)

---

## Migration Timeline

### Phase 1: Parallel Running (Days 1-3)
Both old and new servers run simultaneously
- New server in staging environment
- Full testing without breaking production
- Old servers still handle production traffic

### Phase 2: Gradual Cutover (Days 4-7)
Route traffic gradually to new server
- 10% → 25% → 50% → 100% over 4 days
- Monitor error rates and performance
- Easy rollback if issues detected

### Phase 3: Old Server Deprecation (Day 8+)
Disable old servers
- Archive code to `_archived/`
- Keep backups for 30 days
- Update documentation

---

## Tool Mapping

### From mcp-elevenlabs-server → mcp-smart-agent-server

| Old Tool | New Tool | Notes |
|----------|----------|-------|
| `elevenlabs_create_agent` | `elevenlabs_create_agent` | Same signature |
| `elevenlabs_get_agent` | `elevenlabs_get_agent` | Same signature |
| `elevenlabs_update_agent` | `elevenlabs_update_agent` | Same signature |
| `elevenlabs_list_agents` | `elevenlabs_list_agents` | Same signature |
| `elevenlabs_list_voices` | `elevenlabs_list_voices` | Same signature |
| `elevenlabs_get_voice` | `elevenlabs_get_voice` | Same signature |

**Breaking Changes**: None - drop-in replacement

---

### From mcp-twilio-server → mcp-smart-agent-server

| Old Tool | New Tool | Notes |
|----------|----------|-------|
| `twilio_make_call` | `twilio_make_call` | Same signature |
| `twilio_get_call` | `twilio_get_call` | Same signature |
| `twilio_end_call` | `twilio_end_call` | Same signature |

**New Tools Added**:
- `initiate_call_with_compliance` - High-level orchestration
- `list_active_calls` - Get all active calls
- `get_call_history` - Query call history
- `twilio_record_call` - Enable recording

**Breaking Changes**: None - drop-in replacement + new tools

---

### From Scattered Calling Logic → mcp-smart-agent-server

| Old Location | New Tool | Notes |
|--------------|----------|-------|
| `services/calling-service/ClaudeAgentService` | `initiate_call_with_compliance` | Now standardized MCP tool |
| Manual TCPA checking | `check_tcpa_compliance` | Centralized |
| Manual variable injection | Built-in to orchestration tool | Automatic |

---

### From mcp-realgeeks-server → mcp-smart-agent-server

**Status**: RealGeeks integration features are NOT consolidated into mcp-smart-agent-server

**Decision**: **KEEP mcp-realgeeks-server running**
- ✅ mcp-realgeeks-server handles CRM lead sync
- ✅ mcp-smart-agent-server handles outbound calling
- ✅ Services communicate via webhooks
- ✅ Separation of concerns (CRM vs Calling)

**Why keep separate?**
1. RealGeeks CRM synchronization is independent of calling
2. Need lead data updated in real-time from RealGeeks
3. Reduces complexity of mcp-smart-agent-server
4. Allows independent scaling of each service
5. Clear separation of responsibilities

**Architecture**:
```
RealGeeks CRM
    ↓
mcp-realgeeks-server (lead sync)
    ↓
Lead Database
    ↓
mcp-smart-agent-server (initiate calls with lead data)
    ↓
Twilio + ElevenLabs
    ↓
Calls + Conversations
```

---

## Migration Checklist

### Pre-Migration (Day 0)
- [ ] Backup all environment variables
- [ ] Backup old MCP server code
- [ ] Document current tool usage
- [ ] Create rollback plan
- [ ] Notify stakeholders

### Build New Server (Days 1-2)
- [ ] Create mcp-smart-agent-server directory
- [ ] Implement all components
- [ ] Deploy to staging
- [ ] Run full test suite

### Parallel Testing (Days 3-4)
- [ ] Run both servers simultaneously
- [ ] Route test traffic to new server
- [ ] Compare responses (should be identical)
- [ ] Monitor error rates
- [ ] Check performance metrics

### Gradual Cutover (Days 5-7)
- [ ] Enable routing: 10% to new server
- [ ] Monitor for 6 hours
- [ ] Gradually increase: 25% → 50% → 100%
- [ ] Track error rates at each step
- [ ] Document any issues

### Post-Migration (Day 8+)
- [ ] Verify all traffic on new server
- [ ] Monitor production for 7 days
- [ ] Archive old servers
- [ ] Update documentation
- [ ] Decommission old infrastructure

---

## Configuration Changes

### Environment Variables

**Before** (4 separate servers):
```env
# mcp-elevenlabs-server
ELEVENLABS_API_KEY=sk_xxxxx

# mcp-twilio-server
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+12147305642

# scattered in multiple places
WEBHOOK_HANDLER_URL=https://...
```

**After** (unified server):
```env
# Single mcp-smart-agent-server
ELEVENLABS_API_KEY=sk_xxxxx
ELEVENLABS_AGENT_ID=agent_2201k95pnb1beqp9m0k7rs044b1c

TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+12147305642

MCP_SMART_AGENT_PORT=3333
MCP_SMART_AGENT_LOG_LEVEL=info
```

**Simpler**: Fewer variables, clearer naming

---

## Client Code Migration

### Before: Separate Tool Calls

```typescript
// Old way - using multiple servers
const agentResult = await mcpClient.call('elevenlabs_get_agent', {
  agentId: 'agent_123'
});

const callResult = await mcpClient.call('twilio_make_call', {
  to: '+1234567890',
  from: '+12147305642',
  url: webhookUrl
});

const statusResult = await mcpClient.call('twilio_get_call', {
  callSid: callResult.callSid
});
```

### After: Unified Tool Calls

```typescript
// New way - using single server
const callResult = await mcpClient.call('initiate_call_with_compliance', {
  leadId: 'lead_123',
  to: '+1234567890',
  agentId: 'agent_2201k95pnb1beqp9m0k7rs044b1c',
  dynamicVariables: {
    first_name: 'John',
    property_address: '123 Main St'
  }
});

// TCPA compliance check included automatically
if (callResult.success) {
  const statusResult = await mcpClient.call('get_call_status', {
    callSid: callResult.callSid
  });
}
```

**Benefits**:
- Fewer API calls
- Compliance checked automatically
- Simpler error handling
- Unified logging

---

## Testing During Migration

### Regression Testing

```typescript
// Test: Ensure old endpoints still work (via backward compat layer)
test('Legacy tool: elevenlabs_get_agent', async () => {
  const result = await newServer.callTool('elevenlabs_get_agent', {
    agentId: 'agent_123'
  });
  expect(result).toBeDefined();
  expect(result.agentId).toBe('agent_123');
});

test('Legacy tool: twilio_make_call', async () => {
  const result = await newServer.callTool('twilio_make_call', {
    to: '+1234567890',
    from: '+12147305642',
    url: 'https://example.com'
  });
  expect(result.callSid).toBeDefined();
});
```

### New Feature Testing

```typescript
// Test: New unified calling tool
test('New tool: initiate_call_with_compliance', async () => {
  const result = await newServer.callTool('initiate_call_with_compliance', {
    leadId: 'lead_123',
    to: '+1234567890',
    agentId: 'agent_456'
  });
  expect(result.success).toBe(true);
  expect(result.complianceStatus).toBe('approved');
});

// Test: Compliance blocks non-consented lead
test('Compliance blocks call without consent', async () => {
  const lead = { consent: { hasWrittenConsent: false } };
  const result = await newServer.callTool('initiate_call_with_compliance', {
    leadId: lead.id,
    to: '+1234567890',
    agentId: 'agent_456'
  });
  expect(result.success).toBe(false);
  expect(result.error.code).toBe('COMPLIANCE_BLOCKED');
});
```

---

## Rollback Plan

### If Issues Detected

**Immediate** (< 5 minutes):
1. Switch routing back to old servers (100%)
2. Notify team
3. Check old server logs

**Investigation** (< 1 hour):
1. Compare responses from old vs new server
2. Check for differences in behavior
3. Identify root cause

**Resolution** (< 24 hours):
1. Fix issue in new server
2. Re-deploy to staging
3. Repeat testing
4. Schedule retry

### Rollback Command

```bash
# If deployed to production
vercel rollback mcp-smart-agent-server

# Or fall back to old servers
kubectl set image deployment/mcp-twilio=mcp-twilio:old-version
```

---

## Documentation Updates

### After Migration

Update these files:
- [ ] `README.md` - Point to new server
- [ ] `docs/TWILIO_WEBHOOK_SETUP.md` - Reference new tools
- [ ] `docs/api/` - Update API docs
- [ ] `TESTING_INSTRUCTIONS.md` - Update examples
- [ ] `CLAUDE.md` - Update architecture section

### Archive Old Servers

Create `_archived/` directory:
```
_archived/
├── mcp-elevenlabs-server/ (moved here)
├── mcp-twilio-server/ (moved here)
├── DEPRECATED.md
└── MIGRATION_NOTES.md
```

---

## Performance Comparison

### Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|------------|
| API calls per workflow | 3-5 | 1-2 | 60% reduction |
| Tool execution time | 2-3s | 1-2s | 40% faster |
| Infrastructure overhead | 4 servers | 1 server | 75% reduction |
| Compliance check latency | Manual | Built-in | Automatic |
| Error handling | Scattered | Unified | Consistent |

---

## Monitoring After Migration

### Key Metrics to Watch

```typescript
// Track these metrics post-migration
metrics = {
  callInitiationTime: avg(< 500ms),
  complianceCheckTime: avg(< 100ms),
  toolErrorRate: < 0.5%,
  uptime: > 99.9%,
  backendApiLatency: avg(< 1000ms),
  databaseLatency: avg(< 50ms)
};
```

### Alert Thresholds

- 🔴 **Critical**: Error rate > 5% OR Tool availability < 95%
- 🟠 **Warning**: Error rate > 1% OR Tool latency > 5s
- 🟢 **Healthy**: Error rate < 0.5% AND Latency < 2s

---

## Success Criteria

✅ **Migration Complete When**:
- [ ] All 18 tools functional in new server
- [ ] Error rate < old server error rate
- [ ] Response times faster than old server
- [ ] TCPA compliance working correctly
- [ ] Zero regression in functionality
- [ ] Documentation updated
- [ ] Old servers deprecated

---

## FAQ

**Q: Can we run both servers at same time?**
A: Yes! Run in parallel during Phase 1-2 for safety.

**Q: Will this break existing integrations?**
A: No, all old tools are preserved with same signatures.

**Q: Do we need to update code?**
A: Only if you want to use new unified tools. Old tools still work.

**Q: What about RealGeeks integration?**
A: Keep mcp-realgeeks-server separate for now (Phase 2 enhancement).

**Q: How long does migration take?**
A: 8-10 days with full testing. Can be done faster if needed.

**Q: What if something goes wrong?**
A: Rollback plan ready. Can switch back to old servers in < 5 min.

---

## Related Documents

- [Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md)
- [Architecture Design](./MCP_SMART_AGENT_ARCHITECTURE.md)
- [MCP Tools Specification](./MCP_TOOLS_SPECIFICATION.md)
