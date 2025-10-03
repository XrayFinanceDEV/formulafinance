# Supabase RBAC Setup Guide

## Prerequisites

You already have Supabase authentication set up. Now we need to integrate the RBAC system.

## Step 1: Get Your Service Role Key

1. Go to your Supabase project: https://addlanvirroxsxcgmspd.supabase.co
2. Navigate to **Settings** → **API**
3. Copy the `service_role` key (NOT the anon key you're already using)

⚠️ **IMPORTANT**: The service role key bypasses RLS policies. Never expose it to the client!

## Step 2: Add Service Role Key to Environment

Add to your `.env.local` file:

```bash
# Existing keys (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://addlanvirroxsxcgmspd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Add this new key:
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 3: Assign Your First Admin Role

After adding the service role key, assign yourself as superadmin:

```bash
# First, log in to your app to create a Supabase user
# Then get your user ID from Supabase dashboard or profile page

# Run this to assign superadmin role:
npm run assign-admin -- YOUR_SUPABASE_USER_ID
```

Or manually via SQLite:

```bash
sqlite3 data/formulafinance.db
```

```sql
INSERT INTO user_roles (user_id, role, created_at, updated_at)
VALUES ('your-supabase-user-id', 'superadmin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
```

## Step 4: Verify RBAC Integration

The RBAC system integrates with your existing Supabase auth:

- **User Authentication**: Handled by Supabase (email/password)
- **User Roles**: Stored in local SQLite database (`user_roles` table)
- **Authorization**: Middleware checks both Supabase session AND user role

### Authentication Flow

1. User logs in via Supabase → Session created
2. Middleware checks if user has a role in `user_roles` table
3. If no role found → Redirect to `/unauthorized`
4. If role found but insufficient permissions → Redirect to `/forbidden`
5. If authorized → Allow access

## Step 5: Role Management

### Assign Roles to Users

Create a script or admin panel to assign roles:

```typescript
import { supabaseAdmin } from '@/lib/supabase/admin'
import Database from 'better-sqlite3'

const db = new Database('data/formulafinance.db')

// Assign role to user
db.prepare(`
  INSERT INTO user_roles (user_id, role)
  VALUES (?, ?)
  ON CONFLICT(user_id) DO UPDATE SET role = excluded.role, updated_at = CURRENT_TIMESTAMP
`).run(userId, role)
```

### Create User Associations

For resellers and intermediaries managing customers:

```sql
-- Reseller manages Customer
INSERT INTO user_associations (parent_user_id, child_user_id, association_type)
VALUES ('reseller-user-id', 'customer-user-id', 'reseller');

-- Intermediary manages Customer
INSERT INTO user_associations (parent_user_id, child_user_id, association_type)
VALUES ('intermediary-user-id', 'customer-user-id', 'intermediary');
```

## Step 6: Update App Layout

Wrap your app with the AuthProvider:

```tsx
// app/layout.tsx
import { AuthProvider } from '@/lib/auth/auth-provider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

## Step 7: Use Authorization in Components

### Client Components

```tsx
'use client'
import { useAuth } from '@/lib/auth/auth-provider'

export function MyComponent() {
  const { user, role, hasPermission, isLoading } = useAuth()

  if (isLoading) return <div>Loading...</div>
  if (!user) return <div>Not logged in</div>

  return (
    <div>
      <p>Role: {role}</p>
      {hasPermission('customers:create') && (
        <button>Create Customer</button>
      )}
    </div>
  )
}
```

### Server Components & API Routes

```tsx
// app/customers/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getUserRole, canAccessResource } from '@/lib/auth/authorization'

export default async function CustomersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const role = await getUserRole(user.id)
  const canView = await canAccessResource(user.id, role, 'customers', 'read')

  if (!canView) redirect('/forbidden')

  // ... rest of component
}
```

### API Routes

```tsx
// app/api/customers/route.ts
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authorizeRequest } from '@/lib/auth/authorization'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const authContext = await authorizeRequest(user, 'customers', 'read')
  if (!authContext) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Filter data based on role
  const customers = await getCustomersForRole(authContext)

  return Response.json(customers)
}
```

## Role Hierarchy & Permissions

| Role | Permissions |
|------|------------|
| **Superadmin** | Full access to everything |
| **Intermediario** | Manage associated customers, view own reports |
| **Rivenditore** | Manage associated customers, view own reports |
| **Cliente** | View own account, own reports |
| **Potenziale** | View own account, create demo reports |

## Troubleshooting

### User Has No Role After Login

1. Check if user exists in `user_roles` table
2. Assign a role using the script or SQL
3. User needs to log out and log back in

### Service Role Key Not Working

1. Verify key is correct in `.env.local`
2. Restart Next.js dev server: `npm run dev`
3. Check Supabase dashboard for key status

### Middleware Not Protecting Routes

1. Ensure `middleware.ts` is in project root
2. Check Next.js version supports middleware
3. Verify matcher configuration in middleware

## Security Best Practices

1. ✅ **Never expose service role key** - Only use server-side
2. ✅ **Always validate on server** - Client-side checks are for UX only
3. ✅ **Use prepared statements** - Prevent SQL injection
4. ✅ **Log authorization failures** - Monitor for suspicious activity
5. ✅ **Rotate service role key periodically** - Supabase dashboard
6. ✅ **Assign minimum required role** - Principle of least privilege

## Next Steps

1. Add service role key to `.env.local`
2. Assign yourself as superadmin
3. Test login and authorization
4. Create admin panel for role management
5. Update API routes to use authorization checks
6. Add user management UI for assigning roles
