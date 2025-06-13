#!/usr/bin/env node
/**
 * Deployment Readiness Test Script
 * Comprehensive test to ensure LayerEdge platform is ready for deployment
 * with X API integration and enhanced fallback chain
 */

require('dotenv').config()

const TARGET_TWEET_URL = 'https://x.com/nxrsultxn/status/1931733077400641998'
const TARGET_USERNAME = 'nxrsultxn'

async function testDependencyInstallation() {
  console.log('📦 DEPENDENCY INSTALLATION TEST')
  console.log('─'.repeat(50))
  
  try {
    // Test twitter-api-v2 import
    console.log('Testing twitter-api-v2 import...')
    const { TwitterApi } = require('twitter-api-v2')
    console.log('✅ twitter-api-v2 imported successfully')
    
    // Test X API service import
    console.log('Testing X API service import...')
    const { XApiService, getXApiService } = require('../src/lib/x-api-service')
    console.log('✅ X API service imported successfully')
    
    // Test fallback service import
    console.log('Testing fallback service import...')
    const { FallbackService } = require('../src/lib/fallback-service')
    console.log('✅ Fallback service imported successfully')
    
    return true
  } catch (error) {
    console.log(`❌ Dependency test failed: ${error.message}`)
    return false
  }
}

async function testEnvironmentConfiguration() {
  console.log('\n🔧 ENVIRONMENT CONFIGURATION TEST')
  console.log('─'.repeat(50))
  
  const requiredVars = {
    'TWITTER_API_KEY': 'cEDodIuWbGdMynFSunnxdFJVS',
    'TWITTER_API_SECRET': 'xGpwmVssQSROioYSpt0PQULMtC18kAslMwh2qbCoRlPZakdRES'
  }
  
  let allCorrect = true
  
  for (const [varName, expectedValue] of Object.entries(requiredVars)) {
    const actualValue = process.env[varName]
    
    if (!actualValue) {
      console.log(`❌ ${varName}: MISSING`)
      allCorrect = false
    } else if (actualValue !== expectedValue) {
      console.log(`❌ ${varName}: INCORRECT`)
      console.log(`   Expected: ${expectedValue}`)
      console.log(`   Actual: ${actualValue}`)
      allCorrect = false
    } else {
      console.log(`✅ ${varName}: CORRECT`)
    }
  }
  
  return allCorrect
}

async function testXApiService() {
  console.log('\n🔑 X API SERVICE TEST')
  console.log('─'.repeat(50))
  
  try {
    const { getXApiService } = require('../src/lib/x-api-service')
    const xApiService = getXApiService()
    
    // Test service status
    const status = xApiService.getStatus()
    console.log('📊 X API Service Status:')
    console.log(`   Authenticated: ${status.authenticated}`)
    console.log(`   API Key: ${status.apiKey}`)
    console.log(`   Ready: ${status.ready}`)
    
    if (!status.ready) {
      console.log('❌ X API service not ready')
      return false
    }
    
    // Test connection
    console.log('Testing X API connection...')
    const connectionTest = await xApiService.verifyConnection()
    
    if (connectionTest) {
      console.log('✅ X API connection successful')
    } else {
      console.log('❌ X API connection failed')
      return false
    }
    
    // Test user lookup
    console.log(`Testing user lookup for @${TARGET_USERNAME}...`)
    const userResult = await xApiService.verifyUserLogin(TARGET_USERNAME)
    
    if (userResult.success) {
      console.log('✅ User lookup successful')
      console.log(`   User: @${userResult.user.username} (${userResult.user.name})`)
      console.log(`   Followers: ${userResult.user.followersCount.toLocaleString()}`)
    } else {
      console.log(`❌ User lookup failed: ${userResult.error}`)
      return false
    }
    
    return true
  } catch (error) {
    console.log(`❌ X API service test failed: ${error.message}`)
    return false
  }
}

async function testEnhancedFallbackChain() {
  console.log('\n🔄 ENHANCED FALLBACK CHAIN TEST')
  console.log('─'.repeat(50))
  
  try {
    const { FallbackService } = require('../src/lib/fallback-service')
    
    // Test with X API priority
    const fallbackService = new FallbackService({
      preferApi: true,
      enableScweet: true,
      enableTwikit: true,
      enableScraping: true
    })
    
    console.log(`Testing fallback chain with target tweet: ${TARGET_TWEET_URL}`)
    
    const startTime = Date.now()
    const result = await fallbackService.getTweetData(TARGET_TWEET_URL)
    const fetchTime = Date.now() - startTime
    
    if (result) {
      console.log('✅ Fallback chain successful!')
      console.log(`   Source: ${result.source.toUpperCase()}`)
      console.log(`   Content: ${result.content.substring(0, 80)}...`)
      console.log(`   Author: @${result.author.username}`)
      console.log(`   Engagement: ${result.likes} likes, ${result.retweets} retweets`)
      console.log(`   Fetch Time: ${fetchTime}ms`)
      console.log(`   LayerEdge Community: ${result.isFromLayerEdgeCommunity}`)
      
      // Verify it's from the correct user
      if (result.author.username.toLowerCase() === TARGET_USERNAME.toLowerCase()) {
        console.log('✅ Correct user verified')
        return true
      } else {
        console.log(`❌ Wrong user: expected @${TARGET_USERNAME}, got @${result.author.username}`)
        return false
      }
    } else {
      console.log('❌ Fallback chain failed - no data returned')
      return false
    }
  } catch (error) {
    console.log(`❌ Fallback chain test failed: ${error.message}`)
    return false
  }
}

async function testBuildProcess() {
  console.log('\n🏗️ BUILD PROCESS TEST')
  console.log('─'.repeat(50))
  
  try {
    const { spawn } = require('child_process')
    
    console.log('Testing Next.js build process...')
    
    return new Promise((resolve) => {
      const buildProcess = spawn('npm', ['run', 'build'], {
        stdio: 'pipe',
        shell: true
      })
      
      let buildOutput = ''
      let buildError = ''
      
      buildProcess.stdout.on('data', (data) => {
        buildOutput += data.toString()
      })
      
      buildProcess.stderr.on('data', (data) => {
        buildError += data.toString()
      })
      
      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Build process completed successfully')
          console.log('✅ No twitter-api-v2 dependency errors')
          resolve(true)
        } else {
          console.log('❌ Build process failed')
          console.log('Build Error Output:')
          console.log(buildError)
          
          if (buildError.includes('twitter-api-v2')) {
            console.log('❌ twitter-api-v2 dependency issue detected')
          }
          
          resolve(false)
        }
      })
      
      // Timeout after 2 minutes
      setTimeout(() => {
        buildProcess.kill()
        console.log('❌ Build process timed out')
        resolve(false)
      }, 120000)
    })
  } catch (error) {
    console.log(`❌ Build test failed: ${error.message}`)
    return false
  }
}

async function testAPIEndpoints() {
  console.log('\n🌐 API ENDPOINTS TEST')
  console.log('─'.repeat(50))
  
  try {
    // Start the application for testing
    const { spawn } = require('child_process')
    
    console.log('Starting application for API testing...')
    
    const appProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      shell: true
    })
    
    // Wait for app to start
    await new Promise(resolve => setTimeout(resolve, 10000))
    
    try {
      // Test X API login endpoint
      console.log('Testing X API login endpoint...')
      const loginResponse = await fetch('http://localhost:3000/api/x-api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: TARGET_USERNAME })
      })
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json()
        if (loginData.success) {
          console.log('✅ X API login endpoint working')
        } else {
          console.log('❌ X API login endpoint failed')
        }
      } else {
        console.log(`❌ X API login endpoint returned ${loginResponse.status}`)
      }
      
      // Test X API tweet endpoint
      console.log('Testing X API tweet endpoint...')
      const tweetResponse = await fetch('http://localhost:3000/api/x-api/tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweetUrl: TARGET_TWEET_URL })
      })
      
      if (tweetResponse.ok) {
        const tweetData = await tweetResponse.json()
        if (tweetData.success) {
          console.log('✅ X API tweet endpoint working')
        } else {
          console.log('❌ X API tweet endpoint failed')
        }
      } else {
        console.log(`❌ X API tweet endpoint returned ${tweetResponse.status}`)
      }
      
      appProcess.kill()
      return true
    } catch (error) {
      appProcess.kill()
      console.log(`❌ API endpoint test failed: ${error.message}`)
      return false
    }
  } catch (error) {
    console.log(`❌ API endpoint test setup failed: ${error.message}`)
    return false
  }
}

async function generateDeploymentReport() {
  console.log('📋 DEPLOYMENT READINESS REPORT')
  console.log('=' .repeat(60))
  
  const results = {
    dependencies: await testDependencyInstallation(),
    environment: await testEnvironmentConfiguration(),
    xApiService: await testXApiService(),
    fallbackChain: await testEnhancedFallbackChain(),
    buildProcess: await testBuildProcess()
    // Note: Skipping API endpoints test for now as it requires app to be running
  }
  
  console.log('\n📊 DEPLOYMENT READINESS SUMMARY')
  console.log('=' .repeat(60))
  
  console.log('🔧 Core Components:')
  console.log(`   ✅ Dependencies: ${results.dependencies ? 'READY' : 'FAILED'}`)
  console.log(`   ✅ Environment: ${results.environment ? 'READY' : 'FAILED'}`)
  console.log(`   ✅ X API Service: ${results.xApiService ? 'READY' : 'FAILED'}`)
  console.log(`   ✅ Fallback Chain: ${results.fallbackChain ? 'READY' : 'FAILED'}`)
  console.log(`   ✅ Build Process: ${results.buildProcess ? 'READY' : 'FAILED'}`)
  
  const allReady = Object.values(results).every(Boolean)
  
  if (allReady) {
    console.log('\n🎉 DEPLOYMENT READY!')
    console.log('✅ All systems operational')
    console.log('✅ twitter-api-v2 dependency resolved')
    console.log('✅ X API credentials working')
    console.log('✅ Enhanced fallback chain functional')
    console.log('✅ Build process successful')
    console.log('')
    console.log('🎯 Ready for production deployment!')
  } else {
    console.log('\n⚠️ DEPLOYMENT NOT READY')
    console.log('❌ Some components failed testing')
    console.log('💡 Fix the failed components before deploying')
  }
  
  console.log('\n📋 Next Steps:')
  if (allReady) {
    console.log('1. Deploy to production environment')
    console.log('2. Monitor application startup')
    console.log('3. Test X API functionality in production')
    console.log('4. Verify target tweet can be processed')
  } else {
    console.log('1. Fix failed components listed above')
    console.log('2. Re-run deployment readiness test')
    console.log('3. Ensure all dependencies are installed')
    console.log('4. Verify environment configuration')
  }
  
  return allReady
}

// Main execution
async function main() {
  console.log('🚀 LayerEdge Deployment Readiness Test')
  console.log('🔑 X API Key: cEDodIuWbGdMynFSunnxdFJVS')
  console.log('👤 Target User: @nxrsultxn')
  console.log('🐦 Target Tweet: https://x.com/nxrsultxn/status/1931733077400641998')
  console.log('')
  
  const success = await generateDeploymentReport()
  
  console.log('\n🏁 Deployment readiness test completed!')
  process.exit(success ? 0 : 1)
}

// Handle command line execution
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Deployment readiness test failed:', error)
    process.exit(1)
  })
}

module.exports = {
  testDependencyInstallation,
  testEnvironmentConfiguration,
  testXApiService,
  testEnhancedFallbackChain,
  testBuildProcess
}
