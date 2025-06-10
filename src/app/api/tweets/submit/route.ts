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

    // Check submission status
    const submissionStatus = submissionService.getSubmissionStatus(authResult.userId)
    if (!submissionStatus.canSubmit) {
      return NextResponse.json(
        {
          error: `Please wait ${submissionStatus.cooldownRemaining} minutes before submitting another tweet.`,
          cooldownRemaining: submissionStatus.cooldownRemaining
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

    // Submit tweet with enhanced error handling
    try {
      const result = await submissionService.submitTweet(tweetUrl, authResult.userId)

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: result.message,
          tweetId: result.tweetId,
          points: result.points
        })
      } else {
        // Handle submission failure with enhanced error handling
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
            error: result.message,
            userMessage: uiError.message,
            suggestions: errorResult.error?.suggestions || [],
            retryable: errorResult.error?.retryable || false,
            details: result.error
          },
          { status: 400 }
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
