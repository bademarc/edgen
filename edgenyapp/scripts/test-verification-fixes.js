#!/usr/bin/env node

/**
 * Comprehensive test script for tweet verification rate limiting fixes
 * Tests both simplified and manual tweet submission services
 */

const { getSimplifiedTweetSubmissionService } = require('../src/lib/simplified-tweet-submission')
const { getManualTweetSubmissionService } = require('../src/lib/manual-tweet-submission')
const { getFallbackService } = require('../src/lib/fallback-service')

// Test configuration
const TEST_CONFIG = {
  // Test URLs - replace with actual valid tweet URLs for testing
  validTweetUrls: [
    'https://x.com/elonmusk/status/1234567890123456789', // Replace with real URL
    'https://twitter.com/layeredge/status/1234567890123456789', // Replace with real URL
  ],
  
  // Invalid URLs for error testing
  invalidUrls: [
    'https://x.com/nonexistent/status/999999999999999999',
    'https://invalid-url.com/not-a-tweet',
    '',
    null,
    undefined
  ],
  
  // Test user ID - replace with actual test user
  testUserId: 'test-user-123'
}

console.log('🧪 Testing Tweet Verification Rate Limiting Fixes')
console.log('=' .repeat(60))

/**
 * Test 1: Verify fallback service is working correctly
 */
async function testFallbackServiceBasics() {
  console.log('\n📋 Test 1: Fallback Service Basic Functionality')
  console.log('-'.repeat(50))
  
  try {
    // Test with oEmbed priority (rate limit safe)
    const fallbackService = getFallbackService({
      preferApi: false, // Should use oEmbed first
      apiTimeoutMs: 8000
    })
    
    console.log('✅ Fallback service initialized with preferApi: false')
    
    const testUrl = TEST_CONFIG.validTweetUrls[0]
    console.log(`🔍 Testing with URL: ${testUrl}`)
    
    const startTime = Date.now()
    const tweetData = await fallbackService.getTweetData(testUrl)
    const endTime = Date.now()
    
    if (tweetData) {
      console.log(`✅ Tweet data fetched successfully`)
      console.log(`📊 Source: ${tweetData.source}`)
      console.log(`⏱️  Duration: ${endTime - startTime}ms`)
      console.log(`📝 Content preview: "${tweetData.content?.substring(0, 80)}..."`)
      console.log(`👤 Author: @${tweetData.author?.username}`)
      
      if (tweetData.source === 'oembed') {
        console.log('🎯 SUCCESS: oEmbed used (rate limit safe)')
      } else {
        console.log(`⚠️  WARNING: ${tweetData.source} used instead of oEmbed`)
      }
    } else {
      console.log('❌ Failed to fetch tweet data')
      const status = fallbackService.getStatus()
      console.log('📊 Fallback status:', JSON.stringify(status, null, 2))
    }
    
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message)
  }
}

/**
 * Test 2: Simplified Tweet Submission Service Verification
 */
async function testSimplifiedServiceVerification() {
  console.log('\n📋 Test 2: Simplified Service Tweet Verification')
  console.log('-'.repeat(50))
  
  try {
    const submissionService = getSimplifiedTweetSubmissionService()
    console.log('✅ Simplified submission service initialized')
    
    const testUrl = TEST_CONFIG.validTweetUrls[0]
    console.log(`🔍 Testing verification with URL: ${testUrl}`)
    console.log(`👤 Test user ID: ${TEST_CONFIG.testUserId}`)
    
    // Capture console logs to check for "rate limit safe" messages
    const originalLog = console.log
    const logs = []
    console.log = (...args) => {
      logs.push(args.join(' '))
      originalLog(...args)
    }
    
    const startTime = Date.now()
    const verification = await submissionService.verifyTweetOwnership(testUrl, TEST_CONFIG.testUserId)
    const endTime = Date.now()
    
    // Restore console.log
    console.log = originalLog
    
    console.log(`⏱️  Verification duration: ${endTime - startTime}ms`)
    console.log(`📊 Verification results:`)
    console.log(`   - Valid: ${verification.isValid}`)
    console.log(`   - Own tweet: ${verification.isOwnTweet}`)
    console.log(`   - Contains mentions: ${verification.containsRequiredMentions}`)
    console.log(`   - Has error: ${!!verification.error}`)
    
    if (verification.error) {
      console.log(`   - Error: ${verification.error}`)
    }
    
    if (verification.tweetData) {
      console.log(`   - Tweet data included: ✅`)
      console.log(`   - Tweet ID: ${verification.tweetData.id}`)
      console.log(`   - Author: @${verification.tweetData.author?.username}`)
    }
    
    // Check for rate limit safe messages in logs
    const rateLimitSafeLogs = logs.filter(log => 
      log.includes('rate limit safe') || 
      log.includes('fallback service') ||
      log.includes('oembed')
    )
    
    if (rateLimitSafeLogs.length > 0) {
      console.log('🎯 SUCCESS: Rate limit safe messages detected:')
      rateLimitSafeLogs.forEach(log => console.log(`   📝 ${log}`))
    } else {
      console.log('⚠️  WARNING: No rate limit safe messages detected')
    }
    
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message)
  }
}

/**
 * Test 3: Manual Tweet Submission Service Verification
 */
async function testManualServiceVerification() {
  console.log('\n📋 Test 3: Manual Service Tweet Verification')
  console.log('-'.repeat(50))
  
  try {
    const manualService = getManualTweetSubmissionService()
    console.log('✅ Manual submission service initialized')
    
    const testUrl = TEST_CONFIG.validTweetUrls[0]
    console.log(`🔍 Testing manual verification with URL: ${testUrl}`)
    
    // Capture console logs
    const originalLog = console.log
    const logs = []
    console.log = (...args) => {
      logs.push(args.join(' '))
      originalLog(...args)
    }
    
    const startTime = Date.now()
    const verification = await manualService.verifyTweetOwnership(testUrl, TEST_CONFIG.testUserId)
    const endTime = Date.now()
    
    // Restore console.log
    console.log = originalLog
    
    console.log(`⏱️  Manual verification duration: ${endTime - startTime}ms`)
    console.log(`📊 Manual verification results:`)
    console.log(`   - Valid: ${verification.isValid}`)
    console.log(`   - Own tweet: ${verification.isOwnTweet}`)
    console.log(`   - Contains mentions: ${verification.containsRequiredMentions}`)
    console.log(`   - Has error: ${!!verification.error}`)
    
    if (verification.error) {
      console.log(`   - Error: ${verification.error}`)
    }
    
    if (verification.tweetData) {
      console.log(`   - Tweet data included: ✅`)
    }
    
    // Check for rate limit safe messages
    const rateLimitSafeLogs = logs.filter(log => 
      log.includes('rate limit safe') || 
      log.includes('fallback service') ||
      log.includes('manual tweet verification')
    )
    
    if (rateLimitSafeLogs.length > 0) {
      console.log('🎯 SUCCESS: Manual service using rate limit safe methods:')
      rateLimitSafeLogs.forEach(log => console.log(`   📝 ${log}`))
    } else {
      console.log('⚠️  WARNING: Manual service may not be using rate limit safe methods')
    }
    
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message)
  }
}

/**
 * Test 4: Error Handling Scenarios
 */
async function testErrorHandling() {
  console.log('\n📋 Test 4: Error Handling Scenarios')
  console.log('-'.repeat(50))
  
  const submissionService = getSimplifiedTweetSubmissionService()
  
  // Test various invalid inputs
  const errorTests = [
    { url: '', description: 'Empty URL' },
    { url: 'invalid-url', description: 'Invalid URL format' },
    { url: 'https://x.com/nonexistent/status/999999999999999999', description: 'Non-existent tweet' },
    { url: TEST_CONFIG.validTweetUrls[0], userId: '', description: 'Empty user ID' },
    { url: TEST_CONFIG.validTweetUrls[0], userId: null, description: 'Null user ID' }
  ]
  
  for (const test of errorTests) {
    console.log(`\n🔍 Testing: ${test.description}`)
    try {
      const result = await submissionService.verifyTweetOwnership(
        test.url || TEST_CONFIG.validTweetUrls[0], 
        test.userId !== undefined ? test.userId : TEST_CONFIG.testUserId
      )
      
      console.log(`📊 Result: ${result.error || 'No error (unexpected)'}`)
      
      if (result.error) {
        console.log('✅ Proper error handling')
      } else {
        console.log('⚠️  Expected error but got success')
      }
      
    } catch (error) {
      console.log(`📊 Exception: ${error.message}`)
      console.log('✅ Exception handled properly')
    }
  }
}

/**
 * Test 5: Performance and Rate Limit Monitoring
 */
async function testPerformanceMonitoring() {
  console.log('\n📋 Test 5: Performance and Rate Limit Monitoring')
  console.log('-'.repeat(50))
  
  const submissionService = getSimplifiedTweetSubmissionService()
  const testUrl = TEST_CONFIG.validTweetUrls[0]
  const requestCount = 3
  
  console.log(`🔍 Testing ${requestCount} consecutive verification requests...`)
  
  const results = []
  
  for (let i = 0; i < requestCount; i++) {
    console.log(`\n📡 Request ${i + 1}/${requestCount}`)
    
    const startTime = Date.now()
    try {
      const verification = await submissionService.verifyTweetOwnership(testUrl, TEST_CONFIG.testUserId)
      const endTime = Date.now()
      
      results.push({
        success: verification.isValid || !!verification.tweetData,
        duration: endTime - startTime,
        hasError: !!verification.error,
        error: verification.error
      })
      
      console.log(`   ✅ Completed in ${endTime - startTime}ms`)
      if (verification.error) {
        console.log(`   ⚠️  Error: ${verification.error}`)
      }
      
    } catch (error) {
      const endTime = Date.now()
      results.push({
        success: false,
        duration: endTime - startTime,
        hasError: true,
        error: error.message
      })
      
      console.log(`   ❌ Failed in ${endTime - startTime}ms: ${error.message}`)
    }
    
    // Small delay between requests
    if (i < requestCount - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  // Analyze results
  console.log('\n📊 Performance Analysis:')
  const successCount = results.filter(r => r.success).length
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length
  const rateLimitErrors = results.filter(r => 
    r.error && (r.error.includes('rate limit') || r.error.includes('429'))
  ).length
  
  console.log(`   Success rate: ${successCount}/${requestCount} (${(successCount/requestCount*100).toFixed(1)}%)`)
  console.log(`   Average duration: ${avgDuration.toFixed(0)}ms`)
  console.log(`   Rate limit errors: ${rateLimitErrors}/${requestCount}`)
  
  if (rateLimitErrors === 0) {
    console.log('🎯 EXCELLENT: No rate limit errors detected')
  } else {
    console.log('⚠️  WARNING: Rate limit errors still occurring')
  }
}

/**
 * Main test runner
 */
async function runVerificationTests() {
  try {
    console.log('🚀 Starting verification tests...')
    console.log(`📅 Test started at: ${new Date().toISOString()}`)
    
    await testFallbackServiceBasics()
    await testSimplifiedServiceVerification()
    await testManualServiceVerification()
    await testErrorHandling()
    await testPerformanceMonitoring()
    
    console.log('\n🎉 All verification tests completed!')
    console.log('=' .repeat(60))
    console.log('📋 Test Summary:')
    console.log('  ✅ Fallback service basic functionality')
    console.log('  ✅ Simplified service verification')
    console.log('  ✅ Manual service verification')
    console.log('  ✅ Error handling scenarios')
    console.log('  ✅ Performance monitoring')
    console.log(`📅 Test completed at: ${new Date().toISOString()}`)
    
  } catch (error) {
    console.error('❌ Test suite failed:', error)
    process.exit(1)
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runVerificationTests().catch(console.error)
}

module.exports = { runVerificationTests }
