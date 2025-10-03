import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/sqlite'
import { canViewStats } from '@/lib/associations/validation'
import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/auth/authorization'
import { AssociationStats } from '@/types/associations'

/**
 * Get association statistics for Rivenditore or Intermediario
 * Shows stats for all children (customers associated with the user)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
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

    // Check if user can view stats
    const userRole = await getUserRole(user.id)
    if (!canViewStats(userRole)) {
      return NextResponse.json(
        { error: 'You do not have permission to view stats' },
        { status: 403 }
      )
    }

    // Non-superadmin can only view their own stats
    if (userRole !== 'superadmin' && user.id !== userId) {
      return NextResponse.json(
        { error: 'You can only view your own stats' },
        { status: 403 }
      )
    }

    const db = getDatabase()

    // Get associated customers with license stats
    const children = db
      .prepare(
        `
      SELECT
        c.id,
        c.ragione_sociale as name,
        c.tipo_utente as type,
        c.stato as status,
        c.email,
        c.citta || ' (' || c.provincia || ')' as location,
        ua.association_type,
        COUNT(DISTINCT l.id) as license_count,
        COALESCE(SUM(l.quantity_total), 0) as total_licenses,
        COALESCE(SUM(l.quantity_used), 0) as used_licenses
      FROM user_associations ua
      JOIN customers c ON ua.child_user_id = c.id
      LEFT JOIN licenses l ON l.user_id = c.id AND l.status = 'active'
      WHERE ua.parent_user_id = ?
      GROUP BY c.id
      ORDER BY c.ragione_sociale
    `
      )
      .all(userId)

    // Calculate aggregated stats
    const stats: AssociationStats = {
      totalChildren: children.length,
      byType: {
        intermediario: children.filter((c: any) => c.type === 'intermediario')
          .length,
        cliente: children.filter((c: any) => c.type === 'cliente').length,
        potenziale: children.filter((c: any) => c.type === 'potenziale').length,
      },
      licenses: {
        total: children.reduce(
          (sum: number, c: any) => sum + (c.total_licenses || 0),
          0
        ),
        used: children.reduce(
          (sum: number, c: any) => sum + (c.used_licenses || 0),
          0
        ),
      },
      children: children.map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status,
        licenseCount: c.license_count,
        licenseUsage:
          c.total_licenses > 0
            ? Math.round((c.used_licenses / c.total_licenses) * 100)
            : 0,
        location: c.location,
        email: c.email,
      })),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Get association stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get association stats' },
      { status: 500 }
    )
  }
}
