import { extractTweetId } from './utils'

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

export class TwitterApiService {
  private bearerToken: string

  constructor() {
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN || ''
    if (!this.bearerToken) {
      throw new Error('Twitter Bearer Token is required')
    }
  }

  private async makeRequest(url: string, retryCount: number = 0): Promise<TwitterApiResponse | TwitterUserApiResponse> {
    const maxRetries = 3
    const baseDelay = 1000 // 1 second

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

      // Handle rate limiting with exponential backoff
      if (response.status === 429) {
        const resetTime = response.headers.get('x-rate-limit-reset')
        const remainingRequests = response.headers.get('x-rate-limit-remaining')

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
        (error as any)?.name === 'AbortError' || // Timeout
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
        return true
      }

      // For regular tweet URLs, we need to use Twitter API to verify community membership
      // Since we don't have full Twitter API access for community verification,
      // we'll implement a more permissive approach for now

      // Extract tweet ID and try to fetch tweet data
      const tweetId = this.extractTweetIdFromUrl(tweetUrl)
      if (!tweetId) {
        return false
      }

      // For now, we'll accept any valid tweet and assume it's from the community
      // In a production environment, you would use Twitter's API to check:
      // 1. If the tweet has community context
      // 2. If the community ID matches the LayerEdge community

      console.log(`Verifying tweet ${tweetId} for community ${communityId}`)
      return true // Temporarily accept all valid tweets

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
      console.log(`Fetching engagement metrics for URL: ${tweetUrl}`)

      const tweetId = extractTweetId(tweetUrl)
      if (!tweetId) {
        console.error('Failed to extract tweet ID from URL:', tweetUrl)
        return null
      }

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
      return {
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
        replies: tweet.public_metrics?.reply_count || 0,
      }
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
}
