import { TwitterApi, TwitterApiReadOnly, TweetV2, UserV2 } from 'twitter-api-v2'

export interface XApiConfig {
  bearerToken: string
  apiKey?: string
  apiSecret?: string
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
  profileImage?: string
  followersCount: number
  followingCount: number
  description?: string
  location?: string
  url?: string
  createdAt?: Date
}

export class SimplifiedXApiService {
  private client: TwitterApiReadOnly | null = null
  private config: XApiConfig
  private isAuthenticated: boolean = false

  constructor() {
    // Initialize configuration from environment variables
    this.config = {
      bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
      apiKey: process.env.TWITTER_API_KEY,
      apiSecret: process.env.TWITTER_API_SECRET,
    }

    this.initialize()
  }

  private initialize(): void {
    try {
      // Validate bearer token format
      if (!this.config.bearerToken) {
        throw new Error('TWITTER_BEARER_TOKEN is required')
      }

      // Basic bearer token format validation
      if (this.config.bearerToken.length < 50) {
        console.warn('⚠️ Bearer token seems too short, please verify it\'s correct')
      }

      // Initialize Twitter API client with Bearer Token
      this.client = new TwitterApi(this.config.bearerToken).readOnly
      this.isAuthenticated = true
      console.log('✅ Simplified X API initialized with Bearer Token')

    } catch (error) {
      console.error('❌ Failed to initialize X API:', error)
      this.isAuthenticated = false
      throw new Error(`X API initialization failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Check if the service is ready to make API calls
   */
  isReady(): boolean {
    return this.isAuthenticated && this.client !== null
  }

  /**
   * Get tweet by ID
   */
  async getTweetById(tweetId: string): Promise<XTweetData | null> {
    if (!this.isReady()) {
      throw new Error('X API service not ready')
    }

    try {
      console.log(`🐦 Fetching tweet: ${tweetId}`)

      const tweet = await this.client!.v2.singleTweet(tweetId, {
        'tweet.fields': [
          'public_metrics',
          'created_at',
          'author_id',
          'text'
        ],
        'user.fields': [
          'username',
          'name',
          'verified',
          'profile_image_url',
          'public_metrics'
        ],
        expansions: ['author_id']
      })

      if (!tweet.data) {
        console.log(`❌ Tweet not found: ${tweetId}`)
        return null
      }

      // Get author information
      const author = tweet.includes?.users?.[0]
      if (!author) {
        console.log(`❌ Author not found for tweet: ${tweetId}`)
        return null
      }

      const xTweetData: XTweetData = {
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

      console.log(`✅ Tweet fetched successfully: ${tweetId}`)
      return xTweetData

    } catch (error) {
      console.error(`❌ Error fetching tweet ${tweetId}:`, error)
      
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          throw new Error('Rate limit exceeded. Please try again later.')
        }
        if (error.message.includes('authorization')) {
          throw new Error('Twitter API authorization failed. Please check credentials.')
        }
        if (error.message.includes('not found')) {
          return null
        }
      }
      
      throw new Error(`Failed to fetch tweet: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Get user information by username
   */
  async getUserByUsername(username: string): Promise<XUserData | null> {
    if (!this.isReady()) {
      throw new Error('X API service not ready')
    }

    try {
      console.log(`👤 Fetching user data for: @${username}`)
      
      const user = await this.client!.v2.userByUsername(username, {
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
        profileImage: user.data.profile_image_url,
        followersCount: user.data.public_metrics?.followers_count || 0,
        followingCount: user.data.public_metrics?.following_count || 0,
        description: user.data.description,
        location: user.data.location,
        url: user.data.url,
        createdAt: user.data.created_at ? new Date(user.data.created_at) : undefined
      }

      console.log(`✅ User data fetched successfully: @${username}`)
      return userData

    } catch (error) {
      console.error(`❌ Error fetching user @${username}:`, error)
      
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          throw new Error('Rate limit exceeded. Please try again later.')
        }
        if (error.message.includes('authorization')) {
          throw new Error('Twitter API authorization failed. Please check credentials.')
        }
        if (error.message.includes('not found')) {
          return null
        }
      }
      
      throw new Error(`Failed to fetch user: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Verify user login by checking if user exists
   */
  async verifyUserLogin(username: string): Promise<{
    success: boolean
    user?: XUserData & { tweetCount?: number; joinDate?: Date }
    error?: string
  }> {
    try {
      console.log(`🔐 Verifying login for user: @${username}`)

      const user = await this.getUserByUsername(username)
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      // Get additional user stats if needed
      const enhancedUser = {
        ...user,
        tweetCount: 0, // Could be fetched from user timeline if needed
        joinDate: user.createdAt
      }

      return {
        success: true,
        user: enhancedUser
      }

    } catch (error) {
      console.error(`❌ Error verifying login for @${username}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get user tweets by username
   */
  async getUserTweets(username: string, maxResults: number = 10): Promise<XTweetData[]> {
    if (!this.isReady()) {
      throw new Error('X API service not ready')
    }

    try {
      console.log(`📝 Fetching tweets for user: @${username}`)

      // First get user data
      const user = await this.getUserByUsername(username)
      if (!user) {
        console.log(`❌ User not found: @${username}`)
        return []
      }

      // Get user's tweets
      const tweets = await this.client!.v2.userTimeline(user.id, {
        max_results: Math.min(maxResults, 100), // API limit
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
        ],
        expansions: ['author_id']
      })

      if (!tweets.data?.data || tweets.data.data.length === 0) {
        console.log(`❌ No tweets found for user: @${username}`)
        return []
      }

      const tweetData: XTweetData[] = []

      for (const tweet of tweets.data.data) {
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

      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          throw new Error('Rate limit exceeded. Please try again later.')
        }
        if (error.message.includes('authorization')) {
          throw new Error('Twitter API authorization failed. Please check credentials.')
        }
      }

      throw new Error(`Failed to fetch user tweets: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Extract tweet ID from URL
   */
  extractTweetId(tweetUrl: string): string | null {
    try {
      // Handle various Twitter/X URL formats
      const patterns = [
        /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
        /(?:twitter\.com|x\.com)\/\w+\/statuses\/(\d+)/,
        /status\/(\d+)/,
        /statuses\/(\d+)/
      ]

      for (const pattern of patterns) {
        const match = tweetUrl.match(pattern)
        if (match && match[1]) {
          return match[1]
        }
      }

      return null
    } catch (error) {
      console.error('Error extracting tweet ID:', error)
      return null
    }
  }

  /**
   * Check if tweet content is related to LayerEdge community
   */
  private checkLayerEdgeCommunity(content: string): boolean {
    const keywords = [
      '@layeredge',
      'layeredge',
      '$edgen',
      'edgen',
      '#layeredge',
      '#edgen'
    ]

    const lowerContent = content.toLowerCase()
    return keywords.some(keyword => lowerContent.includes(keyword.toLowerCase()))
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.isReady()) {
      return false
    }

    try {
      // Simple test by fetching API rate limit status
      await this.client!.v2.userByUsername('twitter')
      console.log('✅ X API connection test successful')
      return true
    } catch (error) {
      console.error('❌ X API connection test failed:', error)
      return false
    }
  }
}

// Singleton instance
let simplifiedXApiService: SimplifiedXApiService | null = null

export function getSimplifiedXApiService(): SimplifiedXApiService {
  if (!simplifiedXApiService) {
    simplifiedXApiService = new SimplifiedXApiService()
  }
  return simplifiedXApiService
}
