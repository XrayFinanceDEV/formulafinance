import { NextRequest, NextResponse } from 'next/server';
import {
  getDatabase,
  paginate,
  buildWhereClause,
  buildOrderByClause,
  execute,
} from '@/lib/db/sqlite';

/**
 * GET /api/licenses
 * List all licenses with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '10');

    // Sorting
    const sortField = searchParams.get('sortField') || 'id';
    const sortOrder = (searchParams.get('sortOrder') || 'DESC') as 'ASC' | 'DESC';

    // Filters
    const customer_id = searchParams.get('customer_id') || searchParams.get('user_id');
    const module_id = searchParams.get('module_id');
    const status = searchParams.get('status');

    // Build WHERE clause
    const filters: Record<string, any> = {};
    if (customer_id) filters.customer_id = parseInt(customer_id);
    if (module_id) filters.module_id = parseInt(module_id);
    if (status) filters.status = status;

    const { where, params } = buildWhereClause(filters, ['customer_id', 'module_id', 'status']);

    // Build ORDER BY clause
    const orderBy = buildOrderByClause(
      sortField === 'user_id' ? 'customer_id' : sortField,
      sortOrder,
      ['id', 'customer_id', 'module_id', 'status', 'activation_date', 'expiration_date', 'created_at'],
      'id',
      'DESC'
    );

    // Base query with JOIN to get module info
    const baseQuery = `
      SELECT
        l.id, l.customer_id as user_id, l.module_id,
        l.quantity_total, l.quantity_used,
        l.activation_date, l.expiration_date, l.status,
        l.created_at, l.updated_at,
        m.name as module_name, m.display_name as module_display_name,
        m.description as module_description, m.is_active as module_is_active
      FROM licenses l
      LEFT JOIN modules m ON l.module_id = m.id
      ${where}
      ${orderBy}
    `;

    const countQuery = `SELECT COUNT(*) as total FROM licenses ${where}`;

    // Get paginated results
    const result = paginate(baseQuery, countQuery, params, { page, perPage });

    // Transform data to match ra-core expectations with nested module
    const transformedData = result.data.map((license: any) => ({
      id: license.id,
      user_id: license.user_id,
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
        is_active: license.module_is_active === 1,
      },
    }));

    return NextResponse.json({
      data: transformedData,
      total: result.total,
      page: result.page,
      perPage: result.perPage,
    });
  } catch (error) {
    console.error('Error fetching licenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch licenses', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/licenses
 * Create a new license
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    // Support both user_id and customer_id
    const customerId = body.customer_id || body.user_id;

    if (!customerId || !body.module_id || !body.quantity_total || !body.activation_date || !body.expiration_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert license
    const result = execute(
      `INSERT INTO licenses (
        customer_id, module_id, quantity_total, quantity_used,
        activation_date, expiration_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        customerId,
        body.module_id,
        body.quantity_total,
        body.quantity_used || 0,
        body.activation_date,
        body.expiration_date,
        body.status || 'active',
      ]
    );

    // Fetch the created license with module info
    const db = getDatabase();
    const license = db
      .prepare(
        `SELECT
          l.id, l.customer_id as user_id, l.module_id,
          l.quantity_total, l.quantity_used,
          l.activation_date, l.expiration_date, l.status,
          l.created_at, l.updated_at,
          m.name as module_name, m.display_name as module_display_name,
          m.description as module_description, m.is_active as module_is_active
        FROM licenses l
        LEFT JOIN modules m ON l.module_id = m.id
        WHERE l.id = ?`
      )
      .get(result.lastInsertRowid) as any;

    // Transform to match expected format
    const transformedLicense = {
      id: license.id,
      user_id: license.user_id,
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
        is_active: license.module_is_active === 1,
      },
    };

    return NextResponse.json({ data: transformedLicense }, { status: 201 });
  } catch (error) {
    console.error('Error creating license:', error);
    return NextResponse.json(
      { error: 'Failed to create license', message: String(error) },
      { status: 500 }
    );
  }
}