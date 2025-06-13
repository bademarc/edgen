import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthenticatedUserId } from '@/lib/auth-utils'

/**
 * API endpoint to validate and fix user points
 * This endpoint checks for discrepancies between stored points and calculated points
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user with all tweets and points history
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tweets: {
          select: {
            id: true,
            tweetId: true,
            totalPoints: true,
            basePoints: true,
            bonusPoints: true,
            submittedAt: true,
            url: true
          },
          orderBy: {
            submittedAt: 'desc'
          }
        },
        pointsHistory: {
          select: {
            id: true,
            pointsAwarded: true,
            reason: true,
            createdAt: true,
            metadata: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 20
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate expected total points from tweets
    const calculatedTotalFromTweets = user.tweets.reduce((sum, tweet) => sum + tweet.totalPoints, 0)
    
    // Calculate total from points history
    const calculatedTotalFromHistory = user.pointsHistory.reduce((sum, history) => sum + history.pointsAwarded, 0)

    // Check for discrepancies
    const tweetPointsMismatch = user.totalPoints !== calculatedTotalFromTweets
    const historyPointsMismatch = user.totalPoints !== calculatedTotalFromHistory
    
    const analysis = {
      userId: user.id,
      userName: user.name,
      xUsername: user.xUsername,
      storedTotalPoints: user.totalPoints,
      calculatedFromTweets: calculatedTotalFromTweets,
      calculatedFromHistory: calculatedTotalFromHistory,
      discrepancies: {
        tweetPointsMismatch,
        historyPointsMismatch,
        tweetVsHistoryMismatch: calculatedTotalFromTweets !== calculatedTotalFromHistory
      },
      differences: {
        storedVsTweets: user.totalPoints - calculatedTotalFromTweets,
        storedVsHistory: user.totalPoints - calculatedTotalFromHistory,
        tweetsVsHistory: calculatedTotalFromTweets - calculatedTotalFromHistory
      },
      tweetsCount: user.tweets.length,
      historyEntriesCount: user.pointsHistory.length,
      recentTweets: user.tweets.slice(0, 5).map(tweet => ({
        id: tweet.id,
        tweetId: tweet.tweetId,
        totalPoints: tweet.totalPoints,
        basePoints: tweet.basePoints,
        bonusPoints: tweet.bonusPoints,
        submittedAt: tweet.submittedAt,
        url: tweet.url
      })),
      recentHistory: user.pointsHistory.slice(0, 10).map(history => ({
        id: history.id,
        pointsAwarded: history.pointsAwarded,
        reason: history.reason,
        createdAt: history.createdAt,
        metadata: history.metadata ? JSON.parse(history.metadata) : null
      }))
    }

    return NextResponse.json({
      success: true,
      analysis,
      recommendations: [
        tweetPointsMismatch ? '❌ User total points do not match sum of tweet points' : '✅ User total points match tweet points',
        historyPointsMismatch ? '❌ User total points do not match points history' : '✅ User total points match points history',
        analysis.discrepancies.tweetVsHistoryMismatch ? '❌ Tweet points and history points do not match' : '✅ Tweet points and history points match',
        user.tweets.length === 0 ? '⚠️ User has no tweets' : `✅ User has ${user.tweets.length} tweets`,
        user.pointsHistory.length === 0 ? '⚠️ User has no points history' : `✅ User has ${user.pointsHistory.length} history entries`
      ]
    })

  } catch (error) {
    console.error('❌ Points validation failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Points validation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST endpoint to fix points discrepancies
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { action } = await request.json()

    if (action !== 'fix_points') {
      return NextResponse.json(
        { error: 'Invalid action. Use "fix_points" to recalculate user points.' },
        { status: 400 }
      )
    }

    // Get user with all tweets
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tweets: {
          select: {
            totalPoints: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate correct total points
    const correctTotalPoints = user.tweets.reduce((sum, tweet) => sum + tweet.totalPoints, 0)
    const currentTotalPoints = user.totalPoints
    const difference = correctTotalPoints - currentTotalPoints

    if (difference === 0) {
      return NextResponse.json({
        success: true,
        message: 'User points are already correct',
        currentPoints: currentTotalPoints,
        calculatedPoints: correctTotalPoints,
        difference: 0
      })
    }

    // Update user points in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user total points
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          totalPoints: correctTotalPoints
        }
      })

      // Create a points history entry for the correction
      const pointsHistory = await tx.pointsHistory.create({
        data: {
          userId: userId,
          pointsAwarded: difference,
          reason: `Points correction: Fixed discrepancy between stored (${currentTotalPoints}) and calculated (${correctTotalPoints}) points`,
          metadata: JSON.stringify({
            correctionType: 'points_fix',
            previousTotal: currentTotalPoints,
            newTotal: correctTotalPoints,
            difference: difference,
            timestamp: new Date().toISOString()
          })
        }
      })

      return {
        user: updatedUser,
        pointsHistory
      }
    })

    console.log(`✅ Points corrected for user ${userId}: ${currentTotalPoints} → ${correctTotalPoints} (${difference > 0 ? '+' : ''}${difference})`)

    return NextResponse.json({
      success: true,
      message: `Points successfully corrected. ${difference > 0 ? 'Added' : 'Removed'} ${Math.abs(difference)} points.`,
      previousPoints: currentTotalPoints,
      newPoints: correctTotalPoints,
      difference: difference,
      correctionId: result.pointsHistory.id
    })

  } catch (error) {
    console.error('❌ Points correction failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Points correction failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT endpoint to recalculate all user points from scratch
export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { action } = await request.json()

    if (action !== 'recalculate_all') {
      return NextResponse.json(
        { error: 'Invalid action. Use "recalculate_all" to recalculate all points from tweets.' },
        { status: 400 }
      )
    }

    // Get all user tweets with engagement data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tweets: {
          select: {
            id: true,
            tweetId: true,
            likes: true,
            retweets: true,
            replies: true,
            basePoints: true,
            bonusPoints: true,
            totalPoints: true,
            submittedAt: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Recalculate total points
    const recalculatedTotal = user.tweets.reduce((sum, tweet) => sum + tweet.totalPoints, 0)
    const previousTotal = user.totalPoints

    // Update user points
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        totalPoints: recalculatedTotal
      }
    })

    console.log(`🔄 Recalculated points for user ${userId}: ${previousTotal} → ${recalculatedTotal}`)

    return NextResponse.json({
      success: true,
      message: 'Points successfully recalculated from all tweets',
      previousTotal,
      newTotal: recalculatedTotal,
      difference: recalculatedTotal - previousTotal,
      tweetsProcessed: user.tweets.length,
      tweetBreakdown: user.tweets.map(tweet => ({
        tweetId: tweet.tweetId,
        totalPoints: tweet.totalPoints,
        basePoints: tweet.basePoints,
        bonusPoints: tweet.bonusPoints,
        engagement: {
          likes: tweet.likes,
          retweets: tweet.retweets,
          replies: tweet.replies
        }
      }))
    })

  } catch (error) {
    console.error('❌ Points recalculation failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Points recalculation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
