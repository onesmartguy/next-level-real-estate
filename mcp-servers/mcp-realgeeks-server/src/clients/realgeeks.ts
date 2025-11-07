import crypto from 'crypto'
import type {
  RealGeeksClient,
  Lead,
  LeadCreate,
  LeadUpdate,
  LeadResponse,
  PotentialSellerLead,
  Activity,
  User,
} from '../types/index.js'

export interface RealGeeksClientConfig {
  apiUsername: string
  apiPassword: string
  webhookSecret?: string
  timeout?: number
}

const BASE_URL = 'https://receivers.leadrouter.realgeeks.com/rest'

/**
 * Create RealGeeks API client with authentication
 */
export function createRealGeeksClient(config: RealGeeksClientConfig): RealGeeksClient {
  const timeout = config.timeout || 30000

  // Create basic auth header
  const authToken = Buffer.from(`${config.apiUsername}:${config.apiPassword}`).toString('base64')
  const authHeader = `Basic ${authToken}`

  /**
   * Make authenticated HTTP request
   */
  async function makeRequest<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<T> {
    const url = `${BASE_URL}${path}`

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeout),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`RealGeeks API error (${response.status}): ${errorText}`)
      }

      // Some endpoints return 200/201 with no body
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }

      return {} as T
    } catch (error) {
      console.error(`[RealGeeks] API request failed:`, error)
      throw error
    }
  }

  return {
    async healthCheck(): Promise<boolean> {
      try {
        // Try to list users as a health check (GET endpoint)
        // Note: This requires a valid site_uuid, so health check is limited
        console.error('[RealGeeks] Health check: Authentication configured')
        return true
      } catch (error) {
        console.error('[RealGeeks] Health check failed:', error)
        return false
      }
    },

    async createLead(siteUuid: string, lead: LeadCreate): Promise<LeadResponse> {
      try {
        console.error(`[RealGeeks] Creating lead in site ${siteUuid}`)

        await makeRequest('POST', `/sites/${siteUuid}/leads`, lead)

        return {
          success: true,
          lead_id: lead.id,
          message: 'Lead created successfully',
        }
      } catch (error) {
        console.error('[RealGeeks] Create lead error:', error)
        throw error
      }
    },

    async updateLead(siteUuid: string, leadId: string, lead: LeadUpdate): Promise<LeadResponse> {
      try {
        console.error(`[RealGeeks] Updating lead ${leadId} in site ${siteUuid}`)

        await makeRequest('PATCH', `/sites/${siteUuid}/leads/${leadId}`, lead)

        return {
          success: true,
          lead_id: leadId,
          message: 'Lead updated successfully',
        }
      } catch (error) {
        console.error('[RealGeeks] Update lead error:', error)
        throw error
      }
    },

    async getLead(siteUuid: string, leadId: string): Promise<Lead> {
      try {
        console.error(`[RealGeeks] Fetching lead ${leadId} from site ${siteUuid}`)

        const lead = await makeRequest<Lead>('GET', `/sites/${siteUuid}/leads/${leadId}`)

        return lead
      } catch (error) {
        console.error('[RealGeeks] Get lead error:', error)
        throw error
      }
    },

    async addActivities(siteUuid: string, leadId: string, activities: Activity[]): Promise<void> {
      try {
        console.error(`[RealGeeks] Adding ${activities.length} activities to lead ${leadId}`)

        await makeRequest('POST', `/sites/${siteUuid}/leads/${leadId}/activities`, activities)
      } catch (error) {
        console.error('[RealGeeks] Add activities error:', error)
        throw error
      }
    },

    async createPotentialSellerLead(siteUuid: string, lead: PotentialSellerLead): Promise<LeadResponse> {
      try {
        console.error(`[RealGeeks] Creating potential seller lead in site ${siteUuid}`)

        await makeRequest('POST', `/sites/${siteUuid}/potential-seller-leads`, lead)

        return {
          success: true,
          lead_id: lead.id,
          message: 'Potential seller lead created successfully',
        }
      } catch (error) {
        console.error('[RealGeeks] Create potential seller lead error:', error)
        throw error
      }
    },

    async listUsers(siteUuid: string): Promise<User[]> {
      try {
        console.error(`[RealGeeks] Listing users for site ${siteUuid}`)

        const users = await makeRequest<User[]>('GET', `/sites/${siteUuid}/users`)

        return users
      } catch (error) {
        console.error('[RealGeeks] List users error:', error)
        throw error
      }
    },

    async listLeads(siteUuid: string): Promise<any> {
      try {
        console.error(`[RealGeeks] Listing leads for site ${siteUuid}`)

        const leads = await makeRequest<any>('GET', `/sites/${siteUuid}/leads`)

        return leads
      } catch (error) {
        console.error('[RealGeeks] List leads error:', error)
        throw error
      }
    },

    validateWebhookSignature(body: string, signature: string, secret: string): boolean {
      try {
        // Create HMAC-SHA256 hash of the request body
        const hmac = crypto.createHmac('sha256', secret)
        hmac.update(body)
        const calculatedSignature = hmac.digest('hex')

        // Use constant-time comparison to prevent timing attacks
        return crypto.timingSafeEqual(
          Buffer.from(calculatedSignature),
          Buffer.from(signature)
        )
      } catch (error) {
        console.error('[RealGeeks] Webhook signature validation error:', error)
        return false
      }
    },
  }
}
