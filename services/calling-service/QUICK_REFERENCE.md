# Variable Injection System - Quick Reference

**5-Minute Setup Guide**

---

## Installation

```bash
cd services/calling-service
npm install
```

---

## Minimal Setup (3 Steps)

### 1. Create `.env` file:

```bash
# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+19725551234

# ElevenLabs
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxx
ELEVENLABS_AGENT_ID=agent_xxxxxxxxxxxxx

# Webhooks
WEBHOOK_BASE_URL=https://yourdomain.com
```

### 2. Basic Code:

```typescript
import { TwilioElevenLabsService } from './integrations/twilio-elevenlabs';
import { LeadData } from './variable-injection';

const service = new TwilioElevenLabsService({
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID!,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN!,
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER!,
  elevenlabsAgentId: process.env.ELEVENLABS_AGENT_ID!,
  webhookBaseUrl: process.env.WEBHOOK_BASE_URL!
});

const leadData: LeadData = {
  lead_id: 'lead_123',
  homeowner_first_name: 'Jeff',
  homeowner_last_name: 'Price',
  phone_number: '+19725551234',
  property_address_street: '829 Lake Bluff Drive',
  property_city: 'Flower Mound',
  property_state: 'TX',
  has_consent: true,
  on_dnc_list: false
};

const result = await service.initiateCall(leadData);
console.log(result.success ? `Call SID: ${result.call_sid}` : `Error: ${result.error}`);
```

### 3. Setup Webhooks (Express):

```typescript
app.post('/webhooks/twilio/call-status', (req, res) => {
  service.handleCallStatusWebhook(req.body);
  res.sendStatus(200);
});
```

---

## Required Fields (Minimum)

```typescript
const minimalLead: LeadData = {
  lead_id: string,              // Unique ID
  homeowner_first_name: string, // First name
  homeowner_last_name: string,  // Last name
  phone_number: string,         // E.164 format: +19725551234
  property_address_street: string,
  property_city: string,
  property_state: string,       // 2-letter: TX, CA, etc.
  has_consent: true,            // MUST be true
  on_dnc_list: false            // MUST be false
};
```

---

## Variable Syntax

Use `{{variable_name}}` in templates:

```
Hi {{homeowner_first_name}}, calling about {{property_address_street}}
```

---

## Complete Variable List

### Always Available
- `{{homeowner_first_name}}` - Jeff
- `{{homeowner_last_name}}` - Price
- `{{homeowner_full_name}}` - Jeff Price (auto-generated)
- `{{property_address_street}}` - 829 Lake Bluff Drive
- `{{property_city}}` - Flower Mound
- `{{property_state}}` - TX
- `{{property_full_address}}` - 829 Lake Bluff Dr, Flower Mound, TX (auto-generated)

### Optional (with fallbacks)
- `{{estimated_value}}` - $450,000 (fallback: "fair market value")
- `{{property_size}}` - 3,200 sq ft (fallback: "the property")
- `{{years_owned}}` - 12 (fallback: "a while")
- `{{bedrooms}}` - 4 (fallback: "several")
- `{{bathrooms}}` - 3 (fallback: "multiple")
- `{{property_zip}}` - 75022 (fallback: "")

---

## Quick Checks

### Check TCPA Compliance

```typescript
if (!leadData.has_consent || leadData.on_dnc_list) {
  console.error('TCPA violation - cannot call');
  return;
}
```

### Validate Before Call

```typescript
const result = variableInjectionService.injectVariables(template, prompt, leadData);

if (!result.success) {
  console.error('Blocked:', result.errors);
  return;
}

if (result.warnings.length > 0) {
  console.warn('Warnings:', result.warnings);
}
```

---

## Common Errors & Fixes

| Error | Fix |
|-------|-----|
| "Lead does not have written consent" | Set `has_consent: true` in database |
| "Lead is on Do Not Call list" | Set `on_dnc_list: false` |
| "Missing required variables" | Add missing fields to leadData |
| "Invalid phone number" | Use E.164 format: `+19725551234` |

---

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- variable-injection.test.ts
```

---

## File Structure

```
services/calling-service/
├── variable-injection.ts           # Core service
├── integrations/
│   ├── twilio-elevenlabs.ts       # Twilio integration
│   └── elevenlabs-direct.ts       # Direct API
├── examples/
│   └── basic-usage.ts             # 8 complete examples
├── tests/
│   └── variable-injection.test.ts # Test suite
└── QUICK_REFERENCE.md             # This file
```

---

## Documentation Links

- **Full Documentation**: `/docs/VARIABLE_INJECTION_SYSTEM.md`
- **Examples**: `/services/calling-service/examples/basic-usage.ts`
- **Tests**: `/services/calling-service/tests/variable-injection.test.ts`

---

## Support

Run examples to test your setup:

```bash
cd services/calling-service/examples
npx ts-node basic-usage.ts
```

---

**Version**: 1.0
**Status**: Production-Ready
**Last Updated**: October 31, 2024
