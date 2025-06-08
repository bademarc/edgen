#!/usr/bin/env node
/**
 * X API Credentials Testing Script
 * Tests the new X API credentials and login functionality
 * Verifies user authentication and tweet fetching capabilities
 */

const { XApiService, getXApiService } = require('../src/lib/x-api-service')

// Test configuration
const TEST_CONFIG = {
  targetUsername: 'nxrsultxn',
  targetTweetUrl: 'https://x.com/nxrsultxn/status/1931733077400641998',
  testTweetIds: ['1931733077400641998'],
  maxTweets: 5
}

async function testXApiConnection() {
  console.log('🔍 X API CONNECTION TEST')
  console.log('─'.repeat(50))
  
  try {
    const xApiService = getXApiService()
    
    console.log('📊 X API Service Status:')
    const status = xApiService.getStatus()
    console.log(`   Authenticated: ${status.authenticated}`)
    console.log(`   API Key: ${status.apiKey}`)
    console.log(`   Has Bearer Token: ${status.hasBearer}`)
    console.log(`   Ready: ${status.ready}`)
    
    if (!status.ready) {
      console.log('❌ X API service not ready')
      return false
    }
    
    // Test connection
    const connectionTest = await xApiService.verifyConnection()
    
    if (connectionTest) {
      console.log('✅ X API connection verified successfully')
      return true
    } else {
      console.log('❌ X API connection verification failed')
      return false
    }
  } catch (error) {
    console.log(`❌ X API connection test failed: ${error.message}`)
    return false
  }
}

async function testUserLogin() {
  console.log('\n🔐 USER LOGIN VERIFICATION TEST')
  console.log('─'.repeat(50))
  
  try {
    const xApiService = getXApiService()
    
    console.log(`Testing login for user: @${TEST_CONFIG.targetUsername}`)
    
    const loginResult = await xApiService.verifyUserLogin(TEST_CONFIG.targetUsername)
    
    if (loginResult.success && loginResult.user) {
      console.log('✅ User login verified successfully!')
      console.log(`   User ID: ${loginResult.user.id}`)
      console.log(`   Username: @${loginResult.user.username}`)
      console.log(`   Display Name: ${loginResult.user.name}`)
      console.log(`   Verified: ${loginResult.user.verified}`)
      console.log(`   Followers: ${loginResult.user.followersCount.toLocaleString()}`)
      console.log(`   Following: ${loginResult.user.followingCount.toLocaleString()}`)
      console.log(`   Tweets: ${loginResult.user.tweetCount.toLocaleString()}`)
      
      if (loginResult.user.description) {
        console.log(`   Bio: ${loginResult.user.description.substring(0, 100)}...`)
      }
      
      return true
    } else {
      console.log(`❌ User login verification failed: ${loginResult.error}`)
      return false
    }
  } catch (error) {
    console.log(`❌ User login test failed: ${error.message}`)
    return false
  }
}

async function testTweetFetching() {
  console.log('\n🐦 TWEET FETCHING TEST')
  console.log('─'.repeat(50))
  
  try {
    const xApiService = getXApiService()
    
    console.log(`Testing tweet fetching for: ${TEST_CONFIG.targetTweetUrl}`)
    
    const tweetData = await xApiService.getTweetByUrl(TEST_CONFIG.targetTweetUrl)
    
    if (tweetData) {
      console.log('✅ Tweet fetched successfully!')
      console.log(`   Tweet ID: ${tweetData.id}`)
      console.log(`   Content: ${tweetData.content.substring(0, 100)}...`)
      console.log(`   Author: @${tweetData.author.username} (${tweetData.author.name})`)
      console.log(`   Verified: ${tweetData.author.verified}`)
      console.log(`   Created: ${tweetData.createdAt.toLocaleString()}`)
      console.log(`   Engagement:`)
      console.log(`     Likes: ${tweetData.engagement.likes.toLocaleString()}`)
      console.log(`     Retweets: ${tweetData.engagement.retweets.toLocaleString()}`)
      console.log(`     Replies: ${tweetData.engagement.replies.toLocaleString()}`)
      console.log(`     Quotes: ${tweetData.engagement.quotes.toLocaleString()}`)
      console.log(`   LayerEdge Community: ${tweetData.isFromLayerEdgeCommunity}`)
      console.log(`   URL: ${tweetData.url}`)
      
      // Verify it's the correct user's tweet
      if (tweetData.author.username.toLowerCase() === TEST_CONFIG.targetUsername.toLowerCase()) {
        console.log('✅ VERIFIED: Tweet is from the target user!')
        return true
      } else {
        console.log(`⚠️ WARNING: Tweet is from @${tweetData.author.username}, expected @${TEST_CONFIG.targetUsername}`)
        return false
      }
    } else {
      console.log('❌ Failed to fetch tweet data')
      return false
    }
  } catch (error) {
    console.log(`❌ Tweet fetching test failed: ${error.message}`)
    return false
  }
}

async function testUserTweetHistory() {
  console.log('\n📝 USER TWEET HISTORY TEST')
  console.log('─'.repeat(50))
  
  try {
    const xApiService = getXApiService()
    
    console.log(`Fetching recent tweets for @${TEST_CONFIG.targetUsername}...`)
    
    const userTweets = await xApiService.getUserTweets(TEST_CONFIG.targetUsername, TEST_CONFIG.maxTweets)
    
    if (userTweets && userTweets.length > 0) {
      console.log(`✅ Fetched ${userTweets.length} tweets successfully!`)
      
      userTweets.forEach((tweet, index) => {
        console.log(`\n   Tweet ${index + 1}:`)
        console.log(`     ID: ${tweet.id}`)
        console.log(`     Content: ${tweet.content.substring(0, 80)}...`)
        console.log(`     Created: ${tweet.createdAt.toLocaleString()}`)
        console.log(`     Likes: ${tweet.engagement.likes}`)
        console.log(`     LayerEdge: ${tweet.isFromLayerEdgeCommunity}`)
      })
      
      // Check if any tweets are LayerEdge community related
      const layerEdgeTweets = userTweets.filter(tweet => tweet.isFromLayerEdgeCommunity)
      if (layerEdgeTweets.length > 0) {
        console.log(`\n✅ Found ${layerEdgeTweets.length} LayerEdge community tweets!`)
      }
      
      return true
    } else {
      console.log('❌ No tweets found or failed to fetch user tweets')
      return false
    }
  } catch (error) {
    console.log(`❌ User tweet history test failed: ${error.message}`)
    return false
  }
}

async function testRateLimitStatus() {
  console.log('\n📊 RATE LIMIT STATUS TEST')
  console.log('─'.repeat(50))
  
  try {
    const xApiService = getXApiService()
    
    console.log('Checking X API rate limit status...')
    
    const rateLimits = await xApiService.getRateLimitStatus()
    
    if (rateLimits) {
      console.log('✅ Rate limit status retrieved successfully!')
      
      // Show key rate limits
      const resources = rateLimits.resources
      if (resources) {
        console.log('\n📋 Key Rate Limits:')
        
        if (resources.tweets) {
          console.log('   Tweets:')
          Object.entries(resources.tweets).forEach(([endpoint, limit]) => {
            console.log(`     ${endpoint}: ${limit.remaining}/${limit.limit} (resets: ${new Date(limit.reset * 1000).toLocaleTimeString()})`)
          })
        }
        
        if (resources.users) {
          console.log('   Users:')
          Object.entries(resources.users).forEach(([endpoint, limit]) => {
            console.log(`     ${endpoint}: ${limit.remaining}/${limit.limit} (resets: ${new Date(limit.reset * 1000).toLocaleTimeString()})`)
          })
        }
      }
      
      return true
    } else {
      console.log('❌ Failed to retrieve rate limit status')
      return false
    }
  } catch (error) {
    console.log(`❌ Rate limit status test failed: ${error.message}`)
    return false
  }
}

async function testFallbackIntegration() {
  console.log('\n🔄 FALLBACK SERVICE INTEGRATION TEST')
  console.log('─'.repeat(50))
  
  try {
    const { getFallbackService } = require('../src/lib/fallback-service')
    
    const fallbackService = getFallbackService({
      preferApi: true, // Enable API to test X API integration
      enableScweet: true,
      enableTwikit: true,
      enableScraping: true
    })
    
    console.log('Testing fallback service with X API integration...')
    
    const result = await fallbackService.getTweetData(TEST_CONFIG.targetTweetUrl)
    
    if (result) {
      console.log('✅ Fallback service successfully fetched tweet!')
      console.log(`   Source: ${result.source.toUpperCase()}`)
      console.log(`   Content: ${result.content.substring(0, 100)}...`)
      console.log(`   Author: @${result.author.username}`)
      console.log(`   Engagement: ${result.likes} likes, ${result.retweets} retweets`)
      
      if (result.source === 'api') {
        console.log('✅ SUCCESS: X API was used as the data source!')
        return true
      } else {
        console.log(`⚠️ INFO: ${result.source.toUpperCase()} was used instead of X API`)
        return true // Still successful, just different source
      }
    } else {
      console.log('❌ Fallback service failed to fetch tweet')
      return false
    }
  } catch (error) {
    console.log(`❌ Fallback integration test failed: ${error.message}`)
    return false
  }
}

async function generateXApiReport() {
  console.log('\n📋 X API COMPREHENSIVE TEST REPORT')
  console.log('=' .repeat(60))
  
  const results = {
    connection: await testXApiConnection(),
    userLogin: await testUserLogin(),
    tweetFetching: await testTweetFetching(),
    userHistory: await testUserTweetHistory(),
    rateLimits: await testRateLimitStatus(),
    fallbackIntegration: await testFallbackIntegration()
  }
  
  console.log('\n📊 TEST SUMMARY')
  console.log('=' .repeat(60))
  
  console.log('🔧 X API Tests:')
  console.log(`   ✅ Connection Test: ${results.connection ? 'PASSED' : 'FAILED'}`)
  console.log(`   ✅ User Login Test: ${results.userLogin ? 'PASSED' : 'FAILED'}`)
  console.log(`   ✅ Tweet Fetching Test: ${results.tweetFetching ? 'PASSED' : 'FAILED'}`)
  console.log(`   ✅ User History Test: ${results.userHistory ? 'PASSED' : 'FAILED'}`)
  console.log(`   ✅ Rate Limits Test: ${results.rateLimits ? 'PASSED' : 'FAILED'}`)
  console.log(`   ✅ Fallback Integration: ${results.fallbackIntegration ? 'PASSED' : 'FAILED'}`)
  
  const allPassed = Object.values(results).every(Boolean)
  
  if (allPassed) {
    console.log('\n🎉 ALL X API TESTS PASSED!')
    console.log('✅ X API credentials are working correctly')
    console.log('✅ User login verification is functional')
    console.log('✅ Tweet fetching is operational')
    console.log('✅ Fallback service integration is working')
    console.log('')
    console.log('🎯 SUCCESS: Your new X API credentials are fully functional!')
  } else {
    console.log('\n⚠️ SOME X API TESTS FAILED')
    console.log('❌ Review the specific test failures above')
    console.log('💡 Check your X API credentials in .env file')
  }
  
  console.log('\n📋 Next Steps:')
  if (allPassed) {
    console.log('1. Deploy to production with new X API credentials')
    console.log('2. Test in web interface: http://localhost:3000/submit')
    console.log('3. Monitor API usage and rate limits')
  } else {
    console.log('1. Fix the failing tests based on error messages above')
    console.log('2. Verify X API credentials are correct')
    console.log('3. Re-run this test: npm run test:x-api-credentials')
  }
  
  return allPassed
}

// Main execution
async function main() {
  console.log('🚀 LayerEdge X API Credentials Testing Suite')
  console.log('🔑 Testing new X API credentials and functionality')
  console.log('👤 Target User: @nxrsultxn')
  console.log('🐦 Target Tweet: https://x.com/nxrsultxn/status/1931733077400641998')
  console.log('')
  
  const success = await generateXApiReport()
  
  console.log('\n🏁 X API credentials testing completed!')
  process.exit(success ? 0 : 1)
}

// Handle command line execution
if (require.main === module) {
  main().catch(error => {
    console.error('💥 X API credentials test failed:', error)
    process.exit(1)
  })
}

module.exports = {
  testXApiConnection,
  testUserLogin,
  testTweetFetching,
  testUserTweetHistory,
  testRateLimitStatus,
  testFallbackIntegration
}
