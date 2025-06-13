/**
 * Enhanced Leaderboard Service using oEmbed API
 * Provides leaderboard with live tweet content without rate limits
 */

import { PrismaClient } from '@prisma/client'
import { getTieredCache } from './tiered-cache'

interface LeaderboardUser {
  id: string
  name: string
  xUsername: string
  image: string
  totalPoints: number
  rank: number
  tweetsCount: number
  latestTweet?: {
    content: string
    url: string
    author: string
    createdAt: string
  }
}

interface OEmbedTweetData {
  content: string
  author: string
  authorUrl: string
  html: string
  url: string
}

export class OEmbedLeaderboardService {
  private prisma: PrismaClient
  private cache: any
  private readonly CACHE_TTL = 10 * 60 * 1000 // 10 minutes
  private readonly BATCH_SIZE = 10 // Process 10 tweets concurrently

  constructor() {
    this.prisma = new PrismaClient()
    this.cache = getTieredCache()
  }

  /**
   * Get enhanced leaderboard with latest tweet content via oEmbed
   */
  async getEnhancedLeaderboard(limit: number = 20): Promise<LeaderboardUser[]> {
    const cacheKey = `enhanced_leaderboard:${limit}`
    
    // Try cache first
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      console.log('📋 Returning cached enhanced leaderboard')
      return cached
    }

    console.log('🔍 Fetching enhanced leaderboard with live tweets')

    // 1. Get basic leaderboard from database
    const users = await this.getBasicLeaderboard(limit)

    // 2. Get latest tweet URL for each user
    const usersWithTweetUrls = await this.attachLatestTweetUrls(users)

    // 3. Fetch live tweet content via oEmbed (no rate limits!)
    const enhancedUsers = await this.enrichWithLiveTweets(usersWithTweetUrls)

    // Cache the result
    await this.cache.set(cacheKey, enhancedUsers, this.CACHE_TTL)

    return enhancedUsers
  }

  /**
   * Get recent tweets with live content via oEmbed
   */
  async getRecentTweetsWithLiveContent(limit: number = 20): Promise<any[]> {
    const cacheKey = `recent_tweets_live:${limit}`
    
    // Try cache first
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      console.log('📋 Returning cached recent tweets with live content')
      return cached
    }

    console.log('🔍 Fetching recent tweets with live content')

    // 1. Get recent tweet URLs from database
    const tweetRecords = await this.prisma.tweet.findMany({
      select: {
        id: true,
        url: true,
        userId: true,
        submittedAt: true,
        user: {
          select: {
            name: true,
            xUsername: true,
            image: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' },
      take: limit
    })

    // 2. Fetch live content via oEmbed
    const liveTweets = await this.batchFetchTweetContent(
      tweetRecords.map(record => ({
        url: record.url,
        metadata: record
      }))
    )

    // Cache the result
    await this.cache.set(cacheKey, liveTweets, this.CACHE_TTL)

    return liveTweets
  }

  /**
   * Get user's tweets with live content
   */
  async getUserTweetsWithLiveContent(userId: string, limit: number = 10): Promise<any[]> {
    const cacheKey = `user_tweets_live:${userId}:${limit}`
    
    // Try cache first
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Get user's tweet URLs from database
    const userTweetUrls = await this.prisma.tweet.findMany({
      where: { userId },
      select: { url: true, submittedAt: true },
      orderBy: { submittedAt: 'desc' },
      take: limit
    })

    // Fetch live content for each tweet
    const liveTweets = await this.batchFetchTweetContent(
      userTweetUrls.map(record => ({
        url: record.url,
        metadata: { submittedAt: record.submittedAt }
      }))
    )

    // Cache the result
    await this.cache.set(cacheKey, liveTweets, this.CACHE_TTL)

    return liveTweets
  }

  /**
   * Batch fetch tweet content via oEmbed (no rate limits!)
   */
  private async batchFetchTweetContent(tweets: { url: string; metadata: any }[]): Promise<any[]> {
    const results: any[] = []
    
    // Process in batches to be polite to the oEmbed service
    const batches = this.chunkArray(tweets, this.BATCH_SIZE)
    
    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(async (tweet) => {
          try {
            const liveData = await this.fetchTweetViaOEmbed(tweet.url)
            return {
              ...tweet.metadata,
              url: tweet.url,
              liveContent: liveData,
              success: true
            }
          } catch (error) {
            console.error(`Failed to fetch tweet ${tweet.url}:`, error)
            return {
              ...tweet.metadata,
              url: tweet.url,
              liveContent: null,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        })
      )
      
      // Add successful results
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        }
      })
      
      // Small delay between batches for politeness
      if (batches.indexOf(batch) < batches.length - 1) {
        await this.delay(100)
      }
    }
    
    return results
  }

  /**
   * Fetch individual tweet via oEmbed API
   */
  private async fetchTweetViaOEmbed(tweetUrl: string): Promise<OEmbedTweetData> {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`
    
    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LayerEdge/1.0)',
      },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`oEmbed request failed: ${response.status}`)
    }

    const oembedData = await response.json()
    
    // Extract username from author_url (using our fixed logic)
    const authorUsername = this.extractUsernameFromAuthorUrl(oembedData.author_url) || 
                          this.extractUsernameFromUrl(tweetUrl) || 
                          oembedData.author_name || 
                          'Unknown'

    return {
      content: this.extractTextFromHtml(oembedData.html || ''),
      author: authorUsername,
      authorUrl: oembedData.author_url || '',
      html: oembedData.html || '',
      url: tweetUrl
    }
  }

  /**
   * Get basic leaderboard from database
   */
  private async getBasicLeaderboard(limit: number): Promise<LeaderboardUser[]> {
    const users = await this.prisma.user.findMany({
      where: { totalPoints: { gt: 0 } },
      select: {
        id: true,
        name: true,
        xUsername: true,
        image: true,
        totalPoints: true,
        _count: {
          select: { tweets: true }
        }
      },
      orderBy: { totalPoints: 'desc' },
      take: limit
    })

    return users.map((user, index) => ({
      ...user,
      rank: index + 1,
      tweetsCount: user._count.tweets
    }))
  }

  /**
   * Attach latest tweet URLs to users
   */
  private async attachLatestTweetUrls(users: LeaderboardUser[]): Promise<LeaderboardUser[]> {
    const userIds = users.map(user => user.id)
    
    // Get latest tweet for each user
    const latestTweets = await this.prisma.tweet.findMany({
      where: { userId: { in: userIds } },
      select: {
        userId: true,
        url: true,
        submittedAt: true
      },
      orderBy: { submittedAt: 'desc' },
      distinct: ['userId']
    })

    // Create a map for quick lookup
    const tweetMap = new Map(latestTweets.map(tweet => [tweet.userId, tweet]))

    // Attach latest tweet URL to each user
    return users.map(user => ({
      ...user,
      latestTweetUrl: tweetMap.get(user.id)?.url
    }))
  }

  /**
   * Enrich users with live tweet content
   */
  private async enrichWithLiveTweets(users: any[]): Promise<LeaderboardUser[]> {
    const usersWithTweets = users.filter(user => user.latestTweetUrl)
    
    if (usersWithTweets.length === 0) {
      return users
    }

    // Fetch live tweet content
    const liveTweets = await this.batchFetchTweetContent(
      usersWithTweets.map(user => ({
        url: user.latestTweetUrl,
        metadata: { userId: user.id }
      }))
    )

    // Create a map for quick lookup
    const tweetContentMap = new Map(
      liveTweets
        .filter(tweet => tweet.success)
        .map(tweet => [tweet.userId, tweet.liveContent])
    )

    // Attach live tweet content to users
    return users.map(user => {
      const liveContent = tweetContentMap.get(user.id)
      return {
        ...user,
        latestTweet: liveContent ? {
          content: liveContent.content,
          url: user.latestTweetUrl,
          author: liveContent.author,
          createdAt: new Date().toISOString() // oEmbed doesn't provide exact timestamp
        } : undefined
      }
    })
  }

  /**
   * Helper methods
   */
  private extractUsernameFromAuthorUrl(authorUrl: string): string | null {
    if (!authorUrl) return null
    try {
      const match = authorUrl.match(/(?:twitter\.com|x\.com)\/([^\/\?]+)/)
      return match ? match[1] : null
    } catch (error) {
      return null
    }
  }

  private extractUsernameFromUrl(tweetUrl: string): string | null {
    if (!tweetUrl) return null
    try {
      const match = tweetUrl.match(/(?:twitter\.com|x\.com)\/([^\/]+)\/status\//)
      return match ? match[1] : null
    } catch (error) {
      return null
    }
  }

  private extractTextFromHtml(html: string): string {
    try {
      const textMatch = html.match(/<p[^>]*>(.*?)<\/p>/s)
      if (textMatch) {
        return textMatch[1].replace(/<[^>]*>/g, '').trim()
      }
      return ''
    } catch (error) {
      return ''
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton instance
let oembedLeaderboardService: OEmbedLeaderboardService | null = null

export function getOEmbedLeaderboardService(): OEmbedLeaderboardService {
  if (!oembedLeaderboardService) {
    oembedLeaderboardService = new OEmbedLeaderboardService()
  }
  return oembedLeaderboardService
}
