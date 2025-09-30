import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

// Database file location
const DB_PATH = path.join(process.cwd(), 'data', 'formulafinance.db');
const SCHEMA_PATH = path.join(process.cwd(), 'lib', 'db', 'schema.sql');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Singleton database instance
let db: Database.Database | null = null;

/**
 * Get the database instance (singleton pattern)
 */
export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, {
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
    });

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Initialize schema if database is new
    initializeSchema(db);
  }

  return db;
}

/**
 * Initialize database schema from schema.sql file
 */
function initializeSchema(database: Database.Database): void {
  // Check if database is already initialized
  const tables = database
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    )
    .all();

  // If no tables exist, initialize schema
  if (tables.length === 0) {
    console.log('🗄️  Initializing database schema...');
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

    // Execute schema SQL
    database.exec(schema);

    console.log('✅ Database schema initialized successfully');
  }
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Execute a raw SQL query
 */
export function query<T = any>(sql: string, params: any[] = []): T[] {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  return stmt.all(...params) as T[];
}

/**
 * Execute a query that returns a single row
 */
export function queryOne<T = any>(sql: string, params: any[] = []): T | undefined {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  return stmt.get(...params) as T | undefined;
}

/**
 * Execute an INSERT, UPDATE, or DELETE query
 */
export function execute(
  sql: string,
  params: any[] = []
): Database.RunResult {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

/**
 * Execute a transaction
 */
export function transaction<T>(callback: (db: Database.Database) => T): T {
  const db = getDatabase();
  const trx = db.transaction(callback);
  return trx(db);
}

/**
 * Helper: Get paginated results
 */
export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export function paginate<T>(
  baseQuery: string,
  countQuery: string,
  params: any[],
  pagination: PaginationParams
): PaginatedResult<T> {
  const db = getDatabase();

  // Get total count
  const countStmt = db.prepare(countQuery);
  const { total } = countStmt.get(...params) as { total: number };

  // Calculate pagination
  const { page, perPage } = pagination;
  const offset = (page - 1) * perPage;
  const totalPages = Math.ceil(total / perPage);

  // Get paginated data
  const dataQuery = `${baseQuery} LIMIT ? OFFSET ?`;
  const dataStmt = db.prepare(dataQuery);
  const data = dataStmt.all(...params, perPage, offset) as T[];

  return {
    data,
    total,
    page,
    perPage,
    totalPages,
  };
}

/**
 * Helper: Build WHERE clause from filters
 */
export function buildWhereClause(
  filters: Record<string, any>,
  allowedFields: string[]
): { where: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];

  for (const [key, value] of Object.entries(filters)) {
    if (allowedFields.includes(key) && value !== undefined && value !== null && value !== '') {
      conditions.push(`${key} = ?`);
      params.push(value);
    }
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return { where, params };
}

/**
 * Helper: Build search clause
 */
export function buildSearchClause(
  searchQuery: string | undefined,
  searchFields: string[]
): { search: string; params: any[] } {
  if (!searchQuery || searchQuery.trim() === '') {
    return { search: '', params: [] };
  }

  const conditions = searchFields.map((field) => `${field} LIKE ?`);
  const search = `(${conditions.join(' OR ')})`;
  const params = searchFields.map(() => `%${searchQuery}%`);

  return { search, params };
}

/**
 * Helper: Build ORDER BY clause
 */
export function buildOrderByClause(
  sortField?: string,
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc',
  allowedFields: string[] = [],
  defaultField: string = 'id',
  defaultOrder: 'ASC' | 'DESC' = 'ASC'
): string {
  const field = sortField && allowedFields.includes(sortField) ? sortField : defaultField;
  const order = sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  return `ORDER BY ${field} ${order}`;
}

export default {
  getDatabase,
  closeDatabase,
  query,
  queryOne,
  execute,
  transaction,
  paginate,
  buildWhereClause,
  buildSearchClause,
  buildOrderByClause,
};