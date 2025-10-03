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
  - `app/auth/` - Supabase authentication pages (login, callback)
  - `app/profile/` - User profile management
  - `app/api/` - Next.js API routes for data operations
    - `app/api/customers/` - Customer CRUD operations
    - `app/api/licenses/` - License management operations
    - `app/api/modules/` - Module listing operations
    - `app/api/reports/` - Report management operations
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
  - `lib/sqlite-data-provider.ts` - **Active**: SQLite data provider via API routes
  - `lib/supabase-auth-provider.ts` - **Active**: Supabase authentication provider
  - `lib/db/sqlite.ts` - SQLite database utilities and helpers
  - `lib/supabase/client.ts` - Supabase client configuration
  - `lib/supabase/server.ts` - Server-side Supabase utilities
  - `lib/data-provider.ts` - Fake data provider (development alternative)
  - `lib/auth-provider.ts` - Fake auth provider (development alternative)
  - `lib/fastapi-data-provider.ts` - FastAPI data provider (Python backend alternative)
  - `lib/fastapi-auth-provider.ts` - FastAPI auth provider (Python backend alternative)
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
- better-sqlite3 for SQLite database operations
- Custom SQLite data provider via Next.js API routes
- @tanstack/react-query for data fetching and caching
- Custom hooks (useGetList, useGetOne, etc.) from ra-core

**Authentication:**
- @supabase/supabase-js for authentication
- @supabase/ssr for server-side rendering support
- Supabase Auth with email/password authentication

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
- **Login System**: Supabase Auth with email/password
  - Login page: `app/auth/login/page.tsx`
  - Callback handling: `app/auth/callback/route.ts`
  - User profile: `app/profile/page.tsx`
- **Session Management**: Server-side cookies via Supabase SSR
- **Route Protection**: AuthGuard component for protected routes
- **User Management**: Profile editing and user information display

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

### Current Setup (Active)

**Database: SQLite with better-sqlite3**
- **Data Provider**: SQLite data provider via Next.js API routes
  - File: `lib/sqlite-data-provider.ts`
  - Database: `data/formulafinance.db` (persistent SQLite database)
  - API Routes: `app/api/customers/`, `app/api/licenses/`, `app/api/modules/`, `app/api/reports/`
  - Database utilities: `lib/db/sqlite.ts`
  - Schema: See database migration files or API route implementations

- **Auth Provider**: Supabase authentication
  - File: `lib/supabase-auth-provider.ts`
  - Supabase client: `lib/supabase/client.ts`
  - Server-side auth: `lib/supabase/server.ts`
  - Authentication flow: Email/password with Supabase Auth
  - Session management: Server-side cookies via Supabase
  - Configuration: See `docs/SUPABASE_SETUP.md`

**API Routes Structure:**
- `app/api/customers/route.ts` - GET (list), POST (create)
- `app/api/customers/[id]/route.ts` - GET (one), PUT (update), DELETE
- `app/api/licenses/route.ts` - GET (list), POST (create)
- `app/api/licenses/[id]/route.ts` - GET (one), PUT (update), DELETE
- `app/api/modules/route.ts` - GET (list modules)
- `app/api/reports/route.ts` - GET (list), POST (create)
- `app/api/reports/[id]/route.ts` - GET (one), PUT (update), DELETE

### Alternative Setup Options

**Option 1: Fake Data (Development Only)**
- File: `lib/data-provider.ts` + `lib/auth-provider.ts`
- In-memory data with `ra-data-fakerest`
- Fake auth with hardcoded credentials
- Good for: UI development, prototyping

**Option 2: FastAPI Backend (Production Ready)**
- Files: `lib/fastapi-data-provider.ts` + `lib/fastapi-auth-provider.ts`
- REST API integration with FastAPI backend
- JWT token authentication
- Good for: Python backend integration

### Switching Data/Auth Providers

Update `lib/ra-core-config.tsx`:

```typescript
// Current (SQLite + Supabase):
import { sqliteDataProvider as dataProvider } from './sqlite-data-provider';
import { supabaseAuthProvider as authProvider } from './supabase-auth-provider';

// For fake data (development):
import { dataProvider } from './data-provider';
import { authProvider } from './auth-provider';

// For FastAPI backend:
import { fastApiDataProvider as dataProvider } from './fastapi-data-provider';
import { fastApiAuthProvider as authProvider } from './fastapi-auth-provider';
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

**Current Phase**: Active Development with SQLite + Supabase

**Completed Features**:
- ✅ **Database Layer**: SQLite with better-sqlite3 (`data/formulafinance.db`)
- ✅ **API Routes**: Full CRUD operations via Next.js API routes
- ✅ **Authentication**: Supabase Auth with email/password
- ✅ **Customer Management**: Complete CRUD operations with persistent storage
  - Multi-step customer creation form with validation
  - Customer listing with pagination and search
  - Customer detail view with license management
  - Customer editing functionality
- ✅ **License Management**: Full license assignment and tracking system
  - Create new licenses with product selection, quantity, and date ranges
  - Edit existing licenses (modify quantity, usage, dates)
  - Delete/revoke licenses
  - License usage cards with progress bars and status indicators
  - Automatic calculation of remaining licenses
  - Expiration warnings and status badges
- ✅ **Report Management**: Report request and viewing system
- ✅ **Dashboard**: Data visualization with Recharts
- ✅ **Responsive UI**: Sidebar navigation with shadcn/ui
- ✅ **Form Validation**: react-hook-form with Zod schemas
- ✅ **User Profile**: Profile page with user information

**Recent Fixes**:
- ✅ Fixed license assignment dialog - replaced demo version with functional implementation
- ✅ Added edit mode support to license dialog with pre-populated data
- ✅ Implemented quantity_used field in license management
- ✅ Added license update API integration (PUT /api/licenses/[id])
- ✅ Fixed license persistence after customer edits
- ✅ Added missing command.tsx shadcn/ui component
- ✅ License usage calculations now working correctly

**Known Issues**:
- ⚠️ Auth session warnings in console (Supabase session management)
- ⚠️ Profile page needs Supabase user data integration

**Next Steps**:
1. Add more report types and processing logic
2. Enhance dashboard with real-time data
3. Implement role-based access control (RBAC)
4. Add data export functionality
5. Improve error handling and user feedback
6. Add license revocation with confirmation
7. Implement license history/audit trail
8. Add bulk license operations

**Alternative Backend Options**:
- FastAPI backend integration available (`lib/fastapi-data-provider.ts`)
- Fake data provider for UI development (`lib/data-provider.ts`)