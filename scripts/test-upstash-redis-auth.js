/**
 * Specific test for Upstash Redis authentication issues
 */

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

async function testUpstashRedisAuth() {
  console.log('🔍 Testing Upstash Redis Authentication Methods...\n')

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN
  
  console.log('📋 Configuration:')
  console.log(`URL: ${upstashUrl}`)
  console.log(`Token: ${upstashToken?.substring(0, 8)}...`)

  if (!upstashUrl || !upstashToken) {
    console.log('❌ Missing Upstash credentials')
    return false
  }

  // Test 1: Bearer Token Authentication (current method)
  console.log('\n1️⃣ Testing Bearer Token Authentication...')
  try {
    const response = await fetch(`${upstashUrl}/ping`, {
      headers: {
        'Authorization': `Bearer ${upstashToken}`,
      },
      signal: AbortSignal.timeout(10000)
    })

    console.log(`Status: ${response.status}`)
    const responseText = await response.text()
    console.log(`Response: ${responseText}`)

    if (response.ok) {
      console.log('✅ Bearer token authentication works')
      return true
    } else {
      console.log('❌ Bearer token authentication failed')
    }
  } catch (error) {
    console.log(`❌ Bearer token test failed: ${error.message}`)
  }

  // Test 2: Basic Authentication
  console.log('\n2️⃣ Testing Basic Authentication...')
  try {
    const credentials = btoa(`default:${upstashToken}`)
    const response = await fetch(`${upstashUrl}/ping`, {
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
      signal: AbortSignal.timeout(10000)
    })

    console.log(`Status: ${response.status}`)
    const responseText = await response.text()
    console.log(`Response: ${responseText}`)

    if (response.ok) {
      console.log('✅ Basic authentication works')
      return true
    } else {
      console.log('❌ Basic authentication failed')
    }
  } catch (error) {
    console.log(`❌ Basic auth test failed: ${error.message}`)
  }

  // Test 3: URL Parameter Authentication
  console.log('\n3️⃣ Testing URL Parameter Authentication...')
  try {
    const response = await fetch(`${upstashUrl}/ping?_token=${upstashToken}`, {
      signal: AbortSignal.timeout(10000)
    })

    console.log(`Status: ${response.status}`)
    const responseText = await response.text()
    console.log(`Response: ${responseText}`)

    if (response.ok) {
      console.log('✅ URL parameter authentication works')
      return true
    } else {
      console.log('❌ URL parameter authentication failed')
    }
  } catch (error) {
    console.log(`❌ URL parameter test failed: ${error.message}`)
  }

  // Test 4: POST with JSON body
  console.log('\n4️⃣ Testing POST with JSON Authentication...')
  try {
    const response = await fetch(`${upstashUrl}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${upstashToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['PING']),
      signal: AbortSignal.timeout(10000)
    })

    console.log(`Status: ${response.status}`)
    const responseText = await response.text()
    console.log(`Response: ${responseText}`)

    if (response.ok) {
      console.log('✅ POST JSON authentication works')
      return true
    } else {
      console.log('❌ POST JSON authentication failed')
    }
  } catch (error) {
    console.log(`❌ POST JSON test failed: ${error.message}`)
  }

  // Test 5: Check if credentials are correct by testing with curl equivalent
  console.log('\n5️⃣ Credential Verification...')
  
  console.log('🔍 Checking credential format:')
  console.log(`URL format: ${upstashUrl.startsWith('https://') ? '✅ Correct' : '❌ Should start with https://'}`)
  console.log(`Token length: ${upstashToken.length} characters`)
  console.log(`Token format: ${upstashToken.match(/^[a-f0-9]+$/) ? '✅ Hex format' : '⚠️ Not hex format'}`)

  // Test 6: Alternative endpoint
  console.log('\n6️⃣ Testing Alternative Endpoint...')
  try {
    // Try the pipeline endpoint
    const response = await fetch(`${upstashUrl}/pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${upstashToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([['PING']]),
      signal: AbortSignal.timeout(10000)
    })

    console.log(`Status: ${response.status}`)
    const responseText = await response.text()
    console.log(`Response: ${responseText}`)

    if (response.ok) {
      console.log('✅ Pipeline endpoint works')
      return true
    } else {
      console.log('❌ Pipeline endpoint failed')
    }
  } catch (error) {
    console.log(`❌ Pipeline test failed: ${error.message}`)
  }

  console.log('\n💡 TROUBLESHOOTING SUGGESTIONS:')
  console.log('1. Verify credentials in Upstash Dashboard')
  console.log('2. Check if the database is active and not suspended')
  console.log('3. Ensure the token has not expired')
  console.log('4. Try regenerating the REST token')
  console.log('5. Check if there are IP restrictions')

  console.log('\n🔧 ALTERNATIVE SOLUTIONS:')
  console.log('1. Use traditional Redis with TLS (ioredis)')
  console.log('2. Implement cache fallback without Redis')
  console.log('3. Use in-memory caching as temporary solution')

  return false
}

// Run the test
testUpstashRedisAuth()
  .then(success => {
    if (success) {
      console.log('\n🎉 Upstash Redis authentication working!')
    } else {
      console.log('\n❌ All authentication methods failed.')
      console.log('Consider using traditional Redis or implementing fallback.')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('\n💥 Test script failed:', error)
    process.exit(1)
  })

export { testUpstashRedisAuth }
