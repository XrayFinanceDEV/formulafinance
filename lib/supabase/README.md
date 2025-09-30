# Supabase Authentication Integration

This directory contains the Supabase authentication integration for FormulaFinance.

## 📦 What's Included

### Files

- **`client.ts`** - Browser-side Supabase client
- **`server.ts`** - Server-side Supabase client (for Server Components)

### Integration Points

- **Auth Provider**: `lib/supabase-auth-provider.ts` - Implements ra-core AuthProvider interface
- **OAuth Callback**: `app/auth/callback/route.ts` - Handles OAuth provider redirects
- **Login Form**: `components/login-form.tsx` - Updated with OAuth buttons

## 🔑 Quick Setup

1. **Get your Supabase credentials** from:
   https://supabase.com/dashboard/project/addlanvirroxsxcgmspd/settings/api

2. **Update `.env.local`**:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://addlanvirroxsxcgmspd.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
   ```

3. **Configure OAuth providers** in Supabase Dashboard:
   - Navigate to Authentication > Providers
   - Enable Google, Apple, Facebook, etc.
   - Add credentials from provider consoles

4. **Test**:
   ```bash
   npm run dev
   ```
   Navigate to http://localhost:3000/login

## 🎯 Features

### Supported Authentication Methods

✅ **Email/Password** - Traditional login
✅ **Google OAuth** - Sign in with Google
✅ **Apple OAuth** - Sign in with Apple
✅ **Facebook OAuth** - Sign in with Facebook

### ra-core Integration

The auth provider implements all required ra-core methods:

```typescript
interface AuthProvider {
  login: (params) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  checkError: (error) => Promise<void>
  getIdentity: () => Promise<UserIdentity>
  getPermissions: () => Promise<any>
}
```

### Usage in Components

```typescript
import { useAuthProvider } from 'ra-core';

const MyComponent = () => {
  const authProvider = useAuthProvider();

  const handleLogin = async () => {
    await authProvider.login({ provider: 'google' });
  };

  const handleLogout = async () => {
    await authProvider.logout();
  };

  return (
    <button onClick={handleLogin}>Login with Google</button>
  );
};
```

## 🔐 Security

### Session Management

- Sessions stored in **HTTP-only cookies** (via `@supabase/ssr`)
- Automatic token refresh
- Secure by default

### User Data

User profile accessible via:
```typescript
const { data: { user } } = await supabase.auth.getUser();

console.log(user.id);        // Unique user ID
console.log(user.email);     // User email
console.log(user.user_metadata); // OAuth profile data
```

### Permissions

Permissions can be stored in `user_metadata` or a separate database table:

```typescript
// In auth provider
getPermissions: async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.role || 'user';
}
```

## 📝 Complete Setup Guide

See **`SUPABASE_SETUP.md`** in the project root for:
- Detailed Google OAuth setup
- Apple and Facebook OAuth setup
- Testing instructions
- Production deployment guide
- Troubleshooting tips

## 🏗️ Architecture

### Client-Side Auth Flow

```
User clicks "Login with Google"
  ↓
authProvider.login({ provider: 'google' })
  ↓
supabase.auth.signInWithOAuth()
  ↓
Redirect to Google
  ↓
User authenticates with Google
  ↓
Google redirects to /auth/callback
  ↓
Callback exchanges code for session
  ↓
Redirect to /dashboard
  ↓
Session stored in cookies
```

### Server-Side Auth

```typescript
import { createClient } from '@/lib/supabase/server';

export async function ServerComponent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <div>Welcome, {user.email}</div>;
}
```

## 🚀 Deployment

### Environment Variables

Required for all environments:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://addlanvirroxsxcgmspd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### OAuth Configuration

Update OAuth provider redirect URIs for production:
- Google Console: Add production domain
- Supabase: Update site URL in settings

## 🔄 Migration from Fake Auth

The app was migrated from fake auth to Supabase:

**Before** (`lib/auth-provider.ts`):
```typescript
// Hardcoded credentials
if (username === 'admin@xrayfinance.it' && password === 'password') {
  // Fake login
}
```

**After** (`lib/supabase-auth-provider.ts`):
```typescript
// Real authentication via Supabase
await supabase.auth.signInWithPassword({ email, password });
```

## 📊 Data Integration

### Linking Auth Users to Customers

You can link Supabase auth users to your SQLite customers table:

```typescript
// After user signs up
const { data: { user } } = await supabase.auth.getUser();

// Create customer record
await createCustomer({
  email: user.email,
  ragione_sociale: user.user_metadata.full_name,
  // ... other fields
});
```

### Storing User Roles

Option 1: **user_metadata**
```typescript
// When user signs up
await supabase.auth.updateUser({
  data: { role: 'commercial' }
});
```

Option 2: **Separate table**
```sql
CREATE TABLE user_roles (
  user_id UUID REFERENCES auth.users PRIMARY KEY,
  role TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 📚 Learn More

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [ra-core Auth](https://marmelab.com/react-admin/Authentication.html)
- [Next.js + Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)