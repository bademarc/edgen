import { TwitterApi } from 'twitter-api-v2'
import { extractTweetId } from './utils'

interface EngagementMetrics {
  likes: number
  retweets: number
  replies: number
  source: 'oembed' | 'twitter-api' | 'hybrid'
  timestamp: Date
}

interface TweetData {
  id: string
  content: string
  author: {
    username: string
    name: string
    verified?: boolean
  }
  engagement: EngagementMetrics
  createdAt: Date
  url: string
}

/**
 * Enhanced Hybrid Service
 * Combines oEmbed and Twitter API for optimal engagement metrics
 */
export class EnhancedHybridService {
  private twitterClient: TwitterApi | null = null
  private cache = new Map<string, { data: EngagementMetrics; expires: number }>()
  private readonly CACHE_TTL = 30 * 60 * 1000 // 30 minutes
  private rateLimitInfo = {
    isLimited: false,
    resetTime: 0,
    remainingRequests: 0
  }

  constructor() {
    this.initializeTwitterApi()
  }

  private initializeTwitterApi() {
    try {
      const bearerToken = process.env.TWITTER_BEARER_TOKEN
      if (bearerToken) {
        this.twitterClient = new TwitterApi(bearerToken).readOnly
        console.log('✅ Enhanced Hybrid Service: Twitter API initialized')
      } else {
        console.warn('⚠️ Twitter API not available - using oEmbed only')
      }
    } catch (error) {
      console.error('❌ Twitter API initialization failed:', error)
    }
  }

  /**
   * Get comprehensive tweet data with best available engagement metrics
   */
  async getTweetData(tweetUrl: string): Promise<TweetData | null> {
    try {
      const tweetId = extractTweetId(tweetUrl)
      if (!tweetId) {
        throw new Error('Invalid tweet URL')
      }

      console.log(`🔍 Fetching comprehensive data for tweet: ${tweetId}`)

      // Try to get data from both sources in parallel
      const [oembedData, twitterApiData] = await Promise.allSettled([
        this.fetchViaOEmbed(tweetUrl),
        this.fetchViaTwitterApi(tweetId)
      ])

      // Determine best data source
      const bestEngagement = this.selectBestEngagementMetrics(oembedData, twitterApiData)
      const bestContent = this.selectBestContent(oembedData, twitterApiData)

      if (!bestContent) {
        throw new Error('Could not fetch tweet content from any source')
      }

      return {
        id: tweetId,
        content: bestContent.content,
        author: bestContent.author,
        engagement: bestEngagement,
        createdAt: bestContent.createdAt,
        url: tweetUrl
      }

    } catch (error) {
      console.error('❌ Failed to fetch tweet data:', error)
      return null
    }
  }

  /**
   * Fetch tweet data via oEmbed API
   */
  private async fetchViaOEmbed(tweetUrl: string): Promise<{
    content: string
    author: { username: string; name: string }
    engagement: EngagementMetrics
    createdAt: Date
  } | null> {
    try {
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`
      
      const response = await fetch(oembedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LayerEdge/1.0)' },
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const data = await response.json()
      const engagement = this.parseEngagementFromHtml(data.html || '')
      
      return {
        content: this.extractTextFromHtml(data.html || ''),
        author: {
          username: this.extractUsernameFromAuthorUrl(data.author_url) || 'unknown',
          name: data.author_name || 'Unknown'
        },
        engagement: {
          ...engagement,
          source: 'oembed' as const,
          timestamp: new Date()
        },
        createdAt: new Date() // oEmbed doesn't provide exact timestamp
      }
    } catch (error) {
      console.error('oEmbed fetch failed:', error)
      return null
    }
  }

  /**
   * Fetch tweet data via Twitter API with rate limit handling
   */
  private async fetchViaTwitterApi(tweetId: string): Promise<{
    content: string
    author: { username: string; name: string; verified?: boolean }
    engagement: EngagementMetrics
    createdAt: Date
  } | null> {
    try {
      if (!this.twitterClient) return null

      // Check if we're rate limited
      if (this.isRateLimited()) {
        console.log(`⏳ Twitter API rate limited until ${new Date(this.rateLimitInfo.resetTime)}`)
        return null
      }

      // Check cache first
      const cached = this.getCachedEngagement(tweetId)
      if (cached) {
        console.log(`🎯 Using cached engagement for tweet ${tweetId}`)
        // Return cached data with mock content for now
        return {
          content: 'Cached tweet content',
          author: { username: 'cached_user', name: 'Cached User' },
          engagement: cached,
          createdAt: new Date()
        }
      }

      console.log(`🔍 Fetching tweet ${tweetId} via Twitter API (${this.rateLimitInfo.remainingRequests} requests remaining)`)

      const tweet = await this.twitterClient.v2.singleTweet(tweetId, {
        'tweet.fields': ['public_metrics', 'created_at', 'author_id', 'text'],
        'user.fields': ['username', 'name', 'verified'],
        expansions: ['author_id']
      })

      // Update rate limit info from response headers if available
      this.updateRateLimitInfo(tweet)

      if (!tweet.data) return null

      const author = tweet.includes?.users?.[0]
      if (!author) return null

      const engagement: EngagementMetrics = {
        likes: tweet.data.public_metrics?.like_count || 0,
        retweets: tweet.data.public_metrics?.retweet_count || 0,
        replies: tweet.data.public_metrics?.reply_count || 0,
        source: 'twitter-api' as const,
        timestamp: new Date()
      }

      // Cache the engagement metrics
      this.cacheEngagement(tweetId, engagement)

      return {
        content: tweet.data.text || '',
        author: {
          username: author.username || 'unknown',
          name: author.name || 'Unknown',
          verified: author.verified || false
        },
        engagement,
        createdAt: new Date(tweet.data.created_at || Date.now())
      }
    } catch (error: any) {
      // Handle rate limiting
      if (error.code === 429 || error.message?.includes('429')) {
        console.log('🚫 Twitter API rate limit hit')
        this.handleRateLimit(error)
        return null
      }

      console.error('Twitter API fetch failed:', error.message)
      return null
    }
  }

  /**
   * Select the best engagement metrics from available sources
   */
  private selectBestEngagementMetrics(
    oembedResult: PromiseSettledResult<any>,
    twitterApiResult: PromiseSettledResult<any>
  ): EngagementMetrics {
    const defaultMetrics: EngagementMetrics = {
      likes: 0,
      retweets: 0,
      replies: 0,
      source: 'hybrid',
      timestamp: new Date()
    }

    let bestMetrics = defaultMetrics
    let bestScore = 0

    // Check Twitter API result
    if (twitterApiResult.status === 'fulfilled' && twitterApiResult.value) {
      const apiMetrics = twitterApiResult.value.engagement
      const apiScore = apiMetrics.likes + apiMetrics.retweets + apiMetrics.replies
      if (apiScore > bestScore) {
        bestMetrics = apiMetrics
        bestScore = apiScore
      }
    }

    // Check oEmbed result
    if (oembedResult.status === 'fulfilled' && oembedResult.value) {
      const oembedMetrics = oembedResult.value.engagement
      const oembedScore = oembedMetrics.likes + oembedMetrics.retweets + oembedMetrics.replies
      if (oembedScore > bestScore) {
        bestMetrics = oembedMetrics
        bestScore = oembedScore
      }
    }

    console.log(`📊 Selected ${bestMetrics.source} metrics with score: ${bestScore}`)
    return bestMetrics
  }

  /**
   * Select the best content from available sources
   */
  private selectBestContent(
    oembedResult: PromiseSettledResult<any>,
    twitterApiResult: PromiseSettledResult<any>
  ): any {
    // Prefer Twitter API for content accuracy
    if (twitterApiResult.status === 'fulfilled' && twitterApiResult.value) {
      return twitterApiResult.value
    }
    
    if (oembedResult.status === 'fulfilled' && oembedResult.value) {
      return oembedResult.value
    }
    
    return null
  }

  /**
   * Enhanced HTML parsing for engagement metrics
   */
  private parseEngagementFromHtml(html: string): { likes: number; retweets: number; replies: number } {
    const metrics = { likes: 0, retweets: 0, replies: 0 }
    
    if (!html) return metrics

    // Enhanced patterns for better extraction
    const patterns = {
      likes: [
        /(\d+(?:,\d+)*)\s*(?:like|heart|❤️)/gi,
        /aria-label="[^"]*(\d+(?:,\d+)*)[^"]*like/gi,
        /data-testid="like"[^>]*>.*?(\d+(?:,\d+)*)/gi
      ],
      retweets: [
        /(\d+(?:,\d+)*)\s*(?:retweet|share|🔄)/gi,
        /aria-label="[^"]*(\d+(?:,\d+)*)[^"]*retweet/gi,
        /data-testid="retweet"[^>]*>.*?(\d+(?:,\d+)*)/gi
      ],
      replies: [
        /(\d+(?:,\d+)*)\s*(?:repl|comment|💬)/gi,
        /aria-label="[^"]*(\d+(?:,\d+)*)[^"]*repl/gi,
        /data-testid="reply"[^>]*>.*?(\d+(?:,\d+)*)/gi
      ]
    }

    for (const [metricType, patternList] of Object.entries(patterns)) {
      for (const pattern of patternList) {
        const matches = Array.from(html.matchAll(pattern))
        if (matches.length > 0) {
          const value = parseInt(matches[0][1].replace(/,/g, ''), 10)
          if (!isNaN(value) && value > 0) {
            metrics[metricType as keyof typeof metrics] = Math.max(
              metrics[metricType as keyof typeof metrics], 
              value
            )
          }
        }
      }
    }

    return metrics
  }

  private extractTextFromHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim()
  }

  private extractUsernameFromAuthorUrl(authorUrl: string): string | null {
    if (!authorUrl) return null
    const match = authorUrl.match(/(?:twitter\.com|x\.com)\/([^\/\?]+)/)
    return match ? match[1] : null
  }

  private getCachedEngagement(tweetId: string): EngagementMetrics | null {
    const cached = this.cache.get(tweetId)
    if (cached && cached.expires > Date.now()) {
      return cached.data
    }
    return null
  }

  private cacheEngagement(tweetId: string, metrics: EngagementMetrics): void {
    this.cache.set(tweetId, {
      data: metrics,
      expires: Date.now() + this.CACHE_TTL
    })
  }

  /**
   * Rate limit management methods
   */
  private isRateLimited(): boolean {
    return this.rateLimitInfo.isLimited && Date.now() < this.rateLimitInfo.resetTime
  }

  private handleRateLimit(error: any): void {
    // Set rate limit for 15 minutes (Twitter's typical window)
    this.rateLimitInfo = {
      isLimited: true,
      resetTime: Date.now() + (15 * 60 * 1000), // 15 minutes
      remainingRequests: 0
    }
    console.log(`🚫 Rate limited until ${new Date(this.rateLimitInfo.resetTime)}`)
  }

  private updateRateLimitInfo(response: any): void {
    // Try to extract rate limit info from response headers
    try {
      const headers = response.rateLimit || response.headers
      if (headers) {
        this.rateLimitInfo.remainingRequests = parseInt(headers['x-rate-limit-remaining'] || '0')
        const resetTime = parseInt(headers['x-rate-limit-reset'] || '0')
        if (resetTime > 0) {
          this.rateLimitInfo.resetTime = resetTime * 1000 // Convert to milliseconds
        }
      }
    } catch (error) {
      // Ignore header parsing errors
    }
  }

  /**
   * Get engagement metrics with intelligent fallback strategy
   */
  async getEngagementMetrics(tweetUrl: string): Promise<EngagementMetrics> {
    const tweetId = extractTweetId(tweetUrl)
    if (!tweetId) {
      return this.getDefaultMetrics()
    }

    // Try cache first
    const cached = this.getCachedEngagement(tweetId)
    if (cached) {
      console.log(`🎯 Returning cached engagement for tweet ${tweetId}`)
      return cached
    }

    // Try Twitter API if not rate limited
    if (!this.isRateLimited() && this.twitterClient) {
      try {
        const apiData = await this.fetchViaTwitterApi(tweetId)
        if (apiData?.engagement) {
          console.log(`✅ Got fresh engagement from Twitter API: ${JSON.stringify(apiData.engagement)}`)
          return apiData.engagement
        }
      } catch (error) {
        console.log('Twitter API failed, falling back to oEmbed')
      }
    }

    // Fallback to oEmbed (content only, no engagement)
    console.log('📄 Using oEmbed fallback (no engagement metrics available)')
    return this.getDefaultMetrics()
  }

  private getDefaultMetrics(): EngagementMetrics {
    return {
      likes: 0,
      retweets: 0,
      replies: 0,
      source: 'hybrid',
      timestamp: new Date()
    }
  }
}
