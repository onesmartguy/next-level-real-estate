# Zillow Lead API Integration

## Overview

Zillow Lead API provides real-time webhook delivery of leads from Zillow's Premier Agent and rental listing platforms. Leads are delivered via HTTP POST with property and contact information.

## Key Features

- **Real-Time Delivery**: Webhook POST within seconds of lead submission
- **Property Context**: Includes property address, estimated value, listing details
- **Contact Information**: Name, email, phone with consent tracking
- **Lead Source Attribution**: Tracks which Zillow property generated the lead
- **Rental & Sales Leads**: Supports both rental inquiries and sales leads

## Prerequisites

- Zillow Premier Agent account or rental listings
- Verified domain for webhook endpoint
- SSL certificate (HTTPS required for webhooks)
- Contact rentalfeeds@zillow.com for API access and webhook setup

## Webhook Setup

### Configuration

Contact Zillow support (rentalfeeds@zillow.com) to configure your webhook endpoint:

```
Webhook URL: https://your-domain.com/webhooks/zillow/leads
Method: POST
Content-Type: application/x-www-form-urlencoded
```

### Webhook Security

Zillow webhooks do not include HMAC signatures. Security measures:

1. **IP Allowlisting**: Restrict webhook endpoint to Zillow IPs
2. **HTTPS Only**: Require SSL/TLS
3. **Verification**: Cross-reference lead data with Zillow API if available
4. **Rate Limiting**: Prevent abuse with rate limiting

```javascript
// Express.js middleware for Zillow webhook security
const ZILLOW_IP_RANGES = [
  '18.236.0.0/16',    // AWS us-west-2 (example - verify actual IPs with Zillow)
  '52.88.0.0/16',     // AWS us-west-2
];

function isZillowIP(ip) {
  // Use ipaddr.js or similar to check IP ranges
  const ipaddr = require('ipaddr.js');
  const addr = ipaddr.parse(ip);

  return ZILLOW_IP_RANGES.some(range => {
    const [rangeAddr, prefixLen] = range.split('/');
    const parsedRange = ipaddr.parse(rangeAddr);
    return addr.match(parsedRange, parseInt(prefixLen));
  });
}

app.post('/webhooks/zillow/leads', (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;

  if (!isZillowIP(clientIP)) {
    console.warn(`Rejected webhook from non-Zillow IP: ${clientIP}`);
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
});
```

## Webhook Payload

### Sales Lead Format

```javascript
// POST /webhooks/zillow/leads
// Content-Type: application/x-www-form-urlencoded

{
  // Lead identification
  lead_id: "ZLL-12345678",
  timestamp: "2025-10-24T15:30:00Z",

  // Contact information
  first_name: "John",
  last_name: "Doe",
  email: "john.doe@example.com",
  phone: "555-123-4567",

  // Property details
  property_address: "123 Main St",
  property_city: "Seattle",
  property_state: "WA",
  property_zip: "98101",
  property_zpid: "48749425", // Zillow Property ID

  // Lead context
  lead_type: "buyer", // or "seller"
  message: "I'm interested in viewing this property. When is it available?",
  price: "650000",
  bedrooms: "3",
  bathrooms: "2",
  square_feet: "2100",

  // Source attribution
  source: "zillow_premier_agent",
  listing_url: "https://www.zillow.com/homedetails/123-Main-St-Seattle-WA-98101/48749425_zpid/"
}
```

### Rental Lead Format

```javascript
{
  // Lead identification
  lead_id: "ZLL-RNT-87654321",
  timestamp: "2025-10-24T16:45:00Z",

  // Contact information
  first_name: "Jane",
  last_name: "Smith",
  email: "jane.smith@example.com",
  phone: "555-987-6543",

  // Property details
  property_address: "456 Oak Ave, Apt 2B",
  property_city: "Portland",
  property_state: "OR",
  property_zip: "97201",
  property_zpid: "98765432",

  // Rental-specific
  lead_type: "renter",
  message: "Looking for a pet-friendly apartment. Move-in date: November 1st.",
  monthly_rent: "2200",
  bedrooms: "2",
  bathrooms: "1",
  pets_allowed: "yes",
  move_in_date: "2025-11-01",

  // Source
  source: "zillow_rentals"
}
```

## Webhook Handler Implementation

### Node.js Express Example

```javascript
const express = require('express');
const { Kafka } = require('kafkajs');
const { trace } = require('@opentelemetry/api');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const kafka = new Kafka({
  clientId: 'zillow-webhook-handler',
  brokers: process.env.KAFKA_BROKERS.split(','),
});

const producer = kafka.producer();

app.post('/webhooks/zillow/leads', async (req, res) => {
  const tracer = trace.getTracer('zillow-integration');

  await tracer.startActiveSpan('zillow.webhook.receive', async (span) => {
    try {
      span.setAttribute('service', 'zillow');
      span.setAttribute('lead_id', req.body.lead_id);

      // Parse webhook payload
      const zillowLead = req.body;

      // Normalize to internal lead format
      const lead = {
        source: 'zillow',
        externalId: zillowLead.lead_id,
        receivedAt: new Date(zillowLead.timestamp),

        contact: {
          firstName: zillowLead.first_name,
          lastName: zillowLead.last_name,
          email: zillowLead.email?.toLowerCase(),
          phone: normalizePhoneNumber(zillowLead.phone),
        },

        property: {
          address: zillowLead.property_address,
          city: zillowLead.property_city,
          state: zillowLead.property_state,
          zipCode: zillowLead.property_zip,
          zpid: zillowLead.property_zpid,
          listingUrl: zillowLead.listing_url,
          price: parseFloat(zillowLead.price || zillowLead.monthly_rent),
          bedrooms: parseInt(zillowLead.bedrooms),
          bathrooms: parseFloat(zillowLead.bathrooms),
          squareFeet: parseInt(zillowLead.square_feet),
        },

        intent: {
          type: zillowLead.lead_type, // buyer, seller, renter
          message: zillowLead.message,
          moveInDate: zillowLead.move_in_date,
        },

        metadata: {
          sourceUrl: zillowLead.listing_url,
          timestamp: zillowLead.timestamp,
        },
      };

      // Check for duplicates
      const isDuplicate = await checkDuplicateLead(lead);
      if (isDuplicate) {
        console.log(`Duplicate Zillow lead: ${lead.externalId}`);
        span.setAttribute('duplicate', true);
        return res.status(200).json({ received: true, duplicate: true });
      }

      // Emit to Kafka for processing
      await producer.send({
        topic: 'leads.received',
        messages: [{
          key: lead.externalId,
          value: JSON.stringify({
            eventType: 'LeadReceived',
            lead,
            timestamp: new Date().toISOString(),
          }),
        }],
      });

      span.setAttribute('processed', true);
      span.setStatus({ code: SpanStatusCode.OK });

      // Respond quickly to avoid timeout
      res.status(200).json({ received: true });

    } catch (error) {
      console.error('Zillow webhook error:', error);
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR });

      // Return 200 to avoid Zillow retry spam, but log error
      res.status(200).json({ received: true, error: error.message });
    } finally {
      span.end();
    }
  });
});

function normalizePhoneNumber(phone) {
  if (!phone) return null;

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Assume US numbers: add +1 if missing
  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    return `+${digits}`;
  }

  return `+${digits}`;
}

async function checkDuplicateLead(lead) {
  // Query MongoDB for existing lead with same email or phone
  const existing = await db.collection('leads').findOne({
    $or: [
      { 'contact.email': lead.contact.email },
      { 'contact.phone': lead.contact.phone },
    ],
    source: 'zillow',
    'metadata.timestamp': {
      $gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within 24 hours
    },
  });

  return !!existing;
}
```

### .NET Example

```csharp
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Confluent.Kafka;

[ApiController]
[Route("webhooks/zillow")]
public class ZillowWebhookController : ControllerBase
{
    private readonly IProducer<string, string> _kafkaProducer;
    private readonly ILeadRepository _leadRepository;

    public ZillowWebhookController(IProducer<string, string> kafkaProducer, ILeadRepository leadRepository)
    {
        _kafkaProducer = kafkaProducer;
        _leadRepository = leadRepository;
    }

    [HttpPost("leads")]
    public async Task<IActionResult> ReceiveLead([FromForm] ZillowLeadPayload payload)
    {
        try
        {
            // Normalize to internal format
            var lead = new Lead
            {
                Source = "zillow",
                ExternalId = payload.LeadId,
                ReceivedAt = DateTime.Parse(payload.Timestamp),

                Contact = new ContactInfo
                {
                    FirstName = payload.FirstName,
                    LastName = payload.LastName,
                    Email = payload.Email?.ToLower(),
                    Phone = NormalizePhoneNumber(payload.Phone)
                },

                Property = new PropertyInfo
                {
                    Address = payload.PropertyAddress,
                    City = payload.PropertyCity,
                    State = payload.PropertyState,
                    ZipCode = payload.PropertyZip,
                    Zpid = payload.PropertyZpid,
                    Price = decimal.Parse(payload.Price ?? payload.MonthlyRent ?? "0"),
                    Bedrooms = int.Parse(payload.Bedrooms ?? "0"),
                    Bathrooms = decimal.Parse(payload.Bathrooms ?? "0")
                },

                Intent = new LeadIntent
                {
                    Type = payload.LeadType,
                    Message = payload.Message
                }
            };

            // Check for duplicates
            var isDuplicate = await _leadRepository.IsDuplicate(lead);
            if (isDuplicate)
            {
                return Ok(new { received = true, duplicate = true });
            }

            // Emit to Kafka
            var message = new Message<string, string>
            {
                Key = lead.ExternalId,
                Value = JsonSerializer.Serialize(new
                {
                    eventType = "LeadReceived",
                    lead,
                    timestamp = DateTime.UtcNow
                })
            };

            await _kafkaProducer.ProduceAsync("leads.received", message);

            return Ok(new { received = true });
        }
        catch (Exception ex)
        {
            // Log error but return 200 to avoid retry spam
            Console.Error.WriteLine($"Zillow webhook error: {ex.Message}");
            return Ok(new { received = true, error = ex.Message });
        }
    }
}
```

## Property Data Enrichment

### Zillow Property API (if available)

```javascript
// Enrich lead with additional property data from Zillow API
async function enrichPropertyData(zpid) {
  const zillowAPI = axios.create({
    baseURL: 'https://api.zillow.com/v1',
    headers: {
      'Authorization': `Bearer ${process.env.ZILLOW_API_KEY}`,
    },
  });

  try {
    const response = await zillowAPI.get(`/property/${zpid}`);
    const property = response.data;

    return {
      estimatedValue: property.zestimate,
      rentZestimate: property.rentZestimate,
      taxAssessedValue: property.taxAssessedValue,
      yearBuilt: property.yearBuilt,
      lotSize: property.lotSizeSqFt,
      propertyType: property.homeType,
      lastSoldDate: property.lastSoldDate,
      lastSoldPrice: property.lastSoldPrice,
      daysOnZillow: property.daysOnZillow,
      pageViews: property.pageViewCount,
    };
  } catch (error) {
    console.error(`Failed to enrich property ${zpid}:`, error.message);
    return null;
  }
}
```

## Lead Qualification

### Wholesale Criteria

```javascript
async function qualifyWholesaleLead(lead) {
  // Fetch property data
  const propertyData = await enrichPropertyData(lead.property.zpid);

  if (!propertyData) {
    return { qualified: false, reason: 'insufficient_data' };
  }

  // Calculate equity
  const equity = propertyData.estimatedValue - (lead.property.price || 0);
  const equityPercent = (equity / propertyData.estimatedValue) * 100;

  // Qualification rules
  const criteria = {
    minEquity: 20, // 20%
    maxPrice: 500000,
    propertyTypes: ['SINGLE_FAMILY', 'CONDO', 'TOWNHOUSE'],
    motivatedSeller: ['need to sell quickly', 'foreclosure', 'inherited', 'probate'],
  };

  const qualified = {
    hasMinEquity: equityPercent >= criteria.minEquity,
    withinBudget: lead.property.price <= criteria.maxPrice,
    rightPropertyType: criteria.propertyTypes.includes(propertyData.propertyType),
    isMotivated: criteria.motivatedSeller.some(term =>
      lead.intent.message?.toLowerCase().includes(term)
    ),
  };

  const score = Object.values(qualified).filter(Boolean).length / Object.keys(qualified).length;

  return {
    qualified: score >= 0.75,
    score,
    equity: equityPercent,
    estimatedProfit: equity * 0.7, // Conservative 70% of equity
    criteria: qualified,
  };
}
```

## Monitoring & Alerts

```javascript
// Monitor webhook health
const webhookMetrics = {
  received: new Counter({ name: 'zillow_webhooks_received_total' }),
  processed: new Counter({ name: 'zillow_webhooks_processed_total' }),
  duplicates: new Counter({ name: 'zillow_webhooks_duplicates_total' }),
  errors: new Counter({ name: 'zillow_webhooks_errors_total' }),
  latency: new Histogram({ name: 'zillow_webhook_processing_duration_seconds' }),
};

app.post('/webhooks/zillow/leads', async (req, res) => {
  const start = Date.now();

  webhookMetrics.received.inc();

  try {
    // ... processing logic ...

    webhookMetrics.processed.inc();
  } catch (error) {
    webhookMetrics.errors.inc();
  } finally {
    webhookMetrics.latency.observe((Date.now() - start) / 1000);
  }
});
```

## Testing

### Mock Webhook Payload

```javascript
// Test webhook handler with mock data
const mockZillowLead = {
  lead_id: 'TEST-12345',
  timestamp: new Date().toISOString(),
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  phone: '555-0100',
  property_address: '123 Test St',
  property_city: 'Testville',
  property_state: 'TS',
  property_zip: '12345',
  property_zpid: '00000000',
  lead_type: 'seller',
  message: 'Test lead - need to sell quickly',
  price: '250000',
  bedrooms: '3',
  bathrooms: '2',
};

// Send test webhook
await axios.post('http://localhost:3000/webhooks/zillow/leads', mockZillowLead, {
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
});
```

## Environment Variables

```bash
# .env
ZILLOW_API_KEY=your_api_key_if_available
ZILLOW_WEBHOOK_SECRET=your_webhook_secret
ZILLOW_ALLOWED_IPS=18.236.0.0/16,52.88.0.0/16
```

## Resources

- Contact: rentalfeeds@zillow.com for API access
- [Zillow Premier Agent](https://www.zillow.com/agent-resources/)
- [Zillow Rental Manager](https://www.zillow.com/rental-manager/)
