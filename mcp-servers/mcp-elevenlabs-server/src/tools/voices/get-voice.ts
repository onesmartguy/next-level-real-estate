import type { Clients, ToolResult } from '../../types/index.js'

/**
 * Tool definition for getting voice details
 */
export const getVoiceTool = {
  name: 'elevenlabs_get_voice',
  description: 'Get detailed information about a specific ElevenLabs voice including settings and preview',
  inputSchema: {
    type: 'object',
    properties: {
      voiceId: {
        type: 'string',
        description: 'ID of the voice to retrieve',
      },
    },
    required: ['voiceId'],
  },
  handler: getVoice,
}

/**
 * Handler function for getting voice details
 */
async function getVoice(args: any, clients: Clients): Promise<ToolResult> {
  try {
    console.error('[Tool] Retrieving voice:', args.voiceId)

    const voice = await clients.elevenlabs.getVoice(args.voiceId)

    const output = [
      `Voice Details:`,
      ``,
      `Name: ${voice.name}`,
      `ID: ${voice.voiceId}`,
      voice.category ? `Category: ${voice.category}` : '',
      voice.description ? `Description: ${voice.description}` : '',
      `Available for TTS: ${voice.availableForTts ? 'Yes' : 'No'}`,
      ``,
    ]

    if (voice.labels && Object.keys(voice.labels).length > 0) {
      output.push(`Labels:`)
      Object.entries(voice.labels).forEach(([key, value]) => {
        output.push(`- ${key}: ${value}`)
      })
      output.push('')
    }

    if (voice.settings) {
      output.push(`Default Settings:`)
      if (voice.settings.stability !== undefined) {
        output.push(`- Stability: ${voice.settings.stability}`)
      }
      if (voice.settings.similarityBoost !== undefined) {
        output.push(`- Similarity Boost: ${voice.settings.similarityBoost}`)
      }
      if (voice.settings.style !== undefined) {
        output.push(`- Style: ${voice.settings.style}`)
      }
      if (voice.settings.useSpeakerBoost !== undefined) {
        output.push(`- Speaker Boost: ${voice.settings.useSpeakerBoost ? 'Enabled' : 'Disabled'}`)
      }
      output.push('')
    }

    if (voice.previewUrl) {
      output.push(`Preview: ${voice.previewUrl}`, ``)
    }

    output.push(
      `Usage:`,
      `1. Use this voice ID when creating agents with elevenlabs_create_agent`,
      `2. Test the voice with the preview URL above`,
      `3. Adjust voice settings for optimal conversational quality`,
    )

    return {
      content: [
        { type: 'text', text: output.filter(Boolean).join('\n') },
        { type: 'text', text: JSON.stringify(voice, null, 2) },
      ],
      isError: false,
    }
  } catch (error) {
    console.error('[Tool] Get voice error:', error)
    return {
      content: [
        {
          type: 'text',
          text: `Error retrieving voice: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    }
  }
}
