#!/usr/bin/env node
/**
 * Enhanced Fallback System Test Suite
 * Tests Official Scweet v3.0+ → Twikit → Twitter API → Basic Web Scraping fallback chain
 */

const { getFallbackService } = require('../src/lib/fallback-service')

async function testEnhancedFallbackChain() {
  console.log('🧪 Testing Enhanced Fallback Chain: Scweet → Twikit → API → Scraping\n')

  // Test URLs - replace with actual LayerEdge community tweets
  const testTweets = [
    'https://x.com/layeredge/status/1234567890',  // Replace with real tweet
    'https://x.com/user/status/1234567891',       // Replace with real tweet
  ]

  // Initialize fallback service with enhanced configuration
  const fallbackService = getFallbackService({
    enableScraping: true,
    preferApi: false,  // Test enhanced fallback first
    enableScweet: true,
    scweetServiceUrl: process.env.SCWEET_SERVICE_URL || 'http://localhost:8001',
    apiTimeoutMs: 15000
  })

  console.log('📊 Enhanced Fallback Service Status:')
  console.log(fallbackService.getStatus())
  console.log()

  for (const tweetUrl of testTweets) {
    console.log(`🐦 Testing enhanced fallback for: ${tweetUrl}`)
    console.log('─'.repeat(70))

    try {
      // Test complete fallback chain
      console.log('1️⃣ Testing complete fallback chain...')
      const startTime = Date.now()
      
      const tweetData = await fallbackService.getTweetData(tweetUrl)
      const fetchTime = Date.now() - startTime

      if (tweetData) {
        console.log('✅ Tweet data fetched successfully!')
        console.log(`   Source: ${tweetData.source.toUpperCase()}`)
        console.log(`   Content: ${tweetData.content.substring(0, 100)}...`)
        console.log(`   Author: @${tweetData.author.username}`)
        console.log(`   Engagement: ${tweetData.likes} likes, ${tweetData.retweets} retweets, ${tweetData.replies} replies`)
        console.log(`   LayerEdge Community: ${tweetData.isFromLayerEdgeCommunity}`)
        console.log(`   Fetch time: ${fetchTime}ms`)
        
        // Log which fallback method was successful
        switch (tweetData.source) {
          case 'scweet':
            console.log('🎯 SUCCESS: Official Scweet v3.0+ (PRIMARY)')
            break
          case 'twikit':
            console.log('🎯 SUCCESS: Twikit (SECONDARY FALLBACK)')
            break
          case 'api':
            console.log('🎯 SUCCESS: Twitter API (TERTIARY FALLBACK)')
            break
          case 'scraper':
            console.log('🎯 SUCCESS: Basic Web Scraping (FINAL FALLBACK)')
            break
          default:
            console.log('🎯 SUCCESS: Unknown source')
        }
      } else {
        console.log('❌ All fallback methods failed')
      }

      // Test engagement metrics with enhanced fallback
      console.log('\n2️⃣ Testing enhanced engagement metrics fallback...')
      const engagementStartTime = Date.now()
      
      const engagementData = await fallbackService.getEngagementMetrics(tweetUrl)
      const engagementFetchTime = Date.now() - engagementStartTime

      if (engagementData) {
        console.log('✅ Engagement metrics fetched successfully!')
        console.log(`   Source: ${engagementData.source.toUpperCase()}`)
        console.log(`   Metrics: ${engagementData.likes} likes, ${engagementData.retweets} retweets, ${engagementData.replies} replies`)
        console.log(`   Timestamp: ${engagementData.timestamp}`)
        console.log(`   Fetch time: ${engagementFetchTime}ms`)
        
        // Log which fallback method was successful for engagement
        switch (engagementData.source) {
          case 'scweet':
            console.log('🎯 ENGAGEMENT SUCCESS: Official Scweet v3.0+ (PRIMARY)')
            break
          case 'twikit':
            console.log('🎯 ENGAGEMENT SUCCESS: Twikit (SECONDARY FALLBACK)')
            break
          case 'api':
            console.log('🎯 ENGAGEMENT SUCCESS: Twitter API (TERTIARY FALLBACK)')
            break
          case 'scraper':
            console.log('🎯 ENGAGEMENT SUCCESS: Basic Web Scraping (FINAL FALLBACK)')
            break
        }
      } else {
        console.log('❌ Failed to fetch engagement metrics with all fallback methods')
      }

    } catch (error) {
      console.log(`❌ Error testing enhanced fallback: ${error.message}`)
    }

    console.log('\n' + '═'.repeat(70) + '\n')
  }

  // Test service health for all components
  console.log('3️⃣ Testing enhanced service health...')
  try {
    const scweetUrl = process.env.SCWEET_SERVICE_URL || 'http://localhost:8001'
    
    // Test main service health
    const healthResponse = await fetch(`${scweetUrl}/health`)
    if (healthResponse.ok) {
      const health = await healthResponse.json()
      console.log('✅ Enhanced service health check passed!')
      console.log(`   Service: ${health.service}`)
      console.log(`   Scweet Ready: ${health.scweet_ready}`)
      console.log(`   Twikit Ready: ${health.twikit_ready}`)
      console.log(`   Timestamp: ${health.timestamp}`)
    } else {
      console.log('⚠️ Service health check failed')
    }
    
    // Test individual service endpoints
    console.log('\n4️⃣ Testing individual service endpoints...')
    
    // Test Scweet endpoint
    try {
      const scweetResponse = await fetch(`${scweetUrl}/tweet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tweet_url: testTweets[0],
          include_engagement: true,
          include_user_info: true
        }),
        timeout: 10000
      })
      
      if (scweetResponse.ok) {
        console.log('✅ Official Scweet endpoint working')
      } else {
        console.log(`⚠️ Official Scweet endpoint returned ${scweetResponse.status}`)
      }
    } catch (error) {
      console.log(`⚠️ Official Scweet endpoint error: ${error.message}`)
    }
    
    // Test Twikit endpoint
    try {
      const twikitResponse = await fetch(`${scweetUrl}/twikit/tweet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tweet_url: testTweets[0],
          include_engagement: true,
          include_user_info: true
        }),
        timeout: 10000
      })
      
      if (twikitResponse.ok) {
        console.log('✅ Twikit endpoint working')
      } else {
        console.log(`⚠️ Twikit endpoint returned ${twikitResponse.status}`)
      }
    } catch (error) {
      console.log(`⚠️ Twikit endpoint error: ${error.message}`)
    }
    
  } catch (error) {
    console.log(`❌ Service health test failed: ${error.message}`)
  }

  console.log('\n📈 Final Enhanced Fallback Status:')
  console.log(fallbackService.getStatus())
}

// Main execution
async function main() {
  console.log('🚀 LayerEdge Enhanced Fallback System Test Suite')
  console.log('🔗 Official Scweet v3.0+ + Twikit Integration')
  console.log('=' .repeat(70))
  
  await testEnhancedFallbackChain()
  
  console.log('🏁 Enhanced fallback test suite completed!')
  console.log('')
  console.log('📋 Fallback Chain Summary:')
  console.log('   1️⃣ Official Scweet v3.0+ (PRIMARY) - Unlimited, reliable')
  console.log('   2️⃣ Twikit (SECONDARY) - Enhanced fallback capability')
  console.log('   3️⃣ Twitter API (TERTIARY) - Rate limited but official')
  console.log('   4️⃣ Basic Web Scraping (FINAL) - Last resort method')
  console.log('')
  console.log('🎯 This enhanced system provides maximum resilience and reliability!')
}

// Handle command line execution
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Enhanced fallback test suite failed:', error)
    process.exit(1)
  })
}

module.exports = {
  testEnhancedFallbackChain
}
