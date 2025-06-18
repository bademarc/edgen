import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Type definitions for database test response
interface DbTestResponse {
  status: 'success' | 'error'
  connection: 'working' | 'failed'
  tables?: any[]
  counts?: {
    users: number
    tweets: number
    pointsHistory: number
  }
  sampleData?: {
    user: any
    tweet: any
  }
  aggregation?: {
    _sum: { totalPoints: number | null }
  }
  timestamp: string
  error?: {
    message: string
    name?: string
    stack?: string
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DB TEST: Starting database connectivity test...')
    
    // Test 1: Basic connection
    console.log('🔍 DB TEST: Testing basic connection...')
    await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ DB TEST: Basic connection successful')
    
    // Test 2: Check if tables exist
    console.log('🔍 DB TEST: Checking table existence...')
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('User', 'Tweet', 'PointsHistory')
    `
    console.log('✅ DB TEST: Tables found:', tableCheck)
    
    // Test 3: Count records in each table
    console.log('🔍 DB TEST: Counting records...')
    
    const userCount = await prisma.user.count()
    console.log(`📊 DB TEST: Users: ${userCount}`)
    
    const tweetCount = await prisma.tweet.count()
    console.log(`📊 DB TEST: Tweets: ${tweetCount}`)
    
    const pointsCount = await prisma.pointsHistory.count()
    console.log(`📊 DB TEST: Points History: ${pointsCount}`)
    
    // Test 4: Sample data
    console.log('🔍 DB TEST: Fetching sample data...')
    
    const sampleUser = await prisma.user.findFirst({
      select: {
        id: true,
        name: true,
        totalPoints: true,
        _count: {
          select: {
            tweets: true
          }
        }
      }
    })
    console.log('📊 DB TEST: Sample user:', sampleUser)
    
    const sampleTweet = await prisma.tweet.findFirst({
      select: {
        id: true,
        url: true,
        totalPoints: true,
        user: {
          select: {
            name: true
          }
        }
      }
    })
    console.log('📊 DB TEST: Sample tweet:', sampleTweet)
    
    // Test 5: Aggregation query (like in stats)
    console.log('🔍 DB TEST: Testing aggregation...')
    const totalPointsAgg = await prisma.user.aggregate({
      _sum: {
        totalPoints: true
      }
    })
    console.log('📊 DB TEST: Total points aggregation:', totalPointsAgg)
    
    const result: DbTestResponse = {
      status: 'success',
      connection: 'working',
      tables: tableCheck as any[],
      counts: {
        users: userCount,
        tweets: tweetCount,
        pointsHistory: pointsCount
      },
      sampleData: {
        user: sampleUser || null,
        tweet: sampleTweet || null
      },
      aggregation: totalPointsAgg,
      timestamp: new Date().toISOString()
    }
    
    console.log('✅ DB TEST: All tests completed successfully')
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ DB TEST: Database test failed:', error)

    const errorResult: DbTestResponse = {
      status: 'error',
      connection: 'failed',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : undefined,
        stack: error instanceof Error ? error.stack : undefined
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(errorResult, { status: 500 })
  }
}
