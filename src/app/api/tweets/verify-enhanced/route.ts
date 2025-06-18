import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { getSimplifiedTweetSubmissionService } from '@/lib/simplified-tweet-submission'
import { getApifyTwitterService } from '@/lib/apify-twitter-service'
import { extractTweetId } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser(request)

    if (!authResult.isAuthenticated || !authResult.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { tweetUrl } = await request.json()

    if (!tweetUrl) {
      return NextResponse.json(
        { error: 'Tweet URL is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Enhanced tweet verification for: ${tweetUrl}`)

    // Get submission service for basic verification
    const submissionService = getSimplifiedTweetSubmissionService()

    // Verify tweet ownership and content
    const verification = await submissionService.verifyTweetOwnership(tweetUrl, authResult.userId)

    if (!verification.isValid) {
      return NextResponse.json({
        isValid: false,
        isOwnTweet: verification.isOwnTweet,
        containsRequiredMentions: verification.containsRequiredMentions,
        error: verification.error,
        engagementMetrics: null
      })
    }

    // Extract tweet ID for Apify API
    const tweetId = extractTweetId(tweetUrl)
    if (!tweetId) {
      return NextResponse.json({
        isValid: verification.isValid,
        isOwnTweet: verification.isOwnTweet,
        containsRequiredMentions: verification.containsRequiredMentions,
        tweetData: verification.tweetData,
        engagementMetrics: null,
        error: 'Could not extract tweet ID from URL'
      })
    }

    // Fetch real-time engagement metrics using Apify with quick mode for better UX
    console.log(`📊 Fetching real-time engagement metrics for tweet: ${tweetId}`)

    const apifyService = getApifyTwitterService()
    let engagementMetrics = null
    let engagementError = null

    try {
      if (apifyService.isReady()) {
        // Use quick mode for verification to provide faster feedback
        engagementMetrics = await apifyService.getQuickEngagementMetrics(tweetUrl)

        if (engagementMetrics) {
          console.log('✅ Successfully fetched engagement metrics:', engagementMetrics)
        } else {
          console.log('⚠️ No engagement metrics returned from Apify (quick mode)')
          engagementError = 'Engagement metrics temporarily unavailable (will be updated after submission)'
        }
      } else {
        console.log('⚠️ Apify service not configured')
        engagementError = 'Engagement metrics service not available'
      }
    } catch (error) {
      console.error('❌ Error fetching engagement metrics:', error)
      engagementError = 'Failed to fetch engagement metrics (will retry after submission)'
    }

    // Calculate enhanced points if we have engagement metrics
    let enhancedPoints = null
    if (engagementMetrics) {
      enhancedPoints = calculateEnhancedPoints(engagementMetrics)
    }

    return NextResponse.json({
      isValid: verification.isValid,
      isOwnTweet: verification.isOwnTweet,
      containsRequiredMentions: verification.containsRequiredMentions,
      tweetData: verification.tweetData,
      engagementMetrics,
      enhancedPoints,
      engagementError,
      tweetId
    })

  } catch (error) {
    console.error('Enhanced tweet verification API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Calculate enhanced points including new metrics from Apify
 */
function calculateEnhancedPoints(metrics: {
  likes: number
  retweets: number
  replies: number
  quotes: number
  views: number
  bookmarks: number
}): {
  basePoints: number
  engagementPoints: number
  totalPoints: number
  breakdown: {
    likes: number
    retweets: number
    replies: number
    quotes: number
    views: number
    bookmarks: number
  }
} {
  // Base points for submission
  const basePoints = 10

  // Enhanced point calculation with new metrics
  const breakdown = {
    likes: Math.min(metrics.likes * 0.5, 50), // Max 50 points from likes
    retweets: Math.min(metrics.retweets * 2, 100), // Max 100 points from retweets
    replies: Math.min(metrics.replies * 1, 30), // Max 30 points from replies
    quotes: Math.min(metrics.quotes * 3, 90), // Max 90 points from quotes
    views: Math.min(metrics.views * 0.01, 25), // Max 25 points from views (1 point per 100 views)
    bookmarks: Math.min(metrics.bookmarks * 5, 75) // Max 75 points from bookmarks
  }

  const engagementPoints = Object.values(breakdown).reduce((sum, points) => sum + points, 0)
  const totalPoints = basePoints + engagementPoints

  return {
    basePoints,
    engagementPoints,
    totalPoints: Math.round(totalPoints),
    breakdown: {
      likes: Math.round(breakdown.likes),
      retweets: Math.round(breakdown.retweets),
      replies: Math.round(breakdown.replies),
      quotes: Math.round(breakdown.quotes),
      views: Math.round(breakdown.views),
      bookmarks: Math.round(breakdown.bookmarks)
    }
  }
}
