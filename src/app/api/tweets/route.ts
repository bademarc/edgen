import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/db'
import { isValidTwitterUrl, isLayerEdgeCommunityUrl, calculatePoints, validateTweetContent } from '@/lib/utils'
import { getFallbackService } from '@/lib/fallback-service'

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
    const supabase = createRouteHandlerClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
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
        { error: 'Tweet must be from the LayerEdge community' },
        { status: 400 }
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
      const isOwnTweet = existingTweet.userId === user.id
      const submitterName = existingTweet.user.name || existingTweet.user.xUsername || 'Another user'

      console.log(`Duplicate tweet detected. URL: ${tweetUrl}, Original submitter: ${submitterName}, Current user: ${user.id}`)

      return NextResponse.json(
        {
          error: isOwnTweet
            ? 'You have already submitted this tweet and earned points for it.'
            : `This tweet has already been submitted by ${submitterName}. Each tweet can only be submitted once.`,
          errorType: 'DUPLICATE_TWEET',
          isOwnSubmission: isOwnTweet,
          originalSubmitter: submitterName
        },
        { status: 409 }
      )
    }

    // Fetch real tweet data using fallback service (API + scraping)
    console.log(`Attempting to fetch tweet data for URL: ${tweetUrl}`)
    const fallbackService = getFallbackService({
      enableScraping: true,
      preferApi: true,
      apiTimeoutMs: 12000, // 12 seconds for tweet submission
    })

    const tweetData = await fallbackService.getTweetData(tweetUrl)

    if (!tweetData) {
      console.error(`Failed to fetch tweet data for URL: ${tweetUrl}`)
      const fallbackStatus = fallbackService.getStatus()
      return NextResponse.json(
        {
          error: 'Unable to fetch tweet data. This could be due to: 1) Tweet not found or deleted, 2) Tweet is private/protected, 3) Invalid tweet URL, 4) Twitter API rate limits, or 5) Web scraping failed.',
          errorType: 'TWEET_NOT_FOUND',
          fallbackStatus,
          suggestedAction: fallbackStatus.isApiRateLimited
            ? 'Twitter API is rate limited. Please try again later or contact support.'
            : 'Please verify the tweet URL and ensure the tweet is public and accessible.'
        },
        { status: 404 }
      )
    }

    console.log(`Successfully fetched tweet data via ${tweetData.source}. Content: "${tweetData.content.substring(0, 100)}..."`)
    console.log(`Tweet metrics - Likes: ${tweetData.likes}, Retweets: ${tweetData.retweets}, Replies: ${tweetData.replies}`)

    // Verify tweet is from LayerEdge community (already checked by fallback service)
    if (!tweetData.isFromLayerEdgeCommunity) {
      return NextResponse.json(
        {
          error: 'Tweet must be from the LayerEdge community',
          source: tweetData.source,
          fallbackStatus: fallbackService.getStatus()
        },
        { status: 400 }
      )
    }

    // Validate tweet content for required keywords
    console.log(`Validating tweet content: "${tweetData.content}"`)
    const isValidContent = validateTweetContent(tweetData.content)
    if (!isValidContent) {
      console.log(`Content validation failed for tweet: "${tweetData.content}"`)
      return NextResponse.json(
        {
          error: 'Tweet must contain either "@layeredge" or "$EDGEN" to earn points. Please make sure your tweet mentions LayerEdge or the $EDGEN token.',
          contentValidationFailed: true,
          errorType: 'CONTENT_VALIDATION_FAILED',
          tweetContent: tweetData.content.substring(0, 200), // First 200 chars for debugging
          source: tweetData.source,
          fallbackStatus: fallbackService.getStatus()
        },
        { status: 400 }
      )
    }

    console.log('Content validation passed!')

    const basePoints = 5
    const totalPoints = calculatePoints(
      tweetData.likes,
      tweetData.retweets,
      tweetData.replies
    )

    // Create tweet record
    const tweet = await prisma.tweet.create({
      data: {
        url: tweetUrl,
        content: tweetData.content,
        userId: user.id,
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
      where: { id: user.id },
      data: {
        totalPoints: {
          increment: totalPoints,
        },
      },
    })

    // Create points history record
    await prisma.pointsHistory.create({
      data: {
        userId: user.id,
        tweetId: tweet.id,
        pointsAwarded: totalPoints,
        reason: 'Tweet submission',
      },
    })

    return NextResponse.json(tweet, { status: 201 })
  } catch (error) {
    console.error('Error creating tweet:', error)
    return NextResponse.json(
      { error: 'Failed to submit tweet' },
      { status: 500 }
    )
  }
}
