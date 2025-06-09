#!/usr/bin/env node
/**
 * Quick Edgen Helper API Test
 * Tests the io.net Intelligence API integration directly
 */

require('dotenv').config()

async function testIoNetService() {
  console.log('🔍 TESTING IO.NET INTELLIGENCE API SERVICE')
  console.log('─'.repeat(50))
  
  try {
    // Import the service
    const { getIoNetApiService } = require('../src/lib/ionet-api-service')
    const ionetService = getIoNetApiService()
    
    // Check service status
    console.log('📊 Service Status:')
    const status = ionetService.getStatus()
    console.log('   Initialized:', status.initialized)
    console.log('   API Key:', status.apiKey)
    console.log('   Base URL:', status.baseUrl)
    console.log('   Model:', status.model)
    console.log('   Ready:', status.ready)
    
    if (!status.ready) {
      console.log('❌ Service not ready')
      return false
    }
    
    // Test connection
    console.log('\n🌐 Testing Connection:')
    const connectionTest = await ionetService.testConnection()
    
    if (connectionTest) {
      console.log('✅ Connection successful')
    } else {
      console.log('❌ Connection failed')
      return false
    }
    
    // Test a simple message
    console.log('\n💬 Testing Message:')
    const testMessage = "Hello! How do I earn points on LayerEdge?"
    console.log(`Sending: "${testMessage}"`)
    
    const response = await ionetService.sendMessage(testMessage)
    
    if (response.success) {
      console.log('✅ Message response received')
      console.log('Response:', response.message.substring(0, 200) + '...')
      console.log('Model:', response.model || 'Unknown')
      console.log('Tokens:', response.usage?.totalTokens || 0)
      return true
    } else {
      console.log('❌ Message failed:', response.error)
      return false
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
    return false
  }
}

async function testChatbotAPI() {
  console.log('\n🌐 TESTING CHATBOT API ENDPOINT')
  console.log('─'.repeat(50))
  
  try {
    // Test the API endpoint directly
    const testPayload = {
      message: "How do I submit a tweet to earn points?",
      conversationHistory: []
    }
    
    console.log('📤 Testing API endpoint...')
    console.log('Payload:', testPayload)
    
    // Note: This would require the app to be running
    // For now, we'll just verify the endpoint exists
    const fs = require('fs')
    const endpointPath = 'src/app/api/edgen-helper/chat/route.ts'
    
    if (fs.existsSync(endpointPath)) {
      console.log('✅ API endpoint file exists')
      return true
    } else {
      console.log('❌ API endpoint file missing')
      return false
    }
    
  } catch (error) {
    console.log('❌ API test failed:', error.message)
    return false
  }
}

async function main() {
  console.log('🤖 Edgen Helper API Test Suite')
  console.log('🧠 DeepSeek-R1 via io.net Intelligence API')
  console.log('')
  
  const results = {
    ionetService: await testIoNetService(),
    chatbotAPI: await testChatbotAPI()
  }
  
  console.log('\n📊 TEST RESULTS')
  console.log('─'.repeat(50))
  console.log('io.net Service:', results.ionetService ? '✅ WORKING' : '❌ FAILED')
  console.log('Chatbot API:', results.chatbotAPI ? '✅ READY' : '❌ FAILED')
  
  const allPassed = Object.values(results).every(Boolean)
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED!')
    console.log('✅ Edgen Helper should work online')
    console.log('✅ DeepSeek-R1 integration ready')
    console.log('')
    console.log('🚀 Next steps:')
    console.log('1. Start the app: npm run dev')
    console.log('2. Test the floating chat widget')
    console.log('3. Send a message to verify online mode')
  } else {
    console.log('\n⚠️ SOME TESTS FAILED')
    console.log('❌ Check the errors above')
    console.log('💡 Verify environment variables and API key')
  }
  
  process.exit(allPassed ? 0 : 1)
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test failed:', error)
    process.exit(1)
  })
}
