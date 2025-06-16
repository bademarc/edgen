import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { isValidTwitterUrl, isLayerEdgeCommunityUrl, calculatePoints, validateTweetContent, verifyTweetAuthor, extractUsernameFromTweetUrl } from '@/lib/utils'
import { getFallbackService } from '@/lib/fallback-service'
import { TweetErrorHandler, createErrorResponse } from '@/lib/tweet-error-handler'
import { getEnhancedContentValidator } from '@/lib/enhanced-content-validator'

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
        submittedAt: 'desc', // FIXED: Sort by submission date for recent contributions
      },
      take: limit,
    })

    console.log(`📊 API: Returning ${tweets.length} tweets (limit: ${limit})`)

    // Log the most recent tweet for debugging
    if (tweets.length > 0) {
      const mostRecent = tweets[0]
      console.log(`🔝 Most recent tweet: ID ${mostRecent.tweetId}, submitted ${mostRecent.submittedAt}`)
    }

    // FIXED: Transform tweets to use original tweet date for display
    const transformedTweets = tweets.map(tweet => ({
      ...tweet,
      // Use originalTweetDate for display if available, fallback to submittedAt
      createdAt: tweet.originalTweetDate || tweet.submittedAt,
      submittedAt: tweet.submittedAt, // Keep submission date for sorting
      originalTweetDate: tweet.originalTweetDate
    }))

    return NextResponse.json(transformedTweets)
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

    // Fetch real tweet data using fallback service (oEmbed + API fallback)
    console.log(`Attempting to fetch tweet data for URL: ${tweetUrl}`)
    const fallbackService = getFallbackService({
      preferApi: process.env.PREFER_API === 'true',
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

    // ENHANCED FUD DETECTION - Validate content for harmful material
    console.log(`🛡️ Performing enhanced FUD detection on tweet content: "${tweetData.content}"`)
    const contentValidator = getEnhancedContentValidator()
    const contentValidation = await contentValidator.validateContent(tweetData.content, {
      enableFUDDetection: true,
      enableAdvancedFUDDetection: true,
      strictMode: false,
      requireLayerEdgeKeywords: true,
      allowWarnings: true
    })

    // Log validation result in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 FUD validation result:', {
        allowSubmission: contentValidation.allowSubmission,
        isValid: contentValidation.isValid,
        isBlocked: contentValidation.fudAnalysis?.isBlocked,
        isWarning: contentValidation.fudAnalysis?.isWarning,
        score: contentValidation.fudAnalysis?.score
      })
    }

    // Block submission if FUD is detected or content is invalid
    if (!contentValidation.allowSubmission || !contentValidation.isValid) {
      console.log(`🚫 Content validation failed for tweet: "${tweetData.content}"`)
      console.log(`🚫 Reason: ${contentValidation.message}`)

      // Create appropriate error response based on validation result
      let errorMessage = contentValidation.message
      if (contentValidation.fudAnalysis?.isBlocked) {
        errorMessage = `Content blocked due to FUD detection: ${contentValidation.fudAnalysis.message}`
      }

      const errorResponse = TweetErrorHandler.handleContentValidation(errorMessage)
      return NextResponse.json(
        createErrorResponse(errorResponse),
        { status: errorResponse.httpStatus }
      )
    }

    // Also run legacy validation for backward compatibility
    const legacyValidation = validateTweetContent(tweetData.content)
    if (!legacyValidation) {
      console.log(`📋 Legacy content validation failed for tweet: "${tweetData.content}"`)
      const errorResponse = TweetErrorHandler.handleContentValidation('Content does not meet LayerEdge requirements')
      return NextResponse.json(
        createErrorResponse(errorResponse),
        { status: errorResponse.httpStatus }
      )
    }

    console.log('✅ Enhanced content validation passed!')

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
