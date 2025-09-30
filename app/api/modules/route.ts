import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, paginate, buildOrderByClause } from '@/lib/db/sqlite';

/**
 * GET /api/modules
 * List all modules with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '50'); // Higher default for modules

    // Sorting
    const sortField = searchParams.get('sortField') || 'id';
    const sortOrder = (searchParams.get('sortOrder') || 'ASC') as 'ASC' | 'DESC';

    // Build ORDER BY clause
    const orderBy = buildOrderByClause(
      sortField,
      sortOrder,
      ['id', 'name', 'display_name', 'is_active', 'created_at'],
      'id',
      'ASC'
    );

    // Base query
    const baseQuery = `
      SELECT id, name, display_name, description, is_active, created_at
      FROM modules
      ${orderBy}
    `;

    const countQuery = `SELECT COUNT(*) as total FROM modules`;

    // Get paginated results
    const result = paginate(baseQuery, countQuery, [], { page, perPage });

    // Transform data to match ra-core expectations
    const transformedData = result.data.map((module: any) => ({
      ...module,
      is_active: module.is_active === 1,
    }));

    return NextResponse.json({
      data: transformedData,
      total: result.total,
      page: result.page,
      perPage: result.perPage,
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modules', message: String(error) },
      { status: 500 }
    );
  }
}