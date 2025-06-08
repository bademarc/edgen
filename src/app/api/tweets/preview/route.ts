import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth-utils'
import { isValidTwitterUrl, isLayerEdgeCommunityUrl, validateTweetContent, verifyTweetAuthor, extractUsernameFromTweetUrl } from '@/lib/utils'
import { prisma } from '@/lib/db'

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
        { error: 'Please enter a valid X (Twitter) URL' },
        { status: 400 }
      )
    }

    // Get authenticated user for security verification
    const authenticatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        xUsername: true,
        name: true
      }
    })

    if (!authenticatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // For build compatibility, return mock data with security validation
    // Extract username from URL for verification
    const urlUsername = extractUsernameFromTweetUrl(tweetUrl)

    // Security check: Verify URL username matches authenticated user
    if (urlUsername && !verifyTweetAuthor(urlUsername, authenticatedUser.xUsername)) {
      return NextResponse.json(
        {
          error: 'You can only preview your own tweets. This tweet appears to be from a different user.',
          errorType: 'UNAUTHORIZED_PREVIEW',
          tweetAuthor: urlUsername,
          authenticatedUser: authenticatedUser.xUsername
        },
        { status: 403 }
      )
    }

    // Create mock data using authenticated user's info
    const mockTweetData = {
      content: 'This is a mock tweet preview for @layeredge community! #LayerEdge $EDGEN',
      author: authenticatedUser.xUsername || 'LayerEdge User',
      createdAt: new Date().toISOString(),
      likes: Math.floor(Math.random() * 50),
      retweets: Math.floor(Math.random() * 20),
      replies: Math.floor(Math.random() * 10),
      source: 'mock'
    }

    // Validate tweet content for required keywords
    const isValidContent = validateTweetContent(mockTweetData.content)

    // Calculate potential points
    const basePoints = 5
    const engagementPoints = (mockTweetData.likes || 0) * 1 +
                           (mockTweetData.retweets || 0) * 3 +
                           (mockTweetData.replies || 0) * 2
    const totalPoints = basePoints + engagementPoints

    return NextResponse.json({
      preview: {
        content: mockTweetData.content,
        author: mockTweetData.author,
        createdAt: mockTweetData.createdAt,
        engagement: {
          likes: mockTweetData.likes,
          retweets: mockTweetData.retweets,
          replies: mockTweetData.replies,
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
        source: mockTweetData.source,
      },
      fallbackStatus: {
        apiFailureCount: 0,
        lastApiFailure: null,
        isApiRateLimited: false,
        rateLimitResetTime: null,
        preferredSource: 'mock'
      },
    })
  } catch (error) {
    console.error('Error fetching tweet preview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tweet preview' },
      { status: 500 }
    )
  }
}
