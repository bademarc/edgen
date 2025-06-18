import dotenv from 'dotenv'
import { getFreeTierService } from '../src/lib/free-tier-service.ts'
import { getBudgetDbService } from '../src/lib/db-budget.ts'

// Load environment variables
dotenv.config()

async function testLeaderboardAPI() {
  console.log('🔍 Testing leaderboard API logic...')
  
  try {
    // Test 1: Check environment configuration
    console.log('1️⃣ Checking environment configuration...')
    const isFreeTier = process.env.OPTIMIZE_FOR_FREE_TIER === 'true'
    console.log(`   OPTIMIZE_FOR_FREE_TIER: ${isFreeTier}`)
    console.log(`   ENABLE_CACHE: ${process.env.ENABLE_CACHE}`)
    console.log(`   ENABLE_AGGRESSIVE_CACHING: ${process.env.ENABLE_AGGRESSIVE_CACHING}`)

    // Test 2: Test budget database service directly
    console.log('2️⃣ Testing budget database service directly...')
    const budgetDb = getBudgetDbService()
    const directLeaderboard = await budgetDb.getLeaderboard(10, false) // Don't update ranks
    console.log(`✅ Direct budget DB leaderboard: ${directLeaderboard.length} users`)
    
    if (directLeaderboard.length > 0) {
      console.log(`   Top user: ${directLeaderboard[0].name || directLeaderboard[0].xUsername} - ${directLeaderboard[0].totalPoints} points`)
    }

    // Test 3: Test free tier service
    console.log('3️⃣ Testing free tier service...')
    const freeTierService = getFreeTierService()
    const freeTierLeaderboard = await freeTierService.getLeaderboard(10)
    console.log(`✅ Free tier leaderboard: ${freeTierLeaderboard.length} users`)
    
    if (freeTierLeaderboard.length > 0) {
      console.log(`   Top user: ${freeTierLeaderboard[0].name || freeTierLeaderboard[0].xUsername} - ${freeTierLeaderboard[0].totalPoints} points`)
    }

    // Test 4: Test with cache bypass
    console.log('4️⃣ Testing budget DB with cache bypass...')
    const noCacheLeaderboard = await budgetDb.getLeaderboard(10, true) // Force fresh data
    console.log(`✅ No-cache leaderboard: ${noCacheLeaderboard.length} users`)

    // Test 5: Test analytics
    console.log('5️⃣ Testing analytics...')
    const analytics = await budgetDb.getAnalytics()
    console.log(`✅ Analytics:`)
    console.log(`   Total users: ${analytics.totalUsers}`)
    console.log(`   Total tweets: ${analytics.totalTweets}`)
    console.log(`   Total points: ${analytics.totalPoints}`)

    // Test 6: Clear cache and retry
    console.log('6️⃣ Clearing cache and retrying...')
    await freeTierService.deleteCacheEntry('leaderboard:10')
    await freeTierService.deleteCacheEntry('leaderboard:100')
    
    const freshLeaderboard = await freeTierService.getLeaderboard(10)
    console.log(`✅ Fresh leaderboard after cache clear: ${freshLeaderboard.length} users`)

    console.log('\n🎉 Leaderboard API tests completed!')
    
    return {
      success: true,
      isFreeTier,
      directCount: directLeaderboard.length,
      freeTierCount: freeTierLeaderboard.length,
      noCacheCount: noCacheLeaderboard.length,
      freshCount: freshLeaderboard.length,
      analytics
    }

  } catch (error) {
    console.error('❌ Leaderboard API test failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Run the test
testLeaderboardAPI()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Leaderboard API test completed successfully')
      console.log('📊 Summary:')
      console.log(`   Free tier mode: ${result.isFreeTier}`)
      console.log(`   Direct DB: ${result.directCount} users`)
      console.log(`   Free tier service: ${result.freeTierCount} users`)
      console.log(`   No cache: ${result.noCacheCount} users`)
      console.log(`   Fresh data: ${result.freshCount} users`)
      process.exit(0)
    } else {
      console.log('\n❌ Leaderboard API test failed')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error)
    process.exit(1)
  })
