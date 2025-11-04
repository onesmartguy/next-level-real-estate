'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon, LucideIcon } from 'lucide-react';
import { cn, formatNumber, formatPercentage } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: LucideIcon;
  loading?: boolean;
  format?: 'number' | 'currency' | 'percentage';
}

export function MetricCard({ title, value, change, icon: Icon, loading }: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{formatNumber(Number(value))}</div>
            {change !== undefined && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                {isPositive && <ArrowUpIcon className="h-3 w-3 text-green-600" />}
                {isNegative && <ArrowDownIcon className="h-3 w-3 text-red-600" />}
                <span
                  className={cn(
                    isPositive && 'text-green-600',
                    isNegative && 'text-red-600'
                  )}
                >
                  {formatPercentage(Math.abs(change))}
                </span>
                <span>from last period</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
