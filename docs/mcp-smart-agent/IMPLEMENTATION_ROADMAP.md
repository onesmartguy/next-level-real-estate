# MCP Smart Agent Server - Implementation Roadmap

**Version**: 1.0
**Last Updated**: 2025-11-07
**Status**: Planning → Implementation

---

## Executive Summary

This document outlines the complete implementation roadmap for consolidating four separate MCP servers (mcp-elevenlabs-server, mcp-twilio-server, mcp-realgeeks-server, and calling/TCPA services) into a single unified **mcp-smart-agent-server**.

**Key Benefits**:
- Single unified interface for all calling operations
- Built-in TCPA compliance checking
- Stateful call and lead tracking
- Comprehensive audit trail
- Reduced operational complexity

**Total Implementation Time**: ~3.5-4 hours
**Team Size**: 1 developer

---

## Phase Breakdown

### Phase 1: Project Setup (30 minutes)
**Objectives**: Establish project structure and foundational configuration

#### Tasks:
1. **Create mcp-smart-agent-server directory structure** (5 min)
   - Create `/mcp-servers/mcp-smart-agent-server/`
   - Create subdirectories: `src`, `src/models`, `src/services`, `src/tools`, `src/webhooks`
   - Create build output directory: `dist/`

2. **Set up TypeScript configuration** (10 min)
   - Create `tsconfig.json` with strict mode enabled
   - Configure module resolution for Node.js
   - Set up source maps for debugging

3. **Create package.json with dependencies** (10 min)
   - Add core dependencies:
     - `@anthropic-sdk/sdk` (Claude Agent SDK)
     - `twilio` (Twilio API client)
     - `@elevenlabs/elevenlabs-js` (ElevenLabs API client)
     - `express` (HTTP server)
     - `dotenv` (Environment variables)
   - Add dev dependencies:
     - `typescript` (TypeScript compiler)
     - `@types/node` (Node.js type definitions)
     - `@types/express` (Express type definitions)
   - Add build scripts: `build`, `start`, `dev`

4. **Implement data models** (5 min)
   - Create `src/models/Call.ts`: Call state interface
   - Create `src/models/Lead.ts`: Lead data interface
   - Create `src/models/ComplianceRecord.ts`: TCPA compliance record interface
   - Create `src/models/ConversationState.ts`: Active conversation tracking

**Success Criteria**:
- ✅ Directory structure created
- ✅ TypeScript compiles without errors
- ✅ `npm install` runs successfully
- ✅ All model interfaces defined and exported

---

### Phase 2: Service Layer Implementation (45 minutes)
**Objectives**: Build foundational services for API interactions and state management

#### Tasks:
5. **Create TwilioClient wrapper service** (15 min)
   - Wrapper around Twilio SDK
   - Methods: `makeCall()`, `getCall()`, `endCall()`, `recordCall()`
   - Error handling with retry logic
   - Logging for all operations

6. **Create ElevenLabsClient wrapper service** (15 min)
   - Wrapper around ElevenLabs SDK
   - Methods: `createAgent()`, `updateAgent()`, `getAgent()`, `listAgents()`, `listVoices()`, `getVoice()`
   - Signed URL generation for ConversationRelay
   - Fallback agent configuration

7. **Implement CallManager service** (10 min)
   - In-memory state management for active calls
   - Methods: `createCall()`, `updateCall()`, `getCall()`, `getHistory()`, `associateLead()`
   - Call lifecycle tracking (initiated → ringing → in-progress → completed)
   - Optional persistence layer for durability

8. **Implement TCPAChecker compliance service** (5 min)
   - Pre-call compliance validation
   - Methods: `checkCompliance()`, `verifyConsent()`, `checkDNC()`, `addToDNC()`
   - DNC registry checking (mock for now, can integrate with real service)
   - Audit trail for all compliance checks

**Success Criteria**:
- ✅ All services implement required interfaces
- ✅ Services handle errors gracefully
- ✅ Logging shows all operations
- ✅ Services can be instantiated and tested in isolation

---

### Phase 3: MCP Tools Implementation (90 minutes)
**Objectives**: Implement all 18 MCP tools across 4 categories

#### 3A: Call Orchestration Tools (20 minutes) - 5 tools

9. **Implement Call Orchestration tools**
   - `initiate_call_with_compliance` (8 min)
     - Accepts: lead data, phone number, agent ID
     - Performs TCPA check before calling
     - Injects dynamic variables
     - Returns: call SID and compliance status

   - `get_call_status` (3 min)
     - Accepts: call SID
     - Returns: current call status, duration, outcome

   - `end_call` (2 min)
     - Accepts: call SID
     - Returns: success confirmation

   - `get_call_history` (4 min)
     - Accepts: limit, offset
     - Returns: list of recent calls with details

   - `list_active_calls` (3 min)
     - No parameters
     - Returns: all in-progress calls

#### 3B: Twilio Operations Tools (15 minutes) - 4 tools

10. **Implement Twilio Operations tools**
    - `twilio_make_call` (5 min)
      - Raw Twilio call creation
      - Parameters: to, from, url, recording settings

    - `twilio_get_call` (3 min)
      - Get call details from Twilio

    - `twilio_end_call` (2 min)
      - Terminate call via Twilio API

    - `twilio_record_call` (5 min)
      - Enable recording for active call

#### 3C: ElevenLabs Operations Tools (25 minutes) - 6 tools

11. **Implement ElevenLabs Operations tools**
    - `elevenlabs_create_agent` (5 min)
      - Create new conversational AI agent
      - Parameters: name, description, model, voice, system prompt

    - `elevenlabs_update_agent` (5 min)
      - Modify existing agent configuration

    - `elevenlabs_get_agent` (3 min)
      - Retrieve agent details and settings

    - `elevenlabs_list_agents` (2 min)
      - List all agents with pagination

    - `elevenlabs_list_voices` (3 min)
      - Browse available voices with filters

    - `elevenlabs_get_voice` (2 min)
      - Get detailed voice information

#### 3D: TCPA Compliance Tools (15 minutes) - 3 tools

12. **Implement TCPA Compliance tools**
    - `check_tcpa_compliance` (8 min)
      - Comprehensive pre-call compliance check
      - Verifies: consent, DNC status, call frequency
      - Returns: compliance status and blocking reason if failed

    - `verify_consent` (4 min)
      - Check if lead has valid consent
      - Returns: consent status, date, method

    - `check_dnc_status` (3 min)
      - Check DNC registry and internal list
      - Returns: DNC status with reason

**Success Criteria**:
- ✅ All 18 tools registered with MCP server
- ✅ Each tool has proper input validation
- ✅ Each tool has comprehensive error handling
- ✅ Each tool logs all operations
- ✅ Tools can be tested individually

---

### Phase 4: MCP Server & Webhooks (45 minutes)
**Objectives**: Create MCP server entry point and HTTP webhook handlers

#### Tasks:
13. **Create MCP server entry point** (15 min)
    - Create `src/index.ts`
    - Initialize MCP server with Anthropic SDK
    - Register all 18 tools
    - Add request/response logging
    - Handle errors and disconnections

14. **Implement Express HTTP server** (10 min)
    - Create `src/server.ts`
    - Set up Express app
    - Add middleware for logging and parsing
    - Configure CORS if needed
    - Add `/health` endpoint

15. **Implement conversation-relay webhook** (10 min)
    - Handle `POST /webhooks/conversation-relay`
    - Parse Twilio request parameters
    - Fetch signed URL from ElevenLabs
    - Return TwiML with ConversationRelay stream
    - Log all operations

16. **Implement status-callback webhook** (5 min)
    - Handle `POST /webhooks/status-callback`
    - Update call status in CallManager
    - Log status transitions
    - Trigger any post-call actions

17. **Implement recording-callback webhook** (5 min)
    - Handle `POST /webhooks/recording-callback`
    - Store recording URL in call record
    - Trigger transcription if configured
    - Log recording availability

18. **Add comprehensive error handling & logging** (optional concurrent)
    - Create `src/utils/logger.ts` for consistent logging
    - Add error middleware to Express
    - Implement structured logging with timestamps
    - Add request/response correlation IDs

**Success Criteria**:
- ✅ MCP server starts without errors
- ✅ All endpoints respond to requests
- ✅ Errors are caught and logged appropriately
- ✅ Health check endpoint returns 200 OK
- ✅ Webhook endpoints return expected responses

---

### Phase 5: Testing & Validation (45 minutes)
**Objectives**: Verify all functionality works correctly

#### Tasks:
19. **Test all 18 MCP tools independently** (30 min)
    - Write test script for each tool
    - Test with valid parameters
    - Test with invalid parameters
    - Verify error handling
    - Document expected outputs

20. **Test all 3 webhook endpoints** (10 min)
    - Test conversation-relay with sample Twilio request
    - Test status-callback with various call statuses
    - Test recording-callback with recording data
    - Verify TwiML responses are valid

21. **Test end-to-end call flow with TCPA** (5 min)
    - Initiate call via tool
    - Verify TCPA check is performed
    - Verify call is made to Twilio
    - Verify status updates are received
    - Verify compliance is logged

**Success Criteria**:
- ✅ All 18 tools tested and working
- ✅ All 3 webhooks tested and working
- ✅ End-to-end flow completes successfully
- ✅ TCPA compliance blocks non-compliant calls
- ✅ All test results documented

---

### Phase 6: Documentation & Migration (30 minutes)
**Objectives**: Document the new system and migrate from old servers

#### Tasks:
22. **Create README and API documentation** (10 min)
    - Create `README.md` with setup instructions
    - Create API reference for all 18 tools
    - Include quick start examples
    - Document environment variables

23. **Archive old MCP servers** (5 min)
    - Move to `_archived/` directory:
      - `mcp-elevenlabs-server`
      - `mcp-twilio-server`
      - `mcp-realgeeks-server`
    - Create deprecation notice
    - Update imports to point to new server

24. **Update integration documentation** (15 min)
    - Update `docs/TWILIO_WEBHOOK_SETUP.md`
    - Update `docs/api/twilio.md`
    - Update `docs/api/elevenlabs.md`
    - Create migration guide for old tools
    - Update main README.md

**Success Criteria**:
- ✅ All documentation is clear and complete
- ✅ Old servers are archived with notices
- ✅ All references point to new server
- ✅ Migration guide is provided

---

## Timeline Summary

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Setup | 30 min | 🔴 Not Started |
| Phase 2: Services | 45 min | 🔴 Not Started |
| Phase 3: Tools | 90 min | 🔴 Not Started |
| Phase 4: Server & Webhooks | 45 min | 🔴 Not Started |
| Phase 5: Testing | 45 min | 🔴 Not Started |
| Phase 6: Documentation | 30 min | 🔴 Not Started |
| **TOTAL** | **285 min (4.75 hrs)** | 🔴 Not Started |

---

## Dependencies & Prerequisites

### Required Environment Variables
```bash
ELEVENLABS_API_KEY=sk_xxxxx
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+12147305642
ELEVENLABS_AGENT_ID=agent_xxxxx
```

### Required External Services
- ✅ Twilio account with active phone number
- ✅ ElevenLabs account with API key
- ✅ Agent created in ElevenLabs (Production Agent Sydney)
- ✅ Webhook handler deployed to Vercel

### Node.js & Tools
- ✅ Node.js 18+ with npm
- ✅ TypeScript 5.x
- ✅ Git for version control

---

## Success Criteria Summary

### Overall Project
- ✅ All 24 tasks completed
- ✅ mcp-smart-agent-server running and healthy
- ✅ All 18 tools functional and tested
- ✅ All 3 webhooks responding correctly
- ✅ TCPA compliance working
- ✅ Call state tracking working
- ✅ Full end-to-end call flow working
- ✅ Old servers archived
- ✅ Documentation complete and up-to-date

### Code Quality
- ✅ TypeScript strict mode enabled
- ✅ All functions have error handling
- ✅ Comprehensive logging throughout
- ✅ Code is well-commented
- ✅ No console.log (use logger)

### Functionality
- ✅ Initiates outbound calls via Twilio
- ✅ Connects to ElevenLabs agents
- ✅ Checks TCPA compliance pre-call
- ✅ Injects dynamic variables into calls
- ✅ Tracks call state and outcomes
- ✅ Logs all compliance decisions
- ✅ Handles errors gracefully
- ✅ Supports status and recording callbacks

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Build complexity | Break into phases, test each phase independently |
| Integration issues | Extensive testing of each component |
| TCPA compliance bugs | Dedicated compliance service with audit trail |
| Missing variables | Create comprehensive test suite |
| API rate limits | Implement exponential backoff retry logic |
| State loss on restart | Add optional persistence layer |

---

## Post-Implementation Tasks

1. **Monitor in Production**
   - Watch logs for errors
   - Track call success rates
   - Monitor API latency

2. **Optimize Performance**
   - Profile tool execution times
   - Optimize database queries if using persistence
   - Cache frequently accessed data

3. **Gather Feedback**
   - Collect user feedback on new tools
   - Track pain points
   - Plan improvements

4. **Future Enhancements**
   - Add RealGeeks CRM integration
   - Add lead database integration
   - Add call recording transcription
   - Add sentiment analysis
   - Add A/B testing capabilities

---

## Related Documents

- [MCP Smart Agent Architecture](./MCP_SMART_AGENT_ARCHITECTURE.md)
- [MCP Tools Specification](./MCP_TOOLS_SPECIFICATION.md)
- [Webhook Endpoints Specification](./WEBHOOK_ENDPOINTS_SPEC.md)
- [TCPA Compliance Guide](./TCPA_COMPLIANCE_GUIDE.md)
- [State Management Design](./STATE_MANAGEMENT_DESIGN.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [API Integration Examples](./API_INTEGRATION_EXAMPLES.md)

---

**Next Step**: Proceed to Phase 1 when ready.
