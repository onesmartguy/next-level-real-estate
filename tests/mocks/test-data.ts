/**
 * Test Data Generators
 *
 * Provides factories for generating realistic test data for leads,
 * contacts, calls, and other domain entities.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Lead test data generator
 */
export class LeadDataGenerator {
  /**
   * Generate a mock lead
   */
  static generateLead(overrides?: Partial<any>): any {
    const firstName = this.getRandomElement(['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily']);
    const lastName = this.getRandomElement(['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia']);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    const phone = this.generatePhoneNumber();

    return {
      leadId: uuidv4(),
      source: this.getRandomElement(['google_ads', 'zillow', 'realgeeks', 'referral']),
      sourceLeadId: `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'new',
      contact: {
        firstName,
        lastName,
        email,
        phone,
      },
      property: this.generateProperty(),
      consent: this.generateConsent(),
      dncStatus: {
        onNationalRegistry: false,
        internalDNC: false,
        lastCheckedAt: new Date(),
      },
      automatedCallsAllowed: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Generate multiple leads
   */
  static generateLeads(count: number, overrides?: Partial<any>): any[] {
    return Array.from({ length: count }, () => this.generateLead(overrides));
  }

  /**
   * Generate a qualified lead
   */
  static generateQualifiedLead(overrides?: Partial<any>): any {
    return this.generateLead({
      status: 'qualified',
      qualificationScore: 85,
      qualificationReason: 'High equity, motivated seller, good property condition',
      ...overrides,
    });
  }

  /**
   * Generate property data
   */
  private static generateProperty(): any {
    return {
      address: {
        street: `${this.getRandomNumber(100, 9999)} ${this.getRandomElement(['Main', 'Oak', 'Maple', 'Pine', 'Elm'])} ${this.getRandomElement(['St', 'Ave', 'Dr', 'Ln', 'Rd'])}`,
        city: this.getRandomElement(['Austin', 'Dallas', 'Houston', 'San Antonio', 'Phoenix']),
        state: this.getRandomElement(['TX', 'AZ', 'CA', 'FL']),
        zipCode: String(this.getRandomNumber(10000, 99999)),
      },
      propertyType: this.getRandomElement(['single_family', 'condo', 'townhouse', 'multi_family']),
      bedrooms: this.getRandomNumber(2, 5),
      bathrooms: this.getRandomNumber(1, 4),
      squareFeet: this.getRandomNumber(1000, 4000),
      yearBuilt: this.getRandomNumber(1960, 2020),
      estimatedValue: this.getRandomNumber(150000, 500000),
      estimatedEquity: this.getRandomNumber(30000, 200000),
      condition: this.getRandomElement(['excellent', 'good', 'fair', 'needs_work']),
      ownerOccupied: Math.random() > 0.5,
    };
  }

  /**
   * Generate TCPA consent data
   */
  private static generateConsent(): any {
    const methods = ['written_form', 'email', 'phone'] as const;
    const consentDate = new Date();
    consentDate.setDate(consentDate.getDate() - this.getRandomNumber(1, 30));

    return {
      hasWrittenConsent: true,
      consentDate,
      consentMethod: this.getRandomElement(methods),
      consentSource: 'landing_page',
      expiresAt: new Date(consentDate.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year
    };
  }

  /**
   * Generate US phone number
   */
  private static generatePhoneNumber(): string {
    const areaCode = this.getRandomNumber(200, 999);
    const exchange = this.getRandomNumber(200, 999);
    const subscriber = this.getRandomNumber(1000, 9999);
    return `+1${areaCode}${exchange}${subscriber}`;
  }

  /**
   * Get random element from array
   */
  private static getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Get random number in range
   */
  private static getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

/**
 * Call test data generator
 */
export class CallDataGenerator {
  /**
   * Generate a mock call
   */
  static generateCall(overrides?: Partial<any>): any {
    return {
      callId: uuidv4(),
      leadId: uuidv4(),
      twilioCallSid: `CA${this.generateSid()}`,
      elevenLabsConversationId: `conv_${this.generateId()}`,
      from: '+15555555555',
      to: LeadDataGenerator['generatePhoneNumber'](),
      status: this.getRandomElement(['queued', 'ringing', 'in-progress', 'completed']),
      direction: 'outbound',
      startTime: new Date(),
      endTime: null,
      duration: null,
      recordingUrl: null,
      transcript: [],
      outcome: null,
      sentiment: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Generate a completed call
   */
  static generateCompletedCall(overrides?: Partial<any>): any {
    const startTime = new Date();
    const duration = this.getRandomNumber(30, 300);
    const endTime = new Date(startTime.getTime() + duration * 1000);

    return this.generateCall({
      status: 'completed',
      endTime,
      duration,
      transcript: this.generateTranscript(),
      outcome: {
        qualified: true,
        interestLevel: 'high',
        nextAction: 'Schedule follow-up',
        summary: 'Positive conversation, seller interested in quick sale',
      },
      sentiment: {
        overall: 'positive',
        score: 0.75,
      },
      recordingUrl: 'https://api.twilio.com/recordings/RE123456',
      ...overrides,
    });
  }

  /**
   * Generate call transcript
   */
  private static generateTranscript(): any[] {
    return [
      {
        role: 'agent',
        message: 'Hi, this is Alex from Next Level Real Estate. Is this a good time to talk?',
        timestamp: new Date(),
        sentiment: 'neutral',
      },
      {
        role: 'user',
        message: 'Yes, I have a few minutes.',
        timestamp: new Date(Date.now() + 2000),
        sentiment: 'neutral',
      },
      {
        role: 'agent',
        message: 'Great! I understand you have a property you might be interested in selling?',
        timestamp: new Date(Date.now() + 5000),
        sentiment: 'positive',
      },
      {
        role: 'user',
        message: 'Yes, I inherited a house and need to sell it quickly.',
        timestamp: new Date(Date.now() + 8000),
        sentiment: 'positive',
      },
    ];
  }

  /**
   * Generate SID
   */
  private static generateSid(): string {
    const chars = '0123456789abcdef';
    let sid = '';
    for (let i = 0; i < 32; i++) {
      sid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return sid;
  }

  /**
   * Generate ID
   */
  private static generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get random element from array
   */
  private static getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Get random number in range
   */
  private static getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

/**
 * Campaign test data generator
 */
export class CampaignDataGenerator {
  /**
   * Generate a mock campaign
   */
  static generateCampaign(overrides?: Partial<any>): any {
    return {
      campaignId: uuidv4(),
      name: `Campaign ${Date.now()}`,
      type: this.getRandomElement(['cold_call', 'follow_up', 'nurture', 'appointment_reminder']),
      status: 'active',
      strategy: 'wholesale',
      leadSource: this.getRandomElement(['google_ads', 'zillow', 'realgeeks']),
      conversationFlow: {
        greeting: 'Hi, this is [Agent] from Next Level Real Estate.',
        qualification: 'I understand you have a property you might be interested in selling?',
        objectionHandling: {
          'not interested': 'I completely understand. Can I ask what changed?',
          'too busy': 'No problem. When would be a better time to chat?',
        },
        closing: 'Thank you for your time. Have a great day!',
      },
      performance: {
        callsInitiated: 0,
        callsCompleted: 0,
        connectRate: 0,
        qualificationRate: 0,
        conversionRate: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Get random element from array
   */
  private static getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}

/**
 * Agent context test data generator
 */
export class AgentContextDataGenerator {
  /**
   * Generate agent context
   */
  static generateContext(agentName: string, overrides?: Partial<any>): any {
    return {
      agentName,
      sessionId: uuidv4(),
      timestamp: new Date(),
      context: {
        currentTask: 'Lead qualification',
        decisionHistory: [],
        knowledgeBaseVersion: '1.0.0',
        cacheHitRate: 0.9,
      },
      ...overrides,
    };
  }

  /**
   * Generate market intelligence data
   */
  static generateMarketIntelligence(overrides?: Partial<any>): any {
    return {
      location: {
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
      },
      metrics: {
        averagePrice: 350000,
        medianPrice: 325000,
        daysOnMarket: 35,
        inventoryLevel: 'low',
        priceDirection: 'increasing',
        priceChangePercent: 5.2,
      },
      comparables: [
        {
          address: '123 Main St, Austin, TX 78701',
          price: 340000,
          soldDate: '2025-10-15',
          squareFeet: 1800,
          bedrooms: 3,
          bathrooms: 2,
        },
        {
          address: '456 Oak Ave, Austin, TX 78701',
          price: 360000,
          soldDate: '2025-10-10',
          squareFeet: 2000,
          bedrooms: 3,
          bathrooms: 2.5,
        },
      ],
      timestamp: new Date(),
      ...overrides,
    };
  }
}

/**
 * Webhook payload generators
 */
export class WebhookDataGenerator {
  /**
   * Generate Google Ads lead webhook payload
   */
  static generateGoogleAdsLead(overrides?: Partial<any>): any {
    return {
      lead_id: `gads_${Date.now()}`,
      google_key: `GADS${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      campaign_id: '123456789',
      ad_group_id: '987654321',
      creative_id: '555555555',
      user_column_data: [
        { column_id: 'FULL_NAME', string_value: 'John Smith' },
        { column_id: 'EMAIL', string_value: 'john.smith@example.com' },
        { column_id: 'PHONE_NUMBER', string_value: '+15125551234' },
        { column_id: 'STREET_ADDRESS', string_value: '123 Main St' },
        { column_id: 'CITY', string_value: 'Austin' },
        { column_id: 'STATE', string_value: 'TX' },
        { column_id: 'ZIP_CODE', string_value: '78701' },
      ],
      is_test: false,
      ...overrides,
    };
  }

  /**
   * Generate Zillow lead webhook payload
   */
  static generateZillowLead(overrides?: Partial<any>): any {
    return {
      ContactID: `zillow_${Date.now()}`,
      FirstName: 'Jane',
      LastName: 'Doe',
      Email: 'jane.doe@example.com',
      Phone: '512-555-5678',
      PropertyStreet: '456 Oak Ave',
      PropertyCity: 'Austin',
      PropertyState: 'TX',
      PropertyZip: '78702',
      PropertyType: 'SingleFamily',
      Bedrooms: '3',
      Bathrooms: '2',
      SquareFeet: '1800',
      Message: 'Interested in selling my house quickly',
      LeadSource: 'Zillow Premier Agent',
      Timestamp: new Date().toISOString(),
      ...overrides,
    };
  }

  /**
   * Generate Twilio status callback payload
   */
  static generateTwilioStatusCallback(callSid: string, status: string, overrides?: Partial<any>): any {
    return {
      CallSid: callSid,
      CallStatus: status,
      From: '+15555555555',
      To: '+15125551234',
      Direction: 'outbound-api',
      Timestamp: new Date().toISOString(),
      CallDuration: status === 'completed' ? '120' : undefined,
      ...overrides,
    };
  }
}

// Export convenience methods
export const generateLead = LeadDataGenerator.generateLead.bind(LeadDataGenerator);
export const generateLeads = LeadDataGenerator.generateLeads.bind(LeadDataGenerator);
export const generateQualifiedLead = LeadDataGenerator.generateQualifiedLead.bind(LeadDataGenerator);
export const generateCall = CallDataGenerator.generateCall.bind(CallDataGenerator);
export const generateCompletedCall = CallDataGenerator.generateCompletedCall.bind(CallDataGenerator);
export const generateCampaign = CampaignDataGenerator.generateCampaign.bind(CampaignDataGenerator);
export const generateAgentContext = AgentContextDataGenerator.generateContext.bind(AgentContextDataGenerator);
export const generateMarketIntelligence = AgentContextDataGenerator.generateMarketIntelligence.bind(AgentContextDataGenerator);
export const generateGoogleAdsLead = WebhookDataGenerator.generateGoogleAdsLead.bind(WebhookDataGenerator);
export const generateZillowLead = WebhookDataGenerator.generateZillowLead.bind(WebhookDataGenerator);
export const generateTwilioStatusCallback = WebhookDataGenerator.generateTwilioStatusCallback.bind(WebhookDataGenerator);
