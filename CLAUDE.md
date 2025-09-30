# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (uses Turbo for faster builds)
- **Production build**: `npm run build` (also uses Turbo)
- **Start production**: `npm start`
- **Linting**: `npm run lint` (ESLint configured)

## Architecture Overview

This is a **Next.js 15 App Router** application with the following structure:

- **Framework**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **UI Components**: Built with Radix UI primitives and shadcn/ui system
- **Icons**: Lucide React and Tabler Icons
- **Data Visualization**: Recharts for charts and interactive visualizations
- **Data Management**: React-admin (ra-core) for data fetching, caching, and state management

### Key Directories

- `app/` - Next.js App Router pages and layouts
  - `app/dashboard/` - Main dashboard page with financial data visualization
  - `app/customers/` - Customer management (list, create, edit, detail views)
  - `app/reports/` - Report management (list, create, detail views)
  - `app/login/` - Authentication page
- `components/` - Reusable UI components
  - `components/ui/` - shadcn/ui base components (button, table, dialog, calendar, progress, etc.)
  - `components/app-sidebar.tsx` - Main navigation sidebar
  - `components/site-header.tsx` - Page header with breadcrumbs
  - `components/auth-guard.tsx` - Route protection component
  - `components/customer-form.tsx` - Customer creation form
  - `components/customer-detail-form.tsx` - Customer detail/edit form
  - `components/license-assignment-dialog.tsx` - License assignment modal
  - `components/license-usage-card.tsx` - License usage visualization
  - `components/customers-table-enhanced.tsx` - Advanced customer table with actions
- `lib/` - Utilities and providers
  - `lib/utils.ts` - Utility functions (e.g., `cn()` for className merging)
  - `lib/ra-core-config.tsx` - React-admin CoreAdmin wrapper and configuration
  - `lib/data-provider.ts` - Fake data provider using `ra-data-fakerest` (for development)
  - `lib/fastapi-data-provider.ts` - FastAPI data provider (ready for production backend)
  - `lib/auth-provider.ts` - Fake authentication provider (for development)
  - `lib/fastapi-auth-provider.ts` - FastAPI auth provider (ready for production backend)
  - `lib/products-data.ts` - Product/module definitions and mock data
- `hooks/` - Custom React hooks
  - `hooks/use-customers.ts` - Customer data fetching via ra-core
  - `hooks/use-licenses.ts` - License data fetching
  - `hooks/use-products.ts` - Product data fetching
  - `hooks/use-modules.ts` - Module data fetching
  - `hooks/use-reports.ts` - Report data fetching
  - `hooks/use-toast.ts` - Toast notification hook
- `types/` - TypeScript type definitions
  - `types/auth.ts` - User, License, Product, and authentication types
  - `types/reports.ts` - Report and report status types
  - `types/modules.ts` - Module-related types

### Component Architecture

The dashboard follows a sidebar + main content layout pattern:
- `SidebarProvider` wraps the entire dashboard
- `AppSidebar` provides navigation (variant="inset")
- `SidebarInset` contains the main content area
- Main content includes: `SiteHeader`, `SectionCards`, `ChartAreaInteractive`, `DataTable`

### Technology Stack

**Core Dependencies:**
- Next.js 15 with Turbo
- React 19
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui component system

**UI & Interaction:**
- @radix-ui/* primitives for accessible components
- @dnd-kit/* for drag and drop functionality
- @tanstack/react-table for data tables
- next-themes for theme management
- Recharts for data visualization
- Sonner for toast notifications
- react-hook-form with Zod for form validation
- date-fns for date manipulation
- react-day-picker for date selection

**Data Management:**
- ra-core (react-admin core) for data provider pattern
- ra-data-fakerest for development (fake in-memory data)
- ra-data-simple-rest for REST API integration
- Custom FastAPI data provider ready for production backend
- Custom hooks (useGetList, useGetOne, etc.) from ra-core
- @tanstack/react-query for data fetching and caching

**Development:**
- ESLint with Next.js config
- Path mapping: `@/*` points to project root

### shadcn/ui Configuration

Components are configured in `components.json`:
- Style: "new-york" variant
- Base color: "neutral"
- CSS variables enabled
- Icons: Lucide React
- Aliases set for `@/components`, `@/lib`, `@/hooks` etc.

Use `npx shadcn add [component-name]` to add new shadcn/ui components.

## Application Features

### Customer Management
- **Customer List**: Browse all customers with search and filter capabilities
- **Customer Detail**: View comprehensive customer information including:
  - Business details (business name, VAT, tax code, subject category)
  - Contact information (email, phone, PEC)
  - Address details
  - License assignments and usage tracking
- **Customer Creation**: Add new customers with form validation
- **Customer Editing**: Update customer information
- **License Assignment**: Assign product licenses to customers with:
  - Module/product selection
  - Quantity management
  - Activation and expiration date tracking
  - Usage tracking (used vs total licenses)

### Report Management
- **Report List**: View all requested reports with status indicators
  - Status types: pending, processing, completed, failed
  - Italian localization for labels and dates
- **Report Creation**: Request new reports by:
  - Selecting module/product
  - Entering input data (e.g., codice fiscale)
- **Report Detail**: View report results and generated content

### Authentication & Authorization
- **Login System**: Email/password authentication
- **Role-Based Access Control (RBAC)**:
  - `superuser`: Full system access
  - `commercial`: Customer and license management
  - `client`: Limited access to own data
- **Route Protection**: AuthGuard component for protected routes
- **Session Management**: Token-based authentication ready for production

### Dashboard & Analytics
- **Financial Dashboard**: Main dashboard with data visualization
- **Interactive Charts**: Recharts-powered visualizations
- **Section Cards**: Summary cards for key metrics
- **Data Tables**: Sortable and filterable tables

## Data Layer Architecture

### React-admin (ra-core) Integration

The application uses **ra-core** (react-admin's headless core) for data management:

- **Data Provider Pattern**: Abstraction layer for API communication
- **Auth Provider Pattern**: Handles authentication and authorization
- **Hooks**: `useGetList`, `useGetOne`, `useCreate`, `useUpdate`, `useDelete` from ra-core
- **Resources**: Currently configured: `customers`, `licenses`, `products`, `modules`, `reports`

### Current Setup (Development)

- **Data Provider**: `ra-data-fakerest` with in-memory fake data
  - File: `lib/data-provider.ts`
  - Data sources: Mock data in `lib/products-data.ts` and inline data
  - Network delay: 300ms simulation
  - Request logging: Enabled
  - Resources: customers, licenses, products, modules, reports

- **Auth Provider**: Fake auth provider for development
  - File: `lib/auth-provider.ts`
  - Hardcoded credentials for testing
  - Test users: demo@example.com / admin@example.com
  - Role-based access control (superuser, commercial, client)

### Production Setup (Ready)

- **Data Provider**: Custom FastAPI adapter
  - File: `lib/fastapi-data-provider.ts`
  - Expects FastAPI conventions: `skip`/`limit`, `{ items: [], total: number }`
  - Bearer token authentication
  - Error handling with auto-redirect on 401/403

- **Auth Provider**: FastAPI auth adapter
  - File: `lib/fastapi-auth-provider.ts`
  - JWT token management
  - LocalStorage token persistence

### Switching to Production

To connect to the FastAPI backend, update `lib/ra-core-config.tsx`:

```typescript
// Change from:
import { dataProvider } from './data-provider';
import { authProvider } from './auth-provider';

// To:
import { fastApiDataProvider as dataProvider } from './fastapi-data-provider';
import { fastApiAuthProvider as authProvider } from './fastapi-auth-provider';
```

Set environment variable:
```
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api/v1
```

## Development Best Practices

### Component Patterns
- Use `'use client'` directive for components with interactivity
- Wrap pages requiring authentication with `<AuthGuard>`
- Use consistent layout pattern: `SidebarProvider` → `AppSidebar` → `SidebarInset` → `SiteHeader`
- Leverage shadcn/ui components for consistent UI

### Data Fetching
- Use custom hooks from `hooks/` directory for data operations
- Hooks follow react-admin patterns: `useGetList`, `useGetOne`, `useCreate`, `useUpdate`, `useDelete`
- Data is automatically cached and refetched via react-query
- Example:
  ```typescript
  const { data: customers, isLoading } = useCustomers();
  const { data: customer } = useGetOne('customers', { id: customerId });
  ```

### Form Management
- Use react-hook-form with Zod for validation
- Leverage shadcn/ui form components for consistent styling
- Example forms: `customer-form.tsx`, `customer-detail-form.tsx`

### TypeScript
- Type definitions in `types/` directory
- Use proper types from `types/auth.ts` and `types/reports.ts`
- Leverage TypeScript for type safety across the application

### Styling
- Use Tailwind CSS utility classes
- Follow shadcn/ui design system
- Use `cn()` utility from `lib/utils.ts` for conditional classes
- CSS variables for theming

### Localization
- Italian localization used throughout (labels, dates, messages)
- Date formatting with `date-fns` or `toLocaleString('it-IT')`
- Status labels in Italian (e.g., "In Attesa", "Completato")

## Project Status

**Current Phase**: Development with mock data

**Completed Features**:
- ✅ Customer management (CRUD operations)
- ✅ License management and assignment
- ✅ Report request and viewing system
- ✅ Authentication and role-based access control
- ✅ Dashboard with data visualization
- ✅ Responsive sidebar navigation
- ✅ Form validation and error handling

**Ready for Production**:
- ✅ FastAPI data provider implementation
- ✅ FastAPI auth provider implementation
- ✅ TypeScript type definitions
- ✅ Error handling and loading states

**Next Steps**:
1. Connect to FastAPI backend (update `lib/ra-core-config.tsx`)
2. Set up environment variables for API URL
3. Test all CRUD operations with real backend
4. Implement additional report types
5. Add more data visualizations to dashboard