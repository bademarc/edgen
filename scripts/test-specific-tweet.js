#!/usr/bin/env node

/**
 * Test script to verify Twitter API with a specific tweet ID
 */

import dotenv from 'dotenv'
dotenv.config()

async function testSpecificTweet() {
  console.log('🔍 Testing specific tweet fetch...\n')

  const bearerToken = process.env.TWITTER_BEARER_TOKEN
  const tweetId = '1932849663084036106' // The tweet ID from the error logs
  
  if (!bearerToken) {
    console.error('❌ TWITTER_BEARER_TOKEN not found in environment variables')
    process.exit(1)
  }

  console.log('✅ Bearer Token found')
  console.log(`📏 Token length: ${bearerToken.length} characters`)
  
  // Test specific tweet fetch
  console.log(`\n🐦 Testing tweet fetch for ID: ${tweetId}`)
  
  try {
    const url = `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=created_at,author_id,public_metrics,text&user.fields=username,name,verified,public_metrics&expansions=author_id`
    
    console.log(`🌐 Making request to: ${url}`)
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
    })

    console.log(`📊 Response status: ${response.status}`)
    console.log(`📊 Response status text: ${response.statusText}`)
    
    // Log rate limit headers
    const rateLimitHeaders = {
      limit: response.headers.get('x-rate-limit-limit'),
      remaining: response.headers.get('x-rate-limit-remaining'),
      reset: response.headers.get('x-rate-limit-reset'),
      resetTime: response.headers.get('x-rate-limit-reset') ? 
        new Date(parseInt(response.headers.get('x-rate-limit-reset')) * 1000).toISOString() : 'N/A'
    }
    console.log('📊 Rate limit info:', rateLimitHeaders)

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Tweet fetch successful!')
      console.log('📄 Tweet data:', JSON.stringify(data, null, 2))
    } else {
      const errorData = await response.text()
      console.error('❌ Tweet fetch failed!')
      console.error('📄 Error response:', errorData)
      
      if (response.status === 401) {
        console.error('\n🔍 401 Unauthorized - Possible causes:')
        console.error('  - Invalid Bearer Token')
        console.error('  - Token expired')
        console.error('  - Token lacks required permissions')
        console.error('  - Token format is incorrect')
      } else if (response.status === 429) {
        console.error('\n🔍 429 Rate Limited - Possible causes:')
        console.error('  - Too many requests in the time window')
        console.error('  - Need to wait for rate limit reset')
        console.error(`  - Reset time: ${rateLimitHeaders.resetTime}`)
      }
    }

  } catch (error) {
    console.error('❌ Network error:', error.message)
  }
}

testSpecificTweet().catch(console.error)
