#!/usr/bin/env tsx
import { config } from 'dotenv'
import { join } from 'path'

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') })

import { supabaseAdmin } from '../lib/supabase/admin'

/**
 * Get Supabase user ID by email
 * Usage: npm run get-user-id -- admin@xrayfinance.it
 */

const email = process.argv[2]

if (!email) {
  console.error('❌ Error: Please provide an email address')
  console.log('\nUsage: tsx scripts/get-user-id.ts <email>')
  console.log('Example: tsx scripts/get-user-id.ts admin@xrayfinance.it')
  process.exit(1)
}

async function getUserId() {
  try {
    console.log(`🔍 Searching for user: ${email}`)

    // List all users and find by email
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.error('❌ Error fetching users:', error.message)
      process.exit(1)
    }

    const user = data.users.find(u => u.email === email)

    if (!user) {
      console.error(`❌ User not found with email: ${email}`)
      console.log('\n📋 Available users:')
      data.users.forEach(u => {
        console.log(`   - ${u.email} (${u.id})`)
      })
      process.exit(1)
    }

    console.log('\n✅ User found!')
    console.log('\n📋 User Details:')
    console.log('   Email:', user.email)
    console.log('   ID:', user.id)
    console.log('   Created:', user.created_at)
    console.log('   Last Sign In:', user.last_sign_in_at || 'Never')

    console.log('\n📝 To assign superadmin role, run:')
    console.log(`   npm run assign-admin -- ${user.id}`)

    return user.id
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

getUserId()
