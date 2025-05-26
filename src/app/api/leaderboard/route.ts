import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get top users by total points
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
