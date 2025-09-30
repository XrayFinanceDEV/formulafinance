# SQLite Database Implementation

This directory contains the SQLite database implementation for FormulaFinance, providing a persistent local database solution integrated with ra-core.

## 📁 File Structure

```
lib/db/
├── schema.sql          # Database schema definition
├── sqlite.ts           # Database connection and utility functions
├── seed.ts             # Database initialization and seeding script
└── README.md          # This file

app/api/
├── customers/         # Customer CRUD API routes
├── licenses/          # License CRUD API routes
├── reports/           # Report CRUD API routes
└── modules/           # Module read-only API routes

lib/
└── sqlite-data-provider.ts  # ra-core DataProvider implementation
```

## 🗄️ Database Schema

### Tables

1. **customers** - Customer information (based on customer creation form)
   - Anagrafica: ragione_sociale, partita_iva, codice_fiscale, tipo_utente, soggetto, stato
   - Riferimenti: email, pec_email, telefono, telefono_alt
   - Indirizzo: via, citta, cap, provincia, paese
   - Relazioni: parent_id, note_aggiuntive
   - Metadata: created_at, updated_at

2. **modules** - Available products/modules
   - name, display_name, description, is_active, created_at

3. **licenses** - Customer license assignments
   - customer_id, module_id, quantity_total, quantity_used
   - activation_date, expiration_date, status
   - created_at, updated_at

4. **reports** - Generated reports
   - customer_id, module_id, report_type, status
   - input_data (JSON), api_response (JSON), generated_html
   - created_at, updated_at, completed_at

5. **users** - Authentication users
   - email, password_hash, role, is_active
   - first_name, last_name, customer_id
   - created_at, updated_at

## 🚀 Getting Started

### Initialize Database

Run the following command to create the database and seed it with initial data:

```bash
npm run db:init
```

This will:
- Create `data/formulafinance.db`
- Execute schema from `schema.sql`
- Seed with:
  - 5 modules (products)
  - 15 customers (from existing JSON data)
  - 26 licenses (randomly assigned)
  - 20 reports (sample data)
  - 2 users (admin, commercial)

### Database Location

The database file is located at:
```
/data/formulafinance.db
```

This directory is ignored by git (see `.gitignore`).

## 🔧 API Routes

All API routes follow REST conventions and return data in ra-core compatible format:

```typescript
{
  data: T | T[],      // Single record or array of records
  total?: number      // Total count (for list endpoints)
}
```

### Customers API

- `GET /api/customers` - List customers (with pagination, filtering, search)
- `GET /api/customers/[id]` - Get single customer
- `POST /api/customers` - Create customer
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

### Licenses API

- `GET /api/licenses` - List licenses (with pagination, filtering)
- `GET /api/licenses/[id]` - Get single license
- `POST /api/licenses` - Create license
- `PUT /api/licenses/[id]` - Update license
- `DELETE /api/licenses/[id]` - Delete license

### Reports API

- `GET /api/reports` - List reports (with pagination, filtering)
- `GET /api/reports/[id]` - Get single report
- `POST /api/reports` - Create report
- `PUT /api/reports/[id]` - Update report
- `DELETE /api/reports/[id]` - Delete report

### Modules API

- `GET /api/modules` - List all modules

## 🔌 ra-core Integration

The SQLite data provider is integrated with ra-core through:

```typescript
// lib/ra-core-config.tsx
import { sqliteDataProvider as dataProvider } from './sqlite-data-provider';
```

### Using with Hooks

```typescript
import { useGetList, useGetOne, useCreate, useUpdate, useDelete } from 'ra-core';

// Fetch customers
const { data: customers, isLoading } = useGetList('customers', {
  pagination: { page: 1, perPage: 10 },
  sort: { field: 'ragione_sociale', order: 'ASC' },
  filter: { tipo_utente: 'cliente' },
});

// Create customer
const [create, { isLoading }] = useCreate('customers');
await create('customers', { data: customerData });
```

## 🛠️ Database Utilities

### Query Helpers

```typescript
import { query, queryOne, execute, transaction, paginate } from '@/lib/db/sqlite';

// Execute SELECT query
const customers = query('SELECT * FROM customers WHERE stato = ?', ['attivo']);

// Execute single row query
const customer = queryOne('SELECT * FROM customers WHERE id = ?', [1]);

// Execute INSERT/UPDATE/DELETE
const result = execute('INSERT INTO customers (ragione_sociale, email) VALUES (?, ?)', [
  'Acme Corp',
  'info@acme.com',
]);

// Execute transaction
transaction((db) => {
  // Multiple operations here
});

// Paginated query
const result = paginate(
  'SELECT * FROM customers',
  'SELECT COUNT(*) as total FROM customers',
  [],
  { page: 1, perPage: 10 }
);
```

### WHERE Clause Builders

```typescript
import { buildWhereClause, buildSearchClause, buildOrderByClause } from '@/lib/db/sqlite';

// Build WHERE clause from filters
const { where, params } = buildWhereClause(
  { tipo_utente: 'cliente', stato: 'attivo' },
  ['tipo_utente', 'stato']
);
// Result: "WHERE tipo_utente = ? AND stato = ?"

// Build search clause
const { search, params } = buildSearchClause('acme', ['ragione_sociale', 'email']);
// Result: "(ragione_sociale LIKE ? OR email LIKE ?)"

// Build ORDER BY clause
const orderBy = buildOrderByClause('ragione_sociale', 'ASC', [
  'id',
  'ragione_sociale',
  'email',
]);
// Result: "ORDER BY ragione_sociale ASC"
```

## 📊 Data Mapping

### Customer Form → Database

The customer creation form fields map directly to database columns:

| Form Field         | Database Column    |
| ------------------ | ------------------ |
| ragioneSociale     | ragione_sociale    |
| partitaIva         | partita_iva        |
| codiceFiscale      | codice_fiscale     |
| tipoUtente         | tipo_utente        |
| soggetto           | soggetto           |
| stato              | stato              |
| email              | email              |
| pecEmail           | pec_email          |
| telefono           | telefono           |
| telefonoAlt        | telefono_alt       |
| via                | via                |
| citta              | citta              |
| cap                | cap                |
| provincia          | provincia          |
| parentId           | parent_id          |
| noteAggiuntive     | note_aggiuntive    |

### License Form → Database

| Form Field       | Database Column   |
| ---------------- | ----------------- |
| user_id          | customer_id       |
| module_id        | module_id         |
| quantity_total   | quantity_total    |
| quantity_used    | quantity_used     |
| activation_date  | activation_date   |
| expiration_date  | expiration_date   |
| status           | status            |

## 🔍 Query Examples

### Get customers with licenses

```sql
SELECT
  c.id, c.ragione_sociale, c.email,
  COUNT(l.id) as total_licenses,
  SUM(l.quantity_total) as total_quantity
FROM customers c
LEFT JOIN licenses l ON c.id = l.customer_id
GROUP BY c.id;
```

### Get licenses with module info

```sql
SELECT
  l.*,
  m.display_name as module_name,
  c.ragione_sociale as customer_name
FROM licenses l
LEFT JOIN modules m ON l.module_id = m.id
LEFT JOIN customers c ON l.customer_id = c.id
WHERE l.status = 'active';
```

### Get reports by status

```sql
SELECT
  r.*,
  m.display_name as module_name,
  c.ragione_sociale as customer_name
FROM reports r
LEFT JOIN modules m ON r.module_id = m.id
LEFT JOIN customers c ON r.customer_id = c.id
WHERE r.status = 'completed'
ORDER BY r.completed_at DESC;
```

## 🔄 Migration Path

### Current: In-Memory (ra-data-fakerest)
- Fast prototyping
- Data resets on reload
- No persistence

### ✅ Now: SQLite (better-sqlite3)
- Persistent data
- Full CRUD operations
- Relational queries
- Local development

### Future: Production Database (PostgreSQL/MySQL)
1. Export schema to PostgreSQL/MySQL
2. Update API routes to use production database client
3. Keep ra-core data provider unchanged
4. Deploy backend separately

## 📝 Notes

- **Foreign Keys**: Enabled with `pragma foreign_keys = ON`
- **Timestamps**: Auto-updated via triggers
- **Indexes**: Created for common query patterns
- **CASCADE**: License and report deletion cascades from customer deletion
- **JSON Fields**: `input_data` and `api_response` stored as TEXT, parsed in API layer

## 🚨 Important

- Database file (`data/formulafinance.db`) is in `.gitignore`
- Run `npm run db:init` to recreate database from scratch
- Backup database file before major changes
- Use transactions for multi-step operations

## 🔐 Security Notes

- Password hashing not implemented (use bcrypt in production)
- No API authentication yet (add JWT/session middleware)
- SQL injection protected via parameterized queries
- Input validation needed at API layer

## 📚 References

- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)
- [ra-core Documentation](https://marmelab.com/react-admin/DataProviders.html)
- [SQLite Documentation](https://www.sqlite.org/docs.html)