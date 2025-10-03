/**
 * Association Validation Utilities
 */

import { UserRole } from '@/types/rbac'
import { ASSOCIATION_RULES, AssociationType } from '@/types/associations'

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate if an association between parent and child is allowed
 */
export function validateAssociation(
  parentRole: UserRole,
  childRole: UserRole,
  currentUserRole: UserRole
): ValidationResult {
  // Check if current user can create associations
  if (!ASSOCIATION_RULES.canManage.includes(currentUserRole)) {
    return {
      valid: false,
      error: 'Solo i superadmin possono creare associazioni',
    }
  }

  // Check if parent role is valid
  if (!ASSOCIATION_RULES.validParentRoles.includes(parentRole)) {
    return {
      valid: false,
      error: `${parentRole} non può essere un genitore`,
    }
  }

  // Check if child is valid for this parent type
  const validChildren =
    ASSOCIATION_RULES.validChildRoles[
      parentRole as 'rivenditore' | 'intermediario'
    ]

  if (!validChildren?.includes(childRole)) {
    return {
      valid: false,
      error: `${parentRole} non può gestire ${childRole}`,
    }
  }

  return { valid: true }
}

/**
 * Get association type based on parent role
 */
export function getAssociationType(parentRole: UserRole): AssociationType {
  return parentRole === 'rivenditore' ? 'reseller' : 'intermediary'
}

/**
 * Check if user can view association stats
 */
export function canViewStats(userRole: UserRole): boolean {
  return ['superadmin', 'rivenditore', 'intermediario'].includes(userRole)
}

/**
 * Check if user can manage associations (create/delete)
 */
export function canManageAssociations(userRole: UserRole): boolean {
  return ASSOCIATION_RULES.canManage.includes(userRole)
}

/**
 * Get valid child types for a parent role
 */
export function getValidChildTypes(parentRole: UserRole): UserRole[] {
  if (parentRole === 'rivenditore') {
    return ASSOCIATION_RULES.validChildRoles.rivenditore
  }
  if (parentRole === 'intermediario') {
    return ASSOCIATION_RULES.validChildRoles.intermediario
  }
  return []
}
