---
name: workflow-management
description: Streamline PayK12 development workflows with intelligent coordination, cost optimization, and continuous feedback loops. Use when orchestrating multi-step tasks, monitoring workflow health, or optimizing development processes across repositories.
---

# PayK12 Workflow Management

Streamline development workflows across the PayK12 multi-repository system with intelligent task coordination, cost tracking, and continuous improvement feedback. This skill provides patterns for workflow optimization, monitoring, and automation.

## When to Use This Skill

- Monitoring `/bug-fix` command execution and success rates
- Analyzing token usage and cost optimization opportunities
- Coordinating multi-step tasks across repositories
- Tracking workflow health metrics and improvements
- Implementing workflow automation strategies
- Planning sprint work and task allocation
- Analyzing performance bottlenecks
- Managing developer productivity

## When NOT to Use

- For specific repository development → Use repository-specific skills
- For infrastructure/deployment → Invoke `cloud-architect` or `deployment-engineer`
- For individual feature development → Use `nextjs-pro`, `dotnet-pro` agents
- For security concerns → Invoke `security-auditor` agent

## Quick Reference

### Workflow System Overview

```
PayK12 Workflow Stack:
├── /bug-fix command (2120+ lines)
│   ├── Phase 1: Analysis
│   ├── Phase 2: Reproduction (Playwright)
│   ├── Phase 3: Implementation
│   ├── Phase 4: Testing
│   └── Phase 5: PR Creation
├── Session logging & cost tracking
├── Agent dispatch & coordination
└── Continuous improvement feedback
```

### Key Metrics to Track

1. **Success Rate**: % of workflows that complete without manual intervention
2. **Iteration Count**: Average iterations per bug fix (target: 1-2)
3. **Cost Per Bug**: Total tokens used divided by bugs fixed
4. **Time Per Bug**: Wall-clock time from start to merge
5. **Agent Utilization**: Which agents are most frequently used
6. **Context Cache Hit Rate**: Cached vs. fresh context loads
7. **Token Efficiency**: Tokens used per artifact generated

## Core Workflow Patterns

### Pattern 1: Automated Bug Fix Workflow

**The /bug-fix Command Flow**:
```
User: /bug-fix PL-479

1. ANALYSIS PHASE
   ├─ Parse JIRA ticket PL-479
   ├─ Extract requirements
   ├─ Identify repository scope
   ├─ Assess complexity
   └─ Create execution plan

2. REPRODUCTION PHASE
   ├─ Generate test case for bug
   ├─ Run Playwright tests (should fail)
   ├─ Capture failure evidence
   ├─ Document reproduction steps
   └─ Create test baseline

3. IMPLEMENTATION PHASE
   ├─ Dispatch to appropriate agent
   │  ├─ dotnet-pro for API changes
   │  ├─ nextjs-pro for frontend changes
   │  ├─ legacy-modernizer for legacy changes
   │  └─ multi-repo-fixer for cross-repo
   ├─ Implement fix
   ├─ Run local tests
   └─ Update documentation

4. TESTING PHASE
   ├─ Run Playwright tests (should pass)
   ├─ Run unit tests
   ├─ Run integration tests
   ├─ Check code coverage
   └─ Verify no regressions

5. PR CREATION PHASE
   ├─ Create merge request with:
   │  ├─ Clear description
   │  ├─ Testing evidence
   │  ├─ Screenshots/traces if applicable
   │  └─ Auto-link to JIRA ticket
   ├─ Post CI/CD results
   ├─ Wait for reviews
   └─ Merge when approved

FEEDBACK & ITERATION (up to 3 times)
   ├─ Monitor test failures
   ├─ Self-heal common issues
   ├─ Provide diagnostic information
   └─ Attempt auto-fix or escalate
```

**Success Indicators**:
- ✅ All tests pass (Playwright, unit, integration)
- ✅ No code coverage regression
- ✅ PR successfully created and auto-linked
- ✅ Documentation updated
- ✅ No manual intervention needed

### Pattern 2: Cost Optimization Workflow

**Token Usage Breakdown**:
```
Average Cost Per Bug Fix:

Context Loading:        25,000 tokens (35%)
  ├─ Architecture context
  ├─ Repository structure
  ├─ Existing patterns
  └─ Test infrastructure

Analysis Phase:          12,000 tokens (17%)
  ├─ JIRA ticket parsing
  ├─ Code review
  └─ Planning

Reproduction Phase:       8,000 tokens (11%)
  ├─ Test generation
  ├─ Test execution analysis
  └─ Evidence capture

Implementation Phase:    18,000 tokens (25%)
  ├─ Code writing
  ├─ Local testing
  └─ Refinement

Testing Phase:            5,000 tokens (7%)
  ├─ Test monitoring
  ├─ Result analysis
  └─ Coverage check

Total Average:           70,000 tokens (~$2.10/bug fix)

Optimization Opportunities:
├─ Cache context (save 35% → 25,000 tokens)
├─ Reuse test patterns (save 20% of reproduction)
├─ Parallel execution (reduce wall-clock time 30%)
└─ Early termination on simple bugs
```

**Optimization Strategies**:

1. **Context Caching** (saves 8,750 tokens per workflow):
```
Before: Load context fresh each time
Cost: 25,000 tokens per bug

After: Cache and reuse context
Cost: 16,250 tokens (35% savings)

Action: Implement context-manager agent
Timeline: 6 weeks
ROI: Break-even after 5 bugs
```

2. **Parallel Execution** (saves 30% wall-clock time):
```
Before: Sequential phases (1 → 2 → 3 → 4 → 5)
Time: ~45 minutes per bug

After: Parallel where possible
- Phase 2 & 3 overlap (testing while implementing)
- Phase 1 & 2 analysis done in parallel
Time: ~30 minutes per bug

Implementation: Update /bug-fix workflow
Timeline: 1 week
Impact: 15 more bugs/day throughput
```

3. **Pattern Reuse** (saves tokens, improves speed):
```
First IDOR vulnerability:  70,000 tokens
Second IDOR vulnerability: 35,000 tokens (50% savings)
  └─ Reuse test patterns and fixes

Action: Build pattern library for common bug types
Timeline: 2 weeks (after 10-15 bugs)
Savings: ~30% average cost reduction
```

### Pattern 3: Workflow Health Monitoring

**Health Score Calculation**:
```
Overall Workflow Health = (S × 0.3) + (I × 0.25) + (C × 0.2) + (A × 0.25)

Where:
S = Success Rate (target: 95%+)
I = Iteration Efficiency (1-2 iterations ideal)
C = Cost Efficiency (tokens per bug)
A = Agent Accuracy (code quality)

Health Score Interpretation:
90-100 = Excellent ✅ (no action needed)
80-90  = Good ⚠️ (monitor, optimize when needed)
70-80  = Fair ⚠️ (identify bottlenecks)
< 70   = Poor ❌ (investigation required)
```

**Metrics Dashboard**:
```
Last 30 Days Summary:
├─ Bugs Fixed: 47
├─ Success Rate: 91.5% (43/47)
├─ Avg Iterations: 1.4
├─ Avg Cost: $2.15 per bug
├─ Total Cost: $101.05
├─ Avg Time: 38 minutes
├─ Agent Accuracy: 94%
└─ Context Cache Hit Rate: 62%

Trend Analysis:
├─ Cost trending down (-12% vs prev month)
├─ Success rate improving (+5%)
├─ Speed improving (-7 min avg time)
└─ Cache efficiency improving (+8%)

Recommendations:
├─ Deploy context-manager (projected 35% cost savings)
├─ Implement parallel execution (30% speed improvement)
├─ Build IDOR pattern library (50% cost savings for security bugs)
└─ Add code review agent (improve accuracy to 98%)

Estimated Impact (if all implemented):
├─ Cost: $101/month → $52/month (48% savings)
├─ Speed: 38 min → 26 min (31% faster)
├─ Success: 91% → 97% (+6%)
└─ Throughput: 47 bugs → 72 bugs (+53%)
```

## Multi-Repository Coordination

### Cross-Repository Bug Fixes

**Scenario**: Bug requires changes in multiple repositories

```
Bug: Contact creation fails because validation differs between frontend and API

Step 1: Analysis
├─ Identify affected repositories:
│  ├─ repos/frontend (React validation)
│  ├─ repos/api (C# validation)
│  └─ repos/legacy-api (legacy validation)
├─ Find root cause (one has different rules)
└─ Plan synchronization strategy

Step 2: Design Solution
├─ Decide on source of truth:
│  ├─ Option A: Shared validation schema
│  ├─ Option B: One repo leads, others follow
│  └─ Option C: Message-based synchronization
└─ Determine update order

Step 3: Implementation Order
├─ First: Backend (API) - source of truth
├─ Second: Frontend (React) - sync with API
└─ Third: Legacy API - gradual migration

Step 4: Testing
├─ Test API validation changes
├─ Test Frontend integration with new API
├─ Test Legacy API still works (compatibility mode)
└─ End-to-end workflow test

Step 5: Deployment
├─ Deploy API changes first
├─ Monitor for issues
├─ Deploy frontend changes
├─ Monitor E2E tests
└─ Plan legacy-API deprecation
```

### Coordination Patterns

**Pattern 1: Sequential Deployment**
```
repo/api → repo/frontend → (later) repos/legacy-api
Used when: Backward compatibility needed
Risk: Low (version gating)
Speed: Slower (staggered deploys)
```

**Pattern 2: Parallel Deployment**
```
repo/api ─┐
          ├─→ repo/frontend
repos/legacy-api ─┘
Used when: Breaking changes or major refactor
Risk: Medium (coordination required)
Speed: Faster (parallel work)
```

**Pattern 3: Feature Flag Driven**
```
Deploy all changes with flags OFF
Enable flags gradually per region/user
Rollback by disabling flags
Used when: Zero-downtime deployment needed
Risk: Low (easy rollback)
Speed: Medium (flag toggling)
```

## Automation & Self-Healing

### Auto-Healing Strategy

**Tier 1: Deterministic Fixes** (High confidence)
```
Issue: Formatting violations
Fix: Auto-apply prettier/eslint
Confidence: 100%
Action: Auto-commit, notify user

Issue: Missing nullable type annotations
Fix: Add ? to type signature
Confidence: 98%
Action: Suggest, wait for approval
```

**Tier 2: Heuristic Fixes** (Medium confidence)
```
Issue: Test failing on assertion
Fix: Suggest mock adjustment
Confidence: 75%
Action: Create PR with suggestion, wait for review

Issue: API endpoint not found
Fix: Check version mismatch, suggest compatibility mode
Confidence: 70%
Action: Log issue, escalate to human
```

**Tier 3: Manual Escalation** (Low confidence)
```
Issue: Unexpected algorithm behavior
Fix: Escalate to human with diagnostics
Confidence: < 50%
Action: Provide full context, request human decision

Issue: Design decision conflict
Fix: Escalate with alternatives
Confidence: < 40%
Action: Request human judgment
```

## Best Practices

### DO ✅

- Monitor workflow metrics regularly (weekly)
- Implement incremental improvements (1 per sprint)
- Cache reusable context and patterns
- Run cost analysis monthly
- Maintain improvement backlog
- Document successful patterns
- Share patterns across team
- Automate repetitive tasks
- Monitor agent accuracy
- Plan for scale growth

### DON'T ❌

- Don't ignore efficiency metrics
- Don't over-engineer before measuring
- Don't skip documentation
- Don't lose track of costs
- Don't implement all optimizations at once
- Don't ignore team feedback
- Don't assume one size fits all bugs
- Don't forget to measure improvements
- Don't create technical debt for speed
- Don't forget to update patterns

## Related Resources

- **Bug Fix Automation**: `/bug-fix` command (2120+ lines)
- **Session Tracking**: `log-session.sh` script
- **Context Management**: `context-manager-integration-plan.md`
- **Agent Coordination**: `agent-organizer` agent

## Troubleshooting

| Issue | Indicator | Solution |
|-------|-----------|----------|
| High costs | > $3/bug average | Analyze token usage, implement caching |
| Low success rate | < 85% pass rate | Review agent accuracy, add patterns |
| Slow execution | > 60 min avg time | Profile phases, parallelize where possible |
| Cache misses | < 50% hit rate | Expand cache policies, reuse patterns |
| Manual escalations | > 10% of bugs | Improve auto-healing heuristics |

## Getting Help

For workflow optimization:
- Invoke `product-manager` agent for strategy
- Invoke `performance-engineer` for bottleneck analysis
- Invoke `agent-organizer` for coordination issues
- Check `/docs/workflow-engine-guide.md` for advanced topics
