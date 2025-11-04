'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import type { TopTenant, SubscriptionTier } from '@/types';

interface TopTenantsTableProps {
  tenants: TopTenant[];
  loading?: boolean;
}

const tierColors: Record<SubscriptionTier, 'default' | 'secondary' | 'success' | 'warning'> = {
  free: 'secondary',
  starter: 'default',
  professional: 'warning',
  enterprise: 'success',
};

export function TopTenantsTable({ tenants, loading }: TopTenantsTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Tenants</CardTitle>
          <CardDescription>Highest converting customers this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 w-full animate-pulse rounded bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Tenants</CardTitle>
        <CardDescription>Highest converting customers this month</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead className="text-right">Leads</TableHead>
              <TableHead className="text-right">Conv. Rate</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead>Tier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No tenant data available
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{tenant.companyName}</div>
                      <div className="text-sm text-muted-foreground">{tenant.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{tenant.leadsCount}</TableCell>
                  <TableCell className="text-right">
                    {formatPercentage(tenant.conversionRate)}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(tenant.revenue)}</TableCell>
                  <TableCell>
                    <Badge variant={tierColors[tenant.subscriptionTier]}>
                      {tenant.subscriptionTier}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
