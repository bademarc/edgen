import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Load environment variables
dotenv.config()

async function testPlatformStats() {
  console.log('🔍 Testing platform stats API logic...')
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: ['error'],
  })

  try {
    console.log('📊 Calculating platform statistics...')

    // Replicate the logic from src/app/api/platform/stats/route.ts
    const [
      totalUsers,
      totalTweets,
      totalPoints,
      tweetsWithMentions,
      activeUsers,
      recentTweets
    ] = await Promise.all([
      // Total registered users
      prisma.user.count().then(count => {
        console.log(`📊 Total users: ${count}`)
        return count
      }),

      // Total tweets tracked
      prisma.tweet.count().then(count => {
        console.log(`📊 Total tweets: ${count}`)
        return count
      }),

      // Total points awarded across all users
      prisma.user.aggregate({
        _sum: {
          totalPoints: true
        }
      }).then(result => {
        console.log(`📊 Total points: ${result._sum.totalPoints}`)
        return result
      }),

      // Tweets with mentions (assuming tweets with content containing mentions)
      prisma.tweet.count({
        where: {
          OR: [
            { content: { contains: '@' } },
            { content: { contains: 'layeredge' } },
            { content: { contains: 'edgen' } }
          ]
        }
      }).then(count => {
        console.log(`📊 Tweets with mentions: ${count}`)
        return count
      }),

      // Active users (users with at least one tweet)
      prisma.user.count({
        where: {
          tweets: {
            some: {}
          }
        }
      }).then(count => {
        console.log(`📊 Active users: ${count}`)
        return count
      }),

      // Recent tweets (last 24 hours)
      prisma.tweet.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }).then(count => {
        console.log(`📊 Recent tweets (24h): ${count}`)
        return count
      })
    ])

    // Calculate additional metrics
    const averagePointsPerUser = totalUsers > 0 ? Math.round((totalPoints._sum.totalPoints || 0) / totalUsers) : 0
    const engagementRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

    const stats = {
      totalUsers,
      totalTweets,
      totalPoints: totalPoints._sum.totalPoints || 0,
      tweetsWithMentions,
      activeUsers,
      recentTweets,
      averagePointsPerUser,
      engagementRate,
      lastUpdated: new Date().toISOString()
    }

    console.log('\n✅ Platform statistics calculated successfully:')
    console.log(`   Total Users: ${stats.totalUsers}`)
    console.log(`   Total Tweets: ${stats.totalTweets}`)
    console.log(`   Total Points: ${stats.totalPoints}`)
    console.log(`   Tweets with Mentions: ${stats.tweetsWithMentions}`)
    console.log(`   Active Users: ${stats.activeUsers}`)
    console.log(`   Recent Tweets (24h): ${stats.recentTweets}`)
    console.log(`   Average Points per User: ${stats.averagePointsPerUser}`)
    console.log(`   Engagement Rate: ${stats.engagementRate}%`)

    // Verify that all metrics are non-zero (except possibly recent tweets)
    const issues = []
    if (stats.totalUsers === 0) issues.push('Total users is 0')
    if (stats.totalTweets === 0) issues.push('Total tweets is 0')
    if (stats.totalPoints === 0) issues.push('Total points is 0')
    if (stats.activeUsers === 0) issues.push('Active users is 0')

    if (issues.length > 0) {
      console.log('\n⚠️ Issues found:')
      issues.forEach(issue => console.log(`   - ${issue}`))
    } else {
      console.log('\n🎉 All metrics look healthy!')
    }

    return {
      success: true,
      stats,
      issues
    }

  } catch (error) {
    console.error('❌ Platform stats test failed:', error)
    return {
      success: false,
      error: error.message
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testPlatformStats()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Platform stats test completed successfully')
      if (result.issues && result.issues.length > 0) {
        console.log(`⚠️ Found ${result.issues.length} issues that need attention`)
        process.exit(1)
      } else {
        console.log('🎉 All platform metrics are working correctly!')
        process.exit(0)
      }
    } else {
      console.log('\n❌ Platform stats test failed')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error)
    process.exit(1)
  })
