/**
 * API Client for Next Level Real Estate Backend Services
 * Connects to lead-service (port 3000) and other microservices
 */

import type {
  ApiResponse,
  Lead,
  LeadFilters,
  Tenant,
  Call,
  DashboardMetrics,
  LeadTrendData,
  LeadsBySource,
  TopTenant,
  Activity,
  ConversionFunnelData,
} from '@/types';

// API Configuration
const API_CONFIG = {
  LEAD_SERVICE: process.env.NEXT_PUBLIC_LEAD_SERVICE_URL || 'http://localhost:3000',
  CALLING_SERVICE: process.env.NEXT_PUBLIC_CALLING_SERVICE_URL || 'http://localhost:3001',
  ANALYTICS_SERVICE: process.env.NEXT_PUBLIC_ANALYTICS_SERVICE_URL || 'http://localhost:3002',
  TENANT_SERVICE: process.env.NEXT_PUBLIC_TENANT_SERVICE_URL || 'http://localhost:3003',
};

// Generic fetch wrapper with error handling
async function fetchApi<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));

      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: error.message || 'An error occurred',
          details: error,
        },
      };
    }

    const data = await response.json();

    // Handle different response formats
    if (data.success !== undefined) {
      return data;
    }

    // Wrap plain data in ApiResponse format
    return {
      success: true,
      data: data as T,
    };
  } catch (error) {
    console.error('API Fetch Error:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network request failed',
        details: error,
      },
    };
  }
}

// Lead API
export const leadApi = {
  // Get all leads with optional filters
  getLeads: async (filters?: LeadFilters): Promise<ApiResponse<Lead[]>> => {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const url = `${API_CONFIG.LEAD_SERVICE}/api/leads?${params.toString()}`;
    return fetchApi<Lead[]>(url);
  },

  // Get single lead by ID
  getLead: async (id: string): Promise<ApiResponse<Lead>> => {
    return fetchApi<Lead>(`${API_CONFIG.LEAD_SERVICE}/api/leads/${id}`);
  },

  // Create new lead
  createLead: async (lead: Partial<Lead>): Promise<ApiResponse<Lead>> => {
    return fetchApi<Lead>(`${API_CONFIG.LEAD_SERVICE}/api/leads`, {
      method: 'POST',
      body: JSON.stringify(lead),
    });
  },

  // Update lead
  updateLead: async (id: string, updates: Partial<Lead>): Promise<ApiResponse<Lead>> => {
    return fetchApi<Lead>(`${API_CONFIG.LEAD_SERVICE}/api/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  // Delete lead
  deleteLead: async (id: string): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`${API_CONFIG.LEAD_SERVICE}/api/leads/${id}`, {
      method: 'DELETE',
    });
  },
};

// Tenant API
export const tenantApi = {
  // Get all tenants
  getTenants: async (): Promise<ApiResponse<Tenant[]>> => {
    return fetchApi<Tenant[]>(`${API_CONFIG.TENANT_SERVICE}/api/tenants`);
  },

  // Get single tenant
  getTenant: async (id: string): Promise<ApiResponse<Tenant>> => {
    return fetchApi<Tenant>(`${API_CONFIG.TENANT_SERVICE}/api/tenants/${id}`);
  },

  // Create tenant
  createTenant: async (tenant: Partial<Tenant>): Promise<ApiResponse<Tenant>> => {
    return fetchApi<Tenant>(`${API_CONFIG.TENANT_SERVICE}/api/tenants`, {
      method: 'POST',
      body: JSON.stringify(tenant),
    });
  },

  // Update tenant
  updateTenant: async (id: string, updates: Partial<Tenant>): Promise<ApiResponse<Tenant>> => {
    return fetchApi<Tenant>(`${API_CONFIG.TENANT_SERVICE}/api/tenants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
};

// Call API
export const callApi = {
  // Get all calls
  getCalls: async (filters?: { tenantId?: string; leadId?: string }): Promise<ApiResponse<Call[]>> => {
    const params = new URLSearchParams();

    if (filters?.tenantId) params.append('tenantId', filters.tenantId);
    if (filters?.leadId) params.append('leadId', filters.leadId);

    const url = `${API_CONFIG.CALLING_SERVICE}/api/calls?${params.toString()}`;
    return fetchApi<Call[]>(url);
  },

  // Get single call
  getCall: async (id: string): Promise<ApiResponse<Call>> => {
    return fetchApi<Call>(`${API_CONFIG.CALLING_SERVICE}/api/calls/${id}`);
  },

  // Initiate call
  initiateCall: async (leadId: string, phoneNumber: string): Promise<ApiResponse<Call>> => {
    return fetchApi<Call>(`${API_CONFIG.CALLING_SERVICE}/api/calls`, {
      method: 'POST',
      body: JSON.stringify({ leadId, phoneNumber }),
    });
  },
};

// Analytics API
export const analyticsApi = {
  // Get dashboard metrics
  getDashboardMetrics: async (): Promise<ApiResponse<DashboardMetrics>> => {
    return fetchApi<DashboardMetrics>(`${API_CONFIG.ANALYTICS_SERVICE}/api/analytics/dashboard`);
  },

  // Get lead trends (last 30 days)
  getLeadTrends: async (days: number = 30): Promise<ApiResponse<LeadTrendData[]>> => {
    return fetchApi<LeadTrendData[]>(
      `${API_CONFIG.ANALYTICS_SERVICE}/api/analytics/lead-trends?days=${days}`
    );
  },

  // Get leads by source
  getLeadsBySource: async (): Promise<ApiResponse<LeadsBySource[]>> => {
    return fetchApi<LeadsBySource[]>(`${API_CONFIG.ANALYTICS_SERVICE}/api/analytics/leads-by-source`);
  },

  // Get conversion funnel data
  getConversionFunnel: async (): Promise<ApiResponse<ConversionFunnelData[]>> => {
    return fetchApi<ConversionFunnelData[]>(
      `${API_CONFIG.ANALYTICS_SERVICE}/api/analytics/conversion-funnel`
    );
  },

  // Get top performing tenants
  getTopTenants: async (limit: number = 10): Promise<ApiResponse<TopTenant[]>> => {
    return fetchApi<TopTenant[]>(
      `${API_CONFIG.ANALYTICS_SERVICE}/api/analytics/top-tenants?limit=${limit}`
    );
  },

  // Get recent activity
  getRecentActivity: async (limit: number = 20): Promise<ApiResponse<Activity[]>> => {
    return fetchApi<Activity[]>(
      `${API_CONFIG.ANALYTICS_SERVICE}/api/analytics/recent-activity?limit=${limit}`
    );
  },
};

// Health check for all services
export const healthApi = {
  checkAllServices: async (): Promise<Record<string, boolean>> => {
    const results: Record<string, boolean> = {};

    for (const [serviceName, url] of Object.entries(API_CONFIG)) {
      try {
        const response = await fetch(`${url}/health`, { method: 'GET' });
        results[serviceName] = response.ok;
      } catch {
        results[serviceName] = false;
      }
    }

    return results;
  },
};
