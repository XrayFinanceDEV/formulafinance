import { User } from '@supabase/supabase-js'
import Database from 'better-sqlite3'
import { join } from 'path'

export type UserRole = 'cliente' | 'potenziale' | 'rivenditore' | 'intermediario' | 'superadmin'

export interface AuthContext {
  user: User
  role: UserRole
  userId: string
}

/**
 * Get database instance
 */
function getDb() {
  const dbPath = join(process.cwd(), 'data', 'formulafinance.db')
  return new Database(dbPath)
}

/**
 * Get user role from database
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  const db = getDb()

  try {
    const stmt = db.prepare('SELECT role FROM user_roles WHERE user_id = ?')
    const result = stmt.get(userId) as { role: UserRole } | undefined
    return result?.role || null
  } finally {
    db.close()
  }
}

/**
 * Set user role in database and sync to Supabase metadata
 */
export async function setUserRole(userId: string, role: UserRole, createdBy?: string): Promise<void> {
  const db = getDb()

  try {
    const stmt = db.prepare(`
      INSERT INTO user_roles (user_id, role, created_by, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        role = excluded.role,
        updated_at = CURRENT_TIMESTAMP
    `)

    stmt.run(userId, role, createdBy || null)

    // Sync to Supabase metadata (import dynamically to avoid circular dependencies)
    const { syncRoleToMetadata } = await import('@/lib/supabase/admin')
    await syncRoleToMetadata(userId, role)
  } finally {
    db.close()
  }
}

/**
 * Get users associated with this user (for resellers/intermediaries)
 * Returns array of child user IDs
 */
export async function getAssociatedUsers(userId: string): Promise<string[]> {
  const db = getDb()

  try {
    const stmt = db.prepare(`
      SELECT child_user_id
      FROM user_associations
      WHERE parent_user_id = ?
    `)
    const results = stmt.all(userId) as { child_user_id: string }[]
    return results.map(r => r.child_user_id)
  } finally {
    db.close()
  }
}

/**
 * Create association between parent (reseller/intermediary) and child (customer)
 */
export async function createUserAssociation(
  parentUserId: string,
  childUserId: string,
  associationType: 'reseller' | 'intermediary',
  createdBy?: string
): Promise<void> {
  const db = getDb()

  try {
    const stmt = db.prepare(`
      INSERT INTO user_associations (parent_user_id, child_user_id, association_type, created_by, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(parent_user_id, child_user_id) DO UPDATE SET
        association_type = excluded.association_type
    `)

    stmt.run(parentUserId, childUserId, associationType, createdBy || null)
  } finally {
    db.close()
  }
}

/**
 * Remove association between users
 */
export async function removeUserAssociation(parentUserId: string, childUserId: string): Promise<void> {
  const db = getDb()

  try {
    const stmt = db.prepare(`
      DELETE FROM user_associations
      WHERE parent_user_id = ? AND child_user_id = ?
    `)

    stmt.run(parentUserId, childUserId)
  } finally {
    db.close()
  }
}

/**
 * Check if user has one of the allowed roles
 */
export function hasRole(authContext: AuthContext, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(authContext.role)
}

/**
 * Check if user can access a specific customer
 */
export async function canAccessCustomer(
  authContext: AuthContext,
  customerOwnerId: string | null
): Promise<boolean> {
  const { userId, role } = authContext

  // Superadmin can access all
  if (role === 'superadmin') return true

  // If no owner, deny access (except superadmin)
  if (!customerOwnerId) return false

  // Owner can access their own
  if (userId === customerOwnerId) return true

  // Resellers and intermediaries can access their associated customers
  if (role === 'rivenditore' || role === 'intermediario') {
    const associatedUsers = await getAssociatedUsers(userId)
    return associatedUsers.includes(customerOwnerId)
  }

  return false
}

/**
 * Check if user can access a specific report
 */
export async function canAccessReport(
  authContext: AuthContext,
  reportOwnerId: string | null
): Promise<boolean> {
  const { userId, role } = authContext

  // Superadmin can access all
  if (role === 'superadmin') return true

  // If no owner, deny access (except superadmin)
  if (!reportOwnerId) return false

  // Owner can access their own
  if (userId === reportOwnerId) return true

  // Resellers and intermediaries can access reports of their associated customers
  if (role === 'rivenditore' || role === 'intermediario') {
    const associatedUsers = await getAssociatedUsers(userId)
    return associatedUsers.includes(reportOwnerId)
  }

  return false
}

/**
 * Get auth context from user session
 * Throws error if user is not authenticated or has no role
 */
export async function getAuthContext(user: User | null): Promise<AuthContext> {
  if (!user) {
    throw new Error('Unauthorized: No user session')
  }

  const role = await getUserRole(user.id)

  if (!role) {
    throw new Error('Unauthorized: No role assigned to user')
  }

  return {
    user,
    role,
    userId: user.id
  }
}

/**
 * Check if user can perform admin actions (create/edit/delete customers, assign licenses)
 */
export function canPerformAdminActions(authContext: AuthContext): boolean {
  return authContext.role === 'superadmin'
}

/**
 * Check if user can view customer list
 */
export function canViewCustomerList(authContext: AuthContext): boolean {
  // Only resellers, intermediaries, and superadmins can view customer list
  return ['rivenditore', 'intermediario', 'superadmin'].includes(authContext.role)
}

/**
 * Get accessible customer IDs for a user based on their role
 * Returns null for superadmin (can access all)
 * Returns array of customer owner IDs for other roles
 */
export async function getAccessibleCustomerOwnerIds(authContext: AuthContext): Promise<string[] | null> {
  const { userId, role } = authContext

  // Superadmin can access all
  if (role === 'superadmin') return null

  // Resellers and intermediaries can access their associated customers + themselves
  if (role === 'rivenditore' || role === 'intermediario') {
    const associatedUsers = await getAssociatedUsers(userId)
    return [userId, ...associatedUsers]
  }

  // Regular customers can only access their own
  return [userId]
}
