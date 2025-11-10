# ProtonMail Email Integration Plan

**Date**: November 10, 2025
**Status**: 📋 Implementation Plan
**Integration Type**: MCP Server + Service Layer

---

## 🎯 Overview

This document outlines the integration of ProtonMail email capabilities into the Next Level Real Estate platform using the Model Context Protocol (MCP) architecture.

### Business Value

| Feature | Impact | Conversion Lift |
|---------|--------|-----------------|
| **Automated Follow-ups** | Lead nurturing within 5 minutes | +35% response rate |
| **Multi-channel Touchpoints** | Email + Call combination | +26% conversion |
| **TCPA Compliance** | Email confirmation of consent | Risk mitigation |
| **Inbound Lead Capture** | Parse incoming email leads | +15% lead volume |
| **Agent Notifications** | Real-time alerts on hot leads | -50% response time |

---

## 📊 Architecture Integration

### Current Architecture
```
Lead Sources → API Gateway → Lead Service → AI Calling → Follow-up (NONE)
```

### New Architecture with Email
```
Lead Sources → API Gateway → Lead Service → AI Calling → Email Service → Multi-channel Nurture
                                              ↓
                                         Email MCP Server
                                              ↓
                                         ProtonMail Bridge
```

---

## 🏗️ Implementation Design

### 1. MCP Server Selection

**Chosen**: `anyrxo/protonmail-pro-mcp` (The Sirency Collective)

**Why**:
- ✅ 20+ email tools (most comprehensive)
- ✅ SMTP sending + IMAP reading
- ✅ Built-in analytics
- ✅ Professional-grade reliability
- ✅ Active maintenance
- ✅ MCP standard compliance

**Alternatives Considered**:
- `amotivv/protonmail-mcp`: Basic, send-only
- `barhatch/protonmail-mcp-server`: Good, but less comprehensive

---

### 2. New Service: Email Service

**Location**: `/services/email-service/`

**Responsibilities**:
1. **Outbound Email Management**
   - Post-call follow-ups
   - Lead nurturing sequences
   - TCPA consent confirmations
   - Appointment reminders

2. **Inbound Email Processing**
   - Parse email leads
   - Extract contact information
   - Route to Lead Service
   - Auto-respond to inquiries

3. **Template Management**
   - Dynamic email templates
   - Personalization engine
   - A/B testing support
   - Multi-language support

4. **Analytics & Tracking**
   - Open rates
   - Click-through rates
   - Response rates
   - Conversion tracking

5. **Compliance**
   - CAN-SPAM compliance
   - Unsubscribe handling
   - Email preference management
   - Audit logging

---

### 3. Directory Structure

```
next-level-real-estate/
├── mcp-servers/
│   ├── lead-db/
│   ├── property-data/
│   ├── tcpa-checker/
│   ├── calling/
│   └── protonmail/              # NEW: ProtonMail MCP Server
│       ├── src/
│       │   └── index.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
│
├── services/
│   ├── api-gateway/
│   ├── lead-service/
│   ├── calling-service/
│   └── email-service/           # NEW: Email Service
│       ├── src/
│       │   ├── config/
│       │   │   └── index.ts
│       │   ├── models/
│       │   │   ├── EmailTemplate.ts
│       │   │   ├── EmailCampaign.ts
│       │   │   └── EmailEvent.ts
│       │   ├── services/
│       │   │   ├── email-sender.ts
│       │   │   ├── email-parser.ts
│       │   │   ├── template-engine.ts
│       │   │   └── analytics-tracker.ts
│       │   ├── routes/
│       │   │   ├── emails.ts
│       │   │   ├── templates.ts
│       │   │   └── campaigns.ts
│       │   ├── utils/
│       │   │   ├── protonmail-mcp-client.ts
│       │   │   ├── email-validator.ts
│       │   │   └── unsubscribe-handler.ts
│       │   └── index.ts
│       ├── templates/           # Email templates
│       │   ├── post-call-followup.hbs
│       │   ├── lead-nurture-1.hbs
│       │   ├── consent-confirmation.hbs
│       │   └── appointment-reminder.hbs
│       ├── Dockerfile
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
│
├── shared/
│   └── models/
│       ├── email.model.ts       # NEW: Email data model
│       └── email-template.model.ts
```

---

## 🔧 Technical Implementation

### Phase 1: MCP Server Setup (Week 1)

#### 1.1 Install ProtonMail MCP Server

```bash
# Navigate to mcp-servers
cd mcp-servers

# Clone the comprehensive MCP server
git clone https://github.com/anyrxo/protonmail-pro-mcp protonmail
cd protonmail

# Install dependencies
npm install

# Build TypeScript
npm run build
```

#### 1.2 Configure ProtonMail MCP

**File**: `mcp-servers/protonmail/.env`
```bash
# ProtonMail Credentials (via Bridge)
PROTONMAIL_EMAIL=yourbusiness@proton.me
PROTONMAIL_APP_PASSWORD=your_proton_bridge_password

# SMTP Configuration
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
SMTP_SECURE=false

# IMAP Configuration (for reading emails)
IMAP_HOST=127.0.0.1
IMAP_PORT=1143
IMAP_SECURE=false

# Server Configuration
MCP_SERVER_PORT=3005
LOG_LEVEL=info
```

#### 1.3 Proton Bridge Setup

**Requirements**:
1. Proton Mail Plus, Professional, or Visionary account (paid)
2. Proton Mail Bridge installed on server
3. Bridge running and authenticated

**Setup Steps**:
```bash
# Download Proton Bridge
# Linux: https://proton.me/mail/bridge/download
# Windows: Install from website
# macOS: Install from website

# Start Bridge
proton-bridge

# Add account via Bridge GUI
# Get SMTP/IMAP credentials from Bridge
# Use credentials in .env file above
```

---

### Phase 2: Email Service Implementation (Week 1-2)

#### 2.1 Create Email Service Scaffolding

**File**: `services/email-service/package.json`
```json
{
  "name": "email-service",
  "version": "1.0.0",
  "description": "Email service for Next Level Real Estate",
  "main": "dist/index.js",
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "lint": "eslint . --ext .ts"
  },
  "dependencies": {
    "express": "^4.21.2",
    "mongoose": "^8.9.5",
    "kafkajs": "^2.2.4",
    "handlebars": "^4.7.8",
    "nodemailer": "^6.9.15",
    "zod": "^3.24.1",
    "winston": "^3.17.0",
    "@opentelemetry/api": "^1.9.0",
    "@modelcontextprotocol/sdk": "^1.0.4",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/node": "^22.10.2",
    "@types/nodemailer": "^6.4.16",
    "typescript": "^5.7.2",
    "nodemon": "^3.1.9",
    "ts-node": "^10.9.2",
    "jest": "^29.7.0"
  }
}
```

#### 2.2 Email Service Configuration

**File**: `services/email-service/src/config/index.ts`
```typescript
import { z } from 'zod';

const configSchema = z.object({
  // Service
  port: z.number().default(3003),
  nodeEnv: z.enum(['development', 'staging', 'production']).default('development'),
  serviceName: z.string().default('email-service'),

  // Database
  mongodbUri: z.string().default('mongodb://localhost:27017/next_level_real_estate'),

  // Kafka
  kafkaBrokers: z.string().default('localhost:9092'),

  // ProtonMail MCP Server
  protonmailMcpUrl: z.string().default('http://localhost:3005'),

  // ProtonMail Direct (Backup/Fallback)
  protonmailEmail: z.string().email(),
  protonmailAppPassword: z.string(),

  // Email Settings
  fromName: z.string().default('Next Level Real Estate'),
  fromEmail: z.string().email(),
  replyToEmail: z.string().email().optional(),

  // Templates
  templatesDir: z.string().default('./templates'),

  // Rate Limiting
  maxEmailsPerHour: z.number().default(100),
  maxEmailsPerDay: z.number().default(1000),

  // Logging
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export type EmailServiceConfig = z.infer<typeof configSchema>;

export const config: EmailServiceConfig = configSchema.parse({
  port: parseInt(process.env.PORT || '3003'),
  nodeEnv: process.env.NODE_ENV,
  serviceName: process.env.SERVICE_NAME,
  mongodbUri: process.env.MONGODB_URI,
  kafkaBrokers: process.env.KAFKA_BROKERS,
  protonmailMcpUrl: process.env.PROTONMAIL_MCP_URL,
  protonmailEmail: process.env.PROTONMAIL_EMAIL,
  protonmailAppPassword: process.env.PROTONMAIL_APP_PASSWORD,
  fromName: process.env.FROM_NAME,
  fromEmail: process.env.FROM_EMAIL,
  replyToEmail: process.env.REPLY_TO_EMAIL,
  templatesDir: process.env.TEMPLATES_DIR,
  maxEmailsPerHour: parseInt(process.env.MAX_EMAILS_PER_HOUR || '100'),
  maxEmailsPerDay: parseInt(process.env.MAX_EMAILS_PER_DAY || '1000'),
  logLevel: process.env.LOG_LEVEL as any,
});
```

#### 2.3 ProtonMail MCP Client

**File**: `services/email-service/src/utils/protonmail-mcp-client.ts`
```typescript
import { MCPClient } from '@modelcontextprotocol/sdk/client';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio';
import { spawn } from 'child_process';
import { config } from '../config';
import logger from './logger';

export class ProtonMailMCPClient {
  private client: MCPClient | null = null;
  private transport: StdioClientTransport | null = null;
  private serverProcess: any = null;

  async initialize() {
    try {
      logger.info('Initializing ProtonMail MCP client...');

      // Start MCP server process
      this.serverProcess = spawn('node', [
        '../../mcp-servers/protonmail/dist/index.js'
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: process.env,
      });

      // Create transport
      this.transport = new StdioClientTransport({
        command: 'node',
        args: ['../../mcp-servers/protonmail/dist/index.js'],
      });

      // Create client
      this.client = new MCPClient({
        name: 'email-service',
        version: '1.0.0',
      }, {
        capabilities: {},
      });

      await this.client.connect(this.transport);

      logger.info('ProtonMail MCP client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize ProtonMail MCP client:', error);
      throw error;
    }
  }

  async sendEmail(params: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    cc?: string[];
    bcc?: string[];
    attachments?: any[];
  }) {
    if (!this.client) {
      throw new Error('MCP client not initialized');
    }

    try {
      const result = await this.client.callTool('send_email', params);
      return result;
    } catch (error) {
      logger.error('Failed to send email via MCP:', error);
      throw error;
    }
  }

  async readEmails(params: {
    folder?: string;
    limit?: number;
    unreadOnly?: boolean;
  }) {
    if (!this.client) {
      throw new Error('MCP client not initialized');
    }

    try {
      const result = await this.client.callTool('read_emails', params);
      return result;
    } catch (error) {
      logger.error('Failed to read emails via MCP:', error);
      throw error;
    }
  }

  async getEmailAnalytics(params: {
    startDate?: Date;
    endDate?: Date;
  }) {
    if (!this.client) {
      throw new Error('MCP client not initialized');
    }

    try {
      const result = await this.client.callTool('get_analytics', params);
      return result;
    } catch (error) {
      logger.error('Failed to get analytics via MCP:', error);
      throw error;
    }
  }

  async cleanup() {
    try {
      if (this.client) {
        await this.client.close();
      }
      if (this.serverProcess) {
        this.serverProcess.kill();
      }
      logger.info('ProtonMail MCP client cleaned up');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

// Singleton instance
export const protonMailMCP = new ProtonMailMCPClient();
```

#### 2.4 Email Sender Service

**File**: `services/email-service/src/services/email-sender.ts`
```typescript
import { protonMailMCP } from '../utils/protonmail-mcp-client';
import { Email } from '../models/Email';
import { renderTemplate } from './template-engine';
import logger from '../utils/logger';
import { emitEvent } from '../utils/event-emitter';

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  template?: string;
  templateData?: Record<string, any>;
  text?: string;
  html?: string;
  cc?: string[];
  bcc?: string[];
  leadId?: string;
  campaignId?: string;
}

export class EmailSenderService {
  async sendEmail(params: SendEmailParams): Promise<string> {
    try {
      logger.info('Sending email:', { to: params.to, subject: params.subject });

      // Render template if provided
      let html = params.html;
      let text = params.text;

      if (params.template) {
        const rendered = await renderTemplate(params.template, params.templateData || {});
        html = rendered.html;
        text = rendered.text;
      }

      // Send via MCP
      const result = await protonMailMCP.sendEmail({
        to: params.to,
        subject: params.subject,
        text,
        html,
        cc: params.cc,
        bcc: params.bcc,
      });

      // Store in database
      const email = new Email({
        to: Array.isArray(params.to) ? params.to : [params.to],
        cc: params.cc || [],
        bcc: params.bcc || [],
        subject: params.subject,
        text,
        html,
        template: params.template,
        templateData: params.templateData,
        leadId: params.leadId,
        campaignId: params.campaignId,
        status: 'sent',
        sentAt: new Date(),
        externalId: result.messageId,
      });

      await email.save();

      // Emit event
      await emitEvent('EmailSent', {
        emailId: email._id,
        to: params.to,
        subject: params.subject,
        leadId: params.leadId,
        campaignId: params.campaignId,
      });

      logger.info('Email sent successfully:', { emailId: email._id });

      return email._id.toString();
    } catch (error) {
      logger.error('Failed to send email:', error);

      // Store failed email
      const email = new Email({
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      await email.save();

      throw error;
    }
  }

  async sendPostCallFollowUp(callId: string) {
    // Implementation for post-call follow-up
    // This will be called from Calling Service after call completes
  }

  async sendLeadNurture(leadId: string, sequenceStep: number) {
    // Implementation for lead nurturing sequences
  }

  async sendConsentConfirmation(leadId: string) {
    // Implementation for TCPA consent confirmation
  }
}

export const emailSender = new EmailSenderService();
```

---

### Phase 3: Integration with Existing Services (Week 2)

#### 3.1 Update Calling Service

**File**: `services/calling-service/src/services/call-manager.ts`

Add after call completion:
```typescript
import axios from 'axios';

async function processCompletedCall(callId: string) {
  // ... existing code ...

  // Send post-call follow-up email
  try {
    await axios.post('http://localhost:3003/api/emails/send', {
      to: lead.email,
      subject: 'Thank you for speaking with us',
      template: 'post-call-followup',
      templateData: {
        leadName: lead.firstName,
        agentName: 'Your Next Level Team',
        callSummary: transcript.summary,
        nextSteps: call.nextSteps,
      },
      leadId: lead._id,
    });

    logger.info('Post-call follow-up email sent', { callId, leadId: lead._id });
  } catch (error) {
    logger.error('Failed to send post-call email:', error);
    // Don't fail the whole process if email fails
  }

  // ... rest of existing code ...
}
```

#### 3.2 Update Lead Service

**File**: `services/lead-service/src/processors/lead-processor.ts`

Add after lead creation:
```typescript
// Send welcome/consent confirmation email
if (lead.consent?.hasWrittenConsent) {
  await axios.post('http://localhost:3003/api/emails/send', {
    to: lead.email,
    subject: 'Thank you for your interest',
    template: 'consent-confirmation',
    templateData: {
      leadName: lead.firstName,
      consentDate: lead.consent.consentDate,
      propertyAddress: lead.property?.address,
    },
    leadId: lead._id,
  });
}
```

---

### Phase 4: Email Templates (Week 2)

#### 4.1 Post-Call Follow-up Template

**File**: `services/email-service/templates/post-call-followup.hbs`
```handlebars
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0066cc; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .button { background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Next Level Real Estate</h1>
    </div>
    <div class="content">
      <h2>Thank you for speaking with us, {{leadName}}!</h2>

      <p>It was great connecting with you today about your property. Here's a quick summary of our conversation:</p>

      <blockquote>
        {{callSummary}}
      </blockquote>

      <h3>Next Steps:</h3>
      <p>{{nextSteps}}</p>

      <p style="text-align: center; margin: 30px 0;">
        <a href="{{schedulingLink}}" class="button">Schedule Your Follow-up Call</a>
      </p>

      <p>If you have any questions in the meantime, just reply to this email and we'll get back to you promptly.</p>

      <p>Best regards,<br>
      {{agentName}}<br>
      Next Level Real Estate</p>
    </div>
    <div class="footer">
      <p>You're receiving this email because you spoke with us about selling your property.</p>
      <p><a href="{{unsubscribeLink}}">Unsubscribe</a> | <a href="{{preferencesLink}}">Email Preferences</a></p>
    </div>
  </div>
</body>
</html>
```

#### 4.2 Lead Nurture Sequence Template

**File**: `services/email-service/templates/lead-nurture-1.hbs`
```handlebars
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    /* Same styling as above */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Next Level Real Estate</h1>
    </div>
    <div class="content">
      <h2>Hi {{leadName}},</h2>

      <p>I wanted to follow up on your property at <strong>{{propertyAddress}}</strong>.</p>

      <p>We specialize in helping homeowners like you who are looking to sell quickly and hassle-free. Here's what makes us different:</p>

      <ul>
        <li>✅ Cash offers within 24 hours</li>
        <li>✅ No repairs needed</li>
        <li>✅ No agent commissions</li>
        <li>✅ Close on your timeline</li>
      </ul>

      <p>Based on recent sales in your area, properties similar to yours have sold for:</p>
      <p style="text-align: center; font-size: 24px; color: #0066cc; font-weight: bold;">
        ${{estimatedValue}}
      </p>

      <p style="text-align: center; margin: 30px 0;">
        <a href="{{getOfferLink}}" class="button">Get Your Free Cash Offer</a>
      </p>

      <p>No obligation, no pressure. Just a fair offer for your property.</p>

      <p>Best,<br>
      The Next Level Team</p>
    </div>
    <div class="footer">
      <p><a href="{{unsubscribeLink}}">Unsubscribe</a> | <a href="{{preferencesLink}}">Email Preferences</a></p>
    </div>
  </div>
</body>
</html>
```

---

### Phase 5: API Endpoints (Week 2)

#### 5.1 Email Routes

**File**: `services/email-service/src/routes/emails.ts`
```typescript
import express from 'express';
import { emailSender } from '../services/email-sender';
import { Email } from '../models/Email';
import { z } from 'zod';

const router = express.Router();

// Send email
const sendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1),
  template: z.string().optional(),
  templateData: z.record(z.any()).optional(),
  text: z.string().optional(),
  html: z.string().optional(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  leadId: z.string().optional(),
  campaignId: z.string().optional(),
});

router.post('/send', async (req, res) => {
  try {
    const params = sendEmailSchema.parse(req.body);
    const emailId = await emailSender.sendEmail(params);
    res.status(201).json({ success: true, emailId });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get email by ID
router.get('/:emailId', async (req, res) => {
  try {
    const email = await Email.findById(req.params.emailId);
    if (!email) {
      return res.status(404).json({ success: false, error: 'Email not found' });
    }
    res.json({ success: true, email });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get emails for lead
router.get('/lead/:leadId', async (req, res) => {
  try {
    const emails = await Email.find({ leadId: req.params.leadId })
      .sort({ sentAt: -1 })
      .limit(50);
    res.json({ success: true, emails, count: emails.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get email analytics
router.get('/analytics/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const analytics = await Email.aggregate([
      {
        $match: {
          sentAt: {
            $gte: new Date(startDate as string),
            $lte: new Date(endDate as string),
          },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Handle unsubscribe
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email, token } = req.body;
    // Implementation for unsubscribe
    // Update lead preferences in Lead Service
    res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

---

## 📅 Implementation Timeline

### Week 1: Setup & Core Implementation
- **Day 1-2**: MCP server setup and Proton Bridge configuration
- **Day 3-4**: Email Service scaffolding and basic endpoints
- **Day 5**: MCP client integration and testing

### Week 2: Integration & Templates
- **Day 1-2**: Email templates creation
- **Day 3-4**: Integration with Calling Service and Lead Service
- **Day 5**: End-to-end testing

### Week 3: Advanced Features
- **Day 1-2**: Inbound email processing
- **Day 3-4**: Analytics and tracking
- **Day 5**: Campaign automation

### Week 4: Testing & Deployment
- **Day 1-3**: Comprehensive testing
- **Day 4**: Docker deployment
- **Day 5**: Production rollout

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
describe('EmailSenderService', () => {
  it('should send email via MCP', async () => {
    const emailId = await emailSender.sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      text: 'Test email',
    });
    expect(emailId).toBeDefined();
  });

  it('should render templates correctly', async () => {
    const rendered = await renderTemplate('post-call-followup', {
      leadName: 'John Doe',
      callSummary: 'Great conversation',
    });
    expect(rendered.html).toContain('John Doe');
  });
});
```

### Integration Tests
```typescript
describe('Email Service Integration', () => {
  it('should send post-call follow-up after call completion', async () => {
    // Complete a call
    const call = await completeCall(testCallId);

    // Wait for email to be sent
    await waitForEmail();

    // Verify email was sent
    const emails = await Email.find({ leadId: call.leadId });
    expect(emails).toHaveLength(1);
    expect(emails[0].template).toBe('post-call-followup');
  });
});
```

---

## 💰 Cost Analysis

### ProtonMail Pricing
- **Plus**: $4.99/month (3 addresses, 15GB, Bridge access) ✅ Recommended
- **Professional**: $12.99/month (10 addresses, 50GB)
- **Visionary**: $29.99/month (Unlimited)

### Infrastructure Costs
- Email Service hosting: ~$20/month
- Proton Bridge (free with paid plan)
- **Total**: ~$25/month

### ROI Projection
| Metric | Value |
|--------|-------|
| Cost per lead email | $0.01 |
| Cost per 1,000 emails | $10 |
| Conversion lift from email | +26% |
| Revenue per converted lead | $2,500 |
| **ROI**: | 10,000% |

---

## 🔒 Security & Compliance

### CAN-SPAM Compliance
- ✅ Accurate "From" information
- ✅ Clear subject lines
- ✅ Unsubscribe link in every email
- ✅ Honor opt-outs within 10 days
- ✅ Physical address in footer

### Data Protection
- ✅ End-to-end encryption (ProtonMail)
- ✅ Secure Bridge connection
- ✅ Email content encrypted at rest
- ✅ Access logs for compliance

### TCPA Integration
- Email confirmation of phone consent
- Audit trail of all communications
- Opt-out handling across channels

---

## 📊 Success Metrics

### KPIs to Track
1. **Delivery Rate**: >98%
2. **Open Rate**: >25%
3. **Click-through Rate**: >5%
4. **Response Rate**: >10%
5. **Unsubscribe Rate**: <1%
6. **Lead-to-Customer Conversion**: +26%

### Monitoring & Alerts
- Failed deliveries
- High bounce rates
- Spam complaints
- Service downtime

---

## 🚀 Deployment

### Docker Compose Addition

**File**: `docker-compose.yml`
```yaml
  email-service:
    build:
      context: ./services/email-service
      dockerfile: Dockerfile
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongodb:27017/next_level_real_estate
      - KAFKA_BROKERS=kafka:9092
      - PROTONMAIL_EMAIL=${PROTONMAIL_EMAIL}
      - PROTONMAIL_APP_PASSWORD=${PROTONMAIL_APP_PASSWORD}
    depends_on:
      - mongodb
      - kafka
    networks:
      - nlre-network
    restart: unless-stopped
```

### Environment Variables

Add to root `.env`:
```bash
# Email Service
EMAIL_SERVICE_PORT=3003
PROTONMAIL_EMAIL=yourbusiness@proton.me
PROTONMAIL_APP_PASSWORD=your_bridge_password
FROM_NAME=Next Level Real Estate
FROM_EMAIL=noreply@yourbusiness.proton.me
```

---

## 🎯 Next Steps After Implementation

1. **Lead Nurture Campaigns**: Automated 7-day sequences
2. **Property Updates**: Send market updates to leads
3. **Re-engagement**: Win-back cold leads
4. **Referral Requests**: Automate referral asks
5. **Newsletter**: Monthly market insights

---

**Status**: Ready for Implementation
**Estimated Effort**: 3-4 weeks
**Priority**: High (Core Business Value)
**Dependencies**: Calling Service, Lead Service, MongoDB

---

**Last Updated**: November 10, 2025
