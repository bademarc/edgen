import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getFreeTierService } from '@/lib/free-tier-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Check if we're in free tier mode
    const isFreeTier = process.env.OPTIMIZE_FOR_FREE_TIER === 'true'

    if (isFreeTier) {
      console.log('📋 Using FREE TIER leaderboard service')
      try {
        // Use free tier optimized service
        const freeTierService = getFreeTierService()
        const leaderboard = await freeTierService.getLeaderboard(limit)

        return NextResponse.json({
          users: leaderboard,
          cached: true,
          freeTier: true
        })
      } catch (freeTierError) {
        console.error('❌ Free tier service failed, falling back to direct DB:', freeTierError)
        // Fall through to direct database query
      }
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

    // Add rank and calculate average points per tweet
    const leaderboard = users.map((user, index) => ({
      ...user,
      rank: index + 1,
      tweetsCount: user._count.tweets,
      averagePointsPerTweet: user._count.tweets > 0 ? Math.round(user.totalPoints / user._count.tweets) : 0,
    }))

    // PRODUCTION FIX: Batch update ranks using raw SQL for performance
    // This prevents N+1 query problem with large user bases
    if (leaderboard.length > 0) {
      const rankUpdates = leaderboard.map(user => `('${user.id}', ${user.rank})`).join(',')
      await prisma.$executeRaw`
        UPDATE "User"
        SET rank = updates.new_rank::integer
        FROM (VALUES ${rankUpdates}) AS updates(user_id, new_rank)
        WHERE "User".id = updates.user_id
      `
    }

    return NextResponse.json({
      users: leaderboard,
      cached: false,
      freeTier: false
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
