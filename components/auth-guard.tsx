'use client';

import { useAuth } from '@/lib/auth/auth-provider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { ROUTE_PERMISSIONS } from '@/types/rbac';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      // Check role-based route access
      if (role) {
        const allowedRoles = ROUTE_PERMISSIONS[pathname];
        if (allowedRoles && !allowedRoles.includes(role)) {
          // User doesn't have permission for this route
          router.push('/dashboard');
        }
      }
    }
  }, [user, role, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check role-based access before rendering
  if (role) {
    const allowedRoles = ROUTE_PERMISSIONS[pathname];
    if (allowedRoles && !allowedRoles.includes(role)) {
      return null; // Don't render while redirecting
    }
  }

  return <>{children}</>;
}