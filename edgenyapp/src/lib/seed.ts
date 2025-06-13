import { prisma } from './db'

export async function seedDatabase() {
  try {
    // Clear existing data
    await prisma.pointsHistory.deleteMany()
    await prisma.tweet.deleteMany()
    await prisma.user.deleteMany()

    // Create demo users
    const users = await Promise.all([
      prisma.user.create({
        data: {
          id: '1',
          name: 'Demo User',
          email: 'demo@example.com',
          xUsername: 'demo_user',
          xUserId: 'demo123',
          image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          totalPoints: 1250,
          rank: 15,
        },
      }),
      prisma.user.create({
        data: {
          id: '2',
          name: 'CryptoEnthusiast',
          email: 'crypto@example.com',
          xUsername: 'crypto_enthusiast',
          xUserId: 'crypto456',
          totalPoints: 2450,
          rank: 1,
        },
      }),
      prisma.user.create({
        data: {
          id: '3',
          name: 'LayerEdgeFan',
          email: 'fan@example.com',
          xUsername: 'layeredge_fan',
          xUserId: 'fan789',
          totalPoints: 2180,
          rank: 2,
        },
      }),
      prisma.user.create({
        data: {
          id: '4',
          name: 'TokenTrader',
          email: 'trader@example.com',
          xUsername: 'token_trader',
          xUserId: 'trader101',
          totalPoints: 1950,
          rank: 3,
        },
      }),
      prisma.user.create({
        data: {
          id: '5',
          name: 'DeFiExplorer',
          email: 'defi@example.com',
          xUsername: 'defi_explorer',
          xUserId: 'defi202',
          totalPoints: 1720,
          rank: 4,
        },
      }),
    ])

    // Create demo tweets
    const tweets = await Promise.all([
      prisma.tweet.create({
        data: {
          url: 'https://x.com/demo_user/status/123456789',
          content: 'Excited about the latest LayerEdge developments! The future of blockchain infrastructure is here. #LayerEdge #Edgen',
          userId: '1',
          likes: 45,
          retweets: 12,
          replies: 8,
          basePoints: 5,
          bonusPoints: 84,
          totalPoints: 89,
          isVerified: true,
        },
      }),
      prisma.tweet.create({
        data: {
          url: 'https://x.com/demo_user/status/123456790',
          content: 'Just joined the LayerEdge community and loving the engagement! Great to see such an active ecosystem.',
          userId: '1',
          likes: 23,
          retweets: 5,
          replies: 3,
          basePoints: 5,
          bonusPoints: 39,
          totalPoints: 44,
          isVerified: true,
        },
      }),
      prisma.tweet.create({
        data: {
          url: 'https://x.com/crypto_enthusiast/status/987654321',
          content: 'LayerEdge $Edgen is revolutionizing how we think about blockchain scalability. Impressive tech!',
          userId: '2',
          likes: 78,
          retweets: 25,
          replies: 15,
          basePoints: 5,
          bonusPoints: 183,
          totalPoints: 188,
          isVerified: true,
        },
      }),
      prisma.tweet.create({
        data: {
          url: 'https://x.com/layeredge_fan/status/456789123',
          content: 'The LayerEdge community is growing fast! Proud to be part of this innovative project.',
          userId: '3',
          likes: 56,
          retweets: 18,
          replies: 12,
          basePoints: 5,
          bonusPoints: 135,
          totalPoints: 140,
          isVerified: true,
        },
      }),
    ])

    // Create points history
    await Promise.all([
      prisma.pointsHistory.create({
        data: {
          userId: '1',
          tweetId: tweets[0].id,
          pointsAwarded: 89,
          reason: 'Tweet submission and engagement',
        },
      }),
      prisma.pointsHistory.create({
        data: {
          userId: '1',
          tweetId: tweets[1].id,
          pointsAwarded: 44,
          reason: 'Tweet submission and engagement',
        },
      }),
      prisma.pointsHistory.create({
        data: {
          userId: '2',
          tweetId: tweets[2].id,
          pointsAwarded: 188,
          reason: 'Tweet submission and engagement',
        },
      }),
      prisma.pointsHistory.create({
        data: {
          userId: '3',
          tweetId: tweets[3].id,
          pointsAwarded: 140,
          reason: 'Tweet submission and engagement',
        },
      }),
    ])

    console.log('Database seeded successfully!')
    return { users, tweets }
  } catch (error) {
    console.error('Error seeding database:', error)
    throw error
  }
}
