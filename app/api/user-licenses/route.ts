import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDatabase } from '@/lib/db/sqlite'

/**
 * GET /api/user-licenses
 * Fetch licenses for the current authenticated user's customers
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const db = getDatabase()

    // Find all customers owned by this user
    const customers = db
      .prepare(`
        SELECT id FROM customers WHERE owner_user_id = ?
      `)
      .all(user.id) as { id: number }[]

    if (customers.length === 0) {
      return NextResponse.json({
        data: [],
        total: 0
      })
    }

    const customerIds = customers.map(c => c.id)
    const placeholders = customerIds.map(() => '?').join(',')

    // Fetch all licenses for these customers
    const licenses = db
      .prepare(`
        SELECT
          l.*,
          m.name as module_name,
          m.display_name as module_display_name,
          m.description as module_description
        FROM licenses l
        LEFT JOIN modules m ON l.module_id = m.id
        WHERE l.customer_id IN (${placeholders})
        ORDER BY l.expiration_date ASC
      `)
      .all(...customerIds) as any[]

    // Transform the results to include nested module object
    const transformedLicenses = licenses.map(license => ({
      id: license.id,
      user_id: license.customer_id, // Map customer_id to user_id for backwards compatibility
      module_id: license.module_id,
      quantity_total: license.quantity_total,
      quantity_used: license.quantity_used,
      activation_date: license.activation_date,
      expiration_date: license.expiration_date,
      status: license.status,
      created_at: license.created_at,
      updated_at: license.updated_at,
      module: {
        id: license.module_id,
        name: license.module_name,
        display_name: license.module_display_name,
        description: license.module_description,
        is_active: true,
      }
    }))

    return NextResponse.json({
      data: transformedLicenses,
      total: transformedLicenses.length
    })
  } catch (error) {
    console.error('Error fetching user licenses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
