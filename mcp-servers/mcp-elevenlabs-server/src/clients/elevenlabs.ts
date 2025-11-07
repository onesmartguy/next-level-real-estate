import { ElevenLabsClient as ElevenLabsSDK } from '@elevenlabs/elevenlabs-js'
import type {
  ElevenLabsClient,
  ConversationConfig,
  ConversationResponse,
  ConversationDetails,
  Voice,
  TextToSpeechConfig,
  AgentConfig,
  AgentResponse,
  AgentDetails,
} from '../types/index.js'

/**
 * Configuration for ElevenLabs client
 */
export interface ElevenLabsClientConfig {
  apiKey: string
  timeout?: number
}

/**
 * Create an ElevenLabs client instance with health checks and error handling
 */
export function createElevenLabsClient(config: ElevenLabsClientConfig): ElevenLabsClient {
  const sdk = new ElevenLabsSDK({
    apiKey: config.apiKey,
  })

  const timeout = config.timeout || 60000

  return {
    async healthCheck(): Promise<boolean> {
      try {
        // Try to list voices as a health check
        await sdk.voices.getAll()
        return true
      } catch (error) {
        console.error('[ElevenLabs] Health check failed:', error)
        return false
      }
    },

    async createConversation(conversationConfig: ConversationConfig): Promise<ConversationResponse> {
      try {
        // Note: The actual API endpoint may vary based on ElevenLabs Conversational AI API
        // This is a placeholder implementation based on the pattern
        const response = await fetch('https://api.elevenlabs.io/v1/convai/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': config.apiKey,
          },
          body: JSON.stringify({
            agent_id: conversationConfig.agentId,
            context: conversationConfig.context,
            language: conversationConfig.language,
            voice_id: conversationConfig.voiceId,
            max_duration: conversationConfig.maxDuration,
            record_conversation: conversationConfig.recordConversation,
          }),
          signal: AbortSignal.timeout(timeout),
        })

        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${response.statusText}`)
        }

        const data = await response.json()
        return {
          conversationId: data.conversation_id,
          agentId: data.agent_id,
          status: data.status,
          startedAt: data.started_at,
        }
      } catch (error) {
        console.error('[ElevenLabs] Create conversation error:', error)
        throw error
      }
    },

    async getConversation(conversationId: string): Promise<ConversationDetails> {
      try {
        const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
          headers: {
            'xi-api-key': config.apiKey,
          },
          signal: AbortSignal.timeout(timeout),
        })

        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${response.statusText}`)
        }

        const data = await response.json()
        return {
          conversationId: data.conversation_id,
          agentId: data.agent_id,
          status: data.status,
          startedAt: data.started_at,
          endedAt: data.ended_at,
          duration: data.duration,
          transcript: data.transcript,
          sentiment: data.sentiment,
          recordingUrl: data.recording_url,
          metadata: data.metadata,
        }
      } catch (error) {
        console.error('[ElevenLabs] Get conversation error:', error)
        throw error
      }
    },

    async listConversations(): Promise<ConversationDetails[]> {
      try {
        const response = await fetch('https://api.elevenlabs.io/v1/convai/conversations', {
          headers: {
            'xi-api-key': config.apiKey,
          },
          signal: AbortSignal.timeout(timeout),
        })

        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${response.statusText}`)
        }

        const data = await response.json()
        return data.conversations || []
      } catch (error) {
        console.error('[ElevenLabs] List conversations error:', error)
        throw error
      }
    },

    async listVoices(): Promise<Voice[]> {
      try {
        const voices = await sdk.voices.getAll()
        return voices.voices.map((v: any) => ({
          voiceId: v.voice_id,
          name: v.name,
          category: v.category,
          description: v.description,
          labels: v.labels,
          previewUrl: v.preview_url,
          availableForTts: v.available_for_tts,
          settings: v.settings,
        }))
      } catch (error) {
        console.error('[ElevenLabs] List voices error:', error)
        throw error
      }
    },

    async getVoice(voiceId: string): Promise<Voice> {
      try {
        const voice = await sdk.voices.get(voiceId)
        return {
          voiceId: voice.voice_id,
          name: voice.name,
          category: voice.category,
          description: voice.description,
          labels: voice.labels,
          previewUrl: voice.preview_url,
          availableForTts: voice.available_for_tts,
          settings: voice.settings,
        }
      } catch (error) {
        console.error('[ElevenLabs] Get voice error:', error)
        throw error
      }
    },

    async textToSpeech(ttsConfig: TextToSpeechConfig): Promise<Buffer> {
      try {
        const audio = await sdk.textToSpeech.convert(ttsConfig.voiceId, {
          text: ttsConfig.text,
          model_id: ttsConfig.modelId || 'eleven_multilingual_v2',
          voice_settings: ttsConfig.voiceSettings,
          output_format: ttsConfig.outputFormat,
        })

        // Convert stream to buffer
        const chunks: Uint8Array[] = []
        for await (const chunk of audio) {
          chunks.push(chunk)
        }
        return Buffer.concat(chunks)
      } catch (error) {
        console.error('[ElevenLabs] Text-to-speech error:', error)
        throw error
      }
    },

    async textToSpeechStream(ttsConfig: TextToSpeechConfig): Promise<ReadableStream> {
      try {
        const audioStream = await sdk.textToSpeech.convertAsStream(ttsConfig.voiceId, {
          text: ttsConfig.text,
          model_id: ttsConfig.modelId || 'eleven_multilingual_v2',
          voice_settings: ttsConfig.voiceSettings,
          output_format: ttsConfig.outputFormat,
        })

        return audioStream as unknown as ReadableStream
      } catch (error) {
        console.error('[ElevenLabs] Text-to-speech stream error:', error)
        throw error
      }
    },

    async createAgent(agentConfig: AgentConfig): Promise<AgentResponse> {
      try {
        const response = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': config.apiKey,
          },
          body: JSON.stringify({
            name: agentConfig.name,
            voice_id: agentConfig.voiceId,
            model_id: agentConfig.modelId || 'eleven_flash_v2_5',
            greeting: agentConfig.greeting,
            first_message: agentConfig.firstMessage,
            system_prompt: agentConfig.systemPrompt,
            conversation_goal: agentConfig.conversationGoal,
            interruption_sensitivity: agentConfig.interruptionSensitivity,
            response_latency: agentConfig.responseLatency,
            language: agentConfig.language,
            supported_languages: agentConfig.supportedLanguages,
            auto_detect_language: agentConfig.autoDetectLanguage,
            knowledge_base: agentConfig.knowledgeBase,
            context_documents: agentConfig.contextDocuments,
            tcpa_compliance: agentConfig.tcpaCompliance,
            recording_consent: agentConfig.recordingConsent,
            tags: agentConfig.tags,
            description: agentConfig.description,
          }),
          signal: AbortSignal.timeout(timeout),
        })

        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${response.statusText}`)
        }

        const data = await response.json()
        return {
          agentId: data.agent_id,
          name: data.name,
          status: data.status,
          createdAt: data.created_at,
        }
      } catch (error) {
        console.error('[ElevenLabs] Create agent error:', error)
        throw error
      }
    },

    async getAgent(agentId: string): Promise<AgentDetails> {
      try {
        const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
          headers: {
            'xi-api-key': config.apiKey,
          },
          signal: AbortSignal.timeout(timeout),
        })

        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${response.statusText}`)
        }

        const data = await response.json()
        return data
      } catch (error) {
        console.error('[ElevenLabs] Get agent error:', error)
        throw error
      }
    },

    async listAgents(): Promise<AgentDetails[]> {
      try {
        const response = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
          headers: {
            'xi-api-key': config.apiKey,
          },
          signal: AbortSignal.timeout(timeout),
        })

        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${response.statusText}`)
        }

        const data = await response.json()
        return data.agents || []
      } catch (error) {
        console.error('[ElevenLabs] List agents error:', error)
        throw error
      }
    },

    async updateAgent(agentId: string, agentConfig: Partial<AgentConfig>): Promise<AgentResponse> {
      try {
        const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': config.apiKey,
          },
          body: JSON.stringify(agentConfig),
          signal: AbortSignal.timeout(timeout),
        })

        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${response.statusText}`)
        }

        const data = await response.json()
        return {
          agentId: data.agent_id,
          name: data.name,
          status: data.status,
          createdAt: data.created_at,
        }
      } catch (error) {
        console.error('[ElevenLabs] Update agent error:', error)
        throw error
      }
    },

    async deleteAgent(agentId: string): Promise<void> {
      try {
        const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
          method: 'DELETE',
          headers: {
            'xi-api-key': config.apiKey,
          },
          signal: AbortSignal.timeout(timeout),
        })

        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${response.statusText}`)
        }
      } catch (error) {
        console.error('[ElevenLabs] Delete agent error:', error)
        throw error
      }
    },
  }
}
