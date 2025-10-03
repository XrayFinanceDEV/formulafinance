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
