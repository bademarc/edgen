import { TwitterApiService } from './twitter-api'
import { URLValidator, validateTweetURL, URLValidationError } from './url-validator'
import { XApiService, getXApiService } from './x-api-service'
import { extractTweetId } from './utils'

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
  source: 'api' | 'x-api'  // Simplified to only API sources
  isFromLayerEdgeCommunity: boolean
}

export interface FallbackEngagementMetrics {
  likes: number
  retweets: number
  replies: number
  source: 'api' | 'x-api'  // Simplified to only API sources
  timestamp: Date
}

export interface FallbackServiceConfig {
  apiTimeoutMs: number
  maxApiRetries: number
  preferApi: boolean
  rateLimitCooldownMs: number
}

export class FallbackService {
  private twitterApi: TwitterApiService | null = null
  private xApiService: XApiService | null = null
  private config: FallbackServiceConfig
  private apiFailureCount: number = 0
  private lastApiFailure: Date | null = null
  private isApiRateLimited: boolean = false
  private rateLimitResetTime: Date | null = null

  constructor(config: Partial<FallbackServiceConfig> = {}) {
    // Try to initialize Twitter API, but don't fail if credentials are missing
    try {
      this.twitterApi = new TwitterApiService()
      console.log('✅ Twitter API service initialized')
    } catch (error) {
      console.warn('⚠️ Twitter API service unavailable:', error instanceof Error ? error.message : String(error))
      this.twitterApi = null
    }

    // Try to initialize X API service with new credentials
    try {
      this.xApiService = getXApiService()
      console.log('✅ X API service initialized with new credentials')
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

    console.log('FallbackService initialized with config:', this.config)
    console.log(`Twitter API available: ${this.twitterApi !== null}, X API available: ${this.xApiService !== null}`)
  }

  private shouldUseApi(): boolean {
    // PRODUCTION FIX: Force oEmbed-only mode if Twitter API is disabled
    if (process.env.TWITTER_API_DISABLED === 'true' || process.env.FORCE_OEMBED_ONLY === 'true') {
      console.log('🚫 Twitter API disabled via environment variable - using oEmbed only')
      return false
    }

    // RATE LIMIT FIX: Default to false to prioritize oEmbed and avoid rate limits
    if (!this.config.preferApi) {
      console.log('🎯 API not preferred - prioritizing oEmbed to avoid rate limits')
      return false
    }

    // Don't use API if it's not available
    if (!this.twitterApi) {
      console.log('⚠️ Twitter API service not available')
      return false
    }

    // Don't use API if we're currently rate limited
    if (this.isApiRateLimited && this.rateLimitResetTime) {
      if (new Date() < this.rateLimitResetTime) {
        const remainingMinutes = Math.ceil((this.rateLimitResetTime.getTime() - Date.now()) / (60 * 1000))
        console.log(`⏳ API still rate limited for ${remainingMinutes} minutes, using oEmbed`)
        return false
      } else {
        // Rate limit period has passed
        this.isApiRateLimited = false
        this.rateLimitResetTime = null
        this.apiFailureCount = 0
        console.log('✅ API rate limit period expired, re-enabling API')
      }
    }

    // Be very conservative about API usage - only use if explicitly preferred and no recent failures
    if (this.config.preferApi && this.apiFailureCount === 0) {
      console.log('🔄 Using API (no recent failures)')
      return true
    }

    // If we've had any API failures, use oEmbed for extended period
    if (this.lastApiFailure) {
      const timeSinceFailure = Date.now() - this.lastApiFailure.getTime()
      if (timeSinceFailure < this.config.rateLimitCooldownMs) {
        const remainingMinutes = Math.ceil((this.config.rateLimitCooldownMs - timeSinceFailure) / (60 * 1000))
        console.log(`🛡️ Recent API failures detected, using oEmbed for ${remainingMinutes} more minutes`)
        return false
      }
    }

    console.log('🚫 Defaulting to oEmbed to avoid rate limits')
    return false // PRIORITY FIX: Default to false to avoid rate limits
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

    // Check if this is an authentication error
    if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
      console.log('API authentication error detected, switching to fallback methods')
      this.isApiRateLimited = true // Treat auth errors like rate limits
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
    // Use Twitter oEmbed API as free alternative to Scweet
    console.log('Using Twitter oEmbed API as Scweet alternative')
    return this.tryOEmbedScraping(tweetUrl)
  }

  private async tryScweetEngagement(tweetUrl: string): Promise<FallbackEngagementMetrics | null> {
    // Scweet service has been removed - return null
    console.log('Scweet engagement service has been removed from LayerEdge platform')
    return null
  }

  private async tryTwikitService(tweetUrl: string): Promise<FallbackTweetData | null> {
    // Use budget scraper as Twikit alternative
    console.log('Using budget scraper as Twikit alternative')
    return this.tryBudgetScraping(tweetUrl)
  }

  private async tryOEmbedScraping(tweetUrl: string): Promise<FallbackTweetData | null> {
    try {
      console.log('Attempting oEmbed scraping for:', tweetUrl)

      // Extract tweet ID
      const tweetId = extractTweetId(tweetUrl)
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

  private async tryBudgetScraping(tweetUrl: string): Promise<FallbackTweetData | null> {
    try {
      console.log('Attempting budget scraping for:', tweetUrl)

      // This is a placeholder for budget scraping
      // In a real implementation, this would use the budget-scraper.ts
      return null
    } catch (error) {
      console.error('Budget scraping failed:', error)
      return null
    }
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

  private async tryTwikitEngagement(tweetUrl: string): Promise<FallbackEngagementMetrics | null> {
    // Twikit service has been removed - return null
    console.log('Twikit engagement service has been removed from LayerEdge platform')
    return null
  }

  async getTweetData(tweetUrl: string): Promise<FallbackTweetData | null> {
    console.log(`🔍 Fetching tweet data with fallback service: ${tweetUrl}`)

    // PRIORITY FIX: Validate URL format before processing
    const urlValidation = validateTweetURL(tweetUrl)
    if (!urlValidation.isValid) {
      console.error('❌ Invalid tweet URL format:', urlValidation.error)
      throw new URLValidationError(URLValidator.validateURL(tweetUrl))
    }

    // RATE LIMIT FIX: Try oEmbed FIRST to avoid API rate limits entirely
    console.log('🎯 Attempting oEmbed scraping first (rate limit avoidance)...')
    const oembedData = await this.tryOEmbedScraping(tweetUrl)
    if (oembedData) {
      console.log('✅ Successfully fetched tweet data via oEmbed (PRIMARY - no rate limits)')
      return oembedData
    }

    // Try X API second (NEW: Enhanced API with new credentials) - only if oEmbed fails
    if (this.xApiService && this.xApiService.isReady()) {
      try {
        console.log('🔄 oEmbed failed, attempting X API (NEW)...')

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

          console.log('✅ Successfully fetched tweet data via X API (SECONDARY)')
          return fallbackData
        }
      } catch (error) {
        console.error('❌ X API failed:', error)
      }
    }

    // Try legacy Twitter API third (ONLY if explicitly preferred and conditions are met)
    if (this.shouldUseApi()) {
      try {
        console.log('🔄 Attempting Legacy Twitter API (LAST RESORT)...')

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

          console.log('✅ Successfully fetched tweet data via Legacy API (TERTIARY)')
          return fallbackData
        }
      } catch (error) {
        this.handleApiError(error instanceof Error ? error : new Error(String(error)))
        console.log('❌ Legacy API failed, exhausted all options')
      }
    } else {
      console.log('🚫 Skipping Legacy API (rate limit protection)')
    }

    // Try budget scraping as final fallback
    const budgetData = await this.tryBudgetScraping(tweetUrl)
    if (budgetData) {
      console.log('✅ Successfully fetched tweet data via budget scraping (FINAL)')
      return budgetData
    }

    console.error('❌ All fallback methods failed for tweet:', tweetUrl)
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

    // Web scraping has been removed from LayerEdge platform

    console.error('All fallback methods failed for engagement metrics:', tweetUrl)
    return null
  }

  async getBatchEngagementMetrics(tweetUrls: string[]): Promise<Array<{
    url: string
    metrics: FallbackEngagementMetrics | null
  }>> {
    console.log(`Fetching batch engagement metrics for ${tweetUrls.length} tweets`)

    // PRIORITY FIX: Try Scweet FIRST for batch operations (consistent with single operations)
    console.log('Attempting batch fetch via Official Scweet v3.0+...')
    try {
      const scweetResults = await Promise.all(
        tweetUrls.map(async (url) => {
          const metrics = await this.tryScweetEngagement(url)
          return { url, metrics }
        })
      )

      const successfulResults = scweetResults.filter(result => result.metrics !== null)
      const successRate = successfulResults.length / scweetResults.length

      if (successRate > 0.3) { // If more than 30% successful via Scweet
        console.log(`✅ Batch fetch via Official Scweet successful: ${successfulResults.length}/${scweetResults.length}`)
        return scweetResults
      }
    } catch (error) {
      console.error('Batch Scweet fetch failed:', error)
    }

    // Try API second if conditions are met and Scweet had low success rate
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

    // Web scraping has been removed from LayerEdge platform

    console.error('All fallback methods failed for batch engagement metrics')
    return tweetUrls.map(url => ({ url, metrics: null }))
  }

  getStatus(): {
    apiFailureCount: number
    lastApiFailure: Date | null
    isApiRateLimited: boolean
    rateLimitResetTime: Date | null
    preferredSource: 'api' | 'x-api'
  } {
    return {
      apiFailureCount: this.apiFailureCount,
      lastApiFailure: this.lastApiFailure,
      isApiRateLimited: this.isApiRateLimited,
      rateLimitResetTime: this.rateLimitResetTime,
      preferredSource: this.shouldUseApi() ? 'api' : 'x-api'
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
