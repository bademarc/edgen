import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { calculatePoints } from '@/lib/utils'

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
    const { tweetId } = body

    if (!tweetId || typeof tweetId !== 'string') {
      return NextResponse.json(
        { error: 'Tweet ID is required' },
        { status: 400 }
      )
    }

    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        xUsername: true,
        xUserId: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Find the unclaimed tweet
    const unclaimedTweet = await prisma.unclaimedTweet.findUnique({
      where: { tweetId: tweetId },
    })

    if (!unclaimedTweet) {
      return NextResponse.json(
        { error: 'Unclaimed tweet not found' },
        { status: 404 }
      )
    }

    if (unclaimedTweet.claimed) {
      return NextResponse.json(
        { error: 'Tweet has already been claimed' },
        { status: 400 }
      )
    }

    // Verify the user is the author of the tweet
    const isAuthor = 
      (user.xUsername && unclaimedTweet.authorUsername.toLowerCase() === user.xUsername.toLowerCase()) ||
      (user.xUserId && unclaimedTweet.authorId === user.xUserId)

    if (!isAuthor) {
      return NextResponse.json(
        { error: 'You can only claim your own tweets' },
        { status: 403 }
      )
    }

    // Check if this tweet is already claimed as a regular tweet
    const existingTweet = await prisma.tweet.findFirst({
      where: {
        OR: [
          { tweetId: tweetId },
          { url: { contains: tweetId } }
        ]
      }
    })

    if (existingTweet) {
      return NextResponse.json(
        { error: 'This tweet has already been submitted and claimed' },
        { status: 400 }
      )
    }

    // Calculate points
    const totalPoints = calculatePoints(
      unclaimedTweet.likes,
      unclaimedTweet.retweets,
      unclaimedTweet.replies
    )

    // Start transaction to claim the tweet
    const result = await prisma.$transaction(async (tx) => {
      // Mark unclaimed tweet as claimed
      const claimedTweet = await tx.unclaimedTweet.update({
        where: { tweetId: tweetId },
        data: {
          claimed: true,
          claimedBy: userId,
          claimedAt: new Date(),
        },
      })

      // Create regular tweet record
      const newTweet = await tx.tweet.create({
        data: {
          url: `https://x.com/i/web/status/${tweetId}`,
          content: unclaimedTweet.content,
          userId: userId,
          likes: unclaimedTweet.likes,
          retweets: unclaimedTweet.retweets,
          replies: unclaimedTweet.replies,
          basePoints: 5,
          bonusPoints: totalPoints - 5,
          totalPoints: totalPoints,
          isVerified: true,
          tweetId: tweetId,
          discoveredAt: unclaimedTweet.discoveredAt,
          isAutoDiscovered: true,
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
      await tx.user.update({
        where: { id: userId },
        data: {
          totalPoints: {
            increment: totalPoints,
          },
        },
      })

      // Create points history record
      await tx.pointsHistory.create({
        data: {
          userId: userId,
          tweetId: newTweet.id,
          pointsAwarded: totalPoints,
          reason: `Claimed tweet discovered via ${unclaimedTweet.source}`,
        },
      })

      return { claimedTweet, newTweet }
    })

    console.log(`✅ User ${userId} claimed tweet ${tweetId} for ${totalPoints} points`)

    return NextResponse.json({
      success: true,
      message: 'Tweet claimed successfully',
      tweet: result.newTweet,
      pointsAwarded: totalPoints,
    })

  } catch (error) {
    console.error('Error claiming tweet:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        xUsername: true,
        xUserId: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Find unclaimed tweets for this user
    const unclaimedTweets = await prisma.unclaimedTweet.findMany({
      where: {
        AND: [
          { claimed: false },
          {
            OR: [
              user.xUsername ? { authorUsername: { equals: user.xUsername, mode: 'insensitive' } } : {},
              user.xUserId ? { authorId: user.xUserId } : {},
            ].filter(condition => Object.keys(condition).length > 0)
          }
        ]
      },
      orderBy: {
        discoveredAt: 'desc',
      },
      take: 50, // Limit to 50 most recent
    })

    // Calculate potential points for each tweet
    const tweetsWithPoints = unclaimedTweets.map(tweet => ({
      ...tweet,
      potentialPoints: calculatePoints(tweet.likes, tweet.retweets, tweet.replies),
    }))

    return NextResponse.json({
      success: true,
      unclaimedTweets: tweetsWithPoints,
      totalUnclaimed: tweetsWithPoints.length,
      totalPotentialPoints: tweetsWithPoints.reduce((sum, tweet) => sum + tweet.potentialPoints, 0),
    })

  } catch (error) {
    console.error('Error fetching unclaimed tweets:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
