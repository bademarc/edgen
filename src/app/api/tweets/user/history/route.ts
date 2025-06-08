import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // For build compatibility, return mock data
    // In production, this would use Prisma to fetch real data
    const mockTweets = [
      {
        id: '1',
        url: 'https://x.com/user/status/123',
        content: 'Excited about @layeredge and the future of Bitcoin! #LayerEdge',
        likes: 15,
        retweets: 5,
        replies: 3,
        totalPoints: 28,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        user: {
          id: userId,
          name: 'LayerEdge User',
          xUsername: 'layeredge_user',
          image: '/icon/-AlLx9IW_400x400.png'
        }
      },
      {
        id: '2',
        url: 'https://x.com/user/status/124',
        content: 'Building the future with $EDGEN! 🚀',
        likes: 8,
        retweets: 2,
        replies: 1,
        totalPoints: 17,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        user: {
          id: userId,
          name: 'LayerEdge User',
          xUsername: 'layeredge_user',
          image: '/icon/-AlLx9IW_400x400.png'
        }
      }
    ]

    const tweets = mockTweets.slice(offset, offset + limit)
    const totalCount = mockTweets.length

    // Mock stats
    const stats = {
      _count: { id: 2 },
      _sum: {
        totalPoints: 45,
        likes: 23,
        retweets: 7,
        replies: 4,
      }
    }

    return NextResponse.json({
      tweets,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      stats: {
        totalTweets: stats._count.id || 0,
        totalPoints: stats._sum.totalPoints || 0,
        totalLikes: stats._sum.likes || 0,
        totalRetweets: stats._sum.retweets || 0,
        totalReplies: stats._sum.replies || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching user tweet history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tweet history' },
      { status: 500 }
    )
  }
}
