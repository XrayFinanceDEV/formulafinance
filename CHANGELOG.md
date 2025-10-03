# Changelog

All notable changes to the FormulaFinance project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **User License Dashboard** (2025-10-03)
  - Added `/api/user-licenses` endpoint for fetching user's licenses
    - Authenticates current Supabase user
    - Finds all customers owned by user via `owner_user_id`
    - Returns licenses with nested module information
  - Enhanced profile page (`/profile`) for cliente and potenziale users:
    - Added licenses table view replacing card-based display
    - Table columns: Prodotto, Stato, Disponibili, Utilizzate, Totali, Utilizzo, Scadenza
    - Real-time license consumption tracking
    - Visual indicators:
      - Status badges (Attiva/Scaduta/In scadenza/Sospesa)
      - Color-coded available licenses (green/red)
      - Progress bars showing usage percentage
      - Warning icons for expiring/expired licenses
    - Role-based visibility (only cliente and potenziale users see licenses)
  - License consumption integrated with report creation:
    - `quantity_used` auto-increments when reports are created
    - License validation before report creation
    - Automatic license limit enforcement

### Fixed

- **License Management System** (2025-10-03)
  - Replaced `LicenseAssignmentDialogDemo` with functional `LicenseAssignmentDialog`
  - Added edit mode support to license dialog:
    - `existingLicense` prop for pre-populating dialog with existing data
    - Separate UI states for create vs edit modes (different titles, buttons)
    - `useEffect` hook to populate form fields when editing
  - Enhanced license dialog functionality:
    - Added `quantity_used` field (editable alongside `quantity_total`)
    - Real-time calculation of remaining licenses display
    - Support for both CREATE (POST /api/licenses) and UPDATE (PUT /api/licenses/[id]) operations
    - Added `useUpdateLicense` hook from `hooks/use-licenses-query.ts`
  - Fixed license persistence after customer edits:
    - Dialog properly resets `editingLicense` state on close
    - License refetch triggered after create/update operations
    - Updated `customer-detail-form.tsx` to pass `existingLicense` prop
  - Fixed license usage calculations:
    - `getLicenseUsagePercentage()` now correctly calculates percentage
    - `getRemainingLicenses()` returns accurate remaining count
    - Progress bars display correct usage status
  - Added missing `command.tsx` shadcn/ui component:
    - Installed via `npx shadcn@latest add command`
    - Required by `association-selector.tsx` for customer associations
    - Fixed module resolution errors in customer edit page
  - Components updated:
    - `components/license-assignment-dialog.tsx` - Full edit mode support
    - `components/customer-detail-form.tsx` - Integrated real dialog
    - `components/license-usage-card.tsx` - Accurate usage display

### Added

- **Role-Based Access Control (RBAC) System** (2025-10-03)
  - Database migration: `002_add_rbac.sql`
    - `user_roles` table: Maps Supabase users to roles (5 role types)
    - `user_associations` table: Hierarchical user relationships (resellers/intermediaries → customers)
    - Added `owner_user_id` columns to `customers` and `reports` tables
  - Authorization system:
    - `lib/auth/authorization.ts` - Server-side authorization utilities
    - `lib/supabase/admin.ts` - Supabase admin client for service role operations
    - `types/rbac.ts` - TypeScript type definitions for RBAC
  - User roles implemented:
    - `cliente` - End customer (own data only)
    - `potenziale` - Potential customer (limited access)
    - `rivenditore` - Reseller (manages associated customers)
    - `intermediario` - Intermediary (manages associated customers)
    - `superadmin` - Full system access
  - Route protection:
    - `middleware.ts` - Next.js middleware for automatic route protection
    - `/unauthorized` page - Displayed when not logged in
    - `/forbidden` page - Displayed when lacking permissions
  - Client-side auth:
    - `lib/auth/auth-provider.tsx` - Auth context provider
    - `lib/auth/hooks.ts` - React hooks for auth state and permissions
  - Tools and scripts:
    - `scripts/run-migration.ts` - Database migration runner
    - `scripts/assign-admin-role.ts` - Assign superadmin role to users
    - npm scripts: `db:migrate`, `assign-admin`
  - Documentation:
    - `docs/RBAC_IMPLEMENTATION.md` - Detailed technical documentation
    - `docs/SUPABASE_RBAC_SETUP.md` - Step-by-step setup guide
  - Access control matrix with granular permissions per role
  - ✅ **INTEGRATED**: Fully integrated into application with backwards compatibility

- **RBAC Integration Complete** (2025-10-03)
  - Migrated from `lib/auth-context.tsx` to `lib/auth/auth-provider.tsx`
  - AuthProvider now fetches roles from database via `/api/auth/role` endpoint
  - Updated all components to use new RBAC auth provider:
    - `app/layout.tsx` - Uses RBAC AuthProvider
    - `app/page.tsx` - Updated import
    - `app/profile/page.tsx` - Updated import
    - `components/auth-guard.tsx` - Updated import
    - `components/customers-table-enhanced.tsx` - Updated import
    - `components/nav-user.tsx` - Fixed import to use RBAC auth provider
    - `components/login-form.tsx` - Fixed import to use RBAC auth provider
  - Created `/api/auth/role` endpoint for role fetching
  - Backwards compatible with old auth context API
  - Admin user configured: admin@xrayfinance.it (superadmin)
  - Service role key added to environment
  - All verification checks passing
  - **TESTED**: Playwright MCP testing completed successfully ✅
    - Login system verified
    - Role loading from database confirmed
    - Permissions display working correctly
    - No console errors
    - Full superadmin access to customers page confirmed

### Changed
- **BREAKING: Migrated from ra-core to @tanstack/react-query** (2025-10-02)
  - Removed ra-core, ra-data-fakerest, and related dependencies (~150KB bundle reduction)
  - Created custom React Query infrastructure:
    - `lib/query-client-provider.tsx` - QueryProvider with optimized defaults and DevTools
    - `lib/query-keys.ts` - Type-safe query key factory for consistent caching
    - `lib/api-client.ts` - Centralized fetch wrapper with error handling
  - Migrated all data hooks to React Query:
    - `hooks/use-customers-query.ts` - Customer CRUD operations
    - `hooks/use-licenses-query.ts` - License management with helper utilities
    - `hooks/use-reports-query.ts` - Report operations
    - `hooks/use-modules-query.ts` - Module data fetching
  - Created `lib/auth-context.tsx` - Replaced ra-core auth provider with React Context
    - Added `useAuth()` and `usePermissions()` hooks
    - Full Supabase integration maintained
  - Updated all components to use new hooks and auth context
  - Removed old provider files: ra-core-config, data-provider, auth-provider, sqlite-data-provider, fastapi providers
  - Fixed API client URL construction bug (proper base URL handling)
  - Benefits: No routing conflicts with Next.js App Router, smaller bundle, better TypeScript support, simpler code

### Added
- Initial project setup with Next.js 15, React 19, and TypeScript
- shadcn/ui component system with "new-york" variant
- SQLite database integration with better-sqlite3
- Supabase authentication with email/password and OAuth support
- Customer management system with full CRUD operations
  - Multi-step customer creation form with validation
  - Customer listing with pagination and search
  - Customer detail view with comprehensive information
  - Customer editing functionality
- License management system
  - License assignment to customers
  - License usage tracking
  - Module/product selection
  - Activation and expiration date tracking
- Report management system
  - Report request functionality
  - Report status tracking (pending, processing, completed, failed)
  - Report detail views
- Dashboard with data visualization using Recharts
- Custom hooks for data fetching using @tanstack/react-query
- Route protection with AuthGuard component
- User profile management
- Italian localization throughout the application
- Responsive sidebar navigation
- Form validation with react-hook-form and Zod
- CHANGELOG.md for tracking project changes

### Fixed
- Customer creation form now correctly saves data to SQLite database
- Form data mapping updated to match database schema (snake_case conversion)
- Data persistence verified in SQLite database
- API client URL construction bug (fixed proper base URL + endpoint concatenation)
- Missing React Query DevTools in development mode
- **RBAC Permission System** (2025-10-03)
  - Fixed `ROLE_PERMISSIONS` type mismatch in `types/rbac.ts`
  - Changed from object-based permissions (boolean properties) to array-based permissions (string array)
  - Now properly supports granular permissions: `'customers:read'`, `'customers:create'`, `'customers:update'`, `'customers:delete'`, etc.
  - Fixed `hasPermission()` function to work with permission arrays
  - Resolved "includes is not a function" TypeError

### Known Issues
- Auth session warnings in console (Supabase session management)
- Profile page needs Supabase user data integration
- License revocation handler in customer-detail-form needs API implementation

## [0.1.0] - 2025-01-XX

### Added
- Initial project scaffolding with create-next-app
- Basic project structure and configuration
- Development tooling setup (ESLint, TypeScript, Tailwind CSS)

---

## Development Notes

### Version History Format

Each version entry should include:
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Now removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability fixes

### Next Planned Release

Track upcoming features for the next release:
1. Add more report types and processing logic
2. Enhance dashboard with real-time data
3. Add data export functionality
4. Improve error handling and user feedback
5. Implement license revocation with confirmation
6. Add license history/audit trail
7. Add bulk license operations
8. Implement license usage tracking from reports
