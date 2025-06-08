import { PrismaClient } from '@prisma/client'
import { exec } from 'child_process'
import { promisify } from 'util'
import cron from 'node-cron'
import { calculatePoints } from './utils'
import { TwitterApiService } from './twitter-api'
import { getFallbackService } from './fallback-service'
import { getWebScraperInstance } from './web-scraper'

const prisma = new PrismaClient()
const execAsync = promisify(exec)

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
  private fallbackService: ReturnType<typeof getFallbackService>
  private webScraper: ReturnType<typeof getWebScraperInstance>
  private currentScraperIndex: number
  private scrapers: Array<{
    name: string
    method: () => Promise<TweetData[]>
  }>

  constructor() {
    this.keywords = ['$Edgen', 'LayerEdge', '#Edgen', '#LayerEdge', '@layeredge', '$EDGEN']
    this.trackedUsers = new Set()
    this.isRunning = false
    this.currentScraperIndex = 0

    // Initialize services
    this.twitterApi = new TwitterApiService()
    this.fallbackService = getFallbackService()
    this.webScraper = getWebScraperInstance()

    // ENHANCED FALLBACK: Official Scweet v3.0+ → Twikit → Twscrape → Basic Fallback
    this.scrapers = [
      { name: 'scweet', method: this.scrapeWithScweet.bind(this) },
      { name: 'twikit', method: this.scrapeWithTwikit.bind(this) },
      { name: 'twscrape', method: this.scrapeWithTwscrape.bind(this) },
      { name: 'fallback', method: this.scrapeWithFallback.bind(this) },
    ]
  }

  /**
   * Method 1: Web Scraping with twscrape (Primary)
   */
  async scrapeWithTwscrape(): Promise<TweetData[]> {
    try {
      const query = this.keywords.join(' OR ')
      console.log(`🔍 Scraping with twscrape: ${query}`)

      const { stdout } = await execAsync(`twscrape search "${query}" --limit 50`)

      if (!stdout.trim()) {
        console.log('No output from twscrape')
        return []
      }

      // Parse twscrape output - it returns one JSON object per line
      const lines = stdout.trim().split('\n').filter(line => line.trim())
      const tweets: TweetData[] = []

      for (const line of lines) {
        try {
          const tweet = JSON.parse(line) as TweetData
          tweets.push(tweet)
        } catch {
          console.log('Failed to parse twscrape line:', line.substring(0, 100))
        }
      }

      const filteredTweets = tweets.filter((tweet: TweetData) =>
        !tweet.user?.protected && // Only public tweets
        this.containsKeywords(tweet.text || '')
      )

      console.log(`✅ twscrape found ${filteredTweets.length} valid tweets`)
      return filteredTweets
    } catch (error) {
      console.error('Twscrape error:', error)
      return []
    }
  }

  /**
   * Method 2: Official Scweet v3.0+ Scraping (PRIMARY - Replaces RSS/Nitter)
   */
  async scrapeWithScweet(): Promise<TweetData[]> {
    try {
      console.log('🔍 Scraping with Official Scweet v3.0+')

      // Use fallback service which now prioritizes Scweet
      const scweetResults = await this.fallbackService.getTweetData('https://x.com/search?q=' + encodeURIComponent('$Edgen OR LayerEdge'))

      if (scweetResults) {
        // Convert FallbackTweetData to TweetData format
        const tweets: TweetData[] = [{
          id: scweetResults.id,
          text: scweetResults.content,
          user: {
            id: scweetResults.author.id,
            username: scweetResults.author.username,
            name: scweetResults.author.name,
            protected: false
          },
          public_metrics: {
            like_count: scweetResults.likes,
            retweet_count: scweetResults.retweets,
            reply_count: scweetResults.replies
          },
          created_at: scweetResults.createdAt.toISOString()
        }]

        console.log(`✅ Official Scweet found ${tweets.length} tweets`)
        return tweets.filter(tweet => this.containsKeywords(tweet.text || ''))
      }

      return []
    } catch (error) {
      console.error('Official Scweet scraping error:', error)
      return []
    }
  }

  /**
   * Method 3: Twikit Scraping (SECONDARY FALLBACK)
   */
  async scrapeWithTwikit(): Promise<TweetData[]> {
    try {
      console.log('🔍 Scraping with Twikit (enhanced fallback)')

      // Use fallback service to try Twikit specifically
      // This will attempt to get tweets using the Twikit service
      const twikitResults = await this.fallbackService.getTweetData('https://x.com/search?q=' + encodeURIComponent('$Edgen OR LayerEdge'))

      if (twikitResults && twikitResults.source === 'twikit') {
        // Convert FallbackTweetData to TweetData format
        const tweets: TweetData[] = [{
          id: twikitResults.id,
          text: twikitResults.content,
          user: {
            id: twikitResults.author.id,
            username: twikitResults.author.username,
            name: twikitResults.author.name,
            protected: false
          },
          public_metrics: {
            like_count: twikitResults.likes,
            retweet_count: twikitResults.retweets,
            reply_count: twikitResults.replies
          },
          created_at: twikitResults.createdAt.toISOString()
        }]

        console.log(`✅ Twikit found ${tweets.length} tweets`)
        return tweets.filter(tweet => this.containsKeywords(tweet.text || ''))
      }

      return []
    } catch (error) {
      console.error('Twikit scraping error:', error)
      return []
    }
  }

  /**
   * Method 4: Fallback Web Scraping (LAST RESORT)
   */
  async scrapeWithFallback(): Promise<TweetData[]> {
    try {
      console.log('🔍 Using fallback web scraping (last resort)')

      // Use the web scraper directly as final fallback
      const tweets = await this.webScraper.scrapeTweetData('https://x.com/search?q=' + encodeURIComponent('$Edgen OR LayerEdge'))

      if (tweets) {
        // Convert single tweet to array format
        const tweetArray: TweetData[] = [{
          id: tweets.id,
          text: tweets.content,
          user: {
            id: tweets.author.id,
            username: tweets.author.username,
            name: tweets.author.name,
            protected: false
          },
          public_metrics: {
            like_count: tweets.likes,
            retweet_count: tweets.retweets,
            reply_count: tweets.replies
          },
          created_at: tweets.createdAt.toISOString()
        }]

        console.log(`✅ Fallback scraping found ${tweetArray.length} tweets`)
        return tweetArray.filter(tweet => this.containsKeywords(tweet.text || ''))
      }

      return []
    } catch (error) {
      console.error('Fallback scraping error:', error)
      return []
    }
  }

  /**
   * Parse RSS/XML feed to extract tweet data
   */
  private parseRSSFeed(xml: string): TweetData[] {
    try {
      // Simple XML parsing for RSS feeds
      const tweets: TweetData[] = []
      const itemRegex = /<item>(.*?)<\/item>/gs
      const items = xml.match(itemRegex) || []

      for (const item of items) {
        try {
          const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || ''
          const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
          const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''

          // Extract tweet ID from link
          const tweetIdMatch = link.match(/status\/(\d+)/)
          if (!tweetIdMatch) continue

          const tweetId = tweetIdMatch[1]

          // Extract username from title or link
          const usernameMatch = title.match(/^([^:]+):/) || link.match(/\/([^\/]+)\/status/)
          if (!usernameMatch) continue

          const username = usernameMatch[1].replace('@', '')

          if (this.containsKeywords(title)) {
            tweets.push({
              id: tweetId,
              text: title,
              user: {
                id: username, // We don't have user ID from RSS
                username: username,
                name: username,
                protected: false
              },
              public_metrics: {
                like_count: 0,
                retweet_count: 0,
                reply_count: 0
              },
              created_at: pubDate || new Date().toISOString()
            })
          }
        } catch (err) {
          console.error('Error parsing RSS item:', err)
        }
      }

      return tweets
    } catch (error) {
      console.error('Error parsing RSS feed:', error)
      return []
    }
  }

  /**
   * Distributed scraping approach - rotate between methods
   */
  async setupDistributedScraping(): Promise<void> {
    console.log('🔄 Setting up distributed scraping system...')

    // Run different scrapers every 5 minutes to distribute load
    cron.schedule('*/5 * * * *', async () => {
      if (!this.isRunning) return

      const scraper = this.rotateScraper()
      const startTime = Date.now()

      try {
        console.log(`🚀 Running ${scraper.name} scraper...`)
        const tweets = await scraper.method()
        const duration = Date.now() - startTime

        const processedCount = await this.processTweets(tweets, scraper.name)

        // Log tracking result
        await this.logTrackingResult({
          method: scraper.name,
          success: true,
          tweetsFound: processedCount,
          duration
        })

        console.log(`✅ ${scraper.name} completed: ${processedCount} tweets processed in ${duration}ms`)
      } catch (error) {
        const duration = Date.now() - startTime
        console.error(`❌ ${scraper.name} failed:`, error)

        await this.logTrackingResult({
          method: scraper.name,
          success: false,
          tweetsFound: 0,
          error: error instanceof Error ? error.message : String(error),
          duration
        })
      }
    })
  }

  /**
   * Rotate to next scraper in the list
   */
  private rotateScraper() {
    this.currentScraperIndex = (this.currentScraperIndex + 1) % this.scrapers.length
    return this.scrapers[this.currentScraperIndex]
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
    console.log('🚀 Starting enhanced tweet tracking system...')

    // Initialize distributed scraping
    await this.setupDistributedScraping()

    console.log('✅ Tweet tracking system is now active!')
    console.log('📊 Monitoring methods: twscrape, RSS feeds, Nitter instances')
    console.log('⏰ Scraping interval: Every 5 minutes with method rotation')
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
  } {
    return {
      isRunning: this.isRunning,
      keywords: this.keywords,
      currentMethod: this.scrapers[this.currentScraperIndex]?.name || 'unknown',
      trackedUsers: this.trackedUsers.size
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
