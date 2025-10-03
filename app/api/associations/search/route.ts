import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/sqlite'
import { getValidChildTypes } from '@/lib/associations/validation'
import { UserRole } from '@/types/rbac'

/**
 * Search for potential parent customers to associate
 * Only superadmin can access this endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const childId = searchParams.get('childId')
    const childType = searchParams.get('childType') as UserRole

    if (!childId || !childType) {
      return NextResponse.json(
        { error: 'childId and childType are required' },
        { status: 400 }
      )
    }

    const db = getDatabase()

    // Determine valid parent types based on child type
    let validParentTypes: string[] = []

    if (['cliente', 'potenziale'].includes(childType)) {
      // Can be associated with both Rivenditore and Intermediario
      validParentTypes = ['rivenditore', 'intermediario']
    } else if (childType === 'intermediario') {
      // Can only be associated with Rivenditore
      validParentTypes = ['rivenditore']
    } else {
      // Rivenditore and Superadmin cannot be children
      return NextResponse.json(
        { error: 'This customer type cannot have a parent' },
        { status: 400 }
      )
    }

    // Search customers that can be parents
    const customers = db
      .prepare(
        `
      SELECT
        id,
        ragione_sociale,
        tipo_utente,
        citta,
        provincia,
        stato,
        email
      FROM customers
      WHERE tipo_utente IN (${validParentTypes.map(() => '?').join(',')})
        AND LOWER(ragione_sociale) LIKE LOWER(?)
        AND id != ?
        AND stato = 'attivo'
        AND id NOT IN (
          -- Exclude already associated parents
          SELECT parent_user_id FROM user_associations WHERE child_user_id = ?
        )
        AND id NOT IN (
          -- Exclude customers that would create circular reference
          SELECT child_user_id FROM user_associations WHERE parent_user_id = ?
        )
      ORDER BY ragione_sociale
      LIMIT 20
    `
      )
      .all(...validParentTypes, `%${query}%`, childId, childId, childId)

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Search associations error:', error)
    return NextResponse.json(
      { error: 'Failed to search associations' },
      { status: 500 }
    )
  }
}
