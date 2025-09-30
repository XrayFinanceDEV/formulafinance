'use client';

import React from 'react';
import { DataProviderContext, AuthContext } from 'ra-core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { dataProvider } from './data-provider'; // Fake data provider (in-memory)
import { sqliteDataProvider as dataProvider } from './sqlite-data-provider'; // SQLite data provider (persistent)
// import { authProvider } from './auth-provider'; // Fake auth provider
import { supabaseAuthProvider as authProvider } from './supabase-auth-provider'; // Supabase auth provider

interface AdminProviderProps {
  children: React.ReactNode;
}

// Create a query client for react-query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Simple admin context provider without routing
// Provides data/auth providers without react-router
export function AdminProvider({ children }: AdminProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authProvider}>
        <DataProviderContext.Provider value={dataProvider}>
          {children}
        </DataProviderContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

// Hook to use the admin context
export { useDataProvider, useAuthProvider, usePermissions, useGetList, useGetOne, useCreate, useUpdate, useDelete } from 'ra-core';