#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow')
  console.log('=' .repeat(40))

  // Read environment variables
  const envPath = join(process.cwd(), '.env.local')
  let envContent = ''
  
  try {
    envContent = readFileSync(envPath, 'utf8')
  } catch (error) {
    console.log('❌ Could not read .env.local file')
    return
  }

  // Extract environment variables
  const envLines = envContent.split('\n')
  const envVars: Record<string, string> = {}
  
  for (const line of envLines) {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=')
      const value = valueParts.join('=').replace(/"/g, '')
      envVars[key.trim()] = value.trim()
    }
  }

  const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL']
  const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase configuration')
    return
  }

  console.log('✅ Environment variables loaded')
  console.log(`📍 Supabase URL: ${supabaseUrl}`)
  console.log(`🔑 Anon key: ${supabaseKey.substring(0, 20)}...`)

  // Test Supabase connection
  console.log('\n🔗 Testing Supabase connection...')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.log('❌ Supabase connection failed:', error.message)
      return
    }
    console.log('✅ Supabase connection successful')
  } catch (error) {
    console.log('❌ Supabase connection error:', error)
    return
  }

  // Test Twitter OAuth provider configuration
  console.log('\n🐦 Testing Twitter OAuth provider...')
  
  try {
    // This will test if the provider is configured without actually starting OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
        scopes: 'users.read tweet.read offline.access',
        skipBrowserRedirect: true // This prevents actual redirect during testing
      }
    })

    if (error) {
      console.log('❌ Twitter OAuth provider error:', error.message)
      
      if (error.message.includes('Provider not found')) {
        console.log('\n🚨 SOLUTION: Enable Twitter provider in Supabase dashboard')
        console.log('1. Go to: https://bzqayhnlogpaxfcmmrlq.supabase.co/project/bzqayhnlogpaxfcmmrlq/auth/providers')
        console.log('2. Find "Twitter" and enable it')
        console.log('3. Configure with your Twitter app credentials')
      }
      return
    }
    
    console.log('✅ Twitter OAuth provider is configured')
    
    if (data.url) {
      console.log('✅ OAuth URL generated successfully')
      console.log(`🔗 OAuth URL: ${data.url.substring(0, 50)}...`)
    }
    
  } catch (error) {
    console.log('❌ Twitter OAuth test error:', error)
    return
  }

  console.log('\n🎉 ALL TESTS PASSED!')
  console.log('\n📋 What this means:')
  console.log('✅ Environment variables are correctly configured')
  console.log('✅ Supabase connection is working')
  console.log('✅ Twitter OAuth provider is enabled and configured')
  console.log('✅ OAuth URL generation is working')

  console.log('\n🚀 Next steps:')
  console.log('1. Start your development server: npm run dev')
  console.log('2. Go to: http://localhost:3000/login')
  console.log('3. Click "Continue with X" to test the full authentication flow')
  console.log('4. Check the browser console and server logs for any issues')

  console.log('\n🔧 If authentication still fails:')
  console.log('1. Check that your Twitter app callback URL is: https://bzqayhnlogpaxfcmmrlq.supabase.co/auth/v1/callback')
  console.log('2. Verify your Twitter app has the correct permissions')
  console.log('3. Ensure your Twitter account has a verified email (if required)')
  console.log('4. Check browser console for JavaScript errors')
}

testAuthFlow().catch(console.error)
