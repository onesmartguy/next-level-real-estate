# Admin Dashboard Specification - Next Level Real Estate

## Overview

Modern, production-ready admin dashboard inspired by Aspire.NET dashboard for monitoring and managing the Next Level Real Estate platform locally.

**Version**: 2.0 (Modern Stack)
**Date**: October 24, 2025

---

## Core Requirements

### 1. MVP Feature: Manual AI Call Initiation

**Primary User Flow:**
```
1. User opens dashboard
   ↓
2. Navigates to "Initiate Call" form
   ↓
3. Fills out form:
   - Name (required)
   - Phone Number (required, validated)
   - Address (required)
   ↓
4. Clicks "Start AI Call"
   ↓
5. System validates input
   ↓
6. Creates lead record
   ↓
7. Initiates AI call via ElevenLabs + Twilio
   ↓
8. Redirects to call monitoring page
   ↓
9. Real-time call status updates
```

**Form Component** (`app/calls/new/page.tsx`):
- Simple, focused UI (single page)
- Real-time validation with Zod
- Phone number formatting (US format)
- Address autocomplete (optional: Google Places API)
- Submit button with loading state
- Success/error notifications

---

## Tech Stack (2025 Modern)

### Core Framework
- **Next.js 15.1+** - Latest with App Router, Server Components, Server Actions
- **React 19** - Latest with concurrent features
- **TypeScript 5.7+** - Latest with improved type inference

### Styling & UI
- **Tailwind CSS v4** (CSS-first, native cascade layers, @theme directive)
- **CSS Tokens & Design Tokens** - Semantic color system
- **CVA (Class Variance Authority)** - Component variants
- **Framer Motion 12+** - Latest animations with layout animations
- **Radix UI Primitives** - Accessible component primitives
- **Lucide React** - Modern icon library

### State Management
- **Zustand 5+** - Minimal, fast state management
- **TanStack Query v5** - Server state management
- **React Hook Form 7.5+** - Form state

### Data & Tables
- **TanStack Table v8** - Headless table library (replaces old table components)
- **Zod 3.24+** - Runtime validation
- **date-fns 4+** - Date utilities

### PWA & Performance
- **next-pwa 5.6+** - PWA support for Next.js
- **Workbox** - Service worker tooling
- **Web Vitals** - Performance monitoring

### Development
- **Biome** - Fast linter/formatter (replaces ESLint + Prettier)
- **Turbopack** - Next.js bundler (dev mode)

---

## Design System

### Tailwind CSS v4 Configuration

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* Color Tokens - Semantic */
  --color-primary: oklch(0.6 0.2 250);
  --color-primary-foreground: oklch(1 0 0);

  --color-secondary: oklch(0.4 0.1 250);
  --color-secondary-foreground: oklch(1 0 0);

  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.2 0 0);

  --color-card: oklch(0.98 0 0);
  --color-card-foreground: oklch(0.2 0 0);

  --color-muted: oklch(0.96 0 0);
  --color-muted-foreground: oklch(0.5 0 0);

  --color-accent: oklch(0.95 0.01 250);
  --color-accent-foreground: oklch(0.2 0 0);

  --color-success: oklch(0.7 0.15 145);
  --color-warning: oklch(0.75 0.15 85);
  --color-error: oklch(0.6 0.2 25);
  --color-info: oklch(0.65 0.15 250);

  --color-border: oklch(0.9 0 0);
  --color-input: oklch(0.9 0 0);
  --color-ring: oklch(0.6 0.2 250);

  /* Radius Tokens */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;

  /* Shadow Tokens */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);

  /* Dark Mode (auto-applied) */
  @media (prefers-color-scheme: dark) {
    --color-background: oklch(0.15 0 0);
    --color-foreground: oklch(0.95 0 0);
    --color-card: oklch(0.18 0 0);
    --color-muted: oklch(0.2 0 0);
    /* ... other dark mode colors */
  }
}

/* Component Variants using @layer */
@layer components {
  .card {
    @apply bg-card text-card-foreground rounded-[--radius-lg] border shadow-sm;
  }

  .btn-primary {
    @apply bg-primary text-primary-foreground hover:bg-primary/90
           rounded-[--radius-md] px-4 py-2 font-medium transition-colors;
  }
}
```

---

## Aspire.NET-Style Dashboard Features

### Real-Time Monitoring Dashboard

Similar to Aspire.NET's dashboard, we'll create a comprehensive monitoring view:

#### 1. **Service Health Overview** (Top Section)
```
┌─────────────────────────────────────────────────────────┐
│  Services Status                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │ API GW   │  │ Lead Svc │  │ Call Svc │  │ Kafka   ││
│  │ ● Healthy│  │ ● Healthy│  │ ● Healthy│  │ ● Healthy││
│  │ 2ms      │  │ 15ms     │  │ 8ms      │  │ 1ms     ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
└─────────────────────────────────────────────────────────┘
```

#### 2. **Real-Time Metrics** (Middle Section)
```
┌────────────────────────────────────────────────────────┐
│  Live Metrics                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐│
│  │ Requests/s  │  │ Active Calls│  │ Queue Depth   ││
│  │    124 ▲    │  │      8      │  │      3        ││
│  │  [Line Chart]  [Bar Chart]    [Gauge Chart]      ││
│  └─────────────┘  └─────────────┘  └────────────────┘│
└────────────────────────────────────────────────────────┘
```

#### 3. **Distributed Tracing** (Bottom Section)
```
┌────────────────────────────────────────────────────────┐
│  Recent Traces                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ POST /api/leads/create         200  125ms      ││
│  │ ├─ API Gateway                 ●   2ms       ││
│  │ ├─ Lead Service                ●   45ms      ││
│  │ │  ├─ MongoDB Insert            ●   38ms     ││
│  │ │  └─ Kafka Publish             ●   5ms      ││
│  │ └─ Response                     ●   2ms       ││
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

#### 4. **Logs Stream** (Side Panel)
```
┌──────────────────────────────┐
│  Live Logs                   │
│  [Filter: All | Error | Info]│
│  ┌──────────────────────────┐│
│  │ 18:24:32 [INFO] Lead...  ││
│  │ 18:24:30 [ERROR] Kafka...││
│  │ 18:24:28 [INFO] Call...  ││
│  │ 18:24:25 [WARN] Rate...  ││
│  │ ...                      ││
│  └──────────────────────────┘│
│  [Auto-scroll ✓] [Clear]    │
└──────────────────────────────┘
```

---

## Application Structure

```
admin-dashboard/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── page.tsx                    # Aspire-style monitoring
│   │   ├── calls/
│   │   │   ├── page.tsx                # Call history
│   │   │   └── new/page.tsx            # ★ MVP: Initiate Call Form
│   │   ├── leads/page.tsx              # Lead management (TanStack Table)
│   │   ├── tenants/page.tsx            # Tenant management
│   │   ├── analytics/page.tsx          # Charts & insights
│   │   ├── logs/page.tsx               # Log viewer
│   │   ├── traces/page.tsx             # Distributed tracing
│   │   ├── settings/page.tsx           # System settings
│   │   └── layout.tsx
│   ├── api/
│   │   ├── health/route.ts
│   │   └── calls/route.ts              # Server Action for call initiation
│   ├── globals.css                     # Tailwind v4 + tokens
│   ├── layout.tsx
│   └── manifest.ts                     # PWA manifest
├── components/
│   ├── calls/
│   │   ├── CallForm.tsx                # ★ MVP Form Component
│   │   └── CallMonitor.tsx             # Real-time call status
│   ├── dashboard/
│   │   ├── ServiceHealth.tsx           # Service status cards
│   │   ├── LiveMetrics.tsx             # Real-time metrics
│   │   ├── TraceViewer.tsx             # Distributed tracing
│   │   └── LogStream.tsx               # Live log viewer
│   ├── charts/
│   │   ├── LineChart.tsx               # Recharts wrapper with Framer Motion
│   │   ├── BarChart.tsx
│   │   └── GaugeChart.tsx
│   ├── tables/
│   │   └── DataTable.tsx               # TanStack Table wrapper
│   ├── layout/
│   │   ├── Sidebar.tsx                 # With Framer Motion
│   │   ├── TopNav.tsx
│   │   └── CommandPalette.tsx          # Cmd+K quick search
│   └── ui/                             # Radix UI primitives
│       ├── button.tsx                  # With CVA variants
│       ├── input.tsx
│       ├── card.tsx
│       ├── table.tsx
│       ├── dialog.tsx
│       └── toast.tsx
├── lib/
│   ├── api/
│   │   ├── client.ts                   # Fetch wrapper
│   │   └── endpoints.ts                # API endpoint constants
│   ├── stores/
│   │   ├── callStore.ts                # Zustand store for call state
│   │   ├── tenantStore.ts              # Zustand store for tenant context
│   │   └── uiStore.ts                  # UI state (sidebar, theme)
│   ├── hooks/
│   │   ├── useCallInitiation.ts        # React Hook Form + Server Action
│   │   ├── useLiveMetrics.ts           # TanStack Query with polling
│   │   └── useWebSocket.ts             # Real-time updates
│   ├── validation/
│   │   ├── callSchema.ts               # Zod schema for call form
│   │   └── leadSchema.ts
│   ├── utils/
│   │   ├── cn.ts                       # Class name merger
│   │   └── formatting.ts               # Phone, date formatters
│   └── types.ts                        # TypeScript types
├── public/
│   ├── icons/                          # PWA icons
│   ├── manifest.json                   # PWA manifest
│   └── sw.js                           # Service worker
├── tailwind.config.ts                  # Tailwind v4 config
├── next.config.ts                      # With PWA plugin
├── biome.json                          # Biome config
├── package.json
└── tsconfig.json
```

---

## MVP: Call Initiation Form

### Form Component (`app/calls/new/page.tsx`)

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useCallInitiation } from '@/lib/hooks/useCallInitiation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

// Zod validation schema
const callSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string()
    .regex(/^\+?1?\d{10,14}$/, 'Invalid phone number format')
    .transform(val => formatPhoneNumber(val)),
  address: z.string().min(5, 'Address must be at least 5 characters'),
});

type CallFormData = z.infer<typeof callSchema>;

export default function NewCallPage() {
  const { initiateCall, isLoading, error } = useCallInitiation();

  const form = useForm<CallFormData>({
    resolver: zodResolver(callSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
    },
  });

  const onSubmit = async (data: CallFormData) => {
    const result = await initiateCall(data);

    if (result.success) {
      // Redirect to call monitoring page
      window.location.href = `/calls/${result.callId}`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="container max-w-2xl mx-auto py-8"
    >
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Initiate AI Call</h1>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Name
            </label>
            <Input
              {...form.register('name')}
              placeholder="John Doe"
              className="w-full"
            />
            {form.formState.errors.name && (
              <p className="text-error text-sm mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Phone Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Phone Number
            </label>
            <Input
              {...form.register('phone')}
              type="tel"
              placeholder="+1 (555) 123-4567"
              className="w-full"
            />
            {form.formState.errors.phone && (
              <p className="text-error text-sm mt-1">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>

          {/* Address Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Address
            </label>
            <Input
              {...form.register('address')}
              placeholder="123 Main St, Seattle, WA 98101"
              className="w-full"
            />
            {form.formState.errors.address && (
              <p className="text-error text-sm mt-1">
                {form.formState.errors.address.message}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-error/10 border border-error rounded-md p-3"
            >
              <p className="text-error text-sm">{error}</p>
            </motion.div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                ⟳
              </motion.div>
            ) : (
              'Start AI Call'
            )}
          </Button>
        </form>
      </Card>
    </motion.div>
  );
}
```

### Server Action (`app/api/calls/initiate/route.ts`)

```typescript
'use server';

import { z } from 'zod';

export async function initiateCall(data: {
  name: string;
  phone: string;
  address: string;
}) {
  try {
    // 1. Create lead record
    const lead = await fetch('http://localhost:3001/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: data.name.split(' ')[0],
        lastName: data.name.split(' ').slice(1).join(' '),
        phone: data.phone,
        propertyDetails: { address: data.address },
        leadSource: {
          source: 'manual',
          receivedAt: new Date(),
        },
        consent: {
          hasWrittenConsent: true,
          consentDate: new Date(),
          consentMethod: 'manual_entry',
        },
        dncStatus: {
          onNationalRegistry: false,
          internalDNC: false,
          lastCheckedAt: new Date(),
        },
        automatedCallsAllowed: true,
        status: 'new',
      }),
    });

    const leadData = await lead.json();

    // 2. Initiate AI call via Calling Service
    const call = await fetch('http://localhost:3002/api/calls/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: leadData.data._id,
        phone: data.phone,
        context: {
          name: data.name,
          address: data.address,
          strategy: 'wholesale',
        },
      }),
    });

    const callData = await call.json();

    return {
      success: true,
      callId: callData.data._id,
      leadId: leadData.data._id,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

---

## PWA Configuration

### `next.config.ts`

```typescript
import withPWA from 'next-pwa';

const config = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    {
      urlPattern: /^https:\/\/localhost:300[0-3]\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },
  ],
});

export default config({
  experimental: {
    turbo: {
      enabled: true, // Turbopack for faster dev builds
    },
  },
});
```

### `app/manifest.ts`

```typescript
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Next Level Real Estate Admin',
    short_name: 'NLRE Admin',
    description: 'Admin dashboard for Next Level Real Estate platform',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
```

---

## Real-Time Features

### WebSocket Integration for Live Updates

```typescript
// lib/hooks/useWebSocket.ts
import { useEffect, useState } from 'react';

export function useWebSocket(url: string) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => setStatus('connected');
    ws.onclose = () => setStatus('disconnected');
    ws.onmessage = (event) => {
      setData(JSON.parse(event.data));
    };

    return () => ws.close();
  }, [url]);

  return { data, status };
}

// Usage in dashboard
const { data: liveMetrics } = useWebSocket('ws://localhost:3000/metrics');
```

---

## Dependencies (package.json)

```json
{
  "dependencies": {
    "next": "^15.1.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-query": "^5.62.14",
    "@tanstack/react-table": "^8.20.6",
    "zustand": "^5.0.2",
    "zod": "^3.24.1",
    "framer-motion": "^12.0.0",
    "react-hook-form": "^7.54.1",
    "@hookform/resolvers": "^3.9.1",
    "tailwindcss": "^4.0.0-beta.10",
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-dropdown-menu": "^2.1.5",
    "@radix-ui/react-select": "^2.1.5",
    "@radix-ui/react-toast": "^1.2.4",
    "lucide-react": "^0.468.0",
    "recharts": "^2.15.0",
    "date-fns": "^4.1.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "next-pwa": "^5.6.0"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "typescript": "^5.7.2",
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2"
  }
}
```

---

## Next Steps

1. ✅ Specification documented
2. ⏳ Scaffold Next.js project with Tailwind v4
3. ⏳ Implement MVP call initiation form
4. ⏳ Build Aspire-style monitoring dashboard
5. ⏳ Add TanStack Table for data grids
6. ⏳ Implement Zustand stores
7. ⏳ Add Framer Motion animations
8. ⏳ Configure PWA
9. ⏳ Connect to backend services

---

*Admin Dashboard Specification v2.0*
*Next Level Real Estate - October 2025*
