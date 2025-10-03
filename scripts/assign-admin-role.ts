#!/usr/bin/env tsx
import Database from 'better-sqlite3';
import { join } from 'path';

/**
 * Script to assign superadmin role to a Supabase user
 * Usage: npm run assign-admin -- <user_id>
 */

const userId = process.argv[2];

if (!userId) {
  console.error('❌ Error: Please provide a user ID');
  console.log('\nUsage: npm run assign-admin -- <user_id>');
  console.log('\nExample: npm run assign-admin -- 550e8400-e29b-41d4-a716-446655440000');
  console.log('\nTo get your user ID:');
  console.log('1. Log in to your app');
  console.log('2. Go to Supabase Dashboard → Authentication → Users');
  console.log('3. Copy your user UUID');
  process.exit(1);
}

// Validate UUID format
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(userId)) {
  console.error('❌ Error: Invalid user ID format. Expected UUID format.');
  console.log('\nExample valid UUID: 550e8400-e29b-41d4-a716-446655440000');
  process.exit(1);
}

const dbPath = join(process.cwd(), 'data', 'formulafinance.db');
console.log('📂 Database:', dbPath);

try {
  const db = new Database(dbPath);

  // Check if user_roles table exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name='user_roles'
  `).get();

  if (!tableExists) {
    console.error('❌ Error: user_roles table does not exist.');
    console.log('\nPlease run the RBAC migration first:');
    console.log('npx tsx scripts/run-migration.ts');
    db.close();
    process.exit(1);
  }

  // Check if user already has a role
  const existingRole = db.prepare(`
    SELECT role FROM user_roles WHERE user_id = ?
  `).get(userId) as { role: string } | undefined;

  if (existingRole) {
    console.log(`⚠️  User already has role: ${existingRole.role}`);
    console.log('Updating to superadmin...');

    db.prepare(`
      UPDATE user_roles
      SET role = 'superadmin', updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(userId);

    console.log('✅ Role updated to superadmin');
  } else {
    console.log('Creating new superadmin role...');

    db.prepare(`
      INSERT INTO user_roles (user_id, role, created_at, updated_at)
      VALUES (?, 'superadmin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(userId);

    console.log('✅ Superadmin role assigned');
  }

  // Verify the assignment
  const role = db.prepare(`
    SELECT user_id, role, created_at, updated_at
    FROM user_roles
    WHERE user_id = ?
  `).get(userId);

  console.log('\n📋 Role Details:');
  console.log(JSON.stringify(role, null, 2));

  db.close();

  console.log('\n✅ Success! User is now a superadmin.');
  console.log('\n🔄 Next steps:');
  console.log('1. Restart your development server (npm run dev)');
  console.log('2. Log out and log back in');
  console.log('3. Verify you have full access to all features');

} catch (error) {
  console.error('❌ Error assigning role:', error);
  process.exit(1);
}
