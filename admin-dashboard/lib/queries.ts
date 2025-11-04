/**
 * TanStack Query hooks for data fetching
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadApi, tenantApi, callApi, analyticsApi } from './api';
import type { Lead, LeadFilters, Tenant, Call } from '@/types';

// Query Keys
export const queryKeys = {
  leads: {
    all: ['leads'] as const,
    lists: () => [...queryKeys.leads.all, 'list'] as const,
    list: (filters?: LeadFilters) => [...queryKeys.leads.lists(), filters] as const,
    details: () => [...queryKeys.leads.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.leads.details(), id] as const,
  },
  tenants: {
    all: ['tenants'] as const,
    lists: () => [...queryKeys.tenants.all, 'list'] as const,
    details: () => [...queryKeys.tenants.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tenants.details(), id] as const,
  },
  calls: {
    all: ['calls'] as const,
    lists: () => [...queryKeys.calls.all, 'list'] as const,
    list: (filters?: { tenantId?: string; leadId?: string }) =>
      [...queryKeys.calls.lists(), filters] as const,
    details: () => [...queryKeys.calls.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.calls.details(), id] as const,
  },
  analytics: {
    all: ['analytics'] as const,
    dashboard: () => [...queryKeys.analytics.all, 'dashboard'] as const,
    leadTrends: (days: number) => [...queryKeys.analytics.all, 'lead-trends', days] as const,
    leadsBySource: () => [...queryKeys.analytics.all, 'leads-by-source'] as const,
    conversionFunnel: () => [...queryKeys.analytics.all, 'conversion-funnel'] as const,
    topTenants: (limit: number) => [...queryKeys.analytics.all, 'top-tenants', limit] as const,
    recentActivity: (limit: number) =>
      [...queryKeys.analytics.all, 'recent-activity', limit] as const,
  },
};

// Lead Queries
export function useLeads(filters?: LeadFilters) {
  return useQuery({
    queryKey: queryKeys.leads.list(filters),
    queryFn: async () => {
      const response = await leadApi.getLeads(filters);
      if (!response.success) throw new Error(response.error?.message);
      return response.data || [];
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: queryKeys.leads.detail(id),
    queryFn: async () => {
      const response = await leadApi.getLead(id);
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    },
    enabled: !!id,
  });
}

// Lead Mutations
export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lead: Partial<Lead>) => leadApi.createLead(lead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Lead> }) =>
      leadApi.updateLead(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => leadApi.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

// Tenant Queries
export function useTenants() {
  return useQuery({
    queryKey: queryKeys.tenants.lists(),
    queryFn: async () => {
      const response = await tenantApi.getTenants();
      if (!response.success) throw new Error(response.error?.message);
      return response.data || [];
    },
    staleTime: 60000, // 1 minute
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: queryKeys.tenants.detail(id),
    queryFn: async () => {
      const response = await tenantApi.getTenant(id);
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    },
    enabled: !!id,
  });
}

// Tenant Mutations
export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tenant: Partial<Tenant>) => tenantApi.createTenant(tenant),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Tenant> }) =>
      tenantApi.updateTenant(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.lists() });
    },
  });
}

// Call Queries
export function useCalls(filters?: { tenantId?: string; leadId?: string }) {
  return useQuery({
    queryKey: queryKeys.calls.list(filters),
    queryFn: async () => {
      const response = await callApi.getCalls(filters);
      if (!response.success) throw new Error(response.error?.message);
      return response.data || [];
    },
    staleTime: 30000,
  });
}

export function useCall(id: string) {
  return useQuery({
    queryKey: queryKeys.calls.detail(id),
    queryFn: async () => {
      const response = await callApi.getCall(id);
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    },
    enabled: !!id,
  });
}

// Call Mutations
export function useInitiateCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, phoneNumber }: { leadId: string; phoneNumber: string }) =>
      callApi.initiateCall(leadId, phoneNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calls.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

// Analytics Queries
export function useDashboardMetrics() {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard(),
    queryFn: async () => {
      const response = await analyticsApi.getDashboardMetrics();
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute for real-time updates
  });
}

export function useLeadTrends(days: number = 30) {
  return useQuery({
    queryKey: queryKeys.analytics.leadTrends(days),
    queryFn: async () => {
      const response = await analyticsApi.getLeadTrends(days);
      if (!response.success) throw new Error(response.error?.message);
      return response.data || [];
    },
    staleTime: 60000,
  });
}

export function useLeadsBySource() {
  return useQuery({
    queryKey: queryKeys.analytics.leadsBySource(),
    queryFn: async () => {
      const response = await analyticsApi.getLeadsBySource();
      if (!response.success) throw new Error(response.error?.message);
      return response.data || [];
    },
    staleTime: 60000,
  });
}

export function useConversionFunnel() {
  return useQuery({
    queryKey: queryKeys.analytics.conversionFunnel(),
    queryFn: async () => {
      const response = await analyticsApi.getConversionFunnel();
      if (!response.success) throw new Error(response.error?.message);
      return response.data || [];
    },
    staleTime: 60000,
  });
}

export function useTopTenants(limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.analytics.topTenants(limit),
    queryFn: async () => {
      const response = await analyticsApi.getTopTenants(limit);
      if (!response.success) throw new Error(response.error?.message);
      return response.data || [];
    },
    staleTime: 60000,
  });
}

export function useRecentActivity(limit: number = 20) {
  return useQuery({
    queryKey: queryKeys.analytics.recentActivity(limit),
    queryFn: async () => {
      const response = await analyticsApi.getRecentActivity(limit);
      if (!response.success) throw new Error(response.error?.message);
      return response.data || [];
    },
    staleTime: 30000,
    refetchInterval: 30000, // Refetch every 30 seconds for activity feed
  });
}
