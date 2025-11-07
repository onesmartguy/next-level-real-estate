import type { Clients, ToolResult } from '../../types/index.js'

/**
 * Tool definition for listing voices
 */
export const listVoicesTool = {
  name: 'elevenlabs_list_voices',
  description: 'List all available ElevenLabs voices with categories and preview URLs (5000+ voices across 31 languages)',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Filter by voice category (e.g., professional, conversational, narrative)',
      },
      language: {
        type: 'string',
        description: 'Filter by language code (e.g., en, es, fr, de)',
      },
      availableForTts: {
        type: 'boolean',
        description: 'Only show voices available for text-to-speech',
        default: true,
      },
    },
  },
  handler: listVoices,
}

/**
 * Handler function for listing voices
 */
async function listVoices(args: any, clients: Clients): Promise<ToolResult> {
  try {
    console.error('[Tool] Listing voices')

    let voices = await clients.elevenlabs.listVoices()

    // Apply filters
    if (args.category) {
      voices = voices.filter(v => v.category === args.category)
    }

    if (args.language) {
      voices = voices.filter(v =>
        v.labels &&
        (v.labels.language === args.language || v.labels.accent?.startsWith(args.language))
      )
    }

    if (args.availableForTts !== false) {
      voices = voices.filter(v => v.availableForTts)
    }

    const output = [
      `Found ${voices.length} voice(s)`,
      ``,
    ]

    // Group by category if available
    const categories = new Map<string, typeof voices>()
    voices.forEach(voice => {
      const category = voice.category || 'Other'
      if (!categories.has(category)) {
        categories.set(category, [])
      }
      categories.get(category)!.push(voice)
    })

    categories.forEach((categoryVoices, category) => {
      output.push(`${category} (${categoryVoices.length}):`)
      categoryVoices.slice(0, 20).forEach(voice => {
        const labels = voice.labels
          ? Object.entries(voice.labels)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ')
          : ''

        output.push(`  • ${voice.name} (${voice.voiceId})`)
        if (labels) {
          output.push(`    ${labels}`)
        }
        if (voice.description) {
          output.push(`    ${voice.description}`)
        }
        if (voice.previewUrl) {
          output.push(`    Preview: ${voice.previewUrl}`)
        }
      })

      if (categoryVoices.length > 20) {
        output.push(`  ... and ${categoryVoices.length - 20} more`)
      }
      output.push('')
    })

    output.push(
      `Voice Selection Tips:`,
      `1. Use professional voices for business calls`,
      `2. Match voice characteristics to target audience`,
      `3. Test multiple voices with sample scripts`,
      `4. Consider accent and speaking style for authenticity`,
    )

    return {
      content: [
        { type: 'text', text: output.join('\n') },
        { type: 'text', text: JSON.stringify(voices, null, 2) },
      ],
      isError: false,
    }
  } catch (error) {
    console.error('[Tool] List voices error:', error)
    return {
      content: [
        {
          type: 'text',
          text: `Error listing voices: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    }
  }
}
