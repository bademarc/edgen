import { NextRequest, NextResponse } from 'next/server'
import { getManualTweetSubmissionService } from '@/lib/manual-tweet-submission'
import { getAuthenticatedUser } from '@/lib/auth-utils'

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

    // Submit tweet
    const result = await submissionService.submitTweet(tweetUrl, authResult.userId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        tweetId: result.tweetId,
        points: result.points
      })
    } else {
      return NextResponse.json(
        { 
          error: result.message,
          details: result.error
        },
        { status: 400 }
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
