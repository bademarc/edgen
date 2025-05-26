#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

async function fixOAuthTokenIssue() {
  console.log('🔧 Fixing OAuth Token Issue')
  console.log('=' .repeat(50))

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
  const twitterClientId = envVars['TWITTER_CLIENT_ID']
  const twitterClientSecret = envVars['TWITTER_CLIENT_SECRET']

  console.log('✅ Environment variables loaded')
  console.log(`📍 Supabase URL: ${supabaseUrl}`)
  console.log(`🔑 Anon key: ${supabaseKey?.substring(0, 20)}...`)
  console.log(`🐦 Twitter Client ID: ${twitterClientId}`)

  // Analyze the OAuth token error
  console.log('\n🔍 Analyzing OAuth Token Error...')
  console.log('Error: "Unable to retrieve access token"')
  console.log('\nThis error typically occurs when:')
  console.log('1. ❌ Twitter OAuth provider is configured for OAuth 1.0a instead of OAuth 2.0')
  console.log('2. ❌ Twitter app callback URL is incorrect')
  console.log('3. ❌ Twitter app permissions are insufficient')
  console.log('4. ❌ Supabase Twitter provider configuration is wrong')

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

  // Test OAuth URL generation
  console.log('\n🐦 Testing OAuth URL generation...')
  
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
        scopes: 'users.read tweet.read',
        skipBrowserRedirect: true
      }
    })

    if (error) {
      console.log('❌ OAuth URL generation failed:', error.message)
      return
    }
    
    console.log('✅ OAuth URL generated successfully')
    
    if (data.url) {
      console.log(`🔗 OAuth URL: ${data.url}`)
      
      // Analyze the OAuth URL to determine version
      if (data.url.includes('oauth2/authorize')) {
        console.log('✅ Using OAuth 2.0 (correct)')
      } else if (data.url.includes('oauth/authenticate')) {
        console.log('⚠️  Using OAuth 1.0a (this might cause token issues)')
      } else {
        console.log('❓ Unknown OAuth version')
      }
    }
    
  } catch (error) {
    console.log('❌ OAuth test error:', error)
    return
  }

  console.log('\n🚨 CRITICAL FIXES NEEDED:')
  console.log('\n1. **Supabase Twitter Provider Configuration**:')
  console.log('   - Go to: https://bzqayhnlogpaxfcmmrlq.supabase.co/project/bzqayhnlogpaxfcmmrlq/auth/providers')
  console.log('   - Find "Twitter" provider')
  console.log('   - Ensure it\'s configured for **OAuth 2.0** (not OAuth 1.0a)')
  console.log('   - Use these settings:')
  console.log(`     * Client ID: ${twitterClientId}`)
  console.log(`     * Client Secret: ${twitterClientSecret}`)
  console.log('     * Redirect URL: https://bzqayhnlogpaxfcmmrlq.supabase.co/auth/v1/callback')

  console.log('\n2. **Twitter App Configuration**:')
  console.log('   - Go to: https://developer.twitter.com/en/portal/dashboard')
  console.log(`   - Find your app with Client ID: ${twitterClientId}`)
  console.log('   - Go to App Settings → Authentication settings')
  console.log('   - Ensure these settings:')
  console.log('     * OAuth 2.0: ✅ ENABLED')
  console.log('     * OAuth 1.0a: ❌ DISABLED (if possible)')
  console.log('     * Type of App: Web App')
  console.log('     * Callback URI: https://bzqayhnlogpaxfcmmrlq.supabase.co/auth/v1/callback')
  console.log('     * Website URL: https://edgen.koyeb.app')

  console.log('\n3. **Twitter App Permissions**:')
  console.log('   - Ensure your Twitter app has these permissions:')
  console.log('     * ✅ Read users')
  console.log('     * ✅ Read tweets')
  console.log('     * ⚠️  Email access (optional, but may help)')

  console.log('\n4. **Test Steps After Configuration**:')
  console.log('   a. Save all changes in both Supabase and Twitter dashboards')
  console.log('   b. Wait 5-10 minutes for changes to propagate')
  console.log('   c. Clear browser cache and cookies')
  console.log('   d. Restart your development server: npm run dev')
  console.log('   e. Test authentication at: http://localhost:3000/login')

  console.log('\n🔧 **If the issue persists**:')
  console.log('1. Check if your Twitter account has 2FA enabled (may cause issues)')
  console.log('2. Try creating a new Twitter app with OAuth 2.0 only')
  console.log('3. Verify that your Twitter account has a verified email')
  console.log('4. Check Supabase logs for detailed error messages')

  console.log('\n📋 **Quick Verification Checklist**:')
  console.log('- [ ] Supabase Twitter provider is enabled')
  console.log('- [ ] Supabase Twitter provider uses OAuth 2.0')
  console.log('- [ ] Twitter app has OAuth 2.0 enabled')
  console.log('- [ ] Twitter app callback URL matches Supabase callback')
  console.log('- [ ] Twitter app has correct permissions')
  console.log('- [ ] No NextAuth.js dependencies remain in the project')
  console.log('- [ ] Browser cache is cleared')

  console.log('\n🔗 **Important URLs**:')
  console.log('- Supabase Auth Providers: https://bzqayhnlogpaxfcmmrlq.supabase.co/project/bzqayhnlogpaxfcmmrlq/auth/providers')
  console.log('- Twitter Developer Portal: https://developer.twitter.com/en/portal/dashboard')
  console.log('- Local Login Test: http://localhost:3000/login')
}

fixOAuthTokenIssue().catch(console.error)
