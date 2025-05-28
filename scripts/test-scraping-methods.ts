import { getTweetTrackerInstance } from '../src/lib/tweet-tracker'

async function testScrapingMethods() {
  console.log('🧪 Testing Individual Scraping Methods...\n')

  const tweetTracker = getTweetTrackerInstance()

  try {
    // Test 1: Test twscrape method
    console.log('1. Testing twscrape method...')
    try {
      console.log('   🔍 Running twscrape search (this may take a moment)...')
      const startTime = Date.now()
      const tweets = await tweetTracker.scrapeWithTwscrape()
      const duration = Date.now() - startTime
      
      console.log(`   ✅ twscrape completed in ${duration}ms`)
      console.log(`   📊 Found ${tweets.length} tweets`)
      
      if (tweets.length > 0) {
        console.log('   📝 Sample tweet:', {
          id: tweets[0].id,
          user: tweets[0].user.username,
          text: tweets[0].text.substring(0, 50) + '...',
          metrics: tweets[0].public_metrics
        })
      }
    } catch (error) {
      console.log('   ❌ twscrape failed:', error instanceof Error ? error.message : 'Unknown error')
    }

    // Test 2: Test RSS method
    console.log('\n2. Testing RSS method...')
    try {
      console.log('   🔍 Running RSS search (this may take a moment)...')
      const startTime = Date.now()
      const tweets = await tweetTracker.scrapeWithRSS()
      const duration = Date.now() - startTime
      
      console.log(`   ✅ RSS completed in ${duration}ms`)
      console.log(`   📊 Found ${tweets.length} tweets`)
      
      if (tweets.length > 0) {
        console.log('   📝 Sample tweet:', {
          id: tweets[0].id,
          user: tweets[0].user.username,
          text: tweets[0].text.substring(0, 50) + '...',
          metrics: tweets[0].public_metrics
        })
      }
    } catch (error) {
      console.log('   ❌ RSS failed:', error instanceof Error ? error.message : 'Unknown error')
    }

    // Test 3: Test Nitter method
    console.log('\n3. Testing Nitter method...')
    try {
      console.log('   🔍 Running Nitter search (this may take a moment)...')
      const startTime = Date.now()
      const tweets = await tweetTracker.scrapeWithNitter()
      const duration = Date.now() - startTime
      
      console.log(`   ✅ Nitter completed in ${duration}ms`)
      console.log(`   📊 Found ${tweets ? tweets.length : 0} tweets`)
      
      if (tweets && tweets.length > 0) {
        console.log('   📝 Sample tweet:', {
          id: tweets[0].id,
          user: tweets[0].user.username,
          text: tweets[0].text.substring(0, 50) + '...',
          metrics: tweets[0].public_metrics
        })
      }
    } catch (error) {
      console.log('   ❌ Nitter failed:', error instanceof Error ? error.message : 'Unknown error')
    }

    // Test 4: Test processing tweets (with mock data)
    console.log('\n4. Testing tweet processing...')
    try {
      const mockTweets = [
        {
          id: 'test123456789',
          text: 'This is a test tweet about $Edgen and LayerEdge!',
          user: {
            id: 'testuser123',
            username: 'testuser',
            name: 'Test User'
          },
          public_metrics: {
            like_count: 5,
            retweet_count: 2,
            reply_count: 1
          },
          created_at: new Date().toISOString()
        }
      ]

      console.log('   🔍 Processing mock tweets...')
      const processed = await tweetTracker.processTweets(mockTweets, 'test')
      console.log(`   ✅ Processed ${processed} tweets`)
      
      // Check if the tweet was stored as unclaimed
      const stats = await tweetTracker.getTrackingStats(1)
      console.log('   📊 Updated stats:', {
        totalTweets: stats.totalTweets,
        unclaimedTweets: stats.unclaimedTweets
      })
    } catch (error) {
      console.log('   ❌ Tweet processing failed:', error instanceof Error ? error.message : 'Unknown error')
    }

    // Test 5: Test logging
    console.log('\n5. Testing method logging...')
    try {
      await tweetTracker.logTrackingResult({
        method: 'test-scraping',
        success: true,
        tweetsFound: 1,
        duration: 1000
      })
      console.log('   ✅ Logging works correctly')
    } catch (error) {
      console.log('   ❌ Logging failed:', error instanceof Error ? error.message : 'Unknown error')
    }

    console.log('\n✅ Scraping methods testing completed!')
    console.log('\n📋 Summary:')
    console.log('   - twscrape: Python-based scraping (may need accounts for full functionality)')
    console.log('   - RSS: Nitter RSS feeds (depends on Nitter instance availability)')
    console.log('   - Nitter: Direct Nitter scraping (depends on instance availability)')
    console.log('   - Processing: Converts scraped data to database records')

  } catch (error) {
    console.error('❌ Scraping methods test failed:', error)
  }
}

testScrapingMethods().catch(console.error)
