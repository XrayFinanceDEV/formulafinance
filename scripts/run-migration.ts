import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'formulafinance.db');
const migrationPath = join(process.cwd(), 'data', 'migrations', '002_add_rbac.sql');

console.log('Running RBAC migration...');
console.log('Database:', dbPath);
console.log('Migration file:', migrationPath);

try {
  const db = new Database(dbPath);

  // Read migration file
  const sql = readFileSync(migrationPath, 'utf-8');

  // Execute migration
  db.exec(sql);

  console.log('✓ Migration completed successfully!');

  // Verify tables were created
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND (name='user_roles' OR name='user_associations')
  `).all();

  console.log('\nCreated tables:', tables.map((t: any) => t.name).join(', '));

  db.close();
} catch (error) {
  console.error('✗ Migration failed:', error);
  process.exit(1);
}
