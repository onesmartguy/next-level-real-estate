import twilio from 'twilio'
import type {
  TwilioClientConfig,
  TwilioClient,
  CallConfig,
  CallResult,
  CallStatus,
} from '../types/index.js'

export function createTwilioClient(config: TwilioClientConfig): TwilioClient {
  const client = twilio(config.accountSid, config.authToken)

  return {
    async makeCall(callConfig: CallConfig): Promise<CallResult> {
      try {
        console.error('[Twilio] Initiating call to:', callConfig.to)
        console.error('[Twilio] Using agent:', callConfig.agentId)

        // Create ElevenLabs conversation first
        const conversationResponse = await fetch('https://api.elevenlabs.io/v1/convai/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
          },
          body: JSON.stringify({
            agent_id: callConfig.agentId,
            context: callConfig.context || {},
          }),
        })

        if (!conversationResponse.ok) {
          const error = await conversationResponse.text()
          throw new Error(`Failed to create ElevenLabs conversation: ${error}`)
        }

        const conversation = await conversationResponse.json()
        const conversationId = conversation.conversation_id

        console.error('[Twilio] ElevenLabs conversation created:', conversationId)

        // Create TwiML for ConversationRelay
        const twimlUrl = `${process.env.WEBHOOK_BASE_URL}/twilio/conversation-relay?conversationId=${conversationId}&agentId=${callConfig.agentId}`

        // Initiate Twilio call
        const call = await client.calls.create({
          to: callConfig.to,
          from: config.phoneNumber,
          url: twimlUrl,
          method: 'POST',
          statusCallback: callConfig.statusCallbackUrl,
          statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
          record: callConfig.recordCall || false,
          timeout: callConfig.maxDuration || 60,
        })

        console.error('[Twilio] Call initiated:', call.sid)

        return {
          callSid: call.sid,
          conversationId,
          status: call.status,
          to: call.to,
          from: call.from,
          createdAt: call.dateCreated.toISOString(),
        }
      } catch (error) {
        console.error('[Twilio] Call failed:', error)
        throw error
      }
    },

    async getCallStatus(callSid: string): Promise<CallStatus> {
      try {
        const call = await client.calls(callSid).fetch()

        return {
          callSid: call.sid,
          status: call.status as any,
          direction: call.direction as any,
          duration: call.duration ? parseInt(call.duration, 10) : undefined,
          startTime: call.startTime?.toISOString(),
          endTime: call.endTime?.toISOString(),
          price: call.price || undefined,
          priceUnit: call.priceUnit || undefined,
        }
      } catch (error) {
        console.error('[Twilio] Failed to get call status:', error)
        throw error
      }
    },

    async endCall(callSid: string): Promise<void> {
      try {
        await client.calls(callSid).update({ status: 'completed' })
        console.error('[Twilio] Call ended:', callSid)
      } catch (error) {
        console.error('[Twilio] Failed to end call:', error)
        throw error
      }
    },

    async healthCheck(): Promise<boolean> {
      try {
        // Try to fetch account info to verify credentials
        await client.api.accounts(config.accountSid).fetch()
        return true
      } catch (error) {
        console.error('[Twilio] Health check failed:', error)
        return false
      }
    },
  }
}
