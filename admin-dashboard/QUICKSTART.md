# Quick Start Guide

## Installation & Setup

### 1. Install Dependencies

```bash
cd /home/onesmartguy/projects/next-level-real-estate/admin-dashboard
npm install
```

### 2. Configure Environment

Create `.env.local` from the example:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your backend service URLs:

```env
NEXT_PUBLIC_LEAD_SERVICE_URL=http://localhost:3000
NEXT_PUBLIC_CALLING_SERVICE_URL=http://localhost:3001
NEXT_PUBLIC_ANALYTICS_SERVICE_URL=http://localhost:3002
NEXT_PUBLIC_TENANT_SERVICE_URL=http://localhost:3003
```

### 3. Run Development Server

```bash
npm run dev
```

The dashboard will be available at **http://localhost:3100**

## Project Overview

### Pages Implemented

1. **Dashboard** (`/`) - Main overview with metrics, charts, and activity
2. **Leads** (`/leads`) - Lead management and tracking
3. **Tenants** (`/tenants`) - Customer account management
4. **Analytics** (`/analytics`) - Placeholder for detailed analytics
5. **Logs** (`/logs`) - Placeholder for system logs
6. **Settings** (`/settings`) - System configuration

### Key Features

- Real-time metrics with TanStack Query auto-refetch
- Responsive charts using Recharts
- Dark mode toggle
- Collapsible sidebar navigation
- Type-safe API client
- Loading states and error handling

## Backend API Requirements

The dashboard expects the following REST APIs to be available:

### Lead Service (Port 3000)

```
GET    /api/leads          - List all leads
GET    /api/leads/:id      - Get single lead
POST   /api/leads          - Create lead
PATCH  /api/leads/:id      - Update lead
DELETE /api/leads/:id      - Delete lead
GET    /health             - Health check
```

### Analytics Service (Port 3002)

```
GET /api/analytics/dashboard          - Dashboard metrics
GET /api/analytics/lead-trends        - Lead trends (30 days)
GET /api/analytics/leads-by-source    - Source breakdown
GET /api/analytics/conversion-funnel  - Funnel data
GET /api/analytics/top-tenants        - Top performers
GET /api/analytics/recent-activity    - Activity feed
GET /health                           - Health check
```

### Expected Response Format

All APIs should return:

```typescript
{
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

## Development Tips

### Testing Without Backend

The dashboard will gracefully handle missing backend services by:
- Showing loading states
- Displaying "No data available" messages
- Allowing UI navigation and interaction

### Adding Mock Data

To test with mock data, you can modify the API client in `lib/api.ts` to return mock responses when backend is unavailable.

### Customizing Styles

- **Colors**: Edit CSS variables in `app/globals.css`
- **Components**: Modify shadcn components in `components/ui/`
- **Layout**: Adjust `components/layout/Sidebar.tsx` and `TopNav.tsx`

### Adding New Features

1. **New Page**: Create in `app/(dashboard)/your-page/page.tsx`
2. **New API**: Add to `lib/api.ts` and create query hook in `lib/queries.ts`
3. **New Component**: Add to `components/` with appropriate subfolder

## Troubleshooting

### Port Already in Use

If port 3100 is taken, change it in `package.json`:

```json
"dev": "next dev -p 3101"
```

### TypeScript Errors

Run type checking:

```bash
npx tsc --noEmit
```

### Build Errors

Ensure all dependencies are installed:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. **Start Backend Services**: Launch lead-service and analytics-service
2. **Test API Integration**: Verify data flows correctly
3. **Add Authentication**: Configure NextAuth.js
4. **Deploy**: Build and deploy to production

```bash
npm run build
npm start
```

## Resources

- [Next.js 15 Docs](https://nextjs.org/docs)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
