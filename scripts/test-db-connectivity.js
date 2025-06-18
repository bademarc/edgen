import { PrismaClient } from '@prisma/client'

async function testDatabaseConnectivity() {
  console.log('🔍 Testing database connectivity...')
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: ['error', 'warn'],
  })

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...')
    await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Basic connection successful')

    // Test 2: Count users
    console.log('2️⃣ Testing user count...')
    const userCount = await prisma.user.count()
    console.log(`✅ Total users: ${userCount}`)

    // Test 3: Count tweets
    console.log('3️⃣ Testing tweet count...')
    const tweetCount = await prisma.tweet.count()
    console.log(`✅ Total tweets: ${tweetCount}`)

    // Test 4: Count users with points
    console.log('4️⃣ Testing users with points...')
    const usersWithPoints = await prisma.user.count({
      where: { totalPoints: { gt: 0 } }
    })
    console.log(`✅ Users with points: ${usersWithPoints}`)

    // Test 5: Get top 5 users
    console.log('5️⃣ Testing top users query...')
    const topUsers = await prisma.user.findMany({
      where: { totalPoints: { gt: 0 } },
      select: {
        id: true,
        name: true,
        xUsername: true,
        totalPoints: true,
        _count: {
          select: { tweets: true }
        }
      },
      orderBy: { totalPoints: 'desc' },
      take: 5
    })
    console.log(`✅ Top users found: ${topUsers.length}`)
    topUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name || user.xUsername} - ${user.totalPoints} points (${user._count.tweets} tweets)`)
    })

    // Test 6: Aggregate total points
    console.log('6️⃣ Testing points aggregation...')
    const totalPointsAgg = await prisma.user.aggregate({
      _sum: { totalPoints: true }
    })
    console.log(`✅ Total points across all users: ${totalPointsAgg._sum.totalPoints || 0}`)

    // Test 7: Recent tweets
    console.log('7️⃣ Testing recent tweets...')
    const recentTweets = await prisma.tweet.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        url: true,
        totalPoints: true,
        user: {
          select: { name: true, xUsername: true }
        }
      }
    })
    console.log(`✅ Recent tweets found: ${recentTweets.length}`)
    recentTweets.forEach((tweet, index) => {
      console.log(`   ${index + 1}. ${tweet.user.name || tweet.user.xUsername} - ${tweet.totalPoints} points`)
    })

    console.log('\n🎉 All database tests passed successfully!')
    
    return {
      success: true,
      userCount,
      tweetCount,
      usersWithPoints,
      topUsers,
      totalPoints: totalPointsAgg._sum.totalPoints || 0,
      recentTweets
    }

  } catch (error) {
    console.error('❌ Database test failed:', error)
    return {
      success: false,
      error: error.message
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testDatabaseConnectivity()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Database connectivity test completed successfully')
      process.exit(0)
    } else {
      console.log('\n❌ Database connectivity test failed')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error)
    process.exit(1)
  })
