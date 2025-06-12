import { getSimplifiedXApiService } from './simplified-x-api'
import { getSimplifiedCircuitBreaker } from './simplified-circuit-breaker'
import { getSimplifiedCacheService } from './simplified-cache'
import { prisma } from './db'

export interface TweetSubmissionResult {
  success: boolean
  message: string
  tweetId?: string
  points?: number
  error?: string
}

interface TweetValidationResult {
  isValid: boolean
  error?: string
  tweetId?: string
  authorUsername?: string
}

export class SimplifiedTweetSubmissionService {
  private xApi = getSimplifiedXApiService()
  private cache = getSimplifiedCacheService()
  private circuitBreaker = getSimplifiedCircuitBreaker('tweet-submission', {
    failureThreshold: 5,
    recoveryTimeout: 2 * 60 * 1000, // 2 minutes
    monitoringPeriod: 5 * 60 * 1000, // 5 minutes
    halfOpenMaxCalls: 3
  })

  private readonly SUBMISSION_COOLDOWN_MS = 2 * 60 * 1000 // 2 minutes between submissions
  private readonly RATE_LIMIT_PER_HOUR = 10 // 10 submissions per hour per user

  /**
   * Submit a tweet for points calculation
   */
  async submitTweet(tweetUrl: string, userId: string, bypassCircuitBreaker: boolean = false): Promise<TweetSubmissionResult> {
    try {
      // Input validation
      if (!tweetUrl || typeof tweetUrl !== 'string') {
        return {
          success: false,
          message: 'Tweet URL is required and must be a valid string'
        }
      }

      if (!userId || typeof userId !== 'string') {
        return {
          success: false,
          message: 'User ID is required for tweet submission'
        }
      }

      // Normalize URL
      const normalizedUrl = tweetUrl.trim()
      if (!normalizedUrl) {
        return {
          success: false,
          message: 'Tweet URL cannot be empty'
        }
      }

      // Check rate limiting
      const rateLimitCheck = await this.checkRateLimit(userId)
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          message: rateLimitCheck.message || 'Rate limit exceeded'
        }
      }

      // Check submission cooldown
      const cooldownCheck = await this.checkSubmissionCooldown(userId)
      if (!cooldownCheck.allowed) {
        return {
          success: false,
          message: cooldownCheck.message || 'Please wait before submitting another tweet'
        }
      }

      // Validate and process tweet
      const operation = async () => {
        return await this.processTweetSubmission(normalizedUrl, userId)
      }

      const fallback = async () => {
        return {
          success: false,
          message: 'Tweet submission service is temporarily unavailable. Please try again later.'
        }
      }

      if (bypassCircuitBreaker) {
        console.log('🔓 Circuit breaker bypass enabled for tweet submission')
        return await operation()
      }

      return await this.circuitBreaker.execute(operation, fallback)

    } catch (error) {
      console.error('❌ Tweet submission error:', error)
      return {
        success: false,
        message: 'An unexpected error occurred during tweet submission',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  private async processTweetSubmission(tweetUrl: string, userId: string): Promise<TweetSubmissionResult> {
    // Validate tweet URL and extract tweet ID
    const validation = await this.validateTweet(tweetUrl, userId)
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.error || 'Tweet validation failed'
      }
    }

    const tweetId = validation.tweetId!
    const authorUsername = validation.authorUsername!

    // Check if tweet was already submitted
    const existingSubmission = await this.checkExistingSubmission(tweetId, userId)
    if (existingSubmission) {
      return {
        success: false,
        message: 'This tweet has already been submitted'
      }
    }

    // Calculate points based on tweet content and engagement
    const points = await this.calculatePoints(tweetId)

    // Save submission to database
    try {
      await prisma.tweetSubmission.create({
        data: {
          userId,
          tweetId,
          tweetUrl,
          authorUsername,
          points,
          submittedAt: new Date(),
          status: 'approved' // Auto-approve for now
        }
      })

      // Update user's total points
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalPoints: {
            increment: points
          }
        }
      })

      // Update rate limiting and cooldown
      await this.updateRateLimit(userId)
      await this.updateSubmissionCooldown(userId)

      console.log(`✅ Tweet submission successful: ${tweetId} for user ${userId} (${points} points)`)

      return {
        success: true,
        message: `Tweet submitted successfully! You earned ${points} points.`,
        tweetId,
        points
      }

    } catch (dbError) {
      console.error('❌ Database error during tweet submission:', dbError)
      return {
        success: false,
        message: 'Failed to save tweet submission. Please try again.',
        error: dbError instanceof Error ? dbError.message : String(dbError)
      }
    }
  }

  private async validateTweet(tweetUrl: string, userId: string): Promise<TweetValidationResult> {
    try {
      // Extract tweet ID from URL
      const tweetId = this.xApi.extractTweetId(tweetUrl)
      if (!tweetId) {
        return {
          isValid: false,
          error: 'Invalid tweet URL format. Please provide a valid X/Twitter URL.'
        }
      }

      // Fetch tweet data
      const tweetData = await this.xApi.getTweetById(tweetId)
      if (!tweetData) {
        return {
          isValid: false,
          error: 'Tweet not found. It may be deleted, private, or the URL is incorrect.'
        }
      }

      // Get user data to verify ownership
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { xUsername: true }
      })

      if (!user?.xUsername) {
        return {
          isValid: false,
          error: 'Your X/Twitter username is not linked. Please sign in with Twitter again.'
        }
      }

      // Verify tweet ownership
      if (tweetData.author.username.toLowerCase() !== user.xUsername.toLowerCase()) {
        return {
          isValid: false,
          error: 'You can only submit your own tweets. This tweet belongs to a different user.'
        }
      }

      // Check if tweet is related to LayerEdge community
      if (!tweetData.isFromLayerEdgeCommunity) {
        return {
          isValid: false,
          error: 'Tweet must mention @layeredge or $EDGEN to be eligible for points.'
        }
      }

      return {
        isValid: true,
        tweetId,
        authorUsername: tweetData.author.username
      }

    } catch (error) {
      console.error('❌ Tweet validation error:', error)
      return {
        isValid: false,
        error: 'Failed to validate tweet. Please try again later.'
      }
    }
  }

  private async checkExistingSubmission(tweetId: string, userId: string): Promise<boolean> {
    try {
      const existing = await prisma.tweetSubmission.findFirst({
        where: {
          OR: [
            { tweetId, userId },
            { tweetId } // Check if any user has submitted this tweet
          ]
        }
      })
      return !!existing
    } catch (error) {
      console.error('❌ Error checking existing submission:', error)
      return false
    }
  }

  private async calculatePoints(tweetId: string): Promise<number> {
    try {
      const tweetData = await this.xApi.getTweetById(tweetId)
      if (!tweetData) {
        return 10 // Base points if we can't fetch engagement data
      }

      // Base points for tweet submission
      let points = 10

      // Bonus points based on engagement
      const { likes, retweets, replies, quotes } = tweetData.engagement
      
      // Engagement multipliers
      points += Math.min(likes * 0.5, 50) // Max 50 points from likes
      points += Math.min(retweets * 2, 100) // Max 100 points from retweets
      points += Math.min(replies * 1, 30) // Max 30 points from replies
      points += Math.min(quotes * 3, 90) // Max 90 points from quotes

      return Math.round(points)
    } catch (error) {
      console.error('❌ Error calculating points:', error)
      return 10 // Fallback to base points
    }
  }

  private async checkRateLimit(userId: string): Promise<{ allowed: boolean; message?: string }> {
    try {
      const cacheKey = `rate_limit:tweet_submission:${userId}`
      const cached = await this.cache.get<{ count: number; resetTime: number }>(cacheKey)
      const now = Date.now()

      if (!cached || now >= cached.resetTime) {
        return { allowed: true }
      }

      if (cached.count >= this.RATE_LIMIT_PER_HOUR) {
        const resetTime = new Date(cached.resetTime)
        const waitTime = Math.ceil((cached.resetTime - now) / 1000 / 60)
        return {
          allowed: false,
          message: `You've reached the hourly submission limit (${this.RATE_LIMIT_PER_HOUR} tweets/hour). Please wait ${waitTime} minutes.`
        }
      }

      return { allowed: true }
    } catch (error) {
      console.error('❌ Error checking rate limit:', error)
      return { allowed: true } // Allow on error
    }
  }

  private async updateRateLimit(userId: string): Promise<void> {
    try {
      const cacheKey = `rate_limit:tweet_submission:${userId}`
      const cached = await this.cache.get<{ count: number; resetTime: number }>(cacheKey)
      const now = Date.now()
      const oneHour = 60 * 60 * 1000

      if (!cached || now >= cached.resetTime) {
        await this.cache.set(cacheKey, { count: 1, resetTime: now + oneHour }, 3600)
      } else {
        await this.cache.set(cacheKey, { count: cached.count + 1, resetTime: cached.resetTime }, 3600)
      }
    } catch (error) {
      console.error('❌ Error updating rate limit:', error)
    }
  }

  private async checkSubmissionCooldown(userId: string): Promise<{ allowed: boolean; message?: string }> {
    try {
      const cacheKey = `cooldown:tweet_submission:${userId}`
      const lastSubmission = await this.cache.get<number>(cacheKey)
      
      if (!lastSubmission) {
        return { allowed: true }
      }

      const now = Date.now()
      const timeSinceLastSubmission = now - lastSubmission

      if (timeSinceLastSubmission < this.SUBMISSION_COOLDOWN_MS) {
        const waitTime = Math.ceil((this.SUBMISSION_COOLDOWN_MS - timeSinceLastSubmission) / 1000 / 60)
        return {
          allowed: false,
          message: `Please wait ${waitTime} minutes before submitting another tweet.`
        }
      }

      return { allowed: true }
    } catch (error) {
      console.error('❌ Error checking submission cooldown:', error)
      return { allowed: true } // Allow on error
    }
  }

  private async updateSubmissionCooldown(userId: string): Promise<void> {
    try {
      const cacheKey = `cooldown:tweet_submission:${userId}`
      await this.cache.set(cacheKey, Date.now(), 300) // 5 minutes TTL
    } catch (error) {
      console.error('❌ Error updating submission cooldown:', error)
    }
  }
}

// Singleton instance
let simplifiedTweetSubmissionService: SimplifiedTweetSubmissionService | null = null

export function getSimplifiedTweetSubmissionService(): SimplifiedTweetSubmissionService {
  if (!simplifiedTweetSubmissionService) {
    simplifiedTweetSubmissionService = new SimplifiedTweetSubmissionService()
  }
  return simplifiedTweetSubmissionService
}
