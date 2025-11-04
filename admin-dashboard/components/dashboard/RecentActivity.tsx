'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Activity as ActivityIcon, Phone, UserPlus, Building2 } from 'lucide-react';
import type { Activity, ActivityType } from '@/types';

interface RecentActivityProps {
  activities: Activity[];
  loading?: boolean;
}

const activityIcons: Record<ActivityType, React.ReactNode> = {
  lead_created: <UserPlus className="h-4 w-4 text-blue-500" />,
  lead_updated: <ActivityIcon className="h-4 w-4 text-yellow-500" />,
  call_completed: <Phone className="h-4 w-4 text-green-500" />,
  tenant_created: <Building2 className="h-4 w-4 text-purple-500" />,
  system_event: <ActivityIcon className="h-4 w-4 text-gray-500" />,
};

const activityColors: Record<ActivityType, 'default' | 'secondary' | 'success' | 'warning'> = {
  lead_created: 'default',
  lead_updated: 'warning',
  call_completed: 'success',
  tenant_created: 'secondary',
  system_event: 'secondary',
};

export function RecentActivity({ activities, loading }: RecentActivityProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest events across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest events across the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  {activityIcons[activity.type]}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">{activity.message}</p>
                  <div className="flex items-center space-x-2">
                    <Badge variant={activityColors[activity.type]} className="text-xs">
                      {activity.type.replace('_', ' ')}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
