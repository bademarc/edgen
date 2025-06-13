#!/usr/bin/env tsx

/**
 * Test script for the enhanced fallback monitoring system
 * This script tests both API and web scraping methods for Twitter monitoring
 */

import { TwitterMonitoringService } from '../src/lib/twitter-monitoring'
import { getFallbackService } from '../src/lib/fallback-service'
import { getWebScraperInstance } from '../src/lib/web-scraper'
import { prisma } from '../src/lib/db'

async function testFallbackMonitoring() {
  console.log('🚀 Testing Enhanced Fallback Monitoring System')
  console.log('=' .repeat(50))

  try {
    // Test 1: Initialize services
    console.log('\n📦 Test 1: Service Initialization')
    console.log('-'.repeat(30))

    const monitoringService = new TwitterMonitoringService()
    console.log('✅ TwitterMonitoringService initialized')

    const fallbackService = getFallbackService({
      enableScraping: true,
      preferApi: false, // Force scraping for testing
      apiTimeoutMs: 5000,
      maxApiRetries: 1,
      rateLimitCooldownMs: 60000
    })
    console.log('✅ FallbackService initialized')

    const webScraper = getWebScraperInstance()
    console.log('✅ WebScraperService initialized')

    // Test 2: Check database connectivity
    console.log('\n🗄️ Test 2: Database Connectivity')
    console.log('-'.repeat(30))

    const userCount = await prisma.user.count()
    console.log(`✅ Database connected - ${userCount} users found`)

    // Test 3: Find test users
    console.log('\n👥 Test 3: Finding Test Users')
    console.log('-'.repeat(30))

    const testUsers = await prisma.user.findMany({
      where: {
        autoMonitoringEnabled: true,
        xUsername: {
          not: null
        }
      },
      take: 2,
      select: {
        id: true,
        name: true,
        xUsername: true,
        xUserId: true
      }
    })

    if (testUsers.length === 0) {
      console.log('⚠️ No test users found with Twitter usernames')
      return
    }

    console.log(`✅ Found ${testUsers.length} test users:`)
    testUsers.forEach(user => {
      console.log(`  - ${user.name || 'No name'} (@${user.xUsername})`)
    })

    // Test 4: Test web scraping fallback
    console.log('\n🕷️ Test 4: Web Scraping Fallback')
    console.log('-'.repeat(30))

    const testUser = testUsers[0]
    console.log(`Testing web scraping for @${testUser.xUsername}...`)

    try {
      const scrapedTweets = await monitoringService.searchUserTweetsWithFallback(
        testUser.xUsername!,
        undefined
      )

      console.log(`✅ Web scraping completed`)
      console.log(`📊 Results: ${scrapedTweets.length} tweets found`)

      if (scrapedTweets.length > 0) {
        console.log('📝 Sample tweets:')
        scrapedTweets.slice(0, 3).forEach((tweet, index) => {
          console.log(`  ${index + 1}. ${tweet.content.substring(0, 100)}...`)
          console.log(`     Likes: ${tweet.likes}, Retweets: ${tweet.retweets}, Replies: ${tweet.replies}`)
        })
      }
    } catch (error) {
      console.error('❌ Web scraping test failed:', error)
    }

    // Test 5: Test individual tweet scraping
    console.log('\n🐦 Test 5: Individual Tweet Scraping')
    console.log('-'.repeat(30))

    const testTweetUrl = 'https://x.com/layeredge_fan/status/1234567890'
    console.log(`Testing individual tweet scraping: ${testTweetUrl}`)

    try {
      const tweetData = await fallbackService.getTweetData(testTweetUrl)

      if (tweetData) {
        console.log('✅ Individual tweet scraping successful')
        console.log(`📊 Tweet data:`)
        console.log(`  Content: ${tweetData.content.substring(0, 100)}...`)
        console.log(`  Likes: ${tweetData.likes}, Retweets: ${tweetData.retweets}`)
        console.log(`  Source: ${tweetData.source}`)
      } else {
        console.log('⚠️ No tweet data returned (expected for test URL)')
      }
    } catch (error) {
      console.log('⚠️ Individual tweet test failed (expected for test URL):', error instanceof Error ? error.message : String(error))
    }

    // Test 6: Test monitoring status
    console.log('\n📊 Test 6: Monitoring Status')
    console.log('-'.repeat(30))

    const monitoringStats = await prisma.tweetMonitoring.groupBy({
      by: ['status'],
      _count: { userId: true }
    })

    console.log('✅ Monitoring status breakdown:')
    monitoringStats.forEach(stat => {
      console.log(`  ${stat.status}: ${stat._count.userId} users`)
    })

    // Test 7: Test full monitoring cycle
    console.log('\n🔄 Test 7: Full Monitoring Cycle')
    console.log('-'.repeat(30))

    console.log(`Testing full monitoring cycle for @${testUser.xUsername}...`)

    try {
      const result = await monitoringService.monitorUserTweets(testUser.id)

      console.log('✅ Full monitoring cycle completed')
      console.log(`📊 Results:`)
      console.log(`  Success: ${result.success}`)
      console.log(`  Tweets found: ${result.tweetsFound}`)
      if (result.error) {
        console.log(`  Error: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Full monitoring cycle failed:', error)
    }

    console.log('\n🎉 Fallback Monitoring Test Completed!')
    console.log('=' .repeat(50))

  } catch (error) {
    console.error('💥 Test failed with error:', error)
  } finally {
    // Cleanup
    try {
      const webScraper = getWebScraperInstance()
      await webScraper.close()
      await prisma.$disconnect()
      console.log('🧹 Cleanup completed')
    } catch (error) {
      console.error('⚠️ Cleanup error:', error)
    }
  }
}

// Run the test
testFallbackMonitoring()
  .then(() => {
    console.log('✅ Test script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error)
    process.exit(1)
  })

export { testFallbackMonitoring }
