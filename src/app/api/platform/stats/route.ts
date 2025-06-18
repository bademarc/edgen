import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 STATS API: Starting platform statistics fetch...')
    console.log('🔍 STATS API: Environment check - NODE_ENV:', process.env.NODE_ENV)
    console.log('🔍 STATS API: Database URL exists:', !!process.env.DATABASE_URL)
    console.log('🔍 STATS API: Direct URL exists:', !!process.env.DIRECT_URL)

    // PRODUCTION FIX: Test database connection first
    try {
      const connectionTest = await prisma.$queryRaw`SELECT 1 as test, NOW() as current_time`
      console.log('✅ STATS API: Database connection successful:', connectionTest)
    } catch (dbError) {
      console.error('❌ STATS API: Database connection failed:', dbError)
      console.error('❌ STATS API: DATABASE_URL format:', process.env.DATABASE_URL?.substring(0, 20) + '...')
      throw new Error(`Database connection failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`)
    }

    console.log('📊 STATS API: Fetching platform statistics...')

    // Get platform statistics
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
        console.log(`📊 STATS API: Total users: ${count}`)
        return count
      }),

      // Total tweets tracked
      prisma.tweet.count().then(count => {
        console.log(`📊 STATS API: Total tweets: ${count}`)
        return count
      }),

      // Total points awarded across all users
      prisma.user.aggregate({
        _sum: {
          totalPoints: true
        }
      }).then(result => {
        console.log(`📊 STATS API: Total points: ${result._sum.totalPoints}`)
        return result
      }),
      
      // Tweets containing @layeredge or $EDGEN mentions
      prisma.tweet.count({
        where: {
          OR: [
            {
              content: {
                contains: '@layeredge',
                mode: 'insensitive'
              }
            },
            {
              content: {
                contains: '$EDGEN',
                mode: 'insensitive'
              }
            }
          ]
        }
      }),
      
      // Active users (users with at least one tweet)
      prisma.user.count({
        where: {
          tweets: {
            some: {}
          }
        }
      }),
      
      // Recent tweets (last 24 hours)
      prisma.tweet.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
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

    console.log('✅ STATS API: Final statistics:', stats)

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' // PRODUCTION FIX: Reduced cache for debugging
      }
    })
  } catch (error) {
    console.error('❌ STATS API: Error fetching platform stats:', error)
    console.error('❌ STATS API: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })

    // PRODUCTION FIX: Return fallback data instead of error
    const fallbackStats = {
      totalUsers: 0,
      totalTweets: 0,
      totalPoints: 0,
      tweetsWithMentions: 0,
      activeUsers: 0,
      recentTweets: 0,
      averagePointsPerUser: 0,
      engagementRate: 0,
      lastUpdated: new Date().toISOString(),
      error: 'Database connection issue - showing fallback data'
    }

    return NextResponse.json(fallbackStats, {
      status: 200, // Return 200 to prevent frontend errors
      headers: {
        'Cache-Control': 'no-cache' // Don't cache error responses
      }
    })
  }
}
