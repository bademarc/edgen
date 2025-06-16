import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculatePoints } from '@/lib/utils'
import { getManualTweetSubmissionService } from '@/lib/manual-tweet-submission'

/**
 * Debug endpoint to test and diagnose point awarding system
 * This endpoint provides comprehensive debugging information
 */
export async function GET() {
  try {
    console.log('🔍 Starting point system debug analysis...')

    // 1. Test calculatePoints function
    const testEngagement = { likes: 10, retweets: 5, comments: 3 }
    const calculatedPoints = calculatePoints(testEngagement)
    console.log('📊 calculatePoints test:', { testEngagement, calculatedPoints })

    // 2. Check database schema and constraints
    const userTableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'User' AND column_name = 'totalPoints'
    `
    console.log('🗄️ User.totalPoints column info:', userTableInfo)

    const tweetTableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'Tweet' AND column_name IN ('totalPoints', 'basePoints', 'bonusPoints')
    `
    console.log('🗄️ Tweet points columns info:', tweetTableInfo)

    // 3. Check recent tweet submissions
    const recentTweets = await prisma.tweet.findMany({
      where: {
        submittedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            xUsername: true,
            totalPoints: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      },
      take: 10
    })
    console.log('📝 Recent tweet submissions (last 24h):', recentTweets.length)

    // 4. Check points history
    const recentPointsHistory = await prisma.pointsHistory.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            xUsername: true,
            totalPoints: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })
    console.log('📈 Recent points history (last 24h):', recentPointsHistory.length)

    // 5. Check for users with mismatched points
    const usersWithTweets = await prisma.user.findMany({
      where: {
        tweets: {
          some: {}
        }
      },
      include: {
        tweets: {
          select: {
            totalPoints: true
          }
        }
      },
      take: 10
    })

    const pointsMismatchAnalysis = usersWithTweets.map(user => {
      const calculatedTotal = user.tweets.reduce((sum, tweet) => sum + tweet.totalPoints, 0)
      return {
        userId: user.id,
        name: user.name,
        xUsername: user.xUsername,
        storedTotalPoints: user.totalPoints,
        calculatedTotalPoints: calculatedTotal,
        mismatch: user.totalPoints !== calculatedTotal,
        difference: user.totalPoints - calculatedTotal
      }
    })

    console.log('🔍 Points mismatch analysis:', pointsMismatchAnalysis)

    // 6. Test manual submission service
    const submissionService = getManualTweetSubmissionService()
    const submissionStatus = submissionService.getSubmissionStatus('test-user-id')
    console.log('🔧 Manual submission service status:', submissionStatus)

    // 7. Database transaction test
    let transactionTestResult = null
    try {
      await prisma.$transaction(async (tx) => {
        // Test creating a tweet and updating user points
        const testUser = await tx.user.findFirst({
          where: {
            totalPoints: {
              gte: 0
            }
          }
        })

        if (testUser) {
          const originalPoints = testUser.totalPoints
          console.log(`🧪 Testing transaction with user ${testUser.id}, original points: ${originalPoints}`)
          
          // This is just a test - we'll rollback
          await tx.user.update({
            where: { id: testUser.id },
            data: {
              totalPoints: {
                increment: 1
              }
            }
          })

          const updatedUser = await tx.user.findUnique({
            where: { id: testUser.id }
          })

          transactionTestResult = {
            success: true,
            originalPoints,
            updatedPoints: updatedUser?.totalPoints,
            incrementWorked: updatedUser?.totalPoints === originalPoints + 1
          }

          // Rollback by throwing an error
          throw new Error('Test transaction - rolling back')
        }
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'Test transaction - rolling back') {
        console.log('✅ Transaction test completed (rolled back as expected)')
      } else {
        console.error('❌ Transaction test failed:', error)
        transactionTestResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // 8. Check for any database constraints or triggers
    const constraints = await prisma.$queryRaw`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name IN ('User', 'Tweet') 
      AND constraint_type IN ('CHECK', 'FOREIGN KEY')
    `
    console.log('🔒 Database constraints:', constraints)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      debug: {
        calculatePointsTest: {
          input: testEngagement,
          output: calculatedPoints,
          formula: 'likes * 1 + retweets * 3 + comments * 2',
          expected: testEngagement.likes + (testEngagement.retweets * 3) + (testEngagement.comments * 2)
        },
        databaseSchema: {
          userTotalPointsColumn: userTableInfo,
          tweetPointsColumns: tweetTableInfo,
          constraints
        },
        recentActivity: {
          tweetsLast24h: recentTweets.length,
          pointsHistoryLast24h: recentPointsHistory.length,
          recentTweets: recentTweets.map(tweet => ({
            id: tweet.id,
            tweetId: tweet.tweetId,
            userId: tweet.userId,
            userName: tweet.user.name,
            userXUsername: tweet.user.xUsername,
            totalPoints: tweet.totalPoints,
            basePoints: tweet.basePoints,
            bonusPoints: tweet.bonusPoints,
            submittedAt: tweet.submittedAt,
            userTotalPoints: tweet.user.totalPoints
          })),
          recentPointsHistory: recentPointsHistory.map(history => ({
            id: history.id,
            userId: history.userId,
            userName: history.user.name,
            userXUsername: history.user.xUsername,
            pointsAwarded: history.pointsAwarded,
            reason: history.reason,
            createdAt: history.createdAt,
            userCurrentTotalPoints: history.user.totalPoints
          }))
        },
        pointsMismatchAnalysis,
        transactionTest: transactionTestResult,
        submissionServiceStatus: submissionStatus
      },
      recommendations: [
        calculatedPoints === 31 ? '✅ calculatePoints function working correctly' : '❌ calculatePoints function issue',
        recentTweets.length > 0 ? '✅ Recent tweet submissions found' : '⚠️ No recent tweet submissions',
        recentPointsHistory.length > 0 ? '✅ Recent points history found' : '⚠️ No recent points history',
        pointsMismatchAnalysis.some(p => p.mismatch) ? '❌ Points mismatch detected' : '✅ No points mismatch detected',
        transactionTestResult?.success ? '✅ Database transactions working' : '❌ Database transaction issues'
      ]
    })

  } catch (error) {
    console.error('❌ Point system debug failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Point system debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// POST endpoint for testing specific scenarios
export async function POST(request: NextRequest) {
  try {
    const { action, userId, tweetData } = await request.json()

    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Action is required'
      }, { status: 400 })
    }

    switch (action) {
      case 'test_points_calculation':
        if (!tweetData) {
          return NextResponse.json({
            success: false,
            error: 'tweetData is required for points calculation test'
          }, { status: 400 })
        }

        const basePoints = 5
        const bonusPoints = calculatePoints({
          likes: tweetData.likes || 0,
          retweets: tweetData.retweets || 0,
          comments: tweetData.replies || 0
        }) - basePoints
        const totalPoints = basePoints + bonusPoints

        return NextResponse.json({
          success: true,
          calculation: {
            input: tweetData,
            basePoints,
            bonusPoints,
            totalPoints,
            formula: 'base(5) + (likes * 1 + retweets * 3 + replies * 2) - base'
          }
        })

      case 'check_user_points':
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'userId is required for user points check'
          }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            tweets: {
              select: {
                totalPoints: true,
                submittedAt: true
              }
            },
            pointsHistory: {
              select: {
                pointsAwarded: true,
                createdAt: true,
                reason: true
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 10
            }
          }
        })

        if (!user) {
          return NextResponse.json({
            success: false,
            error: 'User not found'
          }, { status: 404 })
        }

        const calculatedTotal = user.tweets.reduce((sum, tweet) => sum + tweet.totalPoints, 0)

        return NextResponse.json({
          success: true,
          userAnalysis: {
            userId: user.id,
            name: user.name,
            xUsername: user.xUsername,
            storedTotalPoints: user.totalPoints,
            calculatedTotalPoints: calculatedTotal,
            mismatch: user.totalPoints !== calculatedTotal,
            difference: user.totalPoints - calculatedTotal,
            tweetsCount: user.tweets.length,
            recentPointsHistory: user.pointsHistory
          }
        })

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`
        }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Point system debug POST failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Point system debug POST failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
