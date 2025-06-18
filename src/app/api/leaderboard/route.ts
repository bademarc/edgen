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
    let rankUpdateSuccess = false
    if (leaderboard.length > 0) {
      try {
        console.log(`🔄 Updating ranks for ${leaderboard.length} users`)

        // Validate and sanitize user IDs (they should be UUIDs from our database)
        const validatedUpdates = leaderboard
          .filter(user => {
            // Enhanced validation: check for valid UUID format and reasonable rank values
            const isValidId = user.id && typeof user.id === 'string' && user.id.length >= 32
            const isValidRank = typeof user.rank === 'number' && user.rank > 0 && user.rank <= 10000

            if (!isValidId) {
              console.warn(`⚠️ Invalid user ID detected: ${user.id}`)
            }
            if (!isValidRank) {
              console.warn(`⚠️ Invalid rank detected for user ${user.id}: ${user.rank}`)
            }

            return isValidId && isValidRank
          })
          .map(user => `('${user.id.replace(/'/g, "''")}', ${user.rank})`) // Escape single quotes for safety
          .join(',')

        if (validatedUpdates) {
          const filteredCount = leaderboard.length - validatedUpdates.split(',').length
          if (filteredCount > 0) {
            console.warn(`⚠️ Filtered out ${filteredCount} invalid entries from rank update`)
          }

          // Use $executeRawUnsafe for direct SQL interpolation
          const startTime = Date.now()
          await prisma.$executeRawUnsafe(`
            UPDATE "User"
            SET rank = updates.new_rank::integer
            FROM (VALUES ${validatedUpdates}) AS updates(user_id, new_rank)
            WHERE "User".id = updates.user_id
          `)
          const duration = Date.now() - startTime

          console.log(`✅ Successfully updated user ranks in ${duration}ms`)
          rankUpdateSuccess = true
        } else {
          console.warn('⚠️ No valid updates to process for rank update')
        }
      } catch (rankUpdateError) {
        // Enhanced error logging with more context
        console.error('❌ Failed to update user ranks:', {
          error: rankUpdateError instanceof Error ? rankUpdateError.message : rankUpdateError,
          stack: rankUpdateError instanceof Error ? rankUpdateError.stack : undefined,
          leaderboardSize: leaderboard.length,
          timestamp: new Date().toISOString()
        })

        // Check if it's a specific database error we can handle
        if (rankUpdateError instanceof Error) {
          if (rankUpdateError.message.includes('syntax error')) {
            console.error('🔍 SQL syntax error detected - this should not happen with the fix')
          } else if (rankUpdateError.message.includes('connection')) {
            console.error('🔍 Database connection error during rank update')
          }
        }

        // The leaderboard data is still valid even if rank updates fail
        rankUpdateSuccess = false
      }
    }

    return NextResponse.json({
      users: leaderboard,
      cached: false,
      freeTier: false,
      rankUpdateSuccess,
      metadata: {
        totalUsers: leaderboard.length,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
