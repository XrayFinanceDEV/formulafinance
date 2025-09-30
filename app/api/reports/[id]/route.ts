import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, execute, queryOne } from '@/lib/db/sqlite';

/**
 * GET /api/reports/[id]
 * Get a single report by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reportId = parseInt(id);

    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
    }

    const db = getDatabase();
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
      .get(reportId) as any;

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

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

    return NextResponse.json({ data: transformedReport });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/reports/[id]
 * Update a report
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reportId = parseInt(id);

    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
    }

    const body = await request.json();

    // Check if report exists
    const existing = queryOne('SELECT id FROM reports WHERE id = ?', [reportId]);
    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Support both user_id and customer_id
    const customerId = body.customer_id || body.user_id;

    // Update report
    execute(
      `UPDATE reports SET
        customer_id = ?,
        module_id = ?,
        report_type = ?,
        status = ?,
        input_data = ?,
        api_response = ?,
        generated_html = ?,
        completed_at = ?
      WHERE id = ?`,
      [
        customerId,
        body.module_id,
        body.report_type,
        body.status || 'pending',
        JSON.stringify(body.input_data),
        body.api_response ? JSON.stringify(body.api_response) : null,
        body.generated_html || null,
        body.completed_at || null,
        reportId,
      ]
    );

    // Fetch updated report
    const db = getDatabase();
    const updated = db
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
      .get(reportId) as any;

    // Transform to match expected format
    const transformedReport = {
      id: updated.id,
      user_id: updated.user_id,
      module_id: updated.module_id,
      report_type: updated.report_type,
      status: updated.status,
      input_data: updated.input_data ? JSON.parse(updated.input_data) : {},
      api_response: updated.api_response ? JSON.parse(updated.api_response) : null,
      generated_html: updated.generated_html,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
      completed_at: updated.completed_at,
      module: {
        name: updated.module_name,
        display_name: updated.module_display_name,
      },
    };

    return NextResponse.json({ data: transformedReport });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Failed to update report', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports/[id]
 * Delete a report
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reportId = parseInt(id);

    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
    }

    // Check if report exists
    const existing = queryOne('SELECT id FROM reports WHERE id = ?', [reportId]);
    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Delete report
    execute('DELETE FROM reports WHERE id = ?', [reportId]);

    return NextResponse.json({ data: { id: reportId } });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report', message: String(error) },
      { status: 500 }
    );
  }
}