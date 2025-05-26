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

  private async makeRequest(url: string): Promise<TwitterApiResponse | TwitterUserApiResponse> {
    try {
      console.log(`Making Twitter API request to: ${url}`)

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json',
        },
      })

      console.log(`Twitter API response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Twitter API error: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Twitter API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Twitter API response data:', JSON.stringify(data, null, 2))
      return data
    } catch (error) {
      console.error('Error in makeRequest:', error)
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
}
