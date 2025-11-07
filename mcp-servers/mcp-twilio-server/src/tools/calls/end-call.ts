import type { Clients } from '../../types/index.js'

export const endCallTool = {
  name: 'twilio_end_call',
  description: 'End an active Twilio call by updating its status to completed',
  inputSchema: {
    type: 'object',
    properties: {
      callSid: {
        type: 'string',
        description: 'Twilio call SID to end',
      },
    },
    required: ['callSid'],
  },
  handler: async (args: any, clients: Clients) => {
    try {
      await clients.twilio.endCall(args.callSid)

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Call ${args.callSid} ended successfully`,
            }, null, 2),
          },
        ],
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error ending call: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      }
    }
  },
}
