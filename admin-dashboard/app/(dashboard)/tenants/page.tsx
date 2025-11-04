'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTenants } from '@/lib/queries';
import { Plus } from 'lucide-react';
import type { TenantStatus, SubscriptionTier } from '@/types';

const statusColors: Record<TenantStatus, 'default' | 'secondary' | 'success' | 'destructive'> = {
  active: 'success',
  inactive: 'secondary',
  trial: 'default',
  suspended: 'destructive',
};

const tierColors: Record<SubscriptionTier, 'default' | 'secondary' | 'success' | 'warning'> = {
  free: 'secondary',
  starter: 'default',
  professional: 'warning',
  enterprise: 'success',
};

export default function TenantsPage() {
  const { data: tenants, isLoading } = useTenants();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground">Manage customer accounts and subscriptions</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Tenant
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tenants</CardTitle>
          <CardDescription>Overview of all customer accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 w-full animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!tenants || tenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No tenants found. Add your first tenant to get started.
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
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm">{tenant.email}</span>
                          <span className="text-xs text-muted-foreground">{tenant.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[tenant.status]}>{tenant.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tierColors[tenant.subscriptionTier]}>
                          {tenant.subscriptionTier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-xs">
                          {tenant.apiKey.slice(0, 12)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
