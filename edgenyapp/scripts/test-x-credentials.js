#!/usr/bin/env node
/**
 * X/Twitter Credentials Verification Script
 * Tests the X login credentials for Twikit integration
 * Verifies that the credentials work for the enhanced fallback system
 */

const fs = require('fs')
const path = require('path')

async function testXCredentials() {
  console.log('🔐 X/TWITTER CREDENTIALS VERIFICATION')
  console.log('=' .repeat(60))
  
  // Load environment variables
  require('dotenv').config()
  
  const credentials = {
    username: process.env.TWIKIT_USERNAME,
    email: process.env.TWIKIT_EMAIL,
    password: process.env.TWIKIT_PASSWORD
  }
  
  console.log('📋 Checking environment variables...')
  console.log(`   Username: ${credentials.username ? '✅ Set' : '❌ Missing'}`)
  console.log(`   Email: ${credentials.email ? '✅ Set' : '❌ Missing'}`)
  console.log(`   Password: ${credentials.password ? '✅ Set' : '❌ Missing'}`)
  
  if (!credentials.username || !credentials.email || !credentials.password) {
    console.log('\n❌ Missing required credentials!')
    console.log('💡 Make sure your .env file contains:')
    console.log('   TWIKIT_USERNAME=nxrsultxn')
    console.log('   TWIKIT_EMAIL=nnnatlusrun@gmail.com')
    console.log('   TWIKIT_PASSWORD=nuriknurik22')
    return false
  }
  
  console.log('\n✅ All credentials are configured!')
  
  // Test Scweet service with Twikit
  console.log('\n🧪 Testing Twikit integration via Scweet service...')
  
  const serviceUrls = [
    'http://localhost:8001',
    'http://scweet-service:8001',
    'http://127.0.0.1:8001'
  ]
  
  let serviceWorking = false
  
  for (const url of serviceUrls) {
    try {
      console.log(`Testing: ${url}/health`)
      
      const response = await fetch(`${url}/health`, { 
        timeout: 5000,
        signal: AbortSignal.timeout(5000)
      })
      
      if (response.ok) {
        const health = await response.json()
        console.log(`✅ Service accessible at ${url}`)
        console.log(`   Service: ${health.service}`)
        console.log(`   Scweet Ready: ${health.scweet_ready}`)
        console.log(`   Twikit Ready: ${health.twikit_ready}`)
        
        if (health.twikit_ready) {
          console.log('✅ Twikit is initialized and ready!')
          serviceWorking = true
          
          // Test Twikit endpoint with your tweet
          console.log('\n🐦 Testing Twikit with your specific tweet...')
          try {
            const testTweetUrl = 'https://x.com/nxrsultxn/status/1931733077400641998'
            
            const tweetResponse = await fetch(`${url}/twikit/tweet`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tweet_url: testTweetUrl,
                include_engagement: true,
                include_user_info: true
              }),
              timeout: 15000
            })
            
            if (tweetResponse.ok) {
              const tweetData = await tweetResponse.json()
              console.log('✅ Twikit successfully fetched your tweet!')
              console.log(`   Tweet ID: ${tweetData.tweet_id}`)
              console.log(`   Content: ${tweetData.content.substring(0, 100)}...`)
              console.log(`   Author: @${tweetData.author.username}`)
              console.log(`   Likes: ${tweetData.engagement.likes}`)
              console.log(`   Retweets: ${tweetData.engagement.retweets}`)
              console.log(`   Source: ${tweetData.source}`)
            } else {
              console.log(`⚠️ Twikit endpoint returned ${tweetResponse.status}`)
              const errorText = await tweetResponse.text()
              console.log(`   Error: ${errorText}`)
            }
          } catch (error) {
            console.log(`❌ Twikit tweet test failed: ${error.message}`)
          }
          
          break
        } else {
          console.log('⚠️ Twikit not ready - may need authentication')
        }
      } else {
        console.log(`⚠️ ${url} returned status: ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ ${url} failed: ${error.message}`)
    }
  }
  
  if (!serviceWorking) {
    console.log('\n❌ Scweet service not accessible')
    console.log('💡 Start the service with: docker-compose up -d scweet-service')
    console.log('💡 Or run: npm run docker:scweet')
    return false
  }
  
  return true
}

async function testFallbackServiceIntegration() {
  console.log('\n🔄 Testing Enhanced Fallback Service Integration')
  console.log('─'.repeat(60))
  
  try {
    const { getFallbackService } = require('../src/lib/fallback-service')
    
    const fallbackService = getFallbackService({
      preferApi: false,
      enableScweet: true,
      enableTwikit: true,
      enableScraping: true
    })
    
    console.log('📊 Fallback Service Configuration:')
    const status = fallbackService.getStatus()
    console.log(`   Preferred Source: ${status.preferredSource}`)
    console.log(`   API Failures: ${status.apiFailureCount}`)
    console.log(`   Rate Limited: ${status.isApiRateLimited}`)
    
    // Test with your specific tweet
    const testTweetUrl = 'https://x.com/nxrsultxn/status/1931733077400641998'
    console.log(`\n🐦 Testing fallback chain with your tweet: ${testTweetUrl}`)
    
    const startTime = Date.now()
    const result = await fallbackService.getTweetData(testTweetUrl)
    const fetchTime = Date.now() - startTime
    
    if (result) {
      console.log('✅ TWEET SUCCESSFULLY FETCHED!')
      console.log(`   Source: ${result.source.toUpperCase()}`)
      console.log(`   Content: ${result.content.substring(0, 100)}...`)
      console.log(`   Author: @${result.author.username}`)
      console.log(`   Engagement: ${result.likes} likes, ${result.retweets} retweets`)
      console.log(`   Fetch Time: ${fetchTime}ms`)
      console.log(`   LayerEdge Community: ${result.isFromLayerEdgeCommunity}`)
      
      // Verify it's your tweet
      if (result.author.username.toLowerCase() === 'nxrsultxn') {
        console.log('✅ VERIFIED: This is your tweet!')
      } else {
        console.log('⚠️ Note: Tweet author doesn\'t match your username')
      }
      
      return true
    } else {
      console.log('❌ Failed to fetch tweet through fallback chain')
      return false
    }
  } catch (error) {
    console.log(`❌ Error testing fallback service: ${error.message}`)
    return false
  }
}

async function generateCredentialsReport() {
  console.log('\n📋 X/TWITTER CREDENTIALS REPORT')
  console.log('=' .repeat(60))
  
  const credentialsTest = await testXCredentials()
  const fallbackTest = await testFallbackServiceIntegration()
  
  console.log('\n📊 VERIFICATION SUMMARY:')
  console.log(`   ✅ Credentials Configuration: ${credentialsTest ? 'PASSED' : 'FAILED'}`)
  console.log(`   ✅ Fallback Service Integration: ${fallbackTest ? 'PASSED' : 'FAILED'}`)
  
  const allPassed = credentialsTest && fallbackTest
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED!')
    console.log('✅ Your X credentials are properly configured')
    console.log('✅ Twikit integration is working correctly')
    console.log('✅ Enhanced fallback system can access your tweets')
    console.log('✅ The failing tweet URL should now work!')
  } else {
    console.log('\n⚠️ SOME TESTS FAILED')
    console.log('❌ Review the errors above and fix the issues')
    console.log('💡 Common fixes:')
    console.log('   1. Start Scweet service: docker-compose up -d scweet-service')
    console.log('   2. Check credentials in .env file')
    console.log('   3. Verify Docker networking: docker network ls')
  }
  
  console.log('\n📋 Next Steps:')
  if (allPassed) {
    console.log('1. Deploy to production with: npm run deploy:critical-fixes')
    console.log('2. Test the specific failing tweet in the web interface')
    console.log('3. Monitor logs for continued stability')
  } else {
    console.log('1. Fix the issues mentioned above')
    console.log('2. Re-run this test: npm run test:x-credentials')
    console.log('3. Run full diagnostic: npm run diagnose:system-failures')
  }
  
  return allPassed
}

// Main execution
async function main() {
  console.log('🔐 LayerEdge X/Twitter Credentials Verification')
  console.log('🐦 Testing credentials for: @nxrsultxn')
  console.log('📧 Email: nnnatlusrun@gmail.com')
  console.log('')
  
  const success = await generateCredentialsReport()
  
  console.log('\n🏁 Credentials verification completed!')
  process.exit(success ? 0 : 1)
}

// Handle command line execution
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Credentials verification failed:', error)
    process.exit(1)
  })
}

module.exports = {
  testXCredentials,
  testFallbackServiceIntegration
}
