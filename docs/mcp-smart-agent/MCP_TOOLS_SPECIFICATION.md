# MCP Smart Agent Server - Tools Specification

**Version**: 1.0
**Last Updated**: 2025-11-07
**Total Tools**: 18

---

## Table of Contents

1. [Call Orchestration Tools (5)](#call-orchestration-tools)
2. [Twilio Operations Tools (4)](#twilio-operations-tools)
3. [ElevenLabs Operations Tools (6)](#elevenlabs-operations-tools)
4. [TCPA Compliance Tools (3)](#tcpa-compliance-tools)
5. [Error Codes & Responses](#error-codes--responses)
6. [Tool Usage Patterns](#tool-usage-patterns)

---

## Call Orchestration Tools

### 1. initiate_call_with_compliance

**Purpose**: High-level tool to initiate outbound call with automatic TCPA compliance checking

**Parameters**:
```json
{
  "type": "object",
  "properties": {
    "leadId": {
      "type": "string",
      "description": "Unique lead identifier"
    },
    "to": {
      "type": "string",
      "description": "Recipient phone number (E.164 format: +1234567890)"
    },
    "agentId": {
      "type": "string",
      "description": "ElevenLabs agent ID"
    },
    "dynamicVariables": {
      "type": "object",
      "description": "Lead-specific data to inject into agent (max 10 variables)",
      "properties": {
        "first_name": { "type": "string" },
        "last_name": { "type": "string" },
        "property_address": { "type": "string" },
        "estimated_arv": { "type": "string" },
        "estimated_equity": { "type": "string" },
        "repair_estimate": { "type": "string" },
        "investor_type": { "type": "string" },
        "contact_method": { "type": "string" },
        "best_time_to_call": { "type": "string" },
        "property_type": { "type": "string" }
      }
    },
    "recordCall": {
      "type": "boolean",
      "default": true,
      "description": "Enable call recording"
    }
  },
  "required": ["leadId", "to", "agentId"]
}
```

**Response**:
```json
{
  "success": true,
  "callSid": "CA1234567890abcdef1234567890abcdef",
  "leadId": "lead_123",
  "status": "initiated",
  "complianceStatus": "approved",
  "timestamp": "2025-11-07T10:30:00Z"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "COMPLIANCE_BLOCKED",
    "message": "Lead does not have written consent",
    "details": {
      "reason": "consent_missing",
      "blockDate": "2025-11-07T10:30:00Z"
    },
    "retryable": false
  }
}
```

**Behavior**:
1. Validate inputs (phone number format, agent exists)
2. Create call record in CallManager
3. Check TCPA compliance via TCPAChecker
4. If blocked: Return error with reason
5. If approved: Call TwilioClient.makeCall()
6. Return call SID and status

**Errors**:
- `INVALID_PHONE`: Phone number invalid format
- `INVALID_AGENT`: Agent ID not found
- `COMPLIANCE_BLOCKED`: TCPA check failed
- `API_ERROR`: Twilio API error

---

### 2. get_call_status

**Purpose**: Check status of specific call

**Parameters**:
```json
{
  "type": "object",
  "properties": {
    "callSid": {
      "type": "string",
      "description": "Twilio call SID"
    }
  },
  "required": ["callSid"]
}
```

**Response**:
```json
{
  "success": true,
  "callSid": "CA1234567890abcdef1234567890abcdef",
  "leadId": "lead_123",
  "status": "in-progress",
  "to": "+1234567890",
  "from": "+12147305642",
  "duration": 45,
  "startTime": "2025-11-07T10:30:00Z",
  "recordingUrl": null,
  "complianceStatus": "approved"
}
```

**Errors**:
- `CALL_NOT_FOUND`: Call SID not found
- `API_ERROR`: Twilio API error

---

### 3. end_call

**Purpose**: Terminate active call

**Parameters**:
```json
{
  "type": "object",
  "properties": {
    "callSid": {
      "type": "string",
      "description": "Twilio call SID"
    }
  },
  "required": ["callSid"]
}
```

**Response**:
```json
{
  "success": true,
  "callSid": "CA1234567890abcdef1234567890abcdef",
  "status": "completed",
  "duration": 120,
  "endTime": "2025-11-07T10:32:00Z"
}
```

**Errors**:
- `CALL_NOT_FOUND`: Call not found
- `CALL_ALREADY_ENDED`: Call already terminated
- `API_ERROR`: Twilio API error

---

### 4. get_call_history

**Purpose**: Retrieve recent calls with optional filtering

**Parameters**:
```json
{
  "type": "object",
  "properties": {
    "limit": {
      "type": "integer",
      "default": 10,
      "maximum": 100,
      "description": "Number of calls to return"
    },
    "offset": {
      "type": "integer",
      "default": 0,
      "description": "Pagination offset"
    },
    "leadId": {
      "type": "string",
      "description": "Filter by lead ID"
    },
    "status": {
      "type": "string",
      "enum": ["initiated", "ringing", "in-progress", "completed", "failed"],
      "description": "Filter by call status"
    },
    "dateFrom": {
      "type": "string",
      "format": "date-time",
      "description": "Filter calls after this date"
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "calls": [
    {
      "callSid": "CA1234567890abcdef1234567890abcdef",
      "leadId": "lead_123",
      "status": "completed",
      "to": "+1234567890",
      "duration": 120,
      "startTime": "2025-11-07T10:30:00Z",
      "endTime": "2025-11-07T10:32:00Z",
      "recordingUrl": "https://..."
    }
  ],
  "total": 42,
  "limit": 10,
  "offset": 0
}
```

---

### 5. list_active_calls

**Purpose**: Get all currently active calls

**Parameters**: None

**Response**:
```json
{
  "success": true,
  "activeCalls": [
    {
      "callSid": "CA1111111111111111111111111111111111",
      "leadId": "lead_456",
      "to": "+1987654321",
      "status": "in-progress",
      "duration": 45,
      "startTime": "2025-11-07T10:45:00Z"
    },
    {
      "callSid": "CA2222222222222222222222222222222222",
      "leadId": "lead_789",
      "to": "+1555555555",
      "status": "ringing",
      "duration": 5,
      "startTime": "2025-11-07T10:50:00Z"
    }
  ],
  "totalActive": 2
}
```

---

## Twilio Operations Tools

### 6. twilio_make_call

**Purpose**: Low-level Twilio call initiation

**Parameters**:
```json
{
  "type": "object",
  "properties": {
    "to": {
      "type": "string",
      "description": "Recipient phone number"
    },
    "from": {
      "type": "string",
      "description": "Caller ID number (must be Twilio-owned)",
      "default": "+12147305642"
    },
    "url": {
      "type": "string",
      "description": "TwiML callback URL"
    },
    "record": {
      "type": "boolean",
      "default": true,
      "description": "Record the call"
    },
    "recordingStatusCallback": {
      "type": "string",
      "description": "Webhook URL for recording ready notification"
    },
    "statusCallback": {
      "type": "string",
      "description": "Webhook URL for call status updates"
    }
  },
  "required": ["to", "url"]
}
```

**Response**:
```json
{
  "success": true,
  "callSid": "CA1234567890abcdef1234567890abcdef",
  "status": "initiated",
  "to": "+1234567890",
  "from": "+12147305642"
}
```

---

### 7. twilio_get_call

**Purpose**: Retrieve call details from Twilio

**Parameters**:
```json
{
  "type": "object",
  "properties": {
    "callSid": {
      "type": "string",
      "description": "Twilio call SID"
    }
  },
  "required": ["callSid"]
}
```

**Response**:
```json
{
  "success": true,
  "callSid": "CA1234567890abcdef1234567890abcdef",
  "from": "+12147305642",
  "to": "+1234567890",
  "status": "in-progress",
  "startTime": "2025-11-07T10:30:00Z",
  "duration": 45,
  "price": "-0.02"
}
```

---

### 8. twilio_end_call

**Purpose**: Terminate Twilio call

**Parameters**:
```json
{
  "type": "object",
  "properties": {
    "callSid": {
      "type": "string",
      "description": "Twilio call SID"
    }
  },
  "required": ["callSid"]
}
```

**Response**:
```json
{
  "success": true,
  "callSid": "CA1234567890abcdef1234567890abcdef",
  "status": "completed"
}
```

---

### 9. twilio_record_call

**Purpose**: Enable recording for active call

**Parameters**:
```json
{
  "type": "object",
  "properties": {
    "callSid": {
      "type": "string",
      "description": "Twilio call SID"
    }
  },
  "required": ["callSid"]
}
```

**Response**:
```json
{
  "success": true,
  "callSid": "CA1234567890abcdef1234567890abcdef",
  "recordingEnabled": true
}
```

---

## ElevenLabs Operations Tools

### 10. elevenlabs_create_agent

**Purpose**: Create new ElevenLabs conversational AI agent

**Parameters**:
```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Agent name"
    },
    "description": {
      "type": "string",
      "description": "Agent description"
    },
    "voiceId": {
      "type": "string",
      "description": "Voice ID for agent"
    },
    "systemPrompt": {
      "type": "string",
      "description": "System prompt for agent behavior"
    },
    "model": {
      "type": "string",
      "enum": ["flash_2.5", "qwen_3_30b", "gemini_2.5"],
      "default": "flash_2.5",
      "description": "LLM model for agent"
    },
    "maxDuration": {
      "type": "integer",
      "default": 600,
      "description": "Max call duration in seconds"
    }
  },
  "required": ["name", "voiceId", "systemPrompt"]
}
```

**Response**:
```json
{
  "success": true,
  "agentId": "agent_1234567890abcdef",
  "name": "Sydney Real Estate Agent",
  "status": "active",
  "voiceId": "yM93hbw8Qtvdma2wCnJG"
}
```

---

### 11. elevenlabs_update_agent

**Purpose**: Modify existing agent configuration

**Parameters**:
```json
{
  "type": "object",
  "properties": {
    "agentId": {
      "type": "string",
      "description": "Agent ID to update"
    },
    "updates": {
      "type": "object",
      "description": "Fields to update (name, voiceId, systemPrompt, etc)"
    }
  },
  "required": ["agentId", "updates"]
}
```

**Response**:
```json
{
  "success": true,
  "agentId": "agent_1234567890abcdef",
  "updated": true,
  "timestamp": "2025-11-07T10:30:00Z"
}
```

---

### 12. elevenlabs_get_agent

**Purpose**: Retrieve agent details

**Parameters**:
```json
{
  "type": "object",
  "properties": {
    "agentId": {
      "type": "string",
      "description": "Agent ID"
    }
  },
  "required": ["agentId"]
}
```

**Response**:
```json
{
  "success": true,
  "agent": {
    "agentId": "agent_1234567890abcdef",
    "name": "Sydney Real Estate Agent",
    "voiceId": "yM93hbw8Qtvdma2wCnJG",
    "model": "qwen_3_30b",
    "maxDuration": 600,
    "systemPrompt": "You are a real estate agent...",
    "createdAt": "2025-11-01T00:00:00Z"
  }
}
```

---

### 13. elevenlabs_list_agents

**Purpose**: List all agents

**Parameters**:
```json
{
  "type": "object",
  "properties": {
    "limit": {
      "type": "integer",
      "default": 20,
      "maximum": 100
    },
    "offset": {
      "type": "integer",
      "default": 0
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "agents": [
    {
      "agentId": "agent_1234567890abcdef",
      "name": "Sydney Real Estate Agent",
      "voiceId": "yM93hbw8Qtvdma2wCnJG",
      "model": "qwen_3_30b"
    }
  ],
  "total": 5,
  "limit": 20,
  "offset": 0
}
```

---

### 14. elevenlabs_list_voices

**Purpose**: Browse available voices

**Parameters**:
```json
{
  "type": "object",
  "properties": {
    "limit": {
      "type": "integer",
      "default": 20,
      "maximum": 100
    },
    "offset": {
      "type": "integer",
      "default": 0
    },
    "language": {
      "type": "string",
      "description": "Filter by language (optional)"
    },
    "gender": {
      "type": "string",
      "enum": ["male", "female", "neutral"],
      "description": "Filter by gender (optional)"
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "voices": [
    {
      "voiceId": "yM93hbw8Qtvdma2wCnJG",
      "name": "Warm Female",
      "language": "English (US)",
      "gender": "female",
      "accent": "American"
    }
  ],
  "total": 5000,
  "limit": 20,
  "offset": 0
}
```

---

### 15. elevenlabs_get_voice

**Purpose**: Get detailed voice information

**Parameters**:
```json
{
  "type": "object",
  "properties": {
    "voiceId": {
      "type": "string",
      "description": "Voice ID"
    }
  },
  "required": ["voiceId"]
}
```

**Response**:
```json
{
  "success": true,
  "voice": {
    "voiceId": "yM93hbw8Qtvdma2wCnJG",
    "name": "Warm Female",
    "language": "English (US)",
    "gender": "female",
    "accent": "American",
    "description": "Warm, friendly female voice"
  }
}
```

---

## TCPA Compliance Tools

### 16. check_tcpa_compliance

**Purpose**: Pre-call TCPA 2025 compliance validation

**Parameters**:
```json
{
  "type": "object",
  "properties": {
    "leadId": {
      "type": "string",
      "description": "Lead ID to check"
    },
    "phone": {
      "type": "string",
      "description": "Phone number to call"
    }
  },
  "required": ["leadId", "phone"]
}
```

**Response** (Approved):
```json
{
  "success": true,
  "complianceStatus": "approved",
  "leadId": "lead_123",
  "checks": {
    "consentVerified": true,
    "dncVerified": true,
    "callFrequencyValid": true
  },
  "timestamp": "2025-11-07T10:30:00Z"
}
```

**Response** (Blocked):
```json
{
  "success": false,
  "complianceStatus": "blocked",
  "error": {
    "code": "COMPLIANCE_BLOCKED",
    "message": "Lead does not have written consent",
    "blockReasons": ["consent_missing"]
  }
}
```

**Checks Performed**:
1. **Consent Verification**
   - Written consent exists
   - Consent not expired
   - Call type matches consent

2. **DNC Registry Check**
   - Not on national registry
   - Not on internal DNC list
   - Not recently opted out

3. **Call Frequency Check**
   - Minimum 24 hours since last call
   - Less than 3 calls in past 7 days
   - Lead not marked for no contact

---

### 17. verify_consent

**Purpose**: Check consent status for lead

**Parameters**:
```json
{
  "type": "object",
  "properties": {
    "leadId": {
      "type": "string",
      "description": "Lead ID"
    }
  },
  "required": ["leadId"]
}
```

**Response**:
```json
{
  "success": true,
  "leadId": "lead_123",
  "consent": {
    "hasWrittenConsent": true,
    "consentDate": "2025-10-15T00:00:00Z",
    "consentMethod": "email",
    "consentSource": "Form submission",
    "expiresAt": "2026-10-15T00:00:00Z"
  }
}
```

---

### 18. check_dnc_status

**Purpose**: Check DNC registry status

**Parameters**:
```json
{
  "type": "object",
  "properties": {
    "phone": {
      "type": "string",
      "description": "Phone number to check"
    }
  },
  "required": ["phone"]
}
```

**Response**:
```json
{
  "success": true,
  "phone": "+1234567890",
  "dncStatus": {
    "onNationalRegistry": false,
    "onInternalList": false,
    "lastChecked": "2025-11-07T10:30:00Z"
  },
  "approved": true
}
```

---

## Error Codes & Responses

### Common Error Codes

| Code | Meaning | Retryable |
|------|---------|-----------|
| `INVALID_INPUT` | Input validation failed | No |
| `INVALID_PHONE` | Phone number invalid format | No |
| `INVALID_AGENT` | Agent ID not found | No |
| `COMPLIANCE_BLOCKED` | TCPA check failed | No |
| `CALL_NOT_FOUND` | Call SID not found | No |
| `API_ERROR` | External API error | Yes |
| `RATE_LIMIT` | Too many requests | Yes (with backoff) |
| `TIMEOUT` | Request timeout | Yes |
| `NETWORK_ERROR` | Network connectivity issue | Yes |

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "error_details"
    },
    "retryable": true,
    "retryAfter": 5
  }
}
```

---

## Tool Usage Patterns

### Pattern 1: Simple Call Initiation

```
User Input: "Call John at 555-1234 about the property"

Agent Decision:
1. Call: get_call_history with leadId (check recent attempts)
2. Call: verify_consent(leadId)
3. Call: initiate_call_with_compliance
   - Parameters: leadId, phone, agentId
   - Dynamic variables from lead context
4. Return: Call SID and status to user
```

### Pattern 2: Monitor Active Calls

```
User Input: "Show me all active calls"

Agent Decision:
1. Call: list_active_calls()
2. For each call: get_call_status(callSid)
3. Return: Summary of active calls with status
```

### Pattern 3: TCPA Compliance Audit

```
User Input: "Check compliance for leads in Austin"

Agent Decision:
1. Query: Get all leads in Austin
2. For each lead: check_tcpa_compliance(leadId, phone)
3. Return: Compliance summary with blocked/approved counts
```

### Pattern 4: Agent Management

```
User Input: "List all agents and show warm female voices"

Agent Decision:
1. Call: elevenlabs_list_agents()
2. Call: elevenlabs_list_voices(gender="female")
3. Return: Agent list with available voices
```

---

## Tool Development Notes

### Input Validation
- All string inputs should be trimmed
- Phone numbers validated in E.164 format
- Dates parsed as ISO8601
- Enums case-insensitive

### Rate Limiting
- Twilio API: 100 calls/second per account
- ElevenLabs API: 100 requests/minute per API key
- Implement exponential backoff (1s, 2s, 4s, 8s, 16s)

### Caching
- Agent configurations cached for 1 hour
- Voice list cached for 1 day
- Lead compliance checked fresh every time

### Logging
- Log all tool calls with parameters (excluding sensitive fields)
- Log execution time for performance monitoring
- Log errors with full context for debugging

---

**Related Documents**:
- [Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md)
- [Architecture Design](./MCP_SMART_AGENT_ARCHITECTURE.md)
- [Webhook Specification](./WEBHOOK_ENDPOINTS_SPEC.md)
