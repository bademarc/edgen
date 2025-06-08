#!/usr/bin/env node
/**
 * Comprehensive System Failure Diagnosis Script
 * Tests all four priority issues for the failing tweet URL: https://x.com/nxrsultxn/status/1931733077400641998
 * Provides detailed analysis and specific fixes for each failure point
 */

const { getFallbackService } = require('../src/lib/fallback-service')
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

// The specific failing tweet URL
const FAILING_TWEET_URL = 'https://x.com/nxrsultxn/status/1931733077400641998'

async function diagnosePriority1_TwitterAPIRateLimit() {
  console.log('🔍 PRIORITY 1: Twitter API Rate Limit Analysis')
  console.log('─'.repeat(70))
  
  try {
    // Test fallback service configuration
    const fallbackService = getFallbackService({
      preferApi: false,
      enableScweet: true,
      enableTwikit: true,
      enableScraping: true
    })
    
    const status = fallbackService.getStatus()
    console.log('📊 Fallback Service Configuration:')
    console.log(`   Preferred Source: ${status.preferredSource}`)
    console.log(`   API Failures: ${status.apiFailureCount}`)
    console.log(`   Rate Limited: ${status.isApiRateLimited}`)
    
    if (status.preferredSource === 'api') {
      console.log('❌ ISSUE FOUND: Twitter API still preferred despite configuration')
      console.log('💡 FIX: Ensure preferApi is set to false in fallback service')
      return false
    } else {
      console.log('✅ PRIORITY 1 FIXED: Twitter API properly deprioritized')
      return true
    }
  } catch (error) {
    console.log(`❌ Error testing Priority 1: ${error.message}`)
    return false
  }
}

async function diagnosePriority2_NetworkResolution() {
  console.log('\n🔍 PRIORITY 2: Scweet Service Network Resolution Analysis')
  console.log('─'.repeat(70))
  
  const serviceUrls = [
    'http://scweet-service:8001',
    'http://localhost:8001',
    'http://127.0.0.1:8001'
  ]
  
  let anySuccess = false
  
  for (const url of serviceUrls) {
    try {
      console.log(`Testing connection to: ${url}`)
      
      const response = await fetch(`${url}/health`, { 
        timeout: 5000,
        signal: AbortSignal.timeout(5000)
      })
      
      if (response.ok) {
        const health = await response.json()
        console.log(`✅ SUCCESS: ${url} is accessible`)
        console.log(`   Service: ${health.service}`)
        console.log(`   Scweet Ready: ${health.scweet_ready}`)
        console.log(`   Twikit Ready: ${health.twikit_ready}`)
        anySuccess = true
      } else {
        console.log(`⚠️ ${url} returned status: ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ ${url} failed: ${error.message}`)
      
      if (error.message.includes('ENOTFOUND') || error.message.includes('fetch failed')) {
        console.log('💡 NETWORK RESOLUTION ISSUE DETECTED')
        console.log('   - Check Docker Compose networking')
        console.log('   - Verify scweet-service container is running')
        console.log('   - Ensure layeredge-network bridge is configured')
      }
    }
  }
  
  if (anySuccess) {
    console.log('✅ PRIORITY 2 FIXED: At least one service URL is accessible')
    return true
  } else {
    console.log('❌ PRIORITY 2 ISSUE: No service URLs accessible')
    console.log('💡 FIXES NEEDED:')
    console.log('   1. Start Docker services: docker-compose up -d')
    console.log('   2. Check network: docker network ls')
    console.log('   3. Verify health: docker-compose ps')
    return false
  }
}

async function diagnosePriority3_PlaywrightBrowsers() {
  console.log('\n🔍 PRIORITY 3: Playwright Browser Installation Analysis')
  console.log('─'.repeat(70))
  
  try {
    // Check if we're in Docker environment
    const isDocker = fs.existsSync('/.dockerenv')
    console.log(`Environment: ${isDocker ? 'Docker Container' : 'Local Development'}`)
    
    // Check Playwright installation
    const playwrightPaths = [
      '/home/nextjs/.cache/ms-playwright',
      process.env.PLAYWRIGHT_BROWSERS_PATH,
      path.join(process.env.HOME || '/tmp', '.cache/ms-playwright'),
      './node_modules/.cache/ms-playwright'
    ].filter(Boolean)
    
    let browserFound = false
    
    for (const playwrightPath of playwrightPaths) {
      console.log(`Checking: ${playwrightPath}`)
      
      if (fs.existsSync(playwrightPath)) {
        console.log(`✅ Playwright cache directory exists: ${playwrightPath}`)
        
        // Look for Chrome executable
        try {
          const findChrome = (dir) => {
            const items = fs.readdirSync(dir, { withFileTypes: true })
            for (const item of items) {
              const fullPath = path.join(dir, item.name)
              if (item.isDirectory()) {
                const result = findChrome(fullPath)
                if (result) return result
              } else if (item.name === 'chrome' && fs.statSync(fullPath).mode & 0o111) {
                return fullPath
              }
            }
            return null
          }
          
          const chromePath = findChrome(playwrightPath)
          if (chromePath) {
            console.log(`✅ Chrome executable found: ${chromePath}`)
            browserFound = true
            break
          } else {
            console.log(`⚠️ No Chrome executable found in ${playwrightPath}`)
          }
        } catch (error) {
          console.log(`❌ Error scanning ${playwrightPath}: ${error.message}`)
        }
      } else {
        console.log(`❌ Directory not found: ${playwrightPath}`)
      }
    }
    
    if (browserFound) {
      console.log('✅ PRIORITY 3 FIXED: Playwright browsers are installed')
      return true
    } else {
      console.log('❌ PRIORITY 3 ISSUE: No Playwright browsers found')
      console.log('💡 FIXES NEEDED:')
      console.log('   1. Install browsers: npx playwright install chromium --with-deps')
      console.log('   2. Check Dockerfile browser installation steps')
      console.log('   3. Verify file permissions in Docker container')
      return false
    }
  } catch (error) {
    console.log(`❌ Error testing Priority 3: ${error.message}`)
    return false
  }
}

async function diagnosePriority4_TwikitFallback() {
  console.log('\n🔍 PRIORITY 4: Twikit Fallback Engagement Analysis')
  console.log('─'.repeat(70))
  
  try {
    // Test Twikit configuration
    const fallbackService = getFallbackService({
      enableTwikit: true,
      enableScweet: true
    })
    
    console.log('Testing Twikit service endpoints...')
    
    const serviceUrls = [
      'http://scweet-service:8001',
      'http://localhost:8001'
    ]
    
    let twikitWorking = false
    
    for (const url of serviceUrls) {
      try {
        console.log(`Testing Twikit endpoint: ${url}/twikit/tweet`)
        
        const response = await fetch(`${url}/twikit/tweet`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tweet_url: FAILING_TWEET_URL,
            include_engagement: true,
            include_user_info: true
          }),
          timeout: 10000
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log(`✅ Twikit endpoint working at ${url}`)
          console.log(`   Tweet ID: ${data.tweet_id}`)
          console.log(`   Source: ${data.source || 'twikit'}`)
          twikitWorking = true
          break
        } else {
          console.log(`⚠️ Twikit endpoint returned ${response.status} at ${url}`)
        }
      } catch (error) {
        console.log(`❌ Twikit endpoint failed at ${url}: ${error.message}`)
      }
    }
    
    if (twikitWorking) {
      console.log('✅ PRIORITY 4 FIXED: Twikit fallback is operational')
      return true
    } else {
      console.log('❌ PRIORITY 4 ISSUE: Twikit fallback not accessible')
      console.log('💡 FIXES NEEDED:')
      console.log('   1. Verify Twikit is installed: pip install twikit')
      console.log('   2. Check Twikit service initialization in scweet-service.py')
      console.log('   3. Ensure /twikit/ endpoints are properly configured')
      return false
    }
  } catch (error) {
    console.log(`❌ Error testing Priority 4: ${error.message}`)
    return false
  }
}

async function testSpecificTweetURL() {
  console.log('\n🐦 SPECIFIC TWEET URL TEST')
  console.log('─'.repeat(70))
  console.log(`Testing: ${FAILING_TWEET_URL}`)
  
  try {
    const fallbackService = getFallbackService({
      preferApi: false,
      enableScweet: true,
      enableTwikit: true,
      enableScraping: true
    })
    
    console.log('Attempting to fetch tweet data through enhanced fallback chain...')
    const startTime = Date.now()
    
    const result = await fallbackService.getTweetData(FAILING_TWEET_URL)
    const fetchTime = Date.now() - startTime
    
    if (result) {
      console.log('✅ TWEET SUCCESSFULLY FETCHED!')
      console.log(`   Source: ${result.source.toUpperCase()}`)
      console.log(`   Content: ${result.content.substring(0, 100)}...`)
      console.log(`   Author: @${result.author.username}`)
      console.log(`   Engagement: ${result.likes} likes, ${result.retweets} retweets`)
      console.log(`   Fetch Time: ${fetchTime}ms`)
      console.log(`   LayerEdge Community: ${result.isFromLayerEdgeCommunity}`)
      return true
    } else {
      console.log('❌ TWEET FETCH FAILED - All fallback methods unsuccessful')
      return false
    }
  } catch (error) {
    console.log(`❌ Error testing specific tweet: ${error.message}`)
    return false
  }
}

async function generateDiagnosticReport() {
  console.log('\n📋 DIAGNOSTIC REPORT GENERATION')
  console.log('─'.repeat(70))
  
  const results = {
    priority1: await diagnosePriority1_TwitterAPIRateLimit(),
    priority2: await diagnosePriority2_NetworkResolution(),
    priority3: await diagnosePriority3_PlaywrightBrowsers(),
    priority4: await diagnosePriority4_TwikitFallback(),
    tweetTest: await testSpecificTweetURL()
  }
  
  console.log('\n📊 COMPREHENSIVE DIAGNOSTIC SUMMARY')
  console.log('=' .repeat(80))
  
  console.log('🔧 Priority Issues Status:')
  console.log(`   ✅ Priority 1 (Twitter API Rate Limits): ${results.priority1 ? 'FIXED' : 'NEEDS ATTENTION'}`)
  console.log(`   ✅ Priority 2 (Network Resolution): ${results.priority2 ? 'FIXED' : 'NEEDS ATTENTION'}`)
  console.log(`   ✅ Priority 3 (Playwright Browsers): ${results.priority3 ? 'FIXED' : 'NEEDS ATTENTION'}`)
  console.log(`   ✅ Priority 4 (Twikit Fallback): ${results.priority4 ? 'FIXED' : 'NEEDS ATTENTION'}`)
  
  console.log('\n🎯 System Functionality:')
  console.log(`   ✅ Specific Tweet URL Test: ${results.tweetTest ? 'PASSED' : 'FAILED'}`)
  
  const allFixed = Object.values(results).every(Boolean)
  
  if (allFixed) {
    console.log('\n🎉 ALL ISSUES RESOLVED!')
    console.log('✅ The LayerEdge community platform is fully operational')
    console.log('✅ Enhanced 4-layer fallback system is working correctly')
    console.log('✅ Specific failing tweet URL can now be processed successfully')
  } else {
    console.log('\n⚠️ ISSUES REMAINING')
    console.log('❌ Some critical issues still need attention')
    console.log('📋 Review the specific fixes mentioned above')
    console.log('🔧 Run deployment script: npm run deploy:critical-fixes')
  }
  
  console.log('\n📋 Next Steps:')
  if (!allFixed) {
    console.log('1. Address remaining issues based on specific fixes above')
    console.log('2. Run: npm run deploy:critical-fixes')
    console.log('3. Re-run this diagnostic: npm run diagnose:system-failures')
  } else {
    console.log('1. Deploy to production with current configuration')
    console.log('2. Monitor system performance and logs')
    console.log('3. Test additional tweet URLs to verify stability')
  }
  
  return allFixed
}

// Main execution
async function main() {
  console.log('🚨 LAYEREDGE COMPREHENSIVE SYSTEM FAILURE DIAGNOSIS')
  console.log('=' .repeat(80))
  console.log('🐦 Target Tweet: https://x.com/nxrsultxn/status/1931733077400641998')
  console.log('🔧 Testing: Rate Limits, Network Resolution, Browser Installation, Twikit Fallback')
  console.log('')
  
  const success = await generateDiagnosticReport()
  
  console.log('\n🏁 Diagnostic completed!')
  process.exit(success ? 0 : 1)
}

// Handle command line execution
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Diagnostic script failed:', error)
    process.exit(1)
  })
}

module.exports = {
  diagnosePriority1_TwitterAPIRateLimit,
  diagnosePriority2_NetworkResolution,
  diagnosePriority3_PlaywrightBrowsers,
  diagnosePriority4_TwikitFallback,
  testSpecificTweetURL,
  FAILING_TWEET_URL
}
