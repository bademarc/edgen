import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isValidTwitterUrl, isLayerEdgeCommunityUrl, calculatePoints, validateTweetContent } from '@/lib/utils'
import { TwitterApiService } from '@/lib/twitter-api'

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
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
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
      const isOwnTweet = existingTweet.userId === session.user.id
      const submitterName = existingTweet.user.name || existingTweet.user.xUsername || 'Another user'

      console.log(`Duplicate tweet detected. URL: ${tweetUrl}, Original submitter: ${submitterName}, Current user: ${session.user.id}`)

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

    // Fetch real tweet data from Twitter API
    console.log(`Attempting to fetch tweet data for URL: ${tweetUrl}`)
    const twitterApi = new TwitterApiService()
    const tweetData = await twitterApi.getTweetData(tweetUrl)

    if (!tweetData) {
      console.error(`Failed to fetch tweet data for URL: ${tweetUrl}`)
      return NextResponse.json(
        {
          error: 'Unable to fetch tweet data. This could be due to: 1) Tweet not found or deleted, 2) Tweet is private/protected, 3) Invalid tweet URL, or 4) Twitter API rate limits.',
          errorType: 'TWEET_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    console.log(`Successfully fetched tweet data. Content: "${tweetData.content.substring(0, 100)}..."`)
    console.log(`Tweet metrics - Likes: ${tweetData.likes}, Retweets: ${tweetData.retweets}, Replies: ${tweetData.replies}`)

    // Verify tweet is from LayerEdge community
    const isFromCommunity = await twitterApi.verifyTweetFromCommunity(tweetUrl)
    if (!isFromCommunity) {
      return NextResponse.json(
        { error: 'Tweet must be from the LayerEdge community' },
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
          tweetContent: tweetData.content.substring(0, 200) // First 200 chars for debugging
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
        userId: session.user.id,
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
      where: { id: session.user.id },
      data: {
        totalPoints: {
          increment: totalPoints,
        },
      },
    })

    // Create points history record
    await prisma.pointsHistory.create({
      data: {
        userId: session.user.id,
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
