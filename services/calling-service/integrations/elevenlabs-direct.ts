/**
 * Direct ElevenLabs API Integration with Variable Injection
 *
 * Handles direct integration with ElevenLabs Conversational AI API
 * without Twilio (for testing or alternative phone providers).
 */

import axios from 'axios';
import {
  variableInjectionService,
  LeadData,
  DEFAULT_FIRST_MESSAGE_TEMPLATE,
  DEFAULT_SYSTEM_PROMPT_TEMPLATE
} from '../variable-injection';

export interface ElevenLabsConfig {
  apiKey: string;
  agentId: string;
}

export interface ConversationSession {
  session_id: string;
  agent_id: string;
  websocket_url: string;
  created_at: string;
}

export interface SessionResult {
  success: boolean;
  session?: ConversationSession;
  error?: string;
  warnings?: string[];
}

/**
 * Direct ElevenLabs API Service
 */
export class ElevenLabsDirectService {
  private config: ElevenLabsConfig;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor(config: ElevenLabsConfig) {
    this.config = config;
  }

  /**
   * Create a conversation session with dynamic variable injection
   */
  public async createSession(leadData: LeadData): Promise<SessionResult> {
    try {
      // Step 1: Inject variables into templates
      const injectionResult = variableInjectionService.injectVariables(
        DEFAULT_FIRST_MESSAGE_TEMPLATE,
        DEFAULT_SYSTEM_PROMPT_TEMPLATE,
        leadData
      );

      // Check for compliance errors
      if (!injectionResult.success) {
        return {
          success: false,
          error: `Variable injection failed: ${injectionResult.errors.join(', ')}`
        };
      }

      // Step 2: Create session with ElevenLabs API
      const response = await axios.post(
        `${this.baseUrl}/convai/conversation`,
        {
          agent_id: this.config.agentId,
          first_message: injectionResult.first_message,
          override_agent_prompt: injectionResult.system_prompt,
          context: {
            lead_id: leadData.lead_id,
            lead_source: leadData.lead_source,
            motivation_level: leadData.motivation_level,
            situation_type: leadData.situation_type
          }
        },
        {
          headers: {
            'xi-api-key': this.config.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        session: response.data,
        warnings: injectionResult.warnings
      };

    } catch (error: any) {
      console.error('ElevenLabs session creation failed:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Unknown error'
      };
    }
  }

  /**
   * Get conversation transcript
   */
  public async getTranscript(sessionId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/convai/conversation/${sessionId}/transcript`,
        {
          headers: {
            'xi-api-key': this.config.apiKey
          }
        }
      );

      return {
        success: true,
        transcript: response.data
      };

    } catch (error: any) {
      console.error('Failed to get transcript:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Get conversation analysis (sentiment, intent, etc.)
   */
  public async getAnalysis(sessionId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/convai/conversation/${sessionId}/analysis`,
        {
          headers: {
            'xi-api-key': this.config.apiKey
          }
        }
      );

      return {
        success: true,
        analysis: response.data
      };

    } catch (error: any) {
      console.error('Failed to get analysis:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * List all agent configurations
   */
  public async listAgents(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/convai/agents`,
        {
          headers: {
            'xi-api-key': this.config.apiKey
          }
        }
      );

      return {
        success: true,
        agents: response.data
      };

    } catch (error: any) {
      console.error('Failed to list agents:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Update agent configuration (for testing different prompts)
   */
  public async updateAgent(
    agentId: string,
    updates: {
      name?: string;
      first_message?: string;
      system_prompt?: string;
      voice_id?: string;
      language?: string;
    }
  ): Promise<any> {
    try {
      const response = await axios.patch(
        `${this.baseUrl}/convai/agents/${agentId}`,
        updates,
        {
          headers: {
            'xi-api-key': this.config.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        agent: response.data
      };

    } catch (error: any) {
      console.error('Failed to update agent:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }
}

/**
 * WebSocket Client for Real-Time Conversation
 */
export class ElevenLabsWebSocketClient {
  private ws: WebSocket | null = null;
  private config: ElevenLabsConfig;

  constructor(config: ElevenLabsConfig) {
    this.config = config;
  }

  /**
   * Connect to ElevenLabs WebSocket for real-time conversation
   */
  public async connect(
    sessionId: string,
    onMessage: (data: any) => void,
    onError: (error: any) => void
  ): Promise<void> {
    const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation/${sessionId}?api_key=${this.config.apiKey}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError(error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
  }

  /**
   * Send audio data to ElevenLabs
   */
  public sendAudio(audioData: ArrayBuffer): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(audioData);
    } else {
      console.error('WebSocket not connected');
    }
  }

  /**
   * Close WebSocket connection
   */
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

/**
 * Example usage - Direct API
 */
export async function exampleDirectApiUsage() {
  // Initialize service
  const service = new ElevenLabsDirectService({
    apiKey: process.env.ELEVENLABS_API_KEY!,
    agentId: process.env.ELEVENLABS_AGENT_ID!
  });

  // Lead data
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
    years_owned: '12',
    property_type: 'single_family',

    lead_source: 'zillow',
    motivation_level: 'high',
    situation_type: 'inherited_property',

    has_consent: true,
    on_dnc_list: false,
    consent_date: new Date('2024-10-20')
  };

  // Create session
  const sessionResult = await service.createSession(leadData);

  if (sessionResult.success && sessionResult.session) {
    console.log('Session created:', sessionResult.session.session_id);
    console.log('WebSocket URL:', sessionResult.session.websocket_url);

    // Wait for conversation to complete (in real app, this would be event-driven)
    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute

    // Get transcript
    const transcriptResult = await service.getTranscript(sessionResult.session.session_id);
    if (transcriptResult.success) {
      console.log('Transcript:', transcriptResult.transcript);
    }

    // Get analysis
    const analysisResult = await service.getAnalysis(sessionResult.session.session_id);
    if (analysisResult.success) {
      console.log('Analysis:', analysisResult.analysis);
    }
  } else {
    console.error('Session creation failed:', sessionResult.error);
  }
}

/**
 * Example usage - WebSocket
 */
export async function exampleWebSocketUsage() {
  const service = new ElevenLabsDirectService({
    apiKey: process.env.ELEVENLABS_API_KEY!,
    agentId: process.env.ELEVENLABS_AGENT_ID!
  });

  // Create session first
  const leadData: LeadData = {
    lead_id: 'lead_12345',
    homeowner_first_name: 'Sarah',
    homeowner_last_name: 'Johnson',
    phone_number: '+19725551234',
    property_address_street: '123 Main Street',
    property_city: 'Dallas',
    property_state: 'TX',
    has_consent: true,
    on_dnc_list: false
  };

  const sessionResult = await service.createSession(leadData);

  if (sessionResult.success && sessionResult.session) {
    // Connect WebSocket
    const wsClient = new ElevenLabsWebSocketClient({
      apiKey: process.env.ELEVENLABS_API_KEY!,
      agentId: process.env.ELEVENLABS_AGENT_ID!
    });

    await wsClient.connect(
      sessionResult.session.session_id,
      (data) => {
        console.log('Received:', data);
        // Handle incoming audio/text
      },
      (error) => {
        console.error('Error:', error);
      }
    );

    // Send audio (from microphone, file, etc.)
    // wsClient.sendAudio(audioBuffer);
  }
}
