import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { isValidTwitterUrl, isLayerEdgeCommunityUrl, calculatePoints, validateTweetContent, verifyTweetAuthor, extractUsernameFromTweetUrl } from '@/lib/utils'
import { getFallbackService } from '@/lib/fallback-service'
import { TweetErrorHandler, createErrorResponse } from '@/lib/tweet-error-handler'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where = userId ? { userId } : {}

    const tweets = await prisma.tweet.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            xUsername: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return NextResponse.json(tweets)
  } catch (error) {
    console.error('Error fetching tweets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tweets' },
      { status: 500 }
    )
  }
}

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
      const errorResponse = TweetErrorHandler.handleInvalidUrl()
      return NextResponse.json(
        createErrorResponse(errorResponse),
        { status: errorResponse.httpStatus }
      )
    }

    if (!isValidTwitterUrl(tweetUrl)) {
      const errorResponse = TweetErrorHandler.handleInvalidUrl()
      return NextResponse.json(
        createErrorResponse(errorResponse),
        { status: errorResponse.httpStatus }
      )
    }

    if (!isLayerEdgeCommunityUrl(tweetUrl)) {
      const errorResponse = TweetErrorHandler.handleInvalidUrl()
      return NextResponse.json(
        createErrorResponse(errorResponse),
        { status: errorResponse.httpStatus }
      )
    }

    // Get authenticated user's Twitter username for verification
    const authenticatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        xUsername: true,
        xUserId: true,
        name: true
      }
    })

    if (!authenticatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if tweet already exists
    const existingTweet = await prisma.tweet.findUnique({
      where: { url: tweetUrl },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            xUsername: true,
          },
        },
      },
    })

    if (existingTweet) {
      const isOwnTweet = existingTweet.userId === userId
      const submitterName = existingTweet.user.name || existingTweet.user.xUsername || 'Another user'

      console.log(`Duplicate tweet detected. URL: ${tweetUrl}, Original submitter: ${submitterName}, Current user: ${userId}`)

      const errorResponse = TweetErrorHandler.handleDuplicateSubmission(isOwnTweet, submitterName)
      return NextResponse.json(
        createErrorResponse(errorResponse),
        { status: errorResponse.httpStatus }
      )
    }

    // Fetch real tweet data using fallback service (API + scraping)
    console.log(`Attempting to fetch tweet data for URL: ${tweetUrl}`)
    const fallbackService = getFallbackService({
      preferApi: true,
      apiTimeoutMs: 12000, // 12 seconds for tweet submission
    })

    const tweetData = await fallbackService.getTweetData(tweetUrl)

    if (!tweetData) {
      console.error(`Failed to fetch tweet data for URL: ${tweetUrl}`)
      const fallbackStatus = fallbackService.getStatus()
      const errorResponse = TweetErrorHandler.determineErrorType(fallbackStatus, tweetData, null)
      return NextResponse.json(
        createErrorResponse(errorResponse),
        { status: errorResponse.httpStatus }
      )
    }

    console.log(`Successfully fetched tweet data via ${tweetData.source}. Content: "${tweetData.content.substring(0, 100)}..."`)
    console.log(`Tweet metrics - Likes: ${tweetData.likes}, Retweets: ${tweetData.retweets}, Replies: ${tweetData.replies}`)
    console.log(`Tweet author: ${tweetData.author.username}, Authenticated user: ${authenticatedUser.xUsername}`)

    // SECURITY CHECK: Verify the tweet author matches the authenticated user
    const isAuthorVerified = verifyTweetAuthor(tweetData.author.username, authenticatedUser.xUsername)

    // Additional verification using URL username extraction
    const urlUsername = extractUsernameFromTweetUrl(tweetUrl)
    const isUrlUsernameValid = urlUsername ? verifyTweetAuthor(urlUsername, authenticatedUser.xUsername) : false

    if (!isAuthorVerified && !isUrlUsernameValid) {
      console.log(`SECURITY VIOLATION: User ${authenticatedUser.xUsername} attempted to submit tweet by ${tweetData.author.username}`)
      const errorResponse = TweetErrorHandler.handleUnauthorizedSubmission(
        tweetData.author.username,
        authenticatedUser.xUsername || 'unknown'
      )
      return NextResponse.json(
        createErrorResponse(errorResponse),
        { status: errorResponse.httpStatus }
      )
    }

    // Verify tweet is from LayerEdge community (relaxed check - content validation is more important)
    if (!tweetData.isFromLayerEdgeCommunity) {
      console.log(`Warning: Tweet may not be from LayerEdge community, but proceeding with content validation`)
    }

    // Validate tweet content for required keywords
    console.log(`Validating tweet content: "${tweetData.content}"`)
    const isValidContent = validateTweetContent(tweetData.content)
    if (!isValidContent) {
      console.log(`Content validation failed for tweet: "${tweetData.content}"`)
      const errorResponse = TweetErrorHandler.handleContentValidation(tweetData.content)
      return NextResponse.json(
        createErrorResponse(errorResponse),
        { status: errorResponse.httpStatus }
      )
    }

    console.log('Content validation passed!')

    const basePoints = 5
    const totalPoints = calculatePoints({
      likes: tweetData.likes,
      retweets: tweetData.retweets,
      comments: tweetData.replies
    })

    // Create tweet record
    const tweet = await prisma.tweet.create({
      data: {
        url: tweetUrl,
        content: tweetData.content,
        userId: userId,
        likes: tweetData.likes,
        retweets: tweetData.retweets,
        replies: tweetData.replies,
        basePoints,
        bonusPoints: totalPoints - basePoints,
        totalPoints,
        isVerified: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            xUsername: true,
            image: true,
          },
        },
      },
    })

    // Update user's total points
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalPoints: {
          increment: totalPoints,
        },
      },
    })

    // Create points history record
    await prisma.pointsHistory.create({
      data: {
        userId: userId,
        tweetId: tweet.id,
        pointsAwarded: totalPoints,
        reason: 'Tweet submission',
      },
    })

    return NextResponse.json(tweet, { status: 201 })
  } catch (error) {
    console.error('Error creating tweet:', error)
    const errorResponse = TweetErrorHandler.handleUnknownError(error)
    return NextResponse.json(
      createErrorResponse(errorResponse),
      { status: errorResponse.httpStatus }
    )
  }
}
