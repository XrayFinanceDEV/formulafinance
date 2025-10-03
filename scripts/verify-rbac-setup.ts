#!/usr/bin/env tsx
import { config } from 'dotenv'
import { join } from 'path'
import Database from 'better-sqlite3'

// Load environment variables
config({ path: join(process.cwd(), '.env.local') })

import { supabaseAdmin } from '../lib/supabase/admin'

async function verifySetup() {
  console.log('🔍 Verifying RBAC Setup...\n')

  let hasErrors = false

  // Check 1: Environment variables
  console.log('1️⃣ Checking environment variables...')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    console.log('   ❌ NEXT_PUBLIC_SUPABASE_URL is missing')
    hasErrors = true
  } else {
    console.log('   ✅ NEXT_PUBLIC_SUPABASE_URL is set')
  }

  if (!anonKey) {
    console.log('   ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing')
    hasErrors = true
  } else {
    console.log('   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set')
  }

  if (!serviceKey) {
    console.log('   ❌ SUPABASE_SERVICE_ROLE_KEY is missing')
    hasErrors = true
  } else {
    console.log('   ✅ SUPABASE_SERVICE_ROLE_KEY is set')
  }

  // Check 2: Database tables
  console.log('\n2️⃣ Checking database tables...')
  const dbPath = join(process.cwd(), 'data', 'formulafinance.db')
  const db = new Database(dbPath)

  const tables = ['user_roles', 'user_associations', 'customers', 'reports']
  for (const table of tables) {
    const result = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name=?
    `).get(table)

    if (result) {
      console.log(`   ✅ Table '${table}' exists`)
    } else {
      console.log(`   ❌ Table '${table}' is missing`)
      hasErrors = true
    }
  }

  // Check 3: owner_user_id columns
  console.log('\n3️⃣ Checking owner_user_id columns...')
  const customersSchema = db.prepare('PRAGMA table_info(customers)').all() as any[]
  const hasCustomerOwner = customersSchema.some((col: any) => col.name === 'owner_user_id')
  if (hasCustomerOwner) {
    console.log('   ✅ customers.owner_user_id exists')
  } else {
    console.log('   ❌ customers.owner_user_id is missing')
    hasErrors = true
  }

  const reportsSchema = db.prepare('PRAGMA table_info(reports)').all() as any[]
  const hasReportOwner = reportsSchema.some((col: any) => col.name === 'owner_user_id')
  if (hasReportOwner) {
    console.log('   ✅ reports.owner_user_id exists')
  } else {
    console.log('   ❌ reports.owner_user_id is missing')
    hasErrors = true
  }

  // Check 4: Superadmin users
  console.log('\n4️⃣ Checking superadmin users...')
  const superadmins = db.prepare(`
    SELECT user_id, created_at FROM user_roles WHERE role = 'superadmin'
  `).all() as any[]

  if (superadmins.length === 0) {
    console.log('   ⚠️  No superadmin users found')
    console.log('   Run: npm run assign-admin -- <user_id>')
  } else {
    console.log(`   ✅ Found ${superadmins.length} superadmin(s):`)
    for (const admin of superadmins) {
      // Fetch email from Supabase
      try {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(admin.user_id)
        if (data?.user) {
          console.log(`      - ${data.user.email} (${admin.user_id})`)
        } else {
          console.log(`      - ${admin.user_id} (email not found)`)
        }
      } catch (error) {
        console.log(`      - ${admin.user_id} (error fetching email)`)
      }
    }
  }

  // Check 5: Files exist
  console.log('\n5️⃣ Checking RBAC files...')
  const files = [
    'middleware.ts',
    'lib/auth/authorization.ts',
    'lib/auth/auth-provider.tsx',
    'lib/auth/hooks.ts',
    'lib/supabase/admin.ts',
    'types/rbac.ts',
    'app/unauthorized/page.tsx',
    'app/forbidden/page.tsx'
  ]

  const fs = require('fs')
  for (const file of files) {
    const filePath = join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file}`)
    } else {
      console.log(`   ❌ ${file} is missing`)
      hasErrors = true
    }
  }

  db.close()

  // Summary
  console.log('\n' + '='.repeat(60))
  if (hasErrors) {
    console.log('❌ Setup incomplete - please fix the errors above')
    process.exit(1)
  } else {
    console.log('✅ RBAC setup is complete!')
    console.log('\n📝 Next steps:')
    console.log('1. Restart your dev server: npm run dev')
    console.log('2. Log out and log back in')
    console.log('3. Test protected routes and permissions')
    console.log('\n📚 Documentation:')
    console.log('   - docs/RBAC_IMPLEMENTATION.md')
    console.log('   - docs/SUPABASE_RBAC_SETUP.md')
  }
  console.log('='.repeat(60))
}

verifySetup().catch(console.error)
