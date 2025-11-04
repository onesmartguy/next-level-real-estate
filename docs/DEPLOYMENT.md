# Deployment Guide

## Overview

This guide covers local development setup, staging environments, and production deployment strategies for the Next Level Real Estate platform across multiple cloud providers (AWS, Azure, GCP).

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Environment Variables](#environment-variables)
3. [Database Setup](#database-setup)
4. [Message Queue Configuration](#message-queue-configuration)
5. [Observability Setup](#observability-setup)
6. [Production Deployment](#production-deployment)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Secrets Management](#secrets-management)
9. [Health Checks](#health-checks)
10. [Scaling Strategies](#scaling-strategies)

## Local Development Setup

### Prerequisites

```bash
# Required tools
- Docker 24+ and Docker Compose
- Node.js 20+ (LTS)
- .NET 9 SDK
- Git

# Optional tools
- MongoDB Compass (database GUI)
- Postman (API testing)
- k9s (Kubernetes management)
```

### Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  # API Gateway (Node.js)
  api-gateway:
    build:
      context: ./services/api-gateway
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - PORT=3000
      - MONGODB_URI=mongodb://mongodb:27017/nlre
      - REDIS_URL=redis://redis:6379
      - KAFKA_BROKERS=kafka:9092
      - QDRANT_URL=http://qdrant:6333
    volumes:
      - ./services/api-gateway:/app
      - /app/node_modules
    depends_on:
      - mongodb
      - redis
      - kafka
      - qdrant
    command: npm run dev

  # Lead Service (Node.js)
  lead-service:
    build:
      context: ./services/lead-service
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - PORT=3001
      - MONGODB_URI=mongodb://mongodb:27017/nlre
      - REDIS_URL=redis://redis:6379
      - KAFKA_BROKERS=kafka:9092
    volumes:
      - ./services/lead-service:/app
      - /app/node_modules
    depends_on:
      - mongodb
      - redis
      - kafka
    command: npm run dev

  # Calling Service (Node.js)
  calling-service:
    build:
      context: ./services/calling-service
      dockerfile: Dockerfile.dev
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=development
      - PORT=3002
      - MONGODB_URI=mongodb://mongodb:27017/nlre
      - REDIS_URL=redis://redis:6379
      - KAFKA_BROKERS=kafka:9092
      - ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}
      - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
      - TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
    volumes:
      - ./services/calling-service:/app
      - /app/node_modules
    depends_on:
      - mongodb
      - redis
      - kafka
    command: npm run dev

  # Qualification Service (.NET)
  qualification-service:
    build:
      context: ./services/qualification-service
      dockerfile: Dockerfile.dev
    ports:
      - "5001:5001"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ASPNETCORE_URLS=http://+:5001
      - ConnectionStrings__MongoDB=mongodb://mongodb:27017/nlre
      - ConnectionStrings__Redis=redis:6379
      - Kafka__BootstrapServers=kafka:9092
      - Qdrant__Url=http://qdrant:6333
    volumes:
      - ./services/qualification-service:/app
    depends_on:
      - mongodb
      - redis
      - kafka
      - qdrant
    command: dotnet watch run

  # Analytics Service (.NET)
  analytics-service:
    build:
      context: ./services/analytics-service
      dockerfile: Dockerfile.dev
    ports:
      - "5002:5002"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ASPNETCORE_URLS=http://+:5002
      - ConnectionStrings__MongoDB=mongodb://mongodb:27017/nlre
      - ConnectionStrings__Redis=redis:6379
      - Kafka__BootstrapServers=kafka:9092
    volumes:
      - ./services/analytics-service:/app
    depends_on:
      - mongodb
      - redis
      - kafka
    command: dotnet watch run

  # MongoDB
  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
      - MONGO_INITDB_DATABASE=nlre
    volumes:
      - mongodb_data:/data/db
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js
    command: mongod --replSet rs0

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  # Kafka
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    ports:
      - "9092:9092"
      - "9093:9093"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: 'CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT'
      KAFKA_ADVERTISED_LISTENERS: 'PLAINTEXT://kafka:9092,PLAINTEXT_HOST://localhost:9093'
      KAFKA_PROCESS_ROLES: 'broker,controller'
      KAFKA_CONTROLLER_QUORUM_VOTERS: '1@kafka:29093'
      KAFKA_LISTENERS: 'PLAINTEXT://kafka:9092,CONTROLLER://kafka:29093,PLAINTEXT_HOST://0.0.0.0:9093'
      KAFKA_INTER_BROKER_LISTENER_NAME: 'PLAINTEXT'
      KAFKA_CONTROLLER_LISTENER_NAMES: 'CONTROLLER'
      KAFKA_LOG_DIRS: '/tmp/kraft-combined-logs'
      CLUSTER_ID: 'MkU3OEVBNTcwNTJENDM2Qk'
    volumes:
      - kafka_data:/var/lib/kafka/data

  # Qdrant Vector Database
  qdrant:
    image: qdrant/qdrant:v1.7.4
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage
    environment:
      - QDRANT__SERVICE__GRPC_PORT=6334
      - QDRANT__SERVICE__HTTP_PORT=6333

  # OpenTelemetry Collector
  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.91.0
    ports:
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
      - "8888:8888"   # Prometheus metrics
      - "8889:8889"   # Prometheus exporter
    volumes:
      - ./config/otel-collector-config.yaml:/etc/otel-collector-config.yaml
    command: ["--config=/etc/otel-collector-config.yaml"]
    depends_on:
      - signoz

  # SigNoz (Observability)
  signoz:
    image: signoz/signoz:0.41.0
    ports:
      - "3301:3301"   # Frontend
      - "8080:8080"   # Query service
    volumes:
      - signoz_data:/var/lib/signoz
    environment:
      - ALERTMANAGER_API_PREFIX=http://alertmanager:9093/api/
      - CLICKHOUSE_ADDR=tcp://clickhouse:9000

  # ClickHouse (SigNoz backend)
  clickhouse:
    image: clickhouse/clickhouse-server:23.11-alpine
    ports:
      - "9000:9000"
      - "8123:8123"
    volumes:
      - clickhouse_data:/var/lib/clickhouse
    ulimits:
      nofile:
        soft: 262144
        hard: 262144

volumes:
  mongodb_data:
  redis_data:
  kafka_data:
  qdrant_data:
  signoz_data:
  clickhouse_data:
```

### Starting Local Environment

```bash
# Clone repository
git clone https://github.com/your-org/next-level-real-estate.git
cd next-level-real-estate

# Copy environment template
cp .env.example .env

# Edit .env with your API keys
nano .env

# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v
```

### Individual Service Setup

#### Node.js Services

```bash
# Navigate to service directory
cd services/api-gateway

# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Seed test data
npm run db:seed

# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Build for production
npm run build

# Start production server
npm start
```

#### .NET Services

```bash
# Navigate to service directory
cd services/qualification-service

# Restore dependencies
dotnet restore

# Create database migration
dotnet ef migrations add InitialCreate

# Apply migrations
dotnet ef database update

# Run development server with hot reload
dotnet watch run

# Run tests
dotnet test

# Build for production
dotnet publish -c Release -o ./publish

# Run production build
dotnet ./publish/QualificationService.dll
```

## Environment Variables

### Global Environment Variables

```bash
# .env (root directory)

# Environment
NODE_ENV=development
ASPNETCORE_ENVIRONMENT=Development

# MongoDB
MONGODB_URI=mongodb://admin:password@localhost:27017/nlre?authSource=admin
MONGODB_DATABASE=nlre

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# Kafka
KAFKA_BROKERS=localhost:9093
KAFKA_CLIENT_ID=nlre-local
KAFKA_GROUP_ID=nlre-consumer-group

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_GRPC_PORT=6334

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-your-openai-api-key

# Anthropic (Claude Agent SDK)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key

# ElevenLabs
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_VOICE_ID=your-default-voice-id
ELEVENLABS_MODEL=eleven_flash_v2_5

# Twilio
TWILIO_ACCOUNT_SID=ACyour-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+15551234567

# Google Ads API
GOOGLE_ADS_CLIENT_ID=your-client-id
GOOGLE_ADS_CLIENT_SECRET=your-client-secret
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token
GOOGLE_ADS_REFRESH_TOKEN=your-refresh-token
GOOGLE_ADS_CUSTOMER_ID=your-customer-id

# Zillow API
ZILLOW_API_KEY=your-zillow-api-key
ZILLOW_WEBHOOK_SECRET=your-webhook-secret

# RealGeeks API
REALGEEKS_API_USERNAME=your-username
REALGEEKS_API_PASSWORD=your-password

# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_SERVICE_NAME=nlre-api-gateway
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=1.0

# Security
JWT_SECRET=your-jwt-secret-min-32-chars
API_KEY_SALT=your-api-key-salt

# Feature Flags
ENABLE_PROMPT_CACHING=true
ENABLE_AGENT_WORKFLOWS=true
ENABLE_TCPA_STRICT_MODE=true
```

### Service-Specific Variables

#### API Gateway

```bash
# services/api-gateway/.env
PORT=3000
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Calling Service

```bash
# services/calling-service/.env
PORT=3002
WEBSOCKET_TIMEOUT_MS=300000
MAX_CONCURRENT_CALLS=50
CALL_RECORDING_ENABLED=true
CALL_RECORDING_BUCKET=nlre-call-recordings
```

#### Qualification Service

```bash
# services/qualification-service/appsettings.Development.json
{
  "ConnectionStrings": {
    "MongoDB": "mongodb://admin:password@localhost:27017/nlre?authSource=admin",
    "Redis": "localhost:6379"
  },
  "Kafka": {
    "BootstrapServers": "localhost:9093",
    "GroupId": "qualification-service",
    "EnableAutoCommit": false
  },
  "Qdrant": {
    "Url": "http://localhost:6333",
    "ApiKey": "",
    "Timeout": 30000
  },
  "Claude": {
    "ApiKey": "sk-ant-your-key",
    "Model": "claude-3-5-sonnet-20250924",
    "MaxTokens": 4096,
    "EnablePromptCaching": true
  }
}
```

## Database Setup

### MongoDB

#### Initialization Script

```javascript
// scripts/mongo-init.js
db = db.getSiblingDB('nlre');

// Create collections
db.createCollection('leads');
db.createCollection('campaigns');
db.createCollection('calls');
db.createCollection('call_logs');
db.createCollection('agents');
db.createCollection('knowledge_updates');

// Create indexes
db.leads.createIndex({ phone: 1 }, { unique: true });
db.leads.createIndex({ email: 1 });
db.leads.createIndex({ source: 1, createdAt: -1 });
db.leads.createIndex({ 'consent.hasWrittenConsent': 1 });
db.leads.createIndex({ 'dncStatus.onNationalRegistry': 1 });

db.campaigns.createIndex({ status: 1, startDate: -1 });
db.campaigns.createIndex({ leadSource: 1 });

db.calls.createIndex({ leadId: 1, createdAt: -1 });
db.calls.createIndex({ status: 1 });
db.calls.createIndex({ createdAt: -1 });

db.call_logs.createIndex({ leadId: 1, timestamp: -1 });
db.call_logs.createIndex({ type: 1, timestamp: -1 });

// Create user
db.createUser({
  user: 'nlre_app',
  pwd: 'app_password',
  roles: [
    {
      role: 'readWrite',
      db: 'nlre'
    }
  ]
});

// Insert seed data
db.campaigns.insertMany([
  {
    name: 'Wholesale Lead Outreach',
    status: 'active',
    leadSource: 'google-ads',
    strategy: 'wholesale',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Zillow Property Inquiry Follow-up',
    status: 'active',
    leadSource: 'zillow',
    strategy: 'wholesale',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('MongoDB initialized successfully');
```

#### Replica Set Setup (for Change Streams)

```bash
# Initialize replica set
docker exec -it next-level-real-estate-mongodb-1 mongosh

# In MongoDB shell
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongodb:27017" }
  ]
});

# Verify
rs.status();
```

#### Migrations (Node.js)

```javascript
// migrations/001-add-consent-fields.js
module.exports = {
  async up(db) {
    await db.collection('leads').updateMany(
      { consent: { $exists: false } },
      {
        $set: {
          consent: {
            hasWrittenConsent: false,
            consentDate: null,
            consentMethod: null,
            consentSource: null,
            expiresAt: null,
          },
          dncStatus: {
            onNationalRegistry: false,
            internalDNC: false,
            lastCheckedAt: null,
          },
          automatedCallsAllowed: false,
        },
      }
    );
  },

  async down(db) {
    await db.collection('leads').updateMany(
      {},
      {
        $unset: {
          consent: '',
          dncStatus: '',
          automatedCallsAllowed: '',
        },
      }
    );
  },
};

// Run migrations
npm run db:migrate
```

#### Migrations (.NET)

```bash
# Create migration
dotnet ef migrations add AddConsentFields

# Apply migration
dotnet ef database update

# Rollback migration
dotnet ef database update PreviousMigrationName

# Generate SQL script
dotnet ef migrations script
```

### Qdrant

#### Collection Setup

```javascript
// scripts/setup-qdrant.js
const { QdrantClient } = require('@qdrant/js-client-rest');

const client = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
});

async function setupCollections() {
  const collections = [
    'architect-knowledge',
    'conversation-patterns',
    'market-intelligence',
    'realty-domain',
  ];

  for (const name of collections) {
    try {
      await client.createCollection(name, {
        vectors: {
          text: {
            size: 1536,
            distance: 'Cosine',
            on_disk: false,
          },
          text_sparse: {
            modifier: 'idf',
          },
        },
      });

      console.log(`Created collection: ${name}`);
    } catch (error) {
      if (error.status === 409) {
        console.log(`Collection already exists: ${name}`);
      } else {
        throw error;
      }
    }
  }
}

setupCollections()
  .then(() => console.log('Qdrant setup complete'))
  .catch(console.error);
```

## Message Queue Configuration

### Kafka Setup

#### Topic Creation

```bash
# Create topics
docker exec -it next-level-real-estate-kafka-1 kafka-topics \
  --create \
  --topic lead-received \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1

docker exec -it next-level-real-estate-kafka-1 kafka-topics \
  --create \
  --topic lead-qualified \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1

docker exec -it next-level-real-estate-kafka-1 kafka-topics \
  --create \
  --topic call-initiated \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1

docker exec -it next-level-real-estate-kafka-1 kafka-topics \
  --create \
  --topic call-completed \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1

# List topics
docker exec -it next-level-real-estate-kafka-1 kafka-topics \
  --list \
  --bootstrap-server localhost:9092
```

#### Consumer Groups

```javascript
// config/kafka.js
module.exports = {
  brokers: process.env.KAFKA_BROKERS.split(','),
  clientId: process.env.KAFKA_CLIENT_ID || 'nlre-service',

  consumer: {
    groupId: process.env.KAFKA_GROUP_ID || 'nlre-consumer-group',
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
    rebalanceTimeout: 60000,
    retry: {
      retries: 5,
      initialRetryTime: 100,
      multiplier: 2,
    },
  },

  producer: {
    allowAutoTopicCreation: false,
    transactionTimeout: 30000,
    retry: {
      retries: 5,
      initialRetryTime: 100,
      multiplier: 2,
    },
  },
};
```

### RabbitMQ Alternative

```yaml
# docker-compose.yml (RabbitMQ instead of Kafka)
rabbitmq:
  image: rabbitmq:3.12-management-alpine
  ports:
    - "5672:5672"
    - "15672:15672"
  environment:
    - RABBITMQ_DEFAULT_USER=admin
    - RABBITMQ_DEFAULT_PASS=password
  volumes:
    - rabbitmq_data:/var/lib/rabbitmq
```

## Observability Setup

### OpenTelemetry Collector

```yaml
# config/otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 10s
    send_batch_size: 1024

  memory_limiter:
    check_interval: 1s
    limit_mib: 512

  resource:
    attributes:
      - key: service.environment
        value: ${env:ENVIRONMENT}
        action: insert

exporters:
  logging:
    loglevel: debug

  otlp:
    endpoint: signoz:4317
    tls:
      insecure: true

  prometheus:
    endpoint: "0.0.0.0:8889"

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch, resource]
      exporters: [logging, otlp]

    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch, resource]
      exporters: [logging, prometheus]

    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch, resource]
      exporters: [logging, otlp]
```

### Node.js Instrumentation

```javascript
// services/api-gateway/instrumentation.js
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'api-gateway',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version,
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
```

### .NET Instrumentation

```csharp
// Program.cs
using OpenTelemetry;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenTelemetry()
    .WithTracing(tracerProviderBuilder =>
    {
        tracerProviderBuilder
            .AddSource("QualificationService")
            .SetResourceBuilder(
                ResourceBuilder.CreateDefault()
                    .AddService("qualification-service")
                    .AddAttributes(new Dictionary<string, object>
                    {
                        ["service.version"] = "1.0.0",
                        ["deployment.environment"] = builder.Environment.EnvironmentName
                    }))
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddMongoDBInstrumentation()
            .AddOtlpExporter(options =>
            {
                options.Endpoint = new Uri(
                    builder.Configuration["OpenTelemetry:Endpoint"]
                    ?? "http://localhost:4317");
            });
    });
```

## Production Deployment

### AWS Deployment

#### Infrastructure as Code (Terraform)

```hcl
# terraform/aws/main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# EKS Cluster
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "nlre-production"
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    general = {
      desired_size = 3
      min_size     = 3
      max_size     = 10

      instance_types = ["t3.xlarge"]
      capacity_type  = "ON_DEMAND"
    }

    compute = {
      desired_size = 2
      min_size     = 2
      max_size     = 8

      instance_types = ["c5.2xlarge"]
      capacity_type  = "SPOT"
    }
  }
}

# DocumentDB (MongoDB compatible)
resource "aws_docdb_cluster" "main" {
  cluster_identifier      = "nlre-docdb"
  engine                  = "docdb"
  master_username         = var.db_username
  master_password         = var.db_password
  backup_retention_period = 7
  preferred_backup_window = "03:00-05:00"
  skip_final_snapshot     = false

  vpc_security_group_ids = [aws_security_group.docdb.id]
  db_subnet_group_name   = aws_docdb_subnet_group.main.name
}

resource "aws_docdb_cluster_instance" "instances" {
  count              = 3
  identifier         = "nlre-docdb-${count.index}"
  cluster_identifier = aws_docdb_cluster.main.id
  instance_class     = "db.r5.large"
}

# ElastiCache (Redis)
resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "nlre-redis"
  replication_group_description = "Redis cluster for NLRE"
  engine                     = "redis"
  engine_version             = "7.0"
  node_type                  = "cache.r6g.large"
  num_cache_clusters         = 3
  automatic_failover_enabled = true
  multi_az_enabled           = true

  subnet_group_name = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]
}

# MSK (Kafka)
resource "aws_msk_cluster" "main" {
  cluster_name           = "nlre-kafka"
  kafka_version          = "3.5.1"
  number_of_broker_nodes = 3

  broker_node_group_info {
    instance_type   = "kafka.m5.large"
    client_subnets  = module.vpc.private_subnets
    security_groups = [aws_security_group.msk.id]

    storage_info {
      ebs_storage_info {
        volume_size = 100
      }
    }
  }

  encryption_info {
    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }
  }
}

# S3 Buckets
resource "aws_s3_bucket" "call_recordings" {
  bucket = "nlre-call-recordings-${var.environment}"

  lifecycle_rule {
    enabled = true

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

resource "aws_s3_bucket" "backups" {
  bucket = "nlre-backups-${var.environment}"

  versioning {
    enabled = true
  }
}

# Outputs
output "eks_cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "docdb_endpoint" {
  value = aws_docdb_cluster.main.endpoint
}

output "redis_endpoint" {
  value = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "kafka_bootstrap_brokers" {
  value = aws_msk_cluster.main.bootstrap_brokers_tls
}
```

#### Kubernetes Deployment

```yaml
# k8s/api-gateway-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: nlre-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: nlre/api-gateway:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: database-secrets
              key: mongodb-uri
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: cache-secrets
              key: redis-url
        - name: KAFKA_BROKERS
          valueFrom:
            configMapKeyRef:
              name: kafka-config
              key: brokers
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  namespace: nlre-production
spec:
  selector:
    app: api-gateway
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### Azure Deployment

```hcl
# terraform/azure/main.tf
provider "azurerm" {
  features {}
}

# AKS Cluster
resource "azurerm_kubernetes_cluster" "main" {
  name                = "nlre-aks"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = "nlre"

  default_node_pool {
    name       = "default"
    node_count = 3
    vm_size    = "Standard_D4s_v3"
  }

  identity {
    type = "SystemAssigned"
  }
}

# Cosmos DB (MongoDB API)
resource "azurerm_cosmosdb_account" "main" {
  name                = "nlre-cosmos"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  offer_type          = "Standard"
  kind                = "MongoDB"

  capabilities {
    name = "EnableMongo"
  }

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = var.location
    failover_priority = 0
  }
}

# Azure Cache for Redis
resource "azurerm_redis_cache" "main" {
  name                = "nlre-redis"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  capacity            = 2
  family              = "P"
  sku_name            = "Premium"
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"
}

# Event Hubs (Kafka-compatible)
resource "azurerm_eventhub_namespace" "main" {
  name                = "nlre-eventhub"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "Standard"
  capacity            = 2

  kafka_enabled = true
}
```

### GCP Deployment

```hcl
# terraform/gcp/main.tf
provider "google" {
  project = var.project_id
  region  = var.region
}

# GKE Cluster
resource "google_container_cluster" "main" {
  name     = "nlre-gke"
  location = var.region

  initial_node_count = 3

  node_config {
    machine_type = "n1-standard-4"
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}

# Cloud Firestore (MongoDB alternative)
# Or use MongoDB Atlas for full compatibility

# Memorystore (Redis)
resource "google_redis_instance" "main" {
  name           = "nlre-redis"
  tier           = "STANDARD_HA"
  memory_size_gb = 5
  region         = var.region
  redis_version  = "REDIS_7_0"
}

# Cloud Pub/Sub (Alternative to Kafka)
resource "google_pubsub_topic" "lead_received" {
  name = "lead-received"
}

resource "google_pubsub_topic" "lead_qualified" {
  name = "lead-qualified"
}
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/ci-cd.yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  DOCKER_REGISTRY: ghcr.io
  IMAGE_PREFIX: ${{ github.repository }}

jobs:
  test-node:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [api-gateway, lead-service, calling-service]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: services/${{ matrix.service }}/package-lock.json

      - name: Install dependencies
        working-directory: services/${{ matrix.service }}
        run: npm ci

      - name: Run linter
        working-directory: services/${{ matrix.service }}
        run: npm run lint

      - name: Run tests
        working-directory: services/${{ matrix.service }}
        run: npm test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: services/${{ matrix.service }}/coverage/lcov.info

  test-dotnet:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [qualification-service, analytics-service]

    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '9.0.x'

      - name: Restore dependencies
        working-directory: services/${{ matrix.service }}
        run: dotnet restore

      - name: Build
        working-directory: services/${{ matrix.service }}
        run: dotnet build --no-restore

      - name: Test
        working-directory: services/${{ matrix.service }}
        run: dotnet test --no-build --verbosity normal /p:CollectCoverage=true

  build-and-push:
    needs: [test-node, test-dotnet]
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    strategy:
      matrix:
        service:
          - api-gateway
          - lead-service
          - calling-service
          - qualification-service
          - analytics-service

    steps:
      - uses: actions/checkout@v4

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.DOCKER_REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: services/${{ matrix.service }}
          push: true
          tags: |
            ${{ env.DOCKER_REGISTRY }}/${{ env.IMAGE_PREFIX }}/${{ matrix.service }}:latest
            ${{ env.DOCKER_REGISTRY }}/${{ env.IMAGE_PREFIX }}/${{ matrix.service }}:${{ github.sha }}

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'

    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBE_CONFIG_STAGING }}

      - name: Deploy to staging
        run: |
          kubectl set image deployment/api-gateway \
            api-gateway=${{ env.DOCKER_REGISTRY }}/${{ env.IMAGE_PREFIX }}/api-gateway:${{ github.sha }} \
            -n nlre-staging

  deploy-production:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBE_CONFIG_PRODUCTION }}

      - name: Deploy to production
        run: |
          kubectl set image deployment/api-gateway \
            api-gateway=${{ env.DOCKER_REGISTRY }}/${{ env.IMAGE_PREFIX }}/api-gateway:${{ github.sha }} \
            -n nlre-production

      - name: Verify deployment
        run: |
          kubectl rollout status deployment/api-gateway -n nlre-production
```

## Secrets Management

### AWS Secrets Manager

```javascript
// utils/secrets.js
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const client = new SecretsManagerClient({ region: process.env.AWS_REGION });

async function getSecret(secretName) {
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await client.send(command);

  return JSON.parse(response.SecretString);
}

module.exports = { getSecret };
```

### HashiCorp Vault

```javascript
// utils/vault.js
const vault = require('node-vault')({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
});

async function getSecret(path) {
  const result = await vault.read(path);
  return result.data;
}

module.exports = { getSecret };
```

## Health Checks

### Node.js Health Endpoints

```javascript
// routes/health.js
const express = require('express');
const router = express.Router();

router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {},
  };

  // Check MongoDB
  try {
    await db.admin().ping();
    health.checks.mongodb = 'healthy';
  } catch (error) {
    health.checks.mongodb = 'unhealthy';
    health.status = 'degraded';
  }

  // Check Redis
  try {
    await redis.ping();
    health.checks.redis = 'healthy';
  } catch (error) {
    health.checks.redis = 'unhealthy';
    health.status = 'degraded';
  }

  // Check Kafka
  try {
    await kafka.admin().listTopics();
    health.checks.kafka = 'healthy';
  } catch (error) {
    health.checks.kafka = 'unhealthy';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

router.get('/ready', async (req, res) => {
  // Readiness check - can service accept traffic?
  const ready = {
    ready: true,
    timestamp: new Date().toISOString(),
  };

  // Check if all dependencies are ready
  try {
    await db.admin().ping();
    await redis.ping();
    res.status(200).json(ready);
  } catch (error) {
    ready.ready = false;
    res.status(503).json(ready);
  }
});

module.exports = router;
```

### .NET Health Endpoints

```csharp
// Program.cs
builder.Services.AddHealthChecks()
    .AddMongoDb(
        mongodbConnectionString: builder.Configuration.GetConnectionString("MongoDB"),
        name: "mongodb",
        timeout: TimeSpan.FromSeconds(3))
    .AddRedis(
        redisConnectionString: builder.Configuration.GetConnectionString("Redis"),
        name: "redis",
        timeout: TimeSpan.FromSeconds(3))
    .AddKafka(
        setup: options =>
        {
            options.BootstrapServers = builder.Configuration["Kafka:BootstrapServers"];
        },
        name: "kafka");

var app = builder.Build();

app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var result = JsonSerializer.Serialize(new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                duration = e.Value.Duration.TotalMilliseconds
            }),
            totalDuration = report.TotalDuration.TotalMilliseconds
        });
        await context.Response.WriteAsync(result);
    }
});

app.MapHealthChecks("/ready");
```

## Scaling Strategies

### Horizontal Pod Autoscaling

```yaml
# k8s/api-gateway-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: nlre-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 25
        periodSeconds: 60
```

### Database Scaling

```javascript
// MongoDB read replicas
const mongoClient = new MongoClient(process.env.MONGODB_URI, {
  readPreference: 'secondaryPreferred',
  maxPoolSize: 100,
});

// Redis cluster mode
const redisCluster = new Redis.Cluster([
  { host: 'redis-1', port: 6379 },
  { host: 'redis-2', port: 6379 },
  { host: 'redis-3', port: 6379 },
], {
  redisOptions: {
    password: process.env.REDIS_PASSWORD,
  },
});
```

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [GitHub Actions](https://docs.github.com/en/actions)
- [OpenTelemetry](https://opentelemetry.io/docs/)
