import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getFallbackService } from '@/lib/fallback-service'
import { calculatePoints, validateTweetContent } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tweetId } = await params

    if (!tweetId) {
      return NextResponse.json(
        { error: 'Tweet ID is required' },
        { status: 400 }
      )
    }

    // Fetch tweet from database
    const tweet = await prisma.tweet.findUnique({
      where: { id: tweetId },
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

    if (!tweet) {
      return NextResponse.json(
        { error: 'Tweet not found' },
        { status: 404 }
      )
    }

    // Validate tweet content contains required mentions
    if (!tweet.content || !validateTweetContent(tweet.content)) {
      return NextResponse.json(
        { error: 'Tweet must contain @layeredge or $EDGEN mentions' },
        { status: 400 }
      )
    }

    // Check if we should rate limit updates (max once per 5 minutes for same tweet)
    if (tweet.lastEngagementUpdate) {
      const timeSinceLastUpdate = Date.now() - tweet.lastEngagementUpdate.getTime()
      const fiveMinutes = 5 * 60 * 1000

      if (timeSinceLastUpdate < fiveMinutes) {
        return NextResponse.json(
          {
            error: 'Rate limited: Please wait before updating this tweet again',
            nextUpdateAllowed: new Date(tweet.lastEngagementUpdate.getTime() + fiveMinutes)
          },
          { status: 429 }
        )
      }
    }

    // Use fallback service for engagement metrics
    const fallbackService = getFallbackService({
      enableScraping: true,
      preferApi: true,
      apiTimeoutMs: 8000, // 8 seconds for engagement updates
    })

    // Fetch fresh engagement metrics using fallback service
    const engagementMetrics = await fallbackService.getEngagementMetrics(tweet.url)

    if (!engagementMetrics) {
      const fallbackStatus = fallbackService.getStatus()
      return NextResponse.json(
        {
          error: 'Failed to fetch engagement metrics from both Twitter API and web scraping',
          fallbackStatus,
          suggestedAction: fallbackStatus.isApiRateLimited
            ? 'Twitter API is rate limited. Engagement updates are temporarily using web scraping.'
            : 'Both data sources are currently unavailable. Please try again later.'
        },
        { status: 500 }
      )
    }

    const { likes, retweets, replies } = engagementMetrics

    // Check if metrics have actually changed
    if (likes === tweet.likes && retweets === tweet.retweets && replies === tweet.replies) {
      return NextResponse.json({
        success: true,
        changed: false,
        message: 'No changes in engagement metrics',
        metrics: { likes, retweets, replies },
      })
    }

    // Calculate new points
    const newTotalPoints = calculatePoints({ likes, retweets, comments: replies })
    const pointsDifference = newTotalPoints - tweet.totalPoints

    // Update tweet in database
    const updatedTweet = await prisma.tweet.update({
      where: { id: tweetId },
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

    // Update user total points if there's a change
    if (pointsDifference !== 0) {
      await prisma.user.update({
        where: { id: tweet.userId },
        data: {
          totalPoints: {
            increment: pointsDifference,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      changed: true,
      pointsDifference,
      tweet: updatedTweet,
      message: 'Engagement metrics updated successfully',
    })
  } catch (error) {
    console.error('Error updating tweet engagement:', error)
    return NextResponse.json(
      { error: 'Failed to update engagement metrics' },
      { status: 500 }
    )
  }
}
