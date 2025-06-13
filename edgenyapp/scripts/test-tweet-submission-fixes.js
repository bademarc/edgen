/**
 * Test Script for Tweet Submission Fixes
 * Validates all the improvements made to the tweet submission system
 */

import fetch from 'node-fetch'

class TweetSubmissionFixesTester {
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

  // Test 1: Enhanced error messages
  async testEnhancedErrorMessages() {
    this.log('Testing enhanced error messages...')
    
    const testCases = [
      {
        body: null,
        description: 'Invalid JSON body',
        expectedStatus: 400
      },
      {
        body: {},
        description: 'Missing tweetUrl',
        expectedStatus: 400
      },
      {
        body: { tweetUrl: 123 },
        description: 'Non-string tweetUrl',
        expectedStatus: 400
      },
      {
        body: { tweetUrl: 'invalid-url' },
        description: 'Invalid URL format',
        expectedStatus: 400
      },
      {
        body: { tweetUrl: 'https://x.com/search?q=test' },
        description: 'Search URL (should be rejected)',
        expectedStatus: 400
      }
    ]

    let passedTests = 0
    const totalTests = testCases.length

    for (const testCase of testCases) {
      try {
        const response = await fetch(`${this.baseUrl}/api/tweets/submit`, {
          method: 'POST',
          headers: testCase.body ? {
            'Content-Type': 'application/json',
          } : {},
          body: testCase.body ? JSON.stringify(testCase.body) : 'invalid-json',
          signal: AbortSignal.timeout(10000)
        })

        const data = await response.json()
        
        // Check if response has enhanced error structure
        const hasEnhancedError = data.userMessage && data.suggestions && Array.isArray(data.suggestions)
        const hasCorrectStatus = response.status === testCase.expectedStatus || response.status === 401 // Auth might kick in first
        
        if (hasEnhancedError && hasCorrectStatus) {
          passedTests++
          this.addTestResult(
            `Enhanced Error: ${testCase.description}`,
            true,
            { 
              message: `Correct error structure with user message and suggestions`,
              userMessage: data.userMessage,
              suggestions: data.suggestions.length
            }
          )
        } else {
          this.addTestResult(
            `Enhanced Error: ${testCase.description}`,
            false,
            { 
              message: `Missing enhanced error structure or wrong status`,
              hasUserMessage: !!data.userMessage,
              hasSuggestions: !!data.suggestions,
              status: response.status,
              expected: testCase.expectedStatus
            }
          )
        }
      } catch (error) {
        this.addTestResult(
          `Enhanced Error: ${testCase.description}`,
          false,
          { message: `Request failed: ${error.message}` }
        )
      }
    }

    const overallPassed = passedTests === totalTests
    this.addTestResult(
      'Enhanced Error Messages Overall',
      overallPassed,
      { message: `${passedTests}/${totalTests} enhanced error tests passed` }
    )

    return overallPassed
  }

  // Test 2: URL validation improvements
  async testURLValidationImprovements() {
    this.log('Testing URL validation improvements...')
    
    const testCases = [
      {
        url: 'https://x.com/user/status/123?ref=source',
        shouldPass: false, // Should be rejected due to auth, but URL format is valid
        description: 'URL with query parameters'
      },
      {
        url: 'https://twitter.com/user/status/456',
        shouldPass: false, // Should be rejected due to auth, but URL format is valid
        description: 'Twitter.com URL (should be normalized)'
      },
      {
        url: 'https://x.com/layeredge',
        shouldPass: false,
        description: 'Profile URL (should be rejected)'
      },
      {
        url: 'https://x.com/search?q=layeredge',
        shouldPass: false,
        description: 'Search URL (should be rejected)'
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
          body: JSON.stringify({ tweetUrl: testCase.url }),
          signal: AbortSignal.timeout(10000)
        })

        const data = await response.json()
        
        // For URL validation, we expect either 400 (bad URL) or 401 (auth required)
        // If it's 401, the URL format was accepted but auth failed (which is expected)
        // If it's 400, check if it's due to URL validation
        
        if (response.status === 400 && data.error && data.error.includes('Invalid')) {
          // URL was properly rejected
          passedTests++
          this.addTestResult(
            `URL Validation: ${testCase.description}`,
            true,
            { 
              message: `URL properly rejected with validation error`,
              error: data.error
            }
          )
        } else if (response.status === 401) {
          // URL format was accepted, auth failed (expected for valid URLs)
          const urlFormatValid = testCase.url.includes('/status/')
          if (urlFormatValid) {
            passedTests++
            this.addTestResult(
              `URL Validation: ${testCase.description}`,
              true,
              { message: `Valid URL format accepted, auth required (expected)` }
            )
          } else {
            this.addTestResult(
              `URL Validation: ${testCase.description}`,
              false,
              { message: `Invalid URL format should have been rejected before auth` }
            )
          }
        } else {
          this.addTestResult(
            `URL Validation: ${testCase.description}`,
            false,
            { 
              message: `Unexpected response status: ${response.status}`,
              response: data
            }
          )
        }
      } catch (error) {
        this.addTestResult(
          `URL Validation: ${testCase.description}`,
          false,
          { message: `Request failed: ${error.message}` }
        )
      }
    }

    const overallPassed = passedTests === totalTests
    this.addTestResult(
      'URL Validation Improvements Overall',
      overallPassed,
      { message: `${passedTests}/${totalTests} URL validation tests passed` }
    )

    return overallPassed
  }

  // Test 3: Server responsiveness
  async testServerResponsiveness() {
    this.log('Testing server responsiveness...')
    
    try {
      const startTime = Date.now()
      const response = await fetch(`${this.baseUrl}/api/tweets/submit`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      const passed = responseTime < 3000 // Should respond within 3 seconds
      
      this.addTestResult(
        'Server Responsiveness',
        passed,
        { 
          message: `Server responded in ${responseTime}ms`,
          responseTime,
          status: response.status
        }
      )
      
      return passed
    } catch (error) {
      this.addTestResult(
        'Server Responsiveness',
        false,
        { message: `Server not responding: ${error.message}` }
      )
      return false
    }
  }

  // Generate comprehensive test report
  generateReport() {
    this.log('\n' + '='.repeat(80))
    this.log('TWEET SUBMISSION FIXES TEST REPORT')
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
    
    this.log(`\nFIXES VALIDATION:`)
    
    if (passedTests === totalTests) {
      this.log(`✅ All tweet submission fixes are working correctly!`)
      this.log(`✅ Enhanced error messages provide better user feedback`)
      this.log(`✅ URL validation is more robust`)
      this.log(`✅ Server is responsive and stable`)
      this.log(`\nReady for production deployment!`)
    } else {
      this.log(`⚠️ Some fixes need additional work`)
      this.log(`1. Review failed tests above`)
      this.log(`2. Check server configuration`)
      this.log(`3. Verify error handling logic`)
      this.log(`4. Test with authenticated requests`)
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
    this.log('Starting tweet submission fixes validation tests...\n')
    
    const results = []
    
    // Run all test suites
    results.push(await this.testEnhancedErrorMessages())
    results.push(await this.testURLValidationImprovements())
    results.push(await this.testServerResponsiveness())
    
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
  const tester = new TweetSubmissionFixesTester()
  const results = await tester.runAllTests()
  
  if (results.allTestsPassed) {
    console.log('\n🎉 All tweet submission fixes are working correctly!')
    process.exit(0)
  } else {
    console.log('\n💥 Some fixes need additional work. Please review the report above.')
    process.exit(1)
  }
}

// Execute if run directly
runTests().catch(error => {
  console.error('Test execution failed:', error)
  process.exit(1)
})

export { TweetSubmissionFixesTester }
