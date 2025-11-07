import type { Clients, CallConfig } from '../../types/index.js'

export const makeCallTool = {
  name: 'twilio_make_call',
  description: 'Initiate an outbound call using Twilio with ElevenLabs ConversationRelay. This creates an ElevenLabs conversation with the specified agent and context, then dials the phone number. The agent will speak with the person who answers.',
  inputSchema: {
    type: 'object',
    properties: {
      to: {
        type: 'string',
        description: 'Phone number to call in E.164 format (e.g., +19723363907)',
      },
      agentId: {
        type: 'string',
        description: 'ID of the ElevenLabs conversational agent to use for this call',
      },
      leadData: {
        type: 'object',
        description: 'Lead information to inject as context (name, email, phone, source, etc.)',
      },
      propertyInfo: {
        type: 'object',
        description: 'Property details to inject as context (address, price, features, etc.)',
      },
      strategyRules: {
        type: 'object',
        description: 'Real estate strategy rules to guide conversation (wholesale, fix-flip, etc.)',
      },
      maxDuration: {
        type: 'number',
        description: 'Maximum call duration in seconds (default: 60)',
      },
      recordCall: {
        type: 'boolean',
        description: 'Whether to record this call (default: false)',
      },
      statusCallbackUrl: {
        type: 'string',
        description: 'Webhook URL to receive call status updates',
      },
    },
    required: ['to', 'agentId'],
  },
  handler: async (args: any, clients: Clients) => {
    try {
      const callConfig: CallConfig = {
        to: args.to,
        agentId: args.agentId,
        context: {
          leadData: args.leadData,
          propertyInfo: args.propertyInfo,
          strategyRules: args.strategyRules,
        },
        maxDuration: args.maxDuration,
        recordCall: args.recordCall,
        statusCallbackUrl: args.statusCallbackUrl,
      }

      const result = await clients.twilio.makeCall(callConfig)

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              call: {
                sid: result.callSid,
                conversationId: result.conversationId,
                status: result.status,
                to: result.to,
                from: result.from,
                createdAt: result.createdAt,
              },
              message: `Call initiated successfully to ${result.to}. Call SID: ${result.callSid}, Conversation ID: ${result.conversationId}`,
            }, null, 2),
          },
        ],
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error making call: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      }
    }
  },
}
