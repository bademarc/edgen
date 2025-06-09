import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@/lib/supabase-server'
import { getManualTweetSubmissionService } from '@/lib/manual-tweet-submission'

export async function POST(request: NextRequest) {
  try {
    const { tweetUrl } = await request.json()

    if (!tweetUrl) {
      return NextResponse.json(
        { error: 'Tweet URL is required' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createServerComponentClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get manual submission service
    const submissionService = getManualTweetSubmissionService()

    // Verify tweet ownership
    const verification = await submissionService.verifyTweetOwnership(tweetUrl, user.id)

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
