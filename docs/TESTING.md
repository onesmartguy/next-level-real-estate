# Testing Guide

## Overview

Comprehensive testing strategy for the Next Level Real Estate platform covering unit tests, integration tests, end-to-end tests, load testing, and compliance verification.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [Load Testing](#load-testing)
6. [TCPA Compliance Testing](#tcpa-compliance-testing)
7. [Mock Data Generators](#mock-data-generators)
8. [Test Coverage](#test-coverage)
9. [Testing Tools](#testing-tools)
10. [CI/CD Integration](#cicd-integration)

## Testing Philosophy

### Testing Pyramid

```
        /\
       /  \
      / E2E \      10% - End-to-End Tests
     /------\
    /        \
   /Integration\ 30% - Integration Tests
  /------------\
 /              \
/   Unit Tests   \ 60% - Unit Tests
------------------
```

**Principles**:
- Write tests first (TDD) for critical business logic
- Maintain >80% code coverage
- Fast feedback loop (<5 minutes for full test suite)
- Test behavior, not implementation
- Isolate external dependencies with mocks
- Run tests in CI/CD before deployment

## Unit Testing

### Node.js Unit Tests (Jest)

#### Setup

```javascript
// jest.config.js
module.exports = {
  preset: '@shelf/jest-mongodb',
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js',
  ],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
};
```

#### Example: Lead Service Unit Tests

```javascript
// services/lead-service/src/__tests__/lead.service.test.js
const LeadService = require('../lead.service');
const Lead = require('../models/lead.model');

jest.mock('../models/lead.model');

describe('LeadService', () => {
  let leadService;

  beforeEach(() => {
    leadService = new LeadService();
    jest.clearAllMocks();
  });

  describe('createLead', () => {
    it('should create a new lead with valid data', async () => {
      const leadData = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+15551234567',
        email: 'john@example.com',
        source: 'google-ads',
        propertyAddress: '123 Main St',
      };

      const mockLead = {
        _id: 'lead-123',
        ...leadData,
        createdAt: new Date(),
      };

      Lead.create.mockResolvedValue(mockLead);

      const result = await leadService.createLead(leadData);

      expect(Lead.create).toHaveBeenCalledWith(leadData);
      expect(result).toEqual(mockLead);
    });

    it('should throw error for duplicate phone number', async () => {
      const leadData = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+15551234567',
        email: 'john@example.com',
        source: 'google-ads',
      };

      const duplicateError = new Error('Duplicate key error');
      duplicateError.code = 11000;
      Lead.create.mockRejectedValue(duplicateError);

      await expect(leadService.createLead(leadData))
        .rejects
        .toThrow('Lead with phone number already exists');
    });

    it('should validate phone number format', async () => {
      const leadData = {
        firstName: 'John',
        lastName: 'Doe',
        phone: 'invalid-phone',
        email: 'john@example.com',
        source: 'google-ads',
      };

      await expect(leadService.createLead(leadData))
        .rejects
        .toThrow('Invalid phone number format');
    });
  });

  describe('checkTCPACompliance', () => {
    it('should pass when lead has written consent', async () => {
      const lead = {
        _id: 'lead-123',
        phone: '+15551234567',
        consent: {
          hasWrittenConsent: true,
          consentDate: new Date('2025-01-01'),
          consentMethod: 'written_form',
          expiresAt: new Date('2026-01-01'),
        },
        dncStatus: {
          onNationalRegistry: false,
          internalDNC: false,
        },
        automatedCallsAllowed: true,
      };

      Lead.findById.mockResolvedValue(lead);

      const result = await leadService.checkTCPACompliance('lead-123');

      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should fail when lead has no written consent', async () => {
      const lead = {
        _id: 'lead-123',
        phone: '+15551234567',
        consent: {
          hasWrittenConsent: false,
        },
      };

      Lead.findById.mockResolvedValue(lead);

      const result = await leadService.checkTCPACompliance('lead-123');

      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('NO_WRITTEN_CONSENT');
    });

    it('should fail when lead is on DNC registry', async () => {
      const lead = {
        _id: 'lead-123',
        phone: '+15551234567',
        consent: {
          hasWrittenConsent: true,
          consentDate: new Date('2025-01-01'),
        },
        dncStatus: {
          onNationalRegistry: true,
        },
      };

      Lead.findById.mockResolvedValue(lead);

      const result = await leadService.checkTCPACompliance('lead-123');

      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('ON_NATIONAL_DNC');
    });
  });

  describe('deduplicateLead', () => {
    it('should find duplicate by phone', async () => {
      const newLead = {
        phone: '+15551234567',
        email: 'john@example.com',
      };

      const existingLead = {
        _id: 'existing-123',
        phone: '+15551234567',
        email: 'different@example.com',
      };

      Lead.findOne.mockResolvedValue(existingLead);

      const result = await leadService.deduplicateLead(newLead);

      expect(result.isDuplicate).toBe(true);
      expect(result.existingLead).toEqual(existingLead);
      expect(result.matchedBy).toBe('phone');
    });

    it('should find duplicate by email', async () => {
      const newLead = {
        phone: '+15559999999',
        email: 'john@example.com',
      };

      const existingLead = {
        _id: 'existing-123',
        phone: '+15551234567',
        email: 'john@example.com',
      };

      Lead.findOne
        .mockResolvedValueOnce(null) // No phone match
        .mockResolvedValueOnce(existingLead); // Email match

      const result = await leadService.deduplicateLead(newLead);

      expect(result.isDuplicate).toBe(true);
      expect(result.matchedBy).toBe('email');
    });

    it('should not find duplicate for new lead', async () => {
      const newLead = {
        phone: '+15559999999',
        email: 'new@example.com',
      };

      Lead.findOne.mockResolvedValue(null);

      const result = await leadService.deduplicateLead(newLead);

      expect(result.isDuplicate).toBe(false);
      expect(result.existingLead).toBeNull();
    });
  });
});
```

#### Example: Conversation Pattern Tests

```javascript
// services/calling-service/src/__tests__/conversation.test.js
const ConversationEngine = require('../conversation.engine');
const vectorDB = require('../utils/vector-db');
const claude = require('../utils/claude-client');

jest.mock('../utils/vector-db');
jest.mock('../utils/claude-client');

describe('ConversationEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new ConversationEngine();
    jest.clearAllMocks();
  });

  describe('selectStrategy', () => {
    it('should select strategy based on lead motivation', async () => {
      const lead = {
        _id: 'lead-123',
        motivation: 'urgent-timeline',
        propertyCondition: 'needs-repair',
      };

      const mockStrategies = [
        {
          payload: {
            content: 'For urgent sellers, emphasize quick closing...',
            successRate: 0.85,
          },
        },
      ];

      vectorDB.search.mockResolvedValue(mockStrategies);

      const strategy = await engine.selectStrategy(lead);

      expect(vectorDB.search).toHaveBeenCalledWith(
        expect.stringContaining('urgent-timeline'),
        'conversation-patterns'
      );
      expect(strategy).toBeTruthy();
    });
  });

  describe('handleObjection', () => {
    it('should retrieve objection handling pattern', async () => {
      const objectionType = 'price-too-low';
      const context = {
        propertyCondition: 'needs-repair',
        marketValue: 300000,
        offerAmount: 240000,
      };

      const mockPattern = {
        payload: {
          content: 'Acknowledge their concern and explain ARV calculation...',
          successRate: 0.78,
        },
      };

      vectorDB.search.mockResolvedValue([mockPattern]);

      const response = await engine.handleObjection(objectionType, context);

      expect(response).toContain('ARV calculation');
    });
  });

  describe('analyzeSentiment', () => {
    it('should detect positive sentiment', () => {
      const text = "That sounds great! I'm very interested in selling soon.";

      const sentiment = engine.analyzeSentiment(text);

      expect(sentiment.score).toBeGreaterThan(0.5);
      expect(sentiment.emotion).toBe('positive');
    });

    it('should detect negative sentiment', () => {
      const text = "I'm not sure about this. The price seems too low.";

      const sentiment = engine.analyzeSentiment(text);

      expect(sentiment.score).toBeLessThan(0);
      expect(sentiment.emotion).toBe('concerned');
    });

    it('should detect neutral sentiment', () => {
      const text = "Can you tell me more about the process?";

      const sentiment = engine.analyzeSentiment(text);

      expect(sentiment.score).toBeCloseTo(0, 1);
      expect(sentiment.emotion).toBe('neutral');
    });
  });
});
```

### .NET Unit Tests (xUnit)

#### Setup

```xml
<!-- services/qualification-service/QualificationService.Tests/QualificationService.Tests.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <IsPackable>false</IsPackable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.8.0" />
    <PackageReference Include="xunit" Version="2.6.2" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.5.4" />
    <PackageReference Include="Moq" Version="4.20.70" />
    <PackageReference Include="FluentAssertions" Version="6.12.0" />
    <PackageReference Include="coverlet.collector" Version="6.0.0" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\QualificationService\QualificationService.csproj" />
  </ItemGroup>
</Project>
```

#### Example: Qualification Service Tests

```csharp
// services/qualification-service/QualificationService.Tests/QualificationEngineTests.cs
using Xunit;
using Moq;
using FluentAssertions;
using QualificationService.Services;
using QualificationService.Models;
using QualificationService.Repositories;

namespace QualificationService.Tests
{
    public class QualificationEngineTests
    {
        private readonly Mock<ILeadRepository> _leadRepository;
        private readonly Mock<IPropertyRepository> _propertyRepository;
        private readonly Mock<IVectorDbClient> _vectorDb;
        private readonly QualificationEngine _engine;

        public QualificationEngineTests()
        {
            _leadRepository = new Mock<ILeadRepository>();
            _propertyRepository = new Mock<IPropertyRepository>();
            _vectorDb = new Mock<IVectorDbClient>();
            _engine = new QualificationEngine(
                _leadRepository.Object,
                _propertyRepository.Object,
                _vectorDb.Object
            );
        }

        [Fact]
        public async Task QualifyLead_WithHighEquity_ShouldReturnQualified()
        {
            // Arrange
            var lead = new Lead
            {
                Id = "lead-123",
                PropertyAddress = "123 Main St",
                Motivation = "urgent-timeline"
            };

            var property = new Property
            {
                Address = "123 Main St",
                EstimatedValue = 400000,
                MortgageBalance = 250000, // 37.5% equity
                Condition = "needs-repair"
            };

            _propertyRepository
                .Setup(r => r.GetByAddressAsync(lead.PropertyAddress))
                .ReturnsAsync(property);

            // Act
            var result = await _engine.QualifyLeadAsync(lead);

            // Assert
            result.IsQualified.Should().BeTrue();
            result.QualificationScore.Should().BeGreaterThan(0.7f);
            result.Reasons.Should().Contain("High equity percentage");
        }

        [Fact]
        public async Task QualifyLead_WithLowEquity_ShouldReturnNotQualified()
        {
            // Arrange
            var lead = new Lead
            {
                Id = "lead-123",
                PropertyAddress = "123 Main St",
                Motivation = "curious"
            };

            var property = new Property
            {
                Address = "123 Main St",
                EstimatedValue = 300000,
                MortgageBalance = 280000, // 6.7% equity
                Condition = "good"
            };

            _propertyRepository
                .Setup(r => r.GetByAddressAsync(lead.PropertyAddress))
                .ReturnsAsync(property);

            // Act
            var result = await _engine.QualifyLeadAsync(lead);

            // Assert
            result.IsQualified.Should().BeFalse();
            result.QualificationScore.Should().BeLessThan(0.5f);
            result.Reasons.Should().Contain("Insufficient equity");
        }

        [Theory]
        [InlineData("urgent-timeline", "needs-repair", 0.9f)]
        [InlineData("foreclosure", "poor", 0.95f)]
        [InlineData("probate", "needs-repair", 0.85f)]
        [InlineData("curious", "excellent", 0.3f)]
        public async Task CalculateMotivationScore_ShouldReturnExpectedScore(
            string motivation,
            string condition,
            float expectedMinScore)
        {
            // Arrange
            var lead = new Lead { Motivation = motivation };
            var property = new Property { Condition = condition };

            // Act
            var score = await _engine.CalculateMotivationScore(lead, property);

            // Assert
            score.Should().BeGreaterThanOrEqualTo(expectedMinScore);
        }

        [Fact]
        public async Task EnrichLead_ShouldFetchPropertyData()
        {
            // Arrange
            var lead = new Lead
            {
                Id = "lead-123",
                PropertyAddress = "123 Main St, Austin, TX 78704"
            };

            var expectedProperty = new Property
            {
                Address = "123 Main St",
                City = "Austin",
                State = "TX",
                ZipCode = "78704",
                EstimatedValue = 450000,
                Bedrooms = 3,
                Bathrooms = 2
            };

            _propertyRepository
                .Setup(r => r.GetByAddressAsync(It.IsAny<string>()))
                .ReturnsAsync(expectedProperty);

            // Act
            var enrichedLead = await _engine.EnrichLeadAsync(lead);

            // Assert
            enrichedLead.PropertyData.Should().NotBeNull();
            enrichedLead.PropertyData.EstimatedValue.Should().Be(450000);
        }
    }
}
```

## Integration Testing

### Node.js Integration Tests

```javascript
// services/api-gateway/test/integration/leads.integration.test.js
const request = require('supertest');
const app = require('../../src/app');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

describe('Leads API Integration Tests', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  describe('POST /api/leads', () => {
    it('should create a new lead', async () => {
      const leadData = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+15559876543',
        email: 'jane@example.com',
        source: 'zillow',
        propertyAddress: '456 Oak Ave',
        city: 'Austin',
        state: 'TX',
        zipCode: '78704',
      };

      const response = await request(app)
        .post('/api/leads')
        .send(leadData)
        .expect(201);

      expect(response.body).toMatchObject({
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+15559876543',
        source: 'zillow',
      });
      expect(response.body._id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it('should reject duplicate phone number', async () => {
      const leadData = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+15559876543',
        email: 'jane@example.com',
        source: 'zillow',
      };

      // Create first lead
      await request(app)
        .post('/api/leads')
        .send(leadData)
        .expect(201);

      // Attempt duplicate
      const response = await request(app)
        .post('/api/leads')
        .send(leadData)
        .expect(409);

      expect(response.body.error).toContain('already exists');
    });
  });

  describe('GET /api/leads/:id', () => {
    it('should retrieve lead by ID', async () => {
      // Create lead
      const createResponse = await request(app)
        .post('/api/leads')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          phone: '+15551112222',
          email: 'john@test.com',
          source: 'google-ads',
        });

      const leadId = createResponse.body._id;

      // Retrieve lead
      const response = await request(app)
        .get(`/api/leads/${leadId}`)
        .expect(200);

      expect(response.body._id).toBe(leadId);
      expect(response.body.firstName).toBe('John');
    });

    it('should return 404 for non-existent lead', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      await request(app)
        .get(`/api/leads/${fakeId}`)
        .expect(404);
    });
  });

  describe('PATCH /api/leads/:id/consent', () => {
    it('should update TCPA consent', async () => {
      // Create lead
      const createResponse = await request(app)
        .post('/api/leads')
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          phone: '+15553334444',
          email: 'jane@test.com',
          source: 'google-ads',
        });

      const leadId = createResponse.body._id;

      // Update consent
      const consentData = {
        hasWrittenConsent: true,
        consentDate: new Date().toISOString(),
        consentMethod: 'written_form',
        consentSource: 'landing_page',
      };

      const response = await request(app)
        .patch(`/api/leads/${leadId}/consent`)
        .send(consentData)
        .expect(200);

      expect(response.body.consent.hasWrittenConsent).toBe(true);
      expect(response.body.consent.consentMethod).toBe('written_form');
    });
  });
});
```

### .NET Integration Tests

```csharp
// services/qualification-service/QualificationService.IntegrationTests/QualificationApiTests.cs
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using FluentAssertions;

namespace QualificationService.IntegrationTests
{
    public class QualificationApiTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public QualificationApiTests(WebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task QualifyLead_WithValidData_ReturnsQualificationResult()
        {
            // Arrange
            var request = new QualificationRequest
            {
                LeadId = "lead-123",
                PropertyAddress = "123 Main St",
                EstimatedValue = 400000,
                MortgageBalance = 250000,
                Condition = "needs-repair",
                SellerMotivation = "urgent-timeline"
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/qualification", request);

            // Assert
            response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var result = await response.Content.ReadFromJsonAsync<QualificationResult>();
            result.Should().NotBeNull();
            result.IsQualified.Should().BeTrue();
            result.QualificationScore.Should().BeGreaterThan(0.7f);
        }

        [Fact]
        public async Task GetQualificationHistory_ReturnsLeadHistory()
        {
            // Arrange
            var leadId = "lead-123";

            // Act
            var response = await _client.GetAsync($"/api/qualification/history/{leadId}");

            // Assert
            response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var history = await response.Content.ReadFromJsonAsync<List<QualificationRecord>>();
            history.Should().NotBeNull();
        }
    }
}
```

## End-to-End Testing

### Playwright E2E Tests

```javascript
// e2e/tests/call-workflow.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Call Workflow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('[name="email"]', 'admin@test.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should complete full lead-to-call workflow', async ({ page }) => {
    // Navigate to leads
    await page.click('text=Leads');
    await page.waitForURL('**/leads');

    // Create new lead
    await page.click('button:has-text("New Lead")');
    await page.fill('[name="firstName"]', 'Test');
    await page.fill('[name="lastName"]', 'User');
    await page.fill('[name="phone"]', '+15551234567');
    await page.fill('[name="email"]', 'test@example.com');
    await page.selectOption('[name="source"]', 'google-ads');
    await page.fill('[name="propertyAddress"]', '123 Test St');

    // Add consent
    await page.check('[name="hasConsent"]');
    await page.selectOption('[name="consentMethod"]', 'written_form');

    // Submit
    await page.click('button:has-text("Create Lead")');

    // Wait for lead to be created
    await page.waitForSelector('text=Lead created successfully');

    // Verify lead appears in list
    await expect(page.locator('text=Test User')).toBeVisible();

    // Initiate call
    await page.click('text=Test User');
    await page.click('button:has-text("Call Now")');

    // Verify call initiated
    await page.waitForSelector('text=Call in progress');
    await expect(page.locator('[data-testid="call-status"]')).toHaveText('Active');

    // Simulate call completion
    await page.waitForTimeout(5000);
    await page.click('button:has-text("End Call")');

    // Verify call logged
    await page.waitForSelector('text=Call completed');
    await expect(page.locator('[data-testid="call-history"]')).toContainText('Test User');
  });

  test('should prevent calling lead without consent', async ({ page }) => {
    // Navigate to leads
    await page.click('text=Leads');

    // Create lead without consent
    await page.click('button:has-text("New Lead")');
    await page.fill('[name="firstName"]', 'No');
    await page.fill('[name="lastName"]', 'Consent');
    await page.fill('[name="phone"]', '+15559999999');
    await page.click('button:has-text("Create Lead")');

    // Try to call
    await page.click('text=No Consent');
    await page.click('button:has-text("Call Now")');

    // Verify error
    await expect(page.locator('text=TCPA violation')).toBeVisible();
    await expect(page.locator('text=No written consent')).toBeVisible();
  });
});
```

## Load Testing

### k6 Load Testing

```javascript
// load-tests/lead-ingestion.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    errors: ['rate<0.01'],             // Error rate under 1%
  },
};

const BASE_URL = 'http://localhost:3000/api';

export default function () {
  // Create lead
  const leadPayload = JSON.stringify({
    firstName: `Test-${__VU}`,
    lastName: `User-${__ITER}`,
    phone: `+1555${String(__VU).padStart(3, '0')}${String(__ITER).padStart(4, '0')}`,
    email: `test-${__VU}-${__ITER}@example.com`,
    source: 'load-test',
    propertyAddress: `${__VU} Test St`,
    city: 'Austin',
    state: 'TX',
    zipCode: '78704',
  });

  const createResponse = http.post(`${BASE_URL}/leads`, leadPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(createResponse, {
    'lead created': (r) => r.status === 201,
    'response time OK': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  if (createResponse.status === 201) {
    const leadId = JSON.parse(createResponse.body)._id;

    // Get lead
    const getResponse = http.get(`${BASE_URL}/leads/${leadId}`);

    check(getResponse, {
      'lead retrieved': (r) => r.status === 200,
      'correct lead': (r) => JSON.parse(r.body)._id === leadId,
    }) || errorRate.add(1);
  }

  sleep(1);
}
```

### Artillery Alternative

```yaml
# load-tests/artillery-config.yml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 120
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    - duration: 120
      arrivalRate: 100
      name: "Peak load"
  processor: "./processors.js"

scenarios:
  - name: "Lead Creation Flow"
    flow:
      - post:
          url: "/api/leads"
          json:
            firstName: "Load"
            lastName: "Test"
            phone: "+1{{ $randomNumber() }}"
            email: "test-{{ $randomString() }}@example.com"
            source: "google-ads"
          capture:
            - json: "$._id"
              as: "leadId"
      - get:
          url: "/api/leads/{{ leadId }}"
      - think: 2

  - name: "Call Simulation"
    weight: 30
    flow:
      - post:
          url: "/api/calls"
          json:
            leadId: "{{ leadId }}"
            strategy: "wholesale"
      - think: 30
      - patch:
          url: "/api/calls/{{ callId }}/complete"
          json:
            duration: 180
            outcome: "interested"
```

## TCPA Compliance Testing

### Compliance Test Suite

```javascript
// test/compliance/tcpa.test.js
const request = require('supertest');
const app = require('../../src/app');
const Lead = require('../../src/models/lead.model');

describe('TCPA Compliance Tests', () => {
  describe('Consent Verification', () => {
    it('should block calls without written consent', async () => {
      const lead = await Lead.create({
        firstName: 'Test',
        lastName: 'User',
        phone: '+15551111111',
        consent: {
          hasWrittenConsent: false,
        },
      });

      const response = await request(app)
        .post('/api/calls')
        .send({ leadId: lead._id })
        .expect(403);

      expect(response.body.error).toContain('TCPA_VIOLATION');
      expect(response.body.violation).toBe('NO_WRITTEN_CONSENT');
    });

    it('should block calls with expired consent', async () => {
      const lead = await Lead.create({
        firstName: 'Test',
        lastName: 'User',
        phone: '+15551111112',
        consent: {
          hasWrittenConsent: true,
          consentDate: new Date('2024-01-01'),
          expiresAt: new Date('2024-12-31'), // Expired
        },
      });

      const response = await request(app)
        .post('/api/calls')
        .send({ leadId: lead._id })
        .expect(403);

      expect(response.body.violation).toBe('CONSENT_EXPIRED');
    });

    it('should block calls to DNC registry numbers', async () => {
      const lead = await Lead.create({
        firstName: 'Test',
        lastName: 'User',
        phone: '+15551111113',
        consent: {
          hasWrittenConsent: true,
          consentDate: new Date('2025-01-01'),
        },
        dncStatus: {
          onNationalRegistry: true,
          lastCheckedAt: new Date(),
        },
      });

      const response = await request(app)
        .post('/api/calls')
        .send({ leadId: lead._id })
        .expect(403);

      expect(response.body.violation).toBe('ON_NATIONAL_DNC');
    });

    it('should allow calls with valid consent', async () => {
      const lead = await Lead.create({
        firstName: 'Test',
        lastName: 'User',
        phone: '+15551111114',
        consent: {
          hasWrittenConsent: true,
          consentDate: new Date('2025-01-01'),
          consentMethod: 'written_form',
          consentSource: 'landing_page',
          expiresAt: new Date('2026-01-01'),
        },
        dncStatus: {
          onNationalRegistry: false,
          internalDNC: false,
          lastCheckedAt: new Date(),
        },
        automatedCallsAllowed: true,
      });

      const response = await request(app)
        .post('/api/calls')
        .send({ leadId: lead._id })
        .expect(201);

      expect(response.body.callId).toBeDefined();
    });
  });

  describe('Call Logging', () => {
    it('should log all call attempts', async () => {
      const lead = await Lead.create({
        firstName: 'Test',
        lastName: 'User',
        phone: '+15551111115',
        consent: {
          hasWrittenConsent: true,
          consentDate: new Date('2025-01-01'),
        },
      });

      await request(app)
        .post('/api/calls')
        .send({ leadId: lead._id });

      const logs = await request(app)
        .get(`/api/call-logs?leadId=${lead._id}`)
        .expect(200);

      expect(logs.body).toHaveLength(1);
      expect(logs.body[0]).toMatchObject({
        leadId: lead._id.toString(),
        type: 'automated',
        consentVerified: true,
      });
    });
  });
});
```

## Mock Data Generators

### Lead Generator

```javascript
// test/fixtures/lead-generator.js
const { faker } = require('@faker-js/faker');

function generateLead(overrides = {}) {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    phone: faker.phone.number('+1##########'),
    email: faker.internet.email(),
    source: faker.helpers.arrayElement(['google-ads', 'zillow', 'realgeeks']),
    propertyAddress: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zipCode: faker.location.zipCode(),
    consent: {
      hasWrittenConsent: true,
      consentDate: faker.date.recent({ days: 30 }),
      consentMethod: 'written_form',
      consentSource: 'landing_page',
      expiresAt: faker.date.future({ years: 1 }),
    },
    dncStatus: {
      onNationalRegistry: false,
      internalDNC: false,
      lastCheckedAt: new Date(),
    },
    automatedCallsAllowed: true,
    ...overrides,
  };
}

function generateLeads(count = 10, overrides = {}) {
  return Array.from({ length: count }, () => generateLead(overrides));
}

module.exports = { generateLead, generateLeads };
```

### Property Generator

```javascript
// test/fixtures/property-generator.js
const { faker } = require('@faker-js/faker');

function generateProperty(overrides = {}) {
  const estimatedValue = faker.number.int({ min: 200000, max: 800000 });
  const mortgageBalance = faker.number.int({ min: 0, max: estimatedValue * 0.8 });

  return {
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zipCode: faker.location.zipCode(),
    propertyType: faker.helpers.arrayElement(['single-family', 'condo', 'townhouse', 'multi-family']),
    estimatedValue,
    mortgageBalance,
    bedrooms: faker.number.int({ min: 1, max: 5 }),
    bathrooms: faker.number.int({ min: 1, max: 4 }),
    squareFeet: faker.number.int({ min: 800, max: 4000 }),
    yearBuilt: faker.number.int({ min: 1950, max: 2024 }),
    condition: faker.helpers.arrayElement(['excellent', 'good', 'fair', 'needs-repair', 'poor']),
    daysOnMarket: faker.number.int({ min: 0, max: 180 }),
    ...overrides,
  };
}

module.exports = { generateProperty };
```

### Call Generator

```javascript
// test/fixtures/call-generator.js
const { faker } = require('@faker-js/faker');

function generateCall(overrides = {}) {
  const duration = faker.number.int({ min: 60, max: 600 });

  return {
    leadId: faker.string.uuid(),
    status: faker.helpers.arrayElement(['initiated', 'active', 'completed', 'failed']),
    duration,
    startedAt: faker.date.recent({ days: 7 }),
    endedAt: faker.date.recent({ days: 7 }),
    outcome: faker.helpers.arrayElement(['interested', 'not-interested', 'callback', 'voicemail', 'no-answer']),
    sentiment: {
      score: faker.number.float({ min: -1, max: 1, precision: 0.01 }),
      emotion: faker.helpers.arrayElement(['positive', 'neutral', 'concerned', 'negative']),
    },
    transcript: generateTranscript(),
    ...overrides,
  };
}

function generateTranscript() {
  return [
    {
      speaker: 'agent',
      text: "Hi, this is calling from Next Level Real Estate. Am I speaking with the property owner?",
      timestamp: 0,
    },
    {
      speaker: 'user',
      text: "Yes, this is me.",
      timestamp: 3,
    },
    {
      speaker: 'agent',
      text: "Great! I'm calling about your property. Do you have a few minutes to chat?",
      timestamp: 5,
    },
  ];
}

module.exports = { generateCall };
```

## Test Coverage

### Coverage Configuration

```javascript
// jest.config.js (coverage settings)
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!src/index.js',
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
```

### Running Coverage

```bash
# Node.js
npm test -- --coverage

# .NET
dotnet test /p:CollectCoverage=true /p:CoverageReporterOutputFormat=cobertura

# View HTML report
open coverage/lcov-report/index.html
```

## Testing Tools

### Node.js Stack
- **Jest**: Unit and integration testing
- **Supertest**: HTTP assertion library
- **Playwright**: E2E browser testing
- **k6**: Load and performance testing
- **@faker-js/faker**: Test data generation
- **mongodb-memory-server**: In-memory MongoDB for testing

### .NET Stack
- **xUnit**: Unit testing framework
- **Moq**: Mocking library
- **FluentAssertions**: Fluent assertion syntax
- **WebApplicationFactory**: Integration testing
- **Bogus**: Test data generation

## CI/CD Integration

### GitHub Actions Test Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test-node:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  test-dotnet:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '9.0.x'

      - name: Run tests
        run: dotnet test /p:CollectCoverage=true

  e2e-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Start services
        run: docker compose up -d

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Stop services
        run: docker compose down
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [xUnit Documentation](https://xunit.net/)
- [Playwright Documentation](https://playwright.dev/)
- [k6 Documentation](https://k6.io/docs/)
- [Testing Best Practices](https://testingjavascript.com/)
