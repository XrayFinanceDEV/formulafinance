'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authProvider } from '@/lib/auth-provider';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated and redirect accordingly
    authProvider.checkAuth({})
      .then(() => {
        // User is authenticated, redirect to dashboard
        router.push('/dashboard');
      })
      .catch(() => {
        // User is not authenticated, redirect to login
        router.push('/login');
      });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );
}
