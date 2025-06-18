import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DATA CHECK: Starting comprehensive data analysis...')
    
    // Test basic connection
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ DATA CHECK: Database connection working')
    
    // Check if tables exist and have data
    const results = {
      connection: 'success',
      timestamp: new Date().toISOString(),
      tables: {},
      sampleData: {},
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasDirectUrl: !!process.env.DIRECT_URL,
        databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...'
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
        sample: userSample
      }
      console.log(`📊 DATA CHECK: Users - Count: ${userCount}, Sample:`, userSample)
    } catch (error) {
      results.tables.users = { error: error instanceof Error ? error.message : 'Unknown error' }
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
        sample: tweetSample
      }
      console.log(`📊 DATA CHECK: Tweets - Count: ${tweetCount}, Sample:`, tweetSample)
    } catch (error) {
      results.tables.tweets = { error: error instanceof Error ? error.message : 'Unknown error' }
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
        sample: pointsSample
      }
      console.log(`📊 DATA CHECK: Points History - Count: ${pointsCount}, Sample:`, pointsSample)
    } catch (error) {
      results.tables.pointsHistory = { error: error instanceof Error ? error.message : 'Unknown error' }
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
      results.sampleData.aggregation = { error: error instanceof Error ? error.message : 'Unknown error' }
      console.error('❌ DATA CHECK: Aggregation error:', error)
    }
    
    // Summary
    const hasAnyData = Object.values(results.tables).some(table => 
      typeof table === 'object' && 'hasData' in table && table.hasData
    )
    
    results.summary = {
      hasAnyData,
      tablesWithData: Object.entries(results.tables)
        .filter(([_, table]) => typeof table === 'object' && 'hasData' in table && table.hasData)
        .map(([name, _]) => name),
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
    
    return NextResponse.json({
      connection: 'failed',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
  }
}
