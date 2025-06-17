import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function diagnose() {
  try {
    console.log('=== LayerEdge Database Diagnostic ===')
    
    // Check users
    const userCount = await prisma.user.count()
    const usersWithTweets = await prisma.user.count({
      where: { tweets: { some: {} } }
    })
    
    console.log(`Users: ${userCount} total, ${usersWithTweets} with tweets`)
    
    // Check tweets
    const tweetCount = await prisma.tweet.count()
    const tweetsWithEngagement = await prisma.tweet.count({
      where: { 
        OR: [
          { likes: { gt: 0 } },
          { retweets: { gt: 0 } },
          { replies: { gt: 0 } }
        ]
      }
    })
    
    console.log(`Tweets: ${tweetCount} total, ${tweetsWithEngagement} with engagement data`)
    
    // Sample recent tweets
    const recentTweets = await prisma.tweet.findMany({
      take: 5,
      orderBy: { submittedAt: 'desc' },
      include: { user: { select: { name: true, xUsername: true } } }
    })
    
    console.log('\nRecent tweets:')
    recentTweets.forEach(tweet => {
      console.log(`- ${tweet.user?.xUsername || 'Unknown'}: ${tweet.likes}L ${tweet.retweets}R ${tweet.replies}C (${tweet.totalPoints}pts)`)
    })
    
    // Check leaderboard
    const topUsers = await prisma.user.findMany({
      take: 5,
      where: { totalPoints: { gt: 0 } },
      orderBy: { totalPoints: 'desc' },
      select: { 
        name: true, 
        xUsername: true, 
        totalPoints: true, 
        rank: true,
        _count: { select: { tweets: true } } 
      }
    })
    
    console.log('\nTop users:')
    topUsers.forEach((user, i) => {
      console.log(`${i+1}. ${user.xUsername || user.name}: ${user.totalPoints}pts (${user._count.tweets} tweets) - Rank: ${user.rank || 'N/A'}`)
    })
    
    // Check engagement update status
    const tweetsNeedingUpdate = await prisma.tweet.count({
      where: {
        OR: [
          { lastEngagementUpdate: null },
          { 
            lastEngagementUpdate: {
              lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Older than 24 hours
            }
          }
        ]
      }
    })
    
    console.log(`\nTweets needing engagement update: ${tweetsNeedingUpdate}`)
    
  } catch (error) {
    console.error('Diagnostic error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

diagnose()
