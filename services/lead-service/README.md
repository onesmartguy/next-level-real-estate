# Lead Service

Lead ingestion and management service for Next Level Real Estate platform. Handles webhook processing from multiple lead sources (Zillow, Google Ads, RealGeeks), lead deduplication, TCPA compliance checking, and Kafka event emission.

## Features

- **Multi-Source Webhook Handlers**
  - Zillow Lead API with signature verification
  - Google Ads Lead Form API v19.1
  - RealGeeks API with 2-way sync

- **Lead Processing**
  - Automatic deduplication (email + phone matching)
  - TCPA 2025 compliance verification
  - DNC registry checking (configurable)
  - Lead enrichment and qualification scoring
  - Smart data merging for duplicates

- **Event-Driven Architecture**
  - Kafka event emission (LeadReceived, LeadQualified, LeadUpdated, LeadDuplicate)
  - Real-time processing pipeline
  - Asynchronous downstream integration

- **Observability**
  - OpenTelemetry distributed tracing
  - Comprehensive Winston logging
  - Request/response tracking
  - Performance monitoring

## Technology Stack

- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Message Queue**: Kafka (KafkaJS)
- **Tracing**: OpenTelemetry + OTLP exporter
- **Logging**: Winston with daily rotation

## Prerequisites

- Node.js 20.x or higher
- MongoDB 6.x or higher
- Kafka 3.x or higher (optional for local dev)
- npm 10.x or higher

## Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

## Configuration

Edit `.env` file with your settings:

```env
# Server
PORT=3001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=next_level_real_estate

# Kafka
KAFKA_BROKERS=localhost:9092

# Webhook Secrets
ZILLOW_WEBHOOK_SECRET=your-secret
GOOGLE_ADS_WEBHOOK_SECRET=your-secret
REALGEEKS_API_USERNAME=your-username
REALGEEKS_API_PASSWORD=your-password
```

## Development

```bash
# Start in development mode (with hot reload)
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

## Production

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Docker

```bash
# Build image
docker build -t lead-service:latest .

# Run container
docker run -p 3001:3001 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017 \
  -e KAFKA_BROKERS=host.docker.internal:9092 \
  lead-service:latest
```

## API Endpoints

### Webhooks

- `POST /webhooks/zillow/leads` - Receive Zillow leads
- `GET /webhooks/google-ads/leads` - Google Ads verification
- `POST /webhooks/google-ads/leads` - Receive Google Ads leads
- `POST /webhooks/realgeeks/leads` - Receive RealGeeks leads
- `PUT /webhooks/realgeeks/leads` - Update RealGeeks leads

### Lead Management

- `GET /api/leads` - List leads (with pagination & filters)
- `GET /api/leads/:id` - Get lead by ID
- `PATCH /api/leads/:id` - Update lead
- `POST /api/leads/:id/call-attempts` - Add call attempt
- `GET /api/leads/:id/duplicates` - Find duplicates
- `POST /api/leads/:id/tcpa-check` - Perform TCPA check

### Health Check

- `GET /health` - Service health status

## Webhook Configuration

### Zillow

Set webhook URL in Zillow Partner Connect:
```
https://your-domain.com/webhooks/zillow/leads
```

Add custom header:
```
X-Zillow-Signature: {signature}
X-Zillow-Timestamp: {timestamp}
```

### Google Ads

Configure webhook in Google Ads Lead Form Extension:
```
https://your-domain.com/webhooks/google-ads/leads
```

### RealGeeks

Configure in RealGeeks Admin > API Settings:
```
https://your-domain.com/webhooks/realgeeks/leads
```

Authentication: Basic Auth (username/password)

## Lead Processing Flow

```
Webhook → Signature Verification → Lead Processor
                                          ↓
                    ┌─────────────────────┴─────────────────────┐
                    ↓                     ↓                     ↓
            Deduplication          TCPA Check            Enrichment
                    ↓                     ↓                     ↓
                    └─────────────────────┬─────────────────────┘
                                          ↓
                                   MongoDB Storage
                                          ↓
                                   Kafka Events
                                          ↓
                            (LeadReceived, LeadQualified)
```

## TCPA Compliance

The service enforces TCPA 2025 requirements:

- Written consent verification
- National DNC registry checking (31-day scrub cycle)
- Internal DNC list management
- Automated calling permission tracking
- Consent expiration handling

## Event Schema

### LeadReceived Event
```json
{
  "eventType": "LeadReceived",
  "leadId": "507f1f77bcf86cd799439011",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "source": "zillow",
    "status": "new",
    "qualificationScore": 75,
    "tcpaCompliant": true
  }
}
```

### LeadQualified Event
```json
{
  "eventType": "LeadQualified",
  "leadId": "507f1f77bcf86cd799439011",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "qualificationScore": 85,
    "priority": "high"
  }
}
```

## Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "healthy",
  "service": "lead-service",
  "timestamp": "2025-01-15T10:30:00Z",
  "uptime": 3600,
  "mongodb": "connected"
}
```

### Logs

Logs are written to:
- Console (stdout/stderr)
- `logs/lead-service-YYYY-MM-DD.log` (all logs)
- `logs/lead-service-error-YYYY-MM-DD.log` (errors only)

### Traces

OpenTelemetry traces are exported to the configured OTLP endpoint (default: `http://localhost:4318/v1/traces`).

## Testing Webhooks

### Test Zillow Webhook
```bash
curl -X POST http://localhost:3001/webhooks/zillow/leads \
  -H "Content-Type: application/json" \
  -H "X-Zillow-Signature: test-signature" \
  -H "X-Zillow-Timestamp: $(date +%s)" \
  -d '{
    "lead_id": "test-123",
    "contact": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "phone": "+12025551234"
    },
    "property": {
      "city": "San Francisco",
      "state": "CA",
      "zip_code": "94102"
    },
    "received_at": "2025-01-15T10:30:00Z"
  }'
```

## Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB is running: `mongosh --eval "db.adminCommand('ping')"`
- Check connection string in `.env`
- Ensure network connectivity

### Kafka Connection Issues
- Verify Kafka is running: `kafka-topics.sh --list --bootstrap-server localhost:9092`
- Check broker addresses in `.env`
- Review Kafka logs for errors

### Webhook Signature Failures
- Verify webhook secrets match configuration
- Check timestamp is within 5-minute window
- Review signature generation algorithm

## Performance

- Request handling: < 100ms (average)
- Lead processing: < 500ms (with all checks)
- Throughput: 1000+ leads/minute
- Memory usage: ~200MB base, scales with load

## Security

- Helmet.js security headers
- CORS enabled (configure for production)
- Rate limiting: 100 requests per 15 minutes
- Webhook signature verification
- No sensitive data in logs

## License

Proprietary - Next Level Real Estate

## Support

For issues or questions, contact: tech@nextlevelrealestate.com
