import { NextRequest, NextResponse } from 'next/server';
import {
  getDatabase,
  paginate,
  buildWhereClause,
  buildOrderByClause,
  execute,
} from '@/lib/db/sqlite';

/**
 * GET /api/reports
 * List all reports with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '10');

    // Sorting
    const sortField = searchParams.get('sortField') || 'created_at';
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

    // Build ORDER BY clause with table prefix to avoid ambiguous column names
    const mappedSortField = sortField === 'user_id' ? 'customer_id' : sortField;
    const orderBy = buildOrderByClause(
      mappedSortField,
      sortOrder,
      ['id', 'customer_id', 'module_id', 'status', 'created_at', 'updated_at', 'completed_at'],
      'created_at',
      'DESC'
    ).replace('ORDER BY ', 'ORDER BY r.');

    // Base query with JOINs
    const baseQuery = `
      SELECT
        r.id, r.customer_id as user_id, r.module_id, r.report_type, r.status,
        r.input_data, r.api_response, r.generated_html,
        r.created_at as created_at, r.updated_at as updated_at, r.completed_at as completed_at,
        m.name as module_name, m.display_name as module_display_name
      FROM reports r
      LEFT JOIN modules m ON r.module_id = m.id
      ${where}
      ${orderBy}
    `;

    const countQuery = `SELECT COUNT(*) as total FROM reports ${where}`;

    // Get paginated results
    const result = paginate(baseQuery, countQuery, params, { page, perPage });

    // Transform data to match ra-core expectations
    const transformedData = result.data.map((report: any) => ({
      id: report.id,
      user_id: report.user_id,
      module_id: report.module_id,
      report_type: report.report_type,
      status: report.status,
      input_data: report.input_data ? JSON.parse(report.input_data) : {},
      api_response: report.api_response ? JSON.parse(report.api_response) : null,
      generated_html: report.generated_html,
      created_at: report.created_at,
      updated_at: report.updated_at,
      completed_at: report.completed_at,
      module: {
        name: report.module_name,
        display_name: report.module_display_name,
      },
    }));

    return NextResponse.json({
      data: transformedData,
      total: result.total,
      page: result.page,
      perPage: result.perPage,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports
 * Create a new report
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support both user_id and customer_id
    const customerId = body.customer_id || body.user_id;

    // Validate required fields
    if (!customerId || !body.module_id || !body.report_type || !body.input_data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Check if customer has an active license for this module
    const license = db
      .prepare(
        `SELECT id, quantity_total, quantity_used, status, expiration_date
         FROM licenses
         WHERE customer_id = ? AND module_id = ? AND status = 'active'
         ORDER BY expiration_date DESC
         LIMIT 1`
      )
      .get(customerId, body.module_id) as any;

    if (!license) {
      return NextResponse.json(
        { error: 'No active license found for this module' },
        { status: 403 }
      );
    }

    // Check if license has available quantity
    const remainingQuantity = license.quantity_total - license.quantity_used;
    if (remainingQuantity <= 0) {
      return NextResponse.json(
        { error: 'License limit reached. No credits available.' },
        { status: 403 }
      );
    }

    // Check if license is expired
    const expirationDate = new Date(license.expiration_date);
    if (expirationDate < new Date()) {
      return NextResponse.json(
        { error: 'License has expired' },
        { status: 403 }
      );
    }

    // Insert report
    const result = execute(
      `INSERT INTO reports (
        customer_id, module_id, report_type, status,
        input_data, api_response, generated_html, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customerId,
        body.module_id,
        body.report_type,
        body.status || 'pending',
        JSON.stringify(body.input_data),
        body.api_response ? JSON.stringify(body.api_response) : null,
        body.generated_html || null,
        body.completed_at || null,
      ]
    );

    // Decrement license usage
    execute(
      `UPDATE licenses
       SET quantity_used = quantity_used + 1
       WHERE id = ?`,
      [license.id]
    );

    // Fetch the created report
    const report = db
      .prepare(
        `SELECT
          r.id, r.customer_id as user_id, r.module_id, r.report_type, r.status,
          r.input_data, r.api_response, r.generated_html,
          r.created_at, r.updated_at, r.completed_at,
          m.name as module_name, m.display_name as module_display_name
        FROM reports r
        LEFT JOIN modules m ON r.module_id = m.id
        WHERE r.id = ?`
      )
      .get(result.lastInsertRowid) as any;

    // Transform to match expected format
    const transformedReport = {
      id: report.id,
      user_id: report.user_id,
      module_id: report.module_id,
      report_type: report.report_type,
      status: report.status,
      input_data: report.input_data ? JSON.parse(report.input_data) : {},
      api_response: report.api_response ? JSON.parse(report.api_response) : null,
      generated_html: report.generated_html,
      created_at: report.created_at,
      updated_at: report.updated_at,
      completed_at: report.completed_at,
      module: {
        name: report.module_name,
        display_name: report.module_display_name,
      },
    };

    return NextResponse.json({ data: transformedReport }, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report', message: String(error) },
      { status: 500 }
    );
  }
}