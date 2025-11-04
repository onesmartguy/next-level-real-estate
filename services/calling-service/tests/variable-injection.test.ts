/**
 * Variable Injection System - Test Suite
 *
 * Comprehensive tests for the variable injection service including:
 * - Variable replacement
 * - TCPA compliance validation
 * - Missing data handling
 * - Sanitization
 * - Edge cases
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  VariableInjectionService,
  LeadData,
  DEFAULT_FIRST_MESSAGE_TEMPLATE,
  DEFAULT_SYSTEM_PROMPT_TEMPLATE
} from '../variable-injection';

describe('VariableInjectionService', () => {
  let service: VariableInjectionService;

  beforeEach(() => {
    service = new VariableInjectionService();
  });

  describe('Basic Variable Replacement', () => {
    test('should replace all variables with valid data', () => {
      const template = 'Hi {{homeowner_first_name}} {{homeowner_last_name}}, about {{property_address_street}}';
      const leadData: Partial<LeadData> = {
        homeowner_first_name: 'Jeff',
        homeowner_last_name: 'Price',
        property_address_street: '829 Lake Bluff Drive',
        property_city: 'Flower Mound',
        property_state: 'TX',
        phone_number: '+19725551234',
        lead_id: 'lead_123',
        has_consent: true,
        on_dnc_list: false
      };

      const result = service.injectVariables(template, '', leadData);

      expect(result.success).toBe(true);
      expect(result.first_message).toBe('Hi Jeff Price, about 829 Lake Bluff Drive');
      expect(result.errors.length).toBe(0);
    });

    test('should handle missing optional variables with fallbacks', () => {
      const template = 'Hi {{homeowner_first_name}}, you have owned {{property_address_street}} for {{years_owned}}';
      const leadData: Partial<LeadData> = {
        homeowner_first_name: 'Jeff',
        property_address_street: '829 Lake Bluff Drive',
        property_city: 'Flower Mound',
        property_state: 'TX',
        phone_number: '+19725551234',
        lead_id: 'lead_123',
        has_consent: true,
        on_dnc_list: false
        // years_owned is missing
      };

      const result = service.injectVariables(template, '', leadData);

      expect(result.success).toBe(true);
      expect(result.first_message).toContain('a while'); // Fallback for years_owned
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.missing_variables).toContain('years_owned');
    });

    test('should enrich data with derived fields', () => {
      const template = '{{homeowner_full_name}} at {{property_full_address}}';
      const leadData: Partial<LeadData> = {
        homeowner_first_name: 'Jeff',
        homeowner_last_name: 'Price',
        property_address_street: '829 Lake Bluff Drive',
        property_city: 'Flower Mound',
        property_state: 'TX',
        property_zip: '75022',
        phone_number: '+19725551234',
        lead_id: 'lead_123',
        has_consent: true,
        on_dnc_list: false
      };

      const result = service.injectVariables(template, '', leadData);

      expect(result.success).toBe(true);
      expect(result.first_message).toContain('Jeff Price');
      expect(result.first_message).toContain('829 Lake Bluff Drive, Flower Mound, TX, 75022');
    });
  });

  describe('TCPA Compliance Validation', () => {
    test('should reject lead without consent', () => {
      const leadData: Partial<LeadData> = {
        homeowner_first_name: 'Jeff',
        homeowner_last_name: 'Price',
        property_address_street: '829 Lake Bluff Drive',
        property_city: 'Flower Mound',
        property_state: 'TX',
        phone_number: '+19725551234',
        lead_id: 'lead_123',
        has_consent: false, // No consent
        on_dnc_list: false
      };

      const result = service.injectVariables('', '', leadData);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('TCPA Violation'));
      expect(result.errors).toContain(expect.stringContaining('consent'));
    });

    test('should reject lead on DNC list', () => {
      const leadData: Partial<LeadData> = {
        homeowner_first_name: 'Jeff',
        homeowner_last_name: 'Price',
        property_address_street: '829 Lake Bluff Drive',
        property_city: 'Flower Mound',
        property_state: 'TX',
        phone_number: '+19725551234',
        lead_id: 'lead_123',
        has_consent: true,
        on_dnc_list: true // On DNC list
      };

      const result = service.injectVariables('', '', leadData);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('Do Not Call'));
    });

    test('should warn about expired consent (>90 days)', () => {
      const leadData: Partial<LeadData> = {
        homeowner_first_name: 'Jeff',
        homeowner_last_name: 'Price',
        property_address_street: '829 Lake Bluff Drive',
        property_city: 'Flower Mound',
        property_state: 'TX',
        phone_number: '+19725551234',
        lead_id: 'lead_123',
        has_consent: true,
        on_dnc_list: false,
        consent_date: new Date('2024-01-01') // >90 days old
      };

      const result = service.injectVariables('', '', leadData);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('90 days'));
    });

    test('should warn about recent contact (<24 hours)', () => {
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 12);

      const leadData: Partial<LeadData> = {
        homeowner_first_name: 'Jeff',
        homeowner_last_name: 'Price',
        property_address_street: '829 Lake Bluff Drive',
        property_city: 'Flower Mound',
        property_state: 'TX',
        phone_number: '+19725551234',
        lead_id: 'lead_123',
        has_consent: true,
        on_dnc_list: false,
        consent_date: new Date(),
        last_contact_date: yesterday
      };

      const result = service.injectVariables('', '', leadData);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('24 hours'));
    });

    test('should accept valid compliant lead', () => {
      const leadData: Partial<LeadData> = {
        homeowner_first_name: 'Jeff',
        homeowner_last_name: 'Price',
        property_address_street: '829 Lake Bluff Drive',
        property_city: 'Flower Mound',
        property_state: 'TX',
        phone_number: '+19725551234',
        lead_id: 'lead_123',
        has_consent: true,
        on_dnc_list: false,
        consent_date: new Date()
      };

      const result = service.injectVariables('Hi {{homeowner_first_name}}', '', leadData);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Data Sanitization', () => {
    test('should remove script tags from input', () => {
      const leadData: Partial<LeadData> = {
        homeowner_first_name: 'Jeff<script>alert("xss")</script>',
        homeowner_last_name: 'Price',
        property_address_street: '829 Lake Bluff Drive',
        property_city: 'Flower Mound',
        property_state: 'TX',
        phone_number: '+19725551234',
        lead_id: 'lead_123',
        has_consent: true,
        on_dnc_list: false
      };

      const result = service.injectVariables('Hi {{homeowner_first_name}}', '', leadData);

      expect(result.success).toBe(true);
      expect(result.first_message).not.toContain('<script>');
      expect(result.first_message).toContain('Jeff');
    });

    test('should remove HTML tags from input', () => {
      const leadData: Partial<LeadData> = {
        homeowner_first_name: 'Jeff<b>Bold</b>',
        homeowner_last_name: 'Price',
        property_address_street: '829 Lake Bluff Drive',
        property_city: 'Flower Mound',
        property_state: 'TX',
        phone_number: '+19725551234',
        lead_id: 'lead_123',
        has_consent: true,
        on_dnc_list: false
      };

      const result = service.injectVariables('Hi {{homeowner_first_name}}', '', leadData);

      expect(result.success).toBe(true);
      expect(result.first_message).not.toContain('<b>');
      expect(result.first_message).toContain('JeffBold');
    });

    test('should handle special characters safely', () => {
      const leadData: Partial<LeadData> = {
        homeowner_first_name: "Jeff & Mary's",
        homeowner_last_name: 'Price',
        property_address_street: '829 Lake Bluff Drive #A',
        property_city: 'Flower Mound',
        property_state: 'TX',
        phone_number: '+19725551234',
        lead_id: 'lead_123',
        has_consent: true,
        on_dnc_list: false
      };

      const result = service.injectVariables('Hi {{homeowner_first_name}} at {{property_address_street}}', '', leadData);

      expect(result.success).toBe(true);
      expect(result.first_message).toContain("Jeff & Mary's");
      expect(result.first_message).toContain('829 Lake Bluff Drive #A');
    });
  });

  describe('Template Validation', () => {
    test('should extract all variables from template', () => {
      const template = 'Hi {{name}}, about {{property}} in {{city}}';
      const variables = service.extractVariables(template);

      expect(variables).toEqual(['name', 'property', 'city']);
    });

    test('should validate template has required variables', () => {
      const template = 'Hi {{homeowner_first_name}} {{homeowner_last_name}} at {{property_address_street}}';
      const validation = service.validateTemplate(template);

      // Should be missing required variables like property_city, property_state, phone_number, lead_id
      expect(validation.valid).toBe(false);
      expect(validation.missing.length).toBeGreaterThan(0);
    });
  });

  describe('Output Length Validation', () => {
    test('should warn if first message exceeds 500 characters', () => {
      const longTemplate = 'Hi {{homeowner_first_name}}, ' + 'x'.repeat(500);
      const leadData: Partial<LeadData> = {
        homeowner_first_name: 'Jeff',
        homeowner_last_name: 'Price',
        property_address_street: '829 Lake Bluff Drive',
        property_city: 'Flower Mound',
        property_state: 'TX',
        phone_number: '+19725551234',
        lead_id: 'lead_123',
        has_consent: true,
        on_dnc_list: false
      };

      const result = service.injectVariables(longTemplate, '', leadData);

      expect(result.success).toBe(true);
      expect(result.warnings).toContain(expect.stringContaining('500 characters'));
    });

    test('should warn if system prompt exceeds 10,000 characters', () => {
      const longPrompt = 'System prompt: ' + 'x'.repeat(10000);
      const leadData: Partial<LeadData> = {
        homeowner_first_name: 'Jeff',
        homeowner_last_name: 'Price',
        property_address_street: '829 Lake Bluff Drive',
        property_city: 'Flower Mound',
        property_state: 'TX',
        phone_number: '+19725551234',
        lead_id: 'lead_123',
        has_consent: true,
        on_dnc_list: false
      };

      const result = service.injectVariables('Hi', longPrompt, leadData);

      expect(result.success).toBe(true);
      expect(result.warnings).toContain(expect.stringContaining('10,000'));
    });
  });

  describe('Real-World Integration Tests', () => {
    test('should successfully inject variables in default first message template', () => {
      const leadData: LeadData = {
        lead_id: 'lead_12345',
        homeowner_first_name: 'Jeff',
        homeowner_last_name: 'Price',
        phone_number: '+19725551234',
        property_address_street: '829 Lake Bluff Drive',
        property_city: 'Flower Mound',
        property_state: 'TX',
        has_consent: true,
        on_dnc_list: false
      };

      const result = service.injectVariables(
        DEFAULT_FIRST_MESSAGE_TEMPLATE,
        DEFAULT_SYSTEM_PROMPT_TEMPLATE,
        leadData
      );

      expect(result.success).toBe(true);
      expect(result.first_message).toContain('Jeff Price');
      expect(result.first_message).toContain('829 Lake Bluff Drive');
      expect(result.first_message).toContain('Flower Mound');
      expect(result.system_prompt).toContain('Jeff');
      expect(result.system_prompt).toContain('829 Lake Bluff Drive');
    });

    test('should handle complete lead data with all optional fields', () => {
      const leadData: LeadData = {
        lead_id: 'lead_12345',
        homeowner_first_name: 'Jeff',
        homeowner_last_name: 'Price',
        phone_number: '+19725551234',
        email: 'jeff@example.com',
        property_address_street: '829 Lake Bluff Drive',
        property_city: 'Flower Mound',
        property_state: 'TX',
        property_zip: '75022',
        estimated_value: '$450,000',
        property_size: '3,200',
        bedrooms: 4,
        bathrooms: 3,
        year_built: 2010,
        years_owned: '12',
        property_type: 'single_family',
        lead_source: 'google_ads',
        motivation_level: 'high',
        situation_type: 'downsizing',
        has_consent: true,
        on_dnc_list: false,
        consent_date: new Date('2024-10-15')
      };

      const result = service.injectVariables(
        DEFAULT_FIRST_MESSAGE_TEMPLATE,
        DEFAULT_SYSTEM_PROMPT_TEMPLATE,
        leadData
      );

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.system_prompt).toContain('$450,000');
      expect(result.system_prompt).toContain('3,200 sq ft');
      expect(result.system_prompt).toContain('12 years');
    });
  });
});
