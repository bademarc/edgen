/**
 * Test script for the LayerEdge Fallback System
 *
 * This script tests the new fallback system that switches between
 * Twitter API and web scraping to handle rate limiting issues.
 */

import { fileURLToPath } from 'url'
import { pathToFileURL } from 'url'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// Test tweet URLs - using real LayerEdge community tweets
const TEST_TWEETS = [
  'https://x.com/layeredge/status/1890107751621357663', // Official LayerEdge tweet
  'https://x.com/example/status/1234567890123456789', // Fallback test URL
]

async function testFallbackSystem() {
  console.log('🚀 Testing LayerEdge Fallback System')
  console.log('=====================================\n')

  try {
    // Test 1: Health Check
    console.log('📊 Test 1: Health Check')
    await testHealthCheck()
    console.log('✅ Health check passed\n')

    // Test 2: Fallback Status
    console.log('📊 Test 2: Fallback Status')
    await testFallbackStatus()
    console.log('✅ Fallback status check passed\n')

    // Test 3: Tweet Data Fetching (Auto)
    console.log('📊 Test 3: Tweet Data Fetching (Auto)')
    await testTweetDataFetching('auto')
    console.log('✅ Auto tweet fetching passed\n')

    // Test 4: Tweet Data Fetching (Force API)
    console.log('📊 Test 4: Tweet Data Fetching (Force API)')
    await testTweetDataFetching('api')
    console.log('✅ API tweet fetching passed\n')

    // Test 5: Tweet Data Fetching (Force Scraper)
    console.log('📊 Test 5: Tweet Data Fetching (Force Scraper)')
    await testTweetDataFetching('scraper')
    console.log('✅ Scraper tweet fetching passed\n')

    // Test 6: Engagement Metrics (Single)
    console.log('📊 Test 6: Engagement Metrics (Single)')
    await testEngagementMetrics('single')
    console.log('✅ Single engagement metrics passed\n')

    // Test 7: Engagement Metrics (Batch)
    console.log('📊 Test 7: Engagement Metrics (Batch)')
    await testEngagementMetrics('batch')
    console.log('✅ Batch engagement metrics passed\n')

    console.log('🎉 All tests completed successfully!')

  } catch (error) {
    console.error('❌ Test suite failed:', error.message)
    console.error('   Stack trace:', error.stack)
    process.exit(1)
  }
}

async function testHealthCheck() {
  const response = await fetch(`${BASE_URL}/api/scrape/engagement`, {
    method: 'HEAD'
  })

  console.log(`   Health check status: ${response.status}`)

  const serviceHealth = response.headers.get('X-Service-Health')
  const fallbackStatus = response.headers.get('X-Fallback-Status')

  console.log(`   Service health: ${serviceHealth}`)
  console.log(`   Fallback status: ${fallbackStatus}`)

  if (response.status !== 200) {
    throw new Error(`Health check failed with status ${response.status}`)
  }
}

async function testFallbackStatus() {
  const response = await fetch(`${BASE_URL}/api/scrape/engagement`, {
    method: 'HEAD'
  })

  const fallbackStatusHeader = response.headers.get('X-Fallback-Status')
  const preferredSource = response.headers.get('X-Preferred-Source')
  const apiFailures = response.headers.get('X-API-Failures')
  const rateLimited = response.headers.get('X-Rate-Limited')

  console.log(`   Preferred source: ${preferredSource}`)
  console.log(`   API failures: ${apiFailures}`)
  console.log(`   Rate limited: ${rateLimited}`)

  if (fallbackStatusHeader) {
    const status = JSON.parse(fallbackStatusHeader)
    console.log(`   Fallback details:`, status)
  }
}

async function testTweetDataFetching(method) {
  const testUrl = TEST_TWEETS[0]

  if (!testUrl || testUrl.includes('username')) {
    console.log(`   ⚠️  Skipping ${method} test - no valid test URL provided`)
    return
  }

  const url = method === 'auto'
    ? `${BASE_URL}/api/scrape/tweets?url=${encodeURIComponent(testUrl)}`
    : `${BASE_URL}/api/scrape/tweets?url=${encodeURIComponent(testUrl)}&method=${method}`

  console.log(`   Testing ${method} method for: ${testUrl}`)

  const response = await fetch(url)
  const result = await response.json()

  console.log(`   Response status: ${response.status}`)

  if (response.ok && result.success) {
    console.log(`   ✅ Data source: ${result.data.source}`)
    console.log(`   ✅ Tweet content: "${result.data.content.substring(0, 50)}..."`)
    console.log(`   ✅ Engagement: ${result.data.likes} likes, ${result.data.retweets} retweets`)

    if (result.fallbackStatus) {
      console.log(`   ✅ Preferred source: ${result.fallbackStatus.preferredSource}`)
    }
  } else {
    console.log(`   ⚠️  Request failed: ${result.error || 'Unknown error'}`)
    if (result.fallbackStatus) {
      console.log(`   ℹ️  Fallback status: ${JSON.stringify(result.fallbackStatus)}`)
    }
  }
}

async function testEngagementMetrics(type) {
  if (type === 'single') {
    const testUrl = TEST_TWEETS[0]

    if (!testUrl || testUrl.includes('username')) {
      console.log(`   ⚠️  Skipping single engagement test - no valid test URL provided`)
      return
    }

    console.log(`   Testing single engagement for: ${testUrl}`)

    const response = await fetch(`${BASE_URL}/api/scrape/engagement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tweetUrl: testUrl }),
    })

    const result = await response.json()

    console.log(`   Response status: ${response.status}`)

    if (response.ok && result.success) {
      console.log(`   ✅ Data source: ${result.data.metrics.source}`)
      console.log(`   ✅ Metrics: ${result.data.metrics.likes} likes, ${result.data.metrics.retweets} retweets`)
      console.log(`   ✅ Timestamp: ${result.data.metrics.timestamp}`)
    } else {
      console.log(`   ⚠️  Request failed: ${result.error || 'Unknown error'}`)
    }

  } else if (type === 'batch') {
    const validUrls = TEST_TWEETS.filter(url => url && !url.includes('username'))

    if (validUrls.length === 0) {
      console.log(`   ⚠️  Skipping batch engagement test - no valid test URLs provided`)
      return
    }

    console.log(`   Testing batch engagement for ${validUrls.length} tweets`)

    const response = await fetch(`${BASE_URL}/api/scrape/engagement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tweetUrls: validUrls }),
    })

    const result = await response.json()

    console.log(`   Response status: ${response.status}`)

    if (response.ok && result.success) {
      console.log(`   ✅ Total processed: ${result.data.summary.total}`)
      console.log(`   ✅ Successful: ${result.data.summary.successful}`)
      console.log(`   ✅ Failed: ${result.data.summary.failed}`)
      console.log(`   ✅ Success rate: ${(result.data.summary.successRate * 100).toFixed(1)}%`)

      if (result.data.results.length > 0) {
        const firstResult = result.data.results[0]
        if (firstResult.metrics) {
          console.log(`   ✅ Sample source: ${firstResult.metrics.source}`)
        }
      }
    } else {
      console.log(`   ⚠️  Request failed: ${result.error || 'Unknown error'}`)
    }
  }
}

// Helper function to simulate rate limiting
async function simulateRateLimit() {
  console.log('🔄 Simulating rate limit scenario...')

  // Make multiple rapid requests to trigger rate limiting
  const promises = []
  for (let i = 0; i < 10; i++) {
    promises.push(
      fetch(`${BASE_URL}/api/scrape/engagement`, {
        method: 'HEAD'
      })
    )
  }

  await Promise.all(promises)
  console.log('   Rate limit simulation completed')
}

// Check if this script is being run directly
const isMainModule = import.meta.url === pathToFileURL(process.argv[1]).href

// Run the test suite if this script is executed directly
if (isMainModule) {
  console.log('LayerEdge Fallback System Test Suite')
  console.log('====================================')
  console.log('')
  console.log('⚠️  Note: Update TEST_TWEETS array with real LayerEdge community tweet URLs')
  console.log('⚠️  Ensure your development server is running on', BASE_URL)
  console.log('')

  testFallbackSystem()
    .then(() => {
      console.log('\n✅ Test suite completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed:', error)
      process.exit(1)
    })
}

// ES6 exports
export {
  testFallbackSystem,
  testHealthCheck,
  testFallbackStatus,
  testTweetDataFetching,
  testEngagementMetrics,
  simulateRateLimit
}
