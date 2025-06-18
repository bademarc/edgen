/**
 * LayerEdge Engagement Fix Testing Script
 *
 * Purpose: Tests the engagement tracking system with real database data
 * Usage: node scripts/test-engagement-fix.cjs
 *
 * This script:
 * - Identifies tweets with zero engagement
 * - Simulates engagement updates and point calculations
 * - Tests database operations for engagement tracking
 * - Validates Twitter API connectivity
 * - Provides engagement statistics
 *
 * Use for testing engagement system functionality in production.
 */

const { config } = require('dotenv')
const { PrismaClient } = require('@prisma/client')

// Load environment variables
config()

const prisma = new PrismaClient()

async function testEngagementFix() {
  console.log('🚀 Testing Engagement Fix')
  console.log('==========================')
  
  try {
    // 1. Check current tweets with 0 engagement
    console.log('\n📊 Checking tweets with zero engagement...')
    const zeroEngagementTweets = await prisma.tweet.findMany({
      where: {
        AND: [
          { likes: 0 },
          { retweets: 0 },
          { replies: 0 }
        ]
      },
      take: 5,
      select: {
        id: true,
        url: true,
        content: true,
        totalPoints: true,
        user: {
          select: {
            xUsername: true,
            totalPoints: true
          }
        }
      }
    })

    console.log(`Found ${zeroEngagementTweets.length} tweets with zero engagement:`)
    zeroEngagementTweets.forEach((tweet, index) => {
      console.log(`${index + 1}. ${tweet.user.xUsername}: ${tweet.totalPoints} points`)
      console.log(`   URL: ${tweet.url}`)
      console.log(`   Content: ${tweet.content?.substring(0, 80)}...`)
    })

    // 2. Test manual engagement update
    if (zeroEngagementTweets.length > 0) {
      const testTweet = zeroEngagementTweets[0]
      console.log(`\n🔧 Testing manual engagement update for tweet: ${testTweet.id}`)
      
      // Simulate some engagement
      const testEngagement = {
        likes: 5,
        retweets: 2,
        replies: 1
      }

      console.log('Simulated engagement:', testEngagement)
      
      // Calculate expected points
      const expectedPoints = (testEngagement.likes * 1) + (testEngagement.retweets * 3) + (testEngagement.replies * 2)
      console.log(`Expected additional points: ${expectedPoints}`)

      // Update the tweet manually (simulating what the service would do)
      const oldUserPoints = testTweet.user.totalPoints
      
      await prisma.tweet.update({
        where: { id: testTweet.id },
        data: {
          likes: testEngagement.likes,
          retweets: testEngagement.retweets,
          replies: testEngagement.replies,
          totalPoints: 5 + expectedPoints, // 5 base points + engagement points
          bonusPoints: expectedPoints,
          lastEngagementUpdate: new Date(),
          engagementUpdateCount: { increment: 1 }
        }
      })

      await prisma.user.update({
        where: { id: testTweet.user.id },
        data: {
          totalPoints: { increment: expectedPoints }
        }
      })

      console.log('✅ Manual update completed')
      
      // Verify the update
      const updatedTweet = await prisma.tweet.findUnique({
        where: { id: testTweet.id },
        include: { user: true }
      })

      console.log('\n📈 Results:')
      console.log(`Tweet points: ${testTweet.totalPoints} → ${updatedTweet.totalPoints}`)
      console.log(`User points: ${oldUserPoints} → ${updatedTweet.user.totalPoints}`)
      console.log(`Engagement: ${testEngagement.likes} likes, ${testEngagement.retweets} retweets, ${testEngagement.replies} replies`)
    }

    // 3. Check overall statistics
    console.log('\n📊 Overall Statistics:')
    
    const totalTweets = await prisma.tweet.count()
    const tweetsWithEngagement = await prisma.tweet.count({
      where: {
        OR: [
          { likes: { gt: 0 } },
          { retweets: { gt: 0 } },
          { replies: { gt: 0 } }
        ]
      }
    })
    
    const tweetsWithoutEngagement = totalTweets - tweetsWithEngagement
    const engagementPercentage = totalTweets > 0 ? ((tweetsWithEngagement / totalTweets) * 100).toFixed(1) : 0

    console.log(`Total tweets: ${totalTweets}`)
    console.log(`Tweets with engagement: ${tweetsWithEngagement} (${engagementPercentage}%)`)
    console.log(`Tweets without engagement: ${tweetsWithoutEngagement}`)

    // 4. Check recent engagement updates
    const recentUpdates = await prisma.tweet.count({
      where: {
        lastEngagementUpdate: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })

    console.log(`Tweets updated in last 24h: ${recentUpdates}`)

    // 5. Test API availability
    console.log('\n🔍 Testing API Status:')
    
    const bearerToken = process.env.TWITTER_BEARER_TOKEN
    if (bearerToken) {
      console.log('✅ Twitter Bearer Token configured')
      console.log(`Token length: ${bearerToken.length} characters`)
      
      // Test a simple API call
      try {
        const response = await fetch('https://api.twitter.com/2/tweets/20?tweet.fields=public_metrics', {
          headers: {
            'Authorization': `Bearer ${bearerToken}`
          }
        })
        
        if (response.status === 429) {
          console.log('🚫 Twitter API is currently rate limited')
        } else if (response.ok) {
          console.log('✅ Twitter API is accessible')
          const data = await response.json()
          if (data.data?.public_metrics) {
            console.log('✅ Engagement metrics available via API')
          }
        } else {
          console.log(`⚠️ Twitter API returned status: ${response.status}`)
        }
      } catch (error) {
        console.log('❌ Twitter API test failed:', error.message)
      }
    } else {
      console.log('❌ Twitter Bearer Token not configured')
    }

    console.log('\n✅ Engagement fix test completed')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testEngagementFix()
