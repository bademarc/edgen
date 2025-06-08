/**
 * Enhanced X API Service for LayerEdge Community Platform
 * Uses new X API credentials for authentication and tweet fetching
 * Supports user login verification and tweet data retrieval
 */

import { TwitterApi, TwitterApiReadOnly, TweetV2, UserV2 } from 'twitter-api-v2'

export interface XApiConfig {
  apiKey: string
  apiSecret: string
  bearerToken?: string
  accessToken?: string
  accessSecret?: string
}

export interface XTweetData {
  id: string
  content: string
  author: {
    id: string
    username: string
    name: string
    verified: boolean
    profileImage?: string
    followersCount: number
    followingCount: number
  }
  engagement: {
    likes: number
    retweets: number
    replies: number
    quotes: number
  }
  createdAt: Date
  isFromLayerEdgeCommunity: boolean
  url: string
}

export interface XUserData {
  id: string
  username: string
  name: string
  verified: boolean
  description?: string
  location?: string
  website?: string
  profileImage?: string
  bannerImage?: string
  followersCount: number
  followingCount: number
  tweetCount: number
  joinDate?: Date
}

export class XApiService {
  private client: TwitterApiReadOnly
  private config: XApiConfig
  private isAuthenticated: boolean = false

  constructor(config?: Partial<XApiConfig>) {
    this.config = {
      apiKey: process.env.TWITTER_API_KEY || '',
      apiSecret: process.env.TWITTER_API_SECRET || '',
      bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
      accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
      accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
      ...config
    }

    if (!this.config.apiKey || !this.config.apiSecret) {
      throw new Error('X API credentials are required (API Key and API Secret)')
    }

    // Initialize Twitter API client
    try {
      if (this.config.bearerToken) {
        // Use Bearer Token for app-only authentication
        this.client = new TwitterApi(this.config.bearerToken).readOnly
        this.isAuthenticated = true
        console.log('✅ X API initialized with Bearer Token')
      } else {
        // Use API Key/Secret for app authentication
        this.client = new TwitterApi({
          appKey: this.config.apiKey,
          appSecret: this.config.apiSecret,
        }).readOnly
        this.isAuthenticated = true
        console.log('✅ X API initialized with API Key/Secret')
      }
    } catch (error) {
      console.error('❌ Failed to initialize X API:', error)
      throw new Error(`X API initialization failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Verify API connection and credentials
   */
  async verifyConnection(): Promise<boolean> {
    try {
      console.log('🔍 Verifying X API connection...')
      
      // Test API connection by fetching API rate limits
      const rateLimits = await this.client.v2.rateLimits()
      
      if (rateLimits) {
        console.log('✅ X API connection verified successfully')
        console.log(`📊 Rate limits available: ${Object.keys(rateLimits.resources).length} endpoints`)
        return true
      }
      
      return false
    } catch (error) {
      console.error('❌ X API connection verification failed:', error)
      return false
    }
  }

  /**
   * Get user information by username
   */
  async getUserByUsername(username: string): Promise<XUserData | null> {
    try {
      console.log(`👤 Fetching user data for: @${username}`)
      
      const user = await this.client.v2.userByUsername(username, {
        'user.fields': [
          'id',
          'name',
          'username',
          'verified',
          'description',
          'location',
          'url',
          'profile_image_url',
          'public_metrics',
          'created_at'
        ]
      })

      if (!user.data) {
        console.log(`❌ User not found: @${username}`)
        return null
      }

      const userData: XUserData = {
        id: user.data.id,
        username: user.data.username,
        name: user.data.name,
        verified: user.data.verified || false,
        description: user.data.description,
        location: user.data.location,
        website: user.data.url,
        profileImage: user.data.profile_image_url,
        followersCount: user.data.public_metrics?.followers_count || 0,
        followingCount: user.data.public_metrics?.following_count || 0,
        tweetCount: user.data.public_metrics?.tweet_count || 0,
        joinDate: user.data.created_at ? new Date(user.data.created_at) : undefined
      }

      console.log(`✅ User data fetched for @${username}`)
      return userData
    } catch (error) {
      console.error(`❌ Error fetching user @${username}:`, error)
      return null
    }
  }

  /**
   * Verify user login by checking if user exists and is accessible
   */
  async verifyUserLogin(username: string): Promise<{ success: boolean; user?: XUserData; error?: string }> {
    try {
      console.log(`🔐 Verifying login for user: @${username}`)
      
      const userData = await this.getUserByUsername(username)
      
      if (userData) {
        console.log(`✅ Login verified for @${username}`)
        return {
          success: true,
          user: userData
        }
      } else {
        return {
          success: false,
          error: `User @${username} not found or not accessible`
        }
      }
    } catch (error) {
      console.error(`❌ Login verification failed for @${username}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get tweet data by tweet ID
   */
  async getTweetById(tweetId: string): Promise<XTweetData | null> {
    try {
      console.log(`🐦 Fetching tweet data for ID: ${tweetId}`)
      
      const tweet = await this.client.v2.singleTweet(tweetId, {
        expansions: ['author_id'],
        'tweet.fields': [
          'id',
          'text',
          'created_at',
          'public_metrics',
          'author_id',
          'context_annotations'
        ],
        'user.fields': [
          'id',
          'name',
          'username',
          'verified',
          'profile_image_url',
          'public_metrics'
        ]
      })

      if (!tweet.data) {
        console.log(`❌ Tweet not found: ${tweetId}`)
        return null
      }

      // Get author information
      const author = tweet.includes?.users?.[0]
      
      if (!author) {
        console.log(`❌ Tweet author not found for tweet: ${tweetId}`)
        return null
      }

      const tweetData: XTweetData = {
        id: tweet.data.id,
        content: tweet.data.text,
        author: {
          id: author.id,
          username: author.username,
          name: author.name,
          verified: author.verified || false,
          profileImage: author.profile_image_url,
          followersCount: author.public_metrics?.followers_count || 0,
          followingCount: author.public_metrics?.following_count || 0
        },
        engagement: {
          likes: tweet.data.public_metrics?.like_count || 0,
          retweets: tweet.data.public_metrics?.retweet_count || 0,
          replies: tweet.data.public_metrics?.reply_count || 0,
          quotes: tweet.data.public_metrics?.quote_count || 0
        },
        createdAt: tweet.data.created_at ? new Date(tweet.data.created_at) : new Date(),
        isFromLayerEdgeCommunity: this.checkLayerEdgeCommunity(tweet.data.text),
        url: `https://x.com/${author.username}/status/${tweet.data.id}`
      }

      console.log(`✅ Tweet data fetched for ID: ${tweetId}`)
      return tweetData
    } catch (error) {
      console.error(`❌ Error fetching tweet ${tweetId}:`, error)
      return null
    }
  }

  /**
   * Get tweet data by URL
   */
  async getTweetByUrl(tweetUrl: string): Promise<XTweetData | null> {
    try {
      const tweetId = this.extractTweetId(tweetUrl)
      if (!tweetId) {
        throw new Error('Invalid tweet URL format')
      }
      
      return await this.getTweetById(tweetId)
    } catch (error) {
      console.error(`❌ Error fetching tweet from URL ${tweetUrl}:`, error)
      return null
    }
  }

  /**
   * Get user's recent tweets
   */
  async getUserTweets(username: string, maxResults: number = 10): Promise<XTweetData[]> {
    try {
      console.log(`📝 Fetching recent tweets for @${username}`)
      
      // First get user ID
      const user = await this.getUserByUsername(username)
      if (!user) {
        console.log(`❌ User not found: @${username}`)
        return []
      }

      // Get user's tweets
      const tweets = await this.client.v2.userTimeline(user.id, {
        max_results: Math.min(maxResults, 100), // API limit
        'tweet.fields': [
          'id',
          'text',
          'created_at',
          'public_metrics',
          'context_annotations'
        ]
      })

      const tweetData: XTweetData[] = []

      for (const tweet of tweets.data.data || []) {
        const xTweetData: XTweetData = {
          id: tweet.id,
          content: tweet.text,
          author: {
            id: user.id,
            username: user.username,
            name: user.name,
            verified: user.verified,
            profileImage: user.profileImage,
            followersCount: user.followersCount,
            followingCount: user.followingCount
          },
          engagement: {
            likes: tweet.public_metrics?.like_count || 0,
            retweets: tweet.public_metrics?.retweet_count || 0,
            replies: tweet.public_metrics?.reply_count || 0,
            quotes: tweet.public_metrics?.quote_count || 0
          },
          createdAt: tweet.created_at ? new Date(tweet.created_at) : new Date(),
          isFromLayerEdgeCommunity: this.checkLayerEdgeCommunity(tweet.text),
          url: `https://x.com/${user.username}/status/${tweet.id}`
        }

        tweetData.push(xTweetData)
      }

      console.log(`✅ Fetched ${tweetData.length} tweets for @${username}`)
      return tweetData
    } catch (error) {
      console.error(`❌ Error fetching tweets for @${username}:`, error)
      return []
    }
  }

  /**
   * Check if content is related to LayerEdge community
   */
  private checkLayerEdgeCommunity(content: string): boolean {
    const contentLower = content.toLowerCase()
    return contentLower.includes('@layeredge') || 
           contentLower.includes('$edgen') || 
           contentLower.includes('#layeredge') ||
           contentLower.includes('layeredge')
  }

  /**
   * Extract tweet ID from URL
   */
  private extractTweetId(url: string): string | null {
    const match = url.match(/status\/(\d+)/)
    return match ? match[1] : null
  }

  /**
   * Get API rate limit status
   */
  async getRateLimitStatus(): Promise<any> {
    try {
      const rateLimits = await this.client.v2.rateLimits()
      return rateLimits
    } catch (error) {
      console.error('❌ Error getting rate limit status:', error)
      return null
    }
  }

  /**
   * Check if API is authenticated and working
   */
  isReady(): boolean {
    return this.isAuthenticated && this.client !== null
  }

  /**
   * Get service status
   */
  getStatus(): {
    authenticated: boolean
    apiKey: string
    hasBearer: boolean
    ready: boolean
  } {
    return {
      authenticated: this.isAuthenticated,
      apiKey: this.config.apiKey ? `${this.config.apiKey.substring(0, 8)}...` : 'Not set',
      hasBearer: !!this.config.bearerToken,
      ready: this.isReady()
    }
  }
}

// Singleton instance
let xApiServiceInstance: XApiService | null = null

/**
 * Get X API service instance
 */
export function getXApiService(): XApiService {
  if (!xApiServiceInstance) {
    xApiServiceInstance = new XApiService()
  }
  return xApiServiceInstance
}

/**
 * Initialize X API service with custom config
 */
export function initializeXApiService(config: Partial<XApiConfig>): XApiService {
  xApiServiceInstance = new XApiService(config)
  return xApiServiceInstance
}
