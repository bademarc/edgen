#!/usr/bin/env node
/**
 * Test script for Official Scweet v3.0+ integration with LayerEdge platform
 * Tests the complete fallback chain: Twitter API -> Official Scweet -> Web Scraping
 * Uses Official Altimis/Scweet repository methods and API structure
 */

const { getFallbackService } = require('../src/lib/fallback-service')

async function testScweetIntegration() {
  console.log('🧪 Testing Official Scweet v3.0+ Integration for LayerEdge Platform\n')

  // Test URLs - replace with actual LayerEdge community tweets
  const testTweets = [
    'https://x.com/layeredge/status/1234567890',  // Replace with real tweet
    'https://x.com/user/status/1234567891',       // Replace with real tweet
  ]

  // Initialize fallback service with Official Scweet v3.0+ enabled
  const fallbackService = getFallbackService({
    enableScraping: true,
    preferApi: false,  // Test Official Scweet first
    enableScweet: true,
    scweetServiceUrl: process.env.SCWEET_SERVICE_URL || 'http://localhost:8001',
    apiTimeoutMs: 15000  // Longer timeout for Official Scweet operations
  })

  console.log('📊 Fallback Service Status:')
  console.log(fallbackService.getStatus())
  console.log()

  for (const tweetUrl of testTweets) {
    console.log(`🐦 Testing tweet: ${tweetUrl}`)
    console.log('─'.repeat(60))

    try {
      // Test tweet data fetching
      console.log('1️⃣ Testing tweet data fetching...')
      const startTime = Date.now()
      
      const tweetData = await fallbackService.getTweetData(tweetUrl)
      const fetchTime = Date.now() - startTime

      if (tweetData) {
        console.log('✅ Tweet data fetched successfully!')
        console.log(`   Source: ${tweetData.source}`)
        console.log(`   Content: ${tweetData.content.substring(0, 100)}...`)
        console.log(`   Author: @${tweetData.author.username}`)
        console.log(`   Engagement: ${tweetData.likes} likes, ${tweetData.retweets} retweets, ${tweetData.replies} replies`)
        console.log(`   LayerEdge Community: ${tweetData.isFromLayerEdgeCommunity}`)
        console.log(`   Fetch time: ${fetchTime}ms`)
      } else {
        console.log('❌ Failed to fetch tweet data')
      }

      // Test engagement metrics
      console.log('\n2️⃣ Testing engagement metrics...')
      const engagementStartTime = Date.now()
      
      const engagementData = await fallbackService.getEngagementMetrics(tweetUrl)
      const engagementFetchTime = Date.now() - engagementStartTime

      if (engagementData) {
        console.log('✅ Engagement metrics fetched successfully!')
        console.log(`   Source: ${engagementData.source}`)
        console.log(`   Metrics: ${engagementData.likes} likes, ${engagementData.retweets} retweets, ${engagementData.replies} replies`)
        console.log(`   Timestamp: ${engagementData.timestamp}`)
        console.log(`   Fetch time: ${engagementFetchTime}ms`)
      } else {
        console.log('❌ Failed to fetch engagement metrics')
      }

    } catch (error) {
      console.log(`❌ Error testing tweet: ${error.message}`)
    }

    console.log('\n' + '═'.repeat(60) + '\n')
  }

  // Test batch engagement metrics
  console.log('3️⃣ Testing batch engagement metrics...')
  try {
    const batchStartTime = Date.now()
    const batchResults = await fallbackService.getBatchEngagementMetrics(testTweets)
    const batchFetchTime = Date.now() - batchStartTime

    console.log('✅ Batch engagement metrics completed!')
    console.log(`   Total tweets: ${batchResults.length}`)
    console.log(`   Successful: ${batchResults.filter(r => r.metrics !== null).length}`)
    console.log(`   Batch fetch time: ${batchFetchTime}ms`)

    batchResults.forEach((result, index) => {
      if (result.metrics) {
        console.log(`   Tweet ${index + 1}: ${result.metrics.likes} likes (${result.metrics.source})`)
      } else {
        console.log(`   Tweet ${index + 1}: Failed to fetch`)
      }
    })
  } catch (error) {
    console.log(`❌ Error in batch testing: ${error.message}`)
  }

  console.log('\n📈 Final Status:')
  console.log(fallbackService.getStatus())
}

// Test Scweet service health
async function testScweetHealth() {
  const scweetUrl = process.env.SCWEET_SERVICE_URL || 'http://localhost:8001'
  
  try {
    console.log(`🏥 Testing Official Scweet v3.0+ service health at ${scweetUrl}`)

    const response = await fetch(`${scweetUrl}/health`)
    const health = await response.json()

    if (response.ok) {
      console.log('✅ Official Scweet v3.0+ service is healthy!')
      console.log(`   Status: ${health.status}`)
      console.log(`   Service: ${health.service}`)
      console.log(`   Scweet Ready: ${health.scweet_ready}`)
      console.log(`   Timestamp: ${health.timestamp}`)
      return true
    } else {
      console.log('❌ Official Scweet service health check failed')
      return false
    }
  } catch (error) {
    console.log(`❌ Cannot connect to Official Scweet service: ${error.message}`)
    console.log('💡 Make sure the Official Scweet v3.0+ service is running:')
    console.log('   docker-compose up scweet-service')
    console.log('   or')
    console.log('   python src/lib/scweet-service.py')
    return false
  }
}

// Main execution
async function main() {
  console.log('🚀 LayerEdge Official Scweet v3.0+ Integration Test Suite')
  console.log('📦 Using Official Altimis/Scweet Repository')
  console.log('=' .repeat(60))

  // Check if Official Scweet service is available
  const isScweetHealthy = await testScweetHealth()
  console.log()

  if (isScweetHealthy) {
    await testScweetIntegration()
  } else {
    console.log('⚠️ Skipping integration tests due to Official Scweet service unavailability')
    console.log('🔧 Please start the Official Scweet v3.0+ service and try again')
  }

  console.log('🏁 Official Scweet integration test suite completed!')
}

// Handle command line execution
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test suite failed:', error)
    process.exit(1)
  })
}

module.exports = {
  testScweetIntegration,
  testScweetHealth
}
