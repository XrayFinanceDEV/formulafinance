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
