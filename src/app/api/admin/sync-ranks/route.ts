import { NextRequest, NextResponse } from 'next/server'
import { getFreeTierService } from '@/lib/free-tier-service'
import { getBudgetDbService } from '@/lib/db-budget'

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const authHeader = request.headers.get('authorization')
    const adminSecret = process.env.ADMIN_SECRET
    
    if (!authHeader || !adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔄 Admin triggered rank synchronization')

    // Check if we're in free tier mode
    const isFreeTier = process.env.OPTIMIZE_FOR_FREE_TIER === 'true'

    if (isFreeTier) {
      // Use free tier service
      const freeTierService = getFreeTierService()
      await freeTierService.syncRanks()
    } else {
      // Use budget database service directly
      const budgetDb = getBudgetDbService()
      
      // Clear cache and force fresh leaderboard calculation
      const leaderboard = await budgetDb.getLeaderboard(100, true)
      console.log(`✅ Updated ranks for ${leaderboard.length} users`)
    }

    return NextResponse.json({
      success: true,
      message: 'Rank synchronization completed',
      timestamp: new Date().toISOString(),
      freeTier: isFreeTier
    })
  } catch (error) {
    console.error('❌ Rank synchronization failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to synchronize ranks',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for checking sync status
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const authHeader = request.headers.get('authorization')
    const adminSecret = process.env.ADMIN_SECRET
    
    if (!authHeader || !adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const isFreeTier = process.env.OPTIMIZE_FOR_FREE_TIER === 'true'
    
    return NextResponse.json({
      status: 'ready',
      freeTier: isFreeTier,
      endpoint: '/api/admin/sync-ranks',
      method: 'POST',
      description: 'Triggers manual rank synchronization for dashboard fix'
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    )
  }
}
