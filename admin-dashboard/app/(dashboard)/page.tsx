'use client';

import { MetricCard } from '@/components/dashboard/MetricCard';
import { LeadTrendChart } from '@/components/charts/LeadTrendChart';
import { ConversionFunnel } from '@/components/charts/ConversionFunnel';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { TopTenantsTable } from '@/components/dashboard/TopTenantsTable';
import {
  useDashboardMetrics,
  useLeadTrends,
  useConversionFunnel,
  useTopTenants,
  useRecentActivity,
} from '@/lib/queries';
import { Users, Building2, Phone, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: leadTrends, isLoading: trendsLoading } = useLeadTrends(30);
  const { data: funnelData, isLoading: funnelLoading } = useConversionFunnel();
  const { data: topTenants, isLoading: tenantsLoading } = useTopTenants(10);
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time overview of your real estate operations
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Leads"
          value={metrics?.totalLeads ?? 0}
          change={metrics?.leadsChange}
          icon={Users}
          loading={metricsLoading}
        />
        <MetricCard
          title="Active Tenants"
          value={metrics?.activeTenants ?? 0}
          change={metrics?.tenantsChange}
          icon={Building2}
          loading={metricsLoading}
        />
        <MetricCard
          title="API Calls Today"
          value={metrics?.apiCallsToday ?? 0}
          change={metrics?.apiCallsChange}
          icon={Phone}
          loading={metricsLoading}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${metrics?.conversionRate?.toFixed(1) ?? 0}%`}
          change={metrics?.conversionRateChange}
          icon={TrendingUp}
          loading={metricsLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <LeadTrendChart data={leadTrends ?? []} loading={trendsLoading} />
        <ConversionFunnel data={funnelData ?? []} loading={funnelLoading} />
      </div>

      {/* Bottom Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <TopTenantsTable tenants={topTenants ?? []} loading={tenantsLoading} />
        <RecentActivity activities={recentActivity ?? []} loading={activityLoading} />
      </div>

      {/* Additional Info Card */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-2 text-xl font-semibold">Quick Stats</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Average Response Time</p>
            <p className="text-2xl font-bold">
              {metrics?.averageResponseTime
                ? `${metrics.averageResponseTime.toFixed(1)} min`
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Call Connect Rate</p>
            <p className="text-2xl font-bold">
              {metrics?.callConnectRate ? `${metrics.callConnectRate.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">System Status</p>
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <p className="text-lg font-semibold">All Systems Operational</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
