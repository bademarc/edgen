#!/usr/bin/env node

/**
 * Test script to verify rate limiting fixes
 * This script tests the fallback service with rate limit protection
 */

const { getFallbackService } = require('../src/lib/fallback-service')
const { getSimplifiedFallbackService } = require('../src/lib/simplified-fallback-service')

async function testRateLimitFixes() {
  console.log('🧪 Testing Rate Limit Fixes')
  console.log('=' .repeat(50))

  // Test URLs
  const testTweetUrls = [
    'https://x.com/elonmusk/status/1234567890123456789', // Example URL
    'https://twitter.com/jack/status/1234567890123456789', // Example URL
  ]

  console.log('\n📋 Test Configuration:')
  console.log(`- TWITTER_API_DISABLED: ${process.env.TWITTER_API_DISABLED}`)
  console.log(`- FORCE_OEMBED_ONLY: ${process.env.FORCE_OEMBED_ONLY}`)
  console.log(`- PREFER_API: ${process.env.PREFER_API}`)

  // Test 1: Fallback Service with oEmbed Priority
  console.log('\n🔬 Test 1: Fallback Service (oEmbed Priority)')
  console.log('-'.repeat(40))

  try {
    const fallbackService = getFallbackService({
      preferApi: false, // Force oEmbed priority
      apiTimeoutMs: 10000
    })

    console.log('📊 Service Status:', fallbackService.getStatus())

    for (const tweetUrl of testTweetUrls) {
      console.log(`\n🔍 Testing URL: ${tweetUrl}`)
      
      try {
        const startTime = Date.now()
        const tweetData = await fallbackService.getTweetData(tweetUrl)
        const duration = Date.now() - startTime

        if (tweetData) {
          console.log(`✅ Success in ${duration}ms`)
          console.log(`   - Source: ${tweetData.source}`)
          console.log(`   - Content: ${tweetData.content?.substring(0, 100)}...`)
          console.log(`   - Author: ${tweetData.author?.username}`)
        } else {
          console.log(`❌ Failed to fetch tweet data`)
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`)
      }
    }
  } catch (error) {
    console.error('❌ Fallback Service Test Failed:', error.message)
  }

  // Test 2: Simplified Fallback Service
  console.log('\n🔬 Test 2: Simplified Fallback Service')
  console.log('-'.repeat(40))

  try {
    const simplifiedService = getSimplifiedFallbackService({
      preferApi: false, // Force oEmbed priority
      apiTimeoutMs: 10000
    })

    console.log('📊 Service Status:', simplifiedService.getStatus())

    for (const tweetUrl of testTweetUrls) {
      console.log(`\n🔍 Testing URL: ${tweetUrl}`)
      
      try {
        const startTime = Date.now()
        const tweetData = await simplifiedService.getTweetData(tweetUrl)
        const duration = Date.now() - startTime

        if (tweetData) {
          console.log(`✅ Success in ${duration}ms`)
          console.log(`   - Source: ${tweetData.source}`)
          console.log(`   - Content: ${tweetData.content?.substring(0, 100)}...`)
          console.log(`   - Author: ${tweetData.author?.username}`)
        } else {
          console.log(`❌ Failed to fetch tweet data`)
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`)
      }
    }
  } catch (error) {
    console.error('❌ Simplified Service Test Failed:', error.message)
  }

  // Test 3: Rate Limit Simulation
  console.log('\n🔬 Test 3: Rate Limit Simulation')
  console.log('-'.repeat(40))

  try {
    const rateLimitService = getFallbackService({
      preferApi: true, // Force API usage to test rate limiting
      apiTimeoutMs: 5000
    })

    console.log('🚨 Simulating API rate limit scenario...')
    
    // Simulate multiple rapid requests to trigger rate limiting
    const rapidRequests = testTweetUrls.slice(0, 1) // Use just one URL for rapid testing
    
    for (let i = 0; i < 3; i++) {
      console.log(`\n🔄 Rapid Request ${i + 1}/3`)
      
      try {
        const startTime = Date.now()
        const tweetData = await rateLimitService.getTweetData(rapidRequests[0])
        const duration = Date.now() - startTime

        if (tweetData) {
          console.log(`✅ Success in ${duration}ms (Source: ${tweetData.source})`)
        } else {
          console.log(`❌ Failed`)
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`)
        
        // Check if it's a rate limit error
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          console.log('🎯 Rate limit detected - this is expected behavior')
          break
        }
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n📊 Final Service Status:', rateLimitService.getStatus())
  } catch (error) {
    console.error('❌ Rate Limit Test Failed:', error.message)
  }

  console.log('\n🏁 Rate Limit Fix Tests Completed')
  console.log('=' .repeat(50))
}

// Run the tests
if (require.main === module) {
  testRateLimitFixes().catch(console.error)
}

module.exports = { testRateLimitFixes }
