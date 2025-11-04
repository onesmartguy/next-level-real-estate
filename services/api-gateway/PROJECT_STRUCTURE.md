# API Gateway - Project Structure

## Directory Layout

```
api-gateway/
├── src/
│   ├── config/
│   │   └── index.ts              # Centralized configuration management
│   ├── middleware/
│   │   ├── auth.ts               # JWT authentication & authorization
│   │   ├── rate-limit.ts         # Redis-backed rate limiting (3 tiers)
│   │   ├── error-handler.ts      # Centralized error handling
│   │   ├── logging.ts            # Request/response logging with Morgan
│   │   └── validation.ts         # Input validation helpers
│   ├── routes/
│   │   ├── health.ts             # Health check endpoints (health/ready/live)
│   │   ├── proxy.ts              # Microservice proxy routes
│   │   └── index.ts              # Route aggregation
│   ├── utils/
│   │   ├── logger.ts             # Winston logger configuration
│   │   ├── redis-client.ts       # Redis client singleton
│   │   └── telemetry.ts          # OpenTelemetry initialization
│   ├── app.ts                    # Express app configuration
│   └── index.ts                  # Server entry point
├── logs/                         # Log files (gitignored except .gitkeep)
├── .dockerignore                 # Docker build exclusions
├── .env.example                  # Environment variable template
├── .eslintrc.json                # ESLint configuration
├── .gitignore                    # Git exclusions
├── .prettierrc.json              # Prettier code formatting
├── Dockerfile                    # Multi-stage production build
├── README.md                     # Comprehensive documentation
├── jest.config.js                # Jest test configuration
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript compiler config
└── tsconfig.prod.json            # Production build config
```

## Key Files

### Configuration
- **src/config/index.ts**: All environment variables, validation, and service URLs

### Middleware Stack
1. **auth.ts**: JWT verification, role-based authorization, optional auth
2. **rate-limit.ts**: Standard (100/min), Strict (20/min), Lenient (500/min)
3. **error-handler.ts**: AppError class, global error handler, 404 handler, async wrapper
4. **logging.ts**: Morgan HTTP logging, request ID, timing, slow request detection
5. **validation.ts**: Express-validator integration

### Routes
- **health.ts**: `/health`, `/health/ready`, `/health/live`
- **proxy.ts**: Proxies to Lead, Campaign, Call, Analytics services

### Utilities
- **logger.ts**: Winston with JSON/console formats, log levels, file rotation
- **redis-client.ts**: Singleton Redis connection with retry logic
- **telemetry.ts**: OpenTelemetry SDK with auto-instrumentation

## Request Flow

```
Client
  ↓
API Gateway (Port 3000)
  ↓
1. Helmet (Security Headers)
2. CORS
3. Compression
4. Body Parser (JSON/URL-encoded)
5. Request ID
6. Request Timing
7. HTTP Logger (Morgan)
8. Rate Limiter (Redis)
  ↓
9. Routes
  ├─ /health → Health Check
  └─ /api/v1/* → Authentication → Proxy to Microservice
  ↓
10. 404 Handler (if no route matches)
11. Error Handler (centralized error handling)
  ↓
Response to Client
```

## Environment Variables

See `.env.example` for complete list. Critical variables:

- `PORT`: Server port (3000)
- `JWT_SECRET`: **MUST CHANGE IN PRODUCTION**
- `REDIS_HOST/PORT`: Redis for rate limiting
- `OTEL_ENABLED`: Enable distributed tracing
- `*_SERVICE_URL`: Downstream microservice URLs

## Production Deployment

### Docker Build

```bash
docker build -t api-gateway:latest .
```

Multi-stage build:
1. **Builder**: Install deps, compile TypeScript
2. **Production**: Copy only dist/ and production dependencies

### Health Checks

- **Health**: `/health` - Full dependency check (Redis)
- **Readiness**: `/health/ready` - K8s readiness probe
- **Liveness**: `/health/live` - K8s liveness probe

### Security

- Non-root user (nodejs:1001)
- No source code in production image
- Production dependencies only
- Security headers via Helmet
- Rate limiting per IP
- JWT validation on all API routes

## Development Workflow

1. **Setup**: `npm install` → copy `.env.example` to `.env`
2. **Develop**: `npm run dev` (hot reload)
3. **Lint**: `npm run lint` (ESLint)
4. **Format**: `npm run format` (Prettier)
5. **Test**: `npm test`
6. **Build**: `npm run build:prod`
7. **Run**: `npm start`

## Testing Strategy

- Unit tests for middleware (auth, rate-limit, validation)
- Integration tests for routes (health, proxy)
- Mocking Redis and downstream services
- Coverage target: >80%

## Monitoring & Observability

### Logging
- **Winston**: Structured JSON logs
- **Morgan**: HTTP request logs
- **Levels**: error, warn, info, http, debug
- **Files**: `logs/all.log`, `logs/error.log`

### Tracing
- **OpenTelemetry**: Auto-instrumentation for HTTP, Express, Redis
- **OTLP Exporter**: Sends traces to collector (SigNoz, Jaeger, etc.)
- **Propagation**: Context propagated to downstream services

### Metrics
- Request duration (via logging middleware)
- Rate limit hits (Redis counters)
- Error rates (Winston error logs)
- Downstream service latency (proxy logs)

## Next Steps

1. Implement unit tests for middleware
2. Add integration tests for proxy routes
3. Set up CI/CD pipeline (GitHub Actions)
4. Configure production secrets management
5. Set up monitoring dashboards (Grafana)
6. Load testing and performance tuning
