import { TwitterApiService } from './twitter-api'
import { URLValidator, validateTweetURL, URLValidationError } from './url-validator'
import { XApiService, getXApiService } from './x-api-service'

export interface FallbackTweetData {
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
  source: 'api' | 'x-api'
  isFromLayerEdgeCommunity: boolean
}

export interface FallbackEngagementMetrics {
  likes: number
  retweets: number
  replies: number
  source: 'api' | 'x-api'
  timestamp: Date
}

export interface FallbackServiceConfig {
  apiTimeoutMs: number
  maxApiRetries: number
  preferApi: boolean
  rateLimitCooldownMs: number
}

export class SimplifiedFallbackService {
  private twitterApi: TwitterApiService | null = null
  private xApiService: XApiService | null = null
  private config: FallbackServiceConfig
  private apiFailureCount: number = 0
  private lastApiFailure: Date | null = null
  private isApiRateLimited: boolean = false
  private rateLimitResetTime: Date | null = null

  constructor(config: Partial<FallbackServiceConfig> = {}) {
    // Try to initialize Twitter API
    try {
      this.twitterApi = new TwitterApiService()
      console.log('✅ Twitter API service initialized')
    } catch (error) {
      console.warn('⚠️ Twitter API service unavailable:', error instanceof Error ? error.message : String(error))
      this.twitterApi = null
    }

    // Try to initialize X API service
    try {
      this.xApiService = getXApiService()
      console.log('✅ X API service initialized')
    } catch (error) {
      console.warn('⚠️ X API service unavailable:', error instanceof Error ? error.message : String(error))
      this.xApiService = null
    }

    this.config = {
      apiTimeoutMs: 15000,
      maxApiRetries: 2,
      preferApi: process.env.PREFER_API === 'true', // Respect environment variable
      rateLimitCooldownMs: 15 * 60 * 1000, // 15 minutes
      ...config
    }

    console.log('SimplifiedFallbackService initialized')
    console.log(`Twitter API available: ${this.twitterApi !== null}, X API available: ${this.xApiService !== null}`)
  }

  private shouldUseApi(): boolean {
    // PRODUCTION FIX: Force oEmbed-only mode if Twitter API is disabled
    if (process.env.TWITTER_API_DISABLED === 'true' || process.env.FORCE_OEMBED_ONLY === 'true') {
      console.log('Twitter API disabled via environment variable - using oEmbed only')
      return false
    }

    // Don't use API if we're rate limited
    if (this.isApiRateLimited && this.rateLimitResetTime && new Date() < this.rateLimitResetTime) {
      return false
    }

    // Don't use API if we've had too many recent failures
    if (this.apiFailureCount >= 3 && this.lastApiFailure) {
      const timeSinceLastFailure = Date.now() - this.lastApiFailure.getTime()
      if (timeSinceLastFailure < this.config.rateLimitCooldownMs) {
        return false
      }
    }

    return this.twitterApi !== null && this.config.preferApi
  }

  private handleApiError(error: Error): void {
    this.apiFailureCount++
    this.lastApiFailure = new Date()

    // Check if this is a rate limit error
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      this.isApiRateLimited = true
      this.rateLimitResetTime = new Date(Date.now() + this.config.rateLimitCooldownMs)
      console.warn(`API rate limited. Will retry after ${this.rateLimitResetTime}`)
    }

    // Check if this is an authentication error
    if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
      console.log('API authentication error detected, switching to fallback methods')
      this.isApiRateLimited = true // Treat auth errors like rate limits
      this.rateLimitResetTime = new Date(Date.now() + this.config.rateLimitCooldownMs)
    }

    console.warn(`API error (failure count: ${this.apiFailureCount}):`, error.message)
  }

  private handleApiSuccess(): void {
    // Reset failure tracking on successful API call
    if (this.apiFailureCount > 0) {
      console.log('API call successful, resetting failure count')
      this.apiFailureCount = 0
      this.lastApiFailure = null
    }
  }

  async getTweetData(tweetUrl: string): Promise<FallbackTweetData | null> {
    console.log(`Fetching tweet data: ${tweetUrl}`)

    // Validate URL format
    const urlValidation = validateTweetURL(tweetUrl)
    if (!urlValidation.isValid) {
      console.error('Invalid tweet URL format:', urlValidation.error)
      throw new URLValidationError(URLValidator.validateURL(tweetUrl))
    }

    // Try X API first
    if (this.xApiService && this.xApiService.isReady()) {
      try {
        console.log('Attempting to fetch tweet data via X API...')
        const xApiData = await this.xApiService.getTweetByUrl(tweetUrl)

        if (xApiData) {
          const fallbackData: FallbackTweetData = {
            id: xApiData.id,
            content: xApiData.content,
            likes: xApiData.engagement.likes,
            retweets: xApiData.engagement.retweets,
            replies: xApiData.engagement.replies,
            author: {
              id: xApiData.author.id,
              username: xApiData.author.username,
              name: xApiData.author.name,
              profileImage: xApiData.author.profileImage
            },
            createdAt: xApiData.createdAt,
            source: 'x-api' as const,
            isFromLayerEdgeCommunity: xApiData.isFromLayerEdgeCommunity
          }

          console.log('✅ Successfully fetched tweet data via X API')
          return fallbackData
        }
      } catch (error) {
        console.error('X API failed:', error)
      }
    }

    // Try Twitter API as fallback
    if (this.shouldUseApi()) {
      try {
        console.log('Attempting to fetch tweet data via Twitter API...')

        const apiData = await Promise.race([
          this.twitterApi!.getTweetData(tweetUrl),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('API timeout')), this.config.apiTimeoutMs)
          )
        ])

        if (apiData) {
          this.handleApiSuccess()

          // Verify community membership via API
          const isFromCommunity = await this.twitterApi!.verifyTweetFromCommunity(tweetUrl)

          const fallbackData: FallbackTweetData = {
            ...apiData,
            source: 'api' as const,
            isFromLayerEdgeCommunity: isFromCommunity
          }

          console.log('✅ Successfully fetched tweet data via Twitter API')
          return fallbackData
        }
      } catch (error) {
        this.handleApiError(error instanceof Error ? error : new Error(String(error)))
        console.log('Twitter API failed')
      }
    }

    // Try oEmbed API as final fallback
    console.log('Attempting final fallback via oEmbed API...')
    const oembedData = await this.tryOEmbedScraping(tweetUrl)
    if (oembedData) {
      console.log('✅ Successfully fetched tweet data via oEmbed API')
      return oembedData
    }

    console.error('All fallback methods failed for tweet:', tweetUrl)
    return null
  }

  private async tryOEmbedScraping(tweetUrl: string): Promise<FallbackTweetData | null> {
    try {
      console.log('Attempting oEmbed scraping for:', tweetUrl)

      // Extract tweet ID
      const tweetId = this.extractTweetId(tweetUrl)
      if (!tweetId) {
        throw new Error('Invalid tweet URL')
      }

      // Use Twitter's oEmbed API (free and no auth required)
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`

      const response = await fetch(oembedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LayerEdge/1.0)',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const oembedData = await response.json()

      // Extract text content from HTML
      const textContent = this.extractTextFromHtml(oembedData.html || '')

      return {
        id: tweetId,
        content: textContent,
        author: {
          id: 'unknown',
          username: oembedData.author_name || 'Unknown',
          name: oembedData.author_name || 'Unknown',
          verified: false,
          followersCount: 0,
          followingCount: 0
        },
        engagement: {
          likes: 0, // oEmbed doesn't provide engagement metrics
          retweets: 0,
          replies: 0,
          quotes: 0
        },
        createdAt: new Date(), // oEmbed doesn't provide exact date
        isFromLayerEdgeCommunity: textContent.toLowerCase().includes('@layeredge') || textContent.toLowerCase().includes('$edgen'),
        url: tweetUrl,
        source: 'oembed' as const
      }
    } catch (error) {
      console.error('oEmbed scraping failed:', error)
      return null
    }
  }

  private extractTweetId(tweetUrl: string): string | null {
    const match = tweetUrl.match(/\/status\/(\d+)/)
    return match ? match[1] : null
  }

  private extractTextFromHtml(html: string): string {
    try {
      // Extract text from the tweet HTML
      const textMatch = html.match(/<p[^>]*>(.*?)<\/p>/s)
      if (textMatch) {
        return textMatch[1].replace(/<[^>]*>/g, '').trim()
      }
      return ''
    } catch (error) {
      return ''
    }
  }

  async getEngagementMetrics(tweetUrl: string): Promise<FallbackEngagementMetrics | null> {
    console.log(`Fetching engagement metrics: ${tweetUrl}`)

    // Try Twitter API for engagement metrics
    if (this.shouldUseApi()) {
      try {
        console.log('Attempting to fetch engagement metrics via Twitter API...')

        const apiMetrics = await Promise.race([
          this.twitterApi!.getTweetEngagementMetrics(tweetUrl),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('API timeout')), this.config.apiTimeoutMs)
          )
        ])

        if (apiMetrics) {
          this.handleApiSuccess()

          const fallbackMetrics: FallbackEngagementMetrics = {
            ...apiMetrics,
            source: 'api' as const,
            timestamp: new Date()
          }

          console.log('✅ Successfully fetched engagement metrics via Twitter API')
          return fallbackMetrics
        }
      } catch (error) {
        this.handleApiError(error instanceof Error ? error : new Error(String(error)))
        console.log('Twitter API failed for engagement metrics')
      }
    }

    console.error('All API methods failed for engagement metrics:', tweetUrl)
    return null
  }

  getStatus(): {
    apiFailureCount: number
    lastApiFailure: Date | null
    isApiRateLimited: boolean
    rateLimitResetTime: Date | null
    preferredSource: 'api'
  } {
    return {
      apiFailureCount: this.apiFailureCount,
      lastApiFailure: this.lastApiFailure,
      isApiRateLimited: this.isApiRateLimited,
      rateLimitResetTime: this.rateLimitResetTime,
      preferredSource: 'api'
    }
  }

  resetApiFailures(): void {
    this.apiFailureCount = 0
    this.lastApiFailure = null
    this.isApiRateLimited = false
    this.rateLimitResetTime = null
    console.log('API failure tracking reset')
  }

  updateConfig(newConfig: Partial<FallbackServiceConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('Fallback service config updated:', this.config)
  }
}

// Singleton instance
let simplifiedFallbackServiceInstance: SimplifiedFallbackService | null = null

export function getSimplifiedFallbackService(config?: Partial<FallbackServiceConfig>): SimplifiedFallbackService {
  if (!simplifiedFallbackServiceInstance) {
    simplifiedFallbackServiceInstance = new SimplifiedFallbackService(config)
  } else if (config) {
    simplifiedFallbackServiceInstance.updateConfig(config)
  }
  return simplifiedFallbackServiceInstance
}
