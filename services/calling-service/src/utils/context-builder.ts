import { Lead, PropertyInfo } from '@next-level-real-estate/shared/models';

/**
 * Context Builder Utility
 *
 * Builds rich context objects for AI conversations
 */
export class ContextBuilder {
  /**
   * Build complete context for a call
   */
  static buildCallContext(lead: Lead, additionalContext?: Record<string, any>): Record<string, any> {
    return {
      lead: this.buildLeadContext(lead),
      property: this.buildPropertyContext(lead.property),
      strategy: this.buildStrategyContext(lead),
      timestamp: new Date().toISOString(),
      ...additionalContext,
    };
  }

  /**
   * Build lead-specific context
   */
  private static buildLeadContext(lead: Lead): Record<string, any> {
    return {
      id: lead.leadId,
      name: {
        first: lead.contact.firstName,
        last: lead.contact.lastName,
        full: `${lead.contact.firstName} ${lead.contact.lastName}`,
      },
      contact: {
        phone: lead.contact.phone,
        email: lead.contact.email,
        preferredMethod: lead.contact.preferredContactMethod,
        timezone: lead.contact.timezone,
      },
      source: {
        source: lead.source.source,
        campaign: lead.source.campaign,
        receivedAt: lead.source.receivedAt,
      },
      qualification: {
        score: lead.qualification.qualificationScore,
        status: lead.qualification.qualificationStatus,
        motivation: lead.qualification.motivationLevel,
        timeline: lead.qualification.timeline,
        situation: lead.qualification.sellerSituation,
        reasonForSelling: lead.qualification.reasonForSelling,
      },
      history: {
        callAttempts: lead.callAttempts.length,
        lastContacted: lead.lastContactedAt,
        status: lead.status,
        stage: lead.stage,
      },
    };
  }

  /**
   * Build property-specific context
   */
  private static buildPropertyContext(property?: PropertyInfo): Record<string, any> | null {
    if (!property) {
      return null;
    }

    return {
      address: {
        full: property.address,
        city: property.city,
        state: property.state,
        zipCode: property.zipCode,
      },
      details: {
        type: property.propertyType,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        squareFeet: property.squareFeet,
        lotSize: property.lotSize,
        yearBuilt: property.yearBuilt,
        condition: property.condition,
      },
      financial: {
        estimatedValue: property.estimatedValue,
        mortgageBalance: property.mortgageBalance,
        estimatedEquity: property.estimatedEquity,
        equityPercentage: this.calculateEquityPercentage(
          property.estimatedValue,
          property.mortgageBalance
        ),
      },
    };
  }

  /**
   * Build strategy-specific context
   */
  private static buildStrategyContext(lead: Lead): Record<string, any> {
    const strategy = {
      approach: this.determineApproach(lead),
      urgency: this.determineUrgency(lead),
      qualificationFocus: this.determineQualificationFocus(lead),
      talkingPoints: this.generateTalkingPoints(lead),
      objectionHandling: this.generateObjectionHandling(lead),
    };

    return strategy;
  }

  /**
   * Determine conversation approach
   */
  private static determineApproach(lead: Lead): string {
    // High motivation = direct approach
    if (lead.qualification.motivationLevel === 'high') {
      return 'direct_solution_focused';
    }

    // Has property info = consultative
    if (lead.property) {
      return 'consultative_needs_assessment';
    }

    // Default = exploratory
    return 'exploratory_relationship_building';
  }

  /**
   * Determine urgency level
   */
  private static determineUrgency(lead: Lead): 'high' | 'medium' | 'low' {
    if (lead.qualification.timeline === 'immediate') {
      return 'high';
    }

    if (lead.qualification.timeline === 'within_30_days') {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Determine what to focus on during qualification
   */
  private static determineQualificationFocus(lead: Lead): string[] {
    const focus: string[] = [];

    // Missing property info
    if (!lead.property) {
      focus.push('property_details');
    }

    // Unknown motivation
    if (lead.qualification.motivationLevel === 'unknown') {
      focus.push('seller_motivation');
    }

    // No timeline
    if (!lead.qualification.timeline) {
      focus.push('timeline');
    }

    // Unknown reason for selling
    if (!lead.qualification.reasonForSelling) {
      focus.push('reason_for_selling');
    }

    // Missing financial info
    if (lead.property && !lead.property.estimatedValue) {
      focus.push('property_value');
    }

    if (lead.property && !lead.property.mortgageBalance) {
      focus.push('mortgage_balance');
    }

    return focus.length > 0 ? focus : ['general_qualification'];
  }

  /**
   * Generate talking points based on lead data
   */
  private static generateTalkingPoints(lead: Lead): string[] {
    const points: string[] = [];

    // Motivation-based points
    if (lead.qualification.motivationLevel === 'high') {
      points.push('Fast cash offer available');
      points.push('Can close in as little as 7 days');
      points.push('No repairs needed - we buy as-is');
    }

    // Timeline-based points
    if (lead.qualification.timeline === 'immediate') {
      points.push('We specialize in quick closings');
      points.push('Can make an offer within 24 hours');
    }

    // Property condition-based points
    if (lead.property?.condition === 'poor' || lead.property?.condition === 'fair') {
      points.push('We buy properties in any condition');
      points.push('Save thousands on repairs and renovations');
    }

    // Equity-based points
    const equityPercent = this.calculateEquityPercentage(
      lead.property?.estimatedValue,
      lead.property?.mortgageBalance
    );
    if (equityPercent && equityPercent > 20) {
      points.push('Great equity position - multiple options available');
    }

    return points;
  }

  /**
   * Generate objection handling strategies
   */
  private static generateObjectionHandling(lead: Lead): Record<string, string> {
    return {
      price_concern: 'We make competitive cash offers based on current market comps. Let me explain our process...',
      need_more_time: 'I understand. We can work with your timeline. When would be a better time to discuss this?',
      working_with_agent: 'That\'s great! We work with many agents. In fact, we can often close faster than traditional buyers...',
      not_sure_about_selling: 'I completely understand. Let\'s explore your situation and see if selling makes sense for you...',
      condition_concerns: 'We buy properties as-is. You won\'t need to make any repairs or improvements...',
      value_unknown: 'No problem. I can help you understand your property\'s value based on current market data...',
    };
  }

  /**
   * Calculate equity percentage
   */
  private static calculateEquityPercentage(
    estimatedValue?: number,
    mortgageBalance?: number
  ): number | null {
    if (!estimatedValue) {
      return null;
    }

    const balance = mortgageBalance || 0;
    const equity = estimatedValue - balance;

    return Math.round((equity / estimatedValue) * 100);
  }

  /**
   * Build minimal context for testing
   */
  static buildTestContext(
    firstName: string,
    lastName: string,
    propertyAddress?: string
  ): Record<string, any> {
    return {
      lead: {
        name: {
          first: firstName,
          last: lastName,
          full: `${firstName} ${lastName}`,
        },
      },
      property: propertyAddress
        ? {
            address: {
              full: propertyAddress,
            },
          }
        : null,
      strategy: {
        approach: 'exploratory_relationship_building',
        urgency: 'low',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
