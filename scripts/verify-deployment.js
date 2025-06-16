#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Tests the separated frontend/backend architecture
 */

import fetch from 'node-fetch'

const FRONTEND_URL = 'https://edgen-community.vercel.app'
const BACKEND_URL = 'https://edgen.koyeb.app'

const tests = []

function addTest(name, testFn) {
  tests.push({ name, testFn })
}

async function runTest(name, testFn) {
  try {
    console.log(`🧪 Testing: ${name}`)
    await testFn()
    console.log(`✅ ${name} - PASSED`)
    return true
  } catch (error) {
    console.log(`❌ ${name} - FAILED: ${error.message}`)
    return false
  }
}

// Backend Health Tests
addTest('Backend Health Check', async () => {
  const response = await fetch(`${BACKEND_URL}/health`)
  if (!response.ok) {
    throw new Error(`Backend health check failed: ${response.status}`)
  }
  const data = await response.json()
  if (data.status !== 'healthy') {
    throw new Error(`Backend not healthy: ${data.status}`)
  }
})

addTest('Backend API Health Check', async () => {
  const response = await fetch(`${BACKEND_URL}/api/health`)
  if (!response.ok) {
    throw new Error(`Backend API health check failed: ${response.status}`)
  }
  const data = await response.json()
  if (data.status !== 'healthy') {
    throw new Error(`Backend API not healthy: ${data.status}`)
  }
})

// CORS Tests
addTest('CORS Configuration', async () => {
  const response = await fetch(`${BACKEND_URL}/api/health`, {
    method: 'OPTIONS',
    headers: {
      'Origin': FRONTEND_URL,
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Content-Type'
    }
  })
  
  if (!response.ok) {
    throw new Error(`CORS preflight failed: ${response.status}`)
  }
  
  const allowOrigin = response.headers.get('Access-Control-Allow-Origin')
  if (allowOrigin !== FRONTEND_URL && allowOrigin !== '*') {
    throw new Error(`CORS not configured for frontend: ${allowOrigin}`)
  }
})

// API Endpoint Tests
addTest('Authentication Endpoints', async () => {
  const response = await fetch(`${BACKEND_URL}/api/auth/test`, {
    headers: { 'Origin': FRONTEND_URL }
  })
  if (!response.ok) {
    throw new Error(`Auth test endpoint failed: ${response.status}`)
  }
})

addTest('Tweets Endpoints', async () => {
  const response = await fetch(`${BACKEND_URL}/api/tweets`, {
    headers: { 'Origin': FRONTEND_URL }
  })
  // Should return 401 for unauthenticated request, which is expected
  if (response.status !== 401 && response.status !== 200) {
    throw new Error(`Tweets endpoint unexpected status: ${response.status}`)
  }
})

addTest('Leaderboard Endpoint', async () => {
  const response = await fetch(`${BACKEND_URL}/api/leaderboard`, {
    headers: { 'Origin': FRONTEND_URL }
  })
  if (!response.ok) {
    throw new Error(`Leaderboard endpoint failed: ${response.status}`)
  }
})

addTest('Recent Tweets Endpoint', async () => {
  const response = await fetch(`${BACKEND_URL}/api/recent-tweets`, {
    headers: { 'Origin': FRONTEND_URL }
  })
  if (!response.ok) {
    throw new Error(`Recent tweets endpoint failed: ${response.status}`)
  }
})

addTest('Content Validation Endpoint', async () => {
  const response = await fetch(`${BACKEND_URL}/api/content/validate`, {
    method: 'POST',
    headers: { 
      'Origin': FRONTEND_URL,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content: 'Test content' })
  })
  // Should return 401 for unauthenticated request
  if (response.status !== 401) {
    throw new Error(`Content validation endpoint unexpected status: ${response.status}`)
  }
})

addTest('AI Chat Endpoint', async () => {
  const response = await fetch(`${BACKEND_URL}/api/edgen-helper/chat`, {
    headers: { 'Origin': FRONTEND_URL }
  })
  if (!response.ok) {
    throw new Error(`AI chat status endpoint failed: ${response.status}`)
  }
})

// Frontend Tests
addTest('Frontend Accessibility', async () => {
  const response = await fetch(FRONTEND_URL)
  if (!response.ok) {
    throw new Error(`Frontend not accessible: ${response.status}`)
  }
  const html = await response.text()
  if (!html.includes('LayerEdge') && !html.includes('Edgen')) {
    throw new Error('Frontend content does not appear to be correct')
  }
})

// Environment Variable Tests
addTest('Backend Environment Configuration', async () => {
  const response = await fetch(`${BACKEND_URL}/api/health`)
  const data = await response.json()
  
  if (!data.environment) {
    throw new Error('Backend environment not configured')
  }
  
  if (data.environment !== 'production') {
    console.warn(`⚠️  Backend environment is ${data.environment}, expected production`)
  }
})

async function main() {
  console.log('🚀 Starting Deployment Verification\n')
  console.log(`Frontend URL: ${FRONTEND_URL}`)
  console.log(`Backend URL: ${BACKEND_URL}\n`)
  console.log('=' .repeat(60))
  
  let passed = 0
  let failed = 0
  
  for (const test of tests) {
    const result = await runTest(test.name, test.testFn)
    if (result) {
      passed++
    } else {
      failed++
    }
    console.log('') // Empty line for readability
  }
  
  console.log('=' .repeat(60))
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`)
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Deployment verification successful.')
    console.log('\n✅ Your separated architecture is working correctly!')
    console.log('\n🎯 Next steps:')
    console.log('1. Update any remaining frontend components to use the API client')
    console.log('2. Test user flows end-to-end')
    console.log('3. Monitor performance and error rates')
  } else {
    console.log('❌ Some tests failed. Please review the issues above.')
    console.log('\n🔧 Common fixes:')
    console.log('1. Check environment variables on both Vercel and Koyeb')
    console.log('2. Verify CORS configuration in backend')
    console.log('3. Ensure both services are deployed and running')
    process.exit(1)
  }
}

main().catch(error => {
  console.error('💥 Verification script failed:', error)
  process.exit(1)
})
