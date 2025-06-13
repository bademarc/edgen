#!/usr/bin/env node

/**
 * Test script to verify Twitter API authentication and basic functionality
 */

import dotenv from 'dotenv'
dotenv.config()

async function testTwitterAPI() {
  console.log('🔍 Testing Twitter API Authentication...\n')

  const bearerToken = process.env.TWITTER_BEARER_TOKEN
  
  if (!bearerToken) {
    console.error('❌ TWITTER_BEARER_TOKEN not found in environment variables')
    process.exit(1)
  }

  console.log('✅ Bearer Token found')
  console.log(`📏 Token length: ${bearerToken.length} characters`)
  console.log(`🔤 Token starts with: ${bearerToken.substring(0, 25)}...`)
  
  // Test basic API connectivity
  console.log('\n🌐 Testing API connectivity...')
  
  try {
    const response = await fetch('https://api.twitter.com/2/tweets/1932849663084036106?tweet.fields=created_at,author_id,public_metrics,text', {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
    })

    console.log(`📊 Response status: ${response.status}`)
    console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()))

    if (response.ok) {
      const data = await response.json()
      console.log('✅ API call successful!')
      console.log('📄 Response data:', JSON.stringify(data, null, 2))
    } else {
      const errorData = await response.text()
      console.error('❌ API call failed!')
      console.error('📄 Error response:', errorData)
    }

  } catch (error) {
    console.error('❌ Network error:', error.message)
  }

  // Test rate limit info
  console.log('\n📊 Testing rate limit endpoint...')
  
  try {
    const rateLimitResponse = await fetch('https://api.twitter.com/1.1/application/rate_limit_status.json', {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (rateLimitResponse.ok) {
      const rateLimitData = await rateLimitResponse.json()
      console.log('✅ Rate limit check successful!')
      console.log('📊 Available endpoints:', Object.keys(rateLimitData.resources).slice(0, 5))
    } else {
      console.log('⚠️ Rate limit check failed, but this might be expected for v2 API')
    }

  } catch (error) {
    console.log('⚠️ Rate limit check error (might be expected):', error.message)
  }
}

testTwitterAPI().catch(console.error)
