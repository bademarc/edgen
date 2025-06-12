#!/usr/bin/env node

/**
 * Simple Twitter API test to check authentication
 */

import dotenv from 'dotenv'
dotenv.config()

async function testTwitterSimple() {
  console.log('🔍 Simple Twitter API Test...\n')

  const bearerToken = process.env.TWITTER_BEARER_TOKEN
  
  if (!bearerToken) {
    console.error('❌ TWITTER_BEARER_TOKEN not found')
    process.exit(1)
  }

  console.log('✅ Bearer Token found')
  
  // Test with a simple endpoint that should work with app-only Bearer Token
  console.log('\n🌐 Testing Twitter API v2 with app-only endpoint...')

  try {
    // Use an endpoint that supports app-only authentication
    const url = 'https://api.twitter.com/2/tweets/1932849663084036106?tweet.fields=created_at,author_id,public_metrics,text'
    
    console.log(`📡 Making request to: ${url}`)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
    })

    console.log(`📊 Response status: ${response.status}`)
    console.log(`📊 Response status text: ${response.statusText}`)
    
    // Log all response headers
    console.log('\n📋 Response Headers:')
    for (const [key, value] of response.headers.entries()) {
      console.log(`   ${key}: ${value}`)
    }

    if (response.ok) {
      const data = await response.json()
      console.log('\n✅ API call successful!')
      console.log('📄 Response data:', JSON.stringify(data, null, 2))
    } else {
      const errorData = await response.text()
      console.log('\n❌ API call failed!')
      console.log('📄 Error response:', errorData)
      
      // Try to parse error as JSON
      try {
        const errorJson = JSON.parse(errorData)
        console.log('📄 Parsed error:', JSON.stringify(errorJson, null, 2))
      } catch (e) {
        console.log('📄 Error is not valid JSON')
      }
    }

  } catch (error) {
    console.error('\n❌ Network error:', error.message)
    console.error('Stack:', error.stack)
  }
}

testTwitterSimple().catch(console.error)
