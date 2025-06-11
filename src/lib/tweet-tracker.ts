import { PrismaClient } from '@prisma/client'
import cron from 'node-cron'
import { calculatePoints } from './utils'
import { TwitterApiService } from './twitter-api'

const prisma = new PrismaClient()

export interface TweetData {
  id: string
  text: string
  user: {
    id: string
    username: string
    name: string
    protected?: boolean
  }
  public_metrics?: {
    like_count: number
    retweet_count: number
    reply_count: number
  }
  created_at: string
}

export interface TrackingResult {
  method: string
  success: boolean
  tweetsFound: number
  error?: string
  duration: number
}

export class TweetTracker {
  private keywords: string[]
  private trackedUsers: Set<string>
  private isRunning: boolean
  private twitterApi: TwitterApiService | null
  private lastSearchTime: number = 0
  private readonly SEARCH_INTERVAL_MS = 60 * 60 * 1000 // 60 minutes to prevent rate limit exhaustion

  constructor() {
    this.keywords = ['@layeredge', 'EDGEN'] // Fixed: removed $ to avoid cashtag syntax errors
    this.trackedUsers = new Set()
    this.isRunning = false

    // Initialize Twitter API service only
    try {
      this.twitterApi = new TwitterApiService()
      console.log('✅ Twitter API service initialized for tweet tracking')
    } catch (error) {
      console.warn('⚠️ Twitter API service unavailable:', error)
      this.twitterApi = null
    }
  }

  /**
   * Search for tweets using Twitter API v1.1 only
   */
  async searchTweetsWithApi(): Promise<TweetData[]> {
    if (!this.twitterApi) {
      console.warn('Twitter API not available for tweet search')
      return []
    }

    // Respect rate limits - don't search more than once every 60 minutes
    const now = Date.now()
    if (now - this.lastSearchTime < this.SEARCH_INTERVAL_MS) {
      console.log('Skipping search due to rate limit cooldown')
      return []
    }

    try {
      // Build proper Twitter API v2 search query
      // Use quoted strings for exact matches and avoid cashtag syntax issues
      const query = '@layeredge OR "EDGEN" OR "$EDGEN"'
      console.log(`🔍 Searching tweets with Twitter API v2: ${query}`)

      // Use Twitter API to search for recent tweets
      const searchResults = await this.twitterApi.searchTweets(query, {
        max_results: 50,
        tweet_fields: 'public_metrics,created_at,author_id',
        user_fields: 'username,name,protected'
      })

      this.lastSearchTime = now

      if (!searchResults?.data) {
        console.log('No tweets found in API search')
        return []
      }

      // Filter for valid tweets containing our keywords
      const filteredTweets = searchResults.data.filter((tweet: any) => {
        const user = searchResults.includes?.users?.find((u: any) => u.id === tweet.author_id)
        return !user?.protected && this.containsKeywords(tweet.text || '')
      })

      console.log(`✅ Twitter API found ${filteredTweets.length} valid tweets`)

      // Convert to our TweetData format
      return filteredTweets.map((tweet: any) => {
        const user = searchResults.includes?.users?.find((u: any) => u.id === tweet.author_id)
        return {
          id: tweet.id,
          text: tweet.text,
          user: {
            id: tweet.author_id,
            username: user?.username || 'unknown',
            name: user?.name || 'Unknown User',
            protected: user?.protected || false
          },
          public_metrics: tweet.public_metrics || {
            like_count: 0,
            retweet_count: 0,
            reply_count: 0
          },
          created_at: tweet.created_at
        }
      })

    } catch (error) {
      console.error('Twitter API search error:', error)
      return []
    }
  }









  /**
   * Setup Twitter API monitoring with rate limit respect
   */
  async setupTwitterApiMonitoring(): Promise<void> {
    console.log('🔄 Setting up Twitter API monitoring system...')

    // Run Twitter API search every 60 minutes to prevent rate limit exhaustion
    cron.schedule('0 * * * *', async () => {
      if (!this.isRunning) return

      const startTime = Date.now()

      try {
        console.log('🚀 Running Twitter API search...')
        const tweets = await this.searchTweetsWithApi()
        const duration = Date.now() - startTime

        const processedCount = await this.processTweets(tweets, 'twitter-api')

        // Log tracking result
        await this.logTrackingResult({
          method: 'twitter-api',
          success: true,
          tweetsFound: processedCount,
          duration
        })

        console.log(`✅ Twitter API search completed: ${processedCount} tweets processed in ${duration}ms`)
      } catch (error) {
        const duration = Date.now() - startTime
        console.error('❌ Twitter API search failed:', error)

        await this.logTrackingResult({
          method: 'twitter-api',
          success: false,
          tweetsFound: 0,
          error: error instanceof Error ? error.message : String(error),
          duration
        })
      }
    })
  }

  /**
   * Process discovered tweets and award points
   */
  async processTweets(tweets: TweetData[], source: string): Promise<number> {
    let processedCount = 0

    for (const tweet of tweets) {
      try {
        // Check if tweet already processed
        const existing = await prisma.tweet.findFirst({
          where: {
            OR: [
              { tweetId: tweet.id },
              { url: { contains: tweet.id } }
            ]
          }
        })

        if (existing) {
          console.log(`Tweet ${tweet.id} already exists, skipping`)
          continue
        }

        // Find user in database (if they've connected their account)
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { xUsername: tweet.user.username },
              { xUserId: tweet.user.id }
            ]
          }
        })

        if (user) {
          // User found - award points directly
          await this.awardPoints(user.id, tweet, source)
          processedCount++
        } else {
          // Store as unclaimed tweet for later claiming
          await this.storeUnclaimedTweet(tweet, source)
          console.log(`Stored unclaimed tweet from @${tweet.user.username}`)
        }

      } catch (error) {
        console.error(`Error processing tweet ${tweet.id}:`, error)
        continue
      }
    }

    return processedCount
  }

  /**
   * Award points to user for discovered tweet
   */
  async awardPoints(userId: string, tweetData: TweetData, source: string): Promise<number> {
    const basePoints = 5
    const metrics = tweetData.public_metrics || { like_count: 0, retweet_count: 0, reply_count: 0 }
    const totalPoints = calculatePoints({ likes: metrics.like_count, retweets: metrics.retweet_count, comments: metrics.reply_count })

    const tweetUrl = `https://x.com/i/web/status/${tweetData.id}`

    // Create tweet record
    const newTweet = await prisma.tweet.create({
      data: {
        url: tweetUrl,
        content: tweetData.text,
        userId: userId,
        likes: metrics.like_count,
        retweets: metrics.retweet_count,
        replies: metrics.reply_count,
        basePoints,
        bonusPoints: totalPoints - basePoints,
        totalPoints,
        isVerified: true,
        tweetId: tweetData.id,
        discoveredAt: new Date(),
        isAutoDiscovered: true,
      },
    })

    // Update user's total points
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalPoints: {
          increment: totalPoints,
        },
      },
    })

    // Create points history record
    await prisma.pointsHistory.create({
      data: {
        userId: userId,
        tweetId: newTweet.id,
        pointsAwarded: totalPoints,
        reason: `Automatic discovery via ${source}`,
      },
    })

    console.log(`✅ Awarded ${totalPoints} points to user ${userId} for tweet ${tweetData.id}`)
    return totalPoints
  }

  /**
   * Store unclaimed tweet for later user claiming
   */
  async storeUnclaimedTweet(tweetData: TweetData, source: string): Promise<void> {
    try {
      const metrics = tweetData.public_metrics || { like_count: 0, retweet_count: 0, reply_count: 0 }

      await prisma.unclaimedTweet.create({
        data: {
          tweetId: tweetData.id,
          content: tweetData.text,
          authorUsername: tweetData.user.username,
          authorId: tweetData.user.id,
          likes: metrics.like_count,
          retweets: metrics.retweet_count,
          replies: metrics.reply_count,
          createdAt: new Date(tweetData.created_at),
          source: source,
        },
      })
    } catch (error) {
      // Handle duplicate key errors gracefully
      if (error instanceof Error && error.message.includes('unique constraint')) {
        console.log(`Unclaimed tweet ${tweetData.id} already exists`)
      } else {
        throw error
      }
    }
  }

  /**
   * Log tracking results for monitoring
   */
  async logTrackingResult(result: TrackingResult): Promise<void> {
    try {
      await prisma.trackingLog.create({
        data: {
          method: result.method,
          success: result.success,
          tweetsFound: result.tweetsFound,
          error: result.error,
          duration: result.duration,
          metadata: {
            timestamp: new Date().toISOString(),
            keywords: this.keywords,
          },
        },
      })
    } catch (error) {
      console.error('Error logging tracking result:', error)
    }
  }

  /**
   * Check if text contains required keywords
   */
  containsKeywords(text: string): boolean {
    if (!text) return false
    const lowerText = text.toLowerCase()
    return this.keywords.some(keyword =>
      lowerText.includes(keyword.toLowerCase())
    )
  }

  /**
   * Extract tweet ID from URL
   */
  extractTweetId(url: string): string | null {
    const match = url.match(/status\/(\d+)/)
    return match ? match[1] : null
  }

  /**
   * Calculate points for tweet engagement
   */
  calculatePoints(tweetData: TweetData): number {
    const metrics = tweetData.public_metrics || { like_count: 0, retweet_count: 0, reply_count: 0 }
    return calculatePoints({ likes: metrics.like_count, retweets: metrics.retweet_count, comments: metrics.reply_count })
  }

  /**
   * Get tracking statistics
   */
  async getTrackingStats(hours: number = 24): Promise<{
    totalTweets: number
    claimedTweets: number
    unclaimedTweets: number
    methodStats: Array<{ method: string; success: number; total: number }>
  }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)

    const [totalTweets, claimedTweets, unclaimedTweets, methodLogs] = await Promise.all([
      prisma.tweet.count({
        where: { discoveredAt: { gte: since } }
      }),
      prisma.tweet.count({
        where: {
          discoveredAt: { gte: since },
          isAutoDiscovered: true
        }
      }),
      prisma.unclaimedTweet.count({
        where: { discoveredAt: { gte: since } }
      }),
      prisma.trackingLog.groupBy({
        by: ['method'],
        where: { timestamp: { gte: since } },
        _count: { _all: true },
        _sum: { tweetsFound: true }
      })
    ])

    const methodStats = methodLogs.map(log => ({
      method: log.method,
      success: log._sum.tweetsFound || 0,
      total: log._count._all
    }))

    return {
      totalTweets,
      claimedTweets,
      unclaimedTweets,
      methodStats
    }
  }

  /**
   * Start the tracking system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Tweet tracking system is already running')
      return
    }

    this.isRunning = true
    console.log('🚀 Starting Twitter API tweet tracking system...')

    // Initialize Twitter API monitoring
    await this.setupTwitterApiMonitoring()

    console.log('✅ Tweet tracking system is now active!')
    console.log('📊 Monitoring method: Twitter API v1.1 only')
    console.log('⏰ Search interval: Every 60 minutes (prevents rate limit exhaustion)')
  }

  /**
   * Stop the tracking system
   */
  async stop(): Promise<void> {
    this.isRunning = false
    console.log('🛑 Tweet tracking system stopped')
  }

  /**
   * Get system status
   */
  getStatus(): {
    isRunning: boolean
    keywords: string[]
    currentMethod: string
    trackedUsers: number
    lastSearchTime: number
  } {
    return {
      isRunning: this.isRunning,
      keywords: this.keywords,
      currentMethod: 'twitter-api',
      trackedUsers: this.trackedUsers.size,
      lastSearchTime: this.lastSearchTime
    }
  }
}

// Export singleton instance
let tweetTrackerInstance: TweetTracker | null = null

export function getTweetTrackerInstance(): TweetTracker {
  if (!tweetTrackerInstance) {
    tweetTrackerInstance = new TweetTracker()
  }
  return tweetTrackerInstance
}

export default TweetTracker
