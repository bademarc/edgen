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

    // Verify tweet ownership
    const verification = await submissionService.verifyTweetOwnership(tweetUrl, authResult.userId)

    return NextResponse.json({
      isValid: verification.isValid,
      isOwnTweet: verification.isOwnTweet,
      containsRequiredMentions: verification.containsRequiredMentions,
      tweetData: verification.tweetData,
      error: verification.error
    })

  } catch (error) {
    console.error('Tweet verification API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
