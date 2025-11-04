# RealGeeks API Integration

## Overview

RealGeeks API provides 2-way synchronization for real estate lead and contact management via API Nation integration platform. The platform enables real-time bidirectional updates between RealGeeks CRM and external systems with 15,000+ automation possibilities.

## Key Features

- **2-Way Sync**: Bidirectional real-time updates between RealGeeks and external systems
- **API Nation Integration**: 15,000+ pre-built automation templates
- **Lead Management**: Create, update, and retrieve lead information
- **Property Data**: Access MLS listings and property details
- **Contact Sync**: Integrate with Google Contacts, email platforms
- **Activity Tracking**: Log calls, emails, showings, and follow-ups
- **Custom Fields**: Support for custom lead and property attributes

## Prerequisites

- RealGeeks account with API access enabled
- API credentials (username and password) - request via RealGeeks support
- Webhook endpoint configured with HTTPS
- API Nation account for advanced integrations (optional)

## Authentication

### Request API Credentials

Contact RealGeeks support to enable API access and receive credentials:
- Email your account manager or support@realgeeks.com
- Request API username and password
- Credentials will be emailed upon approval

### Node.js Authentication Example

```javascript
const axios = require('axios');
const crypto = require('crypto');

class RealGeeksClient {
  private baseURL: string;
  private username: string;
  private password: string;
  private authToken: string | null;

  constructor() {
    this.baseURL = 'https://api.realgeeks.com/v1';
    this.username = process.env.REALGEEKS_API_USERNAME;
    this.password = process.env.REALGEEKS_API_PASSWORD;
    this.authToken = null;
  }

  async authenticate() {
    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        username: this.username,
        password: this.password,
      });

      this.authToken = response.data.token;
      console.log('RealGeeks authenticated successfully');

      return this.authToken;
    } catch (error) {
      console.error('RealGeeks authentication failed:', error.message);
      throw error;
    }
  }

  async request(method: string, endpoint: string, data?: any) {
    if (!this.authToken) {
      await this.authenticate();
    }

    try {
      const response = await axios({
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        data,
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Token expired, re-authenticate
        await this.authenticate();
        return this.request(method, endpoint, data);
      }

      throw error;
    }
  }
}

const client = new RealGeeksClient();
```

### .NET Authentication Example

```csharp
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

public class RealGeeksClient
{
    private readonly HttpClient _httpClient;
    private readonly string _username;
    private readonly string _password;
    private string _authToken;

    public RealGeeksClient()
    {
        _httpClient = new HttpClient
        {
            BaseAddress = new Uri("https://api.realgeeks.com/v1")
        };

        _username = Environment.GetEnvironmentVariable("REALGEEKS_API_USERNAME");
        _password = Environment.GetEnvironmentVariable("REALGEEKS_API_PASSWORD");
    }

    public async Task Authenticate()
    {
        var credentials = new
        {
            username = _username,
            password = _password
        };

        var content = new StringContent(
            JsonSerializer.Serialize(credentials),
            Encoding.UTF8,
            "application/json"
        );

        var response = await _httpClient.PostAsync("/auth/login", content);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadAsStringAsync();
        var authResponse = JsonSerializer.Deserialize<AuthResponse>(result);

        _authToken = authResponse.Token;
        _httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", _authToken);

        Console.WriteLine("RealGeeks authenticated successfully");
    }

    public async Task<T> Request<T>(HttpMethod method, string endpoint, object data = null)
    {
        if (string.IsNullOrEmpty(_authToken))
        {
            await Authenticate();
        }

        var request = new HttpRequestMessage(method, endpoint);

        if (data != null)
        {
            request.Content = new StringContent(
                JsonSerializer.Serialize(data),
                Encoding.UTF8,
                "application/json"
            );
        }

        try
        {
            var response = await _httpClient.SendAsync(request);

            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                await Authenticate();
                return await Request<T>(method, endpoint, data);
            }

            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<T>(content);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"RealGeeks API error: {ex.Message}");
            throw;
        }
    }
}
```

## Lead Management

### Creating Leads

```javascript
// Create a new lead in RealGeeks
async function createLead(leadData) {
  const lead = {
    first_name: leadData.firstName,
    last_name: leadData.lastName,
    email: leadData.email,
    phone: leadData.phone,
    phone_type: 'mobile', // mobile, home, work
    address: {
      street: leadData.property?.address,
      city: leadData.property?.city,
      state: leadData.property?.state,
      zip: leadData.property?.zipCode,
    },
    source: leadData.source, // google_ads, zillow, website, etc.
    tags: leadData.tags || [],
    notes: leadData.initialNotes,
    custom_fields: {
      lead_intent: leadData.intent?.type,
      property_interest: leadData.property?.zpid,
      original_source_url: leadData.metadata?.sourceUrl,
    },
    assigned_to: process.env.REALGEEKS_DEFAULT_AGENT_ID,
  };

  const response = await client.request('POST', '/leads', lead);

  console.log(`Created RealGeeks lead: ${response.id}`);

  return response;
}

// Example usage
const newLead = await createLead({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+15551234567',
  property: {
    address: '123 Main St',
    city: 'Seattle',
    state: 'WA',
    zipCode: '98101',
  },
  source: 'zillow',
  intent: { type: 'seller' },
  tags: ['hot_lead', 'wholesale_candidate'],
});
```

### Retrieving Leads

```javascript
// Get all leads with filters
async function getLeads(filters = {}) {
  const params = new URLSearchParams({
    page: filters.page || 1,
    per_page: filters.perPage || 50,
    sort_by: filters.sortBy || 'created_at',
    sort_order: filters.sortOrder || 'desc',
  });

  // Add filters
  if (filters.source) params.append('source', filters.source);
  if (filters.tags) params.append('tags', filters.tags.join(','));
  if (filters.status) params.append('status', filters.status);
  if (filters.assignedTo) params.append('assigned_to', filters.assignedTo);
  if (filters.createdAfter) {
    params.append('created_after', filters.createdAfter.toISOString());
  }

  const response = await client.request('GET', `/leads?${params}`);

  return {
    leads: response.data,
    total: response.meta.total,
    page: response.meta.page,
    pages: response.meta.pages,
  };
}

// Get specific lead by ID
async function getLead(leadId) {
  const response = await client.request('GET', `/leads/${leadId}`);
  return response;
}

// Search leads by email or phone
async function searchLeads(query) {
  const params = new URLSearchParams({
    q: query,
    search_fields: 'email,phone',
  });

  const response = await client.request('GET', `/leads/search?${params}`);
  return response.data;
}
```

### Updating Leads

```javascript
// Update lead information
async function updateLead(leadId, updates) {
  const response = await client.request('PATCH', `/leads/${leadId}`, updates);

  console.log(`Updated RealGeeks lead: ${leadId}`);

  return response;
}

// Example: Update lead status after successful call
async function updateLeadAfterCall(leadId, callOutcome) {
  const updates = {
    status: callOutcome.qualified ? 'qualified' : 'contacted',
    tags: [...(callOutcome.tags || []), 'called'],
    notes: `Call completed on ${new Date().toISOString()}. Outcome: ${callOutcome.summary}`,
    custom_fields: {
      last_call_date: new Date().toISOString(),
      call_sentiment: callOutcome.sentiment,
      qualification_score: callOutcome.qualificationScore,
    },
  };

  if (callOutcome.qualified) {
    updates.tags.push('hot_lead', 'ready_for_agent');
  }

  return await updateLead(leadId, updates);
}
```

### .NET Lead Management

```csharp
public class RealGeeksLeadService
{
    private readonly RealGeeksClient _client;

    public async Task<Lead> CreateLead(LeadData leadData)
    {
        var lead = new
        {
            first_name = leadData.FirstName,
            last_name = leadData.LastName,
            email = leadData.Email,
            phone = leadData.Phone,
            phone_type = "mobile",
            address = new
            {
                street = leadData.Property?.Address,
                city = leadData.Property?.City,
                state = leadData.Property?.State,
                zip = leadData.Property?.ZipCode
            },
            source = leadData.Source,
            tags = leadData.Tags ?? new List<string>(),
            custom_fields = new
            {
                lead_intent = leadData.Intent?.Type,
                property_interest = leadData.Property?.Zpid
            }
        };

        var response = await _client.Request<LeadResponse>(
            HttpMethod.Post,
            "/leads",
            lead
        );

        Console.WriteLine($"Created RealGeeks lead: {response.Id}");

        return response;
    }

    public async Task<Lead> UpdateLead(string leadId, object updates)
    {
        var response = await _client.Request<Lead>(
            new HttpMethod("PATCH"),
            $"/leads/{leadId}",
            updates
        );

        return response;
    }
}
```

## Activity Tracking

### Logging Activities

```javascript
// Log call activity
async function logCallActivity(leadId, callData) {
  const activity = {
    lead_id: leadId,
    type: 'call',
    direction: 'outbound', // outbound or inbound
    status: callData.status, // completed, missed, voicemail
    duration: callData.duration, // in seconds
    notes: callData.notes || callData.transcript?.summary,
    occurred_at: callData.timestamp || new Date().toISOString(),
    custom_data: {
      call_sid: callData.callSid,
      recording_url: callData.recordingUrl,
      sentiment: callData.sentiment,
      conversation_id: callData.conversationId,
    },
  };

  const response = await client.request('POST', '/activities', activity);

  console.log(`Logged call activity for lead ${leadId}`);

  return response;
}

// Log email activity
async function logEmailActivity(leadId, emailData) {
  const activity = {
    lead_id: leadId,
    type: 'email',
    direction: emailData.direction, // sent or received
    subject: emailData.subject,
    body: emailData.body,
    occurred_at: emailData.timestamp || new Date().toISOString(),
  };

  return await client.request('POST', '/activities', activity);
}

// Log showing/appointment
async function logShowing(leadId, showingData) {
  const activity = {
    lead_id: leadId,
    type: 'showing',
    status: showingData.status, // scheduled, completed, cancelled
    scheduled_at: showingData.scheduledAt,
    property_address: showingData.propertyAddress,
    notes: showingData.notes,
    custom_data: {
      property_id: showingData.propertyId,
      agent_id: showingData.agentId,
    },
  };

  return await client.request('POST', '/activities', activity);
}

// Get lead activity history
async function getLeadActivities(leadId, filters = {}) {
  const params = new URLSearchParams({
    lead_id: leadId,
    page: filters.page || 1,
    per_page: filters.perPage || 50,
  });

  if (filters.type) params.append('type', filters.type); // call, email, showing, etc.
  if (filters.startDate) params.append('start_date', filters.startDate.toISOString());

  const response = await client.request('GET', `/activities?${params}`);

  return response.data;
}
```

## Property Integration

### Fetching Properties

```javascript
// Get property listings from RealGeeks/MLS
async function getProperties(filters = {}) {
  const params = new URLSearchParams({
    page: filters.page || 1,
    per_page: filters.perPage || 50,
  });

  // Add property filters
  if (filters.city) params.append('city', filters.city);
  if (filters.state) params.append('state', filters.state);
  if (filters.minPrice) params.append('min_price', filters.minPrice);
  if (filters.maxPrice) params.append('max_price', filters.maxPrice);
  if (filters.bedrooms) params.append('bedrooms', filters.bedrooms);
  if (filters.bathrooms) params.append('bathrooms', filters.bathrooms);
  if (filters.propertyType) params.append('property_type', filters.propertyType);

  const response = await client.request('GET', `/properties?${params}`);

  return {
    properties: response.data,
    total: response.meta.total,
  };
}

// Get specific property details
async function getProperty(propertyId) {
  const response = await client.request('GET', `/properties/${propertyId}`);

  return {
    id: response.id,
    mlsId: response.mls_id,
    address: response.address,
    city: response.city,
    state: response.state,
    zipCode: response.zip,
    price: response.price,
    bedrooms: response.bedrooms,
    bathrooms: response.bathrooms,
    squareFeet: response.square_feet,
    propertyType: response.property_type,
    status: response.status, // active, pending, sold
    listingDate: response.listing_date,
    photos: response.photos,
    description: response.description,
  };
}
```

## 2-Way Sync Implementation

### Webhook Handler for RealGeeks Updates

```javascript
const express = require('express');
const { Kafka } = require('kafkajs');

const app = express();
app.use(express.json());

const kafka = new Kafka({
  clientId: 'realgeeks-webhook-handler',
  brokers: process.env.KAFKA_BROKERS.split(','),
});

const producer = kafka.producer();

// Webhook endpoint for RealGeeks events
app.post('/webhooks/realgeeks', async (req, res) => {
  const { event_type, data } = req.body;

  console.log(`RealGeeks webhook: ${event_type}`);

  try {
    switch (event_type) {
      case 'lead.created':
        await handleLeadCreated(data);
        break;

      case 'lead.updated':
        await handleLeadUpdated(data);
        break;

      case 'lead.status_changed':
        await handleLeadStatusChanged(data);
        break;

      case 'activity.created':
        await handleActivityCreated(data);
        break;

      default:
        console.log(`Unhandled event type: ${event_type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function handleLeadCreated(leadData) {
  // Sync to internal database
  await db.collection('leads').insertOne({
    realgeeksId: leadData.id,
    firstName: leadData.first_name,
    lastName: leadData.last_name,
    email: leadData.email,
    phone: leadData.phone,
    source: 'realgeeks',
    syncedAt: new Date(),
  });

  // Emit event for processing
  await producer.send({
    topic: 'leads.synced',
    messages: [{
      key: leadData.id,
      value: JSON.stringify({
        eventType: 'LeadSyncedFromRealGeeks',
        lead: leadData,
        timestamp: new Date(),
      }),
    }],
  });
}

async function handleLeadUpdated(leadData) {
  // Update internal database
  await db.collection('leads').updateOne(
    { realgeeksId: leadData.id },
    {
      $set: {
        firstName: leadData.first_name,
        lastName: leadData.last_name,
        email: leadData.email,
        phone: leadData.phone,
        status: leadData.status,
        tags: leadData.tags,
        lastSyncedAt: new Date(),
      }
    }
  );

  console.log(`Synced RealGeeks lead update: ${leadData.id}`);
}

async function handleLeadStatusChanged(data) {
  const { lead_id, old_status, new_status } = data;

  // Update internal status
  await db.collection('leads').updateOne(
    { realgeeksId: lead_id },
    {
      $set: {
        status: new_status,
        statusChangedAt: new Date(),
      },
      $push: {
        statusHistory: {
          from: old_status,
          to: new_status,
          changedAt: new Date(),
        },
      },
    }
  );

  console.log(`Lead ${lead_id} status changed: ${old_status} → ${new_status}`);
}
```

### Syncing Internal Updates to RealGeeks

```javascript
// Sync internal lead updates to RealGeeks
async function syncLeadToRealGeeks(leadId) {
  const lead = await db.collection('leads').findOne({ _id: leadId });

  if (!lead.realgeeksId) {
    // Create new lead in RealGeeks
    const realgeeksLead = await createLead(lead);

    // Store RealGeeks ID
    await db.collection('leads').updateOne(
      { _id: leadId },
      { $set: { realgeeksId: realgeeksLead.id } }
    );

    return realgeeksLead;
  } else {
    // Update existing lead
    const updates = {
      first_name: lead.firstName,
      last_name: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      tags: lead.tags,
      notes: lead.latestNotes,
    };

    return await updateLead(lead.realgeeksId, updates);
  }
}

// Sync call completion to RealGeeks
async function syncCallToRealGeeks(callData) {
  const lead = await db.collection('leads').findOne({ _id: callData.leadId });

  if (lead.realgeeksId) {
    // Log call activity in RealGeeks
    await logCallActivity(lead.realgeeksId, {
      status: callData.status,
      duration: callData.duration,
      notes: callData.summary,
      timestamp: callData.completedAt,
      callSid: callData.callSid,
      recordingUrl: callData.recordingUrl,
      sentiment: callData.sentiment,
    });

    // Update lead status if qualified
    if (callData.qualified) {
      await updateLead(lead.realgeeksId, {
        status: 'qualified',
        tags: [...(lead.tags || []), 'hot_lead', 'ai_qualified'],
      });
    }
  }
}

// Background sync job
async function runSyncJob() {
  // Sync all leads modified in last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const modifiedLeads = await db.collection('leads').find({
    updatedAt: { $gte: oneHourAgo },
    realgeeksId: { $exists: true },
  }).toArray();

  console.log(`Syncing ${modifiedLeads.length} leads to RealGeeks...`);

  for (const lead of modifiedLeads) {
    try {
      await syncLeadToRealGeeks(lead._id);
      await sleep(100); // Rate limiting
    } catch (error) {
      console.error(`Failed to sync lead ${lead._id}:`, error.message);
    }
  }

  console.log('Sync job complete');
}

// Run sync every 15 minutes
setInterval(runSyncJob, 15 * 60 * 1000);
```

## API Nation Integration

### Pre-built Automations

RealGeeks integrates with API Nation for 15,000+ automation templates:

```javascript
// Example: Sync RealGeeks leads to Google Contacts
const apiNationConfig = {
  workflow: 'realgeeks-to-google-contacts',
  trigger: {
    app: 'RealGeeks',
    event: 'lead.created',
  },
  actions: [
    {
      app: 'GoogleContacts',
      action: 'create_contact',
      mapping: {
        first_name: '{{lead.first_name}}',
        last_name: '{{lead.last_name}}',
        email: '{{lead.email}}',
        phone: '{{lead.phone}}',
        notes: 'RealGeeks Lead - {{lead.source}}',
      },
    },
  ],
};

// Configure via API Nation dashboard or API
```

### Common Integrations

Available through API Nation:

1. **Email Marketing**:
   - MailChimp: Auto-add leads to campaigns
   - Constant Contact: Sync contact lists
   - SendGrid: Trigger email sequences

2. **CRM & Contacts**:
   - Google Contacts: Bidirectional sync
   - Salesforce: Lead routing
   - HubSpot: Contact enrichment

3. **Communication**:
   - Twilio: SMS notifications for new leads
   - Slack: Alert team on high-value leads
   - Zoom: Auto-schedule showings

4. **Real Estate Specific**:
   - Zillow: Property data enrichment
   - eRelocation: Corporate relocation leads
   - MLS: Listing updates

## Error Handling

```javascript
async function safeRealGeeksRequest(fn) {
  try {
    return await fn();
  } catch (error) {
    if (error.response?.status === 401) {
      console.error('RealGeeks authentication failed. Re-authenticating...');
      await client.authenticate();
      return await fn();
    } else if (error.response?.status === 429) {
      console.warn('RealGeeks rate limit hit. Waiting 60s...');
      await sleep(60000);
      return await fn();
    } else if (error.response?.status === 404) {
      console.error('Resource not found in RealGeeks');
      return null;
    } else if (error.response?.status >= 500) {
      console.error('RealGeeks server error. Retrying...');
      await sleep(5000);
      return await fn();
    } else {
      console.error('Unexpected RealGeeks error:', error.message);
      throw error;
    }
  }
}

// Usage
const lead = await safeRealGeeksRequest(() => getLead(leadId));
```

## Monitoring & Observability

```javascript
const { trace } = require('@opentelemetry/api');

async function tracedRealGeeksCall(operation, fn) {
  const tracer = trace.getTracer('realgeeks-integration');

  return tracer.startActiveSpan(`realgeeks.${operation}`, async (span) => {
    try {
      span.setAttribute('service', 'realgeeks');
      span.setAttribute('operation', operation);

      const result = await fn();

      span.setStatus({ code: SpanStatusCode.OK });
      return result;

    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;

    } finally {
      span.end();
    }
  });
}

// Metrics
const realgeeksMetrics = {
  syncedLeads: new Counter({ name: 'realgeeks_leads_synced_total' }),
  syncErrors: new Counter({ name: 'realgeeks_sync_errors_total' }),
  apiLatency: new Histogram({ name: 'realgeeks_api_latency_seconds' }),
};

async function handleLeadCreated(leadData) {
  const start = Date.now();

  try {
    await syncLeadToDatabase(leadData);
    realgeeksMetrics.syncedLeads.inc({ direction: 'from_realgeeks' });
  } catch (error) {
    realgeeksMetrics.syncErrors.inc({ operation: 'lead_created' });
    throw error;
  } finally {
    realgeeksMetrics.apiLatency.observe((Date.now() - start) / 1000);
  }
}
```

## Best Practices

1. **Bidirectional Sync**: Always update both systems to maintain consistency
2. **Deduplication**: Check for existing leads before creating new ones
3. **Rate Limiting**: Respect API limits (typically 100 requests/minute)
4. **Webhook Validation**: Verify webhook signatures to prevent spoofing
5. **Error Handling**: Implement retries with exponential backoff
6. **Idempotency**: Handle duplicate webhook deliveries gracefully
7. **Custom Fields**: Use custom fields for integration-specific data
8. **Activity Logging**: Log all interactions for complete lead history

## Environment Variables

```bash
# .env
REALGEEKS_API_USERNAME=your_api_username
REALGEEKS_API_PASSWORD=your_api_password
REALGEEKS_DEFAULT_AGENT_ID=agent123
REALGEEKS_WEBHOOK_SECRET=your_webhook_secret
API_NATION_API_KEY=your_api_nation_key
```

## Resources

- Contact: support@realgeeks.com for API access
- [RealGeeks Platform](https://www.realgeeks.com/)
- [API Nation Integration Platform](https://www.api-nation.com/)
- [API Nation RealGeeks Connector](https://www.api-nation.com/integrations/realgeeks)
- [RealGeeks Help Center](https://help.realgeeks.com/)
