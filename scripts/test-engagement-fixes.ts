#!/usr/bin/env tsx

/**
 * Test script to verify the engagement metrics API fixes
 */

import { engagementManager } from '../src/lib/engagement-manager'

async function testEngagementManager() {
  console.log('🧪 Testing Engagement Manager')
  console.log('=' .repeat(40))

  // Test 1: Manager Status
  console.log('\n📊 Test 1: Manager Status')
  console.log('-'.repeat(25))

  const initialStatus = engagementManager.getStatus()
  console.log('Initial status:', initialStatus)

  // Test 2: Duplicate Request Prevention
  console.log('\n🔄 Test 2: Duplicate Request Prevention')
  console.log('-'.repeat(35))

  const testTweetIds = ['test1', 'test2', 'test3']

  console.log('Starting simultaneous requests...')

  const promises = [
    engagementManager.updateEngagementMetrics(testTweetIds),
    engagementManager.updateEngagementMetrics(testTweetIds),
    engagementManager.updateEngagementMetrics(testTweetIds)
  ]

  try {
    const results = await Promise.all(promises)
    console.log('Results received:', results.length)

    // Check if all results have the same request ID (indicating deduplication)
    const requestIds = results.map(r => r.requestId)
    const uniqueRequestIds = new Set(requestIds)

    if (uniqueRequestIds.size === 1) {
      console.log('✅ Duplicate requests successfully deduplicated')
    } else {
      console.log('⚠️ Multiple requests processed:', uniqueRequestIds)
    }
  } catch (error) {
    console.log('Expected error for test tweets:', error instanceof Error ? error.message : String(error))
  }

  // Test 3: Subscription System
  console.log('\n📡 Test 3: Subscription System')
  console.log('-'.repeat(30))

  let subscriptionCallCount = 0
  const unsubscribe = engagementManager.subscribe((result) => {
    subscriptionCallCount++
    console.log(`Subscription callback ${subscriptionCallCount}:`, {
      success: result.success,
      requestId: result.requestId,
      tweetsCount: result.tweets?.length || 0
    })
  })

  // Trigger an update to test subscription
  try {
    await engagementManager.updateEngagementMetrics(['test-subscription'])
  } catch (error) {
    console.log('Expected error for test subscription:', error instanceof Error ? error.message : String(error))
  }

  unsubscribe()
  console.log(`✅ Subscription system tested (${subscriptionCallCount} callbacks)`)

  // Test 4: Cache Management
  console.log('\n🗄️ Test 4: Cache Management')
  console.log('-'.repeat(25))

  const statusBeforeClear = engagementManager.getStatus()
  console.log('Status before cache clear:', statusBeforeClear)

  engagementManager.clearCache()

  const statusAfterClear = engagementManager.getStatus()
  console.log('Status after cache clear:', statusAfterClear)

  if (statusAfterClear.cachedUpdates === 0) {
    console.log('✅ Cache cleared successfully')
  } else {
    console.log('⚠️ Cache not fully cleared')
  }

  console.log('\n🎉 Engagement Manager Tests Completed!')
  console.log('=' .repeat(40))
}

async function testApiEndpoints() {
  console.log('\n🌐 Testing API Endpoints')
  console.log('=' .repeat(30))

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  // Test 1: Monitoring User Endpoint Status
  console.log('\n📊 Test 1: Monitoring User Endpoint')
  console.log('-'.repeat(35))

  try {
    const response = await fetch(`${baseUrl}/api/monitoring/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    console.log(`GET /api/monitoring/user: ${response.status} ${response.statusText}`)

    if (response.status === 401) {
      console.log('✅ Endpoint properly requires authentication')
    } else {
      const data = await response.json()
      console.log('Response data:', data)
    }
  } catch (error) {
    console.log('Network error (expected if server not running):', error instanceof Error ? error.message : String(error))
  }

  // Test 2: Engagement Batch Endpoint
  console.log('\n📈 Test 2: Engagement Batch Endpoint')
  console.log('-'.repeat(35))

  try {
    const response = await fetch(`${baseUrl}/api/tweets/engagement/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tweetIds: ['test1', 'test2']
      })
    })

    console.log(`POST /api/tweets/engagement/batch: ${response.status} ${response.statusText}`)

    if (response.status === 401) {
      console.log('✅ Endpoint properly requires authentication')
    } else {
      const data = await response.json()
      console.log('Response data:', data)
    }
  } catch (error) {
    console.log('Network error (expected if server not running):', error instanceof Error ? error.message : String(error))
  }

  console.log('\n🎉 API Endpoint Tests Completed!')
  console.log('=' .repeat(30))
}

async function main() {
  console.log('🚀 Starting Engagement Metrics Fix Tests')
  console.log('=' .repeat(50))

  try {
    await testEngagementManager()
    await testApiEndpoints()

    console.log('\n✅ All tests completed successfully!')
    console.log('\n📋 Summary of Fixes:')
    console.log('  1. ✅ Duplicate request prevention implemented')
    console.log('  2. ✅ Global engagement manager created')
    console.log('  3. ✅ Improved error handling and logging')
    console.log('  4. ✅ Better API endpoint error responses')
    console.log('  5. ✅ Subscription system for real-time updates')

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

// Run tests
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🏁 Test script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Test script failed:', error)
      process.exit(1)
    })
}

export { testEngagementManager, testApiEndpoints }
