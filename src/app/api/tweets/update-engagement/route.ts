import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@/lib/supabase-server'
import { getManualTweetSubmissionService } from '@/lib/manual-tweet-submission'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { tweetId } = await request.json()

    if (!tweetId) {
      return NextResponse.json(
        { error: 'Tweet ID is required' },
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

    // Verify user owns this tweet
    const tweet = await prisma.tweet.findFirst({
      where: {
        tweetId: tweetId,
        userId: user.id
      }
    })

    if (!tweet) {
      return NextResponse.json(
        { error: 'Tweet not found or not owned by user' },
        { status: 404 }
      )
    }

    // Get manual submission service
    const submissionService = getManualTweetSubmissionService()

    // Update engagement metrics
    const success = await submissionService.updateTweetEngagement(tweetId)

    if (success) {
      // Fetch updated tweet data
      const updatedTweet = await prisma.tweet.findFirst({
        where: { tweetId: tweetId }
      })

      return NextResponse.json({
        success: true,
        message: 'Engagement metrics updated successfully',
        engagement: {
          likes: updatedTweet?.likes || 0,
          retweets: updatedTweet?.retweets || 0,
          replies: updatedTweet?.replies || 0,
          lastUpdate: updatedTweet?.lastEngagementUpdate
        }
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to update engagement metrics' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Engagement update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerComponentClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's tweets that need engagement updates
    const tweets = await prisma.tweet.findMany({
      where: {
        userId: user.id,
        OR: [
          { lastEngagementUpdate: null },
          { 
            lastEngagementUpdate: {
              lt: new Date(Date.now() - 60 * 60 * 1000) // Older than 1 hour
            }
          }
        ]
      },
      select: {
        tweetId: true,
        content: true,
        likes: true,
        retweets: true,
        replies: true,
        lastEngagementUpdate: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Limit to 10 tweets to avoid rate limits
    })

    return NextResponse.json({
      tweets: tweets,
      count: tweets.length
    })

  } catch (error) {
    console.error('Get tweets for engagement update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
