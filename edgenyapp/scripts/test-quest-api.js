// Comprehensive Quest API Testing Script
const BASE_URL = 'http://localhost:3000'
const ADMIN_SECRET = 'layeredge-admin-secret-2024'

// Test configuration
const TEST_CONFIG = {
  TIMEOUT_MS: 10000,
  EXPECTED_QUEST_COUNT: 2,
  EXPECTED_POINTS_PER_QUEST: 1000
}

async function makeRequest(url, options = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TEST_CONFIG.TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${TEST_CONFIG.TIMEOUT_MS}ms`)
    }
    throw error
  }
}

async function testServerHealth() {
  console.log('\n🏥 Testing Server Health...')

  try {
    const response = await makeRequest(BASE_URL)
    console.log(`  📡 Server response status: ${response.status}`)

    if (response.status === 200) {
      console.log('  ✅ Server is healthy and responding')
      return true
    } else if (response.status === 500) {
      console.log('  ❌ Server is returning 500 error - compilation issues detected')
      return false
    } else {
      console.log(`  ⚠️  Server returned unexpected status: ${response.status}`)
      return false
    }
  } catch (error) {
    console.log(`  ❌ Server health check failed: ${error.message}`)
    return false
  }
}

async function testQuestInitialization() {
  console.log('\n🔧 Testing Quest Initialization...')

  try {
    const response = await makeRequest(`${BASE_URL}/api/quests/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: ADMIN_SECRET
      })
    })

    console.log(`  🔑 Quest init response status: ${response.status}`)

    if (response.status === 200) {
      const result = await response.json()
      console.log('  ✅ Quest initialization successful')
      console.log(`  📋 Response: ${result.message}`)
      return true
    } else {
      const errorText = await response.text()
      console.log(`  ❌ Quest initialization failed: ${errorText}`)
      return false
    }
  } catch (error) {
    console.log(`  ❌ Quest initialization error: ${error.message}`)
    return false
  }
}

async function testQuestAPIAuthentication() {
  console.log('\n🔐 Testing Quest API Authentication...')

  try {
    // Test without authentication - should return 401
    const response = await makeRequest(`${BASE_URL}/api/quests`)
    console.log(`  📊 Quest API response status: ${response.status}`)

    if (response.status === 401) {
      console.log('  ✅ Quest API properly requires authentication')
      return true
    } else {
      const result = await response.text()
      console.log(`  ❌ Quest API authentication not working properly: ${result}`)
      return false
    }
  } catch (error) {
    console.log(`  ❌ Quest API authentication test error: ${error.message}`)
    return false
  }
}

async function testQuestAPIEndpoints() {
  console.log('\n🎯 Testing Quest API Endpoints...')

  const endpoints = [
    { path: '/api/quests', method: 'GET', expectedStatus: 401 },
    { path: '/api/quests', method: 'POST', expectedStatus: 401 },
    { path: '/api/quests/initialize', method: 'POST', expectedStatus: 401, body: {} }
  ]

  let passedTests = 0
  let totalTests = endpoints.length

  for (const endpoint of endpoints) {
    try {
      console.log(`  Testing ${endpoint.method} ${endpoint.path}...`)

      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        }
      }

      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body)
      }

      const response = await makeRequest(`${BASE_URL}${endpoint.path}`, options)

      if (response.status === endpoint.expectedStatus) {
        console.log(`    ✅ ${endpoint.method} ${endpoint.path}: ${response.status} (expected)`)
        passedTests++
      } else {
        console.log(`    ❌ ${endpoint.method} ${endpoint.path}: ${response.status} (expected ${endpoint.expectedStatus})`)
      }
    } catch (error) {
      console.log(`    ❌ ${endpoint.method} ${endpoint.path}: Error - ${error.message}`)
    }
  }

  console.log(`  📊 Endpoint tests: ${passedTests}/${totalTests} passed`)
  return passedTests === totalTests
}

async function testQuestAPIPerformance() {
  console.log('\n⚡ Testing Quest API Performance...')

  const testCases = [
    { name: 'Quest initialization', path: '/api/quests/initialize', method: 'POST', body: { secret: ADMIN_SECRET } },
    { name: 'Quest listing (unauthenticated)', path: '/api/quests', method: 'GET' }
  ]

  let allTestsPassed = true

  for (const testCase of testCases) {
    try {
      console.log(`  Testing ${testCase.name} performance...`)

      const startTime = Date.now()

      const options = {
        method: testCase.method,
        headers: {
          'Content-Type': 'application/json',
        }
      }

      if (testCase.body) {
        options.body = JSON.stringify(testCase.body)
      }

      const response = await makeRequest(`${BASE_URL}${testCase.path}`, options)
      const endTime = Date.now()
      const duration = endTime - startTime

      if (duration < 5000) { // Should respond within 5 seconds
        console.log(`    ✅ ${testCase.name}: ${duration}ms (fast)`)
      } else {
        console.log(`    ❌ ${testCase.name}: ${duration}ms (slow)`)
        allTestsPassed = false
      }
    } catch (error) {
      console.log(`    ❌ ${testCase.name}: Error - ${error.message}`)
      allTestsPassed = false
    }
  }

  return allTestsPassed
}

async function testQuestAPIReliability() {
  console.log('\n🛡️ Testing Quest API Reliability...')

  let passedTests = 0
  let totalTests = 0

  // Test 1: Multiple concurrent requests
  totalTests++
  try {
    console.log('  Testing concurrent request handling...')

    const concurrentRequests = Array(5).fill().map(() =>
      makeRequest(`${BASE_URL}/api/quests`)
    )

    const responses = await Promise.all(concurrentRequests)
    const allSameStatus = responses.every(r => r.status === responses[0].status)

    if (allSameStatus) {
      console.log('    ✅ Concurrent requests handled consistently')
      passedTests++
    } else {
      console.log('    ❌ Concurrent requests returned inconsistent results')
    }
  } catch (error) {
    console.log(`    ❌ Concurrent request test failed: ${error.message}`)
  }

  // Test 2: Error handling
  totalTests++
  try {
    console.log('  Testing error handling...')

    const response = await makeRequest(`${BASE_URL}/api/quests/nonexistent`)

    if (response.status === 404 || response.status === 405) {
      console.log('    ✅ Proper error handling for invalid endpoints')
      passedTests++
    } else {
      console.log(`    ❌ Unexpected response for invalid endpoint: ${response.status}`)
    }
  } catch (error) {
    console.log(`    ❌ Error handling test failed: ${error.message}`)
  }

  // Test 3: Malformed request handling
  totalTests++
  try {
    console.log('  Testing malformed request handling...')

    const response = await makeRequest(`${BASE_URL}/api/quests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid json'
    })

    if (response.status >= 400 && response.status < 500) {
      console.log('    ✅ Proper handling of malformed requests')
      passedTests++
    } else {
      console.log(`    ❌ Unexpected response for malformed request: ${response.status}`)
    }
  } catch (error) {
    console.log(`    ❌ Malformed request test failed: ${error.message}`)
  }

  console.log(`  📊 Reliability tests: ${passedTests}/${totalTests} passed`)
  return passedTests === totalTests
}

async function testQuestAPIComprehensive() {
  const startTime = Date.now()
  console.log('🧪 COMPREHENSIVE QUEST API TEST')
  console.log('=' .repeat(50))

  const testResults = []

  try {
    // Run all test suites
    testResults.push({ name: 'Server Health', passed: await testServerHealth() })
    testResults.push({ name: 'Quest Initialization', passed: await testQuestInitialization() })
    testResults.push({ name: 'API Authentication', passed: await testQuestAPIAuthentication() })
    testResults.push({ name: 'API Endpoints', passed: await testQuestAPIEndpoints() })
    testResults.push({ name: 'API Performance', passed: await testQuestAPIPerformance() })
    testResults.push({ name: 'API Reliability', passed: await testQuestAPIReliability() })

    // Calculate results
    const passedTests = testResults.filter(r => r.passed).length
    const totalTests = testResults.length
    const successRate = (passedTests / totalTests * 100).toFixed(1)

    const endTime = Date.now()
    const duration = endTime - startTime

    console.log('\n' + '=' .repeat(50))
    console.log('📊 API TEST RESULTS SUMMARY')
    console.log('=' .repeat(50))

    testResults.forEach(result => {
      console.log(`  ${result.passed ? '✅' : '❌'} ${result.name}`)
    })

    console.log(`\n📈 Overall Success Rate: ${successRate}% (${passedTests}/${totalTests})`)
    console.log(`⏱️  Total Duration: ${duration}ms`)
    console.log(`🎯 Status: ${successRate >= 90 ? '🟢 EXCELLENT' : successRate >= 75 ? '🟡 GOOD' : '🔴 NEEDS IMPROVEMENT'}`)

    if (passedTests === totalTests) {
      console.log('\n🎉 ALL API TESTS PASSED! Quest API is working correctly.')
    } else {
      console.log(`\n⚠️  ${totalTests - passedTests} test suite(s) failed. Please review the issues above.`)
    }

    // API-specific requirement checks
    console.log('\n📋 API REQUIREMENT COMPLIANCE:')
    console.log(`  ✅ Authentication required: ${testResults.find(r => r.name === 'API Authentication')?.passed ? 'PASS' : 'FAIL'}`)
    console.log(`  ✅ Quest initialization works: ${testResults.find(r => r.name === 'Quest Initialization')?.passed ? 'PASS' : 'FAIL'}`)
    console.log(`  ✅ Performance acceptable: ${testResults.find(r => r.name === 'API Performance')?.passed ? 'PASS' : 'FAIL'}`)
    console.log(`  ✅ Error handling proper: ${testResults.find(r => r.name === 'API Reliability')?.passed ? 'PASS' : 'FAIL'}`)

    return passedTests === totalTests

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR in quest API test:', error)
    return false
  }
}

// Run the comprehensive test
testQuestAPIComprehensive()
  .then(success => {
    if (success) {
      console.log('\n✅ Quest API testing completed successfully!')
      process.exit(0)
    } else {
      console.log('\n❌ Quest API testing completed with failures!')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('\n💥 Quest API testing failed with error:', error)
    process.exit(1)
  })
