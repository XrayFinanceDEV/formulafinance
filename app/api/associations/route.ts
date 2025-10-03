import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/sqlite'
import {
  validateAssociation,
  getAssociationType,
  canManageAssociations,
} from '@/lib/associations/validation'
import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/auth/authorization'

/**
 * Create a new association between parent and child customers
 * Only superadmin can create associations
 */
export async function POST(request: NextRequest) {
  try {
    const { parentId, childId, notes } = await request.json()

    if (!parentId || !childId) {
      return NextResponse.json(
        { error: 'parentId and childId are required' },
        { status: 400 }
      )
    }

    // Get current user from session
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is superadmin
    const userRole = await getUserRole(user.id)
    if (!canManageAssociations(userRole)) {
      return NextResponse.json(
        { error: 'Only superadmin can create associations' },
        { status: 403 }
      )
    }

    const db = getDatabase()

    // Get both customers
    const parent = db
      .prepare('SELECT id, tipo_utente FROM customers WHERE id = ?')
      .get(parentId)
    const child = db
      .prepare('SELECT id, tipo_utente FROM customers WHERE id = ?')
      .get(childId)

    if (!parent || !child) {
      return NextResponse.json(
        { error: 'Parent or child customer not found' },
        { status: 404 }
      )
    }

    // Validate association
    const validation = validateAssociation(
      parent.tipo_utente,
      child.tipo_utente,
      userRole
    )

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Check for existing association
    const existing = db
      .prepare(
        'SELECT id FROM user_associations WHERE parent_user_id = ? AND child_user_id = ?'
      )
      .get(parentId, childId)

    if (existing) {
      return NextResponse.json(
        { error: 'Association already exists' },
        { status: 400 }
      )
    }

    // Check for circular reference
    const existingReverse = db
      .prepare(
        'SELECT id FROM user_associations WHERE parent_user_id = ? AND child_user_id = ?'
      )
      .get(childId, parentId)

    if (existingReverse) {
      return NextResponse.json(
        { error: 'Circular association not allowed' },
        { status: 400 }
      )
    }

    // Determine association type
    const associationType = getAssociationType(parent.tipo_utente)

    // Create association
    const result = db
      .prepare(
        `
      INSERT INTO user_associations (parent_user_id, child_user_id, association_type, created_by, notes, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `
      )
      .run(parentId, childId, associationType, user.id, notes || null)

    return NextResponse.json({
      id: result.lastInsertRowid,
      success: true,
      message: 'Association created successfully',
    })
  } catch (error) {
    console.error('Create association error:', error)
    return NextResponse.json(
      { error: 'Failed to create association' },
      { status: 500 }
    )
  }
}

/**
 * Get associations for a customer
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      )
    }

    const db = getDatabase()

    // Get parent association
    const parent = db
      .prepare(
        `
      SELECT
        ua.*,
        c.ragione_sociale as parent_name,
        c.tipo_utente as parent_role,
        c.citta,
        c.provincia
      FROM user_associations ua
      JOIN customers c ON ua.parent_user_id = c.id
      WHERE ua.child_user_id = ?
    `
      )
      .get(customerId)

    // Get children associations
    const children = db
      .prepare(
        `
      SELECT
        ua.*,
        c.ragione_sociale as child_name,
        c.tipo_utente as child_role,
        c.citta,
        c.provincia
      FROM user_associations ua
      JOIN customers c ON ua.child_user_id = c.id
      WHERE ua.parent_user_id = ?
    `
      )
      .all(customerId)

    return NextResponse.json({
      parent: parent || null,
      children: children || [],
    })
  } catch (error) {
    console.error('Get associations error:', error)
    return NextResponse.json(
      { error: 'Failed to get associations' },
      { status: 500 }
    )
  }
}

/**
 * Delete an association
 * Only superadmin can delete associations
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const associationId = searchParams.get('id')

    if (!associationId) {
      return NextResponse.json(
        { error: 'Association id is required' },
        { status: 400 }
      )
    }

    // Get current user from session
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is superadmin
    const userRole = await getUserRole(user.id)
    if (!canManageAssociations(userRole)) {
      return NextResponse.json(
        { error: 'Only superadmin can delete associations' },
        { status: 403 }
      )
    }

    const db = getDatabase()

    // Delete association
    const result = db
      .prepare('DELETE FROM user_associations WHERE id = ?')
      .run(associationId)

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Association not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Association deleted successfully',
    })
  } catch (error) {
    console.error('Delete association error:', error)
    return NextResponse.json(
      { error: 'Failed to delete association' },
      { status: 500 }
    )
  }
}
