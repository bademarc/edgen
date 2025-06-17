import { PrismaClient } from '@prisma/client'
import { EngagementPointsService } from '../src/lib/engagement-points-service'

const prisma = new PrismaClient()

async function updateEngagement() {
  try {
    console.log('🚀 Starting manual engagement update...')
    
    const engagementService = new EngagementPointsService()
    
    // Get all tweets that need updates
    const tweets = await prisma.tweet.findMany({
      where: {
        OR: [
          { lastEngagementUpdate: null },
          { 
            lastEngagementUpdate: {
              lt: new Date(Date.now() - 60 * 60 * 1000) // Older than 1 hour
            }
          }
        ]
      },
      orderBy: { submittedAt: 'desc' },
      take: 10 // Process 10 tweets for testing
    })

    console.log(`📊 Found ${tweets.length} tweets to update`)

    if (tweets.length === 0) {
      console.log('✅ All tweets are up to date')
      return
    }

    let updated = 0
    let totalPointsAwarded = 0

    for (const tweet of tweets) {
      console.log(`\n🔄 Processing tweet ${tweet.id} (${tweet.url})`)
      
      try {
        const result = await engagementService.updateTweetEngagement(tweet.url)
        
        if (result.success) {
          console.log(`✅ Updated successfully`)
          if (result.pointsAwarded && result.pointsAwarded > 0) {
            updated++
            totalPointsAwarded += result.pointsAwarded
            console.log(`💰 Points awarded: ${result.pointsAwarded}`)
          } else {
            console.log(`📊 No new points (engagement unchanged)`)
          }
        } else {
          console.log(`❌ Update failed: ${result.error}`)
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`❌ Error processing tweet ${tweet.id}:`, error)
      }
    }

    console.log(`\n🎉 Update complete!`)
    console.log(`📈 ${updated} tweets updated with new engagement`)
    console.log(`💰 ${totalPointsAwarded} total points awarded`)

    // Show updated stats
    const updatedTweets = await prisma.tweet.findMany({
      where: {
        id: { in: tweets.map(t => t.id) }
      },
      include: {
        user: { select: { xUsername: true, name: true } }
      }
    })

    console.log(`\n📊 Updated tweet stats:`)
    updatedTweets.forEach(tweet => {
      console.log(`- ${tweet.user?.xUsername || 'Unknown'}: ${tweet.likes}L ${tweet.retweets}R ${tweet.replies}C (${tweet.totalPoints}pts)`)
    })

  } catch (error) {
    console.error('❌ Engagement update failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateEngagement()
