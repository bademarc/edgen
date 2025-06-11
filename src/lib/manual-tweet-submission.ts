import { PrismaClient } from '@prisma/client'
import { TwitterApiService } from './twitter-api'
import { TwitterUserApiService } from './twitter-user-api'
import { validateTweetContent, calculatePoints } from './utils'
import { validateTweetURL } from './url-validator'
import { getSimplifiedFallbackService } from './simplified-fallback-service'

const prisma = new PrismaClient()

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

export class ManualTweetSubmissionService {
  private twitterApi: TwitterApiService | null = null
  private userApi: TwitterUserApiService
  private lastSubmissionTime: Map<string, number> = new Map()
  private readonly SUBMISSION_COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes between submissions per user

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
   * Submit a tweet for points calculation
   */
  async submitTweet(tweetUrl: string, userId: string): Promise<TweetSubmissionResult> {
    try {
      // Check submission cooldown
      const lastSubmission = this.lastSubmissionTime.get(userId)
      if (lastSubmission && Date.now() - lastSubmission < this.SUBMISSION_COOLDOWN_MS) {
        const remainingTime = Math.ceil((this.SUBMISSION_COOLDOWN_MS - (Date.now() - lastSubmission)) / 1000 / 60)
        return {
          success: false,
          message: `Please wait ${remainingTime} minutes before submitting another tweet.`
        }
      }

      // Verify tweet ownership and validity
      const verification = await this.verifyTweetOwnership(tweetUrl, userId)
      
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

      // Check if tweet already exists
      const existingTweet = await prisma.tweet.findFirst({
        where: { tweetId: verification.tweetData.id }
      })

      if (existingTweet) {
        return {
          success: false,
          message: 'This tweet has already been submitted.'
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

      // Save tweet to database
      await prisma.tweet.create({
        data: {
          tweetId: verification.tweetData.id,
          content: verification.tweetData.content,
          likes: verification.tweetData.engagement.likes,
          retweets: verification.tweetData.engagement.retweets,
          replies: verification.tweetData.engagement.replies,
          basePoints: basePoints,
          bonusPoints: bonusPoints,
          totalPoints: totalPoints,
          userId: userId,
          isAutoDiscovered: false, // Manual submission
          url: tweetUrl,
          submittedAt: new Date()
        }
      })

      // Update user points
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalPoints: {
            increment: totalPoints
          }
        }
      })

      // Update submission cooldown
      this.lastSubmissionTime.set(userId, Date.now())

      console.log(`✅ Manual tweet submission successful: ${verification.tweetData.id} (+${totalPoints} points)`)

      return {
        success: true,
        message: `Tweet submitted successfully! You earned ${totalPoints} points.`,
        tweetId: verification.tweetData.id,
        points: totalPoints
      }

    } catch (error) {
      console.error('Error submitting tweet:', error)
      return {
        success: false,
        message: 'An error occurred while submitting your tweet. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown submission error'
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
   * Get submission status for a user
   */
  getSubmissionStatus(userId: string): {
    canSubmit: boolean
    cooldownRemaining?: number
  } {
    const lastSubmission = this.lastSubmissionTime.get(userId)
    
    if (!lastSubmission) {
      return { canSubmit: true }
    }

    const timeSinceLastSubmission = Date.now() - lastSubmission
    
    if (timeSinceLastSubmission >= this.SUBMISSION_COOLDOWN_MS) {
      return { canSubmit: true }
    }

    return {
      canSubmit: false,
      cooldownRemaining: Math.ceil((this.SUBMISSION_COOLDOWN_MS - timeSinceLastSubmission) / 1000 / 60)
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
