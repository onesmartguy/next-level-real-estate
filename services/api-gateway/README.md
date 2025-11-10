# API Gateway Service

The API Gateway serves as the single entry point for all client requests to the Next Level Real Estate platform. It handles authentication, rate limiting, request routing, and observability for the microservices architecture.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Rate Limiting**: Redis-backed rate limiting with configurable tiers (standard, strict, lenient)
- **Request Routing**: HTTP proxy to downstream microservices (Lead, Campaign, Call, Analytics)
- **Security**: Helmet.js for HTTP headers, CORS, compression
- **Observability**: OpenTelemetry distributed tracing, structured logging with Winston
- **Health Checks**: Kubernetes-ready health, readiness, and liveness endpoints
- **Error Handling**: Centralized error handling with detailed error responses
- **Request Validation**: Express-validator integration for input validation

## Architecture

```
Client Request
      ↓
  API Gateway (Port 3000)
      ↓
  ├─ Authentication (JWT)
  ├─ Rate Limiting (Redis)
  ├─ Request Logging (Winston + Morgan)
  ├─ Distributed Tracing (OpenTelemetry)
      ↓
  Proxy to Microservices:
  ├─ Lead Service (Port 3001)
  ├─ Calling Service (Port 3002)
  └─ Email Service (Port 3003)

  Future Services (Not Yet Implemented):
  ├─ Analytics Service (Planned)
  └─ Campaign Service (Planned)
```

## Prerequisites

- Node.js 20+
- npm 10+
- Redis (for rate limiting)
- OpenTelemetry Collector (optional, for observability)

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key environment variables:

- `PORT`: Server port (default: 3000)
- `JWT_SECRET`: Secret for JWT signing (MUST change in production)
- `REDIS_HOST`: Redis host for rate limiting
- `OTEL_ENABLED`: Enable/disable OpenTelemetry tracing
- `LEAD_SERVICE_URL`: URL for Lead Service
- `CAMPAIGN_SERVICE_URL`: URL for Campaign Service
- `CALL_SERVICE_URL`: URL for Call Service
- `ANALYTICS_SERVICE_URL`: URL for Analytics Service

## Development

Start the development server with hot reload:

```bash
npm run dev
```

## Build

Build TypeScript to JavaScript:

```bash
npm run build
```

Production build (optimized, no source maps):

```bash
npm run build:prod
```

## Testing

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm test -- --watch
```

Run tests with coverage:

```bash
npm test:coverage
```

## Production

Start the production server:

```bash
npm start
```

## Docker

Build Docker image:

```bash
docker build -t next-level-real-estate/api-gateway:latest .
```

Run Docker container:

```bash
docker run -p 3000:3000 --env-file .env next-level-real-estate/api-gateway:latest
```

## API Endpoints

### Health Checks

- `GET /health` - Comprehensive health check with dependency status
- `GET /health/ready` - Readiness probe (K8s)
- `GET /health/live` - Liveness probe (K8s)

### API Routes

All API routes require authentication unless specified.

**Implemented Routes**:
- `GET|POST|PUT|PATCH|DELETE /api/v1/leads/*` - Lead management (proxied to Lead Service)
- `GET|POST|PUT|PATCH|DELETE /api/v1/calls/*` - Call management (proxied to Calling Service)
- `POST /api/v1/emails/*` - Email operations (proxied to Email Service)

**Planned Routes** (Not Yet Available):
- `GET|POST|PUT|PATCH|DELETE /api/v1/campaigns/*` - Campaign management (future)
- `GET /api/v1/analytics/*` - Analytics (future)

### Authentication

Include JWT token in Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

Three tiers of rate limiting:

1. **Standard** (default): 100 requests/minute per IP
2. **Strict** (sensitive endpoints): 20 requests/minute per IP
3. **Lenient** (public endpoints): 500 requests/minute per IP

Rate limit headers included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time until limit resets (seconds)

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional
  }
}
```

Common error codes:
- `MISSING_AUTH_HEADER`: No Authorization header provided
- `INVALID_TOKEN`: JWT token is invalid
- `TOKEN_EXPIRED`: JWT token has expired
- `RATE_LIMIT_EXCEEDED`: Rate limit exceeded
- `VALIDATION_ERROR`: Request validation failed
- `ROUTE_NOT_FOUND`: Endpoint not found
- `DOWNSTREAM_SERVICE_ERROR`: Error from microservice
- `INTERNAL_SERVER_ERROR`: Unexpected server error

## Observability

### Logging

Structured JSON logging with Winston:

- Request/response logging with Morgan
- Error logging with stack traces
- Slow request detection (>1s)
- Request ID tracking

Log levels: `error`, `warn`, `info`, `http`, `debug`

Logs are written to:
- Console (stdout)
- `logs/all.log` (all levels)
- `logs/error.log` (errors only)

### Distributed Tracing

OpenTelemetry integration with automatic instrumentation:

- HTTP requests (incoming/outgoing)
- Express routes
- Redis operations
- Custom spans for business logic

Configure OTLP endpoint in `.env`:

```
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

### Metrics

Request timing and performance metrics:
- Request duration
- Response status codes
- Rate limit hits
- Downstream service latency

## Security Best Practices

1. **JWT Secret**: Always use a strong, random secret in production
2. **CORS**: Configure allowed origins to prevent unauthorized access
3. **Rate Limiting**: Adjust limits based on your traffic patterns
4. **Helmet.js**: Security headers enabled by default
5. **Input Validation**: Use express-validator for all inputs
6. **HTTPS**: Always use HTTPS in production (configure at load balancer)
7. **Trust Proxy**: Configured to work behind load balancers

## Project Structure

```
api-gateway/
├── src/
│   ├── config/          # Configuration management
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # JWT authentication
│   │   ├── rate-limit.ts # Rate limiting
│   │   ├── error-handler.ts # Error handling
│   │   ├── logging.ts   # Request logging
│   │   └── validation.ts # Input validation
│   ├── routes/          # Route definitions
│   │   ├── health.ts    # Health checks
│   │   ├── proxy.ts     # Service proxies
│   │   └── index.ts     # Route aggregation
│   ├── utils/           # Utilities
│   │   ├── logger.ts    # Winston logger
│   │   ├── redis-client.ts # Redis client
│   │   └── telemetry.ts # OpenTelemetry setup
│   ├── app.ts           # Express app setup
│   └── index.ts         # Entry point
├── Dockerfile           # Docker image definition
├── .dockerignore        # Docker ignore patterns
├── .env.example         # Environment template
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
└── README.md            # This file
```

## Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation
4. Run linter before committing: `npm run lint`
5. Format code: `npm run format`

## License

UNLICENSED - Proprietary software for Next Level Real Estate
