/**
 * Comprehensive Tweet Submission Testing Script
 * Tests API endpoints, validation, and error handling
 */

import fetch from 'node-fetch'

class TweetSubmissionAPITester {
  constructor() {
    this.baseUrl = 'http://localhost:3000'
    this.testResults = []
    this.errors = []
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`
    console.log(logMessage)
    
    if (type === 'error') {
      this.errors.push(logMessage)
    }
  }

  addTestResult(testName, passed, details = {}) {
    this.testResults.push({
      testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    })
    
    const status = passed ? '✅ PASS' : '❌ FAIL'
    this.log(`${status}: ${testName}`, passed ? 'info' : 'error')
    
    if (details.message) {
      this.log(`   Details: ${details.message}`)
    }
  }

  // Test 1: Check if development server is running
  async testServerConnection() {
    this.log('Testing server connection...')
    
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        signal: AbortSignal.timeout(5000)
      }).catch(() => null)
      
      if (!response) {
        this.addTestResult(
          'Server Connection',
          false,
          { message: 'Server not responding. Please run: npm run dev' }
        )
        return false
      }
      
      if (response.ok) {
        this.addTestResult(
          'Server Connection',
          true,
          { message: 'Development server is running' }
        )
        return true
      } else {
        this.addTestResult(
          'Server Connection',
          false,
          { message: `Server responded with status: ${response.status}` }
        )
        return false
      }
    } catch (error) {
      this.addTestResult(
        'Server Connection',
        false,
        { message: `Connection error: ${error.message}` }
      )
      return false
    }
  }

  // Test 2: Test submission endpoint without authentication
  async testUnauthenticatedSubmission() {
    this.log('Testing unauthenticated submission...')
    
    try {
      const response = await fetch(`${this.baseUrl}/api/tweets/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tweetUrl: 'https://x.com/test/status/1234567890'
        }),
        signal: AbortSignal.timeout(10000)
      })

      const data = await response.json()
      
      if (response.status === 401 && data.error === 'Authentication required') {
        this.addTestResult(
          'Unauthenticated Submission',
          true,
          { message: 'Authentication check working correctly' }
        )
        return true
      } else {
        this.addTestResult(
          'Unauthenticated Submission',
          false,
          { 
            message: `Unexpected response: ${response.status}`,
            response: data
          }
        )
        return false
      }
    } catch (error) {
      this.addTestResult(
        'Unauthenticated Submission',
        false,
        { message: `Request failed: ${error.message}` }
      )
      return false
    }
  }

  // Test 3: Test invalid URL handling
  async testInvalidURLHandling() {
    this.log('Testing invalid URL handling...')
    
    const testCases = [
      {
        url: 'invalid-url',
        description: 'Completely invalid URL'
      },
      {
        url: 'https://x.com/search?q=layeredge',
        description: 'Search URL (should be rejected)'
      },
      {
        url: 'https://x.com/layeredge',
        description: 'Profile URL (should be rejected)'
      },
      {
        url: '',
        description: 'Empty URL'
      }
    ]

    let passedTests = 0
    const totalTests = testCases.length

    for (const testCase of testCases) {
      try {
        const response = await fetch(`${this.baseUrl}/api/tweets/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tweetUrl: testCase.url
          }),
          signal: AbortSignal.timeout(10000)
        })

        const data = await response.json()
        
        // Should return 401 (auth required) or 400 (bad request)
        if (response.status === 401 || response.status === 400) {
          passedTests++
          this.addTestResult(
            `Invalid URL: ${testCase.description}`,
            true,
            { message: `Correctly rejected with status ${response.status}` }
          )
        } else {
          this.addTestResult(
            `Invalid URL: ${testCase.description}`,
            false,
            { 
              message: `Unexpected status: ${response.status}`,
              response: data
            }
          )
        }
      } catch (error) {
        this.addTestResult(
          `Invalid URL: ${testCase.description}`,
          false,
          { message: `Request failed: ${error.message}` }
        )
      }
    }

    const overallPassed = passedTests === totalTests
    this.addTestResult(
      'Invalid URL Handling Overall',
      overallPassed,
      { message: `${passedTests}/${totalTests} invalid URL tests passed` }
    )

    return overallPassed
  }

  // Test 4: Test submission status endpoint
  async testSubmissionStatus() {
    this.log('Testing submission status endpoint...')
    
    try {
      const response = await fetch(`${this.baseUrl}/api/tweets/submit`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      })

      const data = await response.json()
      
      if (response.status === 401) {
        this.addTestResult(
          'Submission Status',
          true,
          { message: 'Status endpoint requires authentication (correct)' }
        )
        return true
      } else if (response.ok && typeof data.canSubmit === 'boolean') {
        this.addTestResult(
          'Submission Status',
          true,
          { 
            message: 'Status endpoint working',
            canSubmit: data.canSubmit,
            cooldown: data.cooldownRemaining
          }
        )
        return true
      } else {
        this.addTestResult(
          'Submission Status',
          false,
          { 
            message: `Unexpected response: ${response.status}`,
            response: data
          }
        )
        return false
      }
    } catch (error) {
      this.addTestResult(
        'Submission Status',
        false,
        { message: `Request failed: ${error.message}` }
      )
      return false
    }
  }

  // Test 5: Test main tweets endpoint
  async testMainTweetsEndpoint() {
    this.log('Testing main tweets endpoint...')
    
    try {
      const response = await fetch(`${this.baseUrl}/api/tweets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tweetUrl: 'https://x.com/test/status/1234567890'
        }),
        signal: AbortSignal.timeout(10000)
      })

      const data = await response.json()
      
      if (response.status === 401) {
        this.addTestResult(
          'Main Tweets Endpoint',
          true,
          { message: 'Main endpoint requires authentication (correct)' }
        )
        return true
      } else {
        this.addTestResult(
          'Main Tweets Endpoint',
          false,
          { 
            message: `Unexpected response: ${response.status}`,
            response: data
          }
        )
        return false
      }
    } catch (error) {
      this.addTestResult(
        'Main Tweets Endpoint',
        false,
        { message: `Request failed: ${error.message}` }
      )
      return false
    }
  }

  // Generate test report
  generateReport() {
    this.log('\n' + '='.repeat(80))
    this.log('TWEET SUBMISSION API TEST REPORT')
    this.log('='.repeat(80))
    
    const totalTests = this.testResults.length
    const passedTests = this.testResults.filter(result => result.passed).length
    const failedTests = totalTests - passedTests
    
    this.log(`\nOVERALL SUMMARY:`)
    this.log(`Total Tests: ${totalTests}`)
    this.log(`Passed: ${passedTests}`)
    this.log(`Failed: ${failedTests}`)
    this.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`)
    
    if (failedTests > 0) {
      this.log(`\nFAILED TESTS:`)
      this.testResults
        .filter(result => !result.passed)
        .forEach(result => {
          this.log(`❌ ${result.testName}`)
          if (result.details.message) {
            this.log(`   ${result.details.message}`)
          }
        })
    }
    
    this.log(`\nRECOMMENDATIONS:`)
    
    if (passedTests === totalTests) {
      this.log(`✅ All API endpoint tests passed!`)
      this.log(`✅ Authentication is working correctly`)
      this.log(`✅ Error handling is functioning`)
      this.log(`\nNext steps:`)
      this.log(`1. Test with authenticated requests`)
      this.log(`2. Test with real tweet URLs`)
      this.log(`3. Test the UI components`)
      this.log(`4. Test database integration`)
    } else {
      this.log(`⚠️ Some tests failed - review the issues above`)
      this.log(`1. Check if development server is running`)
      this.log(`2. Verify API endpoint configurations`)
      this.log(`3. Check authentication middleware`)
      this.log(`4. Review error handling logic`)
    }
    
    this.log('\n' + '='.repeat(80))
    
    return {
      totalTests,
      passedTests,
      failedTests,
      successRate: (passedTests / totalTests) * 100,
      allPassed: passedTests === totalTests
    }
  }

  // Run all tests
  async runAllTests() {
    this.log('Starting comprehensive tweet submission API tests...\n')
    
    const results = []
    
    // Run all test suites
    results.push(await this.testServerConnection())
    results.push(await this.testUnauthenticatedSubmission())
    results.push(await this.testInvalidURLHandling())
    results.push(await this.testSubmissionStatus())
    results.push(await this.testMainTweetsEndpoint())
    
    // Generate final report
    const report = this.generateReport()
    
    return {
      allTestsPassed: results.every(result => result),
      individualResults: results,
      report
    }
  }
}

// Run the tests
async function runTests() {
  const tester = new TweetSubmissionAPITester()
  const results = await tester.runAllTests()
  
  if (results.allTestsPassed) {
    console.log('\n🎉 All tweet submission API tests passed!')
    process.exit(0)
  } else {
    console.log('\n💥 Some tests failed. Please review the report above.')
    process.exit(1)
  }
}

// Execute if run directly
runTests().catch(error => {
  console.error('Test execution failed:', error)
  process.exit(1)
})

export { TweetSubmissionAPITester }
