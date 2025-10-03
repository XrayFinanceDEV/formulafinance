# RBAC Implementation Guide

## Overview

FormulaFinance now has a comprehensive Role-Based Access Control (RBAC) system implemented with 5 distinct user roles, each with specific permissions and data visibility.

## User Roles

### 1. Cliente (Customer)
- Can only view their own account
- Can only view their own reports
- Cannot access customer list
- Cannot perform admin actions

### 2. Potenziale (Potential Customer)
- Same permissions as Cliente
- Can only view their own account and reports

### 3. Rivenditore (Reseller)
- Can view their own account
- Can view accounts of associated customers
- Can view customer list (filtered)
- Can view reports of associated customers

### 4. Intermediario (Intermediary)
- Same permissions as Rivenditore
- Can view their own account
- Can view accounts of associated customers
- Can view customer list (filtered)

### 5. Superadmin
- Full access to all features
- Can view all customers and reports
- Can create new customers
- Can assign licenses
- Can manage user roles and associations

## Database Schema

### Tables Created

#### `user_roles`
```sql
CREATE TABLE user_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  role TEXT CHECK(role IN ('cliente', 'potenziale', 'rivenditore', 'intermediario', 'superadmin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);
```

#### `user_associations`
```sql
CREATE TABLE user_associations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_user_id TEXT NOT NULL,
  child_user_id TEXT NOT NULL,
  association_type TEXT CHECK(association_type IN ('reseller', 'intermediary')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  UNIQUE(parent_user_id, child_user_id)
);
```

#### Updated Tables
- `customers`: Added `owner_user_id` column
- `reports`: Added `owner_user_id` column

## Implementation Files

### Core Files

1. **Database Migration**
   - `data/migrations/002_add_rbac.sql` - RBAC schema migration
   - `scripts/run-migration.ts` - Migration runner script

2. **Authorization Layer**
   - `lib/auth/authorization.ts` - Core authorization logic
   - `lib/supabase/admin.ts` - Supabase admin client for role management
   - `types/rbac.ts` - TypeScript type definitions and permissions

3. **Middleware**
   - `middleware.ts` - Route protection based on roles

4. **Client Hooks & Context**
   - `lib/auth/hooks.ts` - React hooks for checking permissions
   - `lib/auth/auth-provider.tsx` - Auth context provider

5. **Error Pages**
   - `app/unauthorized/page.tsx` - No role assigned
   - `app/forbidden/page.tsx` - Insufficient permissions

## Route Permissions

```typescript
const ROUTE_PERMISSIONS = {
  '/dashboard': ['all roles'],
  '/customers': ['rivenditore', 'intermediario', 'superadmin'],
  '/customers/new': ['superadmin'],
  '/customers/[id]/edit': ['superadmin'],
  '/reports': ['all roles'],
  '/licenses': ['superadmin'],
}
```

## Usage Examples

### Server-Side (API Routes)

```typescript
import { getAuthContext, canAccessCustomer } from '@/lib/auth/authorization'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const supabase = createServerClient(...)
  const { data: { user } } = await supabase.auth.getUser()

  // Get auth context
  const authContext = await getAuthContext(user)

  // Check if user can access specific customer
  const hasAccess = await canAccessCustomer(authContext, customerOwnerId)

  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ... rest of your code
}
```

### Client-Side (React Components)

```typescript
'use client'

import { useAuth, useIsSuperadmin, useCanViewCustomerList } from '@/lib/auth/hooks'

export function MyComponent() {
  const { user, role, loading } = useAuth()
  const isSuperadmin = useIsSuperadmin()
  const canViewCustomers = useCanViewCustomerList()

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <p>Role: {role}</p>
      {isSuperadmin && <AdminPanel />}
      {canViewCustomers && <CustomerList />}
    </div>
  )
}
```

### Using Auth Context Provider

```typescript
'use client'

import { useAuthContext } from '@/lib/auth/auth-provider'

export function MyComponent() {
  const { user, role, permissions, isAuthenticated, signOut } = useAuthContext()

  return (
    <div>
      {permissions?.canCreateCustomers && (
        <Button>Create Customer</Button>
      )}
      {permissions?.canAssignLicenses && (
        <Button>Assign License</Button>
      )}
    </div>
  )
}
```

## Setting Up User Roles

### 1. Via API (Recommended for Superadmin)

```typescript
import { setUserRole, createUserAssociation } from '@/lib/auth/authorization'

// Assign role to user
await setUserRole(userId, 'rivenditore', adminUserId)

// Create association (reseller -> customer)
await createUserAssociation(resellerUserId, customerUserId, 'reseller', adminUserId)
```

### 2. Via Database (Initial Setup)

```sql
-- Create superadmin role
INSERT INTO user_roles (user_id, role)
VALUES ('your-supabase-user-id', 'superadmin');

-- Create reseller role
INSERT INTO user_roles (user_id, role)
VALUES ('reseller-user-id', 'rivenditore');

-- Associate customer with reseller
INSERT INTO user_associations (parent_user_id, child_user_id, association_type)
VALUES ('reseller-user-id', 'customer-user-id', 'reseller');
```

## Environment Variables Required

Make sure to add the following to your `.env.local`:

```env
# Existing variables
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# NEW: Required for admin operations
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

⚠️ **IMPORTANT**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client!

## Next Steps

1. **Update API Routes**: Add authorization checks to all API routes
   - `app/api/customers/route.ts`
   - `app/api/reports/route.ts`
   - `app/api/licenses/route.ts`

2. **Update UI Components**: Add role-based rendering
   - Hide/show buttons based on permissions
   - Filter data based on user role
   - Show appropriate error messages

3. **Create Admin Panel**: For managing users and roles
   - User list with role assignment
   - User association management
   - Audit log viewing

4. **Testing**:
   - Test each role's access to routes
   - Test data visibility for each role
   - Test user associations
   - Test edge cases (no role, invalid role)

## Access Control Matrix

| Resource | Cliente | Potenziale | Rivenditore | Intermediario | Superadmin |
|----------|---------|------------|-------------|---------------|------------|
| Own account | ✓ | ✓ | ✓ | ✓ | ✓ |
| Own reports | ✓ | ✓ | ✓ | ✓ | ✓ |
| Associated customers | ✗ | ✗ | ✓ | ✓ | ✓ |
| All customers | ✗ | ✗ | ✗ | ✗ | ✓ |
| Create customers | ✗ | ✗ | ✗ | ✗ | ✓ |
| Assign licenses | ✗ | ✗ | ✗ | ✗ | ✓ |
| Manage users | ✗ | ✗ | ✗ | ✗ | ✓ |

## Security Best Practices

1. **Always verify on the server**: Never trust client-side role checks alone
2. **Use middleware for route protection**: Prevent unauthorized access before rendering
3. **Filter data at the database level**: Use owner_user_id and associations to filter queries
4. **Audit logging**: Track who creates/modifies roles and associations
5. **Regular security reviews**: Periodically audit user roles and permissions

## Troubleshooting

### User stuck on unauthorized page
- Check if role exists in `user_roles` table
- Verify role is synced to Supabase user metadata
- Check Supabase dashboard for user's `app_metadata`

### User can't access their own data
- Verify `owner_user_id` is set correctly on records
- Check if user role is properly assigned
- Verify authorization logic in API routes

### Middleware redirecting incorrectly
- Check route patterns in `ROUTE_PERMISSIONS`
- Verify dynamic route matching logic
- Check if user session is valid

## Support

For issues or questions, refer to:
- Main documentation: `CLAUDE.md`
- Supabase docs: https://supabase.com/docs
- Next.js middleware docs: https://nextjs.org/docs/app/building-your-application/routing/middleware
