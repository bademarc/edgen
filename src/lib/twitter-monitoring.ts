import { TwitterApiService } from './twitter-api'
import { prisma } from './db'
import { validateTweetContent, calculatePoints } from './utils'

interface TwitterTimelineResponse {
  data?: Array<{
    id: string
    text: string
    created_at: string
    public_metrics: {
      like_count: number
      retweet_count: number
      reply_count: number
    }
    author_id: string
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
  }
  errors?: Array<{
    title: string
    detail: string
    type: string
  }>
}

export class TwitterMonitoringService {
  private twitterApi: TwitterApiService

  constructor() {
    this.twitterApi = new TwitterApiService()
  }

  /**
   * Search for tweets from a specific user that contain LayerEdge mentions
   */
  async searchUserTweets(username: string, sinceId?: string): Promise<TwitterTimelineResponse | null> {
    try {
      // Build search query for tweets from user containing @layeredge or $EDGEN
      const query = `from:${username} (@layeredge OR $EDGEN)`

      let url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&tweet.fields=public_metrics,created_at&user.fields=username,name,profile_image_url&expansions=author_id&max_results=100`

      if (sinceId) {
        url += `&since_id=${sinceId}`
      }

      console.log(`Searching for tweets from ${username} with LayerEdge mentions...`)

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000)
      })

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('Twitter API rate limit reached for search')
          return null
        }
        throw new Error(`Twitter API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json() as TwitterTimelineResponse

      if (data.errors && data.errors.length > 0) {
        console.error('Twitter API search errors:', data.errors)
        return null
      }

      console.log(`Found ${data.data?.length || 0} tweets from ${username} with LayerEdge mentions`)
      return data

    } catch (error) {
      console.error('Error searching user tweets:', error)
      return null
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

        // Calculate points
        const basePoints = 5
        const totalPoints = calculatePoints(
          tweet.public_metrics.like_count,
          tweet.public_metrics.retweet_count,
          tweet.public_metrics.reply_count
        )

        // Create tweet record
        const newTweet = await prisma.tweet.create({
          data: {
            url: tweetUrl,
            content: tweet.text,
            userId: userId,
            likes: tweet.public_metrics.like_count,
            retweets: tweet.public_metrics.retweet_count,
            replies: tweet.public_metrics.reply_count,
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
      console.log(`Starting tweet monitoring for user ${userId}`)

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
        console.warn(`User ${userId} not found in database`)
        return {
          success: false,
          tweetsFound: 0,
          error: 'User not found in database'
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
      if (user.xUsername.length < 1 || user.xUsername.length > 15) {
        console.warn(`User ${userId} has invalid Twitter username format: "${user.xUsername}"`)
        return {
          success: false,
          tweetsFound: 0,
          error: 'Invalid Twitter username format'
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

      // Search for new tweets with enhanced error handling
      console.log(`Searching tweets for user @${user.xUsername} (ID: ${userId})`)

      const tweetResponse = await this.searchUserTweets(
        user.xUsername,
        lastTweet?.tweetId || undefined
      )

      if (!tweetResponse) {
        console.warn(`Failed to fetch tweets for user @${user.xUsername} - Twitter API returned null`)

        // Update monitoring status but don't disable monitoring (could be temporary API issue)
        await prisma.tweetMonitoring.upsert({
          where: { userId },
          update: {
            lastCheckAt: new Date(),
            status: 'error',
            errorMessage: 'Failed to fetch tweets from Twitter API - will retry next cycle',
          },
          create: {
            userId,
            lastCheckAt: new Date(),
            status: 'error',
            errorMessage: 'Failed to fetch tweets from Twitter API - will retry next cycle',
            tweetsFound: 0,
          },
        })

        return {
          success: false,
          tweetsFound: 0,
          error: 'Failed to fetch tweets from Twitter API - will retry next cycle'
        }
      }

      // Process discovered tweets
      const processedCount = await this.processDiscoveredTweets(userId, tweetResponse)

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
        xUsername: {
          not: null,
          not: ''
        },
        xUserId: {
          not: null,
          not: ''
        }
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
        await new Promise(resolve => setTimeout(resolve, 2000)) // Increased to 2 seconds

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
