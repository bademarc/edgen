/**
 * Test script to diagnose Twitter API issues in manual tweet submission
 * This script will test the exact API calls used in the manual submission feature
 */

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

async function testTwitterApiCredentials() {
  console.log('🔍 Testing Twitter API Credentials for Manual Tweet Submission...\n')

  // Check environment variables
  const bearerToken = process.env.TWITTER_BEARER_TOKEN
  const clientId = process.env.TWITTER_CLIENT_ID
  const clientSecret = process.env.TWITTER_CLIENT_SECRET

  console.log('📋 Environment Variables Check:')
  console.log(`TWITTER_BEARER_TOKEN: ${bearerToken ? '✅ Present' : '❌ Missing'}`)
  console.log(`TWITTER_CLIENT_ID: ${clientId ? '✅ Present' : '❌ Missing'}`)
  console.log(`TWITTER_CLIENT_SECRET: ${clientSecret ? '✅ Present' : '❌ Missing'}`)

  if (bearerToken) {
    console.log(`Bearer Token format: ${bearerToken.substring(0, 20)}...`)
    console.log(`Bearer Token length: ${bearerToken.length} characters`)
    console.log(`Starts with expected format: ${bearerToken.startsWith('AAAAAAAAAAAAAAAAAAAAAA') ? '✅ Yes' : '❌ No'}`)
  }

  console.log('\n' + '='.repeat(60) + '\n')

  if (!bearerToken) {
    console.error('❌ Bearer token is required for Twitter API v2')
    return false
  }

  // Test 1: Basic API Health Check
  console.log('🏥 Test 1: API Health Check')
  try {
    const response = await fetch('https://api.twitter.com/2/tweets/search/recent?query=test&max_results=10', {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
      },
      signal: AbortSignal.timeout(10000)
    })

    console.log(`Status: ${response.status} ${response.statusText}`)
    console.log(`Rate Limit: ${response.headers.get('x-rate-limit-remaining')}/${response.headers.get('x-rate-limit-limit')}`)
    console.log(`Rate Limit Reset: ${new Date(parseInt(response.headers.get('x-rate-limit-reset') || '0') * 1000)}`)

    if (response.status === 401) {
      console.error('❌ Authentication failed - Bearer token is invalid')
      return false
    } else if (response.status === 403) {
      console.error('❌ Forbidden - Bearer token lacks required permissions')
      return false
    } else if (response.status === 200) {
      console.log('✅ API health check passed')
    }
  } catch (error) {
    console.error('❌ API health check failed:', error.message)
    return false
  }

  console.log('\n' + '='.repeat(60) + '\n')

  // Test 2: Test Tweet Data Fetching (using a known public tweet)
  console.log('🐦 Test 2: Tweet Data Fetching')
  
  // Use a known public tweet ID for testing
  const testTweetId = '1234567890123456789' // This will likely fail, but we can see the error
  const testUrl = `https://api.twitter.com/2/tweets/${testTweetId}?expansions=author_id&tweet.fields=public_metrics,created_at&user.fields=username,name,profile_image_url`

  try {
    console.log(`Testing URL: ${testUrl}`)
    
    const response = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000)
    })

    console.log(`Status: ${response.status} ${response.statusText}`)
    
    const data = await response.json()
    console.log('Response data:', JSON.stringify(data, null, 2))

    if (data.errors) {
      console.log('API returned errors (expected for test tweet):')
      data.errors.forEach(error => {
        console.log(`  - ${error.title}: ${error.detail}`)
      })
    }

    if (response.status === 200 && data.data) {
      console.log('✅ Tweet data fetching works correctly')
    } else if (response.status === 200 && data.errors) {
      console.log('✅ API is working (test tweet not found as expected)')
    }
  } catch (error) {
    console.error('❌ Tweet data fetching failed:', error.message)
    return false
  }

  console.log('\n' + '='.repeat(60) + '\n')

  // Test 3: Test with a real tweet URL (if provided)
  console.log('🔗 Test 3: Real Tweet URL Test')
  
  // You can replace this with an actual tweet URL for testing
  const realTweetUrl = process.argv[2] // Pass tweet URL as command line argument
  
  if (realTweetUrl) {
    console.log(`Testing with real tweet URL: ${realTweetUrl}`)
    
    // Extract tweet ID from URL
    const tweetIdMatch = realTweetUrl.match(/\/status\/(\d+)/)
    if (!tweetIdMatch) {
      console.error('❌ Could not extract tweet ID from URL')
      return false
    }
    
    const tweetId = tweetIdMatch[1]
    console.log(`Extracted tweet ID: ${tweetId}`)
    
    const apiUrl = `https://api.twitter.com/2/tweets/${tweetId}?expansions=author_id&tweet.fields=public_metrics,created_at&user.fields=username,name,profile_image_url`
    
    try {
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000)
      })

      console.log(`Status: ${response.status} ${response.statusText}`)
      
      const data = await response.json()
      
      if (data.errors) {
        console.log('❌ API returned errors:')
        data.errors.forEach(error => {
          console.log(`  - ${error.title}: ${error.detail}`)
        })
        return false
      }

      if (data.data) {
        console.log('✅ Successfully fetched real tweet data:')
        console.log(`  Tweet ID: ${data.data.id}`)
        console.log(`  Content: ${data.data.text?.substring(0, 100)}...`)
        console.log(`  Author: ${data.includes?.users?.[0]?.username}`)
        console.log(`  Likes: ${data.data.public_metrics?.like_count}`)
        console.log(`  Retweets: ${data.data.public_metrics?.retweet_count}`)
        return true
      }
    } catch (error) {
      console.error('❌ Real tweet test failed:', error.message)
      return false
    }
  } else {
    console.log('ℹ️ No real tweet URL provided. Pass a tweet URL as argument to test with real data.')
    console.log('Example: node test-twitter-api-manual-submission.js "https://x.com/username/status/1234567890"')
  }

  console.log('\n' + '='.repeat(60) + '\n')

  // Test 4: Check API version and endpoints
  console.log('🔧 Test 4: API Version and Endpoint Check')
  
  console.log('Current implementation uses:')
  console.log('  - Twitter API v2')
  console.log('  - Bearer Token authentication')
  console.log('  - Endpoint: https://api.twitter.com/2/tweets/{id}')
  console.log('  - Fields: expansions=author_id&tweet.fields=public_metrics,created_at&user.fields=username,name,profile_image_url')
  
  console.log('\n✅ All tests completed!')
  return true
}

// Run the tests immediately
testTwitterApiCredentials()
  .then(success => {
    if (success) {
      console.log('\n🎉 Twitter API testing completed successfully!')
      console.log('\nIf you\'re still experiencing issues with manual tweet submission:')
      console.log('1. Check that the tweet URL is valid and public')
      console.log('2. Ensure the tweet is not deleted or private')
      console.log('3. Verify the user has permission to view the tweet')
      console.log('4. Check server logs for detailed error messages')
    } else {
      console.log('\n❌ Twitter API testing failed!')
      console.log('\nPossible solutions:')
      console.log('1. Verify TWITTER_BEARER_TOKEN in .env.local')
      console.log('2. Check Twitter Developer Portal for API access')
      console.log('3. Ensure Bearer Token has read permissions')
      console.log('4. Contact Twitter Support if credentials are correct')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('\n💥 Test script crashed:', error)
    process.exit(1)
  })

export { testTwitterApiCredentials }
