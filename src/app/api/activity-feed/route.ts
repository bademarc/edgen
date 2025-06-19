/**
 * Activity Feed API - LayerEdge Community Platform
 *
 * PRODUCTION COMPLIANCE:
 * - Uses Apify cheap-simple-twitter-api (actor: gdN28kzr6QsU4nVh8) for fresh engagement data
 * - Respects TWITTER_API_DISABLED=true configuration
 * - Respects FORCE_OEMBED_ONLY=true configuration
 * - Falls back to database values when Apify is unavailable
 * - Limits Apify calls to prevent rate limiting
 *
 * This ensures all tweet engagement metrics come from approved Apify service
 * instead of potentially stale database values or direct X/Twitter API calls.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getApifyTwitterService } from '@/lib/apify-twitter-service'
import { extractTweetId } from '@/lib/utils'

interface ActivityFeedItem {
  id: string
  type: 'tweet' | 'achievement' | 'milestone' | 'join'
  user: {
    id: string
    name: string
    username: string
    avatar?: string
    totalPoints: number
    rank: number
    tweetsCount: number
    thisWeekPoints?: number
    joinDate?: string
    questsCompleted?: number
    dailyStreak?: number
  }
  content: string
  points?: number
  timestamp: Date
  engagement?: {
    likes: number
    retweets: number
    replies: number
  }
  achievement?: {
    name: string
    icon: string
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
  }
}

/**
 * Fetch real-time engagement metrics using Apify service
 * Respects production configuration (TWITTER_API_DISABLED=true, FORCE_OEMBED_ONLY=true)
 */
async function getFreshEngagementMetrics(tweetUrl: string): Promise<{
  likes: number
  retweets: number
  replies: number
} | null> {
  // Check if Twitter API is disabled and we should use Apify
  const twitterApiDisabled = process.env.TWITTER_API_DISABLED === 'true'
  const forceOembedOnly = process.env.FORCE_OEMBED_ONLY === 'true'

  if (!twitterApiDisabled && !forceOembedOnly) {
    // If Twitter API is enabled, we might still prefer Apify for consistency
    console.log('🔄 Twitter API enabled but using Apify for consistency')
  }

  try {
    const apifyService = getApifyTwitterService()

    if (!apifyService.isReady()) {
      console.log('⚠️ Apify service not configured for activity feed')
      return null
    }

    console.log(`🕷️ Fetching fresh engagement metrics via Apify for: ${tweetUrl}`)

    // Use quick mode for activity feed to ensure responsiveness
    const metrics = await apifyService.getQuickEngagementMetrics(tweetUrl)

    if (metrics) {
      console.log('✅ Successfully fetched fresh engagement metrics:', metrics)
      return {
        likes: metrics.likes || 0,
        retweets: metrics.retweets || 0,
        replies: metrics.replies || 0
      }
    } else {
      console.log('⚠️ No engagement metrics returned from Apify')
      return null
    }

  } catch (error) {
    console.error('❌ Error fetching engagement metrics via Apify:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    // Log production configuration compliance
    const twitterApiDisabled = process.env.TWITTER_API_DISABLED === 'true'
    const forceOembedOnly = process.env.FORCE_OEMBED_ONLY === 'true'
    const manualSubmissionsOnly = process.env.MANUAL_SUBMISSIONS_ONLY === 'true'

    console.log('🔧 Activity Feed Configuration:')
    console.log(`   TWITTER_API_DISABLED: ${twitterApiDisabled}`)
    console.log(`   FORCE_OEMBED_ONLY: ${forceOembedOnly}`)
    console.log(`   MANUAL_SUBMISSIONS_ONLY: ${manualSubmissionsOnly}`)
    console.log(`   Using Apify for engagement data: ${twitterApiDisabled || forceOembedOnly}`)

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const activities: ActivityFeedItem[] = []

    // 1. Recent tweet submissions (most recent activity)
    const recentTweets = await prisma.tweet.findMany({
      take: Math.min(limit, 20),
      skip: offset,
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        url: true,
        content: true,
        likes: true,
        retweets: true,
        replies: true,
        totalPoints: true,
        submittedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            xUsername: true,
            image: true,
            totalPoints: true,
            rank: true,
            joinDate: true
          }
        }
      }
    })

    // Convert tweets to activity items with fresh engagement data
    // Limit Apify calls to prevent rate limiting and improve performance
    const maxApifyCalls = Math.min(recentTweets.length, 5) // Limit to 5 fresh calls per request

    for (let i = 0; i < recentTweets.length; i++) {
      const tweet = recentTweets[i]
      // Get user's tweet count
      const userTweetCount = await prisma.tweet.count({
        where: { userId: tweet.user.id }
      })

      // Calculate this week's points (simplified - you might want to optimize this)
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      const thisWeekTweets = await prisma.tweet.findMany({
        where: {
          userId: tweet.user.id,
          submittedAt: { gte: oneWeekAgo }
        },
        select: { totalPoints: true }
      })

      const thisWeekPoints = thisWeekTweets.reduce((sum, t) => sum + t.totalPoints, 0)

      // Fetch fresh engagement metrics using Apify service (limited calls)
      let freshEngagement = null
      if (tweet.url && i < maxApifyCalls) {
        try {
          freshEngagement = await getFreshEngagementMetrics(tweet.url)
        } catch (error) {
          console.error(`❌ Failed to fetch fresh engagement for tweet ${tweet.id}:`, error)
          // Continue with database values on error
        }
      }

      // Use fresh engagement data if available, otherwise fall back to database values
      const engagementData = freshEngagement || {
        likes: tweet.likes,
        retweets: tweet.retweets,
        replies: tweet.replies
      }

      // Log data source for transparency
      if (freshEngagement) {
        console.log(`✅ Tweet ${tweet.id}: Using fresh Apify engagement data (L:${freshEngagement.likes}, R:${freshEngagement.retweets}, C:${freshEngagement.replies})`)
      } else if (i >= maxApifyCalls) {
        console.log(`⏳ Tweet ${tweet.id}: Using database data (Apify call limit reached)`)
      } else {
        console.log(`⚠️ Tweet ${tweet.id}: Using database data (Apify unavailable)`)
      }

      activities.push({
        id: `tweet_${tweet.id}`,
        type: 'tweet',
        user: {
          id: tweet.user.id,
          name: tweet.user.name || 'Anonymous',
          username: tweet.user.xUsername || 'unknown',
          avatar: tweet.user.image || undefined,
          totalPoints: tweet.user.totalPoints,
          rank: tweet.user.rank || 999,
          tweetsCount: userTweetCount,
          thisWeekPoints,
          joinDate: tweet.user.joinDate?.toISOString(),
          questsCompleted: 0, // TODO: Implement quest system
          dailyStreak: 0 // TODO: Implement streak system
        },
        content: `earned ${tweet.totalPoints} points for a tweet submission! 🚀`,
        points: tweet.totalPoints,
        timestamp: tweet.submittedAt,
        engagement: engagementData
      })
    }

    // 2. Recent user joins
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { joinDate: 'desc' },
      select: {
        id: true,
        name: true,
        xUsername: true,
        image: true,
        totalPoints: true,
        rank: true,
        joinDate: true
      }
    })

    for (const user of recentUsers) {
      // Skip if we already have recent activity from this user
      if (activities.some(a => a.user.id === user.id)) continue

      const userTweetCount = await prisma.tweet.count({
        where: { userId: user.id }
      })

      activities.push({
        id: `join_${user.id}`,
        type: 'join',
        user: {
          id: user.id,
          name: user.name || 'Anonymous',
          username: user.xUsername || 'unknown',
          avatar: user.image || undefined,
          totalPoints: user.totalPoints,
          rank: user.rank || 999,
          tweetsCount: userTweetCount,
          joinDate: user.joinDate?.toISOString(),
          questsCompleted: 0,
          dailyStreak: 0
        },
        content: 'joined the LayerEdge community! Welcome! 🎉',
        points: 25,
        timestamp: user.joinDate || new Date()
      })
    }

    // 3. Milestone achievements (users reaching point milestones)
    const milestoneUsers = await prisma.user.findMany({
      where: {
        totalPoints: {
          in: [1000, 2500, 5000, 10000] // Common milestone points
        }
      },
      take: 3,
      orderBy: { totalPoints: 'desc' }, // Order by points instead of updatedAt
      select: {
        id: true,
        name: true,
        xUsername: true,
        image: true,
        totalPoints: true,
        rank: true,
        joinDate: true
      }
    })

    for (const user of milestoneUsers) {
      // Skip if we already have recent activity from this user
      if (activities.some(a => a.user.id === user.id)) continue

      const userTweetCount = await prisma.tweet.count({
        where: { userId: user.id }
      })

      activities.push({
        id: `milestone_${user.id}`,
        type: 'milestone',
        user: {
          id: user.id,
          name: user.name || 'Anonymous',
          username: user.xUsername || 'unknown',
          avatar: user.image || undefined,
          totalPoints: user.totalPoints,
          rank: user.rank || 999,
          tweetsCount: userTweetCount,
          joinDate: user.joinDate?.toISOString(),
          questsCompleted: 0,
          dailyStreak: 0
        },
        content: `reached ${user.totalPoints.toLocaleString()} total points milestone! 🏆`,
        points: 50,
        timestamp: new Date() // Use current time for milestone activities
      })
    }

    // Sort all activities by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Limit results
    const limitedActivities = activities.slice(0, limit)

    return NextResponse.json({
      success: true,
      activities: limitedActivities,
      total: activities.length,
      hasMore: activities.length > limit
    })

  } catch (error) {
    console.error('Error fetching activity feed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch activity feed',
        activities: [],
        total: 0,
        hasMore: false
      },
      { status: 500 }
    )
  }
}
