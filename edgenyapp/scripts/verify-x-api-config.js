#!/usr/bin/env node
/**
 * X API Configuration Verification Script
 * Verifies that all X API credentials and configuration are properly set
 */

require('dotenv').config()

const REQUIRED_X_API_VARS = {
  'TWITTER_API_KEY': {
    expected: 'cEDodIuWbGdMynFSunnxdFJVS',
    description: 'X API Key for authentication'
  },
  'TWITTER_API_SECRET': {
    expected: 'xGpwmVssQSROioYSpt0PQULMtC18kAslMwh2qbCoRlPZakdRES',
    description: 'X API Secret for authentication'
  },
  'X_API_ENABLED': {
    expected: 'true',
    description: 'Enable X API service'
  },
  'X_API_VERSION': {
    expected: '2',
    description: 'X API version to use'
  }
}

const OPTIONAL_X_API_VARS = {
  'TWITTER_BEARER_TOKEN': 'Bearer token for app-only authentication',
  'X_API_RATE_LIMIT_ENABLED': 'Enable rate limit monitoring',
  'X_API_MAX_REQUESTS_PER_WINDOW': 'Maximum requests per rate limit window',
  'X_API_WINDOW_MINUTES': 'Rate limit window duration in minutes'
}

async function verifyEnvironmentVariables() {
  console.log('🔍 X API ENVIRONMENT VARIABLES VERIFICATION')
  console.log('─'.repeat(60))
  
  let allRequired = true
  let configIssues = []
  
  // Check required variables
  console.log('📋 Required Variables:')
  for (const [varName, config] of Object.entries(REQUIRED_X_API_VARS)) {
    const value = process.env[varName]
    
    if (!value) {
      console.log(`❌ ${varName}: MISSING`)
      console.log(`   Expected: ${config.expected}`)
      console.log(`   Description: ${config.description}`)
      allRequired = false
      configIssues.push(`Missing required variable: ${varName}`)
    } else if (value !== config.expected) {
      console.log(`⚠️ ${varName}: INCORRECT VALUE`)
      console.log(`   Current: ${value}`)
      console.log(`   Expected: ${config.expected}`)
      configIssues.push(`Incorrect value for: ${varName}`)
    } else {
      console.log(`✅ ${varName}: CORRECT`)
    }
  }
  
  console.log('\n📋 Optional Variables:')
  for (const [varName, description] of Object.entries(OPTIONAL_X_API_VARS)) {
    const value = process.env[varName]
    
    if (value) {
      console.log(`✅ ${varName}: ${value}`)
    } else {
      console.log(`⚪ ${varName}: Not set (${description})`)
    }
  }
  
  return { allRequired, configIssues }
}

async function testXApiImport() {
  console.log('\n🧪 X API IMPORT TEST')
  console.log('─'.repeat(60))
  
  try {
    console.log('Testing twitter-api-v2 import...')
    const { TwitterApi } = require('twitter-api-v2')
    
    console.log('✅ twitter-api-v2 imported successfully')
    console.log('✅ TwitterApi class available')
    
    // Test basic initialization
    try {
      const client = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY || 'test',
        appSecret: process.env.TWITTER_API_SECRET || 'test'
      })
      
      console.log('✅ TwitterApi client initialization successful')
      return true
    } catch (error) {
      console.log(`❌ TwitterApi client initialization failed: ${error.message}`)
      return false
    }
  } catch (error) {
    console.log(`❌ twitter-api-v2 import failed: ${error.message}`)
    console.log('💡 Run: npm install twitter-api-v2@^1.17.2')
    return false
  }
}

async function testXApiService() {
  console.log('\n🔧 X API SERVICE TEST')
  console.log('─'.repeat(60))
  
  try {
    console.log('Testing X API service import...')
    const { XApiService } = require('../src/lib/x-api-service')
    
    console.log('✅ X API service imported successfully')
    
    // Test service initialization
    try {
      const xApiService = new XApiService()
      console.log('✅ X API service initialization successful')
      
      // Test service status
      const status = xApiService.getStatus()
      console.log('📊 X API Service Status:')
      console.log(`   Authenticated: ${status.authenticated}`)
      console.log(`   API Key: ${status.apiKey}`)
      console.log(`   Has Bearer: ${status.hasBearer}`)
      console.log(`   Ready: ${status.ready}`)
      
      return status.ready
    } catch (error) {
      console.log(`❌ X API service initialization failed: ${error.message}`)
      return false
    }
  } catch (error) {
    console.log(`❌ X API service import failed: ${error.message}`)
    console.log('💡 Check that src/lib/x-api-service.ts exists and compiles correctly')
    return false
  }
}

async function testXApiConnection() {
  console.log('\n🌐 X API CONNECTION TEST')
  console.log('─'.repeat(60))
  
  try {
    const { XApiService } = require('../src/lib/x-api-service')
    const xApiService = new XApiService()
    
    if (!xApiService.isReady()) {
      console.log('❌ X API service not ready for connection test')
      return false
    }
    
    console.log('Testing X API connection...')
    const connectionTest = await xApiService.verifyConnection()
    
    if (connectionTest) {
      console.log('✅ X API connection verified successfully')
      return true
    } else {
      console.log('❌ X API connection verification failed')
      return false
    }
  } catch (error) {
    console.log(`❌ X API connection test failed: ${error.message}`)
    return false
  }
}

async function testUserLookup() {
  console.log('\n👤 USER LOOKUP TEST (@nxrsultxn)')
  console.log('─'.repeat(60))
  
  try {
    const { XApiService } = require('../src/lib/x-api-service')
    const xApiService = new XApiService()
    
    if (!xApiService.isReady()) {
      console.log('❌ X API service not ready for user lookup test')
      return false
    }
    
    console.log('Testing user lookup for @nxrsultxn...')
    const userResult = await xApiService.verifyUserLogin('nxrsultxn')
    
    if (userResult.success && userResult.user) {
      console.log('✅ User lookup successful!')
      console.log(`   User ID: ${userResult.user.id}`)
      console.log(`   Username: @${userResult.user.username}`)
      console.log(`   Display Name: ${userResult.user.name}`)
      console.log(`   Verified: ${userResult.user.verified}`)
      console.log(`   Followers: ${userResult.user.followersCount.toLocaleString()}`)
      return true
    } else {
      console.log(`❌ User lookup failed: ${userResult.error}`)
      return false
    }
  } catch (error) {
    console.log(`❌ User lookup test failed: ${error.message}`)
    return false
  }
}

async function generateConfigReport() {
  console.log('📋 X API CONFIGURATION VERIFICATION REPORT')
  console.log('=' .repeat(70))
  
  const results = {
    environment: await verifyEnvironmentVariables(),
    import: await testXApiImport(),
    service: await testXApiService(),
    connection: await testXApiConnection(),
    userLookup: await testUserLookup()
  }
  
  console.log('\n📊 VERIFICATION SUMMARY')
  console.log('=' .repeat(70))
  
  console.log('🔧 Configuration:')
  console.log(`   ✅ Environment Variables: ${results.environment.allRequired ? 'CORRECT' : 'ISSUES FOUND'}`)
  console.log(`   ✅ twitter-api-v2 Import: ${results.import ? 'WORKING' : 'FAILED'}`)
  console.log(`   ✅ X API Service: ${results.service ? 'WORKING' : 'FAILED'}`)
  console.log(`   ✅ X API Connection: ${results.connection ? 'WORKING' : 'FAILED'}`)
  console.log(`   ✅ User Lookup (@nxrsultxn): ${results.userLookup ? 'WORKING' : 'FAILED'}`)
  
  const allPassed = results.environment.allRequired && results.import && 
                   results.service && results.connection && results.userLookup
  
  if (allPassed) {
    console.log('\n🎉 ALL X API CONFIGURATION TESTS PASSED!')
    console.log('✅ X API credentials are correctly configured')
    console.log('✅ twitter-api-v2 dependency is working')
    console.log('✅ X API service is functional')
    console.log('✅ Connection to X API is successful')
    console.log('✅ User @nxrsultxn can be accessed')
    console.log('')
    console.log('🎯 Ready for production deployment!')
  } else {
    console.log('\n⚠️ SOME X API CONFIGURATION TESTS FAILED')
    
    if (!results.environment.allRequired) {
      console.log('\n❌ Environment Variable Issues:')
      results.environment.configIssues.forEach(issue => {
        console.log(`   • ${issue}`)
      })
    }
    
    if (!results.import) {
      console.log('\n❌ Dependency Issues:')
      console.log('   • twitter-api-v2 package not installed or not working')
      console.log('   • Run: npm install twitter-api-v2@^1.17.2')
    }
    
    if (!results.service) {
      console.log('\n❌ Service Issues:')
      console.log('   • X API service not compiling or initializing')
      console.log('   • Check src/lib/x-api-service.ts for errors')
    }
    
    if (!results.connection) {
      console.log('\n❌ Connection Issues:')
      console.log('   • X API credentials may be incorrect')
      console.log('   • Network connectivity issues')
      console.log('   • Rate limiting or API access issues')
    }
    
    if (!results.userLookup) {
      console.log('\n❌ User Lookup Issues:')
      console.log('   • User @nxrsultxn may not be accessible')
      console.log('   • API permissions may be insufficient')
    }
  }
  
  console.log('\n📋 Next Steps:')
  if (allPassed) {
    console.log('1. Build the application: npm run build')
    console.log('2. Deploy to production: npm start')
    console.log('3. Test in production environment')
  } else {
    console.log('1. Fix the issues mentioned above')
    console.log('2. Re-run verification: node scripts/verify-x-api-config.js')
    console.log('3. Install dependencies: npm run install:x-api-dependencies')
  }
  
  return allPassed
}

// Main execution
async function main() {
  console.log('🔐 LayerEdge X API Configuration Verification')
  console.log('🔑 Testing X API credentials and service functionality')
  console.log('👤 Target User: @nxrsultxn')
  console.log('')
  
  const success = await generateConfigReport()
  
  console.log('\n🏁 X API configuration verification completed!')
  process.exit(success ? 0 : 1)
}

// Handle command line execution
if (require.main === module) {
  main().catch(error => {
    console.error('💥 X API configuration verification failed:', error)
    process.exit(1)
  })
}

module.exports = {
  verifyEnvironmentVariables,
  testXApiImport,
  testXApiService,
  testXApiConnection,
  testUserLookup
}
