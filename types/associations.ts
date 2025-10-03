/**
 * Association Types and Validation Rules
 *
 * Hierarchy:
 * - Rivenditore (Area Manager) → can manage: Intermediario, Cliente, Potenziale
 * - Intermediario → can manage: Cliente, Potenziale
 * - Cliente, Potenziale → cannot manage others
 */

import { UserRole } from './rbac'

export type AssociationType = 'reseller' | 'intermediary'

export interface UserAssociation {
  id: number
  parent_user_id: number
  child_user_id: number
  association_type: AssociationType
  created_at: string
  created_by: string | null
  notes?: string | null
}

export interface AssociationWithDetails extends UserAssociation {
  parent_name?: string
  parent_role?: UserRole
  child_name?: string
  child_role?: UserRole
}

export interface AssociationRules {
  // Who can be a parent
  validParentRoles: UserRole[]
  // Who can be a child for each parent type
  validChildRoles: {
    rivenditore: UserRole[]
    intermediario: UserRole[]
  }
  // Who can create/delete associations
  canManage: UserRole[]
}

export const ASSOCIATION_RULES: AssociationRules = {
  validParentRoles: ['rivenditore', 'intermediario'],
  validChildRoles: {
    rivenditore: ['intermediario', 'cliente', 'potenziale'],
    intermediario: ['cliente', 'potenziale'],
  },
  canManage: ['superadmin'], // Only superadmin can create/delete
}

export interface AssociationStats {
  totalChildren: number
  byType: {
    intermediario: number
    cliente: number
    potenziale: number
  }
  licenses: {
    total: number
    used: number
  }
  children: AssociationChild[]
}

export interface AssociationChild {
  id: number
  name: string
  type: UserRole
  status: string
  licenseCount: number
  licenseUsage: number // percentage
  location?: string
  email?: string
}

export interface ParentAssociationInfo {
  id: number
  name: string
  type: UserRole
  association_type: AssociationType
  location?: string
}
