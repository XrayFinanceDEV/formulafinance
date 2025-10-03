'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-provider';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, redirect to dashboard
        router.push('/dashboard');
      } else {
        // User is not authenticated, redirect to login
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );
}
