import { TwitterOAuthService } from './twitter-oauth'
import { getTokenEncryption } from './token-encryption'
import { prisma } from './db'

export interface TwitterUserTimelineResponse {
  data?: Array<{
    id: string
    text: string
    created_at: string
    public_metrics?: {
      retweet_count: number
      like_count: number
      reply_count: number
      quote_count: number
    }
    author_id?: string
  }>
  includes?: {
    users?: Array<{
      id: string
      username: string
      name: string
      profile_image_url?: string
    }>
  }
  meta?: {
    result_count: number
    newest_id?: string
    oldest_id?: string
    next_token?: string
  }
  errors?: Array<{
    title: string
    detail: string
    type: string
  }>
}

export interface UserApiResult<T> {
  success: boolean
  data: T | null
  error?: string
  rateLimited?: boolean
  tokenRefreshed?: boolean
}

/**
 * Twitter API service using user-specific OAuth tokens
 */
export class TwitterUserApiService {
  private tokenEncryption = getTokenEncryption()
  private oauthService = new TwitterOAuthService()

  /**
   * Get user's decrypted access token, refreshing if necessary
   */
  async getUserAccessToken(userId: string): Promise<{
    accessToken: string | null
    refreshed: boolean
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        accessToken: true,
        refreshToken: true,
        tokenExpiresAt: true
      }
    })

    if (!user?.accessToken) {
      return { accessToken: null, refreshed: false }
    }

    // Decrypt the stored token
    let accessToken: string
    try {
      accessToken = this.tokenEncryption.safeDecrypt(user.accessToken)
    } catch (error) {
      console.error(`Failed to decrypt access token for user ${userId}:`, error)
      return { accessToken: null, refreshed: false }
    }

    // Check if token needs refresh
    const now = new Date()
    const expiresAt = user.tokenExpiresAt
    const needsRefresh = !expiresAt || expiresAt <= now

    if (needsRefresh && user.refreshToken) {
      try {
        console.log(`🔄 Refreshing expired token for user ${userId}`)
        
        const decryptedRefreshToken = this.tokenEncryption.safeDecrypt(user.refreshToken)
        const tokenResponse = await this.oauthService.refreshToken(decryptedRefreshToken)

        // Encrypt and store new tokens
        const encryptedAccessToken = this.tokenEncryption.encrypt(tokenResponse.access_token)
        const encryptedRefreshToken = tokenResponse.refresh_token 
          ? this.tokenEncryption.encrypt(tokenResponse.refresh_token)
          : user.refreshToken // Keep existing if no new one provided

        await prisma.user.update({
          where: { id: userId },
          data: {
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            tokenExpiresAt: tokenResponse.expires_in
              ? new Date(Date.now() + tokenResponse.expires_in * 1000)
              : null
          }
        })

        console.log(`✅ Token refreshed successfully for user ${userId}`)
        return { accessToken: tokenResponse.access_token, refreshed: true }

      } catch (error) {
        console.error(`❌ Failed to refresh token for user ${userId}:`, error)
        return { accessToken: null, refreshed: false }
      }
    }

    return { accessToken, refreshed: false }
  }

  /**
   * Get user's timeline tweets using their OAuth token
   */
  async getUserTimeline(
    userId: string,
    sinceId?: string,
    maxResults: number = 100
  ): Promise<UserApiResult<TwitterUserTimelineResponse>> {
    try {
      // Get user's access token
      const { accessToken, refreshed } = await getUserAccessToken(userId)
      
      if (!accessToken) {
        return {
          success: false,
          data: null,
          error: 'No valid access token available'
        }
      }

      // Get user's Twitter username for the API call
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { xUsername: true, xUserId: true }
      })

      if (!user?.xUserId) {
        return {
          success: false,
          data: null,
          error: 'User Twitter ID not found'
        }
      }

      // Build API URL for user timeline
      let url = `https://api.twitter.com/2/users/${user.xUserId}/tweets?tweet.fields=public_metrics,created_at&user.fields=username,name,profile_image_url&expansions=author_id&max_results=${Math.min(maxResults, 100)}`

      if (sinceId) {
        url += `&since_id=${sinceId}`
      }

      console.log(`🔍 Fetching timeline for user ${userId} (@${user.xUsername})`)

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000)
      })

      // Log rate limit headers
      const rateLimitLimit = response.headers.get('x-rate-limit-limit')
      const rateLimitRemaining = response.headers.get('x-rate-limit-remaining')
      const rateLimitReset = response.headers.get('x-rate-limit-reset')
      
      console.log(`📊 User API rate limit: ${rateLimitRemaining}/${rateLimitLimit} remaining, resets at ${rateLimitReset}`)

      if (!response.ok) {
        if (response.status === 429) {
          console.warn(`🚫 Rate limit reached for user ${userId}`)
          return {
            success: false,
            data: null,
            error: 'User API rate limit exceeded',
            rateLimited: true,
            tokenRefreshed: refreshed
          }
        }

        const errorText = await response.text()
        console.error(`❌ User API error ${response.status}: ${errorText}`)
        
        return {
          success: false,
          data: null,
          error: `User API error: ${response.status} ${response.statusText}`,
          tokenRefreshed: refreshed
        }
      }

      const data = await response.json() as TwitterUserTimelineResponse

      if (data.errors && data.errors.length > 0) {
        console.error('❌ User API errors:', data.errors)
        return {
          success: false,
          data: null,
          error: `API errors: ${data.errors.map(e => e.title || e.detail).join(', ')}`,
          tokenRefreshed: refreshed
        }
      }

      const tweetCount = data.data?.length || 0
      console.log(`✅ User timeline fetched: ${tweetCount} tweets for user ${userId}`)

      return {
        success: true,
        data: data,
        tokenRefreshed: refreshed
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ Error fetching user timeline for ${userId}:`, errorMessage)
      
      return {
        success: false,
        data: null,
        error: errorMessage
      }
    }
  }

  /**
   * Filter timeline tweets for LayerEdge mentions
   */
  filterTimelineForMentions(timeline: TwitterUserTimelineResponse): TwitterUserTimelineResponse {
    if (!timeline.data) {
      return timeline
    }

    const mentionPatterns = [
      /@layeredge/i,
      /\$EDGEN/i,
      /layeredge/i,
      /EDGEN/i
    ]

    const filteredTweets = timeline.data.filter(tweet => {
      return mentionPatterns.some(pattern => pattern.test(tweet.text))
    })

    return {
      ...timeline,
      data: filteredTweets,
      meta: {
        ...timeline.meta,
        result_count: filteredTweets.length
      }
    }
  }
}

// Export function to get user access token (used by monitoring service)
export async function getUserAccessToken(userId: string) {
  const service = new TwitterUserApiService()
  return service.getUserAccessToken(userId)
}
