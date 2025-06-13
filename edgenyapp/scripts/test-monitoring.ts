import { TwitterMonitoringService } from '../src/lib/twitter-monitoring'
import { prisma } from '../src/lib/db'

async function testMonitoring() {
  console.log('🚀 Testing Twitter Monitoring System...\n')

  try {
    // Get a test user
    const testUser = await prisma.user.findFirst({
      where: {
        xUsername: {
          not: null
        }
      },
      select: {
        id: true,
        xUsername: true,
        name: true,
        autoMonitoringEnabled: true
      }
    })

    if (!testUser) {
      console.log('❌ No users found with Twitter usernames')
      return
    }

    console.log(`📱 Testing monitoring for user: ${testUser.name} (@${testUser.xUsername})`)
    console.log(`🔧 Auto monitoring enabled: ${testUser.autoMonitoringEnabled}\n`)

    const monitoringService = new TwitterMonitoringService()

    // Test individual user monitoring
    console.log('🔍 Running individual user monitoring...')
    const userResult = await monitoringService.monitorUserTweets(testUser.id)

    console.log('📊 Individual monitoring result:', {
      success: userResult.success,
      tweetsFound: userResult.tweetsFound,
      error: userResult.error
    })

    // Get monitoring status
    const monitoring = await prisma.tweetMonitoring.findUnique({
      where: { userId: testUser.id }
    })

    console.log('\n📈 Monitoring status:', {
      status: monitoring?.status,
      lastCheckAt: monitoring?.lastCheckAt,
      tweetsFound: monitoring?.tweetsFound,
      errorMessage: monitoring?.errorMessage
    })

    // Get user's tweets
    const userTweets = await prisma.tweet.findMany({
      where: { userId: testUser.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        url: true,
        content: true,
        totalPoints: true,
        isAutoDiscovered: true,
        discoveredAt: true,
        createdAt: true
      }
    })

    console.log(`\n🐦 User's recent tweets (${userTweets.length}):`)
    userTweets.forEach((tweet, index) => {
      console.log(`  ${index + 1}. ${tweet.isAutoDiscovered ? '🤖 Auto' : '👤 Manual'} - ${tweet.totalPoints} pts`)
      console.log(`     ${tweet.content?.substring(0, 80)}...`)
      console.log(`     ${tweet.url}`)
      console.log('')
    })

    // Test batch monitoring (limited to avoid rate limits)
    console.log('🔄 Testing batch monitoring (limited)...')
    
    // Get a few users for batch test
    const batchUsers = await prisma.user.findMany({
      where: {
        autoMonitoringEnabled: true,
        xUsername: { not: null }
      },
      take: 3,
      select: { id: true, xUsername: true }
    })

    console.log(`📦 Found ${batchUsers.length} users for batch test`)

    if (batchUsers.length > 0) {
      // Create a limited monitoring service for testing
      const limitedService = new TwitterMonitoringService()
      
      // Monitor just the first user to avoid rate limits
      const batchResult = await limitedService.monitorUserTweets(batchUsers[0].id)
      
      console.log('📊 Batch test result:', {
        success: batchResult.success,
        tweetsFound: batchResult.tweetsFound,
        error: batchResult.error
      })
    }

    // Get overall statistics
    const stats = await prisma.tweetMonitoring.groupBy({
      by: ['status'],
      _count: { userId: true },
      _sum: { tweetsFound: true }
    })

    const autoDiscoveredCount = await prisma.tweet.count({
      where: { isAutoDiscovered: true }
    })

    console.log('\n📊 Overall Statistics:')
    console.log(`  🤖 Auto-discovered tweets: ${autoDiscoveredCount}`)
    console.log('  📈 Monitoring status breakdown:')
    stats.forEach(stat => {
      console.log(`    ${stat.status}: ${stat._count.userId} users, ${stat._sum.tweetsFound || 0} tweets found`)
    })

    console.log('\n✅ Monitoring test completed successfully!')

  } catch (error) {
    console.error('❌ Error during monitoring test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testMonitoring().catch(console.error)
