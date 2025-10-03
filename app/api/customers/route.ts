import { NextRequest, NextResponse } from 'next/server';
import {
  getDatabase,
  paginate,
  buildWhereClause,
  buildSearchClause,
  buildOrderByClause,
  execute,
} from '@/lib/db/sqlite';
import { createUserWithRole, type UserRole } from '@/lib/supabase/admin';

/**
 * GET /api/customers
 * List all customers with pagination, filtering, and search
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '10');

    // Sorting
    const sortField = searchParams.get('sortField') || 'id';
    const sortOrder = (searchParams.get('sortOrder') || 'ASC') as 'ASC' | 'DESC';

    // Search
    const search = searchParams.get('search') || searchParams.get('q');

    // Filters
    const tipo_utente = searchParams.get('tipo_utente');
    const stato = searchParams.get('stato');
    const owner_user_id = searchParams.get('owner_user_id');

    // Build query
    const db = getDatabase();

    // Build WHERE clause for filters
    const filters: Record<string, any> = {};
    if (tipo_utente) filters.tipo_utente = tipo_utente;
    if (stato) filters.stato = stato;
    if (owner_user_id) filters.owner_user_id = owner_user_id;

    const { where: filterWhere, params: filterParams } = buildWhereClause(filters, [
      'tipo_utente',
      'stato',
      'owner_user_id',
    ]);

    // Build search clause
    const { search: searchClause, params: searchQueryParams } = buildSearchClause(search || undefined, [
      'ragione_sociale',
      'email',
      'partita_iva',
      'codice_fiscale',
    ]);

    // Combine WHERE clauses
    let whereClause = '';
    const allParams: any[] = [];

    if (filterWhere && searchClause) {
      whereClause = `WHERE ${filterWhere.replace('WHERE ', '')} AND ${searchClause}`;
      allParams.push(...filterParams, ...searchQueryParams);
    } else if (filterWhere) {
      whereClause = filterWhere;
      allParams.push(...filterParams);
    } else if (searchClause) {
      whereClause = `WHERE ${searchClause}`;
      allParams.push(...searchQueryParams);
    }

    // Build ORDER BY clause
    const orderBy = buildOrderByClause(
      sortField,
      sortOrder,
      ['id', 'ragione_sociale', 'email', 'tipo_utente', 'stato', 'created_at'],
      'id',
      'ASC'
    );

    // Base query and count query
    const baseQuery = `
      SELECT
        id, ragione_sociale, partita_iva, codice_fiscale, tipo_utente, soggetto, stato,
        email, pec_email, telefono, telefono_alt,
        via, citta, cap, provincia, paese,
        parent_id, note_aggiuntive,
        created_at, updated_at
      FROM customers
      ${whereClause}
      ${orderBy}
    `;

    const countQuery = `SELECT COUNT(*) as total FROM customers ${whereClause}`;

    // Get paginated results
    const result = paginate(baseQuery, countQuery, allParams, { page, perPage });

    // Return ra-core compatible format
    return NextResponse.json({
      data: result.data,
      total: result.total,
      page: result.page,
      perPage: result.perPage,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/customers
 * Create a new customer with Supabase auth user and role
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.ragione_sociale || !body.partita_iva || !body.tipo_utente || !body.soggetto || !body.email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate password if provided (for creating auth user)
    if (body.password && body.password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Map tipo_utente to UserRole
    const tipoUtenteToRole: Record<string, UserRole> = {
      'cliente': 'cliente',
      'potenziale': 'potenziale',
      'rivenditore': 'rivenditore',
      'intermediario': 'intermediario',
    };

    const role = tipoUtenteToRole[body.tipo_utente];
    if (!role) {
      return NextResponse.json(
        { error: 'Invalid tipo_utente value' },
        { status: 400 }
      );
    }

    let supabaseUserId: string | null = null;

    // Create Supabase auth user if password is provided
    if (body.password) {
      try {
        const supabaseUser = await createUserWithRole(
          body.email,
          body.password,
          role,
          {
            full_name: body.ragione_sociale,
            ragione_sociale: body.ragione_sociale,
            partita_iva: body.partita_iva,
          }
        );

        supabaseUserId = supabaseUser.user.id;

        // Insert role into user_roles table
        const db = getDatabase();
        db.prepare(`
          INSERT INTO user_roles (user_id, role, created_at, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).run(supabaseUserId, role);

        console.log(`✅ Created Supabase user with role ${role} for ${body.email}`);
      } catch (authError: any) {
        console.error('Error creating Supabase user:', authError);
        return NextResponse.json(
          {
            error: 'Failed to create authentication user',
            message: authError.message || String(authError)
          },
          { status: 500 }
        );
      }
    }

    // Insert customer
    const result = execute(
      `INSERT INTO customers (
        ragione_sociale, partita_iva, codice_fiscale, tipo_utente, soggetto, stato,
        email, pec_email, telefono, telefono_alt,
        via, citta, cap, provincia, paese,
        parent_id, note_aggiuntive
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      ]
    );

    // Fetch the created customer
    const db = getDatabase();
    const customer = db
      .prepare('SELECT * FROM customers WHERE id = ?')
      .get(result.lastInsertRowid);

    return NextResponse.json({
      data: customer,
      auth_user_created: !!supabaseUserId,
      supabase_user_id: supabaseUserId,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer', message: String(error) },
      { status: 500 }
    );
  }
}