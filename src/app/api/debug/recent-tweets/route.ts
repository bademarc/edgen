import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Checking recent tweets in database')

    // Get the most recent tweets from the database
    const recentTweets = await prisma.tweet.findMany({
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
        submittedAt: 'desc',
      },
      take: 10,
    })

    console.log(`📊 Found ${recentTweets.length} recent tweets`)

    // Check for the specific tweet ID mentioned
    const specificTweet = await prisma.tweet.findFirst({
      where: {
        tweetId: '1933007672141304207'
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

    console.log('🎯 Specific tweet 1933007672141304207:', specificTweet ? 'FOUND' : 'NOT FOUND')

    // Check for tweets submitted in the last hour
    const lastHourTweets = await prisma.tweet.findMany({
      where: {
        submittedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
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
      orderBy: {
        submittedAt: 'desc',
      },
    })

    console.log(`⏰ Tweets submitted in last hour: ${lastHourTweets.length}`)

    return NextResponse.json({
      success: true,
      data: {
        recentTweets: recentTweets.map(tweet => ({
          id: tweet.id,
          tweetId: tweet.tweetId,
          url: tweet.url,
          content: tweet.content,
          likes: tweet.likes,
          retweets: tweet.retweets,
          replies: tweet.replies,
          totalPoints: tweet.totalPoints,
          createdAt: tweet.createdAt,
          submittedAt: tweet.submittedAt,
          user: tweet.user
        })),
        specificTweet: specificTweet ? {
          id: specificTweet.id,
          tweetId: specificTweet.tweetId,
          url: specificTweet.url,
          content: specificTweet.content,
          likes: specificTweet.likes,
          retweets: specificTweet.retweets,
          replies: specificTweet.replies,
          totalPoints: specificTweet.totalPoints,
          createdAt: specificTweet.createdAt,
          submittedAt: specificTweet.submittedAt,
          user: specificTweet.user
        } : null,
        lastHourTweets: lastHourTweets.map(tweet => ({
          id: tweet.id,
          tweetId: tweet.tweetId,
          url: tweet.url,
          content: tweet.content,
          likes: tweet.likes,
          retweets: tweet.retweets,
          replies: tweet.replies,
          totalPoints: tweet.totalPoints,
          createdAt: tweet.createdAt,
          submittedAt: tweet.submittedAt,
          user: tweet.user
        })),
        stats: {
          totalRecentTweets: recentTweets.length,
          specificTweetFound: !!specificTweet,
          lastHourTweetsCount: lastHourTweets.length
        }
      }
    })

  } catch (error) {
    console.error('❌ Debug recent tweets error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch debug data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
