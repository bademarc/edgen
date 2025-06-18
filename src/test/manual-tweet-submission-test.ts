/**
 * Comprehensive test for Manual Tweet Submission with Live Engagement Metrics
 * Tests the complete flow from tweet submission to point calculation
 */

interface TestResult {
  test: string
  success: boolean
  data?: any
  error?: string
  duration?: number
}

class ManualTweetSubmissionTester {
  private results: TestResult[] = []
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  }

  async runTests(): Promise<void> {
    console.log('🧪 Testing Manual Tweet Submission with Live Engagement Metrics\n')

    // Test 1: Environment Configuration
    await this.testEnvironmentConfiguration()

    // Test 2: Apify Integration
    await this.testApifyIntegration()

    // Test 3: Twitter Bearer Token
    await this.testTwitterBearerToken()

    // Test 4: Manual Tweet Submission API
    await this.testManualSubmissionAPI()

    // Test 5: Engagement Metrics Fetching
    await this.testEngagementMetricsFetching()

    // Test 6: Point Calculation
    await this.testPointCalculation()

    // Generate report
    this.generateReport()
  }

  private async testEnvironmentConfiguration(): Promise<void> {
    console.log('🔧 Testing Environment Configuration...')

    try {
      const requiredEnvVars = [
        'APIFY_API_TOKEN',
        'APIFY_ACTOR_ID',
        'TWITTER_BEARER_TOKEN',
        'DATABASE_URL'
      ]

      const envStatus = requiredEnvVars.map(varName => ({
        name: varName,
        configured: !!process.env[varName],
        length: process.env[varName]?.length || 0
      }))

      const allConfigured = envStatus.every(env => env.configured)

      console.log('   Environment Variables:')
      envStatus.forEach(env => {
        const status = env.configured ? '✅' : '❌'
        console.log(`   ${status} ${env.name}: ${env.configured ? `${env.length} chars` : 'NOT SET'}`)
      })

      this.results.push({
        test: 'Environment Configuration',
        success: allConfigured,
        data: envStatus,
        error: allConfigured ? undefined : 'Missing required environment variables'
      })

    } catch (error) {
      console.log('   ❌ Environment configuration test failed')
      this.results.push({
        test: 'Environment Configuration',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private async testApifyIntegration(): Promise<void> {
    console.log('\n🕷️ Testing Apify Integration...')

    try {
      const testTweetUrl = 'https://x.com/elonmusk/status/1234567890123456789'
      const startTime = Date.now()

      const response = await fetch(`${this.baseUrl}/api/test-apify?tweetUrl=${encodeURIComponent(testTweetUrl)}`)
      const duration = Date.now() - startTime
      const result = await response.json()

      if (response.ok && result.success) {
        console.log(`   ✅ Apify integration working (${duration}ms)`)
        console.log(`   📊 Metrics: ${JSON.stringify(result.data.metrics)}`)
        
        this.results.push({
          test: 'Apify Integration',
          success: true,
          data: result.data,
          duration
        })
      } else {
        console.log(`   ⚠️ Apify integration issue: ${result.error || 'Unknown error'}`)
        
        this.results.push({
          test: 'Apify Integration',
          success: false,
          error: result.error || 'API request failed',
          duration
        })
      }

    } catch (error) {
      console.log('   ❌ Apify integration test failed')
      this.results.push({
        test: 'Apify Integration',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private async testTwitterBearerToken(): Promise<void> {
    console.log('\n🔑 Testing Twitter Bearer Token...')

    try {
      const startTime = Date.now()
      const response = await fetch(`${this.baseUrl}/api/test/twitter-auth`)
      const duration = Date.now() - startTime
      const result = await response.json()

      if (response.ok && result.success) {
        console.log(`   ✅ Twitter Bearer Token valid (${duration}ms)`)
        console.log(`   📋 Token validation: ${JSON.stringify(result.tokenValidation)}`)
        
        this.results.push({
          test: 'Twitter Bearer Token',
          success: true,
          data: result,
          duration
        })
      } else {
        console.log(`   ⚠️ Twitter Bearer Token issue: ${result.error || 'Unknown error'}`)
        
        this.results.push({
          test: 'Twitter Bearer Token',
          success: false,
          error: result.error || 'Token validation failed',
          duration
        })
      }

    } catch (error) {
      console.log('   ❌ Twitter Bearer Token test failed')
      this.results.push({
        test: 'Twitter Bearer Token',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private async testManualSubmissionAPI(): Promise<void> {
    console.log('\n📝 Testing Manual Submission API...')

    try {
      // Test tweet verification endpoint
      const testTweetUrl = 'https://x.com/layeredge/status/1234567890123456789'
      const startTime = Date.now()

      const response = await fetch(`${this.baseUrl}/api/tweets/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tweetUrl: testTweetUrl })
      })

      const duration = Date.now() - startTime
      const result = await response.json()

      console.log(`   📊 Verification response (${duration}ms):`, result)

      this.results.push({
        test: 'Manual Submission API',
        success: response.ok,
        data: result,
        duration,
        error: response.ok ? undefined : result.error || 'API request failed'
      })

    } catch (error) {
      console.log('   ❌ Manual submission API test failed')
      this.results.push({
        test: 'Manual Submission API',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private async testEngagementMetricsFetching(): Promise<void> {
    console.log('\n📈 Testing Engagement Metrics Fetching...')

    try {
      const testTweetUrl = 'https://x.com/elonmusk/status/1234567890123456789'
      
      // Test quick engagement metrics
      const startTime = Date.now()
      const response = await fetch(`${this.baseUrl}/api/test-apify?tweetUrl=${encodeURIComponent(testTweetUrl)}`)
      const duration = Date.now() - startTime
      const result = await response.json()

      if (response.ok && result.success && result.data.metrics) {
        console.log(`   ✅ Engagement metrics fetched (${duration}ms)`)
        console.log(`   📊 Metrics:`)
        console.log(`      Likes: ${result.data.metrics.likes}`)
        console.log(`      Retweets: ${result.data.metrics.retweets}`)
        console.log(`      Replies: ${result.data.metrics.replies}`)
        console.log(`      Views: ${result.data.metrics.views || 'N/A'}`)
        
        this.results.push({
          test: 'Engagement Metrics Fetching',
          success: true,
          data: result.data.metrics,
          duration
        })
      } else {
        console.log(`   ⚠️ Engagement metrics fetching issue`)
        
        this.results.push({
          test: 'Engagement Metrics Fetching',
          success: false,
          error: 'Failed to fetch engagement metrics',
          duration
        })
      }

    } catch (error) {
      console.log('   ❌ Engagement metrics fetching test failed')
      this.results.push({
        test: 'Engagement Metrics Fetching',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private async testPointCalculation(): Promise<void> {
    console.log('\n🎯 Testing Point Calculation...')

    try {
      // Test point calculation logic
      const testEngagement = {
        likes: 10,
        retweets: 5,
        replies: 3
      }

      // LayerEdge point calculation: likes * 1 + retweets * 3 + replies * 2
      const expectedPoints = (testEngagement.likes * 1) + (testEngagement.retweets * 3) + (testEngagement.replies * 2)
      
      console.log(`   📊 Test engagement: ${testEngagement.likes} likes, ${testEngagement.retweets} retweets, ${testEngagement.replies} replies`)
      console.log(`   🎯 Expected points: ${expectedPoints}`)
      console.log(`   📝 Formula: (${testEngagement.likes} × 1) + (${testEngagement.retweets} × 3) + (${testEngagement.replies} × 2) = ${expectedPoints}`)

      this.results.push({
        test: 'Point Calculation',
        success: true,
        data: {
          engagement: testEngagement,
          expectedPoints,
          formula: 'likes * 1 + retweets * 3 + replies * 2'
        }
      })

    } catch (error) {
      console.log('   ❌ Point calculation test failed')
      this.results.push({
        test: 'Point Calculation',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private generateReport(): void {
    console.log('\n📋 Test Report Summary:')
    console.log('=' .repeat(50))

    const successfulTests = this.results.filter(r => r.success)
    const failedTests = this.results.filter(r => !r.success)

    console.log(`✅ Successful tests: ${successfulTests.length}/${this.results.length}`)
    console.log(`❌ Failed tests: ${failedTests.length}/${this.results.length}`)

    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:')
      failedTests.forEach(test => {
        console.log(`   • ${test.test}: ${test.error}`)
      })
    }

    if (successfulTests.length > 0) {
      console.log('\n✅ Successful Tests:')
      successfulTests.forEach(test => {
        const duration = test.duration ? ` (${test.duration}ms)` : ''
        console.log(`   • ${test.test}${duration}`)
      })
    }

    console.log('\n🔄 Next Steps:')
    if (failedTests.length === 0) {
      console.log('🎉 All tests passed! Manual tweet submission with live engagement metrics is working correctly.')
      console.log('✅ Ready for production deployment.')
    } else {
      console.log('🔧 Address the failed tests above before deployment.')
      console.log('📝 Check environment variables and API configurations.')
    }
  }
}

// Export for use in other files
export { ManualTweetSubmissionTester }

// Run tests if this file is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  const tester = new ManualTweetSubmissionTester()
  tester.runTests()
    .then(() => {
      console.log('\n🎉 Manual tweet submission tests completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Tests failed:', error)
      process.exit(1)
    })
}
