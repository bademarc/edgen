import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth-utils'
import { isValidTwitterUrl, isLayerEdgeCommunityUrl, validateTweetContent } from '@/lib/utils'
import { getFallbackService } from '@/lib/fallback-service'

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
        { error: 'Tweet must be from the LayerEdge community' },
        { status: 400 }
      )
    }

    // Use fallback service to get tweet data
    const fallbackService = getFallbackService({
      enableScraping: true,
      preferApi: true,
      apiTimeoutMs: 5000, // 5 seconds for preview
    })

    const tweetData = await fallbackService.getTweetData(tweetUrl)

    if (!tweetData) {
      const fallbackStatus = fallbackService.getStatus()
      return NextResponse.json(
        {
          error: 'Failed to fetch tweet data',
          fallbackStatus,
          suggestedAction: fallbackStatus.isApiRateLimited
            ? 'Twitter API is rate limited. Preview may be limited.'
            : 'Unable to fetch tweet preview. Please try again.'
        },
        { status: 500 }
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
        author: tweetData.author || 'Unknown',
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
