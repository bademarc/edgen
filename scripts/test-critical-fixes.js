/**
 * Critical Fixes Test Script for LayerEdge Platform
 * Tests Redis data integrity, authentication, quest system, and tweet submission
 */

import axios from 'axios'

const BASE_URL = 'http://localhost:3000'

class CriticalFixesTester {
  constructor() {
    this.results = {
      redis: { passed: 0, failed: 0, tests: [] },
      auth: { passed: 0, failed: 0, tests: [] },
      quests: { passed: 0, failed: 0, tests: [] },
      tweets: { passed: 0, failed: 0, tests: [] }
    }
  }

  async runAllTests() {
    console.log('🧪 Starting Critical Fixes Test Suite')
    console.log('='.repeat(50))

    try {
      await this.testRedisDataIntegrity()
      await this.testAuthenticationSystem()
      await this.testQuestSystem()
      await this.testTweetSubmission()
      
      this.printResults()
    } catch (error) {
      console.error('❌ Test suite failed:', error)
    }
  }

  async testRedisDataIntegrity() {
    console.log('\n📊 Testing Redis Data Integrity...')
    
    // Test 1: Leaderboard data serialization
    try {
      const response = await axios.get(`${BASE_URL}/api/leaderboard`)
      if (response.status === 200 && Array.isArray(response.data)) {
        this.recordTest('redis', 'Leaderboard API Response', true, 'Valid array returned')
        
        // Check for corrupted data
        const hasCorruptedData = JSON.stringify(response.data).includes('[object Object]')
        this.recordTest('redis', 'No Corrupted Serialization', !hasCorruptedData, 
          hasCorruptedData ? 'Found [object Object] in response' : 'Clean serialization')
      } else {
        this.recordTest('redis', 'Leaderboard API Response', false, `Invalid response: ${response.status}`)
      }
    } catch (error) {
      this.recordTest('redis', 'Leaderboard API Response', false, error.message)
    }

    // Test 2: Cache health check
    try {
      const response = await axios.get(`${BASE_URL}/api/cache/health`)
      if (response.status === 200) {
        this.recordTest('redis', 'Cache Health Check', true, 'Cache service responding')
      } else {
        this.recordTest('redis', 'Cache Health Check', false, `Status: ${response.status}`)
      }
    } catch (error) {
      this.recordTest('redis', 'Cache Health Check', false, error.message)
    }
  }

  async testAuthenticationSystem() {
    console.log('\n🔐 Testing Authentication System...')
    
    // Test 1: Auth debug endpoint
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/debug`)
      if (response.status === 200) {
        this.recordTest('auth', 'Auth Debug Endpoint', true, 'Debug endpoint accessible')
        
        // Check for session handling
        const hasSupabaseAuth = response.data.supabaseAuth !== undefined
        this.recordTest('auth', 'Supabase Auth Integration', hasSupabaseAuth, 
          hasSupabaseAuth ? 'Supabase auth configured' : 'Supabase auth missing')
      } else {
        this.recordTest('auth', 'Auth Debug Endpoint', false, `Status: ${response.status}`)
      }
    } catch (error) {
      this.recordTest('auth', 'Auth Debug Endpoint', false, error.message)
    }

    // Test 2: Protected endpoint without auth
    try {
      const response = await axios.get(`${BASE_URL}/api/quests`)
      if (response.status === 401) {
        this.recordTest('auth', 'Protected Endpoint Security', true, 'Correctly returns 401 for unauthenticated requests')
      } else {
        this.recordTest('auth', 'Protected Endpoint Security', false, `Expected 401, got ${response.status}`)
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        this.recordTest('auth', 'Protected Endpoint Security', true, 'Correctly returns 401 for unauthenticated requests')
      } else {
        this.recordTest('auth', 'Protected Endpoint Security', false, error.message)
      }
    }
  }

  async testQuestSystem() {
    console.log('\n🎯 Testing Quest System...')
    
    // Test 1: Quest initialization endpoint
    try {
      const response = await axios.post(`${BASE_URL}/api/quests/initialize`, {
        secret: process.env.ADMIN_SECRET || 'layeredge-admin-secret-2024'
      })
      if (response.status === 200) {
        this.recordTest('quests', 'Quest Initialization', true, 'Quests initialized successfully')
      } else {
        this.recordTest('quests', 'Quest Initialization', false, `Status: ${response.status}`)
      }
    } catch (error) {
      this.recordTest('quests', 'Quest Initialization', false, error.message)
    }

    // Test 2: Quest API structure
    try {
      const response = await axios.get(`${BASE_URL}/api/quests`)
      if (error.response && error.response.status === 401) {
        this.recordTest('quests', 'Quest API Structure', true, 'Quest API properly requires authentication')
      } else {
        this.recordTest('quests', 'Quest API Structure', false, 'Quest API should require authentication')
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        this.recordTest('quests', 'Quest API Structure', true, 'Quest API properly requires authentication')
      } else {
        this.recordTest('quests', 'Quest API Structure', false, error.message)
      }
    }
  }

  async testTweetSubmission() {
    console.log('\n🐦 Testing Tweet Submission...')
    
    // Test 1: Tweet submission endpoint structure
    try {
      const response = await axios.post(`${BASE_URL}/api/tweets/submit`, {
        tweetUrl: 'https://x.com/test/status/123456789'
      })
      // Should fail with authentication error
      if (error.response && error.response.status === 401) {
        this.recordTest('tweets', 'Tweet Submission Auth', true, 'Properly requires authentication')
      } else {
        this.recordTest('tweets', 'Tweet Submission Auth', false, 'Should require authentication')
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        this.recordTest('tweets', 'Tweet Submission Auth', true, 'Properly requires authentication')
      } else {
        this.recordTest('tweets', 'Tweet Submission Auth', false, error.message)
      }
    }

    // Test 2: Invalid request handling
    try {
      const response = await axios.post(`${BASE_URL}/api/tweets/submit`, {})
      this.recordTest('tweets', 'Invalid Request Handling', false, 'Should reject empty requests')
    } catch (error) {
      if (error.response && error.response.status === 400) {
        this.recordTest('tweets', 'Invalid Request Handling', true, 'Properly rejects invalid requests')
      } else {
        this.recordTest('tweets', 'Invalid Request Handling', false, error.message)
      }
    }
  }

  recordTest(category, testName, passed, details) {
    const result = { testName, passed, details }
    this.results[category].tests.push(result)
    
    if (passed) {
      this.results[category].passed++
      console.log(`  ✅ ${testName}: ${details}`)
    } else {
      this.results[category].failed++
      console.log(`  ❌ ${testName}: ${details}`)
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(50))
    console.log('📊 TEST RESULTS SUMMARY')
    console.log('='.repeat(50))

    let totalPassed = 0
    let totalFailed = 0

    for (const [category, results] of Object.entries(this.results)) {
      const { passed, failed } = results
      totalPassed += passed
      totalFailed += failed
      
      const status = failed === 0 ? '✅' : '⚠️'
      console.log(`${status} ${category.toUpperCase()}: ${passed} passed, ${failed} failed`)
    }

    console.log('\n' + '-'.repeat(30))
    console.log(`OVERALL: ${totalPassed} passed, ${totalFailed} failed`)
    
    if (totalFailed === 0) {
      console.log('🎉 All critical fixes are working correctly!')
    } else {
      console.log('⚠️ Some issues remain. Check the failed tests above.')
    }
  }
}

// Run the tests
const tester = new CriticalFixesTester()
tester.runAllTests().catch(console.error)
