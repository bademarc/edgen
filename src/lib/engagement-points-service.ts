import { prisma } from './db'
import { TwitterApi, TwitterApiReadOnly } from 'twitter-api-v2'
import { extractTweetId, calculatePoints } from './utils'

interface EngagementUpdate {
  tweetId: string
  likes: number
  retweets: number
  replies: number
  source: 'twitter-api' | 'manual' | 'estimated' | 'apify'
}

/**
 * Engagement Points Service
 * Handles engagement metrics updates and points recalculation
 * Fixes the issue where users don't get points due to API rate limits
 */
export class EngagementPointsService {
  private twitterClient: TwitterApiReadOnly | null = null
  private isRateLimited = false
  private rateLimitResetTime = 0

  constructor() {
    this.initializeTwitterApi()
  }

  private initializeTwitterApi() {
    try {
      const bearerToken = process.env.TWITTER_BEARER_TOKEN
      if (bearerToken) {
        this.twitterClient = new TwitterApi(bearerToken).readOnly
        console.log('✅ Engagement Points Service: Twitter API initialized')
      }
    } catch (error) {
      console.error('❌ Twitter API initialization failed:', error)
    }
  }

  /**
   * Update engagement metrics for a tweet and recalculate points
   */
  async updateTweetEngagement(tweetUrl: string, userId?: string): Promise<{
    success: boolean
    pointsAwarded?: number
    engagementMetrics?: EngagementUpdate
    error?: string
  }> {
    try {
      const tweetId = extractTweetId(tweetUrl)
      if (!tweetId) {
        return { success: false, error: 'Invalid tweet URL' }
      }

      // Find the tweet in database
      const tweet = await prisma.tweet.findFirst({
        where: {
          OR: [
            { url: tweetUrl },
            { tweetId: tweetId }
          ]
        },
        include: { user: true }
      })

      if (!tweet) {
        return { success: false, error: 'Tweet not found in database' }
      }

      // Try to get fresh engagement metrics
      const freshMetrics = await this.getFreshEngagementMetrics(tweetId)
      
      if (!freshMetrics) {
        // If we can't get fresh metrics, use estimated engagement based on time
        const estimatedMetrics = this.estimateEngagementGrowth(tweet)
        return await this.updateTweetWithMetrics(tweet, estimatedMetrics)
      }

      return await this.updateTweetWithMetrics(tweet, freshMetrics)

    } catch (error) {
      console.error('Error updating tweet engagement:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Get fresh engagement metrics from Twitter API or Apify
   */
  private async getFreshEngagementMetrics(tweetId: string): Promise<EngagementUpdate | null> {
    // Try Apify first (more reliable and cost-effective)
    const apifyResult = await this.getApifyEngagementMetrics(tweetId)
    if (apifyResult) {
      return apifyResult
    }

    // Fallback to Twitter API if available
    if (!this.twitterClient || this.isCurrentlyRateLimited()) {
      console.log('⏳ Twitter API not available or rate limited')
      return null
    }

    try {
      const tweet = await this.twitterClient.v2.singleTweet(tweetId, {
        'tweet.fields': ['public_metrics']
      })

      if (!tweet.data?.public_metrics) {
        return null
      }

      const metrics = tweet.data.public_metrics
      return {
        tweetId,
        likes: metrics.like_count || 0,
        retweets: metrics.retweet_count || 0,
        replies: metrics.reply_count || 0,
        source: 'twitter-api'
      }

    } catch (error: any) {
      if (error.code === 429 || error.message?.includes('429')) {
        console.log('🚫 Twitter API rate limit hit')
        this.handleRateLimit()
      }
      return null
    }
  }

  /**
   * Get engagement metrics from Apify
   */
  private async getApifyEngagementMetrics(tweetId: string): Promise<EngagementUpdate | null> {
    try {
      const { getApifyTwitterService } = await import('@/lib/apify-twitter-service')
      const apifyService = getApifyTwitterService()

      if (!apifyService.isReady()) {
        console.log('⏳ Apify service not configured')
        return null
      }

      console.log(`🕷️ Fetching engagement for tweet ${tweetId} via Apify`)
      const tweetData = await apifyService.getTweetData(tweetId)

      if (!tweetData) {
        console.log(`❌ Apify: Tweet ${tweetId} not found`)
        return null
      }

      return {
        tweetId,
        likes: tweetData.likeCount || 0,
        retweets: tweetData.retweetCount || 0,
        replies: tweetData.replyCount || 0,
        source: 'apify'
      }

    } catch (error) {
      console.error(`❌ Apify error for tweet ${tweetId}:`, error)
      return null
    }
  }

  /**
   * Estimate engagement growth based on time and current metrics
   */
  private estimateEngagementGrowth(tweet: any): EngagementUpdate {
    const now = new Date()
    const tweetAge = now.getTime() - new Date(tweet.createdAt).getTime()
    const hoursOld = tweetAge / (1000 * 60 * 60)

    // Conservative growth estimation (1-5% per hour for first 24 hours)
    const growthFactor = Math.min(1 + (hoursOld * 0.02), 1.2) // Max 20% growth

    return {
      tweetId: tweet.tweetId || extractTweetId(tweet.url) || '',
      likes: Math.floor(tweet.likes * growthFactor),
      retweets: Math.floor(tweet.retweets * growthFactor),
      replies: Math.floor(tweet.replies * growthFactor),
      source: 'estimated'
    }
  }

  /**
   * Update tweet with new metrics and recalculate points
   */
  private async updateTweetWithMetrics(tweet: any, metrics: EngagementUpdate): Promise<{
    success: boolean
    pointsAwarded?: number
    engagementMetrics?: EngagementUpdate
  }> {
    const oldEngagement = {
      likes: tweet.likes,
      retweets: tweet.retweets,
      replies: tweet.replies
    }

    const newEngagement = {
      likes: metrics.likes,
      retweets: metrics.retweets,
      replies: metrics.replies
    }

    // Calculate old and new points
    const oldPoints = calculatePoints({
      likes: oldEngagement.likes,
      retweets: oldEngagement.retweets,
      comments: oldEngagement.replies
    })

    const newPoints = calculatePoints({
      likes: newEngagement.likes,
      retweets: newEngagement.retweets,
      comments: newEngagement.replies
    })

    const pointsDifference = newPoints - oldPoints

    if (pointsDifference <= 0) {
      console.log(`No point increase for tweet ${tweet.id}`)
      return { success: true, pointsAwarded: 0, engagementMetrics: metrics }
    }

    // Update tweet in database
    await prisma.tweet.update({
      where: { id: tweet.id },
      data: {
        likes: newEngagement.likes,
        retweets: newEngagement.retweets,
        replies: newEngagement.replies,
        totalPoints: newPoints,
        bonusPoints: newPoints - 5, // Assuming base points is 5
        lastEngagementUpdate: new Date(),
        engagementUpdateCount: { increment: 1 }
      }
    })

    // Update user's total points
    await prisma.user.update({
      where: { id: tweet.userId },
      data: {
        totalPoints: { increment: pointsDifference }
      }
    })

    // Create points history record
    await prisma.pointsHistory.create({
      data: {
        userId: tweet.userId,
        tweetId: tweet.id,
        pointsAwarded: pointsDifference,
        reason: `Engagement update (${metrics.source}): +${pointsDifference} points`
      }
    })

    console.log(`✅ Updated tweet ${tweet.id}: +${pointsDifference} points from engagement`)

    return {
      success: true,
      pointsAwarded: pointsDifference,
      engagementMetrics: metrics
    }
  }

  /**
   * Batch update engagement for multiple tweets
   */
  async batchUpdateEngagement(limit = 50): Promise<{
    processed: number
    updated: number
    totalPointsAwarded: number
  }> {
    console.log('🔄 Starting batch engagement update...')

    // Get tweets that haven't been updated recently
    const tweets = await prisma.tweet.findMany({
      where: {
        OR: [
          { lastEngagementUpdate: null },
          { 
            lastEngagementUpdate: {
              lt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
            }
          }
        ]
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    let processed = 0
    let updated = 0
    let totalPointsAwarded = 0

    for (const tweet of tweets) {
      try {
        const result = await this.updateTweetEngagement(tweet.url)
        processed++

        if (result.success && result.pointsAwarded && result.pointsAwarded > 0) {
          updated++
          totalPointsAwarded += result.pointsAwarded
        }

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`Error updating tweet ${tweet.id}:`, error)
      }
    }

    console.log(`✅ Batch update complete: ${updated}/${processed} tweets updated, ${totalPointsAwarded} total points awarded`)

    return { processed, updated, totalPointsAwarded }
  }

  private isCurrentlyRateLimited(): boolean {
    return this.isRateLimited && Date.now() < this.rateLimitResetTime
  }

  private handleRateLimit(): void {
    this.isRateLimited = true
    this.rateLimitResetTime = Date.now() + (15 * 60 * 1000) // 15 minutes
    console.log(`🚫 Rate limited until ${new Date(this.rateLimitResetTime)}`)
  }

  /**
   * Manual engagement update (for when API is not available)
   */
  async manualEngagementUpdate(tweetUrl: string, engagement: {
    likes: number
    retweets: number
    replies: number
  }): Promise<{ success: boolean; pointsAwarded?: number }> {
    const tweetId = extractTweetId(tweetUrl)
    if (!tweetId) {
      return { success: false }
    }

    const metrics: EngagementUpdate = {
      tweetId,
      ...engagement,
      source: 'manual'
    }

    const tweet = await prisma.tweet.findFirst({
      where: { OR: [{ url: tweetUrl }, { tweetId }] }
    })

    if (!tweet) {
      return { success: false }
    }

    const result = await this.updateTweetWithMetrics(tweet, metrics)
    return { success: result.success, pointsAwarded: result.pointsAwarded }
  }
}
