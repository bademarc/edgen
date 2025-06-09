import { PrismaClient } from '@prisma/client'
import { TwitterApiService } from './twitter-api'
import cron from 'node-cron'

const prisma = new PrismaClient()

export interface EngagementUpdateResult {
  success: boolean
  updatedTweets: number
  errors: number
  rateLimited: boolean
  message: string
}

export class EngagementUpdateService {
  private twitterApi: TwitterApiService | null = null
  private isRunning: boolean = false
  private lastUpdateTime: number = 0
  private readonly UPDATE_INTERVAL_MS = 60 * 60 * 1000 // 1 hour between updates
  private readonly BATCH_SIZE = 10 // Process 10 tweets at a time to respect rate limits

  constructor() {
    try {
      this.twitterApi = new TwitterApiService()
      console.log('✅ Engagement update service initialized with Twitter API')
    } catch (error) {
      console.warn('⚠️ Twitter API unavailable for engagement updates:', error)
      this.twitterApi = null
    }
  }

  /**
   * Update engagement metrics for tweets that haven't been updated recently
   */
  async updateEngagementMetrics(): Promise<EngagementUpdateResult> {
    if (!this.twitterApi) {
      return {
        success: false,
        updatedTweets: 0,
        errors: 0,
        rateLimited: false,
        message: 'Twitter API service unavailable'
      }
    }

    // Respect rate limits - don't update more than once per hour
    const now = Date.now()
    if (now - this.lastUpdateTime < this.UPDATE_INTERVAL_MS) {
      const remainingTime = Math.ceil((this.UPDATE_INTERVAL_MS - (now - this.lastUpdateTime)) / 1000 / 60)
      return {
        success: false,
        updatedTweets: 0,
        errors: 0,
        rateLimited: true,
        message: `Rate limit cooldown: ${remainingTime} minutes remaining`
      }
    }

    try {
      console.log('🔄 Starting engagement metrics update...')

      // Get tweets that need engagement updates (older than 1 hour or never updated)
      const tweetsToUpdate = await prisma.tweet.findMany({
        where: {
          OR: [
            { lastEngagementUpdate: null },
            { 
              lastEngagementUpdate: {
                lt: new Date(Date.now() - 60 * 60 * 1000) // Older than 1 hour
              }
            }
          ],
          tweetId: { not: null } // Only tweets with valid tweet IDs
        },
        select: {
          id: true,
          tweetId: true,
          url: true,
          likes: true,
          retweets: true,
          replies: true
        },
        orderBy: {
          lastEngagementUpdate: 'asc' // Update oldest first
        },
        take: this.BATCH_SIZE
      })

      if (tweetsToUpdate.length === 0) {
        return {
          success: true,
          updatedTweets: 0,
          errors: 0,
          rateLimited: false,
          message: 'No tweets need engagement updates'
        }
      }

      let updatedCount = 0
      let errorCount = 0

      for (const tweet of tweetsToUpdate) {
        try {
          // Construct tweet URL if not available
          const tweetUrl = tweet.url || `https://x.com/i/web/status/${tweet.tweetId}`

          // Fetch updated engagement metrics from Twitter API
          const engagementMetrics = await this.twitterApi.getTweetEngagementMetrics(tweetUrl)

          if (engagementMetrics) {
            // Update tweet in database
            await prisma.tweet.update({
              where: { id: tweet.id },
              data: {
                likes: engagementMetrics.likes,
                retweets: engagementMetrics.retweets,
                replies: engagementMetrics.replies,
                lastEngagementUpdate: new Date()
              }
            })

            console.log(`✅ Updated engagement for tweet ${tweet.tweetId}: ${engagementMetrics.likes} likes, ${engagementMetrics.retweets} retweets, ${engagementMetrics.replies} replies`)
            updatedCount++
          } else {
            console.warn(`⚠️ Could not fetch engagement metrics for tweet ${tweet.tweetId}`)
            errorCount++
          }

          // Small delay between requests to avoid hitting rate limits
          await new Promise(resolve => setTimeout(resolve, 1000))

        } catch (error) {
          console.error(`❌ Error updating engagement for tweet ${tweet.tweetId}:`, error)
          errorCount++
        }
      }

      this.lastUpdateTime = now

      return {
        success: true,
        updatedTweets: updatedCount,
        errors: errorCount,
        rateLimited: false,
        message: `Updated ${updatedCount} tweets, ${errorCount} errors`
      }

    } catch (error) {
      console.error('Error in engagement update service:', error)
      return {
        success: false,
        updatedTweets: 0,
        errors: 1,
        rateLimited: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Start the automatic engagement update service
   */
  async startAutomaticUpdates(): Promise<void> {
    if (this.isRunning) {
      console.log('Engagement update service is already running')
      return
    }

    this.isRunning = true
    console.log('🚀 Starting automatic engagement update service...')

    // Run engagement updates every hour
    cron.schedule('0 * * * *', async () => {
      if (!this.isRunning) return

      try {
        const result = await this.updateEngagementMetrics()
        console.log(`📊 Engagement update completed: ${result.message}`)
      } catch (error) {
        console.error('Error in scheduled engagement update:', error)
      }
    })

    console.log('✅ Automatic engagement updates scheduled (every hour)')
  }

  /**
   * Stop the automatic engagement update service
   */
  async stopAutomaticUpdates(): Promise<void> {
    this.isRunning = false
    console.log('🛑 Automatic engagement update service stopped')
  }

  /**
   * Get service status
   */
  getStatus(): {
    isRunning: boolean
    lastUpdateTime: number
    nextUpdateTime: number
    apiAvailable: boolean
  } {
    return {
      isRunning: this.isRunning,
      lastUpdateTime: this.lastUpdateTime,
      nextUpdateTime: this.lastUpdateTime + this.UPDATE_INTERVAL_MS,
      apiAvailable: this.twitterApi !== null
    }
  }

  /**
   * Force update engagement metrics for a specific tweet
   */
  async updateSpecificTweet(tweetId: string): Promise<boolean> {
    if (!this.twitterApi) {
      console.warn('Twitter API unavailable for specific tweet update')
      return false
    }

    try {
      const tweet = await prisma.tweet.findFirst({
        where: { tweetId }
      })

      if (!tweet) {
        console.warn(`Tweet ${tweetId} not found in database`)
        return false
      }

      const tweetUrl = tweet.url || `https://x.com/i/web/status/${tweetId}`
      const engagementMetrics = await this.twitterApi.getTweetEngagementMetrics(tweetUrl)

      if (engagementMetrics) {
        await prisma.tweet.update({
          where: { id: tweet.id },
          data: {
            likes: engagementMetrics.likes,
            retweets: engagementMetrics.retweets,
            replies: engagementMetrics.replies,
            lastEngagementUpdate: new Date()
          }
        })

        console.log(`✅ Force updated engagement for tweet ${tweetId}`)
        return true
      }

      return false
    } catch (error) {
      console.error(`Error force updating tweet ${tweetId}:`, error)
      return false
    }
  }

  /**
   * Get engagement update statistics
   */
  async getUpdateStats(hours: number = 24): Promise<{
    totalTweets: number
    recentlyUpdated: number
    needingUpdate: number
    averageEngagement: {
      likes: number
      retweets: number
      replies: number
    }
  }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)

    const [totalTweets, recentlyUpdated, needingUpdate, avgEngagement] = await Promise.all([
      prisma.tweet.count(),
      prisma.tweet.count({
        where: {
          lastEngagementUpdate: { gte: since }
        }
      }),
      prisma.tweet.count({
        where: {
          OR: [
            { lastEngagementUpdate: null },
            { 
              lastEngagementUpdate: {
                lt: new Date(Date.now() - 60 * 60 * 1000)
              }
            }
          ]
        }
      }),
      prisma.tweet.aggregate({
        _avg: {
          likes: true,
          retweets: true,
          replies: true
        }
      })
    ])

    return {
      totalTweets,
      recentlyUpdated,
      needingUpdate,
      averageEngagement: {
        likes: Math.round(avgEngagement._avg.likes || 0),
        retweets: Math.round(avgEngagement._avg.retweets || 0),
        replies: Math.round(avgEngagement._avg.replies || 0)
      }
    }
  }
}

// Singleton instance
let engagementUpdateServiceInstance: EngagementUpdateService | null = null

export function getEngagementUpdateService(): EngagementUpdateService {
  if (!engagementUpdateServiceInstance) {
    engagementUpdateServiceInstance = new EngagementUpdateService()
  }
  return engagementUpdateServiceInstance
}
