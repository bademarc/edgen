import { TwitterApiService } from './twitter-api'
import { TwitterUserApiService } from './twitter-user-api'
import { prisma } from './db'
import { validateTweetContent, calculatePoints } from './utils'

interface TwitterTimelineResponse {
  data?: Array<{
    id: string
    text: string
    created_at: string
    public_metrics?: {
      like_count: number
      retweet_count: number
      reply_count: number
      quote_count?: number
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
    next_token?: string
    newest_id?: string
    oldest_id?: string
  }
  errors?: Array<{
    title: string
    detail: string
    type: string
  }>
}

export class TwitterMonitoringService {
  private twitterApi: TwitterApiService | null = null
  private userApi: TwitterUserApiService
  private lastRateLimitTime: number = 0
  private rateLimitBackoffMs: number = 0

  constructor() {
    try {
      this.twitterApi = new TwitterApiService()
      console.log('✅ Twitter API service initialized for monitoring')
    } catch (error) {
      console.warn('⚠️ Twitter API service unavailable:', error)
      this.twitterApi = null
    }

    // Initialize user-specific API service
    this.userApi = new TwitterUserApiService()
  }

  /**
   * Check if we should wait due to rate limiting
   */
  private async checkRateLimitBackoff(): Promise<void> {
    const now = Date.now()

    if (this.rateLimitBackoffMs > 0 && (now - this.lastRateLimitTime) < this.rateLimitBackoffMs) {
      const remainingWait = this.rateLimitBackoffMs - (now - this.lastRateLimitTime)
      console.log(`⏳ Rate limit backoff: waiting ${Math.round(remainingWait / 1000)}s before next request`)
      await new Promise(resolve => setTimeout(resolve, remainingWait))
    }
  }

  /**
   * Handle rate limit response and set backoff
   */
  private handleRateLimit(resetTime?: string): void {
    this.lastRateLimitTime = Date.now()

    if (resetTime) {
      // Use the reset time provided by Twitter API
      const resetTimestamp = parseInt(resetTime) * 1000
      this.rateLimitBackoffMs = Math.max(resetTimestamp - Date.now(), 60000) // At least 1 minute
    } else {
      // Exponential backoff: start with 1 minute, max 15 minutes
      this.rateLimitBackoffMs = Math.min(this.rateLimitBackoffMs * 2 || 60000, 900000)
    }

    console.log(`🚫 Rate limit hit. Backing off for ${Math.round(this.rateLimitBackoffMs / 1000)}s`)
  }



  /**
   * Search user timeline using their OAuth token (preferred method)
   */
  async searchUserTimelineWithToken(userId: string, sinceId?: string): Promise<{
    success: boolean
    data: TwitterTimelineResponse | null
    error?: string
    rateLimited?: boolean
    tokenRefreshed?: boolean
  }> {
    try {
      console.log(`🔑 Attempting user timeline search with OAuth token for user ${userId}`)

      const result = await this.userApi.getUserTimeline(userId, sinceId, 100)

      if (!result.success) {
        return {
          success: false,
          data: null,
          error: result.error,
          rateLimited: result.rateLimited,
          tokenRefreshed: result.tokenRefreshed
        }
      }

      // Filter timeline for LayerEdge mentions
      const filteredTimeline = this.userApi.filterTimelineForMentions(result.data!)

      console.log(`✅ User timeline search successful: ${filteredTimeline.data?.length || 0} tweets with LayerEdge mentions`)

      return {
        success: true,
        data: filteredTimeline,
        tokenRefreshed: result.tokenRefreshed
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ Error in user timeline search for ${userId}:`, errorMessage)

      return {
        success: false,
        data: null,
        error: errorMessage
      }
    }
  }

  /**
   * Search for tweets from a specific user that contain LayerEdge mentions (Bearer Token API method)
   */
  async searchUserTweets(username: string, sinceId?: string): Promise<{
    success: boolean
    data: TwitterTimelineResponse | null
    error?: string
    rateLimited?: boolean
  }> {
    try {
      // Check if we need to wait due to previous rate limiting
      await this.checkRateLimitBackoff()

      // Build search query for tweets from user containing @layeredge or $EDGEN
      const query = `from:${username} (@layeredge OR $EDGEN)`

      let url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&tweet.fields=public_metrics,created_at&user.fields=username,name,profile_image_url&expansions=author_id&max_results=100`

      if (sinceId) {
        url += `&since_id=${sinceId}`
      }

      console.log(`🔍 Searching for tweets from @${username} with LayerEdge mentions...`)
      console.log(`📝 Query: ${query}`)

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000)
      })

      // Log rate limit headers for debugging
      const rateLimitLimit = response.headers.get('x-rate-limit-limit')
      const rateLimitRemaining = response.headers.get('x-rate-limit-remaining')
      const rateLimitReset = response.headers.get('x-rate-limit-reset')

      console.log(`📊 Rate limit status: ${rateLimitRemaining}/${rateLimitLimit} remaining, resets at ${rateLimitReset}`)

      if (!response.ok) {
        if (response.status === 429) {
          const resetTime = response.headers.get('x-rate-limit-reset')
          console.warn(`🚫 Twitter API rate limit reached for search endpoint`)

          // Handle the rate limit with backoff
          this.handleRateLimit(resetTime || undefined)

          return {
            success: false,
            data: null,
            error: 'Rate limit exceeded for search endpoint',
            rateLimited: true
          }
        }

        const errorText = await response.text()
        console.error(`❌ Twitter API error ${response.status}: ${errorText}`)

        return {
          success: false,
          data: null,
          error: `Twitter API error: ${response.status} ${response.statusText}`
        }
      }

      const data = await response.json() as TwitterTimelineResponse

      if (data.errors && data.errors.length > 0) {
        console.error('❌ Twitter API search errors:', data.errors)
        return {
          success: false,
          data: null,
          error: `API errors: ${data.errors.map(e => e.title || e.detail || 'Unknown error').join(', ')}`
        }
      }

      const tweetCount = data.data?.length || 0
      console.log(`✅ Search completed: Found ${tweetCount} tweets from @${username} with LayerEdge mentions`)

      return {
        success: true,
        data: data,
        error: undefined
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ Error searching tweets for @${username}:`, errorMessage)

      return {
        success: false,
        data: null,
        error: errorMessage
      }
    }
  }

  /**
   * Process discovered tweets and add them to the database
   */
  async processDiscoveredTweets(userId: string, tweets: TwitterTimelineResponse): Promise<number> {
    if (!tweets.data || tweets.data.length === 0) {
      return 0
    }

    let processedCount = 0
    const author = tweets.includes?.users?.[0]

    if (!author) {
      console.error('No author data found in tweet response')
      return 0
    }

    for (const tweet of tweets.data) {
      try {
        // Validate tweet content contains required mentions
        if (!validateTweetContent(tweet.text)) {
          console.log(`Skipping tweet ${tweet.id} - doesn't contain @layeredge or $EDGEN`)
          continue
        }

        // Construct tweet URL
        const tweetUrl = `https://x.com/${author.username}/status/${tweet.id}`

        // Check if tweet already exists
        const existingTweet = await prisma.tweet.findUnique({
          where: { url: tweetUrl }
        })

        if (existingTweet) {
          console.log(`Tweet ${tweet.id} already exists in database`)
          continue
        }

        // Calculate points (with fallback for missing metrics)
        const metrics = tweet.public_metrics || { like_count: 0, retweet_count: 0, reply_count: 0 }
        const basePoints = 5
        const totalPoints = calculatePoints({
          likes: metrics.like_count,
          retweets: metrics.retweet_count,
          comments: metrics.reply_count
        })

        // Create tweet record
        const newTweet = await prisma.tweet.create({
          data: {
            url: tweetUrl,
            content: tweet.text,
            userId: userId,
            likes: metrics.like_count,
            retweets: metrics.retweet_count,
            replies: metrics.reply_count,
            basePoints,
            bonusPoints: totalPoints - basePoints,
            totalPoints,
            isVerified: true,
            tweetId: tweet.id,
            discoveredAt: new Date(),
            isAutoDiscovered: true,
          },
        })

        // Update user's total points
        await prisma.user.update({
          where: { id: userId },
          data: {
            totalPoints: {
              increment: totalPoints,
            },
          },
        })

        // Create points history record
        await prisma.pointsHistory.create({
          data: {
            userId: userId,
            tweetId: newTweet.id,
            pointsAwarded: totalPoints,
            reason: 'Automatic tweet discovery',
          },
        })

        processedCount++
        console.log(`Successfully processed tweet ${tweet.id} for user ${userId} - awarded ${totalPoints} points`)

      } catch (error) {
        console.error(`Error processing tweet ${tweet.id}:`, error)
        continue
      }
    }

    return processedCount
  }



  /**
   * Monitor tweets for a specific user
   */
  async monitorUserTweets(userId: string): Promise<{
    success: boolean
    tweetsFound: number
    error?: string
  }> {
    try {
      console.log(`🔍 Starting tweet monitoring for user ${userId}`)

      // Get user data with more comprehensive checks
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          xUsername: true,
          xUserId: true,
          autoMonitoringEnabled: true,
          lastTweetCheck: true,
        },
      })

      // Enhanced validation with specific error messages
      if (!user) {
        console.warn(`❌ User ${userId} not found in database`)
        return {
          success: false,
          tweetsFound: 0,
          error: 'User not found in database'
        }
      }

      console.log(`👤 Processing user: ${user.name} (@${user.xUsername || 'no username'})`)

      // Check if user has required Twitter credentials
      if (!user.xUsername || !user.xUserId) {
        console.warn(`❌ User ${user.name} missing Twitter credentials: username=${user.xUsername}, userId=${user.xUserId}`)

        await prisma.tweetMonitoring.upsert({
          where: { userId },
          update: {
            lastCheckAt: new Date(),
            status: 'error',
            errorMessage: 'Incomplete Twitter credentials - please re-authenticate with Twitter to refresh your credentials',
          },
          create: {
            userId,
            lastCheckAt: new Date(),
            status: 'error',
            errorMessage: 'Incomplete Twitter credentials - please re-authenticate with Twitter to refresh your credentials',
            tweetsFound: 0,
          },
        })

        return {
          success: false,
          tweetsFound: 0,
          error: 'Incomplete Twitter credentials - please re-authenticate with Twitter to refresh your credentials'
        }
      }

      if (!user.autoMonitoringEnabled) {
        console.log(`Automatic monitoring is disabled for user ${userId} (@${user.xUsername || 'no username'})`)
        return {
          success: true,
          tweetsFound: 0,
          error: 'Automatic monitoring is disabled for this user'
        }
      }

      // Check for missing Twitter data
      if (!user.xUsername || !user.xUserId) {
        console.warn(`User ${userId} (${user.name || 'no name'}) has incomplete Twitter data - xUsername: ${user.xUsername || 'MISSING'}, xUserId: ${user.xUserId || 'MISSING'}`)

        // Disable monitoring for this user to prevent future errors
        await prisma.user.update({
          where: { id: userId },
          data: { autoMonitoringEnabled: false }
        })

        // Update monitoring status
        await prisma.tweetMonitoring.upsert({
          where: { userId },
          update: {
            status: 'error',
            errorMessage: 'Missing Twitter username or user ID - monitoring disabled. Please re-authenticate.',
          },
          create: {
            userId,
            status: 'error',
            errorMessage: 'Missing Twitter username or user ID - monitoring disabled. Please re-authenticate.',
            tweetsFound: 0,
          },
        })

        return {
          success: false,
          tweetsFound: 0,
          error: 'Missing Twitter username or user ID - monitoring disabled. Please re-authenticate.'
        }
      }

      // Validate username format (basic check)
      // Twitter usernames can be 1-15 characters, but some legacy accounts may be longer
      // We'll be more permissive and allow up to 20 characters to handle edge cases
      if (user.xUsername.length < 1 || user.xUsername.length > 20) {
        console.warn(`User ${userId} has invalid Twitter username format: "${user.xUsername}" (length: ${user.xUsername.length})`)
        return {
          success: false,
          tweetsFound: 0,
          error: 'Invalid Twitter username format'
        }
      }

      // Additional validation: check for valid characters (alphanumeric and underscore)
      const usernamePattern = /^[a-zA-Z0-9_]+$/
      if (!usernamePattern.test(user.xUsername)) {
        console.warn(`User ${userId} has invalid Twitter username characters: "${user.xUsername}"`)
        return {
          success: false,
          tweetsFound: 0,
          error: 'Invalid Twitter username format - contains invalid characters'
        }
      }

      // Get the last tweet ID we checked to avoid duplicates
      const lastTweet = await prisma.tweet.findFirst({
        where: {
          userId: userId,
          isAutoDiscovered: true,
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          tweetId: true
        }
      })

      // Search for new tweets using fallback methods (API + Web Scraping)
      console.log(`🔍 Searching tweets for user @${user.xUsername} (ID: ${userId}) using fallback methods`)

      let processedCount = 0
      let searchMethod = 'unknown'



      // Try user-specific OAuth token first (preferred method)
      let apiSearchResult: { success: boolean; error?: string; rateLimited?: boolean; tokenRefreshed?: boolean } | null = null

      console.log(`� Attempting user timeline search with OAuth token for @${user.xUsername}`)

      const userTimelineResult = await this.searchUserTimelineWithToken(
        userId,
        lastTweet?.tweetId || undefined
      )

      apiSearchResult = userTimelineResult

      if (userTimelineResult.success && userTimelineResult.data) {
        if (userTimelineResult.data.data && userTimelineResult.data.data.length > 0) {
          processedCount = await this.processDiscoveredTweets(userId, userTimelineResult.data)
          searchMethod = 'user-api'
          console.log(`✅ User API search successful: ${processedCount} tweets processed via ${searchMethod}`)
          if (userTimelineResult.tokenRefreshed) {
            console.log(`🔄 User token was refreshed during the process`)
          }
        } else {
          console.log(`✅ User API search successful but no tweets found for @${user.xUsername}`)
          // This is a successful search with zero results, not an error
          searchMethod = 'user-api'
        }
      } else {
        console.error(`❌ User API search failed for @${user.xUsername}: ${userTimelineResult.error}`)

        // Log specific error details for debugging
        if (userTimelineResult.rateLimited) {
          console.warn(`🚫 Rate limit hit for user API`)
        } else if (userTimelineResult.error?.includes('401')) {
          console.warn(`🔐 Authentication failed for user API`)
        } else if (userTimelineResult.error?.includes('403')) {
          console.warn(`🚫 Forbidden access to user API`)
        } else if (userTimelineResult.error?.includes('No valid access token')) {
          console.warn(`🔑 No valid OAuth token available for user`)
        }

        // Fallback to Bearer Token API if user token failed
        if (this.twitterApi && processedCount === 0) {
          console.log(`🔗 Falling back to Bearer Token API search for @${user.xUsername}`)

          const searchResult = await this.searchUserTweets(
            user.xUsername,
            lastTweet?.tweetId || undefined
          )

          // Update apiSearchResult to reflect the fallback attempt
          apiSearchResult = {
            success: searchResult.success,
            error: userTimelineResult.error + '; Bearer Token fallback: ' + (searchResult.error || 'success'),
            rateLimited: searchResult.rateLimited || userTimelineResult.rateLimited
          }

          if (searchResult.success && searchResult.data) {
            if (searchResult.data.data && searchResult.data.data.length > 0) {
              processedCount = await this.processDiscoveredTweets(userId, searchResult.data)
              searchMethod = 'bearer-api'
              console.log(`✅ Bearer Token API search successful: ${processedCount} tweets processed via ${searchMethod}`)
            } else {
              console.log(`✅ Bearer Token API search successful but no tweets found for @${user.xUsername}`)
              searchMethod = 'bearer-api'
            }
          } else {
            console.error(`❌ Bearer Token API search also failed for @${user.xUsername}: ${searchResult.error}`)
          }
        } else if (!this.twitterApi) {
          console.warn(`⚠️ Bearer Token API service not available for fallback`)
        }
      }



      // Determine final status based on what happened
      if (processedCount === 0) {
        // Check if we had a successful API search but just no tweets found
        if (apiSearchResult?.success && searchMethod === 'api') {
          console.log(`✅ Monitoring completed successfully for @${user.xUsername} - no tweets found with LayerEdge mentions`)

          await prisma.tweetMonitoring.upsert({
            where: { userId },
            update: {
              lastCheckAt: new Date(),
              status: 'active',
              errorMessage: null,
            },
            create: {
              userId,
              lastCheckAt: new Date(),
              status: 'active',
              tweetsFound: 0,
            },
          })

          // Update user's last check time
          await prisma.user.update({
            where: { id: userId },
            data: {
              lastTweetCheck: new Date(),
              tweetCheckCount: {
                increment: 1
              }
            }
          })

          return {
            success: true,
            tweetsFound: 0
          }
        }

        // If we get here, both methods actually failed
        let errorMessage = 'No monitoring methods available'

        if (apiSearchResult?.rateLimited) {
          errorMessage = 'Twitter API rate limited - will retry when limit resets'
        } else if (apiSearchResult?.error) {
          errorMessage = `Twitter API failed: ${apiSearchResult.error}`
        }

        console.warn(`❌ Monitoring failed for @${user.xUsername}: ${errorMessage}`)

        await prisma.tweetMonitoring.upsert({
          where: { userId },
          update: {
            lastCheckAt: new Date(),
            status: 'error',
            errorMessage: errorMessage,
          },
          create: {
            userId,
            lastCheckAt: new Date(),
            status: 'error',
            errorMessage: errorMessage,
            tweetsFound: 0,
          },
        })

        return {
          success: false,
          tweetsFound: 0,
          error: errorMessage
        }
      }

      // Update monitoring status
      await prisma.tweetMonitoring.upsert({
        where: { userId },
        update: {
          lastCheckAt: new Date(),
          tweetsFound: {
            increment: processedCount
          },
          status: 'active',
          errorMessage: null,
        },
        create: {
          userId,
          lastCheckAt: new Date(),
          tweetsFound: processedCount,
          status: 'active',
        },
      })

      // Update user's last check time
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastTweetCheck: new Date(),
          tweetCheckCount: {
            increment: 1
          }
        }
      })

      console.log(`Tweet monitoring completed for user ${userId} - found ${processedCount} new tweets`)

      return {
        success: true,
        tweetsFound: processedCount
      }

    } catch (error) {
      console.error(`Error monitoring tweets for user ${userId}:`, error)

      // Update monitoring status with error
      await prisma.tweetMonitoring.upsert({
        where: { userId },
        update: {
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
        create: {
          userId,
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          tweetsFound: 0,
        },
      })

      return {
        success: false,
        tweetsFound: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Monitor tweets for specific users (optimized for API quota conservation)
   */
  async monitorSpecificUsers(users: Array<{
    id: string
    name?: string | null
    xUsername?: string | null
    xUserId?: string | null
  }>): Promise<{
    totalUsers: number
    successfulUsers: number
    totalTweetsFound: number
    errors: Array<{ userId: string; error: string }>
  }> {
    console.log(`🎯 Starting selective monitoring for ${users.length} critical users...`)

    const results = {
      totalUsers: users.length,
      successfulUsers: 0,
      totalTweetsFound: 0,
      errors: [] as Array<{ userId: string; error: string }>
    }

    for (const user of users) {
      try {
        console.log(`\n🔍 Processing critical user ${user.name || 'No name'} (@${user.xUsername})...`)

        const result = await this.monitorUserTweets(user.id)

        if (result.success) {
          results.successfulUsers++
          results.totalTweetsFound += result.tweetsFound
          console.log(`✅ Success: Found ${result.tweetsFound} tweets for @${user.xUsername}`)
        } else {
          results.errors.push({
            userId: user.id,
            error: result.error || 'Unknown error'
          })
          console.log(`❌ Error for @${user.xUsername}: ${result.error}`)
        }

        // Longer delay between critical users to conserve API quota
        const delay = 5000 // 5 seconds between users
        console.log(`⏳ Waiting ${delay / 1000}s before processing next critical user...`)
        await new Promise(resolve => setTimeout(resolve, delay))

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push({
          userId: user.id,
          error: errorMessage
        })
        console.error(`💥 Exception for critical user @${user.xUsername}:`, errorMessage)
        continue
      }
    }

    console.log(`\n📊 Selective monitoring completed:`)
    console.log(`  - Total users: ${results.totalUsers}`)
    console.log(`  - Successful: ${results.successfulUsers}`)
    console.log(`  - Total tweets found: ${results.totalTweetsFound}`)
    console.log(`  - Errors: ${results.errors.length}`)

    return results
  }

  /**
   * Monitor tweets for all active users
   */
  async monitorAllUsers(): Promise<{
    totalUsers: number
    successfulUsers: number
    totalTweetsFound: number
    errors: Array<{ userId: string; error: string }>
  }> {
    console.log('Starting batch tweet monitoring for all users...')

    // Enhanced query to get users with complete Twitter data
    const users = await prisma.user.findMany({
      where: {
        autoMonitoringEnabled: true,
        AND: [
          {
            xUsername: {
              not: null
            }
          },
          {
            xUsername: {
              not: ''
            }
          },
          {
            xUserId: {
              not: null
            }
          },
          {
            xUserId: {
              not: ''
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        xUsername: true,
        xUserId: true,
      },
      orderBy: {
        lastTweetCheck: 'asc' // Check users who haven't been checked recently first
      }
    })

    console.log(`Found ${users.length} users eligible for monitoring`)

    // Log users being monitored
    users.forEach(user => {
      console.log(`  - ${user.name || 'No name'} (@${user.xUsername})`)
    })

    const results = {
      totalUsers: users.length,
      successfulUsers: 0,
      totalTweetsFound: 0,
      errors: [] as Array<{ userId: string; error: string }>
    }

    for (const user of users) {
      try {
        console.log(`\n🔍 Processing user ${user.name || 'No name'} (@${user.xUsername})...`)

        const result = await this.monitorUserTweets(user.id)

        if (result.success) {
          results.successfulUsers++
          results.totalTweetsFound += result.tweetsFound
          console.log(`✅ Success: Found ${result.tweetsFound} tweets for @${user.xUsername}`)
        } else {
          results.errors.push({
            userId: user.id,
            error: result.error || 'Unknown error'
          })
          console.log(`❌ Error for @${user.xUsername}: ${result.error}`)
        }

        // Add delay between users to respect rate limits and avoid overwhelming the API
        // Increase delay if we've hit rate limits recently
        const baseDelay = 2000 // 2 seconds base delay
        const rateLimitDelay = this.rateLimitBackoffMs > 0 ? 5000 : 0 // Extra 5s if rate limited
        const totalDelay = baseDelay + rateLimitDelay

        console.log(`⏳ Waiting ${totalDelay / 1000}s before processing next user...`)
        await new Promise(resolve => setTimeout(resolve, totalDelay))

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push({
          userId: user.id,
          error: errorMessage
        })
        console.error(`💥 Exception for user @${user.xUsername}:`, errorMessage)

        // Continue with other users even if one fails completely
        continue
      }
    }

    console.log(`Batch monitoring completed: ${results.successfulUsers}/${results.totalUsers} users successful, ${results.totalTweetsFound} total tweets found`)

    return results
  }
}
