import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getFreeTierService } from '@/lib/free-tier-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Use free tier optimized service
    const freeTierService = getFreeTierService()

    // Check if we're in free tier mode
    const isFreeTier = process.env.OPTIMIZE_FOR_FREE_TIER === 'true'

    if (isFreeTier) {
      console.log('📋 Using FREE TIER leaderboard service')
      const leaderboard = await freeTierService.getLeaderboard(limit)

      return NextResponse.json({
        users: leaderboard,
        cached: true,
        freeTier: true
      })
    }

    // Fallback to original method
    const users = await prisma.user.findMany({
      where: {
        totalPoints: {
          gt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        xUsername: true,
        image: true,
        totalPoints: true,
        _count: {
          select: {
            tweets: true,
          },
        },
      },
      orderBy: [
        {
          totalPoints: 'desc',
        },
        {
          joinDate: 'asc', // Earlier joiners rank higher in case of ties
        },
      ],
      take: limit,
    })

    // Add rank to each user
    const leaderboard = users.map((user, index) => ({
      ...user,
      rank: index + 1,
      tweetsCount: user._count.tweets,
    }))

    // Update ranks in database (you might want to do this periodically instead)
    for (const user of leaderboard) {
      await prisma.user.update({
        where: { id: user.id },
        data: { rank: user.rank },
      })
    }

    return NextResponse.json(leaderboard)
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
