# API Gateway - Quick Start Guide

## Prerequisites

- Node.js 20+ installed
- npm 10+ installed
- Redis server running (or Docker)

## Setup (5 minutes)

### 1. Install Dependencies

```bash
cd services/api-gateway
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and update:
- `JWT_SECRET` - Generate with: `openssl rand -base64 32`
- `REDIS_HOST` - Set to your Redis host (default: localhost)

### 3. Start Redis (if needed)

**Using Docker:**
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

**Or use existing Redis instance**

### 4. Run Development Server

```bash
npm run dev
```

Server starts at: http://localhost:3000

## Verify Installation

### Test Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-24T...",
  "uptime": 5.123,
  "services": {
    "redis": {
      "status": "up",
      "latency": 2
    }
  },
  "version": "1.0.0",
  "environment": "development"
}
```

### Test Authentication

**Without token (should fail):**
```bash
curl http://localhost:3000/api/v1/leads
```

Expected:
```json
{
  "success": false,
  "error": {
    "code": "MISSING_AUTH_HEADER",
    "message": "Authorization header is required"
  }
}
```

**With token:**
```bash
# First generate a test token (example - replace with your auth system)
TOKEN="your-jwt-token-here"

curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/api/v1/leads
```

## Development Commands

```bash
# Start dev server with hot reload
npm run dev

# Build TypeScript
npm run build

# Run production build
npm run build:prod

# Start production server
npm start

# Run linter
npm run lint

# Auto-fix linting issues
npm run format

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

## Testing the Gateway

### 1. Generate Test JWT Token

Create a test script: `generate-token.js`

```javascript
const jwt = require('jsonwebtoken');

const payload = {
  userId: 'test-user-123',
  email: 'test@example.com',
  role: 'admin',
};

const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret', {
  expiresIn: '24h',
  issuer: 'next-level-real-estate',
});

console.log('Token:', token);
```

Run:
```bash
node generate-token.js
```

### 2. Test Rate Limiting

```bash
# Send 101 requests rapidly (should hit rate limit)
for i in {1..101}; do
  curl -s http://localhost:3000/health | jq .status
done
```

On request 101, you should see:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "retryAfter": 60
  }
}
```

### 3. Test CORS

```bash
curl -H "Origin: http://unauthorized-origin.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS http://localhost:3000/api/v1/leads
```

### 4. Test Error Handling

```bash
# Test 404
curl http://localhost:3000/api/v1/nonexistent

# Test invalid JSON
curl -X POST http://localhost:3000/api/v1/leads \
     -H "Content-Type: application/json" \
     -d "invalid-json"
```

## Docker Setup

### Build Image

```bash
docker build -t api-gateway:dev .
```

### Run Container

```bash
docker run -d \
  --name api-gateway \
  -p 3000:3000 \
  -e JWT_SECRET=your-secret-here \
  -e REDIS_HOST=host.docker.internal \
  api-gateway:dev
```

### With Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  api-gateway:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - REDIS_HOST=redis
      - JWT_SECRET=your-secret-here
    depends_on:
      - redis
    volumes:
      - ./logs:/app/logs

volumes:
  redis-data:
```

Run:
```bash
docker compose up -d
```

## Troubleshooting

### Redis Connection Failed

**Error:** `Redis client error: connect ECONNREFUSED`

**Solution:**
1. Check Redis is running: `redis-cli ping`
2. Verify `REDIS_HOST` in `.env`
3. Check firewall allows port 6379

### JWT Verification Failed

**Error:** `Invalid token`

**Solution:**
1. Ensure `JWT_SECRET` matches between token generation and gateway
2. Check token hasn't expired
3. Verify `JWT_ISSUER` matches in both places

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### TypeScript Compilation Errors

**Solution:**
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

## Monitoring Logs

### View All Logs

```bash
tail -f logs/all.log
```

### View Error Logs Only

```bash
tail -f logs/error.log
```

### Filter by Level (using jq)

```bash
# Info level
tail -f logs/all.log | jq 'select(.level=="info")'

# Errors only
tail -f logs/all.log | jq 'select(.level=="error")'
```

## Next Steps

1. **Set up downstream services** - Lead, Campaign, Call, Analytics services
2. **Configure authentication** - Implement proper user authentication system
3. **Set up monitoring** - SigNoz, Grafana, or similar
4. **Write tests** - Unit and integration tests
5. **Load testing** - Use Apache Bench, k6, or Artillery
6. **Production deployment** - K8s, Docker Swarm, or cloud platform

## Useful Resources

- [Express.js Documentation](https://expressjs.com/)
- [JWT.io](https://jwt.io/) - JWT debugger
- [Redis Documentation](https://redis.io/documentation)
- [OpenTelemetry Node.js](https://opentelemetry.io/docs/instrumentation/js/)
- [Winston Logger](https://github.com/winstonjs/winston)

## Support

For issues or questions:
1. Check logs in `logs/` directory
2. Review `README.md` for detailed documentation
3. Check `PROJECT_STRUCTURE.md` for architecture overview
