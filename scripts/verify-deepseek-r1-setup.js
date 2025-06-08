#!/usr/bin/env node
/**
 * Quick DeepSeek-R1 Setup Verification Script
 * Verifies that the io.net Intelligence API with DeepSeek-R1-0528 is properly configured
 */

require('dotenv').config()

async function quickVerification() {
  console.log('🔍 DEEPSEEK-R1 SETUP VERIFICATION')
  console.log('=' .repeat(50))
  
  let allGood = true
  
  // 1. Check environment variables
  console.log('\n📋 Environment Variables:')
  const requiredVars = [
    'IO_NET_API_KEY',
    'IO_NET_BASE_URL', 
    'IO_NET_MODEL',
    'EDGEN_HELPER_ENABLED'
  ]
  
  for (const varName of requiredVars) {
    const value = process.env[varName]
    if (value) {
      if (varName === 'IO_NET_API_KEY') {
        console.log(`✅ ${varName}: ${value.substring(0, 20)}...`)
      } else {
        console.log(`✅ ${varName}: ${value}`)
      }
    } else {
      console.log(`❌ ${varName}: MISSING`)
      allGood = false
    }
  }
  
  // 2. Check model configuration
  console.log('\n🤖 Model Configuration:')
  const model = process.env.IO_NET_MODEL
  if (model && model.includes('DeepSeek-R1')) {
    console.log(`✅ DeepSeek-R1 model configured: ${model}`)
  } else {
    console.log(`❌ DeepSeek-R1 model not configured. Got: ${model}`)
    allGood = false
  }
  
  // 3. Check API key format
  console.log('\n🔑 API Key Validation:')
  const apiKey = process.env.IO_NET_API_KEY
  if (apiKey && apiKey.startsWith('io-v2-')) {
    console.log('✅ API key format is correct')
  } else {
    console.log('❌ API key format is incorrect (should start with io-v2-)')
    allGood = false
  }
  
  // 4. Test service initialization
  console.log('\n🔧 Service Initialization:')
  try {
    const { getIoNetApiService } = require('../src/lib/ionet-api-service')
    const service = getIoNetApiService()
    
    if (service.isReady()) {
      console.log('✅ io.net Intelligence API service initialized')
      
      const status = service.getStatus()
      console.log(`   Model: ${status.model}`)
      console.log(`   Base URL: ${status.baseUrl}`)
      console.log(`   Max Tokens: ${status.maxTokens}`)
    } else {
      console.log('❌ io.net Intelligence API service not ready')
      allGood = false
    }
  } catch (error) {
    console.log(`❌ Service initialization failed: ${error.message}`)
    allGood = false
  }
  
  // 5. Quick connection test
  console.log('\n🌐 Connection Test:')
  try {
    const { getIoNetApiService } = require('../src/lib/ionet-api-service')
    const service = getIoNetApiService()
    
    if (service.isReady()) {
      console.log('🔍 Testing connection to io.net Intelligence API...')
      const connectionTest = await service.testConnection()
      
      if (connectionTest) {
        console.log('✅ Connection to DeepSeek-R1 successful')
      } else {
        console.log('❌ Connection test failed')
        allGood = false
      }
    } else {
      console.log('⚠️ Skipping connection test - service not ready')
    }
  } catch (error) {
    console.log(`❌ Connection test error: ${error.message}`)
    allGood = false
  }
  
  // Summary
  console.log('\n📊 VERIFICATION SUMMARY')
  console.log('=' .repeat(50))
  
  if (allGood) {
    console.log('🎉 ALL CHECKS PASSED!')
    console.log('✅ DeepSeek-R1-0528 is properly configured')
    console.log('✅ io.net Intelligence API integration ready')
    console.log('✅ Edgen Helper chatbot ready for use')
    console.log('')
    console.log('🚀 Next steps:')
    console.log('1. Start the application: npm run dev')
    console.log('2. Look for the floating chat button')
    console.log('3. Test the chatbot functionality')
    console.log('4. Run comprehensive tests: npm run test:deepseek-r1')
  } else {
    console.log('⚠️ SOME CHECKS FAILED')
    console.log('❌ DeepSeek-R1 setup needs attention')
    console.log('')
    console.log('🔧 Fix steps:')
    console.log('1. Check .env file configuration')
    console.log('2. Verify io.net API key is correct')
    console.log('3. Ensure DeepSeek-R1-0528 model is specified')
    console.log('4. Run setup script: npm run setup:edgen-helper')
  }
  
  return allGood
}

// Main execution
async function main() {
  console.log('🧠 DeepSeek-R1 Setup Verification')
  console.log('🔗 io.net Intelligence API Integration')
  console.log('🎯 LayerEdge Edgen Helper Chatbot')
  console.log('')
  
  const success = await quickVerification()
  
  console.log('\n🏁 Verification completed!')
  process.exit(success ? 0 : 1)
}

// Handle command line execution
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Verification failed:', error)
    process.exit(1)
  })
}
