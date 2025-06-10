import { config } from 'dotenv'
import https from 'https'

// Load environment variables
config({ path: '.env.local' })

interface TwitterApiTest {
  name: string
  endpoint: string
  method: string
  headers: Record<string, string>
  expectedStatus: number[]
  description: string
}

interface TestResult {
  test: string
  success: boolean
  status?: number
  data?: any
  error?: string
  rateLimitInfo?: {
    limit?: string
    remaining?: string
    reset?: string
  }
}

class TwitterApiDiagnostics {
  private bearerToken: string
  private clientId: string
  private clientSecret: string
  private results: TestResult[] = []

  constructor() {
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN || ''
    this.clientId = process.env.TWITTER_CLIENT_ID || ''
    this.clientSecret = process.env.TWITTER_CLIENT_SECRET || ''
  }

  async runDiagnostics(): Promise<void> {
    console.log('🔍 Starting Twitter API Diagnostics for LayerEdge Platform\n')
    
    // Check environment variables
    this.checkEnvironmentVariables()
    
    // Test API endpoints
    await this.testApiEndpoints()
    
    // Generate report
    this.generateReport()
  }

  private checkEnvironmentVariables(): void {
    console.log('📋 Checking Environment Variables...')
    
    const checks = [
      { name: 'TWITTER_BEARER_TOKEN', value: this.bearerToken, required: true },
      { name: 'TWITTER_CLIENT_ID', value: this.clientId, required: true },
      { name: 'TWITTER_CLIENT_SECRET', value: this.clientSecret, required: true }
    ]

    checks.forEach(check => {
      if (!check.value) {
        console.log(`   ❌ ${check.name}: Missing`)
        this.results.push({
          test: `Environment: ${check.name}`,
          success: false,
          error: 'Missing environment variable'
        })
      } else {
        console.log(`   ✅ ${check.name}: Present (${check.value.length} chars)`)
        console.log(`      Preview: ${check.value.substring(0, 20)}...`)
        this.results.push({
          test: `Environment: ${check.name}`,
          success: true
        })
      }
    })
  }

  private async testApiEndpoints(): Promise<void> {
    console.log('\n🧪 Testing Twitter API Endpoints...\n')

    const tests: TwitterApiTest[] = [
      {
        name: 'Bearer Token Validation',
        endpoint: 'https://api.twitter.com/2/tweets/search/recent?query=hello&max_results=10',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json'
        },
        expectedStatus: [200, 429], // 429 is rate limit, which means auth works
        description: 'Test if Bearer Token is valid for API v2'
      },
      {
        name: 'LayerEdge Mention Search',
        endpoint: 'https://api.twitter.com/2/tweets/search/recent?query=@layeredge OR $EDGEN&max_results=10&tweet.fields=public_metrics,created_at&user.fields=username,name&expansions=author_id',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json'
        },
        expectedStatus: [200, 429],
        description: 'Search for LayerEdge mentions'
      },
      {
        name: 'User Lookup Test',
        endpoint: 'https://api.twitter.com/2/users/by/username/layeredge?user.fields=public_metrics,verified',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json'
        },
        expectedStatus: [200, 404, 429],
        description: 'Test user lookup functionality'
      },
      {
        name: 'Rate Limit Status',
        endpoint: 'https://api.twitter.com/1.1/application/rate_limit_status.json',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json'
        },
        expectedStatus: [200, 429],
        description: 'Check current rate limit status'
      }
    ]

    for (const test of tests) {
      await this.runApiTest(test)
      // Add delay between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  private async runApiTest(test: TwitterApiTest): Promise<void> {
    console.log(`🔬 Testing: ${test.name}`)
    console.log(`   Endpoint: ${test.endpoint}`)
    
    try {
      const result = await this.makeHttpRequest(test.endpoint, test.method, test.headers)
      
      const isSuccess = test.expectedStatus.includes(result.status)
      
      console.log(`   Status: ${result.status} ${isSuccess ? '✅' : '❌'}`)
      
      if (result.rateLimitInfo) {
        console.log(`   Rate Limit: ${result.rateLimitInfo.remaining}/${result.rateLimitInfo.limit} remaining`)
        console.log(`   Reset Time: ${result.rateLimitInfo.reset}`)
      }

      if (result.data && typeof result.data === 'object') {
        if (result.data.data) {
          console.log(`   Results: ${Array.isArray(result.data.data) ? result.data.data.length : 1} items`)
        }
        if (result.data.errors) {
          console.log(`   Errors: ${JSON.stringify(result.data.errors)}`)
        }
      }

      this.results.push({
        test: test.name,
        success: isSuccess,
        status: result.status,
        data: result.data,
        rateLimitInfo: result.rateLimitInfo,
        error: !isSuccess ? `Unexpected status ${result.status}` : undefined
      })

    } catch (error) {
      console.log(`   ❌ Error: ${error}`)
      this.results.push({
        test: test.name,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })
    }
    
    console.log('')
  }

  private makeHttpRequest(url: string, method: string, headers: Record<string, string>): Promise<{
    status: number
    data: any
    rateLimitInfo?: {
      limit?: string
      remaining?: string
      reset?: string
    }
  }> {
    return new Promise((resolve, reject) => {
      const req = https.request(url, { method, headers }, (res) => {
        let data = ''
        
        res.on('data', (chunk) => {
          data += chunk
        })
        
        res.on('end', () => {
          try {
            const parsedData = data ? JSON.parse(data) : null
            resolve({
              status: res.statusCode || 0,
              data: parsedData,
              rateLimitInfo: {
                limit: res.headers['x-rate-limit-limit'] as string,
                remaining: res.headers['x-rate-limit-remaining'] as string,
                reset: res.headers['x-rate-limit-reset'] as string
              }
            })
          } catch (parseError) {
            resolve({
              status: res.statusCode || 0,
              data: data
            })
          }
        })
      })

      req.on('error', (error) => {
        reject(error)
      })

      req.setTimeout(15000, () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })

      req.end()
    })
  }

  private generateReport(): void {
    console.log('\n📊 TWITTER API DIAGNOSTICS REPORT')
    console.log('==================================\n')

    const successful = this.results.filter(r => r.success).length
    const total = this.results.length

    console.log(`Overall Status: ${successful}/${total} tests passed\n`)

    // Group results by category
    const envResults = this.results.filter(r => r.test.startsWith('Environment:'))
    const apiResults = this.results.filter(r => !r.test.startsWith('Environment:'))

    console.log('🔧 Environment Variables:')
    envResults.forEach(result => {
      console.log(`   ${result.success ? '✅' : '❌'} ${result.test}`)
      if (result.error) console.log(`      Error: ${result.error}`)
    })

    console.log('\n🌐 API Endpoint Tests:')
    apiResults.forEach(result => {
      console.log(`   ${result.success ? '✅' : '❌'} ${result.test}`)
      if (result.status) console.log(`      Status: ${result.status}`)
      if (result.error) console.log(`      Error: ${result.error}`)
      if (result.rateLimitInfo?.remaining) {
        console.log(`      Rate Limit: ${result.rateLimitInfo.remaining}/${result.rateLimitInfo.limit}`)
      }
    })

    // Provide recommendations
    console.log('\n💡 RECOMMENDATIONS:')
    console.log('===================')

    const failedTests = this.results.filter(r => !r.success)
    
    if (failedTests.length === 0) {
      console.log('✅ All tests passed! Twitter API integration is working correctly.')
    } else {
      failedTests.forEach(test => {
        if (test.test.includes('BEARER_TOKEN')) {
          console.log('• Check Twitter Developer Portal for correct Bearer Token')
          console.log('• Ensure the app has proper permissions for tweet search')
        }
        if (test.status === 401) {
          console.log('• Authentication failed - verify API credentials')
        }
        if (test.status === 403) {
          console.log('• Access forbidden - check app permissions and Twitter Developer account status')
        }
        if (test.status === 429) {
          console.log('• Rate limit exceeded - implement proper rate limiting')
        }
      })
    }

    console.log('\n🔄 Next Steps:')
    if (successful === total) {
      console.log('1. Test tweet submission functionality')
      console.log('2. Verify automated mention tracking')
      console.log('3. Check engagement metrics updates')
    } else {
      console.log('1. Fix failed API credential issues')
      console.log('2. Re-run diagnostics to verify fixes')
      console.log('3. Test platform functionality once APIs are working')
    }
  }
}

// Run diagnostics
async function runDiagnostics() {
  const diagnostics = new TwitterApiDiagnostics()
  await diagnostics.runDiagnostics()
}

runDiagnostics()
  .then(() => {
    console.log('\n🎉 Twitter API diagnostics completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Diagnostics failed:', error)
    process.exit(1)
  })
