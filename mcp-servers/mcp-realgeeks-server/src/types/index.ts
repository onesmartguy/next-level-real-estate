/**
 * Type definitions for RealGeeks API
 */

export interface Clients {
  realgeeks: RealGeeksClient
}

/**
 * RealGeeks client interface
 */
export interface RealGeeksClient {
  healthCheck(): Promise<boolean>

  // Leads operations
  createLead(siteUuid: string, lead: LeadCreate): Promise<LeadResponse>
  updateLead(siteUuid: string, leadId: string, lead: LeadUpdate): Promise<LeadResponse>
  getLead(siteUuid: string, leadId: string): Promise<Lead>
  addActivities(siteUuid: string, leadId: string, activities: Activity[]): Promise<void>
  createPotentialSellerLead(siteUuid: string, lead: PotentialSellerLead): Promise<LeadResponse>

  // Users operations
  listUsers(siteUuid: string): Promise<User[]>

  // List leads
  listLeads(siteUuid: string): Promise<any>

  // Webhook validation
  validateWebhookSignature(body: string, signature: string, secret: string): boolean
}

/**
 * Lead data structures
 */
export interface Lead {
  id: string  // UUID
  first_name?: string
  last_name?: string
  email?: string
  second_email?: string
  phone?: string
  phone2?: string
  address?: string
  street_address?: string
  city?: string
  state?: string
  zip?: string
  source: string
  source_details?: string
  role?: 'Buyer' | 'Seller' | 'Buyer and Seller' | 'Renter'
  created?: string  // ISO 8601
  timeframe?: string
  urgency?: 'Cold' | 'Warm' | 'Hot' | 'Contacted' | 'Not Contacted'
  status?: 'Active' | 'Cancelled' | 'In Escrow' | 'Closed Escrow' | 'Dead'
  notes?: string
  tags?: string[]
  activities?: Activity[]
  region?: string

  // Outgoing API additional fields
  action?: 'created' | 'updated' | 'activity_added' | 'unknown'
  partner_id?: string
  site_uuid?: string
  site_domain?: string
  site_login_url?: string
  source_system?: string
}

export interface LeadCreate extends Omit<Lead, 'id'> {
  id: string  // Required UUID for creation
}

export interface LeadUpdate extends Partial<Omit<Lead, 'id' | 'created'>> {}

export interface LeadResponse {
  success: boolean
  lead_id: string
  message?: string
}

export interface PotentialSellerLead {
  id: string
  created?: string
  activities: Activity[]
}

/**
 * Activity data structures
 */
export interface Activity {
  type: ActivityType
  source: string
  description: string
  property?: Property
  user?: User
  created?: string  // ISO 8601
  notify_users?: boolean
  role?: 'agent' | 'lender'
}

export type ActivityType =
  | 'visited'
  | 'search_performed'
  | 'saved_search_added'
  | 'saved_search_removed'
  | 'property_viewed'
  | 'favorite_property_added'
  | 'favorite_property_removed'
  | 'property_updates_email_sent'
  | 'property_updates_email_opened'
  | 'bad_email_flagged'
  | 'bad_email_unflagged'
  | 'opted_out'
  | 'deleted'
  | 'restored'
  | 'contact_emailed'
  | 'valuation_inquiry'
  | 'shared_property_via_email'
  | 'market_report_viewed'
  | 'market_report_saved'
  | 'note'
  | 'called'
  | 'was_assigned'
  | 'was_unassigned'
  | 'received_text_message_from'
  | 'sent_text_message_to'
  | 'tour_requested'
  | 'imported'

/**
 * Property data structure
 */
export interface Property {
  address?: string
  street_address?: string
  city?: string
  state?: string
  zip?: string
  unit_number?: string
  beds?: number
  baths?: number
  sqft?: number
  lot_sqft?: number
  year_built?: number
  property_type?: string
  mls_number?: string
  list_price?: number
  list_date?: string
  status?: string
  days_on_market?: number
  photos?: string[]
  valuation?: {
    low?: number
    high?: number
    median?: number
  }
  sale_history?: Array<{
    date: string
    price: number
  }>
  rental_price?: number
  coordinates?: {
    lat: number
    lng: number
  }
  tags?: string[]
}

/**
 * User data structure
 */
export interface User {
  id: string
  role: 'Agent' | 'Lender'
  admin: boolean
  name: string
  email: string
  signature?: string
  phone_company?: string
  phone_office?: string
  phone_cell?: string
  phone_home?: string
}

/**
 * Webhook data structures
 */
export interface WebhookRequest {
  action: 'created' | 'updated' | 'activity_added' | 'user_updated' | 'integration_enabled' | 'integration_disabled'
  message_id: string
  signature: string
  body: Lead | User | { activities: Activity[] }
}

/**
 * Tool result interface
 */
export interface ToolResult {
  content: Array<{
    type: 'text' | 'resource'
    text?: string
    uri?: string
    data?: any
  }>
  isError?: boolean
}

/**
 * Server configuration
 */
export interface ServerConfig {
  realgeeks: {
    apiUsername: string
    apiPassword: string
    webhookSecret?: string
    timeout?: number
  }
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
}
