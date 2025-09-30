import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, execute, queryOne } from '@/lib/db/sqlite';

/**
 * GET /api/licenses/[id]
 * Get a single license by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const licenseId = parseInt(id);

    if (isNaN(licenseId)) {
      return NextResponse.json({ error: 'Invalid license ID' }, { status: 400 });
    }

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
      .get(licenseId) as any;

    if (!license) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

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

    return NextResponse.json({ data: transformedLicense });
  } catch (error) {
    console.error('Error fetching license:', error);
    return NextResponse.json(
      { error: 'Failed to fetch license', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/licenses/[id]
 * Update a license
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const licenseId = parseInt(id);

    if (isNaN(licenseId)) {
      return NextResponse.json({ error: 'Invalid license ID' }, { status: 400 });
    }

    const body = await request.json();

    // Check if license exists
    const existing = queryOne('SELECT id FROM licenses WHERE id = ?', [licenseId]);
    if (!existing) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    // Support both user_id and customer_id
    const customerId = body.customer_id || body.user_id;

    // Update license
    execute(
      `UPDATE licenses SET
        customer_id = ?,
        module_id = ?,
        quantity_total = ?,
        quantity_used = ?,
        activation_date = ?,
        expiration_date = ?,
        status = ?
      WHERE id = ?`,
      [
        customerId,
        body.module_id,
        body.quantity_total,
        body.quantity_used || 0,
        body.activation_date,
        body.expiration_date,
        body.status || 'active',
        licenseId,
      ]
    );

    // Fetch updated license with module info
    const db = getDatabase();
    const updated = db
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
      .get(licenseId) as any;

    // Transform to match expected format
    const transformedLicense = {
      id: updated.id,
      user_id: updated.user_id,
      module_id: updated.module_id,
      quantity_total: updated.quantity_total,
      quantity_used: updated.quantity_used,
      activation_date: updated.activation_date,
      expiration_date: updated.expiration_date,
      status: updated.status,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
      module: {
        id: updated.module_id,
        name: updated.module_name,
        display_name: updated.module_display_name,
        description: updated.module_description,
        is_active: updated.module_is_active === 1,
      },
    };

    return NextResponse.json({ data: transformedLicense });
  } catch (error) {
    console.error('Error updating license:', error);
    return NextResponse.json(
      { error: 'Failed to update license', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/licenses/[id]
 * Delete a license
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const licenseId = parseInt(id);

    if (isNaN(licenseId)) {
      return NextResponse.json({ error: 'Invalid license ID' }, { status: 400 });
    }

    // Check if license exists
    const existing = queryOne('SELECT id FROM licenses WHERE id = ?', [licenseId]);
    if (!existing) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    // Delete license
    execute('DELETE FROM licenses WHERE id = ?', [licenseId]);

    return NextResponse.json({ data: { id: licenseId } });
  } catch (error) {
    console.error('Error deleting license:', error);
    return NextResponse.json(
      { error: 'Failed to delete license', message: String(error) },
      { status: 500 }
    );
  }
}