import { TwitterApiService } from './twitter-api'
import { WebScraperService, getWebScraperInstance } from './web-scraper'

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
  source: 'api' | 'scweet' | 'twikit' | 'scraper'  // Added 'twikit' for enhanced fallback
  isFromLayerEdgeCommunity: boolean
}

export interface FallbackEngagementMetrics {
  likes: number
  retweets: number
  replies: number
  source: 'api' | 'scweet' | 'twikit' | 'scraper'  // Added 'twikit' for enhanced fallback
  timestamp: Date
}

export interface FallbackServiceConfig {
  enableScraping: boolean
  apiTimeoutMs: number
  maxApiRetries: number
  preferApi: boolean
  rateLimitCooldownMs: number
  enableScweet?: boolean
  scweetServiceUrl?: string
}

export class FallbackService {
  private twitterApi: TwitterApiService | null = null
  private webScraper: WebScraperService
  private config: FallbackServiceConfig
  private apiFailureCount: number = 0
  private lastApiFailure: Date | null = null
  private isApiRateLimited: boolean = false
  private rateLimitResetTime: Date | null = null
  private scweetServiceUrl: string

  constructor(config: Partial<FallbackServiceConfig> = {}) {
    // Try to initialize Twitter API, but don't fail if credentials are missing
    try {
      this.twitterApi = new TwitterApiService()
      console.log('✅ Twitter API service initialized')
    } catch (error) {
      console.warn('⚠️ Twitter API service unavailable:', error instanceof Error ? error.message : String(error))
      this.twitterApi = null
    }

    this.webScraper = getWebScraperInstance()
    this.config = {
      enableScraping: true,
      apiTimeoutMs: 10000, // 10 seconds
      maxApiRetries: 2,
      preferApi: false, // PRIORITY FIX: Disable Twitter API preference to avoid rate limits
      rateLimitCooldownMs: 15 * 60 * 1000, // 15 minutes
      enableScweet: true,
      scweetServiceUrl: process.env.SCWEET_SERVICE_URL || 'http://scweet-service:8001',
      ...config
    }

    this.scweetServiceUrl = this.config.scweetServiceUrl || 'http://localhost:8001'

    console.log('FallbackService initialized with config:', this.config)
    console.log(`API available: ${this.twitterApi !== null}, Scraping enabled: ${this.config.enableScraping}, Scweet enabled: ${this.config.enableScweet}`)
  }

  private shouldUseApi(): boolean {
    // Don't use API if it's not available
    if (!this.twitterApi) {
      return false
    }

    // Don't use API if scraping is disabled
    if (!this.config.enableScraping) {
      return true
    }

    // Don't use API if we're currently rate limited
    if (this.isApiRateLimited && this.rateLimitResetTime) {
      if (new Date() < this.rateLimitResetTime) {
        console.log('API still rate limited, using scraper')
        return false
      } else {
        // Rate limit period has passed
        this.isApiRateLimited = false
        this.rateLimitResetTime = null
        this.apiFailureCount = 0
        console.log('API rate limit period expired, re-enabling API')
      }
    }

    // Use API if preferred and not experiencing failures
    if (this.config.preferApi && this.apiFailureCount < 3) {
      return true
    }

    // If we've had recent API failures, use scraper
    if (this.lastApiFailure) {
      const timeSinceFailure = Date.now() - this.lastApiFailure.getTime()
      if (timeSinceFailure < this.config.rateLimitCooldownMs) {
        console.log('Recent API failures detected, using scraper')
        return false
      }
    }

    return this.config.preferApi
  }

  private handleApiError(error: Error): void {
    this.apiFailureCount++
    this.lastApiFailure = new Date()

    // Check if this is a rate limiting error
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      console.log('API rate limit detected, switching to scraper for cooldown period')
      this.isApiRateLimited = true
      this.rateLimitResetTime = new Date(Date.now() + this.config.rateLimitCooldownMs)
    }

    console.error(`API error (failure count: ${this.apiFailureCount}):`, error.message)
  }

  private handleApiSuccess(): void {
    // Reset failure tracking on successful API call
    if (this.apiFailureCount > 0) {
      console.log('API call successful, resetting failure count')
      this.apiFailureCount = 0
      this.lastApiFailure = null
    }
  }

  private async tryScweetService(tweetUrl: string): Promise<FallbackTweetData | null> {
    if (!this.config.enableScweet) {
      return null
    }

    try {
      console.log('Attempting to fetch tweet data via Scweet service...')

      const response = await fetch(`${this.scweetServiceUrl}/tweet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tweet_url: tweetUrl,
          include_engagement: true,
          include_user_info: true
        }),
        signal: AbortSignal.timeout(this.config.apiTimeoutMs)
      })

      if (!response.ok) {
        throw new Error(`Scweet service error: ${response.status}`)
      }

      const data = await response.json()

      const fallbackData: FallbackTweetData = {
        id: data.tweet_id,
        content: data.content,
        likes: data.engagement.likes,
        retweets: data.engagement.retweets,
        replies: data.engagement.replies,
        author: {
          id: data.author.username,
          username: data.author.username,
          name: data.author.display_name,
          profileImage: undefined
        },
        createdAt: new Date(data.created_at),
        source: 'scweet' as const,
        isFromLayerEdgeCommunity: data.is_from_layeredge_community
      }

      console.log('Successfully fetched tweet data via Scweet service')
      return fallbackData
    } catch (error) {
      console.error('Scweet service failed:', error)
      return null
    }
  }

  private async tryScweetEngagement(tweetUrl: string): Promise<FallbackEngagementMetrics | null> {
    if (!this.config.enableScweet) {
      return null
    }

    try {
      console.log('Attempting to fetch engagement metrics via Scweet service...')

      const response = await fetch(`${this.scweetServiceUrl}/engagement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tweet_url: tweetUrl
        }),
        signal: AbortSignal.timeout(this.config.apiTimeoutMs)
      })

      if (!response.ok) {
        throw new Error(`Scweet service error: ${response.status}`)
      }

      const data = await response.json()

      const fallbackMetrics: FallbackEngagementMetrics = {
        likes: data.likes,
        retweets: data.retweets,
        replies: data.replies,
        source: 'scweet' as const,
        timestamp: new Date(data.timestamp)
      }

      console.log('Successfully fetched engagement metrics via Scweet service')
      return fallbackMetrics
    } catch (error) {
      console.error('Scweet engagement service failed:', error)
      return null
    }
  }

  private async tryTwikitService(tweetUrl: string): Promise<FallbackTweetData | null> {
    if (!this.config.enableScweet) { // Use same config flag for now
      return null
    }

    try {
      console.log('Attempting to fetch tweet data via Twikit service...')

      const response = await fetch(`${this.scweetServiceUrl}/twikit/tweet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tweet_url: tweetUrl,
          include_engagement: true,
          include_user_info: true
        }),
        signal: AbortSignal.timeout(this.config.apiTimeoutMs)
      })

      if (!response.ok) {
        throw new Error(`Twikit service error: ${response.status}`)
      }

      const data = await response.json()

      const fallbackData: FallbackTweetData = {
        id: data.tweet_id,
        content: data.content,
        likes: data.engagement.likes,
        retweets: data.engagement.retweets,
        replies: data.engagement.replies,
        author: {
          id: data.author.username,
          username: data.author.username,
          name: data.author.display_name,
          profileImage: undefined
        },
        createdAt: new Date(data.created_at),
        source: 'twikit' as const,
        isFromLayerEdgeCommunity: data.is_from_layeredge_community
      }

      console.log('Successfully fetched tweet data via Twikit service')
      return fallbackData
    } catch (error) {
      console.error('Twikit service failed:', error)
      return null
    }
  }

  private async tryTwikitEngagement(tweetUrl: string): Promise<FallbackEngagementMetrics | null> {
    if (!this.config.enableScweet) { // Use same config flag for now
      return null
    }

    try {
      console.log('Attempting to fetch engagement metrics via Twikit service...')

      const response = await fetch(`${this.scweetServiceUrl}/twikit/engagement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tweet_url: tweetUrl
        }),
        signal: AbortSignal.timeout(this.config.apiTimeoutMs)
      })

      if (!response.ok) {
        throw new Error(`Twikit service error: ${response.status}`)
      }

      const data = await response.json()

      const fallbackMetrics: FallbackEngagementMetrics = {
        likes: data.likes,
        retweets: data.retweets,
        replies: data.replies,
        source: 'twikit' as const,
        timestamp: new Date(data.timestamp)
      }

      console.log('Successfully fetched engagement metrics via Twikit service')
      return fallbackMetrics
    } catch (error) {
      console.error('Twikit engagement service failed:', error)
      return null
    }
  }

  async getTweetData(tweetUrl: string): Promise<FallbackTweetData | null> {
    console.log(`Fetching tweet data with fallback service: ${tweetUrl}`)

    // PRIORITY FIX: Try Official Scweet FIRST to eliminate rate limit issues
    const scweetData = await this.tryScweetService(tweetUrl)
    if (scweetData) {
      console.log('✅ Successfully fetched tweet data via Official Scweet v3.0+ (PRIMARY)')
      return scweetData
    }

    // Try API second (if conditions are met and Scweet failed)
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

          console.log('Successfully fetched tweet data via API')
          return fallbackData
        }
      } catch (error) {
        this.handleApiError(error instanceof Error ? error : new Error(String(error)))
        console.log('API failed, falling back to web scraping...')
      }
    }

    // Try Twikit service as tertiary fallback
    const twikitData = await this.tryTwikitService(tweetUrl)
    if (twikitData) {
      return twikitData
    }

    // Fallback to web scraping (final fallback)
    if (this.config.enableScraping) {
      try {
        console.log('Attempting to fetch tweet data via web scraping...')

        const scrapedData = await this.webScraper.scrapeTweetData(tweetUrl)

        if (scrapedData) {
          const fallbackData: FallbackTweetData = {
            id: scrapedData.id,
            content: scrapedData.content,
            likes: scrapedData.likes,
            retweets: scrapedData.retweets,
            replies: scrapedData.replies,
            author: scrapedData.author,
            createdAt: scrapedData.createdAt,
            source: 'scraper' as const,
            isFromLayerEdgeCommunity: scrapedData.isFromLayerEdgeCommunity
          }

          console.log('Successfully fetched tweet data via web scraping')
          return fallbackData
        }
      } catch (error) {
        console.error('Web scraping also failed:', error)
      }
    }

    console.error('All fallback methods failed for tweet:', tweetUrl)
    return null
  }

  async getEngagementMetrics(tweetUrl: string): Promise<FallbackEngagementMetrics | null> {
    console.log(`Fetching engagement metrics with fallback service: ${tweetUrl}`)

    // PRIORITY FIX: Try Official Scweet FIRST for engagement metrics
    const scweetMetrics = await this.tryScweetEngagement(tweetUrl)
    if (scweetMetrics) {
      console.log('✅ Successfully fetched engagement metrics via Official Scweet v3.0+ (PRIMARY)')
      return scweetMetrics
    }

    // Try API second (if conditions are met and Scweet failed)
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

          console.log('Successfully fetched engagement metrics via API')
          return fallbackMetrics
        }
      } catch (error) {
        this.handleApiError(error instanceof Error ? error : new Error(String(error)))
        console.log('API failed, falling back to web scraping...')
      }
    }

    // Try Twikit service as tertiary fallback for engagement metrics
    const twikitMetrics = await this.tryTwikitEngagement(tweetUrl)
    if (twikitMetrics) {
      return twikitMetrics
    }

    // Fallback to web scraping (final fallback)
    if (this.config.enableScraping) {
      try {
        console.log('Attempting to fetch engagement metrics via web scraping...')

        const scrapedMetrics = await this.webScraper.scrapeEngagementMetrics(tweetUrl)

        if (scrapedMetrics) {
          const fallbackMetrics: FallbackEngagementMetrics = {
            likes: scrapedMetrics.likes,
            retweets: scrapedMetrics.retweets,
            replies: scrapedMetrics.replies,
            source: 'scraper' as const,
            timestamp: scrapedMetrics.timestamp
          }

          console.log('Successfully fetched engagement metrics via web scraping')
          return fallbackMetrics
        }
      } catch (error) {
        console.error('Web scraping also failed:', error)
      }
    }

    console.error('All fallback methods failed for engagement metrics:', tweetUrl)
    return null
  }

  async getBatchEngagementMetrics(tweetUrls: string[]): Promise<Array<{
    url: string
    metrics: FallbackEngagementMetrics | null
  }>> {
    console.log(`Fetching batch engagement metrics for ${tweetUrls.length} tweets`)

    // Try API first if conditions are met
    if (this.shouldUseApi()) {
      try {
        console.log('Attempting batch fetch via Twitter API...')

        const apiResults = await this.twitterApi!.getBatchTweetEngagementMetrics(tweetUrls)

        // Check if API was successful for most tweets
        const successfulResults = apiResults.filter(result => result.metrics !== null)
        const successRate = successfulResults.length / apiResults.length

        if (successRate > 0.5) { // If more than 50% successful
          this.handleApiSuccess()

          const fallbackResults = apiResults.map(result => ({
            url: result.url,
            metrics: result.metrics ? {
              ...result.metrics,
              source: 'api' as const,
              timestamp: new Date()
            } : null
          }))

          console.log(`Successfully fetched ${successfulResults.length}/${apiResults.length} metrics via API`)
          return fallbackResults
        } else {
          throw new Error(`Low API success rate: ${successRate}`)
        }
      } catch (error) {
        this.handleApiError(error instanceof Error ? error : new Error(String(error)))
        console.log('API batch failed, falling back to web scraping...')
      }
    }

    // Fallback to web scraping
    if (this.config.enableScraping) {
      try {
        console.log('Attempting batch fetch via web scraping...')

        const scrapedResults = await this.webScraper.scrapeBatchEngagementMetrics(tweetUrls)

        const fallbackResults = scrapedResults.map(result => ({
          url: result.url,
          metrics: result.metrics ? {
            likes: result.metrics.likes,
            retweets: result.metrics.retweets,
            replies: result.metrics.replies,
            source: 'scraper' as const,
            timestamp: result.metrics.timestamp
          } : null
        }))

        const successfulResults = fallbackResults.filter(result => result.metrics !== null)
        console.log(`Successfully scraped ${successfulResults.length}/${fallbackResults.length} metrics`)
        return fallbackResults
      } catch (error) {
        console.error('Web scraping batch also failed:', error)
      }
    }

    console.error('All fallback methods failed for batch engagement metrics')
    return tweetUrls.map(url => ({ url, metrics: null }))
  }

  getStatus(): {
    apiFailureCount: number
    lastApiFailure: Date | null
    isApiRateLimited: boolean
    rateLimitResetTime: Date | null
    preferredSource: 'api' | 'scraper'
  } {
    return {
      apiFailureCount: this.apiFailureCount,
      lastApiFailure: this.lastApiFailure,
      isApiRateLimited: this.isApiRateLimited,
      rateLimitResetTime: this.rateLimitResetTime,
      preferredSource: this.shouldUseApi() ? 'api' : 'scraper'
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
let fallbackServiceInstance: FallbackService | null = null

export function getFallbackService(config?: Partial<FallbackServiceConfig>): FallbackService {
  if (!fallbackServiceInstance) {
    fallbackServiceInstance = new FallbackService(config)
  } else if (config) {
    fallbackServiceInstance.updateConfig(config)
  }
  return fallbackServiceInstance
}
