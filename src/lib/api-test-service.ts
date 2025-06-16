import { TwitterApi } from 'twitter-api-v2'

/**
 * Comprehensive API Testing Service
 * Tests both oEmbed and Twitter API integration for engagement metrics
 */
export class ApiTestService {
  private twitterClient: TwitterApi | null = null
  
  constructor() {
    this.initializeTwitterApi()
  }

  private initializeTwitterApi() {
    try {
      const bearerToken = process.env.TWITTER_BEARER_TOKEN
      if (!bearerToken) {
        console.error('❌ TWITTER_BEARER_TOKEN not found')
        return
      }
      
      this.twitterClient = new TwitterApi(bearerToken).readOnly
      console.log('✅ Twitter API client initialized')
    } catch (error) {
      console.error('❌ Failed to initialize Twitter API:', error)
    }
  }

  /**
   * Test oEmbed API functionality
   */
  async testOEmbedApi(tweetUrl: string): Promise<{
    success: boolean
    data?: any
    error?: string
    engagementMetrics?: {
      likes: number
      retweets: number
      replies: number
    }
  }> {
    try {
      console.log('🔍 Testing oEmbed API for:', tweetUrl)
      
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`
      
      const response = await fetch(oembedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LayerEdge/1.0)',
        },
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const oembedData = await response.json()
      
      // Try to extract engagement metrics from HTML
      const engagementMetrics = this.parseEngagementFromHtml(oembedData.html || '')
      
      console.log('✅ oEmbed API response received')
      console.log('📊 Extracted engagement metrics:', engagementMetrics)
      
      return {
        success: true,
        data: oembedData,
        engagementMetrics
      }
    } catch (error) {
      console.error('❌ oEmbed API test failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Test Twitter API functionality
   */
  async testTwitterApi(tweetUrl: string): Promise<{
    success: boolean
    data?: any
    error?: string
    engagementMetrics?: {
      likes: number
      retweets: number
      replies: number
    }
  }> {
    try {
      if (!this.twitterClient) {
        throw new Error('Twitter API client not initialized')
      }

      console.log('🔍 Testing Twitter API for:', tweetUrl)
      
      const tweetId = this.extractTweetId(tweetUrl)
      if (!tweetId) {
        throw new Error('Invalid tweet URL - could not extract tweet ID')
      }

      console.log('📝 Extracted tweet ID:', tweetId)

      // Fetch tweet with engagement metrics
      const tweet = await this.twitterClient.v2.singleTweet(tweetId, {
        'tweet.fields': ['public_metrics', 'created_at', 'author_id', 'text'],
        'user.fields': ['username', 'name', 'verified'],
        expansions: ['author_id']
      })

      if (!tweet.data) {
        throw new Error('Tweet not found or not accessible')
      }

      const engagementMetrics = {
        likes: tweet.data.public_metrics?.like_count || 0,
        retweets: tweet.data.public_metrics?.retweet_count || 0,
        replies: tweet.data.public_metrics?.reply_count || 0
      }

      console.log('✅ Twitter API response received')
      console.log('📊 Engagement metrics from API:', engagementMetrics)
      
      return {
        success: true,
        data: tweet.data,
        engagementMetrics
      }
    } catch (error) {
      console.error('❌ Twitter API test failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Enhanced HTML parsing for engagement metrics
   */
  private parseEngagementFromHtml(html: string): {
    likes: number
    retweets: number
    replies: number
  } {
    const metrics = { likes: 0, retweets: 0, replies: 0 }
    
    if (!html) return metrics

    try {
      // Multiple patterns to catch different HTML structures
      const patterns = {
        likes: [
          /(\d+(?:,\d+)*)\s*(?:like|heart|❤️)/gi,
          /aria-label="[^"]*(\d+(?:,\d+)*)[^"]*like/gi,
          /title="[^"]*(\d+(?:,\d+)*)[^"]*like/gi,
          /"like_count":(\d+)/gi
        ],
        retweets: [
          /(\d+(?:,\d+)*)\s*(?:retweet|share|🔄)/gi,
          /aria-label="[^"]*(\d+(?:,\d+)*)[^"]*retweet/gi,
          /title="[^"]*(\d+(?:,\d+)*)[^"]*retweet/gi,
          /"retweet_count":(\d+)/gi
        ],
        replies: [
          /(\d+(?:,\d+)*)\s*(?:repl|comment|💬)/gi,
          /aria-label="[^"]*(\d+(?:,\d+)*)[^"]*repl/gi,
          /title="[^"]*(\d+(?:,\d+)*)[^"]*repl/gi,
          /"reply_count":(\d+)/gi
        ]
      }

      // Try each pattern for each metric type
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

      console.log('🔍 HTML parsing results:', metrics)
      return metrics
    } catch (error) {
      console.error('Error parsing engagement metrics from HTML:', error)
      return metrics
    }
  }

  /**
   * Extract tweet ID from various URL formats
   */
  private extractTweetId(url: string): string | null {
    const patterns = [
      /(?:twitter\.com|x\.com)\/[^\/]+\/status\/(\d+)/,
      /status\/(\d+)/,
      /\/(\d+)$/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    
    return null
  }

  /**
   * Comprehensive test of both APIs
   */
  async runComprehensiveTest(tweetUrl: string): Promise<{
    oembedResult: any
    twitterApiResult: any
    comparison: {
      oembedHasEngagement: boolean
      twitterApiHasEngagement: boolean
      recommendedApproach: string
    }
  }> {
    console.log('🚀 Starting comprehensive API test for:', tweetUrl)
    
    const [oembedResult, twitterApiResult] = await Promise.all([
      this.testOEmbedApi(tweetUrl),
      this.testTwitterApi(tweetUrl)
    ])

    const oembedHasEngagement = oembedResult.engagementMetrics && 
      (oembedResult.engagementMetrics.likes > 0 || 
       oembedResult.engagementMetrics.retweets > 0 || 
       oembedResult.engagementMetrics.replies > 0)

    const twitterApiHasEngagement = twitterApiResult.engagementMetrics &&
      (twitterApiResult.engagementMetrics.likes > 0 || 
       twitterApiResult.engagementMetrics.retweets > 0 || 
       twitterApiResult.engagementMetrics.replies > 0)

    let recommendedApproach = 'hybrid'
    if (twitterApiHasEngagement && !oembedHasEngagement) {
      recommendedApproach = 'twitter-api-primary'
    } else if (oembedHasEngagement && !twitterApiHasEngagement) {
      recommendedApproach = 'oembed-primary'
    } else if (!twitterApiHasEngagement && !oembedHasEngagement) {
      recommendedApproach = 'fallback-needed'
    }

    const comparison = {
      oembedHasEngagement,
      twitterApiHasEngagement,
      recommendedApproach
    }

    console.log('📊 Test Results Summary:')
    console.log('- oEmbed has engagement:', oembedHasEngagement)
    console.log('- Twitter API has engagement:', twitterApiHasEngagement)
    console.log('- Recommended approach:', recommendedApproach)

    return {
      oembedResult,
      twitterApiResult,
      comparison
    }
  }
}
