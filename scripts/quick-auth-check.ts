#!/usr/bin/env tsx

import { readFileSync } from 'fs'
import { join } from 'path'

async function quickAuthCheck() {
  console.log('🔍 Quick Authentication Check')
  console.log('=' .repeat(40))

  // Read .env.local file
  const envPath = join(process.cwd(), '.env.local')
  let envContent = ''
  
  try {
    envContent = readFileSync(envPath, 'utf8')
    console.log('✅ Found .env.local file')
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

  console.log('\n📋 Environment Variables Check:')
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'TWITTER_CLIENT_ID',
    'TWITTER_CLIENT_SECRET'
  ]

  for (const varName of requiredVars) {
    if (envVars[varName]) {
      if (varName === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
        const key = envVars[varName]
        if (key.includes('PLACEHOLDER')) {
          console.log(`❌ ${varName}: Still using placeholder`)
        } else if (key === envVars['TWITTER_CLIENT_SECRET']) {
          console.log(`❌ ${varName}: Same as Twitter client secret!`)
        } else if (key.startsWith('eyJ')) {
          console.log(`✅ ${varName}: Appears to be valid JWT`)
        } else {
          console.log(`⚠️  ${varName}: Present but doesn't look like a JWT`)
        }
      } else {
        console.log(`✅ ${varName}: Present`)
      }
    } else {
      console.log(`❌ ${varName}: Missing`)
    }
  }

  // Check for duplicate values
  console.log('\n🔍 Checking for duplicate values:')
  
  const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']
  const twitterSecret = envVars['TWITTER_CLIENT_SECRET']
  const twitterId = envVars['TWITTER_CLIENT_ID']

  if (supabaseKey === twitterSecret) {
    console.log('❌ Supabase anon key is identical to Twitter client secret!')
  } else {
    console.log('✅ Supabase anon key is different from Twitter client secret')
  }

  if (twitterId === twitterSecret) {
    console.log('❌ Twitter client ID is identical to Twitter client secret!')
  } else {
    console.log('✅ Twitter client ID is different from Twitter client secret')
  }

  console.log('\n🚨 Current Authentication Error Analysis:')
  console.log('Error: "Error getting user email from external provider"')
  console.log('\nThis error typically means:')
  console.log('1. ❌ Twitter OAuth provider is NOT enabled in Supabase dashboard')
  console.log('2. ❌ Twitter app callback URL is incorrect')
  console.log('3. ❌ Twitter app doesn\'t have email permissions')
  console.log('4. ❌ Supabase Twitter provider configuration is wrong')

  console.log('\n🔧 IMMEDIATE ACTIONS NEEDED:')
  console.log('\n1. Enable Twitter OAuth Provider in Supabase:')
  console.log('   - Go to: https://bzqayhnlogpaxfcmmrlq.supabase.co')
  console.log('   - Navigate to: Authentication → Providers')
  console.log('   - Find "Twitter" and ENABLE it')
  console.log('   - Configure with:')
  console.log(`     Client ID: ${envVars['TWITTER_CLIENT_ID']}`)
  console.log(`     Client Secret: ${envVars['TWITTER_CLIENT_SECRET']}`)
  console.log('     Redirect URL: https://bzqayhnlogpaxfcmmrlq.supabase.co/auth/v1/callback')

  console.log('\n2. Update Twitter App Settings:')
  console.log('   - Go to: https://developer.twitter.com/en/portal/dashboard')
  console.log('   - Find your app and go to Settings → Authentication')
  console.log('   - Set Callback URL: https://bzqayhnlogpaxfcmmrlq.supabase.co/auth/v1/callback')
  console.log('   - Ensure permissions include: Read users, Read tweets, Offline access')

  console.log('\n3. Test Configuration:')
  console.log('   - After making changes, restart your dev server')
  console.log('   - Try authentication again')
  console.log('   - Check browser console for additional errors')

  console.log('\n🔗 Quick Links:')
  console.log('- Supabase Dashboard: https://bzqayhnlogpaxfcmmrlq.supabase.co')
  console.log('- Twitter Developer Portal: https://developer.twitter.com/en/portal/dashboard')
}

quickAuthCheck().catch(console.error)
