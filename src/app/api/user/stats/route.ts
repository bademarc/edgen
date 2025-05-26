import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalPoints: true,
        rank: true,
        _count: {
          select: {
            tweets: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get points earned this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const thisWeekPoints = await prisma.pointsHistory.aggregate({
      where: {
        userId,
        createdAt: {
          gte: oneWeekAgo,
        },
      },
      _sum: {
        pointsAwarded: true,
      },
    })

    const stats = {
      totalPoints: user.totalPoints,
      rank: user.rank,
      tweetsSubmitted: user._count.tweets,
      thisWeekPoints: thisWeekPoints._sum.pointsAwarded || 0,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    )
  }
}
