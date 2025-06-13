/**
 * X API Tweet Fetching Endpoint
 * Fetches tweet data using new X API credentials
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSimplifiedXApiService } from '@/lib/simplified-x-api'
import { validateTweetURL } from '@/lib/url-validator'

export async function POST(request: NextRequest) {
  try {
    const { tweetUrl, tweetId } = await request.json()

    if (!tweetUrl && !tweetId) {
      return NextResponse.json(
        { error: 'Either tweetUrl or tweetId is required' },
        { status: 400 }
      )
    }

    console.log(`🐦 Fetching tweet data via X API: ${tweetUrl || tweetId}`)

    const xApiService = getSimplifiedXApiService()

    if (!xApiService.isReady()) {
      return NextResponse.json(
        {
          error: 'X API service not available',
          details: 'X API credentials may not be configured correctly'
        },
        { status: 503 }
      )
    }

    let tweetData

    if (tweetUrl) {
      // Validate URL format
      const urlValidation = validateTweetURL(tweetUrl)
      if (!urlValidation.isValid) {
        return NextResponse.json(
          {
            error: 'Invalid tweet URL format',
            details: urlValidation.error,
            message: 'Please provide a valid X/Twitter tweet URL'
          },
          { status: 400 }
        )
      }

      // Extract tweet ID from URL and use getTweetById
      const tweetIdFromUrl = xApiService.extractTweetId(tweetUrl)
      if (!tweetIdFromUrl) {
        return NextResponse.json(
          {
            error: 'Invalid tweet URL format',
            details: 'Could not extract tweet ID from URL',
            message: 'Please provide a valid X/Twitter tweet URL'
          },
          { status: 400 }
        )
      }
      tweetData = await xApiService.getTweetById(tweetIdFromUrl)
    } else {
      tweetData = await xApiService.getTweetById(tweetId)
    }

    if (tweetData) {
      console.log(`✅ Tweet data fetched successfully via X API`)

      return NextResponse.json({
        success: true,
        message: 'Tweet data fetched successfully',
        data: {
          id: tweetData.id,
          content: tweetData.content,
          author: {
            id: tweetData.author.id,
            username: tweetData.author.username,
            name: tweetData.author.name,
            verified: tweetData.author.verified,
            profileImage: tweetData.author.profileImage,
            followersCount: tweetData.author.followersCount,
            followingCount: tweetData.author.followingCount
          },
          engagement: {
            likes: tweetData.engagement.likes,
            retweets: tweetData.engagement.retweets,
            replies: tweetData.engagement.replies,
            quotes: tweetData.engagement.quotes
          },
          createdAt: tweetData.createdAt,
          isFromLayerEdgeCommunity: tweetData.isFromLayerEdgeCommunity,
          url: tweetData.url,
          source: 'x-api'
        }
      })
    } else {
      console.log(`❌ Tweet not found via X API: ${tweetUrl || tweetId}`)

      return NextResponse.json(
        {
          success: false,
          error: 'Tweet not found',
          message: 'Unable to fetch tweet data'
        },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('X API tweet fetching error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch tweet data'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    const maxResults = parseInt(searchParams.get('maxResults') || '10')

    if (!username) {
      return NextResponse.json(
        { error: 'Username parameter is required' },
        { status: 400 }
      )
    }

    console.log(`📝 Fetching user tweets for @${username}`)

    const xApiService = getSimplifiedXApiService()

    if (!xApiService.isReady()) {
      return NextResponse.json(
        {
          error: 'X API service not available',
          details: 'X API credentials may not be configured correctly'
        },
        { status: 503 }
      )
    }

    const userTweets = await xApiService.getUserTweets(username, maxResults)

    if (userTweets && userTweets.length > 0) {
      console.log(`✅ Fetched ${userTweets.length} tweets for @${username}`)

      return NextResponse.json({
        success: true,
        message: `Fetched ${userTweets.length} tweets successfully`,
        data: {
          username,
          tweetCount: userTweets.length,
          tweets: userTweets.map((tweet: any) => ({
            id: tweet.id,
            content: tweet.content,
            author: {
              username: tweet.author.username,
              name: tweet.author.name,
              verified: tweet.author.verified
            },
            engagement: {
              likes: tweet.engagement.likes,
              retweets: tweet.engagement.retweets,
              replies: tweet.engagement.replies,
              quotes: tweet.engagement.quotes
            },
            createdAt: tweet.createdAt,
            isFromLayerEdgeCommunity: tweet.isFromLayerEdgeCommunity,
            url: tweet.url
          }))
        }
      })
    } else {
      console.log(`❌ No tweets found for @${username}`)

      return NextResponse.json(
        {
          success: false,
          error: 'No tweets found',
          message: 'Unable to fetch user tweets'
        },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('X API user tweets fetching error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch user tweets'
      },
      { status: 500 }
    )
  }
}
