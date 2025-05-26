#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = 'https://bzqayhnlogpaxfcmmrlq.supabase.co'

async function fixAuthConfiguration() {
  console.log('🔧 LayerEdge Authentication Configuration Fix')
  console.log('=' .repeat(50))

  // Step 1: Check current environment configuration
  console.log('\n1️⃣ Checking current environment configuration...')
  
  const envPath = join(process.cwd(), '.env.local')
  let envContent = ''
  
  try {
    envContent = readFileSync(envPath, 'utf8')
    console.log('✅ Found .env.local file')
  } catch (error) {
    console.log('❌ Could not read .env.local file')
    return
  }

  // Check if the anon key is the placeholder
  if (envContent.includes('PLACEHOLDER_NEED_CORRECT_ANON_KEY_FROM_SUPABASE_DASHBOARD')) {
    console.log('⚠️  Supabase anon key is still a placeholder')
    console.log('\n🚨 CRITICAL: You need to update the Supabase anon key!')
    console.log('\nTo fix this:')
    console.log('1. Go to: https://bzqayhnlogpaxfcmmrlq.supabase.co')
    console.log('2. Navigate to: Settings → API')
    console.log('3. Copy the "anon public" key (starts with "eyJ")')
    console.log('4. Replace the placeholder in .env.local')
    console.log('\nExample:')
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."')
    return
  }

  // Step 2: Test Supabase connection
  console.log('\n2️⃣ Testing Supabase connection...')
  
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseAnonKey) {
    console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found in environment')
    return
  }

  const supabase = createClient(SUPABASE_URL, supabaseAnonKey)
  
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.log('❌ Supabase connection failed:', error.message)
      if (error.message.includes('Invalid API key')) {
        console.log('\n🚨 The Supabase anon key is incorrect!')
        console.log('Please get the correct key from the Supabase dashboard.')
      }
      return
    }
    console.log('✅ Supabase connection successful')
  } catch (error) {
    console.log('❌ Supabase connection error:', error)
    return
  }

  // Step 3: Test Twitter OAuth provider
  console.log('\n3️⃣ Testing Twitter OAuth provider...')
  
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
        scopes: 'users.read tweet.read offline.access'
      }
    })

    if (error) {
      console.log('❌ Twitter OAuth provider error:', error.message)
      
      if (error.message.includes('Provider not found')) {
        console.log('\n🚨 Twitter OAuth provider is not enabled in Supabase!')
        console.log('\nTo fix this:')
        console.log('1. Go to: https://bzqayhnlogpaxfcmmrlq.supabase.co')
        console.log('2. Navigate to: Authentication → Providers')
        console.log('3. Find "Twitter" and enable it')
        console.log('4. Configure with:')
        console.log('   - Client ID: QlEtZHlyVzFqaHhkXzNLNVN3bE06MTpjaQ')
        console.log('   - Client Secret: Rl2zEnwWoSrc-3QgDEbs0Uy-0SBeCpcOuTndIxFjdE4xmoJiAy')
        console.log('   - Redirect URL: https://bzqayhnlogpaxfcmmrlq.supabase.co/auth/v1/callback')
      }
      return
    }
    
    console.log('✅ Twitter OAuth provider is configured')
  } catch (error) {
    console.log('❌ Twitter OAuth test error:', error)
    return
  }

  // Step 4: Check environment variables
  console.log('\n4️⃣ Checking environment variables...')
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'TWITTER_CLIENT_ID',
    'TWITTER_CLIENT_SECRET',
    'TWITTER_BEARER_TOKEN'
  ]

  let missingVars = 0
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.log(`❌ Missing: ${varName}`)
      missingVars++
    } else {
      console.log(`✅ Found: ${varName}`)
    }
  }

  if (missingVars > 0) {
    console.log(`\n⚠️  Found ${missingVars} missing environment variables`)
    return
  }

  // Step 5: Verify Twitter credentials
  console.log('\n5️⃣ Verifying Twitter credentials...')
  
  const twitterClientId = process.env.TWITTER_CLIENT_ID
  const twitterClientSecret = process.env.TWITTER_CLIENT_SECRET
  
  if (twitterClientId === twitterClientSecret) {
    console.log('❌ Twitter Client ID and Client Secret are identical!')
    console.log('This will cause authentication failures.')
    return
  }
  
  if (supabaseAnonKey === twitterClientSecret) {
    console.log('❌ Supabase anon key is identical to Twitter Client Secret!')
    console.log('This was the main cause of authentication failures.')
    console.log('Please get the correct Supabase anon key from the dashboard.')
    return
  }
  
  console.log('✅ Twitter credentials appear to be correctly configured')

  // Step 6: Final recommendations
  console.log('\n6️⃣ Final configuration check...')
  console.log('✅ All basic checks passed!')
  
  console.log('\n🎉 AUTHENTICATION SETUP APPEARS TO BE CORRECT!')
  console.log('\n📋 Next steps:')
  console.log('1. Ensure Twitter OAuth provider is enabled in Supabase dashboard')
  console.log('2. Verify Twitter app callback URL: https://bzqayhnlogpaxfcmmrlq.supabase.co/auth/v1/callback')
  console.log('3. Test the authentication flow by visiting /login')
  console.log('4. Check browser console and server logs for any remaining issues')
  
  console.log('\n🔗 Important URLs:')
  console.log('- Supabase Dashboard: https://bzqayhnlogpaxfcmmrlq.supabase.co')
  console.log('- Twitter Developer Portal: https://developer.twitter.com/en/portal/dashboard')
  console.log('- Local Login: http://localhost:3000/login')
  console.log('- Production Login: https://edgen.koyeb.app/login')
}

// Run the fix
fixAuthConfiguration().catch(console.error)
