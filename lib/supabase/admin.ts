import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Admin Client
 * Uses service role key for admin operations (server-side only)
 * NEVER expose this client to the browser!
 */

// Lazy initialization to allow environment variables to be loaded first
let _supabaseAdmin: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error(
        'Missing Supabase credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
      )
    }

    _supabaseAdmin = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }

  return _supabaseAdmin
}

// Export for backwards compatibility
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    return getSupabaseAdmin()[prop as keyof ReturnType<typeof createClient>]
  }
})

export type UserRole = 'cliente' | 'potenziale' | 'rivenditore' | 'intermediario' | 'superadmin'

/**
 * Sync user role to Supabase user metadata
 * This allows role to be included in JWT for faster middleware checks
 */
export async function syncRoleToMetadata(userId: string, role: UserRole) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        app_metadata: { role }
      }
    )

    if (error) {
      console.error('Error syncing role to metadata:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to sync role to metadata:', error)
    throw error
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) throw error

    const user = data.users.find(u => u.email === email)
    return user || null
  } catch (error) {
    console.error('Error getting user by email:', error)
    throw error
  }
}

/**
 * Create a new user with role
 */
export async function createUserWithRole(
  email: string,
  password: string,
  role: UserRole,
  metadata?: Record<string, any>
) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role },
      user_metadata: metadata || {}
    })

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error creating user with role:', error)
    throw error
  }
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
}

/**
 * List all users
 */
export async function listAllUsers() {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) throw error

    return data.users
  } catch (error) {
    console.error('Error listing users:', error)
    throw error
  }
}
