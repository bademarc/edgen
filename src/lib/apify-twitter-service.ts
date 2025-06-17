/**
 * Apify Twitter API Service for LayerEdge
 * Replaces X API for fetching engagement metrics using Apify's cheap-simple-twitter-api
 */

export interface ApifyConfig {
  apiToken: string
  actorId: string
  baseUrl: string
}

export interface ApifyTweetData {
  type: 'tweet'
  id: string
  url: string
  text: string
  source: string
  retweetCount: number
  replyCount: number
  likeCount: number
  quoteCount: number
  viewCount: number
  bookmarkCount: number
  createdAt: string
  lang: string
  isReply: boolean
  author: {
    type: 'user'
    userName: string
    url: string
    id: string
    name: string
    isBlueVerified: boolean
    profilePicture: string
    coverPicture: string
    description: string
    location: string
    followers: number
    following: number
  }
}

export interface ApifyEngagementMetrics {
  likes: number
  retweets: number
  replies: number
  quotes: number
  views: number
  bookmarks: number
}

export interface ApifyApiResponse {
  success: boolean
  data?: ApifyTweetData[]
  error?: string
  runId?: string
}

export class ApifyTwitterService {
  private config: ApifyConfig
  private readonly MAX_WAIT_TIME = 120000 // 2 minutes
  private readonly POLL_INTERVAL = 5000 // 5 seconds

  constructor(config?: Partial<ApifyConfig>) {
    this.config = {
      apiToken: process.env.APIFY_API_TOKEN || '',
      actorId: process.env.APIFY_ACTOR_ID || 'gdN28kzr6QsU4nVh8',
      baseUrl: process.env.APIFY_BASE_URL || 'https://api.apify.com/v2',
      ...config
    }

    if (!this.config.apiToken) {
      throw new Error('Apify API token is required')
    }
  }

  /**
   * Check if the service is properly configured
   */
  isReady(): boolean {
    return !!(this.config.apiToken && this.config.actorId)
  }

  /**
   * Extract tweet ID from URL
   */
  extractTweetId(tweetUrl: string): string | null {
    try {
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
   * Fetch tweet engagement metrics by tweet ID
   */
  async getTweetEngagementMetrics(tweetId: string): Promise<ApifyEngagementMetrics | null> {
    try {
      console.log(`🔍 Fetching engagement metrics for tweet ID: ${tweetId}`)

      const tweetData = await this.getTweetById(tweetId)
      if (!tweetData) {
        console.log('❌ No tweet data received from Apify')
        return null
      }

      const metrics: ApifyEngagementMetrics = {
        likes: tweetData.likeCount || 0,
        retweets: tweetData.retweetCount || 0,
        replies: tweetData.replyCount || 0,
        quotes: tweetData.quoteCount || 0,
        views: tweetData.viewCount || 0,
        bookmarks: tweetData.bookmarkCount || 0
      }

      console.log('✅ Successfully fetched engagement metrics:', metrics)
      return metrics

    } catch (error) {
      console.error('❌ Error fetching engagement metrics:', error)
      return null
    }
  }

  /**
   * Fetch tweet engagement metrics by URL
   */
  async getTweetEngagementMetricsByUrl(tweetUrl: string): Promise<ApifyEngagementMetrics | null> {
    const tweetId = this.extractTweetId(tweetUrl)
    if (!tweetId) {
      console.error('❌ Could not extract tweet ID from URL:', tweetUrl)
      return null
    }

    return this.getTweetEngagementMetrics(tweetId)
  }

  /**
   * Get tweet data by ID using Apify API
   */
  async getTweetById(tweetId: string): Promise<ApifyTweetData | null> {
    try {
      // Start async run
      const runResponse = await this.startApifyRun('tweet/by_ids', {
        tweet_ids: tweetId
      })

      if (!runResponse.success || !runResponse.runId) {
        console.error('❌ Failed to start Apify run:', runResponse.error)
        return null
      }

      // Wait for completion and get results
      const results = await this.waitForRunCompletion(runResponse.runId)
      
      if (!results || results.length === 0) {
        console.log('❌ No results returned from Apify')
        return null
      }

      return results[0] as ApifyTweetData

    } catch (error) {
      console.error('❌ Error getting tweet by ID:', error)
      return null
    }
  }

  /**
   * Start an Apify actor run
   */
  private async startApifyRun(endpoint: string, parameters: any): Promise<ApifyApiResponse> {
    try {
      // Use direct actor ID (no encoding needed for gdN28kzr6QsU4nVh8)
      const url = `${this.config.baseUrl}/acts/${this.config.actorId}/runs?token=${this.config.apiToken}`

      // The input should be passed directly as the POST body for this specific actor
      const requestBody = {
        endpoint,
        parameters
      }

      console.log(`🚀 Starting Apify run: ${endpoint}`, parameters)
      console.log(`📡 Request URL: ${url}`)
      console.log(`📦 Request body:`, requestBody)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      console.log(`📊 Response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ API Error Response: ${errorText}`)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log(`📋 Response data:`, data)

      const runId = data.data?.id

      if (!runId) {
        throw new Error('No run ID returned from Apify')
      }

      console.log(`✅ Apify run started with ID: ${runId}`)

      return {
        success: true,
        runId
      }

    } catch (error) {
      console.error('❌ Error starting Apify run:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Wait for Apify run completion and get results
   */
  private async waitForRunCompletion(runId: string): Promise<any[] | null> {
    const startTime = Date.now()

    while (Date.now() - startTime < this.MAX_WAIT_TIME) {
      try {
        // Check run status
        const statusUrl = `${this.config.baseUrl}/acts/${this.config.actorId}/runs/${runId}?token=${this.config.apiToken}`
        const statusResponse = await fetch(statusUrl)

        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          const status = statusData.data?.status

          console.log(`📊 Run status: ${status}`)

          if (status === 'SUCCEEDED') {
            // Get results
            return await this.getRunResults(runId)
          } else if (status === 'FAILED') {
            console.error('❌ Apify run failed')
            return null
          }
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, this.POLL_INTERVAL))

      } catch (error) {
        console.error('❌ Error checking run status:', error)
        await new Promise(resolve => setTimeout(resolve, this.POLL_INTERVAL))
      }
    }

    console.error('❌ Apify run timed out')
    return null
  }

  /**
   * Get results from completed Apify run
   */
  private async getRunResults(runId: string): Promise<any[] | null> {
    try {
      const resultsUrl = `${this.config.baseUrl}/actor-runs/${runId}/dataset/items?token=${this.config.apiToken}`

      console.log(`📥 Fetching results from: ${resultsUrl}`)

      const response = await fetch(resultsUrl)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Results fetch error: ${errorText}`)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const results = await response.json()
      console.log(`✅ Retrieved ${results.length} results from Apify`)

      return results

    } catch (error) {
      console.error('❌ Error getting run results:', error)
      return null
    }
  }
}

// Singleton instance
let apifyService: ApifyTwitterService | null = null

export function getApifyTwitterService(): ApifyTwitterService {
  if (!apifyService) {
    apifyService = new ApifyTwitterService()
  }
  return apifyService
}
