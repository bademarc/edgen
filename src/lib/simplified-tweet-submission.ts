import { getSimplifiedXApiService } from './simplified-x-api'
import { getSimplifiedCircuitBreaker } from './simplified-circuit-breaker'
import { getSimplifiedCacheService } from './simplified-cache'
import { prisma } from './db'
import { getEnhancedContentValidator } from './enhanced-content-validator'

export interface TweetSubmissionResult {
  success: boolean
  message: string
  tweetId?: string
  points?: number
  error?: string
}

export interface TweetVerificationResult {
  isValid: boolean
  isOwnTweet: boolean
  containsRequiredMentions: boolean
  tweetData?: any
  error?: string
}

interface TweetValidationResult {
  isValid: boolean
  error?: string
  tweetId?: string
  authorUsername?: string
  tweetData?: any // Add tweetData to pass the fetched data
}

export class SimplifiedTweetSubmissionService {
  private lastError?: any;
  private verified = false;
  private followersCount = 0;
  private followingCount = 0;
  private url = '';
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
   * Verify tweet ownership and validity without submitting
   * RATE LIMIT FIX: Uses fallback service instead of direct API calls
   */
  async verifyTweetOwnership(tweetUrl: string, userId: string): Promise<TweetVerificationResult> {
    try {
      // Input validation
      if (!tweetUrl || typeof tweetUrl !== 'string') {
        return {
          isValid: false,
          isOwnTweet: false,
          containsRequiredMentions: false,
          error: 'Tweet URL is required and must be a valid string'
        }
      }

      if (!userId || typeof userId !== 'string') {
        return {
          isValid: false,
          isOwnTweet: false,
          containsRequiredMentions: false,
          error: 'User ID is required for tweet verification'
        }
      }

      // Normalize URL
      const normalizedUrl = tweetUrl.trim()
      if (!normalizedUrl) {
        return {
          isValid: false,
          isOwnTweet: false,
          containsRequiredMentions: false,
          error: 'Tweet URL cannot be empty'
        }
      }

      console.log('🔍 Starting tweet verification with fallback service (rate limit safe)')

      // RATE LIMIT FIX: Use fallback service for verification instead of separate API calls
      const { getFallbackService } = await import('./fallback-service')
      const fallbackService = getFallbackService({
        preferApi: false, // Prioritize oEmbed to avoid rate limits
        apiTimeoutMs: 8000 // Shorter timeout for verification
      })

      // Fetch tweet data using fallback service (oEmbed first, then API if needed)
      const fallbackData = await fallbackService.getTweetData(normalizedUrl)

      if (!fallbackData) {
        console.error('❌ Failed to fetch tweet data via fallback service')
        const fallbackStatus = fallbackService.getStatus()

        // Provide specific error messages based on fallback status
        let errorMessage = 'Could not fetch tweet data'
        if (fallbackStatus.isApiRateLimited) {
          errorMessage = 'Twitter API is currently rate limited. Please try again in a few minutes.'
        } else if (fallbackStatus.apiFailureCount > 5) {
          errorMessage = 'Multiple API failures detected. Please try again later.'
        } else if (fallbackStatus.rateLimitResetTime && new Date() < fallbackStatus.rateLimitResetTime) {
          const waitTime = Math.ceil((fallbackStatus.rateLimitResetTime.getTime() - Date.now()) / 1000 / 60)
          errorMessage = `Twitter API rate limited. Please try again in ${waitTime} minutes.`
        }

        return {
          isValid: false,
          isOwnTweet: false,
          containsRequiredMentions: false,
          error: errorMessage
        }
      }

      console.log(`✅ Tweet data fetched via ${fallbackData.source} (rate limit safe)`)

      // Extract tweet ID for validation
      const tweetId = fallbackData.id
      if (!tweetId) {
        return {
          isValid: false,
          isOwnTweet: false,
          containsRequiredMentions: false,
          error: 'Could not extract tweet ID from fetched data'
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
          isOwnTweet: false,
          containsRequiredMentions: false,
          error: 'Your X/Twitter username is not linked. Please sign in with Twitter again.'
        }
      }

      // Verify tweet ownership using fetched data
      const isOwnTweet = user.xUsername.toLowerCase() === fallbackData.author.username.toLowerCase()
      const containsRequiredMentions = fallbackData.isFromLayerEdgeCommunity

      console.log(`🔐 Verification results: isOwnTweet=${isOwnTweet}, containsRequiredMentions=${containsRequiredMentions}`)

      return {
        isValid: true,
        isOwnTweet,
        containsRequiredMentions,
        tweetData: {
          id: fallbackData.id,
          content: fallbackData.content,
          author: {
            id: fallbackData.author.id,
            username: fallbackData.author.username,
            name: fallbackData.author.name,
            verified: false, // Not available in simplified author interface
            profileImage: fallbackData.author.profileImage || '',
            followersCount: 0, // Not available in simplified author interface
            followingCount: 0 // Not available in simplified author interface
          },
          engagement: {
            likes: fallbackData.likes || 0,
            retweets: fallbackData.retweets || 0,
            replies: fallbackData.replies || 0,
            quotes: 0
          },
          createdAt: fallbackData.createdAt,
          url: normalizedUrl
        }
      }

    } catch (error) {
      console.error('❌ Tweet verification error:', error)

      // Provide more specific error messages for common issues
      let errorMessage = 'An unexpected error occurred during tweet verification'
      if (error instanceof Error) {
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          errorMessage = 'Twitter API rate limit exceeded. Please try again in a few minutes.'
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
          errorMessage = 'Network error occurred. Please check your connection and try again.'
        }
      }

      return {
        isValid: false,
        isOwnTweet: false,
        containsRequiredMentions: false,
        error: errorMessage
      }
    }
  }

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
    const tweetData = validation.tweetData! // Get the tweet data from validation

    // Check if tweet was already submitted
    const existingSubmission = await this.checkExistingSubmission(tweetId, userId)
    if (existingSubmission) {
      return {
        success: false,
        message: 'This tweet has already been submitted'
      }
    }

    // Calculate points based on tweet engagement data with enhanced Apify metrics
    const points = await this.calculatePointsFromData(tweetData, tweetUrl)

    // Get enhanced engagement metrics for database storage
    let enhancedMetrics = null
    try {
      const { getApifyTwitterService } = await import('./apify-twitter-service')
      const apifyService = getApifyTwitterService()

      if (apifyService.isReady()) {
        console.log('🔍 Fetching enhanced metrics from Apify for database storage...')
        // Use standard timeout for submission storage (accuracy over speed)
        enhancedMetrics = await apifyService.getTweetEngagementMetricsByUrl(tweetUrl, false)

        if (enhancedMetrics) {
          console.log('✅ Successfully fetched enhanced metrics from Apify:', enhancedMetrics)
        } else {
          console.log('⚠️ Apify returned null metrics, will use fallback data')
        }
      } else {
        console.log('⚠️ Apify service not ready, will use fallback data')
      }
    } catch (error) {
      console.log('⚠️ Could not fetch enhanced metrics for storage, will use fallback data:', error)
    }

    // Save submission to database using Tweet model with enhanced metrics
    try {
      await prisma.tweet.create({
        data: {
          userId,
          tweetId,
          url: tweetUrl,
          content: tweetData.content,
          likes: enhancedMetrics?.likes || tweetData.engagement.likes,
          retweets: enhancedMetrics?.retweets || tweetData.engagement.retweets,
          replies: enhancedMetrics?.replies || tweetData.engagement.replies,
          quotes: enhancedMetrics?.quotes || 0,
          views: enhancedMetrics?.views || 0,
          bookmarks: enhancedMetrics?.bookmarks || 0,
          totalPoints: points,
          isVerified: true,
          originalTweetDate: tweetData.createdAt,
          submittedAt: new Date(),
          apifyMetadata: enhancedMetrics ? JSON.parse(JSON.stringify({
            source: 'apify',
            fetchedAt: new Date().toISOString(),
            metrics: enhancedMetrics
          })) : undefined
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

      // PRODUCTION FIX: Use fallback service instead of direct X API call
      console.log('🔄 Using fallback service for tweet validation (handles rate limits)')
      const { getFallbackService } = await import('./fallback-service')
      const fallbackService = getFallbackService({
        preferApi: process.env.PREFER_API === 'true',
        apiTimeoutMs: 10000
      })

      const fallbackData = await fallbackService.getTweetData(tweetUrl)
      if (!fallbackData) {
        return {
          isValid: false,
          error: 'Tweet not found. It may be deleted, private, or the URL is incorrect.'
        }
      }

      // Convert fallback data to XTweetData format
      const tweetData = {
        id: fallbackData.id,
        content: fallbackData.content,
        author: {
          id: fallbackData.author.id,
          username: fallbackData.author.username,
          name: fallbackData.author.name,
          verified: false, // Not available in simplified author interface
          profileImage: fallbackData.author.profileImage || '',
          followersCount: 0, // Not available in simplified author interface
          followingCount: 0 // Not available in simplified author interface
        },
        engagement: {
          likes: fallbackData.likes || 0,
          retweets: fallbackData.retweets || 0,
          replies: fallbackData.replies || 0,
          quotes: 0
        },
        createdAt: fallbackData.createdAt,
        isFromLayerEdgeCommunity: fallbackData.isFromLayerEdgeCommunity,
        url: tweetUrl // Use the original URL parameter instead of fallbackData.url
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

      // SECURITY: FUD Detection - Validate content for harmful material
      console.log('🛡️ SECURITY: Performing advanced FUD detection on tweet content')
      console.log(`📝 SECURITY: Tweet URL: ${tweetUrl}`)
      console.log(`📝 SECURITY: Tweet Content: "${tweetData.content}"`)
      console.log(`📝 SECURITY: User ID: ${userId}`)

      const contentValidator = getEnhancedContentValidator()

      try {
        const contentValidation = await contentValidator.validateContent(tweetData.content, {
          enableFUDDetection: true,
          enableAdvancedFUDDetection: true,
          strictMode: false,
          requireLayerEdgeKeywords: true,
          allowWarnings: true
        })

        // SECURITY: Always log validation result
        console.log('🔍 SECURITY: FUD validation result:', {
          allowSubmission: contentValidation.allowSubmission,
          isValid: contentValidation.isValid,
          isBlocked: contentValidation.fudAnalysis?.isBlocked,
          isWarning: contentValidation.fudAnalysis?.isWarning,
          score: contentValidation.fudAnalysis?.score,
          flaggedTerms: contentValidation.fudAnalysis?.flaggedTerms,
          message: contentValidation.message
        })

        if (!contentValidation.allowSubmission) {
          console.log(`🚫 SECURITY: Content blocked by FUD detection: ${contentValidation.message}`)
          console.log(`🚫 SECURITY: FUD Analysis:`, contentValidation.fudAnalysis)
          return {
            isValid: false,
            error: contentValidation.message + (contentValidation.suggestions.length > 0
              ? ` Suggestions: ${contentValidation.suggestions.join(', ')}`
              : '')
          }
        }

      } catch (validationError) {
        console.error('🚨 CRITICAL: FUD validation error in simplified submission:', validationError)
        console.error('🚨 CRITICAL: Blocking submission for safety')
        return {
          isValid: false,
          error: 'Content validation failed due to system error. Please try again later.'
        }
      }

      // SECURITY: Additional FUD detection using basic service as fallback
      console.log('🔒 SECURITY: Running additional FUD detection as fallback')
      const { getFUDDetectionService } = await import('./fud-detection-service')
      const fudService = getFUDDetectionService()
      const basicFudResult = await fudService.detectFUD(tweetData.content)

      console.log('🔍 SECURITY: Basic FUD detection result:', {
        isBlocked: basicFudResult.isBlocked,
        isWarning: basicFudResult.isWarning,
        score: basicFudResult.score,
        flaggedTerms: basicFudResult.flaggedTerms
      })

      if (basicFudResult.isBlocked) {
        console.log(`🚫 SECURITY: Content blocked by fallback FUD detection: ${basicFudResult.message}`)
        return {
          isValid: false,
          error: `Content blocked by security system: ${basicFudResult.message}`
        }
      }

      // Note: contentValidation is only available inside the try block above
      // If we reach here, validation passed, so no review needed

      console.log('✅ SECURITY: All validation checks passed in simplified submission')
      return {
        isValid: true,
        tweetId,
        authorUsername: tweetData.author.username,
        tweetData: tweetData // Return the fetched tweet data
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
      const existing = await prisma.tweet.findFirst({
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

  /**
   * Calculate points from tweet data with enhanced Apify metrics
   */
  private async calculatePointsFromData(tweetData: any, tweetUrl?: string): Promise<number> {
    try {
      // Base points for tweet submission
      let points = 10

      // Try to get enhanced engagement metrics from Apify
      let enhancedMetrics = null
      if (tweetUrl) {
        try {
          const { getApifyTwitterService } = await import('./apify-twitter-service')
          const apifyService = getApifyTwitterService()

          if (apifyService.isReady()) {
            console.log('🔍 Fetching enhanced metrics from Apify for points calculation...')
            // Use standard timeout for submission (accuracy over speed)
            enhancedMetrics = await apifyService.getTweetEngagementMetricsByUrl(tweetUrl, false)

            if (enhancedMetrics) {
              console.log('✅ Enhanced metrics from Apify for points calculation:', enhancedMetrics)
            } else {
              console.log('⚠️ Apify returned null metrics for points calculation, using fallback')
            }
          } else {
            console.log('⚠️ Apify service not ready for points calculation, using fallback')
          }
        } catch (error) {
          console.log('⚠️ Could not fetch enhanced metrics for points calculation, using fallback:', error)
        }
      }

      if (enhancedMetrics) {
        // Use enhanced metrics from Apify
        points += Math.min(enhancedMetrics.likes * 0.5, 50) // Max 50 points from likes
        points += Math.min(enhancedMetrics.retweets * 2, 100) // Max 100 points from retweets
        points += Math.min(enhancedMetrics.replies * 1, 30) // Max 30 points from replies
        points += Math.min(enhancedMetrics.quotes * 3, 90) // Max 90 points from quotes
        points += Math.min(enhancedMetrics.views * 0.01, 25) // Max 25 points from views
        points += Math.min(enhancedMetrics.bookmarks * 5, 75) // Max 75 points from bookmarks

        console.log(`📊 Enhanced points calculation: Base(10) + Likes(${enhancedMetrics.likes}*0.5) + Retweets(${enhancedMetrics.retweets}*2) + Replies(${enhancedMetrics.replies}*1) + Quotes(${enhancedMetrics.quotes}*3) + Views(${enhancedMetrics.views}*0.01) + Bookmarks(${enhancedMetrics.bookmarks}*5) = ${Math.round(points)}`)
      } else {
        // Fallback to basic engagement metrics
        const { likes, retweets, replies, quotes } = tweetData.engagement || {}

        points += Math.min((likes || 0) * 0.5, 50) // Max 50 points from likes
        points += Math.min((retweets || 0) * 2, 100) // Max 100 points from retweets
        points += Math.min((replies || 0) * 1, 30) // Max 30 points from replies
        points += Math.min((quotes || 0) * 3, 90) // Max 90 points from quotes

        console.log(`📊 Fallback points calculation: Base(10) + Likes(${likes || 0}*0.5) + Retweets(${retweets || 0}*2) + Replies(${replies || 0}*1) + Quotes(${quotes || 0}*3) = ${Math.round(points)}`)

      }

      return Math.round(points)
    } catch (error) {
      console.error('❌ Error calculating points from data:', error)
      return 10 // Fallback to base points
    }
  }

  /**
   * Legacy method - kept for backward compatibility but now uses fallback service
   */
  private async calculatePoints(tweetId: string): Promise<number> {
    try {
      console.log('⚠️ Using legacy calculatePoints method - consider using calculatePointsFromData instead')

      // Use fallback service instead of direct API call to avoid rate limits
      const { getFallbackService } = await import('./fallback-service')
      const fallbackService = getFallbackService({
        preferApi: false, // Prefer oEmbed to avoid rate limits
        apiTimeoutMs: 5000
      })

      const tweetUrl = `https://x.com/i/web/status/${tweetId}`
      const tweetData = await fallbackService.getTweetData(tweetUrl)

      if (!tweetData) {
        console.log('📊 No tweet data available, using base points')
        return 10 // Base points if we can't fetch engagement data
      }

      return await this.calculatePointsFromData({
        engagement: {
          likes: tweetData.likes || 0,
          retweets: tweetData.retweets || 0,
          replies: tweetData.replies || 0,
          quotes: 0
        }
      }, `https://x.com/i/web/status/${tweetId}`)
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
