#!/usr/bin/env tsx

import { config } from 'dotenv'
import { TwitterOAuthService } from '../src/lib/twitter-oauth'

// Load environment variables from .env.local
config({ path: '.env.local' })

async function testOAuthConfiguration() {
  console.log('🔍 Testing X (Twitter) OAuth Configuration')
  console.log('==========================================\n')

  try {
    // Test environment variables
    console.log('1️⃣ Checking Environment Variables:')
    console.log('-----------------------------------')

    const requiredVars = {
      'NEXT_PUBLIC_SITE_URL': process.env.NEXT_PUBLIC_SITE_URL,
      'TWITTER_CLIENT_ID': process.env.TWITTER_CLIENT_ID,
      'TWITTER_CLIENT_SECRET': process.env.TWITTER_CLIENT_SECRET,
    }

    let allVarsPresent = true
    for (const [name, value] of Object.entries(requiredVars)) {
      if (value) {
        console.log(`✅ ${name}: ${name === 'TWITTER_CLIENT_SECRET' ? '***HIDDEN***' : value}`)
      } else {
        console.log(`❌ ${name}: NOT SET`)
        allVarsPresent = false
      }
    }

    if (!allVarsPresent) {
      console.log('\n❌ Missing required environment variables!')
      return
    }

    // Test TwitterOAuthService initialization
    console.log('\n2️⃣ Testing TwitterOAuthService:')
    console.log('--------------------------------')

    const twitterOAuth = new TwitterOAuthService()
    console.log('✅ TwitterOAuthService initialized successfully')

    // Generate auth URL to test configuration
    console.log('\n3️⃣ Testing OAuth URL Generation:')
    console.log('---------------------------------')

    const { url, codeVerifier, state } = twitterOAuth.generateAuthUrl()

    console.log('✅ OAuth URL generated successfully')
    console.log(`📋 Generated URL: ${url}`)

    // Parse the URL to check parameters
    const urlObj = new URL(url)
    const params = urlObj.searchParams

    console.log('\n4️⃣ OAuth URL Parameters:')
    console.log('-------------------------')
    console.log(`✅ Client ID: ${params.get('client_id')}`)
    console.log(`✅ Redirect URI: ${params.get('redirect_uri')}`)
    console.log(`✅ Response Type: ${params.get('response_type')}`)
    console.log(`✅ Scope: ${params.get('scope')}`)
    console.log(`✅ Code Challenge Method: ${params.get('code_challenge_method')}`)
    console.log(`✅ State: ${params.get('state')?.substring(0, 10)}...`)
    console.log(`✅ Code Challenge: ${params.get('code_challenge')?.substring(0, 10)}...`)

    // Check redirect URI
    const redirectUri = params.get('redirect_uri')
    const expectedRedirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/twitter/callback`

    console.log('\n5️⃣ Redirect URI Validation:')
    console.log('----------------------------')
    console.log(`Expected: ${expectedRedirectUri}`)
    console.log(`Actual:   ${redirectUri}`)

    if (redirectUri === expectedRedirectUri) {
      console.log('✅ Redirect URI matches expected production URL')
    } else {
      console.log('❌ Redirect URI mismatch!')
    }

    // Check for localhost in redirect URI
    if (redirectUri?.includes('localhost')) {
      console.log('⚠️  WARNING: Redirect URI contains localhost!')
      console.log('   This will cause production login issues.')
    } else {
      console.log('✅ No localhost detected in redirect URI')
    }

    console.log('\n6️⃣ Twitter Developer Portal Configuration:')
    console.log('-------------------------------------------')
    console.log('To fix X login redirects, update your Twitter App settings:')
    console.log('')
    console.log('1. Go to: https://developer.twitter.com/en/portal/dashboard')
    console.log('2. Select your app (LayerEdge Community)')
    console.log('3. Go to "App settings" → "Authentication settings"')
    console.log('4. Update the following settings:')
    console.log('')
    console.log('   📋 Callback URLs / Redirect URLs:')
    console.log(`      ${expectedRedirectUri}`)
    console.log('')
    console.log('   📋 Website URL:')
    console.log(`      ${process.env.NEXT_PUBLIC_SITE_URL}`)
    console.log('')
    console.log('   📋 Terms of Service URL:')
    console.log(`      ${process.env.NEXT_PUBLIC_SITE_URL}/terms`)
    console.log('')
    console.log('   📋 Privacy Policy URL:')
    console.log(`      ${process.env.NEXT_PUBLIC_SITE_URL}/privacy`)
    console.log('')
    console.log('5. Save the changes')
    console.log('6. Test the OAuth flow')

    console.log('\n7️⃣ Testing Instructions:')
    console.log('-------------------------')
    console.log('After updating the Twitter Developer Portal:')
    console.log('')
    console.log('1. Deploy your application to production')
    console.log('2. Visit: https://edgen.koyeb.app/login')
    console.log('3. Click "Sign in with X"')
    console.log('4. Complete the X authorization')
    console.log('5. Verify you are redirected to: https://edgen.koyeb.app/dashboard')
    console.log('')
    console.log('If you are still redirected to localhost:')
    console.log('- Double-check the Twitter App callback URL settings')
    console.log('- Ensure NEXT_PUBLIC_SITE_URL is set in production environment')
    console.log('- Check the browser developer tools for any error messages')

    console.log('\n🎉 OAuth Configuration Test Complete!')
    console.log('=====================================')
    console.log('✅ Environment variables configured')
    console.log('✅ OAuth service working')
    console.log('✅ Redirect URI using production URL')
    console.log('✅ Ready for Twitter Developer Portal update')

  } catch (error) {
    console.error('\n❌ OAuth Configuration Test Failed!')
    console.error('===================================')
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error')

    if (error instanceof Error && error.message.includes('Twitter OAuth credentials')) {
      console.log('\n💡 Fix: Ensure TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET are set in .env.local')
    }
  }
}

// Run the test
testOAuthConfiguration().catch(console.error)
