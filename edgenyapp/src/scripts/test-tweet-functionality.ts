import { config } from 'dotenv'
import { TwitterApiService } from '../lib/twitter-api'
import { getSimplifiedFallbackService } from '../lib/simplified-fallback-service'
import { validateTweetContent } from '../lib/tweet-utils'

// Load environment variables
config({ path: '.env.local' })

interface TweetTestResult {
  test: string
  success: boolean
  data?: any
  error?: string
  duration?: number
}

class TweetFunctionalityTester {
  private results: TweetTestResult[] = []
  private twitterApi: TwitterApiService | null = null
  private fallbackService: any = null

  constructor() {
    try {
      this.twitterApi = new TwitterApiService()
      console.log('✅ Twitter API service initialized')
    } catch (error) {
      console.warn('⚠️ Twitter API service failed to initialize:', error)
    }

    try {
      this.fallbackService = getSimplifiedFallbackService({
        preferApi: true,
        apiTimeoutMs: 10000
      })
      console.log('✅ Fallback service initialized')
    } catch (error) {
      console.warn('⚠️ Fallback service failed to initialize:', error)
    }
  }

  async runTests(): Promise<void> {
    console.log('🧪 Testing LayerEdge Tweet Functionality\n')

    // Test 1: Tweet content validation
    await this.testTweetContentValidation()

    // Test 2: Twitter API search functionality
    await this.testTwitterApiSearch()

    // Test 3: Engagement metrics fetching
    await this.testEngagementMetrics()

    // Test 4: Tweet data fetching with fallback
    await this.testTweetDataFetching()

    // Test 5: Rate limiting behavior
    await this.testRateLimiting()

    // Generate report
    this.generateReport()
  }

  private async testTweetContentValidation(): Promise<void> {
    console.log('🔍 Testing Tweet Content Validation...')

    const testCases = [
      { content: 'Hello @layeredge community!', expected: true },
      { content: 'Excited about $EDGEN token!', expected: true },
      { content: 'Check out @LayerEdge platform', expected: true },
      { content: 'Love the $edgen ecosystem', expected: true },
      { content: 'Just a regular tweet', expected: false },
      { content: 'Mentioning @other project', expected: false },
      { content: '', expected: false }
    ]

    let passed = 0
    for (const testCase of testCases) {
      const result = validateTweetContent(testCase.content)
      const success = result === testCase.expected
      
      console.log(`   ${success ? '✅' : '❌'} "${testCase.content}" -> ${result} (expected: ${testCase.expected})`)
      
      if (success) passed++
    }

    this.results.push({
      test: 'Tweet Content Validation',
      success: passed === testCases.length,
      data: { passed, total: testCases.length }
    })
  }

  private async testTwitterApiSearch(): Promise<void> {
    console.log('\n🔍 Testing Twitter API Search...')

    if (!this.twitterApi) {
      this.results.push({
        test: 'Twitter API Search',
        success: false,
        error: 'Twitter API not initialized'
      })
      return
    }

    try {
      const startTime = Date.now()
      
      // Search for LayerEdge mentions
      const searchResults = await this.twitterApi.searchTweets('@layeredge OR $EDGEN', {
        max_results: 10,
        tweet_fields: 'public_metrics,created_at,author_id',
        user_fields: 'username,name'
      })

      const duration = Date.now() - startTime

      console.log(`   ✅ Search completed in ${duration}ms`)
      console.log(`   Found ${searchResults?.data?.length || 0} tweets`)

      this.results.push({
        test: 'Twitter API Search',
        success: true,
        data: {
          tweetsFound: searchResults?.data?.length || 0,
          hasUsers: !!searchResults?.includes?.users
        },
        duration
      })

    } catch (error) {
      console.log(`   ❌ Search failed: ${error}`)
      
      this.results.push({
        test: 'Twitter API Search',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  private async testEngagementMetrics(): Promise<void> {
    console.log('\n🔍 Testing Engagement Metrics Fetching...')

    if (!this.fallbackService) {
      this.results.push({
        test: 'Engagement Metrics',
        success: false,
        error: 'Fallback service not initialized'
      })
      return
    }

    // Test with a sample tweet URL (using a known public tweet)
    const testTweetUrl = 'https://x.com/elonmusk/status/1234567890123456789' // Example URL

    try {
      const startTime = Date.now()
      
      const metrics = await this.fallbackService.getEngagementMetrics(testTweetUrl)
      const duration = Date.now() - startTime

      if (metrics) {
        console.log(`   ✅ Metrics fetched in ${duration}ms`)
        console.log(`   Likes: ${metrics.likes}, Retweets: ${metrics.retweets}, Replies: ${metrics.replies}`)
        
        this.results.push({
          test: 'Engagement Metrics',
          success: true,
          data: metrics,
          duration
        })
      } else {
        console.log(`   ⚠️ No metrics returned (may be rate limited or tweet not found)`)
        
        this.results.push({
          test: 'Engagement Metrics',
          success: false,
          error: 'No metrics returned'
        })
      }

    } catch (error) {
      console.log(`   ❌ Metrics fetch failed: ${error}`)
      
      this.results.push({
        test: 'Engagement Metrics',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  private async testTweetDataFetching(): Promise<void> {
    console.log('\n🔍 Testing Tweet Data Fetching with Fallback...')

    if (!this.fallbackService) {
      this.results.push({
        test: 'Tweet Data Fetching',
        success: false,
        error: 'Fallback service not initialized'
      })
      return
    }

    // Test with a sample tweet URL
    const testTweetUrl = 'https://x.com/layeredge/status/1234567890123456789' // Example URL

    try {
      const startTime = Date.now()
      
      const tweetData = await this.fallbackService.getTweetData(testTweetUrl)
      const duration = Date.now() - startTime

      if (tweetData) {
        console.log(`   ✅ Tweet data fetched in ${duration}ms`)
        console.log(`   Author: ${tweetData.author?.username}`)
        console.log(`   Content: ${tweetData.content?.substring(0, 50)}...`)
        
        this.results.push({
          test: 'Tweet Data Fetching',
          success: true,
          data: {
            hasAuthor: !!tweetData.author,
            hasContent: !!tweetData.content,
            hasEngagement: !!(tweetData.likes || tweetData.retweets || tweetData.replies)
          },
          duration
        })
      } else {
        console.log(`   ⚠️ No tweet data returned`)
        
        this.results.push({
          test: 'Tweet Data Fetching',
          success: false,
          error: 'No tweet data returned'
        })
      }

    } catch (error) {
      console.log(`   ❌ Tweet data fetch failed: ${error}`)
      
      this.results.push({
        test: 'Tweet Data Fetching',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  private async testRateLimiting(): Promise<void> {
    console.log('\n🔍 Testing Rate Limiting Behavior...')

    if (!this.twitterApi) {
      this.results.push({
        test: 'Rate Limiting',
        success: false,
        error: 'Twitter API not initialized'
      })
      return
    }

    try {
      // Check if API is healthy and get rate limit info
      const isHealthy = await this.twitterApi.checkApiHealth()
      
      console.log(`   API Health: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`)
      
      // Try to get rate limit status
      const rateLimitUrl = 'https://api.twitter.com/1.1/application/rate_limit_status.json'
      
      const response = await fetch(rateLimitUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const rateLimitData = await response.json()
        const searchLimits = rateLimitData.resources?.search?.['/search/tweets']
        
        console.log(`   ✅ Rate limit check successful`)
        if (searchLimits) {
          console.log(`   Search API: ${searchLimits.remaining}/${searchLimits.limit} remaining`)
          console.log(`   Reset time: ${new Date(searchLimits.reset * 1000).toISOString()}`)
        }
        
        this.results.push({
          test: 'Rate Limiting',
          success: true,
          data: {
            isHealthy,
            searchLimits
          }
        })
      } else {
        console.log(`   ❌ Rate limit check failed: ${response.status}`)
        
        this.results.push({
          test: 'Rate Limiting',
          success: false,
          error: `HTTP ${response.status}`
        })
      }

    } catch (error) {
      console.log(`   ❌ Rate limiting test failed: ${error}`)
      
      this.results.push({
        test: 'Rate Limiting',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  private generateReport(): void {
    console.log('\n📊 TWEET FUNCTIONALITY TEST REPORT')
    console.log('===================================\n')

    const successful = this.results.filter(r => r.success).length
    const total = this.results.length

    console.log(`Overall Status: ${successful}/${total} tests passed\n`)

    this.results.forEach(result => {
      console.log(`${result.success ? '✅' : '❌'} ${result.test}`)
      
      if (result.duration) {
        console.log(`   Duration: ${result.duration}ms`)
      }
      
      if (result.data) {
        console.log(`   Data: ${JSON.stringify(result.data, null, 2)}`)
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
      
      console.log('')
    })

    // Provide specific recommendations
    console.log('💡 RECOMMENDATIONS:')
    console.log('===================')

    const failedTests = this.results.filter(r => !r.success)
    
    if (failedTests.length === 0) {
      console.log('✅ All tests passed! Tweet functionality is working correctly.')
      console.log('• Monitor rate limits to prevent API quota exhaustion')
      console.log('• Consider implementing caching for frequently accessed data')
    } else {
      failedTests.forEach(test => {
        if (test.test === 'Twitter API Search' && test.error?.includes('429')) {
          console.log('• Implement exponential backoff for rate-limited requests')
          console.log('• Consider reducing search frequency')
        }
        if (test.test === 'Engagement Metrics' && test.error) {
          console.log('• Check fallback service configuration')
          console.log('• Verify web scraping capabilities as backup')
        }
        if (test.error?.includes('not initialized')) {
          console.log('• Check environment variables and service initialization')
        }
      })
    }

    console.log('\n🔄 Next Steps:')
    console.log('1. Address any failed tests above')
    console.log('2. Test manual tweet submission through the UI')
    console.log('3. Verify automated mention tracking is working')
    console.log('4. Monitor API usage and rate limits')
  }
}

// Run tests
async function runTweetTests() {
  const tester = new TweetFunctionalityTester()
  await tester.runTests()
}

runTweetTests()
  .then(() => {
    console.log('\n🎉 Tweet functionality tests completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Tests failed:', error)
    process.exit(1)
  })
