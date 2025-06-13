import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
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
      prisma.user.count(),
      
      // Total tweets tracked
      prisma.tweet.count(),
      
      // Total points awarded across all users
      prisma.user.aggregate({
        _sum: {
          totalPoints: true
        }
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

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' // Cache for 5 minutes
      }
    })
  } catch (error) {
    console.error('Error fetching platform stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platform statistics' },
      { status: 500 }
    )
  }
}
