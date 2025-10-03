'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/types/rbac'

export interface UseAuthReturn {
  user: User | null
  role: UserRole | null
  loading: boolean
  isAuthenticated: boolean
}

/**
 * Hook to get current user authentication and role information
 * Use this in client components to check user permissions
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setRole((session?.user?.app_metadata?.role as UserRole) ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setRole((session?.user?.app_metadata?.role as UserRole) ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return {
    user,
    role,
    loading,
    isAuthenticated: !!user,
  }
}

/**
 * Hook to check if user has specific permission
 */
export function usePermission(allowedRoles: UserRole[]): boolean {
  const { role } = useAuth()

  if (!role) return false

  return allowedRoles.includes(role)
}

/**
 * Hook to check if user is superadmin
 */
export function useIsSuperadmin(): boolean {
  const { role } = useAuth()
  return role === 'superadmin'
}

/**
 * Hook to check if user can view customer list
 */
export function useCanViewCustomerList(): boolean {
  return usePermission(['rivenditore', 'intermediario', 'superadmin'])
}

/**
 * Hook to check if user can perform admin actions
 */
export function useCanPerformAdminActions(): boolean {
  return usePermission(['superadmin'])
}
