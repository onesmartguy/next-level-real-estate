'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage system configuration and preferences</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Basic configuration options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Maintenance Mode</p>
                <p className="text-sm text-muted-foreground">Temporarily disable the platform</p>
              </div>
              <Button variant="outline">Toggle</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Allow New Signups</p>
                <p className="text-sm text-muted-foreground">Enable tenant registration</p>
              </div>
              <Button variant="outline">Enable</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>External service integration settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">Google Ads API</p>
              <p className="text-sm text-muted-foreground">Configure lead source integration</p>
            </div>
            <div>
              <p className="font-medium">ElevenLabs API</p>
              <p className="text-sm text-muted-foreground">AI calling service configuration</p>
            </div>
            <div>
              <p className="font-medium">Twilio Configuration</p>
              <p className="text-sm text-muted-foreground">Phone number and messaging setup</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Settings</CardTitle>
            <CardDescription>TCPA and regulatory compliance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">TCPA Strict Mode</p>
                <p className="text-sm text-muted-foreground">
                  Enforce written consent requirements
                </p>
              </div>
              <Button variant="outline">Enabled</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
