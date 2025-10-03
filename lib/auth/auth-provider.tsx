'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { UserRole, ROLE_PERMISSIONS } from '@/types/rbac'

interface AuthContextType {
  user: User | null
  role: UserRole | null
  permissions: typeof ROLE_PERMISSIONS[UserRole] | null
  loading: boolean
  isAuthenticated: boolean
  hasPermission: (permission: string) => boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  signOut: () => Promise<void>
  checkAuth: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Fetch user role from database via API
  async function fetchUserRole(userId: string): Promise<UserRole | null> {
    try {
      const response = await fetch(`/api/auth/role?userId=${userId}`)
      if (response.ok) {
        const { role: userRole } = await response.json()
        return userRole
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
    return null
  }

  useEffect(() => {
    // Get initial session and role
    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      if (session?.user) {
        const userRole = await fetchUserRole(session.user.id)
        setRole(userRole)
      }

      setLoading(false)
    }

    loadSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        const userRole = await fetchUserRole(session.user.id)
        setRole(userRole)
      } else {
        setRole(null)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const hasPermission = (permission: string): boolean => {
    if (!role) return false
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
  }

  const login = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
  }

  // Alias for backwards compatibility
  const signOut = logout

  const checkAuth = async (): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session
  }

  const value = {
    user,
    role,
    permissions: role ? ROLE_PERMISSIONS[role] : null,
    loading,
    isAuthenticated: !!user,
    hasPermission,
    login,
    logout,
    signOut,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Primary hook name for RBAC
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Alias for backwards compatibility
export function useAuthContext() {
  return useAuth()
}

/**
 * Hook to get user permissions based on RBAC role
 */
export function usePermissions() {
  const { role, loading, hasPermission } = useAuth()

  return {
    canEditCustomers: hasPermission('customers:update'),
    canDeleteCustomers: hasPermission('customers:delete'),
    canViewAnalytics: hasPermission('analytics:read'),
    canCreateCustomers: hasPermission('customers:create'),
    canAssignLicenses: hasPermission('licenses:assign'),
    hasPermission,
    role,
    loading,
  }
}
