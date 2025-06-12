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

    // Get user data
    const userData = await prisma.user.findUnique({
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

    if (!userData) {
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

    // Calculate rank if not stored in database (fallback for dashboard sync issues)
    let userRank = userData.rank
    if (!userRank && userData.totalPoints > 0) {
      console.log('🔄 Calculating fallback rank for user dashboard')
      userRank = await prisma.user.count({
        where: {
          totalPoints: {
            gt: userData.totalPoints,
          },
        },
      }) + 1
    }

    const stats = {
      totalPoints: userData.totalPoints,
      rank: userRank,
      tweetsSubmitted: userData._count.tweets,
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
