import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isValidTwitterUrl, isLayerEdgeCommunityUrl, calculatePoints } from '@/lib/utils'
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
    })

    if (existingTweet) {
      return NextResponse.json(
        { error: 'This tweet has already been submitted' },
        { status: 409 }
      )
    }

    // Fetch real tweet data from Twitter API
    const twitterApi = new TwitterApiService()
    const tweetData = await twitterApi.getTweetData(tweetUrl)

    if (!tweetData) {
      return NextResponse.json(
        { error: 'Unable to fetch tweet data or tweet not found' },
        { status: 404 }
      )
    }

    // Verify tweet is from LayerEdge community
    const isFromCommunity = await twitterApi.verifyTweetFromCommunity(tweetUrl)
    if (!isFromCommunity) {
      return NextResponse.json(
        { error: 'Tweet must be from the LayerEdge community' },
        { status: 400 }
      )
    }

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
