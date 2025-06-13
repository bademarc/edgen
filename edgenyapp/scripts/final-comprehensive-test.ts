import { getTweetTrackerInstance } from '../src/lib/tweet-tracker'
import { prisma } from '../src/lib/db'

async function runFinalComprehensiveTest() {
  console.log('🎯 Final Comprehensive Test of Enhanced Tweet Tracking System')
  console.log('=' .repeat(70))
  console.log()

  let passedTests = 0
  let totalTests = 0

  const test = (name: string, condition: boolean, details?: string) => {
    totalTests++
    const status = condition ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} ${name}`)
    if (details) console.log(`     ${details}`)
    if (condition) passedTests++
    return condition
  }

  try {
    // Test 1: Database Schema
    console.log('📊 Testing Database Schema...')

    const userCount = await prisma.user.count()
    test('User table accessible', userCount >= 0, `Found ${userCount} users`)

    const tweetCount = await prisma.tweet.count()
    test('Tweet table accessible', tweetCount >= 0, `Found ${tweetCount} tweets`)

    let unclaimedCount = 0
    try {
      unclaimedCount = await prisma.unclaimedTweet.count()
      test('UnclaimedTweet table exists', true, `Found ${unclaimedCount} unclaimed tweets`)
    } catch (error) {
      test('UnclaimedTweet table exists', false, 'Table not found - run migration')
    }

    let trackingLogCount = 0
    try {
      trackingLogCount = await prisma.trackingLog.count()
      test('TrackingLog table exists', true, `Found ${trackingLogCount} log entries`)
    } catch (error) {
      test('TrackingLog table exists', false, 'Table not found - run migration')
    }

    console.log()

    // Test 2: TweetTracker Initialization
    console.log('🚀 Testing TweetTracker Initialization...')

    const tweetTracker = getTweetTrackerInstance()
    test('TweetTracker instance created', !!tweetTracker)

    const status = tweetTracker.getStatus()
    test('Status retrieval works', !!status)
    test('Keywords configured', status.keywords.length > 0, `${status.keywords.length} keywords`)
    test('Scrapers configured', !!status.currentMethod, `Current: ${status.currentMethod}`)

    console.log()

    // Test 3: Core Functionality
    console.log('⚙️ Testing Core Functionality...')

    // Test keyword validation
    const validTweet = tweetTracker.containsKeywords('Check out $Edgen!')
    test('Keyword validation (valid)', validTweet)

    const invalidTweet = tweetTracker.containsKeywords('Random tweet')
    test('Keyword validation (invalid)', !invalidTweet)

    // Test tweet ID extraction
    const tweetId = tweetTracker.extractTweetId('https://x.com/user/status/1234567890')
    test('Tweet ID extraction', tweetId === '1234567890')

    // Test points calculation
    const mockTweet = {
      id: 'test123',
      text: 'Test tweet about $Edgen',
      user: { id: 'testuser', username: 'testuser', name: 'Test User' },
      public_metrics: { like_count: 10, retweet_count: 5, reply_count: 3 },
      created_at: new Date().toISOString()
    }
    const points = tweetTracker.calculatePoints(mockTweet)
    test('Points calculation', points > 0, `${points} points calculated`)

    console.log()

    // Test 4: Database Operations
    console.log('💾 Testing Database Operations...')

    // Test logging
    try {
      await tweetTracker.logTrackingResult({
        method: 'final-test',
        success: true,
        tweetsFound: 1,
        duration: 1000
      })
      test('Tracking log creation', true)
    } catch (error) {
      test('Tracking log creation', false, error instanceof Error ? error.message : 'Unknown error')
    }

    // Test unclaimed tweet storage
    try {
      await tweetTracker.storeUnclaimedTweet(mockTweet, 'final-test')
      test('Unclaimed tweet storage', true)
    } catch (error) {
      test('Unclaimed tweet storage', false, error instanceof Error ? error.message : 'Unknown error')
    }

    // Test statistics retrieval
    try {
      const stats = await tweetTracker.getTrackingStats(24)
      test('Statistics retrieval', !!stats, `${stats.totalTweets} total, ${stats.unclaimedTweets} unclaimed`)
    } catch (error) {
      test('Statistics retrieval', false, error instanceof Error ? error.message : 'Unknown error')
    }

    console.log()

    // Test 5: External Dependencies
    console.log('🔧 Testing External Dependencies...')

    // Test twscrape availability
    try {
      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)

      await execAsync('twscrape version')
      test('twscrape installed', true)
    } catch (error) {
      test('twscrape installed', false, 'Run: pip install twscrape')
    }

    // Test node-cron availability
    try {
      await import('node-cron')
      test('node-cron installed', true)
    } catch (error) {
      test('node-cron installed', false, 'Run: npm install node-cron')
    }

    console.log()

    // Test 6: Environment Configuration
    console.log('🌍 Testing Environment Configuration...')

    const requiredEnvVars = ['DATABASE_URL', 'DIRECT_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
    requiredEnvVars.forEach(envVar => {
      test(`${envVar} configured`, !!process.env[envVar])
    })

    const optionalEnvVars = ['ADMIN_SECRET', 'CRON_SECRET', 'TWITTER_BEARER_TOKEN']
    optionalEnvVars.forEach(envVar => {
      const isSet = !!process.env[envVar]
      test(`${envVar} configured (optional)`, true, isSet ? 'Set' : 'Using default')
    })

    console.log()

    // Test 7: File Structure
    console.log('📁 Testing File Structure...')

    const fs = await import('fs')
    const path = await import('path')

    const requiredFiles = [
      'src/lib/tweet-tracker.ts',
      'src/components/UnclaimedTweets.tsx',
      'src/components/TrackingDashboard.tsx',
      'src/app/api/tweets/claim/route.ts',
      'src/app/api/tracking/status/route.ts',
      'src/app/api/tracking/discover/route.ts',
      'scripts/test-enhanced-tracking.ts',
      'ENHANCED_TRACKING_SETUP.md'
    ]

    requiredFiles.forEach(file => {
      const exists = fs.existsSync(path.join(process.cwd(), file))
      test(`${file} exists`, exists)
    })

    console.log()

    // Test Summary
    console.log('📋 Test Summary')
    console.log('=' .repeat(70))
    console.log(`Total Tests: ${totalTests}`)
    console.log(`Passed: ${passedTests}`)
    console.log(`Failed: ${totalTests - passedTests}`)
    console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`)
    console.log()

    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! Enhanced Tweet Tracking System is ready!')
      console.log()
      console.log('🚀 Next Steps:')
      console.log('   1. Start the development server: npm run dev')
      console.log('   2. Visit /test-tracking to test the UI components')
      console.log('   3. Monitor the tracking dashboard for real-time data')
      console.log('   4. Check unclaimed tweets for retroactive points')
      console.log()
      console.log('📚 Documentation: See ENHANCED_TRACKING_SETUP.md for detailed setup')
    } else {
      console.log('⚠️ Some tests failed. Please review the issues above.')
      console.log()
      console.log('🔧 Common fixes:')
      console.log('   - Run database migration: npm run tracking:migrate')
      console.log('   - Install dependencies: npm install && pip install twscrape')
      console.log('   - Check environment variables in .env file')
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runFinalComprehensiveTest().catch(console.error)
