/**
 * RBAC Type Definitions
 */

export type UserRole = 'cliente' | 'potenziale' | 'rivenditore' | 'intermediario' | 'superadmin'

export type AssociationType = 'reseller' | 'intermediary'

export interface UserRoleRecord {
  id: number
  user_id: string
  role: UserRole
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface UserAssociation {
  id: number
  parent_user_id: string
  child_user_id: string
  association_type: AssociationType
  created_at: string
  created_by: string | null
}

export type Permission =
  | 'customers:read'
  | 'customers:create'
  | 'customers:update'
  | 'customers:delete'
  | 'licenses:read'
  | 'licenses:assign'
  | 'reports:read'
  | 'reports:create'
  | 'analytics:read'

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  cliente: [
    'reports:read',
    'reports:create',
  ],
  potenziale: [
    'reports:read',
    'reports:create',
  ],
  rivenditore: [
    'customers:read',
    'licenses:read',
    'reports:read',
    'reports:create',
    'analytics:read',
  ],
  intermediario: [
    'customers:read',
    'customers:update',
    'licenses:read',
    'reports:read',
    'reports:create',
    'analytics:read',
  ],
  superadmin: [
    'customers:read',
    'customers:create',
    'customers:update',
    'customers:delete',
    'licenses:read',
    'licenses:assign',
    'reports:read',
    'reports:create',
    'analytics:read',
  ],
}

export const ROLE_LABELS: Record<UserRole, string> = {
  cliente: 'Cliente',
  potenziale: 'Potenziale',
  rivenditore: 'Rivenditore',
  intermediario: 'Intermediario',
  superadmin: 'Superadmin',
}

export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/dashboard': ['cliente', 'potenziale', 'rivenditore', 'intermediario', 'superadmin'],
  '/customers': ['rivenditore', 'intermediario', 'superadmin'],
  '/customers/new': ['superadmin'],
  '/customers/[id]': ['rivenditore', 'intermediario', 'superadmin'],
  '/customers/[id]/edit': ['superadmin'],
  '/reports': ['cliente', 'potenziale', 'rivenditore', 'intermediario', 'superadmin'],
  '/reports/new': ['cliente', 'potenziale', 'rivenditore', 'intermediario', 'superadmin'],
  '/reports/[id]': ['cliente', 'potenziale', 'rivenditore', 'intermediario', 'superadmin'],
  '/licenses': ['superadmin'],
  '/profile': ['cliente', 'potenziale', 'rivenditore', 'intermediario', 'superadmin'],
  '/admin': ['superadmin'],
}
