#!/usr/bin/env tsx

/**
 * LayerEdge Community Platform - Authentication Setup Verification
 * 
 * Quick verification script to test if authentication is properly configured
 * after following the setup guide.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function verifyAuthSetup() {
  console.log('🔍 LayerEdge Authentication Setup Verification')
  console.log('=' .repeat(50))

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const twitterClientId = process.env.TWITTER_CLIENT_ID
  const twitterClientSecret = process.env.TWITTER_CLIENT_SECRET

  if (!supabaseUrl || !supabaseKey || !twitterClientId || !twitterClientSecret) {
    console.log('❌ Missing required environment variables')
    return false
  }

  // Verify Supabase anon key is different from Twitter client secret
  if (supabaseKey === twitterClientSecret) {
    console.log('❌ CRITICAL: Supabase anon key is same as Twitter client secret!')
    console.log('   Please get the correct anon key from Supabase dashboard')
    return false
  } else {
    console.log('✅ Supabase anon key is different from Twitter credentials')
  }

  // Test Supabase connection
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.log('❌ Supabase connection failed:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection successful')
  } catch (error) {
    console.log('❌ Supabase connection error:', error)
    return false
  }

  // Test database access
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (error && !error.message.includes('relation "users" does not exist')) {
      console.log('❌ Database access failed:', error.message)
      return false
    }
    
    console.log('✅ Database access working')
  } catch (error) {
    console.log('❌ Database test error:', error)
    return false
  }

  // Test Twitter OAuth provider availability
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
        scopes: 'users.read tweet.read offline.access'
      }
    })

    if (error) {
      console.log('❌ Twitter OAuth provider not configured:', error.message)
      console.log('   Please enable Twitter provider in Supabase dashboard')
      return false
    }
    
    console.log('✅ Twitter OAuth provider is configured')
  } catch (error) {
    console.log('❌ Twitter OAuth test error:', error)
    return false
  }

  console.log('\n🎉 All authentication checks passed!')
  console.log('\n📋 Next steps:')
  console.log('   1. Test login flow: npm run dev → http://localhost:3000/login')
  console.log('   2. Click "Continue with X" and verify OAuth flow')
  console.log('   3. Check that user data is properly synced after login')
  
  return true
}

// Run verification
verifyAuthSetup().catch(console.error)
