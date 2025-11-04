/**
 * Variable Injection System - Basic Usage Examples
 *
 * Copy and adapt these examples for your implementation.
 */

import {
  variableInjectionService,
  LeadData,
  DEFAULT_FIRST_MESSAGE_TEMPLATE,
  DEFAULT_SYSTEM_PROMPT_TEMPLATE
} from '../variable-injection';
import { TwilioElevenLabsService } from '../integrations/twilio-elevenlabs';
import { ElevenLabsDirectService } from '../integrations/elevenlabs-direct';

// ============================================================================
// EXAMPLE 1: Basic Variable Injection
// ============================================================================

export async function example1_BasicInjection() {
  console.log('=== Example 1: Basic Variable Injection ===\n');

  const leadData: LeadData = {
    lead_id: 'lead_001',
    homeowner_first_name: 'Sarah',
    homeowner_last_name: 'Johnson',
    phone_number: '+19725551234',
    property_address_street: '456 Oak Avenue',
    property_city: 'Dallas',
    property_state: 'TX',
    has_consent: true,
    on_dnc_list: false
  };

  const result = variableInjectionService.injectVariables(
    DEFAULT_FIRST_MESSAGE_TEMPLATE,
    DEFAULT_SYSTEM_PROMPT_TEMPLATE,
    leadData
  );

  if (result.success) {
    console.log('✓ Injection successful!\n');
    console.log('First Message:');
    console.log(result.first_message);
    console.log('\nSystem Prompt:');
    console.log(result.system_prompt.substring(0, 200) + '...');
  } else {
    console.error('✗ Injection failed:', result.errors);
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

// ============================================================================
// EXAMPLE 2: Custom Template
// ============================================================================

export async function example2_CustomTemplate() {
  console.log('=== Example 2: Custom Template ===\n');

  // Define your own custom template
  const customFirstMessage = `Hi {{homeowner_first_name}}, this is Sarah from Team Price Homes.
I wanted to reach out specifically about {{property_address_street}}.
We have a cash buyer interested in properties in {{property_city}}.
Is this a good time to talk?`;

  const customSystemPrompt = `You are Sarah calling {{homeowner_first_name}} {{homeowner_last_name}}.
Property: {{property_address_street}}, {{property_city}}, {{property_state}}
Be warm, professional, and helpful. Keep responses under 3 sentences.`;

  const leadData: LeadData = {
    lead_id: 'lead_002',
    homeowner_first_name: 'Michael',
    homeowner_last_name: 'Chen',
    phone_number: '+14155551234',
    property_address_street: '123 Elm Street',
    property_city: 'Austin',
    property_state: 'TX',
    has_consent: true,
    on_dnc_list: false
  };

  const result = variableInjectionService.injectVariables(
    customFirstMessage,
    customSystemPrompt,
    leadData
  );

  if (result.success) {
    console.log('✓ Custom template injection successful!\n');
    console.log(result.first_message);
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

// ============================================================================
// EXAMPLE 3: Complete Lead Data (All Optional Fields)
// ============================================================================

export async function example3_CompleteLeadData() {
  console.log('=== Example 3: Complete Lead Data ===\n');

  const completeLeadData: LeadData = {
    // Required fields
    lead_id: 'lead_003',
    homeowner_first_name: 'Jennifer',
    homeowner_last_name: 'Martinez',
    phone_number: '+13105551234',
    property_address_street: '789 Maple Drive',
    property_city: 'Houston',
    property_state: 'TX',
    has_consent: true,
    on_dnc_list: false,

    // Optional fields
    email: 'jennifer@example.com',
    property_zip: '77001',
    estimated_value: '$385,000',
    property_size: '2,800',
    bedrooms: 4,
    bathrooms: 2.5,
    year_built: 2005,
    years_owned: '15',
    property_type: 'single_family',
    lead_source: 'zillow',
    motivation_level: 'high',
    situation_type: 'downsizing',
    consent_date: new Date('2024-10-15'),
    last_contact_date: new Date('2024-10-20')
  };

  const result = variableInjectionService.injectVariables(
    DEFAULT_FIRST_MESSAGE_TEMPLATE,
    DEFAULT_SYSTEM_PROMPT_TEMPLATE,
    completeLeadData
  );

  console.log('✓ Processed complete lead data\n');
  console.log('Success:', result.success);
  console.log('Warnings:', result.warnings.length > 0 ? result.warnings : 'None');
  console.log('Missing Variables:', result.missing_variables.length > 0 ? result.missing_variables : 'None');

  console.log('\n' + '='.repeat(80) + '\n');
}

// ============================================================================
// EXAMPLE 4: TCPA Compliance Checks
// ============================================================================

export async function example4_ComplianceChecks() {
  console.log('=== Example 4: TCPA Compliance Checks ===\n');

  // Test Case 1: No consent
  console.log('Test 1: Lead without consent');
  const noConsentLead: Partial<LeadData> = {
    lead_id: 'lead_004',
    homeowner_first_name: 'John',
    homeowner_last_name: 'Doe',
    phone_number: '+12145551234',
    property_address_street: '100 Test Street',
    property_city: 'Dallas',
    property_state: 'TX',
    has_consent: false, // No consent!
    on_dnc_list: false
  };

  let result = variableInjectionService.injectVariables('', '', noConsentLead);
  console.log('Result:', result.success ? 'PASS' : 'BLOCKED ✓');
  console.log('Errors:', result.errors);
  console.log();

  // Test Case 2: On DNC list
  console.log('Test 2: Lead on DNC list');
  const dncLead: Partial<LeadData> = {
    lead_id: 'lead_005',
    homeowner_first_name: 'Jane',
    homeowner_last_name: 'Smith',
    phone_number: '+12145551235',
    property_address_street: '200 Test Avenue',
    property_city: 'Dallas',
    property_state: 'TX',
    has_consent: true,
    on_dnc_list: true // On DNC!
  };

  result = variableInjectionService.injectVariables('', '', dncLead);
  console.log('Result:', result.success ? 'PASS' : 'BLOCKED ✓');
  console.log('Errors:', result.errors);
  console.log();

  // Test Case 3: Valid lead
  console.log('Test 3: Valid compliant lead');
  const validLead: Partial<LeadData> = {
    lead_id: 'lead_006',
    homeowner_first_name: 'Robert',
    homeowner_last_name: 'Williams',
    phone_number: '+12145551236',
    property_address_street: '300 Test Boulevard',
    property_city: 'Dallas',
    property_state: 'TX',
    has_consent: true,
    on_dnc_list: false,
    consent_date: new Date()
  };

  result = variableInjectionService.injectVariables('Hi {{homeowner_first_name}}', '', validLead);
  console.log('Result:', result.success ? 'ALLOWED ✓' : 'BLOCKED');
  console.log('Errors:', result.errors.length > 0 ? result.errors : 'None');

  console.log('\n' + '='.repeat(80) + '\n');
}

// ============================================================================
// EXAMPLE 5: Twilio Integration (End-to-End)
// ============================================================================

export async function example5_TwilioIntegration() {
  console.log('=== Example 5: Twilio Integration ===\n');

  // Initialize Twilio service
  const twilioService = new TwilioElevenLabsService({
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || 'ACxxxxxxxxxxxxx',
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || 'your_auth_token',
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '+19725551234',
    elevenlabsAgentId: process.env.ELEVENLABS_AGENT_ID || 'agent_xxxxxxxxxxxxx',
    webhookBaseUrl: process.env.WEBHOOK_BASE_URL || 'https://yourdomain.com'
  });

  const leadData: LeadData = {
    lead_id: 'lead_007',
    homeowner_first_name: 'Emily',
    homeowner_last_name: 'Davis',
    phone_number: '+14085551234',
    property_address_street: '555 Silicon Valley Road',
    property_city: 'San Jose',
    property_state: 'CA',
    has_consent: true,
    on_dnc_list: false,
    estimated_value: '$950,000',
    property_size: '2,200',
    years_owned: '8',
    motivation_level: 'medium',
    consent_date: new Date()
  };

  console.log('Initiating call to Emily Davis...');

  // Make the call
  const callResult = await twilioService.initiateCall(leadData);

  if (callResult.success) {
    console.log('✓ Call initiated successfully!');
    console.log('Call SID:', callResult.call_sid);
    if (callResult.warnings && callResult.warnings.length > 0) {
      console.log('Warnings:', callResult.warnings);
    }
  } else {
    console.error('✗ Call failed:', callResult.error);
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

// ============================================================================
// EXAMPLE 6: Direct ElevenLabs API Integration
// ============================================================================

export async function example6_DirectElevenLabsAPI() {
  console.log('=== Example 6: Direct ElevenLabs API ===\n');

  // Initialize ElevenLabs service
  const elevenLabsService = new ElevenLabsDirectService({
    apiKey: process.env.ELEVENLABS_API_KEY || 'sk_xxxxxxxxxxxxx',
    agentId: process.env.ELEVENLABS_AGENT_ID || 'agent_xxxxxxxxxxxxx'
  });

  const leadData: LeadData = {
    lead_id: 'lead_008',
    homeowner_first_name: 'David',
    homeowner_last_name: 'Brown',
    phone_number: '+13035551234',
    property_address_street: '777 Mountain View Drive',
    property_city: 'Denver',
    property_state: 'CO',
    has_consent: true,
    on_dnc_list: false,
    estimated_value: '$625,000',
    property_size: '3,500',
    situation_type: 'inherited_property',
    consent_date: new Date()
  };

  console.log('Creating ElevenLabs session for David Brown...');

  // Create session
  const sessionResult = await elevenLabsService.createSession(leadData);

  if (sessionResult.success && sessionResult.session) {
    console.log('✓ Session created successfully!');
    console.log('Session ID:', sessionResult.session.session_id);
    console.log('WebSocket URL:', sessionResult.session.websocket_url);

    // In a real implementation, you would:
    // 1. Connect to the WebSocket
    // 2. Stream audio bidirectionally
    // 3. Wait for conversation to complete
    // 4. Fetch transcript and analysis

    console.log('\nYou can now:');
    console.log('1. Connect to WebSocket for real-time audio');
    console.log('2. Get transcript: elevenLabsService.getTranscript(sessionId)');
    console.log('3. Get analysis: elevenLabsService.getAnalysis(sessionId)');
  } else {
    console.error('✗ Session creation failed:', sessionResult.error);
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

// ============================================================================
// EXAMPLE 7: Batch Processing Multiple Leads
// ============================================================================

export async function example7_BatchProcessing() {
  console.log('=== Example 7: Batch Processing ===\n');

  const leads: LeadData[] = [
    {
      lead_id: 'lead_batch_1',
      homeowner_first_name: 'Alice',
      homeowner_last_name: 'Wilson',
      phone_number: '+12125551001',
      property_address_street: '100 Broadway',
      property_city: 'New York',
      property_state: 'NY',
      has_consent: true,
      on_dnc_list: false
    },
    {
      lead_id: 'lead_batch_2',
      homeowner_first_name: 'Bob',
      homeowner_last_name: 'Taylor',
      phone_number: '+13105551002',
      property_address_street: '200 Sunset Blvd',
      property_city: 'Los Angeles',
      property_state: 'CA',
      has_consent: true,
      on_dnc_list: false
    },
    {
      lead_id: 'lead_batch_3',
      homeowner_first_name: 'Carol',
      homeowner_last_name: 'Anderson',
      phone_number: '+17735551003',
      property_address_street: '300 Michigan Avenue',
      property_city: 'Chicago',
      property_state: 'IL',
      has_consent: true,
      on_dnc_list: false
    }
  ];

  console.log(`Processing ${leads.length} leads in parallel...\n`);

  // Process all leads in parallel
  const results = await Promise.allSettled(
    leads.map(async (leadData) => {
      const injectionResult = variableInjectionService.injectVariables(
        DEFAULT_FIRST_MESSAGE_TEMPLATE,
        DEFAULT_SYSTEM_PROMPT_TEMPLATE,
        leadData
      );

      return {
        lead_id: leadData.lead_id,
        homeowner_name: `${leadData.homeowner_first_name} ${leadData.homeowner_last_name}`,
        success: injectionResult.success,
        errors: injectionResult.errors,
        warnings: injectionResult.warnings
      };
    })
  );

  // Display results
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const data = result.value;
      console.log(`Lead ${index + 1}: ${data.homeowner_name}`);
      console.log(`  Status: ${data.success ? '✓ Ready' : '✗ Blocked'}`);
      if (data.errors.length > 0) {
        console.log(`  Errors: ${data.errors.join(', ')}`);
      }
      if (data.warnings.length > 0) {
        console.log(`  Warnings: ${data.warnings.join(', ')}`);
      }
    } else {
      console.log(`Lead ${index + 1}: ✗ Processing failed`);
      console.log(`  Error: ${result.reason}`);
    }
    console.log();
  });

  console.log('='.repeat(80) + '\n');
}

// ============================================================================
// EXAMPLE 8: Error Handling Best Practices
// ============================================================================

export async function example8_ErrorHandling() {
  console.log('=== Example 8: Error Handling Best Practices ===\n');

  async function robustCallHandler(leadData: LeadData) {
    try {
      // Step 1: Validate and inject variables
      console.log('Step 1: Validating lead data...');
      const injectionResult = variableInjectionService.injectVariables(
        DEFAULT_FIRST_MESSAGE_TEMPLATE,
        DEFAULT_SYSTEM_PROMPT_TEMPLATE,
        leadData
      );

      // Step 2: Handle compliance errors (blocking)
      if (!injectionResult.success) {
        console.log('✗ Compliance check failed');
        console.log('Errors:', injectionResult.errors);

        // Log to database
        // await db.callLogs.create({
        //   lead_id: leadData.lead_id,
        //   status: 'blocked',
        //   reason: injectionResult.errors.join(', '),
        //   timestamp: new Date()
        // });

        return {
          success: false,
          reason: 'compliance_failure',
          details: injectionResult.errors
        };
      }

      // Step 3: Log warnings (non-blocking)
      if (injectionResult.warnings.length > 0) {
        console.log('⚠ Warnings detected (proceeding anyway):');
        injectionResult.warnings.forEach(w => console.log(`  - ${w}`));

        // Log warnings to database
        // await db.callWarnings.create({
        //   lead_id: leadData.lead_id,
        //   warnings: injectionResult.warnings,
        //   timestamp: new Date()
        // });
      }

      // Step 4: Initiate call
      console.log('Step 2: Initiating call...');
      const twilioService = new TwilioElevenLabsService({
        twilioAccountSid: process.env.TWILIO_ACCOUNT_SID!,
        twilioAuthToken: process.env.TWILIO_AUTH_TOKEN!,
        twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER!,
        elevenlabsAgentId: process.env.ELEVENLABS_AGENT_ID!,
        webhookBaseUrl: process.env.WEBHOOK_BASE_URL!
      });

      const callResult = await twilioService.initiateCall(leadData);

      if (!callResult.success) {
        console.log('✗ Call initiation failed');
        console.log('Error:', callResult.error);

        // Log to database
        // await db.callLogs.create({
        //   lead_id: leadData.lead_id,
        //   status: 'failed',
        //   reason: callResult.error,
        //   timestamp: new Date()
        // });

        return {
          success: false,
          reason: 'call_initiation_failed',
          details: [callResult.error]
        };
      }

      // Step 5: Success - log call
      console.log('✓ Call initiated successfully');
      console.log('Call SID:', callResult.call_sid);

      // Log success to database
      // await db.callLogs.create({
      //   lead_id: leadData.lead_id,
      //   call_sid: callResult.call_sid,
      //   status: 'initiated',
      //   timestamp: new Date()
      // });

      return {
        success: true,
        call_sid: callResult.call_sid,
        warnings: injectionResult.warnings
      };

    } catch (error: any) {
      console.error('✗ Unexpected error:', error.message);

      // Log unexpected errors
      // await db.errorLogs.create({
      //   lead_id: leadData.lead_id,
      //   error: error.message,
      //   stack: error.stack,
      //   timestamp: new Date()
      // });

      return {
        success: false,
        reason: 'unexpected_error',
        details: [error.message]
      };
    }
  }

  // Test with valid lead
  const leadData: LeadData = {
    lead_id: 'lead_009',
    homeowner_first_name: 'Test',
    homeowner_last_name: 'User',
    phone_number: '+19995551234',
    property_address_street: '999 Test Street',
    property_city: 'Austin',
    property_state: 'TX',
    has_consent: true,
    on_dnc_list: false
  };

  const result = await robustCallHandler(leadData);
  console.log('\nFinal Result:', result);

  console.log('\n' + '='.repeat(80) + '\n');
}

// ============================================================================
// Run All Examples
// ============================================================================

export async function runAllExamples() {
  console.log('\n' + '='.repeat(80));
  console.log('VARIABLE INJECTION SYSTEM - USAGE EXAMPLES');
  console.log('='.repeat(80) + '\n');

  await example1_BasicInjection();
  await example2_CustomTemplate();
  await example3_CompleteLeadData();
  await example4_ComplianceChecks();
  // await example5_TwilioIntegration();         // Requires Twilio credentials
  // await example6_DirectElevenLabsAPI();       // Requires ElevenLabs credentials
  await example7_BatchProcessing();
  // await example8_ErrorHandling();             // Requires service credentials

  console.log('All examples completed!');
  console.log('\nTo run examples that require credentials, set environment variables:');
  console.log('  TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER');
  console.log('  ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID');
  console.log('  WEBHOOK_BASE_URL');
}

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
