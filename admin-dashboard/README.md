# Next Level Real Estate - Admin Dashboard

A modern, feature-rich admin dashboard for managing the Next Level Real Estate AI-powered platform. Built with Next.js 15, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS 3.4 + shadcn/ui components
- **Data Fetching**: TanStack Query (React Query) v5
- **Charts**: Recharts 2.15
- **Authentication**: NextAuth.js v5 (ready to configure)
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Features

### Current Implementation

- **Dashboard Overview**
  - Real-time metrics cards (Total Leads, Active Tenants, API Calls, Conversion Rate)
  - Lead trend chart (30-day timeline)
  - Conversion funnel visualization
  - Top performing tenants table
  - Recent activity feed
  - System status indicators

- **Leads Management**
  - Lead list with filtering
  - Status badges and source tracking
  - Quick actions (call, email)
  - TCPA compliance tracking

- **Tenants Management**
  - Tenant overview and subscription tiers
  - API key management
  - Status monitoring

- **Analytics** (Placeholder)
  - Prepared for deep insights and custom reports

- **Logs** (Placeholder)
  - System activity audit trail
  - API request logging

- **Settings**
  - System configuration
  - API integration settings
  - TCPA compliance toggles

### UI Components

All components built with shadcn/ui for consistency:
- Button, Card, Table, Badge, Avatar
- Responsive sidebar navigation with collapse
- Top navigation with search and user menu
- Dark mode support (toggle in top nav)
- Loading states and skeleton screens

### Data Layer

- **TanStack Query** for efficient data fetching
  - Automatic caching and background refetching
  - Optimistic updates
  - Error handling
  - Query invalidation on mutations

- **Type-Safe API Client**
  - Connects to backend microservices:
    - Lead Service (port 3000)
    - Calling Service (port 3001)
    - Analytics Service (port 3002)
    - Tenant Service (port 3003)
  - Generic fetch wrapper with error handling
  - Standardized API response format

## Project Structure

```
admin-dashboard/
├── app/
│   ├── (dashboard)/           # Dashboard routes (protected)
│   │   ├── page.tsx          # Main dashboard
│   │   ├── leads/
│   │   ├── analytics/
│   │   ├── logs/
│   │   ├── tenants/
│   │   ├── settings/
│   │   └── layout.tsx        # Sidebar + TopNav layout
│   ├── globals.css           # Tailwind + CSS variables
│   └── layout.tsx            # Root layout with providers
├── components/
│   ├── charts/               # Recharts components
│   │   ├── LeadTrendChart.tsx
│   │   └── ConversionFunnel.tsx
│   ├── dashboard/            # Dashboard-specific components
│   │   ├── MetricCard.tsx
│   │   ├── RecentActivity.tsx
│   │   └── TopTenantsTable.tsx
│   ├── layout/               # Layout components
│   │   ├── Sidebar.tsx
│   │   └── TopNav.tsx
│   └── ui/                   # shadcn/ui base components
│       ├── button.tsx
│       ├── card.tsx
│       ├── table.tsx
│       ├── badge.tsx
│       └── avatar.tsx
├── lib/
│   ├── api.ts               # API client functions
│   ├── queries.ts           # TanStack Query hooks
│   ├── providers.tsx        # React Query provider
│   └── utils.ts             # Utility functions
├── types/
│   └── index.ts             # TypeScript type definitions
└── public/                  # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ (Note: Project was configured for Node 20+, but will work on 18)
- npm or yarn

### Installation

1. Clone the repository and navigate to the admin-dashboard directory:

```bash
cd /home/onesmartguy/projects/next-level-real-estate/admin-dashboard
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.local.example .env.local
```

4. Configure your environment variables in `.env.local`:

```env
NEXT_PUBLIC_LEAD_SERVICE_URL=http://localhost:3000
NEXT_PUBLIC_CALLING_SERVICE_URL=http://localhost:3001
NEXT_PUBLIC_ANALYTICS_SERVICE_URL=http://localhost:3002
NEXT_PUBLIC_TENANT_SERVICE_URL=http://localhost:3003
```

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3100](http://localhost:3100) in your browser.

## Available Scripts

- `npm run dev` - Start development server on port 3100
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Connecting to Backend Services

The dashboard is designed to connect to the following backend microservices:

### Lead Service (Port 3000)
- `GET /api/leads` - Get all leads
- `GET /api/leads/:id` - Get single lead
- `POST /api/leads` - Create lead
- `PATCH /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Calling Service (Port 3001)
- `GET /api/calls` - Get all calls
- `GET /api/calls/:id` - Get single call
- `POST /api/calls` - Initiate call

### Analytics Service (Port 3002)
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/lead-trends` - Lead trends data
- `GET /api/analytics/leads-by-source` - Source breakdown
- `GET /api/analytics/conversion-funnel` - Funnel data
- `GET /api/analytics/top-tenants` - Top performers
- `GET /api/analytics/recent-activity` - Activity feed

### Tenant Service (Port 3003)
- `GET /api/tenants` - Get all tenants
- `GET /api/tenants/:id` - Get single tenant
- `POST /api/tenants` - Create tenant
- `PATCH /api/tenants/:id` - Update tenant

## Type Safety

All data models are fully typed in `types/index.ts`:
- Lead, Tenant, Call types
- Analytics data types (DashboardMetrics, LeadTrendData, etc.)
- API response wrappers
- Enum types for statuses, sources, etc.

## Customization

### Adding New Routes

1. Create a new page in `app/(dashboard)/your-route/page.tsx`
2. Add navigation item to `components/layout/Sidebar.tsx`
3. Component will automatically use the dashboard layout

### Adding New API Endpoints

1. Add API function to `lib/api.ts`
2. Create TanStack Query hook in `lib/queries.ts`
3. Use the hook in your component

### Styling

- Modify CSS variables in `app/globals.css` for theme customization
- Tailwind config in `tailwind.config.ts`
- All components use `cn()` utility for class merging

## Dark Mode

Dark mode is implemented using Tailwind's `dark:` variant. Toggle in the top navigation bar. Preferences are stored in browser storage.

## Performance Optimizations

- TanStack Query caching reduces API calls
- Automatic background refetching keeps data fresh
- Recharts lazy loads chart components
- Image optimization with Next.js Image component (when added)
- Route-based code splitting with App Router

## Next Steps

1. **Connect Backend Services**: Start the lead-service and other microservices
2. **Authentication**: Configure NextAuth.js for user login
3. **Real Data**: Replace mock data with actual API calls
4. **Advanced Features**:
   - Real-time updates with WebSockets
   - Export functionality (CSV, PDF)
   - Advanced filtering and search
   - Bulk operations
   - Role-based access control

## Dependencies

Key production dependencies:
- `next@^15.1.6` - React framework
- `react@^19.0.0` - UI library
- `@tanstack/react-query@^5.62.14` - Data fetching
- `recharts@^2.15.0` - Charts
- `tailwindcss@^3.4.17` - Styling
- `lucide-react@^0.468.0` - Icons
- `date-fns@^4.1.0` - Date utilities

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

This is part of the Next Level Real Estate platform. See main project CLAUDE.md for architecture details and development guidelines.

## License

Proprietary - Next Level Real Estate Platform
