import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Type definitions for debug data check response
interface TableStatus {
  count: number
  hasData: boolean
  sample?: any
  error?: string
}

interface AggregationResult {
  _sum: { totalPoints: number | null }
  _count: { id: number }
  error?: string
}

interface DataCheckResponse {
  connection: 'success' | 'failed'
  timestamp: string
  tables: {
    users?: TableStatus
    tweets?: TableStatus
    pointsHistory?: TableStatus
  }
  sampleData: {
    aggregation?: AggregationResult
  }
  environment: {
    nodeEnv: string | undefined
    hasDatabaseUrl: boolean
    hasDirectUrl: boolean
    databaseUrlPrefix: string
  }
  summary?: {
    hasAnyData: boolean
    tablesWithData: string[]
    recommendation: string
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DATA CHECK: Starting comprehensive data analysis...')

    // Test basic connection
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ DATA CHECK: Database connection working')

    // Initialize results with proper typing
    const results: DataCheckResponse = {
      connection: 'success',
      timestamp: new Date().toISOString(),
      tables: {},
      sampleData: {},
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasDirectUrl: !!process.env.DIRECT_URL,
        databaseUrlPrefix: (process.env.DATABASE_URL?.substring(0, 30) || 'undefined') + '...'
      }
    }
    
    // Check User table
    try {
      const userCount = await prisma.user.count()
      const userSample = await prisma.user.findFirst({
        select: {
          id: true,
          name: true,
          xUsername: true,
          totalPoints: true,
          joinDate: true
        }
      })

      results.tables.users = {
        count: userCount,
        hasData: userCount > 0,
        sample: userSample || undefined
      }
      console.log(`📊 DATA CHECK: Users - Count: ${userCount}, Sample:`, userSample)
    } catch (error) {
      results.tables.users = {
        count: 0,
        hasData: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      console.error('❌ DATA CHECK: User table error:', error)
    }
    
    // Check Tweet table
    try {
      const tweetCount = await prisma.tweet.count()
      const tweetSample = await prisma.tweet.findFirst({
        select: {
          id: true,
          url: true,
          totalPoints: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              xUsername: true
            }
          }
        }
      })

      results.tables.tweets = {
        count: tweetCount,
        hasData: tweetCount > 0,
        sample: tweetSample || undefined
      }
      console.log(`📊 DATA CHECK: Tweets - Count: ${tweetCount}, Sample:`, tweetSample)
    } catch (error) {
      results.tables.tweets = {
        count: 0,
        hasData: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      console.error('❌ DATA CHECK: Tweet table error:', error)
    }
    
    // Check PointsHistory table
    try {
      const pointsCount = await prisma.pointsHistory.count()
      const pointsSample = await prisma.pointsHistory.findFirst({
        select: {
          id: true,
          pointsAwarded: true,
          reason: true,
          createdAt: true,
          user: {
            select: {
              name: true
            }
          }
        }
      })

      results.tables.pointsHistory = {
        count: pointsCount,
        hasData: pointsCount > 0,
        sample: pointsSample || undefined
      }
      console.log(`📊 DATA CHECK: Points History - Count: ${pointsCount}, Sample:`, pointsSample)
    } catch (error) {
      results.tables.pointsHistory = {
        count: 0,
        hasData: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      console.error('❌ DATA CHECK: PointsHistory table error:', error)
    }
    
    // Check aggregations (like in stats API)
    try {
      const totalPointsAgg = await prisma.user.aggregate({
        _sum: {
          totalPoints: true
        },
        _count: {
          id: true
        }
      })

      results.sampleData.aggregation = totalPointsAgg
      console.log('📊 DATA CHECK: Aggregation result:', totalPointsAgg)
    } catch (error) {
      results.sampleData.aggregation = {
        _sum: { totalPoints: null },
        _count: { id: 0 },
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      console.error('❌ DATA CHECK: Aggregation error:', error)
    }

    // Summary with proper type checking
    const tablesArray = Object.values(results.tables)
    const hasAnyData = tablesArray.some(table =>
      table && typeof table === 'object' && 'hasData' in table && table.hasData === true
    )

    const tablesWithData = Object.entries(results.tables)
      .filter(([_, table]) => table && typeof table === 'object' && 'hasData' in table && table.hasData === true)
      .map(([name, _]) => name)

    results.summary = {
      hasAnyData,
      tablesWithData,
      recommendation: hasAnyData
        ? 'Database has data - check statistics API logic'
        : 'Database is empty - need to populate with test data or check data migration'
    }
    
    console.log('✅ DATA CHECK: Analysis complete:', results.summary)
    
    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
    
  } catch (error) {
    console.error('❌ DATA CHECK: Critical error:', error)

    const errorResponse = {
      connection: 'failed' as const,
      timestamp: new Date().toISOString(),
      tables: {},
      sampleData: {},
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasDirectUrl: !!process.env.DIRECT_URL,
        databaseUrlPrefix: (process.env.DATABASE_URL?.substring(0, 30) || 'undefined') + '...'
      },
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    }

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
  }
}
