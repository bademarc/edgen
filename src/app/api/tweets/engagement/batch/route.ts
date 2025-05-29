import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { TwitterApiService } from '@/lib/twitter-api'
import { calculatePoints, validateTweetContent } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tweetIds } = body

    if (!tweetIds || !Array.isArray(tweetIds) || tweetIds.length === 0) {
      return NextResponse.json(
        { error: 'Tweet IDs array is required' },
        { status: 400 }
      )
    }

    // Limit batch size to prevent overwhelming the API
    if (tweetIds.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 tweets per batch' },
        { status: 400 }
      )
    }

    // Fetch tweets from database
    const tweets = await prisma.tweet.findMany({
      where: {
        id: {
          in: tweetIds,
        },
      },
      select: {
        id: true,
        url: true,
        content: true,
        likes: true,
        retweets: true,
        replies: true,
        totalPoints: true,
        userId: true,
        lastEngagementUpdate: true,
        engagementUpdateCount: true,
      },
    })

    if (tweets.length === 0) {
      return NextResponse.json(
        { error: 'No tweets found' },
        { status: 404 }
      )
    }

    // Filter tweets that contain '@layeredge' or '$EDGEN' mentions
    const validTweets = tweets.filter(tweet => {
      if (!tweet.content) return false
      return validateTweetContent(tweet.content)
    })

    if (validTweets.length === 0) {
      return NextResponse.json(
        { error: 'No valid tweets found (must contain @layeredge or $EDGEN)' },
        { status: 400 }
      )
    }

    const twitterApi = new TwitterApiService()
    const tweetUrls = validTweets.map(tweet => tweet.url)

    // Fetch fresh engagement metrics from Twitter API
    const engagementResults = await twitterApi.getBatchTweetEngagementMetrics(tweetUrls)

    const updatedTweets = []
    const userPointsUpdates: { [userId: string]: number } = {}

    for (const tweet of validTweets) {
      const engagementResult = engagementResults.find(result => result.url === tweet.url)

      if (!engagementResult?.metrics) {
        console.warn(`Failed to fetch engagement metrics for tweet ${tweet.id}`)
        continue
      }

      const { likes, retweets, replies } = engagementResult.metrics

      // Check if metrics have actually changed
      if (likes === tweet.likes && retweets === tweet.retweets && replies === tweet.replies) {
        continue
      }

      // Calculate new points
      const newTotalPoints = calculatePoints({ likes, retweets, comments: replies })
      const pointsDifference = newTotalPoints - tweet.totalPoints

      // Update tweet in database
      const updatedTweet = await prisma.tweet.update({
        where: { id: tweet.id },
        data: {
          likes,
          retweets,
          replies,
          bonusPoints: newTotalPoints - 5, // Base points are always 5
          totalPoints: newTotalPoints,
          lastEngagementUpdate: new Date(),
          engagementUpdateCount: tweet.engagementUpdateCount + 1,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              xUsername: true,
              image: true,
            },
          },
        },
      })

      updatedTweets.push(updatedTweet)

      // Track user points updates
      if (pointsDifference !== 0) {
        userPointsUpdates[tweet.userId] = (userPointsUpdates[tweet.userId] || 0) + pointsDifference
      }
    }

    // Update user total points
    for (const [userId, pointsChange] of Object.entries(userPointsUpdates)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalPoints: {
            increment: pointsChange,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      updatedCount: updatedTweets.length,
      tweets: updatedTweets,
      message: `Successfully updated ${updatedTweets.length} tweets`,
    })
  } catch (error) {
    console.error('Error updating engagement metrics:', error)
    return NextResponse.json(
      { error: 'Failed to update engagement metrics' },
      { status: 500 }
    )
  }
}
