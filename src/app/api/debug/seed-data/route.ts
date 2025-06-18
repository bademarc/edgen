import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Type definitions for seed data response
interface SeedDataResponse {
  message: string
  data?: {
    usersCreated: number
    tweetsCreated: number
    pointsHistoryCreated: number
    finalCounts: {
      users: number
      tweets: number
      pointsHistory: number
      totalPoints: {
        _sum: { totalPoints: number | null }
      }
    }
  }
  userCount?: number
  action?: string
  timestamp: string
  error?: string
  details?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 SEED DATA: Starting database seeding...')
    
    // Check if data already exists
    const userCount = await prisma.user.count()
    if (userCount > 0) {
      const response: SeedDataResponse = {
        message: 'Database already has data',
        userCount,
        action: 'skipped',
        timestamp: new Date().toISOString()
      }
      return NextResponse.json(response)
    }
    
    console.log('🌱 SEED DATA: Database is empty, creating test data...')
    
    // Create test users
    const testUsers = await Promise.all([
      prisma.user.create({
        data: {
          name: 'Test User 1',
          xUsername: 'testuser1',
          xUserId: 'test123',
          totalPoints: 150,
          joinDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        }
      }),
      prisma.user.create({
        data: {
          name: 'Test User 2', 
          xUsername: 'testuser2',
          xUserId: 'test456',
          totalPoints: 250,
          joinDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
        }
      }),
      prisma.user.create({
        data: {
          name: 'Test User 3',
          xUsername: 'testuser3', 
          xUserId: 'test789',
          totalPoints: 75,
          joinDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        }
      })
    ])
    
    console.log('✅ SEED DATA: Created test users:', testUsers.length)
    
    // Create test tweets
    const testTweets = await Promise.all([
      prisma.tweet.create({
        data: {
          url: 'https://twitter.com/testuser1/status/1234567890',
          content: 'Excited about @layeredge and $EDGEN! 🚀',
          userId: testUsers[0].id,
          likes: 25,
          retweets: 5,
          replies: 3,
          basePoints: 5,
          bonusPoints: 15,
          totalPoints: 20,
          isVerified: true,
          originalTweetDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      }),
      prisma.tweet.create({
        data: {
          url: 'https://twitter.com/testuser2/status/1234567891',
          content: 'Just discovered LayerEdge platform! Amazing community 💎',
          userId: testUsers[1].id,
          likes: 45,
          retweets: 12,
          replies: 8,
          basePoints: 5,
          bonusPoints: 25,
          totalPoints: 30,
          isVerified: true,
          originalTweetDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      }),
      prisma.tweet.create({
        data: {
          url: 'https://twitter.com/testuser3/status/1234567892',
          content: 'Building the future with $EDGEN 🔥',
          userId: testUsers[2].id,
          likes: 15,
          retweets: 3,
          replies: 2,
          basePoints: 5,
          bonusPoints: 10,
          totalPoints: 15,
          isVerified: true,
          originalTweetDate: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
        }
      })
    ])
    
    console.log('✅ SEED DATA: Created test tweets:', testTweets.length)
    
    // Create points history
    const pointsHistory = await Promise.all([
      prisma.pointsHistory.create({
        data: {
          userId: testUsers[0].id,
          tweetId: testTweets[0].id,
          pointsAwarded: 20,
          reason: 'Tweet submission with engagement bonus'
        }
      }),
      prisma.pointsHistory.create({
        data: {
          userId: testUsers[1].id,
          tweetId: testTweets[1].id,
          pointsAwarded: 30,
          reason: 'High engagement tweet'
        }
      }),
      prisma.pointsHistory.create({
        data: {
          userId: testUsers[2].id,
          tweetId: testTweets[2].id,
          pointsAwarded: 15,
          reason: 'Recent tweet submission'
        }
      }),
      // Additional points for users
      prisma.pointsHistory.create({
        data: {
          userId: testUsers[0].id,
          pointsAwarded: 130,
          reason: 'Community participation bonus'
        }
      }),
      prisma.pointsHistory.create({
        data: {
          userId: testUsers[1].id,
          pointsAwarded: 220,
          reason: 'Multiple tweet submissions'
        }
      }),
      prisma.pointsHistory.create({
        data: {
          userId: testUsers[2].id,
          pointsAwarded: 60,
          reason: 'Engagement activities'
        }
      })
    ])
    
    console.log('✅ SEED DATA: Created points history:', pointsHistory.length)
    
    // Update user ranks
    await prisma.user.update({
      where: { id: testUsers[1].id },
      data: { rank: 1 }
    })
    await prisma.user.update({
      where: { id: testUsers[0].id },
      data: { rank: 2 }
    })
    await prisma.user.update({
      where: { id: testUsers[2].id },
      data: { rank: 3 }
    })
    
    console.log('✅ SEED DATA: Updated user ranks')
    
    // Verify the seeded data
    const finalCounts = {
      users: await prisma.user.count(),
      tweets: await prisma.tweet.count(),
      pointsHistory: await prisma.pointsHistory.count(),
      totalPoints: await prisma.user.aggregate({
        _sum: { totalPoints: true }
      })
    }
    
    console.log('✅ SEED DATA: Seeding complete:', finalCounts)

    const response: SeedDataResponse = {
      message: 'Test data seeded successfully',
      data: {
        usersCreated: testUsers.length,
        tweetsCreated: testTweets.length,
        pointsHistoryCreated: pointsHistory.length,
        finalCounts
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response)
    
  } catch (error) {
    console.error('❌ SEED DATA: Error seeding data:', error)

    const errorResponse: SeedDataResponse = {
      message: 'Failed to seed data',
      error: 'Failed to seed data',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
