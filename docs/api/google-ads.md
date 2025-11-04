# Google Ads API v19.1 Integration

## Overview

Google Ads API v19.1 (April 2025) provides access to lead form submissions, local services leads, and conversion tracking. This integration enables real-time lead ingestion from Google advertising campaigns.

## Key Features

- **Lead Form Extensions**: Capture contact information directly from ads
- **LocalServicesLeadService**: New service for local service provider leads with rating and feedback
- **Conversion Forecasting**: Predict expected conversion rates
- **Webhook Integration**: Real-time lead delivery via HTTP callbacks
- **Enhanced Attribution**: Track lead source, campaign, ad group, and keyword

## Prerequisites

- Google Ads account with API access enabled
- Developer token (apply at https://developers.google.com/google-ads/api/docs/get-started/dev-token)
- OAuth 2.0 credentials (Client ID and Secret)
- Manager account for multi-client management (optional)

## Authentication

### OAuth 2.0 Flow

```javascript
// Node.js example with google-ads-api library
const { GoogleAdsApi } = require('google-ads-api');

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});

// Generate OAuth URL
const authUrl = client.generateAuthUrl({
  access_type: 'offline',
  scope: 'https://www.googleapis.com/auth/adwords',
});

// Exchange authorization code for tokens
const tokens = await client.getAccessToken(authorizationCode);
// tokens = { access_token, refresh_token, expiry_date }
```

### .NET Example

```csharp
using Google.Ads.GoogleAds.Lib;
using Google.Ads.GoogleAds.V19;

var config = new GoogleAdsConfig
{
    DeveloperToken = Environment.GetEnvironmentVariable("GOOGLE_ADS_DEVELOPER_TOKEN"),
    OAuth2ClientId = Environment.GetEnvironmentVariable("GOOGLE_ADS_CLIENT_ID"),
    OAuth2ClientSecret = Environment.GetEnvironmentVariable("GOOGLE_ADS_CLIENT_SECRET"),
    OAuth2RefreshToken = Environment.GetEnvironmentVariable("GOOGLE_ADS_REFRESH_TOKEN")
};

var client = new GoogleAdsClient(config);
```

## Lead Form Extensions

### Fetching Lead Form Submissions

```javascript
// Query for lead form submissions in the last 24 hours
const query = `
  SELECT
    lead_form_submission_data.lead_form_submission_date_time,
    lead_form_submission_data.gclid,
    lead_form_submission_data.campaign_id,
    lead_form_submission_data.adgroup_id,
    lead_form_submission_data.creative_id,
    lead_form_submission_data.lead_form_submission_fields
  FROM lead_form_submission_data
  WHERE lead_form_submission_data.lead_form_submission_date_time >= '${yesterday}'
  ORDER BY lead_form_submission_data.lead_form_submission_date_time DESC
`;

const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
});

const results = await customer.query(query);

for (const row of results) {
  const submission = row.lead_form_submission_data;

  const lead = {
    source: 'google_ads',
    submittedAt: submission.lead_form_submission_date_time,
    gclid: submission.gclid,
    campaignId: submission.campaign_id,
    adGroupId: submission.adgroup_id,
    creativeId: submission.creative_id,
    fields: parseLeadFields(submission.lead_form_submission_fields),
  };

  await ingestLead(lead);
}

function parseLeadFields(fields) {
  const parsed = {};

  for (const field of fields) {
    // field.field_type: FULL_NAME, EMAIL, PHONE_NUMBER, etc.
    // field.field_value: actual value

    switch (field.field_type) {
      case 'FULL_NAME':
        parsed.fullName = field.field_value;
        break;
      case 'EMAIL':
        parsed.email = field.field_value;
        break;
      case 'PHONE_NUMBER':
        parsed.phone = normalizePhoneNumber(field.field_value);
        break;
      case 'CITY':
        parsed.city = field.field_value;
        break;
      case 'STATE':
        parsed.state = field.field_value;
        break;
      case 'ZIP_CODE':
        parsed.zipCode = field.field_value;
        break;
      case 'CUSTOM_QUESTION':
        parsed.customAnswers = parsed.customAnswers || [];
        parsed.customAnswers.push({
          question: field.custom_question_text,
          answer: field.field_value,
        });
        break;
    }
  }

  return parsed;
}
```

### .NET Example

```csharp
using Google.Ads.GoogleAds.V19.Services;
using Google.Ads.GoogleAds.V19.Resources;

var service = client.GetService(Services.V19.GoogleAdsService);

var query = @"
    SELECT
        lead_form_submission_data.lead_form_submission_date_time,
        lead_form_submission_data.gclid,
        lead_form_submission_data.campaign_id,
        lead_form_submission_data.lead_form_submission_fields
    FROM lead_form_submission_data
    WHERE lead_form_submission_data.lead_form_submission_date_time >= '{0}'
    ORDER BY lead_form_submission_data.lead_form_submission_date_time DESC";

var formattedQuery = string.Format(query, yesterday.ToString("yyyy-MM-dd"));

var response = service.Search(customerId, formattedQuery);

foreach (var row in response)
{
    var submission = row.LeadFormSubmissionData;

    var lead = new Lead
    {
        Source = "google_ads",
        SubmittedAt = submission.LeadFormSubmissionDateTime.ToDateTime(),
        Gclid = submission.Gclid,
        CampaignId = submission.CampaignId.ToString(),
        AdGroupId = submission.AdgroupId.ToString(),
        Fields = ParseLeadFields(submission.LeadFormSubmissionFields)
    };

    await IngestLead(lead);
}
```

## LocalServicesLeadService (New in v19.1)

### Fetching Local Services Leads

```javascript
// New service for local service provider leads
const localServicesQuery = `
  SELECT
    local_services_lead.id,
    local_services_lead.creation_date_time,
    local_services_lead.category_id,
    local_services_lead.service_id,
    local_services_lead.contact_details.phone_number,
    local_services_lead.contact_details.email,
    local_services_lead.lead_type,
    local_services_lead.lead_status,
    local_services_lead.geo_target_details.zip_code
  FROM local_services_lead
  WHERE local_services_lead.creation_date_time >= '${yesterday}'
`;

const localResults = await customer.query(localServicesQuery);

for (const row of localResults) {
  const localLead = row.local_services_lead;

  const lead = {
    source: 'google_local_services',
    leadId: localLead.id,
    createdAt: localLead.creation_date_time,
    categoryId: localLead.category_id,
    serviceId: localLead.service_id,
    phone: localLead.contact_details.phone_number,
    email: localLead.contact_details.email,
    leadType: localLead.lead_type, // PHONE_CALL, MESSAGE, BOOKING
    leadStatus: localLead.lead_status, // NEW, ACTIVE, BOOKED, etc.
    zipCode: localLead.geo_target_details.zip_code,
  };

  await ingestLead(lead);
}
```

### Updating Lead Status

```javascript
// Update lead status after contact attempt
const leadService = customer.localServicesLeadService;

await leadService.updateLeadStatus({
  leadId: lead.leadId,
  status: 'CONTACTED', // NEW, CONTACTED, BOOKED, ARCHIVED, etc.
  notes: 'Initial contact made. Lead qualified for follow-up.',
});
```

## Webhook Integration (Recommended)

### Setting Up Webhooks

Google Ads supports webhooks for real-time lead delivery. Configure in the Google Ads UI under Tools > Setup > Webhooks.

```javascript
// Express.js webhook endpoint
app.post('/webhooks/google-ads/leads', async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-goog-signature'];
    const isValid = verifyGoogleWebhookSignature(
      req.body,
      signature,
      process.env.GOOGLE_WEBHOOK_SECRET
    );

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const webhookData = req.body;

    // Parse webhook payload
    const lead = {
      source: 'google_ads',
      webhookId: webhookData.id,
      submittedAt: webhookData.lead_form_submission_date_time,
      gclid: webhookData.gclid,
      campaignId: webhookData.campaign_id,
      adGroupId: webhookData.ad_group_id,
      fields: parseLeadFields(webhookData.lead_form_fields),
    };

    // Emit event to Kafka for processing
    await kafka.send({
      topic: 'leads.received',
      messages: [{
        key: lead.gclid,
        value: JSON.stringify(lead),
      }],
    });

    // Respond quickly to avoid timeout
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

function verifyGoogleWebhookSignature(body, signature, secret) {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(body));
  const expectedSignature = hmac.digest('base64');
  return signature === expectedSignature;
}
```

## Conversion Tracking

### Recording Conversions

```javascript
// Report conversion after successful call or deal closed
const conversionService = customer.conversionUploadService;

await conversionService.uploadClickConversions({
  conversions: [{
    gclid: lead.gclid,
    conversion_action: process.env.GOOGLE_ADS_CONVERSION_ACTION_ID,
    conversion_date_time: new Date().toISOString(),
    conversion_value: lead.estimatedValue || 100, // in dollars
    currency_code: 'USD',
  }],
  partial_failure: true,
});
```

### Conversion Forecasting (New in v19.1)

```javascript
// Predict conversion rates for campaign optimization
const forecastQuery = `
  SELECT
    campaign_conversion_forecast.campaign_id,
    campaign_conversion_forecast.conversion_action_id,
    campaign_conversion_forecast.forecasted_conversions,
    campaign_conversion_forecast.forecasted_conversion_rate,
    campaign_conversion_forecast.cost_per_conversion
  FROM campaign_conversion_forecast
  WHERE campaign.id = ${campaignId}
`;

const forecast = await customer.query(forecastQuery);

for (const row of forecast) {
  console.log(`Campaign ${row.campaign_conversion_forecast.campaign_id}:`);
  console.log(`  Forecasted conversions: ${row.campaign_conversion_forecast.forecasted_conversions}`);
  console.log(`  Forecasted rate: ${row.campaign_conversion_forecast.forecasted_conversion_rate}`);
  console.log(`  Cost per conversion: $${row.campaign_conversion_forecast.cost_per_conversion}`);
}
```

## Rate Limits & Best Practices

### API Limits

- **Queries**: 15,000 queries per day per developer token
- **Mutations**: Unlimited mutations
- **Webhook Calls**: Real-time, no polling needed

### Best Practices

1. **Use Webhooks**: Avoid polling; use webhooks for real-time delivery
2. **Batch Queries**: Query multiple leads at once to reduce API calls
3. **Cache Campaigns**: Cache campaign metadata (names, IDs) for 24 hours
4. **Idempotency**: Track processed GCLIDs to avoid duplicate lead ingestion
5. **Error Handling**: Implement exponential backoff for rate limit errors

## Error Handling

```javascript
const { errors } = require('google-ads-api');

try {
  await customer.query(query);
} catch (error) {
  if (error instanceof errors.GoogleAdsFailure) {
    // API-specific error
    for (const err of error.errors) {
      console.error(`Error: ${err.error_code.${err.error_code}}`);
      console.error(`Message: ${err.message}`);

      // Handle specific error types
      if (err.error_code.authentication_error) {
        // Refresh OAuth token
        await refreshAccessToken();
      } else if (err.error_code.quota_error) {
        // Wait and retry
        await sleep(60000); // 1 minute
        return retryQuery(query);
      }
    }
  } else {
    // Network or other error
    console.error('Unexpected error:', error);
    throw error;
  }
}
```

## Testing & Development

### Sandbox Environment

Google Ads API provides a test account for development:

```javascript
const testClient = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_TEST_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_TEST_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_TEST_DEVELOPER_TOKEN,
});

// Use test customer ID for safe testing
const testCustomer = testClient.Customer({
  customer_id: '1234567890', // Test account
  refresh_token: process.env.GOOGLE_ADS_TEST_REFRESH_TOKEN,
});
```

## Monitoring & Observability

```javascript
// OpenTelemetry tracing for Google Ads API calls
const { trace } = require('@opentelemetry/api');

async function fetchLeads() {
  const tracer = trace.getTracer('google-ads-integration');

  return tracer.startActiveSpan('google-ads.fetch-leads', async (span) => {
    try {
      span.setAttribute('service', 'google-ads');
      span.setAttribute('operation', 'fetch_lead_forms');

      const results = await customer.query(query);

      span.setAttribute('leads_fetched', results.length);
      span.setStatus({ code: SpanStatusCode.OK });

      return results;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

## Environment Variables

```bash
# .env
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_CONVERSION_ACTION_ID=your_conversion_action_id
GOOGLE_WEBHOOK_SECRET=your_webhook_secret
```

## Resources

- [Google Ads API Documentation](https://developers.google.com/google-ads/api/docs/start)
- [Google Ads API v19.1 Release Notes](https://developers.google.com/google-ads/api/docs/release-notes)
- [Lead Form Extensions Guide](https://developers.google.com/google-ads/api/docs/lead-form/overview)
- [LocalServicesLeadService Reference](https://developers.google.com/google-ads/api/reference/rpc/v19/LocalServicesLeadService)
- [Conversion Tracking Guide](https://developers.google.com/google-ads/api/docs/conversions/overview)
