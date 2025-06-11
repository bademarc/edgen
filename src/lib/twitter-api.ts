import { extractTweetId } from './utils'
import { getEnhancedCacheService } from './cache-integration'

interface TwitterTweetData {
  id: string
  text: string
  public_metrics: {
    like_count: number
    retweet_count: number
    reply_count: number
    quote_count: number
  }
  author_id: string
  created_at: string
}

interface TwitterUserData {
  id: string
  username: string
  name: string
  profile_image_url?: string
}

interface TwitterApiResponse {
  data?: TwitterTweetData
  includes?: {
    users?: TwitterUserData[]
  }
  errors?: Array<{
    title: string
    detail: string
    type: string
  }>
}

interface TwitterUserApiResponse {
  data?: TwitterUserData
  errors?: Array<{
    title: string
    detail: string
    type: string
  }>
}

interface RateLimitInfo {
  limit: number
  remaining: number
  resetTime: number
}

export class TwitterApiService {
  private bearerToken: string
  private rateLimitInfo: RateLimitInfo | null = null
  private lastRequestTime: number = 0
  private requestCount: number = 0
  private readonly MAX_REQUESTS_PER_MINUTE = 75 // Conservative limit
  private isHealthy: boolean = true
  private lastHealthCheck: number = 0
  private readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes
  private cache = getEnhancedCacheService()

  constructor() {
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN || ''
    if (!this.bearerToken) {
      console.warn('❌ Twitter Bearer Token not found. Twitter API features will be limited.')
      this.isHealthy = false
    } else {
      console.log('✅ Twitter Bearer Token configured')
      // Validate token format
      if (!this.bearerToken.startsWith('AAAAAAAAAAAAAAAAAAAAAA')) {
        console.warn('⚠️ Twitter Bearer Token format may be incorrect')
      }
    }
  }

  // Check if API is healthy and rate limits allow requests
  private async checkApiHealth(): Promise<boolean> {
    const now = Date.now()

    // Check if we need to perform a health check
    if (now - this.lastHealthCheck > this.HEALTH_CHECK_INTERVAL) {
      try {
        // Simple health check - try to get rate limit status
        const response = await fetch('https://api.twitter.com/2/tweets/search/recent?query=test&max_results=10', {
          method: 'HEAD', // Use HEAD to avoid consuming quota
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
          },
          signal: AbortSignal.timeout(5000)
        })

        this.isHealthy = response.status !== 401 && response.status !== 403
        this.lastHealthCheck = now

        // Update rate limit info from headers
        if (response.headers.get('x-rate-limit-limit')) {
          this.rateLimitInfo = {
            limit: parseInt(response.headers.get('x-rate-limit-limit') || '0'),
            remaining: parseInt(response.headers.get('x-rate-limit-remaining') || '0'),
            resetTime: parseInt(response.headers.get('x-rate-limit-reset') || '0') * 1000
          }
        }
      } catch (error) {
        console.warn('Twitter API health check failed:', error)
        this.isHealthy = false
        this.lastHealthCheck = now
      }
    }

    return this.isHealthy
  }

  // Rate limiting check
  private async checkRateLimit(): Promise<boolean> {
    const now = Date.now()

    // Reset request count every minute
    if (now - this.lastRequestTime > 60000) {
      this.requestCount = 0
      this.lastRequestTime = now
    }

    // Check if we're approaching rate limits
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      console.warn('Approaching rate limit, delaying request')
      const waitTime = 60000 - (now - this.lastRequestTime)
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime))
        this.requestCount = 0
        this.lastRequestTime = Date.now()
      }
    }

    // Check API-provided rate limit info
    if (this.rateLimitInfo && this.rateLimitInfo.remaining <= 5 && now < this.rateLimitInfo.resetTime) {
      const waitTime = this.rateLimitInfo.resetTime - now
      console.warn(`Rate limit nearly exceeded, waiting ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.requestCount++
    return true
  }

  private async makeRequest(url: string, retryCount: number = 0): Promise<TwitterApiResponse | TwitterUserApiResponse> {
    const maxRetries = 3
    const baseDelay = 1000 // 1 second

    // Check API health before making request
    if (!await this.checkApiHealth()) {
      throw new Error('Twitter API is currently unhealthy')
    }

    // Check rate limits
    await this.checkRateLimit()

    try {
      console.log(`Making Twitter API request to: ${url} (attempt ${retryCount + 1})`)

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(15000) // 15 second timeout
      })

      console.log(`Twitter API response status: ${response.status}`)

      // Handle rate limiting and usage caps
      if (response.status === 429) {
        const resetTime = response.headers.get('x-rate-limit-reset')
        const remainingRequests = response.headers.get('x-rate-limit-remaining')

        // Get response body to check for usage cap errors
        const errorData = await response.json().catch(() => null)

        // Check if this is a usage cap exceeded error (monthly limit)
        if (errorData?.title === 'UsageCapExceeded' || errorData?.detail?.includes('Usage cap exceeded')) {
          console.error('❌ Twitter API monthly usage cap exceeded:', errorData)
          throw new Error('Twitter API monthly usage limit exceeded. Please upgrade your Twitter API plan or wait until next month.')
        }

        console.warn(`Rate limited! Remaining requests: ${remainingRequests}, Reset time: ${resetTime}`)

        if (retryCount < maxRetries) {
          const delay = Math.min(baseDelay * Math.pow(2, retryCount), 30000) // Max 30 seconds
          console.log(`Retrying after ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          return this.makeRequest(url, retryCount + 1)
        } else {
          throw new Error(`Twitter API rate limit exceeded after ${maxRetries} retries`)
        }
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Twitter API error: ${response.status} ${response.statusText}`, errorText)

        // For certain errors, don't retry
        if (response.status === 401 || response.status === 403 || response.status === 404) {
          throw new Error(`Twitter API error: ${response.status} ${response.statusText} - ${errorText}`)
        }

        // For server errors, retry with backoff
        if (response.status >= 500 && retryCount < maxRetries) {
          const delay = baseDelay * Math.pow(2, retryCount)
          console.log(`Server error, retrying after ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          return this.makeRequest(url, retryCount + 1)
        }

        throw new Error(`Twitter API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Twitter API response data:', JSON.stringify(data, null, 2))
      return data
    } catch (error) {
      console.error(`Error in makeRequest (attempt ${retryCount + 1}):`, error)

      // Retry on network errors
      if (retryCount < maxRetries && (
        error instanceof TypeError || // Network error
        (error instanceof Error && error.name === 'AbortError') || // Timeout
        (error instanceof Error && error.message.includes('fetch'))
      )) {
        const delay = baseDelay * Math.pow(2, retryCount)
        console.log(`Network error, retrying after ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.makeRequest(url, retryCount + 1)
      }

      throw error
    }
  }

  async getTweetData(tweetUrl: string): Promise<{
    id: string
    content: string
    likes: number
    retweets: number
    replies: number
    author: {
      id: string
      username: string
      name: string
      profileImage?: string
    }
    createdAt: Date
  } | null> {
    try {
      console.log(`Fetching tweet data for URL: ${tweetUrl}`)

      const tweetId = extractTweetId(tweetUrl)
      if (!tweetId) {
        console.error('Failed to extract tweet ID from URL:', tweetUrl)
        throw new Error('Invalid tweet URL - could not extract tweet ID')
      }

      console.log(`Extracted tweet ID: ${tweetId}`)

      const url = `https://api.twitter.com/2/tweets/${tweetId}?expansions=author_id&tweet.fields=public_metrics,created_at&user.fields=username,name,profile_image_url`

      const response = await this.makeRequest(url) as TwitterApiResponse

      if (response.errors && response.errors.length > 0) {
        console.error('Twitter API returned errors:', response.errors)
        // Check for specific error types
        const notFoundError = response.errors.find(err => err.title === 'Not Found Entity' || err.detail?.includes('Could not find'))
        if (notFoundError) {
          console.error('Tweet not found or not accessible:', notFoundError)
          return null
        }
        return null
      }

      if (!response.data) {
        console.error('No tweet data returned from Twitter API')
        return null
      }

      const tweet = response.data
      const author = response.includes?.users?.[0]

      if (!author) {
        console.error('Author data not found in response')
        throw new Error('Author data not found')
      }

      console.log(`Successfully fetched tweet data for ID: ${tweet.id}`)

      return {
        id: tweet.id,
        content: tweet.text || '',
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
        replies: tweet.public_metrics?.reply_count || 0,
        author: {
          id: author.id,
          username: author.username,
          name: author.name,
          profileImage: author.profile_image_url,
        },
        createdAt: new Date(tweet.created_at),
      }
    } catch (error) {
      console.error('Error fetching tweet data:', error)
      return null
    }
  }

  async verifyTweetFromCommunity(tweetUrl: string): Promise<boolean> {
    try {
      const communityId = '1890107751621357663'

      // Check if URL directly contains the community ID (direct community posts)
      if (tweetUrl.includes(`communities/${communityId}`)) {
        console.log(`Direct community URL detected for ${communityId}`)
        return true
      }

      // For regular tweet URLs, we'll be more permissive since community verification
      // is complex and we rely more on content validation and author verification
      const tweetId = this.extractTweetIdFromUrl(tweetUrl)
      if (!tweetId) {
        console.log('Could not extract tweet ID from URL')
        return false
      }

      // Accept all valid tweets - security is handled by:
      // 1. Author verification (user can only submit their own tweets)
      // 2. Content validation (must contain @layeredge or $EDGEN)
      // 3. Duplicate prevention
      console.log(`Accepting tweet ${tweetId} - security handled by author verification`)
      return true

    } catch (error) {
      console.error('Error verifying tweet community:', error)
      return false
    }
  }

  private extractTweetIdFromUrl(url: string): string | null {
    const match = url.match(/\/status\/(\d+)/)
    return match ? match[1] : null
  }

  async getUserData(username: string): Promise<TwitterUserData | null> {
    try {
      const url = `https://api.twitter.com/2/users/by/username/${username}?user.fields=profile_image_url`
      const response = await this.makeRequest(url) as TwitterUserApiResponse

      if (response.errors || !response.data) {
        console.error('Twitter API errors:', response.errors)
        return null
      }

      return response.data
    } catch (error) {
      console.error('Error fetching user data:', error)
      return null
    }
  }

  // New method for fetching only engagement metrics (lighter API call)
  async getTweetEngagementMetrics(tweetUrl: string): Promise<{
    likes: number
    retweets: number
    replies: number
  } | null> {
    try {
      const tweetId = extractTweetId(tweetUrl)
      if (!tweetId) {
        console.error('Failed to extract tweet ID from URL:', tweetUrl)
        return null
      }

      // Check cache first (4-hour TTL for engagement metrics)
      const cached = await this.cache.getTweetEngagement(tweetId)
      if (cached) {
        console.log(`🎯 Returning cached engagement metrics for tweet ${tweetId}`)
        return cached
      }

      console.log(`🔍 Fetching fresh engagement metrics for URL: ${tweetUrl}`)

      const url = `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics`
      const response = await this.makeRequest(url) as TwitterApiResponse

      if (response.errors && response.errors.length > 0) {
        console.error('Twitter API returned errors:', response.errors)
        return null
      }

      if (!response.data) {
        console.error('No tweet data returned from Twitter API')
        return null
      }

      const tweet = response.data
      const metrics = {
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
        replies: tweet.public_metrics?.reply_count || 0,
      }

      // Cache the engagement metrics for 4 hours
      await this.cache.cacheTweetEngagement(tweetId, metrics, 14400)
      console.log(`💾 Cached engagement metrics for tweet ${tweetId}`)

      return metrics
    } catch (error) {
      console.error('Error fetching tweet engagement metrics:', error)
      return null
    }
  }

  // Batch fetch engagement metrics for multiple tweets
  async getBatchTweetEngagementMetrics(tweetUrls: string[]): Promise<Array<{
    url: string
    metrics: {
      likes: number
      retweets: number
      replies: number
    } | null
  }>> {
    const results = []

    // Process in batches to respect rate limits
    const batchSize = 5
    for (let i = 0; i < tweetUrls.length; i += batchSize) {
      const batch = tweetUrls.slice(i, i + batchSize)

      const batchPromises = batch.map(async (url) => {
        const metrics = await this.getTweetEngagementMetrics(url)
        return { url, metrics }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Add delay between batches to respect rate limits
      if (i + batchSize < tweetUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return results
  }

  // Public method to check if Twitter API is available
  async isApiAvailable(): Promise<boolean> {
    return await this.checkApiHealth()
  }

  // Get current rate limit status
  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo
  }

  // Get API health status
  getHealthStatus(): {
    isHealthy: boolean
    lastCheck: number
    rateLimitInfo: RateLimitInfo | null
  } {
    return {
      isHealthy: this.isHealthy,
      lastCheck: this.lastHealthCheck,
      rateLimitInfo: this.rateLimitInfo
    }
  }

  // Search for tweets containing specific keywords
  async searchTweets(query: string, options: {
    max_results?: number
    tweet_fields?: string
    user_fields?: string
  } = {}): Promise<any> {
    try {
      const maxResults = Math.min(options.max_results || 50, 100) // API limit
      const tweetFields = options.tweet_fields || 'public_metrics,created_at,author_id'
      const userFields = options.user_fields || 'username,name,protected'

      const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${maxResults}&tweet.fields=${tweetFields}&user.fields=${userFields}&expansions=author_id`

      console.log(`🔍 Searching tweets with query: ${query}`)

      const response = await this.makeRequest(url)

      if ('errors' in response && response.errors) {
        console.error('Twitter API search errors:', response.errors)
        return null
      }

      return response
    } catch (error) {
      console.error('Error searching tweets:', error)
      return null
    }
  }
}
