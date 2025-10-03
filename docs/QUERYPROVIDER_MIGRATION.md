# Migration Plan: ra-core → React Query

This document outlines the complete migration from ra-core to @tanstack/react-query for data management in the FormulaFinance application.

## Table of Contents

1. [Overview](#overview)
2. [Why Migrate?](#why-migrate)
3. [Phase 1: Foundation Setup](#phase-1-foundation-setup)
4. [Phase 2: Migrate Data Hooks](#phase-2-migrate-data-hooks)
5. [Phase 3: Create Auth Context](#phase-3-create-auth-context)
6. [Phase 4: Update App Layout](#phase-4-update-app-layout)
7. [Phase 5: Update Components](#phase-5-update-components)
8. [Phase 6: Remove ra-core](#phase-6-remove-ra-core)
9. [Migration Checklist](#migration-checklist)
10. [Testing Strategy](#testing-strategy)

---

## Overview

**Goal:** Replace ra-core with React Query to eliminate routing dependencies and simplify the codebase while maintaining all existing functionality (caching, optimistic updates, deduplication).

**Timeline:** Estimated 4-6 hours

**Risk Level:** Medium (affecting core data layer)

---

## Why Migrate?

### Problems with ra-core

1. **Routing Dependencies:** ra-core mutation hooks (`useCreate`, `useUpdate`, `useDelete`) require react-router context
   - Error: `useNavigate() may be used only in the context of a <Router> component`
   - Conflicts with Next.js App Router

2. **Limited Usage:** We're only using a small portion of ra-core
   - Query hooks: `useGetList`, `useGetOne` (React Query can do this)
   - Auth pattern: Just a simple interface (we wrote our own logic)
   - Not using: Admin UI, routing, authorization features

3. **Future FastAPI Integration:** Direct API calls will be cleaner without ra-core abstraction layer

4. **Bundle Size:** ra-core adds ~150KB to bundle

### Benefits of React Query

1. **Perfect Next.js Integration:** No SSR issues, no routing conflicts
2. **Smaller Bundle:** Direct dependency on React Query (~30KB)
3. **Better TypeScript Support:** Full type inference and generics
4. **Simpler Mental Model:** Standard React patterns
5. **More Control:** Direct access to caching, optimistic updates, etc.

---

## Phase 1: Foundation Setup

### Step 1: Install Dependencies

```bash
# React Query is already installed via ra-core
# If not, install it:
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### Step 2: Create Query Provider

**File:** `lib/query-client-provider.tsx`

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Cache is kept for 10 minutes after becoming unused
            gcTime: 10 * 60 * 1000,
            // Retry failed requests once
            retry: 1,
            // Don't refetch on window focus (can be annoying during development)
            refetchOnWindowFocus: false,
            // Refetch when component mounts
            refetchOnMount: true,
            // Refetch when reconnecting to network
            refetchOnReconnect: true,
          },
          mutations: {
            // Don't retry mutations by default
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools for debugging queries */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Purpose:**
- Provides React Query context to entire app
- Configures default caching and refetch behavior
- Includes DevTools for debugging

### Step 3: Create Query Key Factory

**File:** `lib/query-keys.ts`

```typescript
/**
 * Query Key Factory
 *
 * Centralized, type-safe query keys for consistent caching and invalidation.
 *
 * Pattern:
 * - all: Base key for resource
 * - lists(): Keys for list queries
 * - list(filters): Specific list with filters
 * - details(): Keys for detail queries
 * - detail(id): Specific detail query
 */

export const queryKeys = {
  customers: {
    all: ['customers'] as const,
    lists: () => [...queryKeys.customers.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.customers.lists(), filters] as const,
    details: () => [...queryKeys.customers.all, 'detail'] as const,
    detail: (id: number | string) =>
      [...queryKeys.customers.details(), id] as const,
  },

  licenses: {
    all: ['licenses'] as const,
    lists: () => [...queryKeys.licenses.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.licenses.lists(), filters] as const,
    details: () => [...queryKeys.licenses.all, 'detail'] as const,
    detail: (id: number | string) =>
      [...queryKeys.licenses.details(), id] as const,
    byCustomer: (customerId: number | string) =>
      [...queryKeys.licenses.all, 'customer', customerId] as const,
  },

  reports: {
    all: ['reports'] as const,
    lists: () => [...queryKeys.reports.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.reports.lists(), filters] as const,
    details: () => [...queryKeys.reports.all, 'detail'] as const,
    detail: (id: number | string) =>
      [...queryKeys.reports.details(), id] as const,
  },

  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
  },

  modules: {
    all: ['modules'] as const,
    lists: () => [...queryKeys.modules.all, 'list'] as const,
  },
} as const;
```

**Purpose:**
- Type-safe query keys
- Easy invalidation (e.g., `queryKeys.customers.lists()` invalidates all customer lists)
- Hierarchical organization (e.g., `['customers', 'list', {...filters}]`)

**Usage Examples:**
```typescript
// Get all customers
useQuery({ queryKey: queryKeys.customers.list(), ... })

// Get specific customer
useQuery({ queryKey: queryKeys.customers.detail(123), ... })

// Invalidate all customer queries
queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })

// Invalidate all customer lists (not details)
queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() })
```

### Step 4: Create API Client

**File:** `lib/api-client.ts`

```typescript
/**
 * API Client
 *
 * Centralized fetch wrapper with error handling and type safety.
 * Replaces the ra-core data provider pattern.
 */

export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class APIClient {
  private baseURL: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: response.statusText,
      }));
      throw new APIError(
        response.status,
        response.statusText,
        error.error || error.message || 'Request failed'
      );
    }
    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(endpoint, window.location.origin + this.baseURL);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString());
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
    });
    return this.handleResponse<T>(response);
  }
}

export const apiClient = new APIClient();
```

**Purpose:**
- Centralized HTTP client
- Consistent error handling
- Type-safe responses
- Easy to extend for auth headers, retries, etc.

---

## Phase 2: Migrate Data Hooks

### Step 5: Migrate use-customers.ts

**New File:** `hooks/use-customers-query.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

// Keep existing interfaces from old file
export interface Customer {
  id: number;
  name: string;
  email: string;
  type: 'Cliente' | 'Rivenditore' | 'Intermediario' | 'Potenziale';
  licenseUsage: number;
  maxLicenses: number;
  status: 'Attivo' | 'Attenzione' | 'Oltre il limite';
  joinDate: string;
}

interface CustomersResponse {
  data: any[];
  total: number;
}

// Transform function (keep from old file)
function transformDbToCustomer(dbRecord: any): Customer {
  return {
    id: dbRecord.id,
    name: dbRecord.ragione_sociale || dbRecord.name || 'Unknown',
    email: dbRecord.email || '',
    type: capitalizeFirstLetter(dbRecord.tipo_utente || dbRecord.type || 'cliente') as Customer['type'],
    licenseUsage: dbRecord.licenseUsage || 0,
    maxLicenses: dbRecord.maxLicenses || 0,
    status: capitalizeFirstLetter(dbRecord.stato || dbRecord.status || 'attivo') as Customer['status'],
    joinDate: dbRecord.created_at || dbRecord.joinDate || new Date().toISOString(),
  };
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Fetch paginated list of customers
 */
export function useCustomers(params = {
  page: 1,
  perPage: 10,
  sortField: 'id',
  sortOrder: 'ASC' as 'ASC' | 'DESC'
}) {
  return useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: () => apiClient.get<CustomersResponse>('/customers', params),
    select: (response) => ({
      data: response.data.map(transformDbToCustomer),
      total: response.total,
      isPending: false,
      error: null,
    }),
  });
}

/**
 * Fetch single customer by ID
 */
export function useCustomer(id: number) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => apiClient.get<{ data: any }>(`/customers/${id}`),
    select: (response) => transformDbToCustomer(response.data),
    enabled: !!id,
  });
}

/**
 * Create new customer
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Customer, 'id' | 'joinDate'>) =>
      apiClient.post('/customers', data),
    onSuccess: () => {
      // Invalidate all customer lists
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
    },
  });
}

/**
 * Update existing customer
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Customer> }) =>
      apiClient.put(`/customers/${id}`, data),
    onSuccess: (data, variables) => {
      // Invalidate all lists
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      // Invalidate specific detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.detail(variables.id)
      });
    },
  });
}

/**
 * Delete customer
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/customers/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      queryClient.removeQueries({ queryKey: queryKeys.customers.detail(id) });
    },
  });
}
```

**Key Changes:**
- Replace `useGetList` → `useQuery` with `queryKeys.customers.list()`
- Replace `useGetOne` → `useQuery` with `queryKeys.customers.detail(id)`
- Replace `useCreate` → `useMutation` with `apiClient.post()`
- Replace `useUpdate` → `useMutation` with `apiClient.put()`
- Replace `useDelete` → `useMutation` with `apiClient.delete()`
- Use `queryClient.invalidateQueries()` for cache updates

### Step 6: Migrate use-licenses.ts

**New File:** `hooks/use-licenses-query.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { License } from '@/types/auth';

interface LicensesResponse {
  data: License[];
  total: number;
}

/**
 * Fetch all licenses with optional filters
 */
export function useLicenses(params?: {
  page?: number;
  perPage?: number;
  userId?: number;
  moduleId?: number;
  status?: string;
}) {
  const { page = 1, perPage = 50, userId, moduleId, status } = params || {};

  const filters: Record<string, any> = { page, perPage };
  if (userId) filters.user_id = userId;
  if (moduleId) filters.module_id = moduleId;
  if (status) filters.status = status;

  return useQuery({
    queryKey: queryKeys.licenses.list(filters),
    queryFn: () => apiClient.get<LicensesResponse>('/licenses', filters),
  });
}

/**
 * Fetch licenses for a specific user
 */
export function useUserLicenses(userId: number) {
  return useLicenses({ userId, perPage: 100 });
}

/**
 * Fetch single license by ID
 */
export function useLicense(id: number) {
  return useQuery({
    queryKey: queryKeys.licenses.detail(id),
    queryFn: () => apiClient.get<{ data: License }>(`/licenses/${id}`),
    select: (response) => response.data,
    enabled: !!id,
  });
}

/**
 * Create new license
 */
export function useCreateLicense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<License>) =>
      apiClient.post('/licenses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.licenses.lists() });
    },
  });
}

/**
 * Update existing license
 */
export function useUpdateLicense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<License> }) =>
      apiClient.put(`/licenses/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.licenses.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.licenses.detail(variables.id)
      });
    },
  });
}

/**
 * Delete license
 */
export function useDeleteLicense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/licenses/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.licenses.lists() });
      queryClient.removeQueries({ queryKey: queryKeys.licenses.detail(id) });
    },
  });
}

// Keep all helper functions
export function getLicenseUsagePercentage(license: License): number {
  if (license.quantity_total === 0) return 0;
  return Math.round((license.quantity_used / license.quantity_total) * 100);
}

export function getRemainingLicenses(license: License): number {
  return license.quantity_total - license.quantity_used;
}

export function isLicenseExpiringSoon(license: License): boolean {
  const expirationDate = new Date(license.expiration_date);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  return expirationDate <= thirtyDaysFromNow && expirationDate > new Date();
}

export function isLicenseExpired(license: License): boolean {
  const expirationDate = new Date(license.expiration_date);
  return expirationDate < new Date() || license.status === 'expired';
}

export function hasAvailableLicenses(license: License): boolean {
  return getRemainingLicenses(license) > 0 && !isLicenseExpired(license) && license.status === 'active';
}

export function getLicenseStatusColor(license: License): 'success' | 'warning' | 'error' | 'default' {
  if (isLicenseExpired(license)) return 'error';
  if (isLicenseExpiringSoon(license)) return 'warning';

  const remaining = getRemainingLicenses(license);
  const percentage = (remaining / license.quantity_total) * 100;

  if (percentage <= 10) return 'error';
  if (percentage <= 20) return 'warning';
  return 'success';
}
```

### Step 7: Migrate use-reports.ts

**New File:** `hooks/use-reports-query.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { Report, CreateReportInput } from '@/types/reports';

interface ReportsResponse {
  data: Report[];
  total: number;
}

/**
 * Fetch all reports with optional filters
 */
export function useReports(params?: {
  page?: number;
  perPage?: number;
  filter?: Record<string, any>;
}) {
  const { page = 1, perPage = 10, filter = {} } = params || {};

  return useQuery({
    queryKey: queryKeys.reports.list({ page, perPage, ...filter }),
    queryFn: () => apiClient.get<ReportsResponse>('/reports', {
      page,
      perPage,
      ...filter,
    }),
  });
}

/**
 * Fetch a single report by ID
 */
export function useReport(id: number | string) {
  return useQuery({
    queryKey: queryKeys.reports.detail(id),
    queryFn: () => apiClient.get<{ data: Report }>(`/reports/${id}`),
    select: (response) => response.data,
    enabled: !!id,
  });
}

/**
 * Create a new report
 */
export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReportInput) =>
      apiClient.post<Report>('/reports', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.lists() });
    },
  });
}

/**
 * Update an existing report
 */
export function useUpdateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Partial<Report> }) =>
      apiClient.put<Report>(`/reports/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.detail(variables.id)
      });
    },
  });
}

/**
 * Delete a report
 */
export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) =>
      apiClient.delete(`/reports/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.lists() });
      queryClient.removeQueries({ queryKey: queryKeys.reports.detail(id) });
    },
  });
}
```

---

## Phase 3: Create Auth Context

### Step 8: Replace ra-core Auth Provider

**File:** `lib/auth-context.tsx`

```typescript
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSupabaseBrowserClient } from './supabase/client';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'superuser' | 'commercial' | 'client';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('client');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setRole(session?.user?.user_metadata?.role ?? 'client');
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setRole(session?.user?.user_metadata?.role ?? 'client');
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
  };

  const checkAuth = async () => {
    const supabase = getSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

/**
 * Hook to get user permissions based on role
 */
export function usePermissions() {
  const { role, loading } = useAuth();

  return {
    canEditCustomers: canEditCustomers(role),
    canDeleteCustomers: canDeleteCustomers(role),
    canViewAnalytics: canViewAnalytics(role),
    role,
    loading,
  };
}

// Permission helper functions
const roleHierarchy: Record<UserRole, number> = {
  client: 1,
  commercial: 2,
  superuser: 3,
};

function hasPermission(requiredRole: UserRole, userRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function canEditCustomers(role: UserRole): boolean {
  return hasPermission('commercial', role);
}

export function canDeleteCustomers(role: UserRole): boolean {
  return hasPermission('superuser', role);
}

export function canViewAnalytics(role: UserRole): boolean {
  return hasPermission('commercial', role);
}
```

**Purpose:**
- Replaces ra-core's `authProvider` pattern
- Provides React Context for authentication state
- Manages Supabase session
- Provides permission checking hooks

---

## Phase 4: Update App Layout

### Step 9: Update Root Layout

**File:** `app/layout.tsx`

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query-client-provider";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FormulaFinance - Financial Dashboard",
  description: "Professional financial management platform with user roles and CRUD operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
```

**Changes:**
- Remove `AdminProvider` from ra-core
- Add `QueryProvider` for React Query
- Add `AuthProvider` for authentication
- Both are client components wrapped around app

---

## Phase 5: Update Components

### Step 10: Update Component Imports

Update all components that use data hooks:

**Example: `components/customers-table-enhanced.tsx`**

```typescript
// OLD IMPORTS
import { useCustomers, useDeleteCustomer } from '@/hooks/use-customers';
import { useCustomerPermissions } from '@/hooks/use-customers';

// NEW IMPORTS
import { useCustomers, useDeleteCustomer } from '@/hooks/use-customers-query';
import { usePermissions } from '@/lib/auth-context';

// Usage changes
function CustomersTable() {
  // OLD
  const { data, total, isPending } = useCustomers();
  const { canEdit, canDelete } = useCustomerPermissions();

  // NEW
  const { data, isPending } = useCustomers();
  const { canEditCustomers, canDeleteCustomers } = usePermissions();

  // Mutation hooks stay similar
  const { mutate: deleteCustomer } = useDeleteCustomer();

  // Rest of component...
}
```

**Common Changes:**
- `useCustomerPermissions()` → `usePermissions()`
- `canEdit` → `canEditCustomers`
- `canDelete` → `canDeleteCustomers`
- `isLoading` → `isPending`
- Mutation: `const [mutate, { isPending }] = useMutation()` → `const { mutate, isPending } = useMutation()`

---

## Phase 6: Remove ra-core

### Step 11: Uninstall Dependencies

```bash
npm uninstall ra-core ra-data-fakerest ra-data-json-server ra-data-simple-rest
```

### Step 12: Remove Old Files

Delete the following files:
- `lib/ra-core-config.tsx`
- `lib/data-provider.ts`
- `lib/auth-provider.ts`
- `lib/sqlite-data-provider.ts`
- `lib/fastapi-data-provider.ts`
- `lib/fastapi-auth-provider.ts`
- `hooks/use-ra-core.ts`
- `hooks/use-customers.ts` (replaced by `use-customers-query.ts`)
- `hooks/use-licenses.ts` (replaced by `use-licenses-query.ts`)
- `hooks/use-reports.ts` (replaced by `use-reports-query.ts`)

### Step 13: Update Documentation

**Update:** `CLAUDE.md`
- Remove ra-core references
- Add React Query patterns
- Update data fetching examples

**Update:** `CHANGELOG.md`
- Add migration entry
- Document breaking changes

---

## Migration Checklist

### Phase 1: Foundation
- [ ] Install @tanstack/react-query (if not already installed)
- [ ] Create `lib/query-client-provider.tsx`
- [ ] Create `lib/query-keys.ts`
- [ ] Create `lib/api-client.ts`

### Phase 2: Data Hooks
- [ ] Create `hooks/use-customers-query.ts`
- [ ] Create `hooks/use-licenses-query.ts`
- [ ] Create `hooks/use-reports-query.ts`
- [ ] Create `hooks/use-products-query.ts` (if needed)
- [ ] Create `hooks/use-modules-query.ts` (if needed)

### Phase 3: Auth
- [ ] Create `lib/auth-context.tsx`
- [ ] Test login/logout flow
- [ ] Test permission checks

### Phase 4: Layout
- [ ] Update `app/layout.tsx`
- [ ] Verify providers are in correct order

### Phase 5: Components
- [ ] Update `components/customers-table-enhanced.tsx`
- [ ] Update `app/customers/page.tsx`
- [ ] Update `app/customers/[id]/page.tsx`
- [ ] Update `app/reports/page.tsx`
- [ ] Update all other components using data hooks

### Phase 6: Cleanup
- [ ] Uninstall ra-core packages
- [ ] Remove old files
- [ ] Update CLAUDE.md
- [ ] Update CHANGELOG.md

---

## Testing Strategy

### 1. Unit Testing
Test each new hook individually:

```typescript
// Example test for useCustomers
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCustomers } from './use-customers-query';

test('useCustomers fetches customers', async () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  const { result } = renderHook(() => useCustomers(), { wrapper });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toBeDefined();
});
```

### 2. Integration Testing
Test complete flows:

- [ ] List customers
- [ ] Create customer
- [ ] Update customer
- [ ] Delete customer
- [ ] Filter customers
- [ ] Sort customers
- [ ] Pagination

### 3. Manual Testing
- [ ] Login flow works
- [ ] Logout flow works
- [ ] Permissions work (try different roles)
- [ ] Create/Read/Update/Delete for all resources
- [ ] Cache invalidation works (list updates after create/update/delete)
- [ ] Loading states display correctly
- [ ] Error states display correctly

### 4. Performance Testing
- [ ] Check bundle size (should be ~120KB smaller)
- [ ] Verify no duplicate requests (React Query deduplication)
- [ ] Verify caching works (no refetch on mount within staleTime)
- [ ] Check DevTools for query status

---

## Rollback Plan

If migration fails, rollback is simple:

1. Restore old files from git
2. Reinstall ra-core: `npm install ra-core ra-data-simple-rest`
3. Restore `app/layout.tsx` to use `AdminProvider`

**Git commands:**
```bash
# Restore old files
git checkout HEAD -- lib/ra-core-config.tsx hooks/use-customers.ts hooks/use-licenses.ts hooks/use-reports.ts

# Reinstall dependencies
npm install ra-core ra-data-simple-rest
```

---

## FAQs

**Q: Why not keep both ra-core and React Query?**
A: Unnecessary complexity. We'd be maintaining two data fetching systems for no benefit.

**Q: Will this break existing functionality?**
A: No. We're replacing implementation, not functionality. All CRUD operations, caching, and permissions work the same.

**Q: What about optimistic updates?**
A: React Query supports optimistic updates natively. See docs for `onMutate` and `setQueryData`.

**Q: Can we still use the data provider pattern?**
A: Yes! The `apiClient` is essentially a simplified data provider. You can keep the pattern without ra-core.

**Q: What about future FastAPI integration?**
A: This migration makes it easier. Just update `apiClient` base URL to point to FastAPI backend.

---

## References

- [React Query Documentation](https://tanstack.com/query/latest/docs/react/overview)
- [Next.js 15 with React Query](https://tanstack.com/query/latest/docs/react/guides/ssr)
- [Migration from other libraries](https://tanstack.com/query/latest/docs/react/guides/migrating-to-react-query-3)
- [Query Keys Guide](https://tanstack.com/query/latest/docs/react/guides/query-keys)
