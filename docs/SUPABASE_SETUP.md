# Supabase Authentication Setup Guide

This guide will help you configure Supabase authentication for FormulaFinance, including Google OAuth and other providers.

## 📋 Prerequisites

- Supabase project created at: https://supabase.com/dashboard/project/addlanvirroxsxcgmspd
- Next.js 15 application (already configured)
- Supabase client libraries installed (already done)

## 🔑 Step 1: Get Supabase API Credentials

1. Navigate to your Supabase project: https://supabase.com/dashboard/project/addlanvirroxsxcgmspd
2. Go to **Project Settings** > **API**
3. Copy the following values:
   - **Project URL**: `https://addlanvirroxsxcgmspd.supabase.co`
   - **anon/public key**: Copy the `anon` key

4. Update your `.env.local` file:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://addlanvirroxsxcgmspd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

**⚠️ Important**: Replace `your_actual_anon_key_here` with your real anon key!

## 🔐 Step 2: Configure Google OAuth Provider

### 2.1 Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application**
6. Configure:
   - **Name**: FormulaFinance Supabase
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - `https://your-production-domain.com` (for production)
   - **Authorized redirect URIs**:
     - `https://addlanvirroxsxcgmspd.supabase.co/auth/v1/callback`

7. Copy the **Client ID** and **Client Secret**

### 2.2 Configure Google Provider in Supabase

1. Go to your Supabase project: https://supabase.com/dashboard/project/addlanvirroxsxcgmspd
2. Navigate to **Authentication** > **Providers**
3. Find **Google** in the list
4. Toggle **Enable Google provider**
5. Enter:
   - **Client ID**: Paste from Google Cloud Console
   - **Client Secret**: Paste from Google Cloud Console
6. Click **Save**

### 2.3 Update Redirect URL

1. In Supabase, go to **Authentication** > **URL Configuration**
2. Add your site URL:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`
3. Redirect URLs (already configured in code):
   - `/auth/callback` - OAuth callback handler
   - `/dashboard` - Default redirect after login

## 🍎 Step 3: Configure Apple OAuth (Optional)

### 3.1 Create Apple OAuth Credentials

1. Go to [Apple Developer](https://developer.apple.com/)
2. Sign in with your Apple Developer account
3. Navigate to **Certificates, Identifiers & Profiles**
4. Create a new **Service ID**
5. Configure Sign in with Apple
6. Add redirect URI: `https://addlanvirroxsxcgmspd.supabase.co/auth/v1/callback`

### 3.2 Configure in Supabase

1. In Supabase, go to **Authentication** > **Providers**
2. Find **Apple**
3. Toggle **Enable Apple provider**
4. Enter credentials from Apple Developer
5. Click **Save**

## 📘 Step 4: Configure Facebook OAuth (Optional)

### 4.1 Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use existing
3. Add **Facebook Login** product
4. Configure OAuth redirect URI: `https://addlanvirroxsxcgmspd.supabase.co/auth/v1/callback`

### 4.2 Configure in Supabase

1. In Supabase, go to **Authentication** > **Providers**
2. Find **Facebook**
3. Toggle **Enable Facebook provider**
4. Enter **App ID** and **App Secret**
5. Click **Save**

## 🧪 Step 5: Test Authentication

### 5.1 Start Development Server

```bash
npm run dev
```

### 5.2 Test Login Flow

1. Navigate to: http://localhost:3000/login
2. Try **Email/Password** login (if you've created users in Supabase)
3. Try **Google OAuth**:
   - Click the Google button
   - You'll be redirected to Google login
   - After successful login, redirected back to `/dashboard`

### 5.3 Check Authentication Status

The app automatically:
- Stores session in cookies (via `@supabase/ssr`)
- Redirects to `/dashboard` after login
- Handles OAuth callback at `/auth/callback`
- Implements ra-core auth provider pattern

## 🔧 Architecture Overview

### Files Created/Modified

```
lib/
├── supabase/
│   ├── client.ts                    # Browser Supabase client
│   └── server.ts                    # Server Supabase client
├── supabase-auth-provider.ts        # ra-core auth provider
└── ra-core-config.tsx              # Updated to use Supabase auth

app/
└── auth/
    └── callback/
        └── route.ts                 # OAuth callback handler

components/
└── login-form.tsx                   # Updated with OAuth buttons

.env.local                           # Environment variables
```

### How It Works

1. **Login with Email/Password**:
   ```typescript
   authProvider.login({ username, password })
   → supabase.auth.signInWithPassword()
   → Redirects to /dashboard
   ```

2. **Login with OAuth** (Google, Apple, Facebook):
   ```typescript
   authProvider.login({ provider: 'google' })
   → supabase.auth.signInWithOAuth()
   → Redirects to provider
   → Provider redirects to /auth/callback
   → Callback exchanges code for session
   → Redirects to /dashboard
   ```

3. **Session Management**:
   - Cookies managed by `@supabase/ssr`
   - Automatic refresh handled by Supabase
   - `checkAuth()` validates session on navigation

## 📝 Create Test Users

### Option 1: Supabase Dashboard

1. Go to **Authentication** > **Users**
2. Click **Add user**
3. Enter email and password
4. Click **Create user**

### Option 2: Sign Up Page (Not implemented yet)

You can implement a sign-up page using:
```typescript
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
})
```

## 🛡️ Security Best Practices

1. **Environment Variables**:
   - Never commit `.env.local` to git
   - Use different keys for dev/staging/production

2. **OAuth Redirect URIs**:
   - Only whitelist necessary domains
   - Use HTTPS in production

3. **Row Level Security (RLS)**:
   - Enable RLS on your Supabase tables
   - Define policies for user data access

4. **Password Policies**:
   - Configure in Supabase: **Authentication** > **Policies**
   - Set minimum password length
   - Require special characters

## 🚀 Production Deployment

### Update Environment Variables

For production, update your hosting platform (Vercel, etc.):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://addlanvirroxsxcgmspd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

### Update OAuth Redirect URIs

1. Add production domain to Google OAuth allowed origins
2. Update Supabase site URL configuration
3. Test all OAuth flows in production

## 📊 User Management

### Access User Data

```typescript
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = getSupabaseBrowserClient();
const { data: { user } } = await supabase.auth.getUser();

console.log(user.email);
console.log(user.user_metadata); // Contains OAuth profile data
```

### Store Additional User Info

Create a `profiles` table in Supabase to store additional user data:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
```

## 🔍 Troubleshooting

### Issue: "Invalid redirect URL"
**Solution**: Ensure redirect URI in Google Console matches Supabase callback URL exactly

### Issue: "No anon key found"
**Solution**: Check that `.env.local` is loaded and contains the correct keys

### Issue: OAuth popup blocked
**Solution**: Ensure popup blockers are disabled, or implement redirect-based flow

### Issue: Session not persisting
**Solution**: Check cookie settings, ensure `@supabase/ssr` is configured correctly

## 📚 References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase OAuth Providers](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [ra-core Auth Provider](https://marmelab.com/react-admin/Authentication.html)

## ✅ Checklist

- [ ] Copied Supabase URL and anon key to `.env.local`
- [ ] Created Google OAuth credentials
- [ ] Configured Google provider in Supabase
- [ ] Added redirect URIs to Google Console
- [ ] Tested email/password login (optional)
- [ ] Tested Google OAuth login
- [ ] Verified redirect to dashboard works
- [ ] Checked user session persists on page reload

## 🎉 Next Steps

Once authentication is working:

1. **Implement Sign Up**: Create a registration page
2. **Add User Profiles**: Store additional user data in Supabase
3. **Role-Based Access**: Use `user_metadata.role` for permissions
4. **Email Verification**: Enable in Supabase settings
5. **Password Reset**: Implement forgot password flow
6. **Multi-Factor Auth**: Enable 2FA in Supabase