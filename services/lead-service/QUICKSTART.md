# Lead Service - Quick Start Guide

Get the Lead Service running locally in under 5 minutes.

## Prerequisites

- Node.js 20+ installed
- MongoDB running locally or accessible
- (Optional) Kafka running locally

## Step 1: Install Dependencies

```bash
cd services/lead-service
npm install
```

## Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your settings (minimal required config)
nano .env
```

**Minimal .env for local development**:
```env
PORT=3001
NODE_ENV=development

# Local MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=next_level_real_estate

# Local Kafka (optional - service will work without it)
KAFKA_BROKERS=localhost:9092

# Dummy webhook secrets for testing
ZILLOW_WEBHOOK_SECRET=test-secret
GOOGLE_ADS_WEBHOOK_SECRET=test-secret
REALGEEKS_API_USERNAME=test
REALGEEKS_API_PASSWORD=test
```

## Step 3: Start MongoDB (if not running)

**Using Docker**:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:7
```

**Or install locally**: https://www.mongodb.com/docs/manual/installation/

## Step 4: Start the Service

```bash
# Development mode (with hot reload)
npm run dev
```

You should see:
```
[INFO] MongoDB connected successfully
[INFO] Kafka producer connected successfully
[INFO] Lead Service started { port: 3001, nodeEnv: 'development' }
```

## Step 5: Test the Service

### Health Check
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "lead-service",
  "timestamp": "2025-01-15T10:30:00Z",
  "uptime": 5.123,
  "mongodb": "connected"
}
```

### Test Zillow Webhook

```bash
curl -X POST http://localhost:3001/webhooks/zillow/leads \
  -H "Content-Type: application/json" \
  -H "X-Zillow-Signature: test" \
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
      "street_address": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip_code": "94102",
      "property_type": "single_family",
      "estimated_value": 500000
    },
    "message": "Interested in selling quickly",
    "timeline": "30-60 days",
    "consent": {
      "has_written_consent": true,
      "consent_date": "2025-01-15",
      "consent_method": "online_form"
    },
    "received_at": "2025-01-15T10:30:00Z"
  }'
```

Expected response:
```json
{
  "success": true,
  "leadId": "507f1f77bcf86cd799439011",
  "isDuplicate": false,
  "status": "qualified",
  "qualificationScore": 85
}
```

### Query Leads

```bash
# List all leads
curl http://localhost:3001/api/leads

# Get specific lead
curl http://localhost:3001/api/leads/507f1f77bcf86cd799439011

# Filter qualified leads
curl "http://localhost:3001/api/leads?status=qualified&minScore=70"
```

## Step 6: View in MongoDB

```bash
# Connect to MongoDB
mongosh

# Switch to database
use next_level_real_estate

# View leads
db.leads.find().pretty()

# Count leads
db.leads.countDocuments()
```

## Troubleshooting

### MongoDB Connection Error
```
Error: Failed to connect to MongoDB
```

**Solution**:
- Verify MongoDB is running: `mongosh --eval "db.adminCommand('ping')"`
- Check `MONGODB_URI` in `.env`
- Ensure MongoDB is accessible on port 27017

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution**:
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=3002
```

### Kafka Connection Warning
```
[WARN] Failed to connect Kafka producer
```

**Solution**: This is OK for local development. The service will continue without Kafka. To fix:
```bash
# Start Kafka with Docker
docker run -d -p 9092:9092 --name kafka \
  -e KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181 \
  confluentinc/cp-kafka:latest
```

## Next Steps

1. **Test Other Webhooks**: Try Google Ads and RealGeeks endpoints
2. **Explore API**: Use Postman or curl to test all endpoints
3. **Add Test Data**: Create leads with different scenarios
4. **Monitor Logs**: Watch console output for processing details
5. **Set Up Telemetry**: Configure OpenTelemetry for tracing

## Development Tips

### Hot Reload
The service auto-restarts when you modify TypeScript files (using nodemon).

### View Logs
Logs are written to:
- Console (stdout)
- `logs/lead-service-YYYY-MM-DD.log` (all logs)
- `logs/lead-service-error-YYYY-MM-DD.log` (errors only)

### Debug Mode
Add to `.env`:
```env
LOG_LEVEL=debug
```

### Test Deduplication
Create the same lead twice - the second will be marked as duplicate:
```bash
# First lead
curl -X POST http://localhost:3001/webhooks/zillow/leads -H "Content-Type: application/json" -d '...'

# Duplicate (same email/phone)
curl -X POST http://localhost:3001/webhooks/zillow/leads -H "Content-Type: application/json" -d '...'
```

### Test TCPA Compliance
Create leads with/without consent to see different qualification scores:
```json
// High score (with consent)
"consent": {
  "has_written_consent": true,
  "consent_date": "2025-01-15",
  "consent_method": "online_form"
}

// Lower score (no consent)
"consent": {
  "has_written_consent": false
}
```

## Stopping the Service

```bash
# Ctrl+C in terminal (graceful shutdown)
# Or send SIGTERM
kill -TERM <PID>
```

The service will:
1. Stop accepting new requests
2. Disconnect from Kafka
3. Disconnect from MongoDB
4. Shutdown OpenTelemetry
5. Exit cleanly

## Production Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Use real MongoDB connection string (MongoDB Atlas)
- [ ] Configure real Kafka brokers
- [ ] Set actual webhook secrets from providers
- [ ] Configure DNC API credentials
- [ ] Set up OpenTelemetry endpoint (SigNoz, Jaeger, etc.)
- [ ] Configure CORS for your domain
- [ ] Set up SSL/TLS certificates
- [ ] Configure rate limits appropriately
- [ ] Set up monitoring and alerts
- [ ] Review and adjust resource limits
- [ ] Test graceful shutdown
- [ ] Run security audit (`npm audit`)

## Support

Need help? Check:
- `README.md` - Full documentation
- `SERVICE_OVERVIEW.md` - Architecture details
- Console logs - Detailed error messages
- MongoDB logs - Database issues
- Kafka logs - Message queue issues

Contact: tech@nextlevelrealestate.com
