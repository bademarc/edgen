import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth-utils'
import { isValidTwitterUrl, isLayerEdgeCommunityUrl, validateTweetContent, verifyTweetAuthor, extractUsernameFromTweetUrl } from '@/lib/utils'
import { prisma } from '@/lib/db'
import { getFallbackService } from '@/lib/fallback-service'
import { TweetErrorHandler, createErrorResponse } from '@/lib/tweet-error-handler'

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tweetUrl } = body

    // Validate tweet URL
    if (!tweetUrl || typeof tweetUrl !== 'string') {
      return NextResponse.json(
        { error: 'Tweet URL is required' },
        { status: 400 }
      )
    }

    if (!isValidTwitterUrl(tweetUrl)) {
      return NextResponse.json(
        { error: 'Invalid Twitter URL' },
        { status: 400 }
      )
    }

    if (!isLayerEdgeCommunityUrl(tweetUrl)) {
      return NextResponse.json(
        { error: 'Please enter a valid X (Twitter) URL' },
        { status: 400 }
      )
    }

    // Get authenticated user for security verification
    const authenticatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        xUsername: true,
        name: true
      }
    })

    if (!authenticatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Use real fallback service for preview
    console.log(`Fetching tweet preview for URL: ${tweetUrl}`)
    const fallbackService = getFallbackService({
      enableScraping: true,
      preferApi: true,
      apiTimeoutMs: 8000, // 8 seconds for preview
    })

    const tweetData = await fallbackService.getTweetData(tweetUrl)

    if (!tweetData) {
      console.error(`Failed to fetch tweet preview for URL: ${tweetUrl}`)
      const fallbackStatus = fallbackService.getStatus()
      const errorResponse = TweetErrorHandler.determineErrorType(fallbackStatus, tweetData, null)
      return NextResponse.json(
        createErrorResponse(errorResponse),
        { status: errorResponse.httpStatus }
      )
    }

    // Security check: Verify tweet author matches authenticated user
    const isAuthorVerified = verifyTweetAuthor(tweetData.author.username, authenticatedUser.xUsername)
    const urlUsername = extractUsernameFromTweetUrl(tweetUrl)
    const isUrlUsernameValid = urlUsername ? verifyTweetAuthor(urlUsername, authenticatedUser.xUsername) : false

    if (!isAuthorVerified && !isUrlUsernameValid) {
      const errorResponse = TweetErrorHandler.handleUnauthorizedSubmission(
        tweetData.author.username,
        authenticatedUser.xUsername || 'unknown'
      )
      return NextResponse.json(
        createErrorResponse(errorResponse),
        { status: errorResponse.httpStatus }
      )
    }

    // Validate tweet content for required keywords
    const isValidContent = validateTweetContent(tweetData.content)

    // Calculate potential points
    const basePoints = 5
    const engagementPoints = (tweetData.likes || 0) * 1 +
                           (tweetData.retweets || 0) * 3 +
                           (tweetData.replies || 0) * 2
    const totalPoints = basePoints + engagementPoints

    return NextResponse.json({
      preview: {
        content: tweetData.content,
        author: tweetData.author.username,
        createdAt: tweetData.createdAt,
        engagement: {
          likes: tweetData.likes || 0,
          retweets: tweetData.retweets || 0,
          replies: tweetData.replies || 0,
        },
        points: {
          base: basePoints,
          engagement: engagementPoints,
          total: totalPoints,
        },
        validation: {
          isValid: isValidContent,
          containsKeywords: isValidContent,
          message: isValidContent
            ? 'Tweet contains required keywords (@layeredge or $EDGEN)'
            : 'Tweet must contain @layeredge or $EDGEN to earn points'
        },
        source: tweetData.source,
      },
      fallbackStatus: fallbackService.getStatus(),
    })
  } catch (error) {
    console.error('Error fetching tweet preview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tweet preview' },
      { status: 500 }
    )
  }
}
