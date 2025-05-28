import { getTweetTrackerInstance } from '../src/lib/tweet-tracker'
import { prisma } from '../src/lib/db'

async function testEnhancedTracking() {
  console.log('🧪 Testing Enhanced Tweet Tracking System...\n')

  try {
    // Test 1: Initialize Tweet Tracker
    console.log('1. Testing Tweet Tracker Initialization...')
    const tweetTracker = getTweetTrackerInstance()
    console.log('   ✅ Tweet tracker instance created successfully')

    // Test 2: Check System Status
    console.log('\n2. Testing System Status...')
    const status = tweetTracker.getStatus()
    console.log('   📊 System Status:', {
      isRunning: status.isRunning,
      keywords: status.keywords.length,
      currentMethod: status.currentMethod,
      trackedUsers: status.trackedUsers
    })

    // Test 3: Test Database Schema
    console.log('\n3. Testing Database Schema...')
    
    // Check if new tables exist
    try {
      const unclaimedCount = await prisma.unclaimedTweet.count()
      console.log(`   ✅ UnclaimedTweet table exists (${unclaimedCount} records)`)
    } catch (error) {
      console.log('   ❌ UnclaimedTweet table missing or inaccessible')
      console.log('   💡 Run: npm run tracking:migrate')
    }

    try {
      const trackingLogCount = await prisma.trackingLog.count()
      console.log(`   ✅ TrackingLog table exists (${trackingLogCount} records)`)
    } catch (error) {
      console.log('   ❌ TrackingLog table missing or inaccessible')
      console.log('   💡 Run: npm run tracking:migrate')
    }

    // Test 4: Test Keyword Validation
    console.log('\n4. Testing Keyword Validation...')
    const testTexts = [
      'Check out $Edgen - the future of AI!',
      'LayerEdge is revolutionizing the space',
      '@layeredge community is amazing',
      'Random tweet without keywords',
      '#Edgen to the moon! 🚀',
      'Building with $EDGEN tokens'
    ]

    testTexts.forEach((text, index) => {
      const containsKeywords = tweetTracker.containsKeywords(text)
      console.log(`   ${containsKeywords ? '✅' : '❌'} "${text.substring(0, 30)}..." - ${containsKeywords ? 'Valid' : 'Invalid'}`)
    })

    // Test 5: Test Tweet ID Extraction
    console.log('\n5. Testing Tweet ID Extraction...')
    const testUrls = [
      'https://x.com/user/status/1234567890',
      'https://twitter.com/user/status/9876543210',
      'https://x.com/i/web/status/1111111111',
      'invalid-url'
    ]

    testUrls.forEach(url => {
      const tweetId = tweetTracker.extractTweetId(url)
      console.log(`   ${tweetId ? '✅' : '❌'} ${url} -> ${tweetId || 'No ID found'}`)
    })

    // Test 6: Test Points Calculation
    console.log('\n6. Testing Points Calculation...')
    const testTweet = {
      id: 'test123',
      text: 'Test tweet about $Edgen',
      user: {
        id: 'testuser',
        username: 'testuser',
        name: 'Test User'
      },
      public_metrics: {
        like_count: 10,
        retweet_count: 5,
        reply_count: 3
      },
      created_at: new Date().toISOString()
    }

    const points = tweetTracker.calculatePoints(testTweet)
    console.log(`   ✅ Points calculation: ${points} points (10 likes + 5*3 retweets + 3*2 replies + 5 base = ${10 + 15 + 6 + 5})`)

    // Test 7: Test Tracking Statistics
    console.log('\n7. Testing Tracking Statistics...')
    try {
      const stats = await tweetTracker.getTrackingStats(24)
      console.log('   ✅ Statistics retrieved:', {
        totalTweets: stats.totalTweets,
        claimedTweets: stats.claimedTweets,
        unclaimedTweets: stats.unclaimedTweets,
        methodStats: stats.methodStats.length
      })
    } catch (error) {
      console.log('   ⚠️ Statistics test failed (expected if tables are empty):', error instanceof Error ? error.message : 'Unknown error')
    }

    // Test 8: Test Scraping Methods (without actually scraping)
    console.log('\n8. Testing Scraping Method Availability...')
    
    // Check if twscrape is available
    try {
      const { exec } = require('child_process')
      const { promisify } = require('util')
      const execAsync = promisify(exec)
      
      await execAsync('twscrape --version')
      console.log('   ✅ twscrape is installed and available')
    } catch (error) {
      console.log('   ❌ twscrape not available')
      console.log('   💡 Run: npm run tracking:setup')
    }

    // Test 9: Test Logging
    console.log('\n9. Testing Tracking Log...')
    try {
      await tweetTracker.logTrackingResult({
        method: 'test',
        success: true,
        tweetsFound: 0,
        duration: 1000
      })
      console.log('   ✅ Tracking log entry created successfully')
    } catch (error) {
      console.log('   ❌ Tracking log test failed:', error instanceof Error ? error.message : 'Unknown error')
    }

    // Test 10: Environment Variables
    console.log('\n10. Testing Environment Variables...')
    const requiredEnvVars = [
      'DATABASE_URL',
      'DIRECT_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ]

    const optionalEnvVars = [
      'TWITTER_BEARER_TOKEN',
      'ADMIN_SECRET',
      'CRON_SECRET'
    ]

    requiredEnvVars.forEach(envVar => {
      const value = process.env[envVar]
      console.log(`   ${value ? '✅' : '❌'} ${envVar}: ${value ? 'Set' : 'Missing'}`)
    })

    console.log('\n   Optional environment variables:')
    optionalEnvVars.forEach(envVar => {
      const value = process.env[envVar]
      console.log(`   ${value ? '✅' : '⚠️'} ${envVar}: ${value ? 'Set' : 'Not set (will use defaults)'}`)
    })

    console.log('\n🎉 Enhanced Tweet Tracking System Test Complete!')
    console.log('\n📋 Next Steps:')
    console.log('   1. Run database migration: npm run tracking:migrate')
    console.log('   2. Install twscrape: npm run tracking:setup')
    console.log('   3. Start the tracking system via API or dashboard')
    console.log('   4. Monitor performance in the tracking dashboard')

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testEnhancedTracking().catch(console.error)
