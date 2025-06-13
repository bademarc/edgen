import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { PointsSyncService } from '@/lib/points-sync-service'

/**
 * Admin endpoint to audit and fix points inconsistencies
 */
export async function POST(request: NextRequest) {
  try {
    // Check for admin authorization
    const authHeader = request.headers.get('authorization')
    const adminSecret = process.env.ADMIN_SECRET || 'layeredge-admin-secret-2024'

    if (authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action = 'audit', userId } = body

    console.log(`🔍 Admin points audit - Action: ${action}`)

    switch (action) {
      case 'audit':
        return await auditAllUsers()
      
      case 'fix':
        if (userId) {
          return await fixUserPoints(userId)
        } else {
          return await fixAllUsers()
        }
      
      case 'sync':
        return await syncAllUsers()
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: audit, fix, or sync' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in points audit:', error)
    return NextResponse.json(
      { error: 'Failed to perform points audit' },
      { status: 500 }
    )
  }
}

async function auditAllUsers() {
  console.log('🔍 Starting comprehensive points audit')

  const users = await prisma.user.findMany({
    where: { totalPoints: { gt: 0 } },
    select: {
      id: true,
      name: true,
      xUsername: true,
      totalPoints: true,
      rank: true
    },
    orderBy: { totalPoints: 'desc' }
  })

  const auditResults = []
  let inconsistentCount = 0

  for (const user of users) {
    try {
      const verification = await PointsSyncService.verifyUserPointsConsistency(user.id)
      
      if (!verification.isConsistent) {
        inconsistentCount++
      }

      auditResults.push({
        userId: user.id,
        name: user.name || user.xUsername,
        currentPoints: verification.userPoints,
        calculatedPoints: verification.calculatedPoints,
        difference: verification.difference,
        isConsistent: verification.isConsistent,
        rank: user.rank
      })
    } catch (error) {
      console.error(`Error auditing user ${user.id}:`, error)
      auditResults.push({
        userId: user.id,
        name: user.name || user.xUsername,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return NextResponse.json({
    success: true,
    summary: {
      totalUsers: users.length,
      inconsistentUsers: inconsistentCount,
      consistentUsers: users.length - inconsistentCount
    },
    results: auditResults
  })
}

async function fixUserPoints(userId: string) {
  console.log(`🔧 Fixing points for user ${userId}`)

  try {
    await PointsSyncService.fixUserPointsInconsistency(userId)
    
    const verification = await PointsSyncService.verifyUserPointsConsistency(userId)
    
    return NextResponse.json({
      success: true,
      message: `Points fixed for user ${userId}`,
      verification
    })
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fix points for user ${userId}: ${error}` },
      { status: 500 }
    )
  }
}

async function fixAllUsers() {
  console.log('🔧 Fixing points for all users')

  const users = await prisma.user.findMany({
    where: { totalPoints: { gt: 0 } },
    select: { id: true }
  })

  const results = []
  let fixedCount = 0

  for (const user of users) {
    try {
      const verificationBefore = await PointsSyncService.verifyUserPointsConsistency(user.id)
      
      if (!verificationBefore.isConsistent) {
        await PointsSyncService.fixUserPointsInconsistency(user.id)
        fixedCount++
        
        const verificationAfter = await PointsSyncService.verifyUserPointsConsistency(user.id)
        
        results.push({
          userId: user.id,
          fixed: true,
          before: verificationBefore,
          after: verificationAfter
        })
      } else {
        results.push({
          userId: user.id,
          fixed: false,
          message: 'Already consistent'
        })
      }
    } catch (error) {
      console.error(`Error fixing user ${user.id}:`, error)
      results.push({
        userId: user.id,
        fixed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return NextResponse.json({
    success: true,
    summary: {
      totalUsers: users.length,
      fixedUsers: fixedCount
    },
    results
  })
}

async function syncAllUsers() {
  console.log('🔄 Syncing all users')

  try {
    await PointsSyncService.batchSyncAllUsers()
    
    return NextResponse.json({
      success: true,
      message: 'All users synced successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to sync all users: ${error}` },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check for admin authorization
    const authHeader = request.headers.get('authorization')
    const adminSecret = process.env.ADMIN_SECRET || 'layeredge-admin-secret-2024'

    if (authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Quick audit summary
    const totalUsers = await prisma.user.count({ where: { totalPoints: { gt: 0 } } })
    const totalPointsAwarded = await prisma.pointsHistory.aggregate({
      _sum: { pointsAwarded: true }
    })
    const totalPointsInUsers = await prisma.user.aggregate({
      _sum: { totalPoints: true }
    })

    return NextResponse.json({
      summary: {
        totalUsers,
        totalPointsAwarded: totalPointsAwarded._sum.pointsAwarded || 0,
        totalPointsInUsers: totalPointsInUsers._sum.totalPoints || 0,
        difference: (totalPointsInUsers._sum.totalPoints || 0) - (totalPointsAwarded._sum.pointsAwarded || 0)
      }
    })
  } catch (error) {
    console.error('Error getting points audit summary:', error)
    return NextResponse.json(
      { error: 'Failed to get audit summary' },
      { status: 500 }
    )
  }
}
