/**
 * Variable Injection System for ElevenLabs Conversational AI
 *
 * Dynamically replaces template variables in agent prompts and first messages
 * with real-time lead and property data from database/CRM.
 *
 * Supports:
 * - Mustache-style variables: {{variable_name}}
 * - Graceful handling of missing data
 * - Data validation and sanitization
 * - TCPA compliance verification
 */

export interface LeadData {
  // Homeowner Information
  homeowner_first_name: string;
  homeowner_last_name: string;
  homeowner_full_name?: string;
  phone_number: string;
  email?: string;

  // Property Information
  property_address_street: string;
  property_city: string;
  property_state: string;
  property_zip?: string;
  property_full_address?: string;

  // Property Details
  estimated_value?: string;
  property_size?: string;
  bedrooms?: number;
  bathrooms?: number;
  year_built?: number;
  years_owned?: string;
  property_type?: 'single_family' | 'condo' | 'townhouse' | 'multi_family';

  // Lead Metadata
  lead_source?: string;
  lead_id: string;
  motivation_level?: 'high' | 'medium' | 'low';
  situation_type?: string;

  // Compliance
  has_consent: boolean;
  on_dnc_list: boolean;
  consent_date?: Date;
  last_contact_date?: Date;
}

export interface InjectionResult {
  success: boolean;
  first_message: string;
  system_prompt: string;
  errors: string[];
  warnings: string[];
  missing_variables: string[];
}

/**
 * Variable Injection Service
 */
export class VariableInjectionService {
  private requiredVariables = [
    'homeowner_first_name',
    'homeowner_last_name',
    'property_address_street',
    'property_city',
    'property_state',
    'phone_number',
    'lead_id'
  ];

  private complianceRequiredFields = [
    'has_consent',
    'on_dnc_list'
  ];

  /**
   * Main injection method - replaces all variables in templates
   */
  public injectVariables(
    firstMessageTemplate: string,
    systemPromptTemplate: string,
    leadData: Partial<LeadData>
  ): InjectionResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missing: string[] = [];

    // Step 1: Validate compliance requirements
    const complianceCheck = this.validateCompliance(leadData);
    if (!complianceCheck.valid) {
      errors.push(...complianceCheck.errors);
      return {
        success: false,
        first_message: '',
        system_prompt: '',
        errors,
        warnings,
        missing_variables: []
      };
    }

    // Step 2: Validate required variables
    const validationResult = this.validateRequiredVariables(leadData);
    if (validationResult.missing.length > 0) {
      missing.push(...validationResult.missing);
      warnings.push(`Missing required variables: ${validationResult.missing.join(', ')}`);
    }

    // Step 3: Enrich lead data with derived fields
    const enrichedData = this.enrichLeadData(leadData);

    // Step 4: Sanitize all data to prevent injection attacks
    const sanitizedData = this.sanitizeData(enrichedData);

    // Step 5: Replace variables in templates
    const firstMessage = this.replaceVariables(firstMessageTemplate, sanitizedData, missing);
    const systemPrompt = this.replaceVariables(systemPromptTemplate, sanitizedData, missing);

    // Step 6: Validate output length (ElevenLabs limits)
    const lengthCheck = this.validateOutputLength(firstMessage, systemPrompt);
    if (!lengthCheck.valid) {
      warnings.push(...lengthCheck.warnings);
    }

    return {
      success: errors.length === 0,
      first_message: firstMessage,
      system_prompt: systemPrompt,
      errors,
      warnings,
      missing_variables: missing
    };
  }

  /**
   * Validate TCPA compliance requirements
   */
  private validateCompliance(leadData: Partial<LeadData>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required compliance fields
    if (leadData.has_consent === undefined) {
      errors.push('TCPA Violation: has_consent field is required');
    }

    if (leadData.on_dnc_list === undefined) {
      errors.push('TCPA Violation: on_dnc_list field is required');
    }

    // Verify consent
    if (leadData.has_consent === false) {
      errors.push('TCPA Violation: Lead does not have written consent for automated calls');
    }

    // Check DNC status
    if (leadData.on_dnc_list === true) {
      errors.push('TCPA Violation: Lead is on Do Not Call list');
    }

    // Verify consent is not expired (90 days)
    if (leadData.consent_date) {
      const consentAge = Date.now() - new Date(leadData.consent_date).getTime();
      const daysOld = consentAge / (1000 * 60 * 60 * 24);
      if (daysOld > 90) {
        errors.push('TCPA Warning: Consent is older than 90 days, consider re-verification');
      }
    }

    // Check call frequency (max 3 calls in 7 days)
    if (leadData.last_contact_date) {
      const hoursSinceLastCall = (Date.now() - new Date(leadData.last_contact_date).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastCall < 24) {
        errors.push('TCPA Warning: Last contact was within 24 hours');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate that all required variables are present
   */
  private validateRequiredVariables(leadData: Partial<LeadData>): { valid: boolean; missing: string[] } {
    const missing = this.requiredVariables.filter(field => {
      const value = leadData[field as keyof LeadData];
      return value === undefined || value === null || value === '';
    });

    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Enrich lead data with derived fields
   */
  private enrichLeadData(leadData: Partial<LeadData>): Partial<LeadData> {
    const enriched = { ...leadData };

    // Create full name if not provided
    if (!enriched.homeowner_full_name && enriched.homeowner_first_name && enriched.homeowner_last_name) {
      enriched.homeowner_full_name = `${enriched.homeowner_first_name} ${enriched.homeowner_last_name}`;
    }

    // Create full address if not provided
    if (!enriched.property_full_address) {
      const parts = [
        enriched.property_address_street,
        enriched.property_city,
        enriched.property_state,
        enriched.property_zip
      ].filter(Boolean);
      enriched.property_full_address = parts.join(', ');
    }

    // Format estimated value if needed
    if (enriched.estimated_value && !enriched.estimated_value.includes('$')) {
      enriched.estimated_value = `$${enriched.estimated_value}`;
    }

    // Format property size if needed
    if (enriched.property_size && !enriched.property_size.includes('sq ft')) {
      enriched.property_size = `${enriched.property_size} sq ft`;
    }

    return enriched;
  }

  /**
   * Sanitize data to prevent injection attacks
   */
  private sanitizeData(leadData: Partial<LeadData>): Record<string, string> {
    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(leadData)) {
      if (value === undefined || value === null) {
        sanitized[key] = '';
        continue;
      }

      // Convert to string and sanitize
      let sanitizedValue = String(value);

      // Remove potential script injection attempts
      sanitizedValue = sanitizedValue.replace(/<script[^>]*>.*?<\/script>/gi, '');
      sanitizedValue = sanitizedValue.replace(/<[^>]+>/g, ''); // Remove HTML tags

      // Remove special characters that could break conversation flow
      sanitizedValue = sanitizedValue.replace(/[^\w\s,.\-$#&']/g, '');

      // Trim whitespace
      sanitizedValue = sanitizedValue.trim();

      sanitized[key] = sanitizedValue;
    }

    return sanitized;
  }

  /**
   * Replace template variables with actual data
   */
  private replaceVariables(
    template: string,
    data: Record<string, string>,
    missingVars: string[]
  ): string {
    let result = template;

    // Find all variables in template: {{variable_name}}
    const variablePattern = /\{\{(\w+)\}\}/g;
    const matches = template.matchAll(variablePattern);

    for (const match of matches) {
      const fullMatch = match[0]; // {{variable_name}}
      const variableName = match[1]; // variable_name

      if (data[variableName]) {
        result = result.replace(fullMatch, data[variableName]);
      } else {
        // Variable not found - use fallback
        const fallback = this.getFallback(variableName);
        result = result.replace(fullMatch, fallback);

        if (!missingVars.includes(variableName)) {
          missingVars.push(variableName);
        }
      }
    }

    return result;
  }

  /**
   * Get fallback value for missing variables
   */
  private getFallback(variableName: string): string {
    const fallbacks: Record<string, string> = {
      homeowner_first_name: 'the homeowner',
      homeowner_last_name: '',
      property_address_street: 'your property',
      property_city: 'the area',
      property_state: '',
      estimated_value: 'fair market value',
      property_size: 'the property',
      years_owned: 'a while',
      bedrooms: 'several',
      bathrooms: 'multiple'
    };

    return fallbacks[variableName] || '[DATA UNAVAILABLE]';
  }

  /**
   * Validate output length (ElevenLabs limits)
   */
  private validateOutputLength(firstMessage: string, systemPrompt: string): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // ElevenLabs first message recommended limit: 500 characters
    if (firstMessage.length > 500) {
      warnings.push(`First message is ${firstMessage.length} characters (recommended: <500)`);
    }

    // System prompt recommended limit: 10,000 characters
    if (systemPrompt.length > 10000) {
      warnings.push(`System prompt is ${systemPrompt.length} characters (recommended: <10,000)`);
    }

    return {
      valid: warnings.length === 0,
      warnings
    };
  }

  /**
   * Helper: Extract all variables from a template
   */
  public extractVariables(template: string): string[] {
    const variablePattern = /\{\{(\w+)\}\}/g;
    const matches = template.matchAll(variablePattern);
    return Array.from(matches).map(match => match[1]);
  }

  /**
   * Helper: Validate a template has all required variables
   */
  public validateTemplate(template: string): { valid: boolean; missing: string[] } {
    const foundVariables = this.extractVariables(template);
    const missing = this.requiredVariables.filter(req => !foundVariables.includes(req));

    return {
      valid: missing.length === 0,
      missing
    };
  }
}

/**
 * Default Templates
 */
export const DEFAULT_FIRST_MESSAGE_TEMPLATE = `Hi, is this {{homeowner_first_name}} {{homeowner_last_name}}? Oh hey, it's just Sarah with Team Price Homes. I'm holding some property information here on {{property_address_street}} in {{property_city}}, and I was wondering if you could possibly, um... help me out for a moment?

Well, and I'm not quite sure if you're the right person I should be talking to, but I called because we're working with some cash buyers who are specifically looking at properties in kind of that three-block area where you're at, and there might be something that could potentially benefit you or, you know, at least be helpful information to have. Who would be the right person to have a brief conversation with about that?`;

export const DEFAULT_SYSTEM_PROMPT_TEMPLATE = `You are Sarah, a professional real estate acquisition specialist with Team Price Homes. You are calling {{homeowner_first_name}} {{homeowner_last_name}} about their property at {{property_address_street}} in {{property_city}}, {{property_state}}.

## Property Context
- Address: {{property_full_address}}
- Estimated Value: {{estimated_value}}
- Property Size: {{property_size}}
- Time Owned: {{years_owned}} years

## Your Goal
Have a natural, consultative conversation to understand if this homeowner might benefit from a cash offer on their property. You are genuinely trying to help, not just make a sale.

## Communication Style
- Warm, professional, genuinely caring
- Use natural hesitations: "um," "uh," "like," "you know"
- Keep responses brief: 2-3 sentences typically
- Ask permission-based questions: "Would it be okay if I asked..."
- Use neutral language: "possible," "could," "might" (NEVER "you ARE" or "this WILL")

## Key Rules
1. ALWAYS use the homeowner's first name: {{homeowner_first_name}}
2. Reference their specific property: {{property_address_street}}
3. Never sound scripted or robotic
4. If they have an objection, acknowledge and explore with curiosity
5. If they're not interested, respectfully disengage

## TCPA Compliance
- This call has verified written consent
- Homeowner is NOT on Do Not Call list
- Respect any request to be added to internal DNC
- End call immediately if requested

Remember: You're a helpful consultant, not a pushy salesperson. Build trust first.`;

// Export singleton instance
export const variableInjectionService = new VariableInjectionService();
