#!/usr/bin/env node

/**
 * Twitter Bearer Token Fix Script
 * Tests and fixes Twitter Bearer Token authentication issues
 */

const dotenv = require('dotenv')

// Load environment variables
dotenv.config()

async function fixTwitterBearerToken() {
  console.log('🔧 Fixing Twitter Bearer Token Authentication...\n')

  const fixes = []
  let tokenFixed = false

  // Step 1: Analyze current Bearer token
  console.log('1️⃣ Analyzing Current Bearer Token...')
  try {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN
    
    if (!bearerToken) {
      fixes.push('❌ TWITTER_BEARER_TOKEN is missing from environment variables')
      console.log('❌ Bearer token is missing')
      return false
    }

    console.log(`✅ Bearer token is present (length: ${bearerToken.length})`)
    
    // Check if token is URL encoded
    if (bearerToken.includes('%')) {
      console.log('⚠️ Bearer token appears to be URL encoded')
      const decodedToken = decodeURIComponent(bearerToken)
      console.log(`📝 Decoded token length: ${decodedToken.length}`)
      
      // Test the decoded token
      console.log('🧪 Testing decoded Bearer token...')
      const testResult = await testBearerToken(decodedToken)
      
      if (testResult.success) {
        console.log('✅ Decoded Bearer token works!')
        fixes.push('✅ Use decoded Bearer token instead of URL-encoded version')
        tokenFixed = true
        
        // Show the corrected token (first 20 and last 10 characters for security)
        const tokenPreview = decodedToken.substring(0, 20) + '...' + decodedToken.substring(decodedToken.length - 10)
        console.log(`📋 Corrected token preview: ${tokenPreview}`)
        
      } else {
        console.log('❌ Decoded Bearer token still fails')
        fixes.push(`❌ Decoded Bearer token failed: ${testResult.error}`)
      }
    } else {
      console.log('ℹ️ Bearer token is not URL encoded')
      
      // Test the current token
      console.log('🧪 Testing current Bearer token...')
      const testResult = await testBearerToken(bearerToken)
      
      if (testResult.success) {
        console.log('✅ Current Bearer token works!')
        tokenFixed = true
      } else {
        console.log('❌ Current Bearer token fails')
        fixes.push(`❌ Current Bearer token failed: ${testResult.error}`)
      }
    }

  } catch (error) {
    fixes.push(`❌ Error analyzing Bearer token: ${error.message}`)
    console.log(`❌ Error: ${error.message}`)
  }

  console.log()

  // Step 2: Test with alternative authentication methods
  console.log('2️⃣ Testing Alternative Authentication...')
  try {
    const apiKey = process.env.TWITTER_API_KEY
    const apiSecret = process.env.TWITTER_API_SECRET
    
    if (apiKey && apiSecret) {
      console.log('✅ API Key and Secret are available')
      console.log('💡 You can use API Key/Secret for authentication if Bearer token fails')
      
      // Create a basic auth header for testing
      const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
      console.log('🧪 Testing API Key/Secret authentication...')
      
      try {
        const response = await fetch('https://api.twitter.com/oauth2/token', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: 'grant_type=client_credentials'
        })

        if (response.ok) {
          const tokenData = await response.json()
          if (tokenData.access_token) {
            console.log('✅ API Key/Secret authentication successful!')
            console.log('💡 Generated new Bearer token from API credentials')
            
            const newTokenPreview = tokenData.access_token.substring(0, 20) + '...' + tokenData.access_token.substring(tokenData.access_token.length - 10)
            console.log(`📋 New token preview: ${newTokenPreview}`)
            
            fixes.push('✅ Generated new Bearer token from API Key/Secret')
            tokenFixed = true
          }
        } else {
          console.log('❌ API Key/Secret authentication failed')
          fixes.push('❌ API Key/Secret authentication failed')
        }
      } catch (authError) {
        console.log(`❌ API Key/Secret test failed: ${authError.message}`)
        fixes.push(`❌ API Key/Secret test failed: ${authError.message}`)
      }
    } else {
      console.log('⚠️ API Key and Secret not available for alternative authentication')
    }

  } catch (error) {
    fixes.push(`❌ Error testing alternative authentication: ${error.message}`)
    console.log(`❌ Error: ${error.message}`)
  }

  console.log()

  // Summary
  console.log('📋 Bearer Token Fix Summary:')
  console.log('============================')
  
  fixes.forEach(fix => console.log(fix))

  console.log()

  if (tokenFixed) {
    console.log('🎉 Bearer token authentication is working!')
    console.log()
    console.log('🔧 Recommended actions:')
    console.log('1. Update your .env file with the corrected Bearer token')
    console.log('2. Restart the application')
    console.log('3. Test tweet submission functionality')
  } else {
    console.log('❌ Bearer token authentication is still failing')
    console.log()
    console.log('🔧 Recommended actions:')
    console.log('1. Check your Twitter Developer Portal for the correct Bearer token')
    console.log('2. Ensure your Twitter app has the correct permissions')
    console.log('3. Try regenerating the Bearer token in the Twitter Developer Portal')
    console.log('4. Verify your Twitter app is not suspended or restricted')
  }

  return tokenFixed
}

async function testBearerToken(token) {
  try {
    const response = await fetch('https://api.twitter.com/2/users/by/username/twitter', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      return { success: true }
    } else if (response.status === 429) {
      return { success: true, note: 'Rate limited but token is valid' }
    } else {
      const errorText = await response.text()
      return { success: false, error: `HTTP ${response.status}: ${errorText}` }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Run the fix script
fixTwitterBearerToken()
  .then(success => {
    if (success) {
      console.log('\n🎉 Twitter Bearer token is working!')
      process.exit(0)
    } else {
      console.log('\n❌ Twitter Bearer token needs attention.')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('\n💥 Bearer token fix script failed:', error)
    process.exit(1)
  })
