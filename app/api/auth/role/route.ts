import { NextRequest, NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth/authorization'

/**
 * GET /api/auth/role?userId=xxx
 * Fetch user role from database
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    )
  }

  try {
    const role = await getUserRole(userId)

    if (!role) {
      return NextResponse.json(
        { error: 'User role not found', role: null },
        { status: 404 }
      )
    }

    return NextResponse.json({ role })
  } catch (error) {
    console.error('Error fetching user role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
