import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'

interface ActivityItem {
  id: string
  type: 'tweet_submitted' | 'points_earned' | 'rank_changed' | 'joined'
  title: string
  description: string
  timestamp: Date
  points?: number
  metadata?: any
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // If no userId provided, try to get from auth
    let targetUserId = userId
    if (!targetUserId) {
      targetUserId = await getAuthenticatedUserId(request)
      if (!targetUserId) {
        return NextResponse.json(
          { error: 'User ID required' },
          { status: 400 }
        )
      }
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        xUsername: true,
        joinDate: true,
        totalPoints: true,
        rank: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const activities: ActivityItem[] = []

    // 1. User joined activity
    activities.push({
      id: `joined_${user.id}`,
      type: 'joined',
      title: 'Joined LayerEdge',
      description: 'Welcome to the community!',
      timestamp: user.joinDate,
      metadata: { action: 'joined' }
    })

    // 2. Tweet submissions
    const tweets = await prisma.tweet.findMany({
      where: { userId: targetUserId },
      orderBy: { submittedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        url: true,
        content: true,
        likes: true,
        retweets: true,
        replies: true,
        totalPoints: true,
        submittedAt: true,
        createdAt: true
      }
    })

    tweets.forEach(tweet => {
      activities.push({
        id: `tweet_${tweet.id}`,
        type: 'tweet_submitted',
        title: 'Tweet Submitted',
        description: `Submitted a tweet with ${tweet.likes} likes, ${tweet.retweets} retweets, ${tweet.replies} replies`,
        timestamp: tweet.submittedAt,
        points: tweet.totalPoints,
        metadata: {
          tweetId: tweet.id,
          url: tweet.url,
          engagement: {
            likes: tweet.likes,
            retweets: tweet.retweets,
            replies: tweet.replies
          }
        }
      })
    })

    // 3. Points history
    const pointsHistory = await prisma.pointsHistory.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        pointsAwarded: true,
        reason: true,
        createdAt: true,
        tweetId: true
      }
    })

    pointsHistory.forEach(history => {
      if (history.pointsAwarded > 0) {
        activities.push({
          id: `points_${history.id}`,
          type: 'points_earned',
          title: 'Points Earned',
          description: history.reason || `Earned ${history.pointsAwarded} points`,
          timestamp: history.createdAt,
          points: history.pointsAwarded,
          metadata: {
            tweetId: history.tweetId,
            reason: history.reason
          }
        })
      }
    })

    // 4. Rank achievements (simulate based on current rank)
    if (user.rank && user.rank <= 10) {
      activities.push({
        id: `rank_${user.rank}`,
        type: 'rank_changed',
        title: `Reached Rank #${user.rank}`,
        description: `Achieved top ${user.rank} position on the leaderboard!`,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last week
        metadata: {
          rank: user.rank,
          achievement: user.rank <= 3 ? 'podium' : 'top10'
        }
      })
    }

    // Sort all activities by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Limit results
    const limitedActivities = activities.slice(0, limit)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        xUsername: user.xUsername,
        totalPoints: user.totalPoints,
        rank: user.rank
      },
      activities: limitedActivities,
      total: activities.length
    })

  } catch (error) {
    console.error('Error fetching user activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user activity' },
      { status: 500 }
    )
  }
}
