import type { Clients } from '../../types/index.js'

export const getCallStatusTool = {
  name: 'twilio_get_call_status',
  description: 'Retrieve the current status of a Twilio call including duration, timestamps, and pricing information',
  inputSchema: {
    type: 'object',
    properties: {
      callSid: {
        type: 'string',
        description: 'Twilio call SID to check status for',
      },
    },
    required: ['callSid'],
  },
  handler: async (args: any, clients: Clients) => {
    try {
      const status = await clients.twilio.getCallStatus(args.callSid)

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              status,
            }, null, 2),
          },
        ],
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error getting call status: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      }
    }
  },
}
