import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { PointsSyncService } from '@/lib/points-sync-service'

/**
 * Refresh user data endpoint
 * Used to update user points and rankings in real-time
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Sync user points and clear caches
    await PointsSyncService.syncUserPointsAfterQuest(userId)

    // Get updated user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        xUsername: true,
        xUserId: true,
        totalPoints: true,
        rank: true,
        autoMonitoringEnabled: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user
    })
  } catch (error) {
    console.error('Error refreshing user data:', error)
    return NextResponse.json(
      { error: 'Failed to refresh user data' },
      { status: 500 }
    )
  }
}
