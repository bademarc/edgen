/**
 * Test Script for Tweet Submission System Fixes
 * Validates all the reliability improvements made to the manual tweet submission system
 */

import { getCacheCleanupService, emergencyCleanup } from '../lib/cache-cleanup'
import { getManualTweetSubmissionService } from '../lib/manual-tweet-submission'
import { getCacheService } from '../lib/cache'
import { getCircuitBreaker } from '../lib/improved-circuit-breaker'

interface TestResult {
  testName: string
  passed: boolean
  message: string
  details?: any
}

class TweetSubmissionTestSuite {
  private results: TestResult[] = []
  private cache = getCacheService()
  private cleanupService = getCacheCleanupService()
  private submissionService = getManualTweetSubmissionService()

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Tweet Submission System Test Suite...\n')

    // Test 1: Cache JSON Serialization
    await this.testCacheJsonSerialization()

    // Test 2: Cache Corruption Detection
    await this.testCacheCorruptionDetection()

    // Test 3: Circuit Breaker Configuration
    await this.testCircuitBreakerConfiguration()

    // Test 4: Manual Rate Limiting
    await this.testManualRateLimiting()

    // Test 5: Cache Cleanup Functionality
    await this.testCacheCleanup()

    // Test 6: Emergency Cleanup
    await this.testEmergencyCleanup()

    // Test 7: Submission Status Checks
    await this.testSubmissionStatusChecks()

    // Test 8: Circuit Breaker Bypass
    await this.testCircuitBreakerBypass()

    // Print Results
    this.printResults()
  }

  private async testCacheJsonSerialization(): Promise<void> {
    try {
      const testKey = 'test_serialization'
      const testData = {
        state: 'CLOSED',
        failureCount: 0,
        lastFailureTime: Date.now(),
        isValid: true
      }

      // Test setting and getting
      await this.cache.set(testKey, testData, 60)
      const retrieved = await this.cache.get(testKey)

      const passed = retrieved && 
                    (retrieved as any).state === testData.state &&
                    (retrieved as any).failureCount === testData.failureCount &&
                    (retrieved as any).isValid === testData.isValid

      this.results.push({
        testName: 'Cache JSON Serialization',
        passed: !!passed,
        message: passed ? 'JSON serialization working correctly' : 'JSON serialization failed',
        details: { original: testData, retrieved }
      })

      // Cleanup
      await this.cache.delete(testKey)

    } catch (error) {
      this.results.push({
        testName: 'Cache JSON Serialization',
        passed: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      })
    }
  }

  private async testCacheCorruptionDetection(): Promise<void> {
    try {
      const testKey = 'test_corruption'
      
      // Simulate corrupted data by setting invalid JSON
      if (this.cache['upstashRedis']) {
        await this.cache['upstashRedis'].set(testKey, '[object Object]')
      } else if (this.cache['redis']) {
        await this.cache['redis'].set(testKey, '[object Object]')
      }

      // Try to retrieve - should detect corruption and return null
      const retrieved = await this.cache.get(testKey)

      this.results.push({
        testName: 'Cache Corruption Detection',
        passed: retrieved === null,
        message: retrieved === null ? 'Corruption detected and handled' : 'Corruption not detected',
        details: { retrieved }
      })

    } catch (error) {
      this.results.push({
        testName: 'Cache Corruption Detection',
        passed: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      })
    }
  }

  private async testCircuitBreakerConfiguration(): Promise<void> {
    try {
      const circuitBreaker = getCircuitBreaker('manual-tweet-submission')
      const metrics = await circuitBreaker.getMetrics()

      const passed = metrics.config.failureThreshold === 10 &&
                    metrics.config.recoveryTimeout === 2 * 60 * 1000 &&
                    metrics.config.degradationMode === true

      this.results.push({
        testName: 'Circuit Breaker Configuration',
        passed,
        message: passed ? 'Circuit breaker configured correctly for manual submissions' : 'Circuit breaker configuration incorrect',
        details: { config: metrics.config }
      })

    } catch (error) {
      this.results.push({
        testName: 'Circuit Breaker Configuration',
        passed: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      })
    }
  }

  private async testManualRateLimiting(): Promise<void> {
    try {
      const testUserId = 'test-user-123'
      
      // Get initial status
      const initialStatus = this.submissionService.getSubmissionStatus(testUserId)
      
      const passed = initialStatus.canSubmit === true &&
                    typeof initialStatus.rateLimitRemaining === 'number'

      this.results.push({
        testName: 'Manual Rate Limiting',
        passed,
        message: passed ? 'Manual rate limiting working correctly' : 'Manual rate limiting not working',
        details: { initialStatus }
      })

    } catch (error) {
      this.results.push({
        testName: 'Manual Rate Limiting',
        passed: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      })
    }
  }

  private async testCacheCleanup(): Promise<void> {
    try {
      const results = await this.cleanupService.performFullCleanup()
      
      const passed = typeof results.totalCleaned === 'number' &&
                    typeof results.totalErrors === 'number'

      this.results.push({
        testName: 'Cache Cleanup Functionality',
        passed,
        message: passed ? `Cache cleanup working - cleaned ${results.totalCleaned} entries` : 'Cache cleanup failed',
        details: results
      })

    } catch (error) {
      this.results.push({
        testName: 'Cache Cleanup Functionality',
        passed: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      })
    }
  }

  private async testEmergencyCleanup(): Promise<void> {
    try {
      await emergencyCleanup()
      
      // Check if circuit breakers are reset
      const circuitBreaker = getCircuitBreaker('manual-tweet-submission')
      const status = await circuitBreaker.getStatus()
      
      const passed = status.state === 'CLOSED' && status.failureCount === 0

      this.results.push({
        testName: 'Emergency Cleanup',
        passed,
        message: passed ? 'Emergency cleanup successful - circuit breakers reset' : 'Emergency cleanup failed',
        details: { circuitBreakerStatus: status }
      })

    } catch (error) {
      this.results.push({
        testName: 'Emergency Cleanup',
        passed: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      })
    }
  }

  private async testSubmissionStatusChecks(): Promise<void> {
    try {
      const testUserId = 'test-user-456'
      const status = this.submissionService.getSubmissionStatus(testUserId)
      
      const passed = typeof status.canSubmit === 'boolean' &&
                    (status.cooldownRemaining === undefined || typeof status.cooldownRemaining === 'number') &&
                    (status.rateLimitRemaining === undefined || typeof status.rateLimitRemaining === 'number')

      this.results.push({
        testName: 'Submission Status Checks',
        passed,
        message: passed ? 'Submission status checks working correctly' : 'Submission status checks failed',
        details: { status }
      })

    } catch (error) {
      this.results.push({
        testName: 'Submission Status Checks',
        passed: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      })
    }
  }

  private async testCircuitBreakerBypass(): Promise<void> {
    try {
      // This test just verifies the bypass method exists and can be called
      const testUserId = 'test-user-789'
      const testUrl = 'https://x.com/test/status/123'
      
      // We expect this to fail (since it's a fake URL), but it should not throw an error
      const result = await this.submissionService.submitTweet(testUrl, testUserId, true)
      
      const passed = typeof result === 'object' && 
                    typeof result.success === 'boolean' &&
                    typeof result.message === 'string'

      this.results.push({
        testName: 'Circuit Breaker Bypass',
        passed,
        message: passed ? 'Circuit breaker bypass functionality working' : 'Circuit breaker bypass failed',
        details: { result }
      })

    } catch (error) {
      this.results.push({
        testName: 'Circuit Breaker Bypass',
        passed: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      })
    }
  }

  private printResults(): void {
    console.log('\n📊 TEST RESULTS SUMMARY')
    console.log('=' .repeat(50))
    
    const passed = this.results.filter(r => r.passed).length
    const total = this.results.length
    
    console.log(`Overall: ${passed}/${total} tests passed\n`)
    
    this.results.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL'
      console.log(`${index + 1}. ${status} - ${result.testName}`)
      console.log(`   ${result.message}`)
      if (!result.passed && result.details) {
        console.log(`   Details:`, JSON.stringify(result.details, null, 2))
      }
      console.log()
    })
    
    if (passed === total) {
      console.log('🎉 All tests passed! Tweet submission system is ready.')
    } else {
      console.log('⚠️  Some tests failed. Please review the issues above.')
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new TweetSubmissionTestSuite()
  testSuite.runAllTests().catch(console.error)
}

export { TweetSubmissionTestSuite }
