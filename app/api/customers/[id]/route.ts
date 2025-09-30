import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, execute, queryOne } from '@/lib/db/sqlite';

/**
 * GET /api/customers/[id]
 * Get a single customer by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerId = parseInt(id);

    if (isNaN(customerId)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    const customer = queryOne(
      `SELECT
        id, ragione_sociale, partita_iva, codice_fiscale, tipo_utente, soggetto, stato,
        email, pec_email, telefono, telefono_alt,
        via, citta, cap, provincia, paese,
        parent_id, note_aggiuntive,
        created_at, updated_at
      FROM customers
      WHERE id = ?`,
      [customerId]
    );

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ data: customer });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/customers/[id]
 * Update a customer
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerId = parseInt(id);

    if (isNaN(customerId)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    const body = await request.json();

    // Check if customer exists
    const existing = queryOne('SELECT id FROM customers WHERE id = ?', [customerId]);
    if (!existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Update customer
    execute(
      `UPDATE customers SET
        ragione_sociale = ?,
        partita_iva = ?,
        codice_fiscale = ?,
        tipo_utente = ?,
        soggetto = ?,
        stato = ?,
        email = ?,
        pec_email = ?,
        telefono = ?,
        telefono_alt = ?,
        via = ?,
        citta = ?,
        cap = ?,
        provincia = ?,
        paese = ?,
        parent_id = ?,
        note_aggiuntive = ?
      WHERE id = ?`,
      [
        body.ragione_sociale,
        body.partita_iva,
        body.codice_fiscale || null,
        body.tipo_utente,
        body.soggetto,
        body.stato || 'attivo',
        body.email,
        body.pec_email || null,
        body.telefono || null,
        body.telefono_alt || null,
        body.via || null,
        body.citta || null,
        body.cap || null,
        body.provincia || null,
        body.paese || 'IT',
        body.parent_id || null,
        body.note_aggiuntive || null,
        customerId,
      ]
    );

    // Fetch updated customer
    const updated = queryOne('SELECT * FROM customers WHERE id = ?', [customerId]);

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/customers/[id]
 * Delete a customer
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerId = parseInt(id);

    if (isNaN(customerId)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    // Check if customer exists
    const existing = queryOne('SELECT id FROM customers WHERE id = ?', [customerId]);
    if (!existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Delete customer (CASCADE will delete related licenses and reports)
    execute('DELETE FROM customers WHERE id = ?', [customerId]);

    return NextResponse.json({ data: { id: customerId } });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer', message: String(error) },
      { status: 500 }
    );
  }
}