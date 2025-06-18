import dotenv from 'dotenv'
import { getCacheService } from '../src/lib/cache.ts'

// Load environment variables
dotenv.config()

async function testCacheService() {
  console.log('🔍 Testing cache service functionality...')
  
  const cache = getCacheService()
  
  try {
    // Test 1: Basic cache set/get
    console.log('1️⃣ Testing basic cache set/get...')
    const testKey = 'test:cache:basic'
    const testValue = { message: 'Hello Cache', timestamp: Date.now() }
    
    await cache.set(testKey, testValue, 60) // 60 seconds TTL
    const retrieved = await cache.get(testKey)
    
    if (retrieved && retrieved.message === testValue.message) {
      console.log('✅ Basic cache set/get successful')
    } else {
      console.log('❌ Basic cache set/get failed')
      console.log('Expected:', testValue)
      console.log('Retrieved:', retrieved)
    }

    // Test 2: Check leaderboard cache
    console.log('2️⃣ Testing leaderboard cache...')
    const leaderboardKey = 'leaderboard:100'
    const cachedLeaderboard = await cache.get(leaderboardKey)
    
    if (cachedLeaderboard) {
      console.log(`✅ Leaderboard cache found: ${Array.isArray(cachedLeaderboard) ? cachedLeaderboard.length : 'invalid'} entries`)
      if (Array.isArray(cachedLeaderboard) && cachedLeaderboard.length > 0) {
        console.log(`   Top user: ${cachedLeaderboard[0].name || cachedLeaderboard[0].xUsername} - ${cachedLeaderboard[0].totalPoints} points`)
      }
    } else {
      console.log('❌ No leaderboard cache found')
    }

    // Test 3: Check analytics cache
    console.log('3️⃣ Testing analytics cache...')
    const analyticsKey = 'analytics:daily'
    const cachedAnalytics = await cache.get(analyticsKey)
    
    if (cachedAnalytics) {
      console.log('✅ Analytics cache found')
      console.log(`   Total users: ${cachedAnalytics.totalUsers}`)
      console.log(`   Total tweets: ${cachedAnalytics.totalTweets}`)
      console.log(`   Total points: ${cachedAnalytics.totalPoints}`)
    } else {
      console.log('❌ No analytics cache found')
    }

    // Test 4: Test cache deletion
    console.log('4️⃣ Testing cache deletion...')
    await cache.del(testKey)
    const deletedValue = await cache.get(testKey)
    
    if (deletedValue === null) {
      console.log('✅ Cache deletion successful')
    } else {
      console.log('❌ Cache deletion failed')
    }

    // Test 5: Check cache health
    console.log('5️⃣ Testing cache health...')
    const isHealthy = await cache.healthCheck()
    
    if (isHealthy) {
      console.log('✅ Cache service is healthy')
    } else {
      console.log('❌ Cache service health check failed')
    }

    // Test 6: Clear problematic cache entries
    console.log('6️⃣ Clearing potentially problematic cache entries...')
    const keysToCheck = [
      'leaderboard:10',
      'leaderboard:50', 
      'leaderboard:100',
      'analytics:daily',
      'basic_stats'
    ]
    
    for (const key of keysToCheck) {
      const value = await cache.get(key)
      if (value) {
        console.log(`   Found cached: ${key}`)
        if (Array.isArray(value) && value.length === 0) {
          console.log(`   ⚠️ Empty array found for ${key}, clearing...`)
          await cache.del(key)
        }
      }
    }

    console.log('\n🎉 Cache service tests completed!')
    
    return {
      success: true,
      hasLeaderboardCache: !!cachedLeaderboard,
      hasAnalyticsCache: !!cachedAnalytics,
      isHealthy
    }

  } catch (error) {
    console.error('❌ Cache service test failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Run the test
testCacheService()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Cache service test completed successfully')
      process.exit(0)
    } else {
      console.log('\n❌ Cache service test failed')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error)
    process.exit(1)
  })
