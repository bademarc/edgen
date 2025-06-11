import { NextRequest, NextResponse } from 'next/server'
import { getManualTweetSubmissionService } from '@/lib/manual-tweet-submission'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { enhancedErrorHandler } from '@/lib/enhanced-error-handler'

export async function POST(request: NextRequest) {
  try {
    const { tweetUrl } = await request.json()

    if (!tweetUrl) {
      return NextResponse.json(
        { error: 'Tweet URL is required' },
        { status: 400 }
      )
    }

    // Get authenticated user using universal auth function
    const authResult = await getAuthenticatedUser(request)

    if (!authResult.isAuthenticated || !authResult.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get manual submission service
    const submissionService = getManualTweetSubmissionService()

    // Check submission status with enhanced feedback
    const submissionStatus = submissionService.getSubmissionStatus(authResult.userId)
    if (!submissionStatus.canSubmit) {
      let errorMessage = 'Submission temporarily unavailable'
      let retryAfter = 300 // Default 5 minutes

      if (submissionStatus.cooldownRemaining) {
        errorMessage = `Please wait ${submissionStatus.cooldownRemaining} minutes before submitting another tweet.`
        retryAfter = submissionStatus.cooldownRemaining * 60
      } else if (submissionStatus.rateLimitResetTime) {
        const waitTime = Math.ceil((submissionStatus.rateLimitResetTime - Date.now()) / 1000 / 60)
        errorMessage = `You've reached the hourly submission limit. Please wait ${waitTime} minutes.`
        retryAfter = waitTime * 60
      }

      return NextResponse.json(
        {
          error: errorMessage,
          cooldownRemaining: submissionStatus.cooldownRemaining,
          rateLimitRemaining: submissionStatus.rateLimitRemaining,
          retryAfter,
          userMessage: 'Rate limiting helps ensure fair usage and system stability.'
        },
        { status: 429 }
      )
    }

    // Check rate limiting before submission
    const rateLimitCheck = enhancedErrorHandler.shouldRateLimit('tweet_submission', authResult.userId)
    if (rateLimitCheck.limited) {
      return NextResponse.json(
        {
          error: 'Rate limited',
          userMessage: 'Please wait before submitting another tweet',
          retryAfter: rateLimitCheck.retryAfter
        },
        { status: 429 }
      )
    }

    // Check for bypass mode (admin or emergency situations)
    const bypassHeader = request.headers.get('x-bypass-circuit-breaker')
    const bypassCircuitBreaker = bypassHeader === process.env.ADMIN_SECRET

    if (bypassCircuitBreaker) {
      console.log('🔓 Circuit breaker bypass enabled for manual submission')
    }

    // Submit tweet with enhanced error handling
    try {
      const result = await submissionService.submitTweet(tweetUrl, authResult.userId, bypassCircuitBreaker)

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: result.message,
          tweetId: result.tweetId,
          points: result.points,
          bypassUsed: bypassCircuitBreaker
        })
      } else {
        // Handle submission failure with enhanced error handling
        let errorMessage = result.message
        let suggestions: string[] = []
        let retryable = false

        // Provide specific guidance based on error type
        if (result.message.includes('monthly usage limit exceeded')) {
          errorMessage = 'Twitter API monthly limit reached'
          suggestions = [
            'This is a temporary service limitation',
            'Our team is working to resolve this issue',
            'Please try again in a few hours',
            'Contact support if this persists'
          ]
          retryable = true
        } else if (result.message.includes('rate limit exceeded')) {
          errorMessage = 'Too many requests, please wait'
          suggestions = [
            'Wait 5-10 minutes before trying again',
            'This helps prevent service overload'
          ]
          retryable = true
        } else if (result.message.includes('authentication')) {
          errorMessage = 'Service authentication issue'
          suggestions = [
            'This is a temporary service issue',
            'Please contact support if this persists'
          ]
          retryable = false
        } else if (result.message.includes('not found') || result.message.includes('not accessible')) {
          errorMessage = 'Tweet not found or private'
          suggestions = [
            'Make sure the tweet URL is correct',
            'Ensure the tweet is public (not private)',
            'Check that the tweet has not been deleted'
          ]
          retryable = false
        }

        const errorResult = await enhancedErrorHandler.handleTwitterApiError(
          new Error(result.message),
          {
            operation: 'tweet_submission',
            userId: authResult.userId,
            tweetUrl,
            attempt: 1,
            timestamp: new Date()
          }
        )

        const uiError = enhancedErrorHandler.formatErrorForUI(errorResult)

        return NextResponse.json(
          {
            error: errorMessage,
            userMessage: uiError.message || errorMessage,
            suggestions: suggestions.length > 0 ? suggestions : (errorResult.error?.suggestions || []),
            retryable: retryable || (errorResult.error?.retryable || false),
            details: result.error
          },
          { status: retryable ? 429 : 400 }
        )
      }
    } catch (submissionError) {
      // Handle unexpected submission errors
      const errorResult = await enhancedErrorHandler.handleTwitterApiError(
        submissionError,
        {
          operation: 'tweet_submission',
          userId: authResult.userId,
          tweetUrl,
          attempt: 1,
          timestamp: new Date()
        }
      )

      const uiError = enhancedErrorHandler.formatErrorForUI(errorResult)

      return NextResponse.json(
        {
          error: 'Submission failed',
          userMessage: uiError.message,
          suggestions: errorResult.error?.suggestions || [],
          retryable: errorResult.error?.retryable || false
        },
        { status: errorResult.error?.retryable ? 429 : 500 }
      )
    }

  } catch (error) {
    console.error('Tweet submission API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user using universal auth function
    const authResult = await getAuthenticatedUser(request)

    if (!authResult.isAuthenticated || !authResult.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get submission service
    const submissionService = getManualTweetSubmissionService()

    // Get submission status
    const submissionStatus = submissionService.getSubmissionStatus(authResult.userId)

    return NextResponse.json({
      canSubmit: submissionStatus.canSubmit,
      cooldownRemaining: submissionStatus.cooldownRemaining
    })

  } catch (error) {
    console.error('Tweet submission status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
