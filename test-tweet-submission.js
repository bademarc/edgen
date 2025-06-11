/**
 * Comprehensive Tweet Submission Testing Script
 * Tests all aspects of the tweet submission functionality
 */

import { validateTweetContent, calculatePoints } from './src/lib/utils.js'
import { URLValidator, validateTweetURL } from './src/lib/url-validator.js'

class TweetSubmissionTester {
  constructor() {
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

  // Test 1: URL Validation
  testURLValidation() {
    this.log('Testing URL validation functionality...')
    
    const testCases = [
      {
        url: 'https://x.com/layeredge/status/1234567890',
        expected: true,
        description: 'Valid X.com tweet URL'
      },
      {
        url: 'https://twitter.com/user/status/9876543210',
        expected: true,
        description: 'Valid Twitter.com tweet URL'
      },
      {
        url: 'https://x.com/search?q=layeredge',
        expected: false,
        description: 'Search URL (should be invalid)'
      },
      {
        url: 'https://x.com/layeredge',
        expected: false,
        description: 'Profile URL (should be invalid)'
      },
      {
        url: 'invalid-url',
        expected: false,
        description: 'Completely invalid URL'
      },
      {
        url: '',
        expected: false,
        description: 'Empty URL'
      }
    ]

    let passedTests = 0
    const totalTests = testCases.length

    testCases.forEach((testCase, index) => {
      try {
        const result = validateTweetURL(testCase.url)
        const passed = result.isValid === testCase.expected
        
        if (passed) {
          passedTests++
        }
        
        this.addTestResult(
          `URL Validation ${index + 1}: ${testCase.description}`,
          passed,
          {
            url: testCase.url,
            expected: testCase.expected,
            actual: result.isValid,
            tweetId: result.tweetId,
            error: result.error
          }
        )
      } catch (error) {
        this.addTestResult(
          `URL Validation ${index + 1}: ${testCase.description}`,
          false,
          {
            error: error.message,
            url: testCase.url
          }
        )
      }
    })

    const overallPassed = passedTests === totalTests
    this.addTestResult(
      'URL Validation Overall',
      overallPassed,
      {
        passed: passedTests,
        total: totalTests,
        message: `${passedTests}/${totalTests} URL validation tests passed`
      }
    )

    return overallPassed
  }

  // Test 2: Tweet Content Validation
  testTweetContentValidation() {
    this.log('Testing tweet content validation...')
    
    const testCases = [
      {
        content: 'Check out @layeredge for the latest updates!',
        expected: true,
        description: 'Content with @layeredge mention'
      },
      {
        content: 'Investing in $EDGEN token for the future!',
        expected: true,
        description: 'Content with $EDGEN mention'
      },
      {
        content: 'Both @layeredge and $EDGEN are amazing!',
        expected: true,
        description: 'Content with both mentions'
      },
      {
        content: 'This is just a regular tweet about crypto.',
        expected: false,
        description: 'Content without required mentions'
      },
      {
        content: 'LAYEREDGE is great but no @ symbol',
        expected: false,
        description: 'Content with LayerEdge but no @ symbol'
      },
      {
        content: 'EDGEN token without $ symbol',
        expected: false,
        description: 'Content with EDGEN but no $ symbol'
      },
      {
        content: '',
        expected: false,
        description: 'Empty content'
      }
    ]

    let passedTests = 0
    const totalTests = testCases.length

    testCases.forEach((testCase, index) => {
      try {
        const result = validateTweetContent(testCase.content)
        const passed = result === testCase.expected
        
        if (passed) {
          passedTests++
        }
        
        this.addTestResult(
          `Content Validation ${index + 1}: ${testCase.description}`,
          passed,
          {
            content: testCase.content,
            expected: testCase.expected,
            actual: result
          }
        )
      } catch (error) {
        this.addTestResult(
          `Content Validation ${index + 1}: ${testCase.description}`,
          false,
          {
            error: error.message,
            content: testCase.content
          }
        )
      }
    })

    const overallPassed = passedTests === totalTests
    this.addTestResult(
      'Content Validation Overall',
      overallPassed,
      {
        passed: passedTests,
        total: totalTests,
        message: `${passedTests}/${totalTests} content validation tests passed`
      }
    )

    return overallPassed
  }

  // Test 3: Points Calculation
  testPointsCalculation() {
    this.log('Testing points calculation...')
    
    const testCases = [
      {
        engagement: { likes: 10, retweets: 5, comments: 3 },
        expected: 31, // (10*1) + (5*3) + (3*2) = 10 + 15 + 6 = 31
        description: 'Standard engagement metrics'
      },
      {
        engagement: { likes: 0, retweets: 0, comments: 0 },
        expected: 0,
        description: 'Zero engagement'
      },
      {
        engagement: { likes: 100, retweets: 20, comments: 15 },
        expected: 190, // (100*1) + (20*3) + (15*2) = 100 + 60 + 30 = 190
        description: 'High engagement metrics'
      },
      {
        engagement: { likes: 1, retweets: 1, comments: 1 },
        expected: 6, // (1*1) + (1*3) + (1*2) = 1 + 3 + 2 = 6
        description: 'Minimal engagement'
      }
    ]

    let passedTests = 0
    const totalTests = testCases.length

    testCases.forEach((testCase, index) => {
      try {
        const result = calculatePoints(testCase.engagement)
        const passed = result === testCase.expected
        
        if (passed) {
          passedTests++
        }
        
        this.addTestResult(
          `Points Calculation ${index + 1}: ${testCase.description}`,
          passed,
          {
            engagement: testCase.engagement,
            expected: testCase.expected,
            actual: result,
            formula: 'likes*1 + retweets*3 + comments*2'
          }
        )
      } catch (error) {
        this.addTestResult(
          `Points Calculation ${index + 1}: ${testCase.description}`,
          false,
          {
            error: error.message,
            engagement: testCase.engagement
          }
        )
      }
    })

    const overallPassed = passedTests === totalTests
    this.addTestResult(
      'Points Calculation Overall',
      overallPassed,
      {
        passed: passedTests,
        total: totalTests,
        message: `${passedTests}/${totalTests} points calculation tests passed`
      }
    )

    return overallPassed
  }

  // Test 4: Edge Cases and Error Handling
  testEdgeCases() {
    this.log('Testing edge cases and error handling...')
    
    const testCases = [
      {
        name: 'URL with query parameters',
        test: () => {
          const result = validateTweetURL('https://x.com/user/status/123?ref=source')
          return result.isValid === true && result.tweetId === '123'
        }
      },
      {
        name: 'Case insensitive content validation',
        test: () => {
          return validateTweetContent('Check out @LAYEREDGE!') === true &&
                 validateTweetContent('Buying $edgen tokens') === true
        }
      }
    ]

    let passedTests = 0
    const totalTests = testCases.length

    testCases.forEach((testCase, index) => {
      try {
        const passed = testCase.test()
        
        if (passed) {
          passedTests++
        }
        
        this.addTestResult(
          `Edge Case ${index + 1}: ${testCase.name}`,
          passed
        )
      } catch (error) {
        this.addTestResult(
          `Edge Case ${index + 1}: ${testCase.name}`,
          false,
          {
            error: error.message
          }
        )
      }
    })

    return passedTests === totalTests
  }

  // Run all tests
  async runAllTests() {
    this.log('Starting comprehensive tweet submission functionality tests...\n')
    
    const results = []
    
    // Run all test suites
    results.push(this.testURLValidation())
    results.push(this.testTweetContentValidation())
    results.push(this.testPointsCalculation())
    results.push(this.testEdgeCases())
    
    return results.every(result => result)
  }
}

// Run the tests
async function runTests() {
  const tester = new TweetSubmissionTester()
  const allPassed = await tester.runAllTests()
  
  if (allPassed) {
    console.log('\n🎉 All tweet submission functionality tests passed!')
    process.exit(0)
  } else {
    console.log('\n💥 Some tests failed. Please review the output above.')
    process.exit(1)
  }
}

// Execute if run directly
runTests().catch(error => {
  console.error('Test execution failed:', error)
  process.exit(1)
})

export { TweetSubmissionTester }
