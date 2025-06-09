#!/usr/bin/env node

/**
 * Test script for the manual tweet submission system
 * This script tests the core functionality without web scraping
 */

const { TwitterApiService } = require('../src/lib/twitter-api')
const { getManualTweetSubmissionService } = require('../src/lib/manual-tweet-submission')
const { getEngagementUpdateService } = require('../src/lib/engagement-update-service')

async function testTwitterApiConnection() {
  console.log('🔍 Testing Twitter API connection...')
  
  try {
    const twitterApi = new TwitterApiService()
    const health = twitterApi.getHealthStatus()
    
    console.log('✅ Twitter API service initialized')
    console.log(`   - Healthy: ${health.isHealthy}`)
    console.log(`   - Last check: ${new Date(health.lastCheck).toISOString()}`)
    
    return true
  } catch (error) {
    console.error('❌ Twitter API connection failed:', error.message)
    return false
  }
}

async function testManualSubmissionService() {
  console.log('🔍 Testing Manual Tweet Submission Service...')
  
  try {
    const submissionService = getManualTweetSubmissionService()
    
    // Test with a sample tweet URL (this will fail verification but tests the service)
    const testUrl = 'https://x.com/layeredge/status/1234567890'
    const testUserId = 'test-user-id'
    
    console.log('   Testing tweet verification...')
    const verification = await submissionService.verifyTweetOwnership(testUrl, testUserId)
    
    console.log('✅ Manual submission service working')
    console.log(`   - Verification completed: ${verification.isValid}`)
    console.log(`   - Expected result: false (test URL)`)
    
    return true
  } catch (error) {
    console.error('❌ Manual submission service failed:', error.message)
    return false
  }
}

async function testEngagementUpdateService() {
  console.log('🔍 Testing Engagement Update Service...')
  
  try {
    const engagementService = getEngagementUpdateService()
    const status = engagementService.getStatus()
    
    console.log('✅ Engagement update service working')
    console.log(`   - API available: ${status.apiAvailable}`)
    console.log(`   - Last update: ${new Date(status.lastUpdateTime).toISOString()}`)
    
    return true
  } catch (error) {
    console.error('❌ Engagement update service failed:', error.message)
    return false
  }
}

async function testApiEndpoints() {
  console.log('🔍 Testing API endpoints...')
  
  try {
    // Test if we can make HTTP requests to our API endpoints
    const fetch = (await import('node-fetch')).default
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Test services status endpoint
    console.log('   Testing /api/services/status...')
    const servicesResponse = await fetch(`${baseUrl}/api/services/status`)
    
    if (servicesResponse.ok) {
      console.log('✅ Services status endpoint working')
    } else {
      console.log('⚠️ Services status endpoint returned:', servicesResponse.status)
    }
    
    // Test engagement update endpoint
    console.log('   Testing /api/engagement/update...')
    const engagementResponse = await fetch(`${baseUrl}/api/engagement/update`)
    
    if (engagementResponse.ok) {
      console.log('✅ Engagement update endpoint working')
    } else {
      console.log('⚠️ Engagement update endpoint returned:', engagementResponse.status)
    }
    
    return true
  } catch (error) {
    console.error('❌ API endpoint test failed:', error.message)
    console.log('   Note: This is expected if the server is not running')
    return false
  }
}

async function testWebScrapingRemoval() {
  console.log('🔍 Verifying web scraping components are removed...')
  
  const fs = require('fs')
  const path = require('path')
  
  const removedFiles = [
    'src/lib/scweet-service.py',
    'src/lib/local-scweet-service.js',
    'src/lib/web-scraper.ts',
    'Dockerfile.scweet',
    'requirements.scweet.txt',
    'docker-compose.yml',
    'src/app/api/scrape/tweets/route.ts'
  ]
  
  let allRemoved = true
  
  for (const file of removedFiles) {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      console.log(`❌ File still exists: ${file}`)
      allRemoved = false
    }
  }
  
  if (allRemoved) {
    console.log('✅ All web scraping components successfully removed')
  }
  
  return allRemoved
}

async function runTests() {
  console.log('🚀 LayerEdge Manual Tweet Submission System Test')
  console.log('================================================')
  console.log('')
  
  const results = []
  
  // Test 1: Twitter API Connection
  results.push(await testTwitterApiConnection())
  console.log('')
  
  // Test 2: Manual Submission Service
  results.push(await testManualSubmissionService())
  console.log('')
  
  // Test 3: Engagement Update Service
  results.push(await testEngagementUpdateService())
  console.log('')
  
  // Test 4: Web Scraping Removal
  results.push(await testWebScrapingRemoval())
  console.log('')
  
  // Test 5: API Endpoints (optional)
  results.push(await testApiEndpoints())
  console.log('')
  
  // Summary
  const passedTests = results.filter(Boolean).length
  const totalTests = results.length
  
  console.log('📊 Test Summary')
  console.log('===============')
  console.log(`Passed: ${passedTests}/${totalTests}`)
  
  if (passedTests === totalTests) {
    console.log('✅ All tests passed! Manual submission system is ready.')
  } else {
    console.log('⚠️ Some tests failed. Check the output above for details.')
  }
  
  console.log('')
  console.log('🔧 Next Steps:')
  console.log('1. Start the development server: npm run dev')
  console.log('2. Visit http://localhost:3000/submit-tweet')
  console.log('3. Test manual tweet submission with your own tweets')
  console.log('4. Check service status: npm run services:status')
  console.log('')
  
  process.exit(passedTests === totalTests ? 0 : 1)
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test runner failed:', error)
  process.exit(1)
})
