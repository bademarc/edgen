import { TwitterApiService } from './twitter-api'
import { TwitterUserApiService } from './twitter-user-api'
import { validateTweetContent, calculatePoints } from './utils'
import { validateTweetURL } from './url-validator'
import { getSimplifiedFallbackService } from './simplified-fallback-service'
import { enhancedErrorHandler } from './enhanced-error-handler'
import { getCircuitBreaker } from './improved-circuit-breaker'
import { prisma } from './db'

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
  tweetData?: {
    id: string
    content: string
    author: {
      id: string
      username: string
      name: string
    }
    engagement: {
      likes: number
      retweets: number
      replies: number
    }
    createdAt: Date
  }
  error?: string
}

export interface TweetOwnershipVerification {
  isValid: boolean
  isOwnTweet: boolean
  containsRequiredMentions: boolean
  tweetData?: {
    id: string
    content: string
    author: {
      id: string
      username: string
      name: string
    }
    engagement: {
      likes: number
      retweets: number
      replies: number
    }
    createdAt: Date
  }
  error?: string
}

export class ManualTweetSubmissionService {
  private twitterApi: TwitterApiService | null = null
  private userApi: TwitterUserApiService
  private lastSubmissionTime: Map<string, number> = new Map()
  private readonly SUBMISSION_COOLDOWN_MS = 3 * 60 * 1000 // 3 minutes between submissions per user (reduced for manual)
  private manualSubmissionRateLimit: Map<string, { count: number, resetTime: number }> = new Map()
  private readonly MANUAL_RATE_LIMIT = 10 // 10 submissions per hour per user
  private readonly MANUAL_RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour
  private circuitBreaker = getCircuitBreaker('manual-tweet-submission', {
    failureThreshold: 10, // Allow more failures for user-facing operations
    recoveryTimeout: 2 * 60 * 1000, // 2 minutes recovery (shorter for manual submissions)
    monitoringPeriod: 10 * 60 * 1000, // 10 minutes monitoring window
    halfOpenMaxCalls: 5, // Allow more test calls for manual submissions
    degradationMode: true // Enable fallback to simplified service
  })

  constructor() {
    try {
      this.twitterApi = new TwitterApiService()
      console.log('✅ Twitter API service initialized for manual submissions')
    } catch (error) {
      console.warn('⚠️ Twitter API service unavailable:', error)
      this.twitterApi = null
    }

    this.userApi = new TwitterUserApiService()
  }

  /**
   * Verify that a tweet URL is valid and belongs to the authenticated user
   */
  async verifyTweetOwnership(tweetUrl: string, userId: string): Promise<TweetVerificationResult> {
    try {
      // Validate URL format
      const urlValidation = validateTweetURL(tweetUrl)
      if (!urlValidation.isValid) {
        return {
          isValid: false,
          isOwnTweet: false,
          containsRequiredMentions: false,
          error: 'Invalid tweet URL format'
        }
      }

      if (!this.twitterApi) {
        return {
          isValid: false,
          isOwnTweet: false,
          containsRequiredMentions: false,
          error: 'Twitter API service unavailable'
        }
      }

      // Extract tweet ID from URL
      const tweetIdMatch = tweetUrl.match(/status\/(\d+)/)
      if (!tweetIdMatch) {
        return {
          isValid: false,
          isOwnTweet: false,
          containsRequiredMentions: false,
          error: 'Could not extract tweet ID from URL'
        }
      }

      const tweetId = tweetIdMatch[1]

      // Get user's Twitter username from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { xUsername: true }
      })

      if (!user?.xUsername) {
        return {
          isValid: false,
          isOwnTweet: false,
          containsRequiredMentions: false,
          error: 'User Twitter username not found. Please connect your Twitter account.'
        }
      }

      // Fetch tweet data using Twitter API with fallback
      let tweetData
      let apiError: Error | null = null

      try {
        tweetData = await this.twitterApi.getTweetData(tweetUrl)
      } catch (error) {
        console.error('Twitter API error in manual submission:', error)
        apiError = error instanceof Error ? error : new Error(String(error))

        // Check for specific error types that should not use fallback
        if (apiError.message.includes('monthly usage limit exceeded')) {
          console.log('🔄 Twitter API monthly limit exceeded, trying fallback service...')

          // Try fallback service
          try {
            const fallbackService = getSimplifiedFallbackService({
              preferApi: false, // Skip API since it's capped
              apiTimeoutMs: 10000
            })

            const fallbackData = await fallbackService.getTweetData(tweetUrl)
            if (fallbackData) {
              console.log('✅ Successfully fetched tweet data via fallback service')
              tweetData = {
                id: fallbackData.id,
                content: fallbackData.content,
                likes: fallbackData.likes,
                retweets: fallbackData.retweets,
                replies: fallbackData.replies,
                author: fallbackData.author,
                createdAt: fallbackData.createdAt
              }
            }
          } catch (fallbackError) {
            console.error('Fallback service also failed:', fallbackError)
            return {
              isValid: false,
              isOwnTweet: false,
              containsRequiredMentions: false,
              error: 'Twitter API monthly limit exceeded and fallback service unavailable. Manual tweet submission is temporarily unavailable. Please try again later.'
            }
          }
        }

        if (!tweetData && apiError.message.includes('rate limit exceeded')) {
          return {
            isValid: false,
            isOwnTweet: false,
            containsRequiredMentions: false,
            error: 'Twitter API rate limit exceeded. Please wait a few minutes and try again.'
          }
        }

        if (!tweetData && (apiError.message.includes('401') || apiError.message.includes('403'))) {
          return {
            isValid: false,
            isOwnTweet: false,
            containsRequiredMentions: false,
            error: 'Twitter API authentication issue. Please contact support.'
          }
        }

        if (!tweetData) {
          return {
            isValid: false,
            isOwnTweet: false,
            containsRequiredMentions: false,
            error: 'Could not fetch tweet data from Twitter API. Please check that the tweet is public and try again.'
          }
        }
      }

      if (!tweetData) {
        return {
          isValid: false,
          isOwnTweet: false,
          containsRequiredMentions: false,
          error: 'Could not fetch tweet data. Please check that the tweet is public and accessible.'
        }
      }

      // Verify tweet ownership
      const isOwnTweet = tweetData.author.username.toLowerCase() === user.xUsername.toLowerCase()

      // Check for required mentions
      const containsRequiredMentions = validateTweetContent(tweetData.content)

      return {
        isValid: true,
        isOwnTweet,
        containsRequiredMentions,
        tweetData: {
          id: tweetData.id,
          content: tweetData.content,
          author: tweetData.author,
          engagement: {
            likes: tweetData.likes,
            retweets: tweetData.retweets,
            replies: tweetData.replies
          },
          createdAt: tweetData.createdAt
        }
      }

    } catch (error) {
      console.error('Error verifying tweet ownership:', error)
      return {
        isValid: false,
        isOwnTweet: false,
        containsRequiredMentions: false,
        error: error instanceof Error ? error.message : 'Unknown verification error'
      }
    }
  }

  /**
   * Submit a tweet for points calculation with bypass option
   */
  async submitTweet(tweetUrl: string, userId: string, bypassCircuitBreaker: boolean = false): Promise<TweetSubmissionResult> {
    // Enhanced input validation
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

    // Normalize and validate URL before processing
    const normalizedUrl = tweetUrl.trim()
    if (!normalizedUrl) {
      return {
        success: false,
        message: 'Tweet URL cannot be empty'
      }
    }

    if (bypassCircuitBreaker) {
      console.log('🔓 Bypassing circuit breaker for manual submission')
      try {
        return await this.executeSubmission(normalizedUrl, userId)
      } catch (error) {
        console.log('🔄 Bypass failed, trying fallback...')
        return await this.fallbackSubmission(normalizedUrl, userId)
      }
    }

    return this.circuitBreaker.execute(
      () => this.executeSubmission(normalizedUrl, userId),
      () => this.fallbackSubmission(normalizedUrl, userId)
    )
  }

  /**
   * Execute the main submission logic
   */
  private async executeSubmission(tweetUrl: string, userId: string): Promise<TweetSubmissionResult> {
    try {
      // Check submission cooldown and rate limits
      const submissionStatus = this.getSubmissionStatus(userId)
      if (!submissionStatus.canSubmit) {
        if (submissionStatus.cooldownRemaining) {
          return {
            success: false,
            message: `Please wait ${submissionStatus.cooldownRemaining} minutes before submitting another tweet.`
          }
        }
        if (submissionStatus.rateLimitResetTime) {
          const resetTime = new Date(submissionStatus.rateLimitResetTime)
          const waitTime = Math.ceil((submissionStatus.rateLimitResetTime - Date.now()) / 1000 / 60)
          return {
            success: false,
            message: `You've reached the hourly submission limit (${this.MANUAL_RATE_LIMIT} tweets/hour). Please wait ${waitTime} minutes.`
          }
        }
      }

      // Verify tweet ownership and validity with enhanced error handling
      const verification = await this.verifyTweetOwnershipWithErrorHandling(tweetUrl, userId)

      if (!verification.isValid) {
        return {
          success: false,
          message: verification.error || 'Tweet verification failed'
        }
      }

      if (!verification.isOwnTweet) {
        return {
          success: false,
          message: 'You can only submit tweets that you authored. This prevents point farming.'
        }
      }

      if (!verification.containsRequiredMentions) {
        return {
          success: false,
          message: 'Tweet must contain "@layeredge" or "$EDGEN" mentions to earn points.'
        }
      }

      if (!verification.tweetData) {
        return {
          success: false,
          message: 'Could not retrieve tweet data'
        }
      }

      // Check if tweet already exists with enhanced duplicate detection
      const existingTweet = await prisma.tweet.findFirst({
        where: {
          OR: [
            { tweetId: verification.tweetData.id },
            { url: tweetUrl }
          ]
        },
        include: {
          user: {
            select: {
              name: true,
              xUsername: true
            }
          }
        }
      })

      if (existingTweet) {
        const submitterInfo = existingTweet.user.name || existingTweet.user.xUsername || 'another user'
        const isOwnSubmission = existingTweet.userId === userId

        if (isOwnSubmission) {
          return {
            success: false,
            message: 'You have already submitted this tweet and earned points for it.'
          }
        } else {
          return {
            success: false,
            message: `This tweet has already been submitted by ${submitterInfo}. Each tweet can only be submitted once.`
          }
        }
      }

      // Calculate points
      const basePoints = 5
      const bonusPoints = calculatePoints({
        likes: verification.tweetData.engagement.likes,
        retweets: verification.tweetData.engagement.retweets,
        comments: verification.tweetData.engagement.replies
      }) - basePoints
      const totalPoints = basePoints + bonusPoints

      console.log(`📊 Points calculation for tweet ${verification.tweetData.id}:`, {
        likes: verification.tweetData.engagement.likes,
        retweets: verification.tweetData.engagement.retweets,
        replies: verification.tweetData.engagement.replies,
        basePoints,
        bonusPoints,
        totalPoints
      })

      // Use atomic transaction with enhanced error handling and verification
      const result = await prisma.$transaction(async (tx) => {
        console.log(`💾 Starting database transaction for user ${userId}`)

        // Double-check for duplicates within transaction to prevent race conditions
        const duplicateCheck = await tx.tweet.findFirst({
          where: {
            OR: [
              { tweetId: verification.tweetData!.id },
              { url: tweetUrl }
            ]
          }
        })

        if (duplicateCheck) {
          throw new Error('Tweet was submitted by another user during processing. Please try again.')
        }

        // 1. Create tweet record with proper date handling and validation
        const createdTweet = await tx.tweet.create({
          data: {
            tweetId: verification.tweetData!.id,
            content: verification.tweetData!.content,
            likes: Math.max(0, verification.tweetData!.engagement.likes), // Ensure non-negative
            retweets: Math.max(0, verification.tweetData!.engagement.retweets),
            replies: Math.max(0, verification.tweetData!.engagement.replies),
            basePoints: basePoints,
            bonusPoints: bonusPoints,
            totalPoints: totalPoints,
            userId: userId,
            isAutoDiscovered: false, // Manual submission
            url: tweetUrl,
            originalTweetDate: verification.tweetData!.createdAt ? new Date(verification.tweetData!.createdAt) : new Date(),
            submittedAt: new Date(), // When user submitted to our system
            createdAt: new Date() // Database record creation
          }
        })

        if (!createdTweet || !createdTweet.id) {
          throw new Error('Failed to create tweet record in database')
        }

        console.log(`✅ Tweet record created: ${createdTweet.id}`)

        // 2. Update user points with verification
        const userBeforeUpdate = await tx.user.findUnique({
          where: { id: userId },
          select: { totalPoints: true }
        })

        if (!userBeforeUpdate) {
          throw new Error('User not found during points update')
        }

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            totalPoints: {
              increment: totalPoints
            }
          }
        })

        // Verify points were added correctly
        const expectedPoints = (userBeforeUpdate.totalPoints || 0) + totalPoints
        if (updatedUser.totalPoints !== expectedPoints) {
          throw new Error(`Points calculation error: expected ${expectedPoints}, got ${updatedUser.totalPoints}`)
        }

        console.log(`✅ User points updated: ${updatedUser.totalPoints} (+${totalPoints})`)

        // 3. Create points history record with enhanced metadata
        const pointsHistory = await tx.pointsHistory.create({
          data: {
            userId: userId,
            pointsAwarded: totalPoints,
            reason: `Manual tweet submission: ${verification.tweetData!.id}`,
            tweetId: createdTweet.id,
            description: JSON.stringify({
              tweetId: verification.tweetData!.id,
              tweetUrl: tweetUrl,
              engagement: verification.tweetData!.engagement,
              basePoints,
              bonusPoints,
              submissionType: 'manual',
              timestamp: new Date().toISOString(),
              userPointsBefore: userBeforeUpdate.totalPoints,
              userPointsAfter: updatedUser.totalPoints
            })
          }
        })

        if (!pointsHistory || !pointsHistory.id) {
          throw new Error('Failed to create points history record')
        }

        console.log(`✅ Points history record created: ${pointsHistory.id}`)

        return {
          tweet: createdTweet,
          user: updatedUser,
          pointsHistory
        }
      }, {
        maxWait: 10000, // 10 seconds max wait
        timeout: 15000, // 15 seconds timeout
      })

      console.log(`🎉 Transaction completed successfully for tweet ${verification.tweetData.id}`)

      // Update submission cooldown and rate limit
      this.lastSubmissionTime.set(userId, Date.now())
      this.incrementManualRateLimit(userId)

      console.log(`✅ Manual tweet submission successful: ${verification.tweetData.id} (+${totalPoints} points)`)

      return {
        success: true,
        message: `Tweet submitted successfully! You earned ${totalPoints} points.`,
        tweetId: verification.tweetData.id,
        points: totalPoints
      }

    } catch (error) {
      console.error('❌ Error in executeSubmission:', error)
      console.error('❌ Error details:', {
        userId,
        tweetUrl,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })

      // Check if this is a database transaction error
      if (error instanceof Error && error.message.includes('transaction')) {
        console.error('💾 Database transaction failed - this could indicate a points awarding issue')
      }

      // Use enhanced error handler for better user feedback
      const errorResult = await enhancedErrorHandler.handleTwitterApiError(
        error,
        {
          operation: 'manual_tweet_submission',
          userId,
          tweetUrl,
          attempt: 1,
          timestamp: new Date()
        }
      )

      const uiError = enhancedErrorHandler.formatErrorForUI(errorResult)

      return {
        success: false,
        message: uiError.message,
        error: errorResult.error?.message || 'Unknown submission error'
      }
    }
  }

  /**
   * Fallback submission using simplified service
   */
  private async fallbackSubmission(tweetUrl: string, userId: string): Promise<TweetSubmissionResult> {
    try {
      console.log('🔄 Using fallback submission service due to circuit breaker')

      const fallbackService = getSimplifiedFallbackService()
      const fallbackResult = await fallbackService.getTweetData(tweetUrl)

      if (!fallbackResult || typeof fallbackResult !== 'object') {
        return {
          success: false,
          message: 'Tweet verification failed. Please try again later or contact support.'
        }
      }

      // Basic validation for fallback
      const tweetData = fallbackResult as any
      if (!validateTweetContent(tweetData.content)) {
        return {
          success: false,
          message: 'Tweet must contain "@layeredge" or "$EDGEN" mentions to earn points.'
        }
      }

      // Simplified points calculation for fallback
      const basePoints = 3 // Reduced points for fallback mode
      const totalPoints = basePoints

      console.log(`📊 Fallback points calculation for tweet ${tweetData.id}:`, {
        basePoints,
        totalPoints,
        mode: 'fallback'
      })

      // Use atomic transaction for fallback submission too
      const result = await prisma.$transaction(async (tx) => {
        console.log(`💾 Starting fallback database transaction for user ${userId}`)

        // 1. Create tweet record with fallback flag and proper date handling
        const createdTweet = await tx.tweet.create({
          data: {
            tweetId: tweetData.id,
            content: tweetData.content,
            likes: tweetData.likes || 0,
            retweets: tweetData.retweets || 0,
            replies: tweetData.replies || 0,
            basePoints: basePoints,
            bonusPoints: 0, // No bonus points in fallback mode
            totalPoints: totalPoints,
            userId: userId,
            isAutoDiscovered: false,
            url: tweetUrl,
            originalTweetDate: tweetData.createdAt ? new Date(tweetData.createdAt) : new Date(),
            submittedAt: new Date(), // When user submitted to our system
            createdAt: new Date() // Database record creation
          }
        })

        console.log(`✅ Fallback tweet record created: ${createdTweet.id}`)

        // 2. Update user points
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            totalPoints: {
              increment: totalPoints
            }
          }
        })

        console.log(`✅ Fallback user points updated: ${updatedUser.totalPoints} (+${totalPoints})`)

        // 3. Create points history record for fallback
        const pointsHistory = await tx.pointsHistory.create({
          data: {
            userId: userId,
            pointsAwarded: totalPoints,
            reason: `Manual tweet submission (fallback mode): ${tweetData.id}`,
            tweetId: createdTweet.id,
            description: JSON.stringify({
              tweetId: tweetData.id,
              tweetUrl: tweetUrl,
              basePoints,
              bonusPoints: 0,
              submissionType: 'manual_fallback',
              fallbackReason: 'API limitations'
            })
          }
        })

        console.log(`✅ Fallback points history record created: ${pointsHistory.id}`)

        return {
          tweet: createdTweet,
          user: updatedUser,
          pointsHistory
        }
      })

      console.log(`🎉 Fallback transaction completed successfully for tweet ${tweetData.id}`)

      // Update submission cooldown and rate limit
      this.lastSubmissionTime.set(userId, Date.now())
      this.incrementManualRateLimit(userId)

      return {
        success: true,
        message: `Tweet submitted successfully in fallback mode! You earned ${totalPoints} points. (Reduced points due to service limitations)`,
        tweetId: tweetData.id,
        points: totalPoints
      }

    } catch (error) {
      console.error('❌ Error in fallback submission:', error)
      console.error('❌ Fallback error details:', {
        userId,
        tweetUrl,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })

      // Check if this is a database transaction error
      if (error instanceof Error && error.message.includes('transaction')) {
        console.error('💾 Fallback database transaction failed - points may not have been awarded')
      }

      return {
        success: false,
        message: 'All submission methods failed. Please try again later.',
        error: error instanceof Error ? error.message : 'Fallback submission error'
      }
    }
  }

  /**
   * Enhanced tweet ownership verification with error handling
   */
  private async verifyTweetOwnershipWithErrorHandling(tweetUrl: string, userId: string): Promise<TweetOwnershipVerification> {
    try {
      return await this.verifyTweetOwnership(tweetUrl, userId)
    } catch (error) {
      console.error('Error in tweet ownership verification:', error)

      // Use enhanced error handler
      const errorResult = await enhancedErrorHandler.handleTwitterApiError(
        error,
        {
          operation: 'tweet_verification',
          userId,
          tweetUrl,
          attempt: 1,
          timestamp: new Date()
        }
      )

      return {
        isValid: false,
        isOwnTweet: false,
        containsRequiredMentions: false,
        error: errorResult.error?.userMessage || 'Tweet verification failed'
      }
    }
  }

  /**
   * Update engagement metrics for existing tweets
   */
  async updateTweetEngagement(tweetId: string): Promise<boolean> {
    try {
      if (!this.twitterApi) {
        console.warn('Twitter API unavailable for engagement update')
        return false
      }

      // Get tweet from database
      const tweet = await prisma.tweet.findFirst({
        where: { tweetId }
      })

      if (!tweet) {
        console.warn(`Tweet ${tweetId} not found in database`)
        return false
      }

      // Fetch updated engagement metrics
      const engagementMetrics = await this.twitterApi.getTweetEngagementMetrics(tweet.url || `https://x.com/i/web/status/${tweetId}`)
      
      if (!engagementMetrics) {
        console.warn(`Could not fetch engagement metrics for tweet ${tweetId}`)
        return false
      }

      // Update tweet in database
      await prisma.tweet.update({
        where: { id: tweet.id },
        data: {
          likes: engagementMetrics.likes,
          retweets: engagementMetrics.retweets,
          replies: engagementMetrics.replies,
          lastEngagementUpdate: new Date()
        }
      })

      console.log(`✅ Updated engagement metrics for tweet ${tweetId}`)
      return true

    } catch (error) {
      console.error(`Error updating engagement for tweet ${tweetId}:`, error)
      return false
    }
  }

  /**
   * Check manual submission rate limits (separate from automated systems)
   */
  private checkManualRateLimit(userId: string): {
    allowed: boolean
    remaining: number
    resetTime: number
  } {
    const now = Date.now()
    const userLimit = this.manualSubmissionRateLimit.get(userId)

    if (!userLimit || now >= userLimit.resetTime) {
      // Reset or initialize rate limit window
      this.manualSubmissionRateLimit.set(userId, {
        count: 0,
        resetTime: now + this.MANUAL_RATE_WINDOW_MS
      })
      return {
        allowed: true,
        remaining: this.MANUAL_RATE_LIMIT - 1,
        resetTime: now + this.MANUAL_RATE_WINDOW_MS
      }
    }

    if (userLimit.count >= this.MANUAL_RATE_LIMIT) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: userLimit.resetTime
      }
    }

    return {
      allowed: true,
      remaining: this.MANUAL_RATE_LIMIT - userLimit.count - 1,
      resetTime: userLimit.resetTime
    }
  }

  /**
   * Increment manual submission rate limit counter
   */
  private incrementManualRateLimit(userId: string): void {
    const userLimit = this.manualSubmissionRateLimit.get(userId)
    if (userLimit) {
      userLimit.count++
      this.manualSubmissionRateLimit.set(userId, userLimit)
    }
  }

  /**
   * Get submission status for a user
   */
  getSubmissionStatus(userId: string): {
    canSubmit: boolean
    cooldownRemaining?: number
    rateLimitRemaining?: number
    rateLimitResetTime?: number
  } {
    // Check cooldown
    const lastSubmission = this.lastSubmissionTime.get(userId)
    const now = Date.now()

    if (lastSubmission && now - lastSubmission < this.SUBMISSION_COOLDOWN_MS) {
      return {
        canSubmit: false,
        cooldownRemaining: Math.ceil((this.SUBMISSION_COOLDOWN_MS - (now - lastSubmission)) / 1000 / 60)
      }
    }

    // Check rate limit
    const rateLimit = this.checkManualRateLimit(userId)
    if (!rateLimit.allowed) {
      return {
        canSubmit: false,
        rateLimitRemaining: rateLimit.remaining,
        rateLimitResetTime: rateLimit.resetTime
      }
    }

    return {
      canSubmit: true,
      rateLimitRemaining: rateLimit.remaining
    }
  }
}

// Singleton instance
let manualSubmissionServiceInstance: ManualTweetSubmissionService | null = null

export function getManualTweetSubmissionService(): ManualTweetSubmissionService {
  if (!manualSubmissionServiceInstance) {
    manualSubmissionServiceInstance = new ManualTweetSubmissionService()
  }
  return manualSubmissionServiceInstance
}
