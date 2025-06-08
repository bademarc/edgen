import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'

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

    // Fetch user's tweet submission history
    const tweets = await prisma.tweet.findMany({
      where: {
        userId: userId,
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
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    // Get total count for pagination
    const totalCount = await prisma.tweet.count({
      where: {
        userId: userId,
      },
    })

    // Calculate summary stats
    const stats = await prisma.tweet.aggregate({
      where: {
        userId: userId,
      },
      _sum: {
        totalPoints: true,
        likes: true,
        retweets: true,
        replies: true,
      },
      _count: {
        id: true,
      },
    })

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
