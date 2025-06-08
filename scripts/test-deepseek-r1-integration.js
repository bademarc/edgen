#!/usr/bin/env node
/**
 * DeepSeek-R1 Integration Test Script
 * Specifically tests the DeepSeek-R1-0528 model integration through io.net Intelligence API
 * Reference: https://docs.io.net/reference/get-started-with-io-intelligence-api
 */

require('dotenv').config()

// DeepSeek-R1 specific test scenarios
const DEEPSEEK_TEST_SCENARIOS = [
  {
    category: "LayerEdge Platform Knowledge",
    message: "What is LayerEdge and how does the points system work?",
    expectedKeywords: ["layeredge", "points", "tweets", "engagement"]
  },
  {
    category: "Tweet Submission Guidance",
    message: "How do I submit a tweet to earn points on LayerEdge?",
    expectedKeywords: ["submit", "tweet", "url", "@layeredge", "$edgen"]
  },
  {
    category: "Hashtag Strategy",
    message: "What's the difference between @layeredge and $EDGEN hashtags?",
    expectedKeywords: ["@layeredge", "$edgen", "mention", "token"]
  },
  {
    category: "Troubleshooting",
    message: "My tweet submission failed with 'Invalid URL format' error. Help!",
    expectedKeywords: ["invalid", "url", "format", "direct", "status"]
  },
  {
    category: "Complex Reasoning",
    message: "I have 100 followers and my tweet got 50 likes, 10 retweets, and 5 replies. How many points will I earn?",
    expectedKeywords: ["points", "engagement", "likes", "retweets", "calculation"]
  }
]

async function testDeepSeekR1ModelAccess() {
  console.log('🧠 DEEPSEEK-R1 MODEL ACCESS TEST')
  console.log('─'.repeat(50))
  
  try {
    const { getIoNetApiService } = require('../src/lib/ionet-api-service')
    const ionetService = getIoNetApiService()
    
    if (!ionetService.isReady()) {
      console.log('❌ io.net Intelligence API service not ready')
      return false
    }
    
    const status = ionetService.getStatus()
    console.log('🔍 Verifying DeepSeek-R1 configuration:')
    console.log(`   Model: ${status.model}`)
    console.log(`   Base URL: ${status.baseUrl}`)
    console.log(`   Max Tokens: ${status.maxTokens}`)
    console.log(`   Temperature: ${status.temperature}`)
    
    // Verify model is DeepSeek-R1
    if (!status.model.includes('DeepSeek-R1')) {
      console.log('❌ Expected DeepSeek-R1 model, got:', status.model)
      return false
    }
    
    console.log('✅ DeepSeek-R1-0528 model configured correctly')
    return true
  } catch (error) {
    console.log(`❌ DeepSeek-R1 model access test failed: ${error.message}`)
    return false
  }
}

async function testDeepSeekR1Reasoning() {
  console.log('\n🧠 DEEPSEEK-R1 REASONING CAPABILITIES TEST')
  console.log('─'.repeat(50))
  
  try {
    const { getIoNetApiService } = require('../src/lib/ionet-api-service')
    const ionetService = getIoNetApiService()
    
    if (!ionetService.isReady()) {
      console.log('❌ io.net Intelligence API service not ready')
      return false
    }
    
    let successfulTests = 0
    let totalTokensUsed = 0
    
    for (let i = 0; i < DEEPSEEK_TEST_SCENARIOS.length; i++) {
      const scenario = DEEPSEEK_TEST_SCENARIOS[i]
      console.log(`\n📋 Test ${i + 1}/${DEEPSEEK_TEST_SCENARIOS.length}: ${scenario.category}`)
      console.log(`   Question: "${scenario.message}"`)
      
      try {
        const startTime = Date.now()
        const response = await ionetService.sendMessage(scenario.message)
        const responseTime = Date.now() - startTime
        
        if (response.success) {
          console.log(`   ✅ Response received (${responseTime}ms)`)
          console.log(`   Model: ${response.model || 'Unknown'}`)
          
          if (response.usage) {
            console.log(`   Tokens: ${response.usage.totalTokens}`)
            totalTokensUsed += response.usage.totalTokens
          }
          
          // Check for expected keywords
          const responseText = response.message.toLowerCase()
          const foundKeywords = scenario.expectedKeywords.filter(keyword => 
            responseText.includes(keyword.toLowerCase())
          )
          
          console.log(`   Keywords found: ${foundKeywords.length}/${scenario.expectedKeywords.length}`)
          
          if (foundKeywords.length >= scenario.expectedKeywords.length * 0.5) {
            console.log(`   ✅ Response quality: Good (contains relevant LayerEdge concepts)`)
            successfulTests++
          } else {
            console.log(`   ⚠️ Response quality: Needs improvement (missing key concepts)`)
          }
          
          // Show response preview
          console.log(`   Preview: ${response.message.substring(0, 120)}...`)
        } else {
          console.log(`   ❌ Response failed: ${response.error}`)
        }
        
        // Delay between requests
        if (i < DEEPSEEK_TEST_SCENARIOS.length - 1) {
          console.log('   ⏳ Waiting 3 seconds...')
          await new Promise(resolve => setTimeout(resolve, 3000))
        }
      } catch (error) {
        console.log(`   ❌ Test failed: ${error.message}`)
      }
    }
    
    const successRate = (successfulTests / DEEPSEEK_TEST_SCENARIOS.length) * 100
    console.log(`\n📊 DeepSeek-R1 Reasoning Test Results:`)
    console.log(`   Successful tests: ${successfulTests}/${DEEPSEEK_TEST_SCENARIOS.length}`)
    console.log(`   Success rate: ${successRate.toFixed(1)}%`)
    console.log(`   Total tokens used: ${totalTokensUsed}`)
    console.log(`   Average tokens per response: ${totalTokensUsed > 0 ? Math.round(totalTokensUsed / successfulTests) : 0}`)
    
    return successRate >= 60 // 60% success rate for reasoning tests
  } catch (error) {
    console.log(`❌ DeepSeek-R1 reasoning test failed: ${error.message}`)
    return false
  }
}

async function testApiAuthentication() {
  console.log('\n🔐 IO.NET API AUTHENTICATION TEST')
  console.log('─'.repeat(50))
  
  try {
    const apiKey = process.env.IO_NET_API_KEY
    
    if (!apiKey) {
      console.log('❌ IO_NET_API_KEY not found in environment')
      return false
    }
    
    console.log(`🔑 API Key format: ${apiKey.substring(0, 20)}...`)
    
    // Validate API key format
    if (!apiKey.startsWith('io-v2-')) {
      console.log('❌ Invalid API key format - should start with "io-v2-"')
      return false
    }
    
    console.log('✅ API key format is correct')
    
    // Test authentication with a simple request
    const { getIoNetApiService } = require('../src/lib/ionet-api-service')
    const ionetService = getIoNetApiService()
    
    console.log('🔍 Testing authentication with io.net Intelligence API...')
    const authTest = await ionetService.testConnection()
    
    if (authTest) {
      console.log('✅ Authentication successful')
      return true
    } else {
      console.log('❌ Authentication failed')
      return false
    }
  } catch (error) {
    console.log(`❌ Authentication test failed: ${error.message}`)
    return false
  }
}

async function testRequestFormat() {
  console.log('\n📋 REQUEST FORMAT VALIDATION TEST')
  console.log('─'.repeat(50))
  
  try {
    const { getIoNetApiService } = require('../src/lib/ionet-api-service')
    const ionetService = getIoNetApiService()
    
    if (!ionetService.isReady()) {
      console.log('❌ Service not ready for request format test')
      return false
    }
    
    console.log('🔍 Testing request format compliance with io.net Intelligence API...')
    
    // Test with a simple message to verify request format
    const testMessage = "Hello, this is a request format test."
    const response = await ionetService.sendMessage(testMessage)
    
    if (response.success) {
      console.log('✅ Request format is correct')
      console.log(`   Model used: ${response.model || 'Unknown'}`)
      console.log(`   Finish reason: ${response.finishReason || 'Unknown'}`)
      
      if (response.usage) {
        console.log(`   Token usage tracked: ${response.usage.totalTokens} tokens`)
      }
      
      return true
    } else {
      console.log('❌ Request format validation failed')
      console.log(`   Error: ${response.error}`)
      
      // Check for specific format errors
      if (response.error.includes('400')) {
        console.log('   💡 This suggests a request format issue')
      } else if (response.error.includes('401')) {
        console.log('   💡 This suggests an authentication issue')
      }
      
      return false
    }
  } catch (error) {
    console.log(`❌ Request format test failed: ${error.message}`)
    return false
  }
}

async function generateDeepSeekR1IntegrationReport() {
  console.log('📋 DEEPSEEK-R1 INTEGRATION TEST REPORT')
  console.log('=' .repeat(60))
  
  const results = {
    modelAccess: await testDeepSeekR1ModelAccess(),
    authentication: await testApiAuthentication(),
    requestFormat: await testRequestFormat(),
    reasoning: await testDeepSeekR1Reasoning()
  }
  
  console.log('\n📊 DEEPSEEK-R1 INTEGRATION SUMMARY')
  console.log('=' .repeat(60))
  
  console.log('🔧 Core Integration:')
  console.log(`   ✅ Model Access: ${results.modelAccess ? 'WORKING' : 'FAILED'}`)
  console.log(`   ✅ Authentication: ${results.authentication ? 'WORKING' : 'FAILED'}`)
  console.log(`   ✅ Request Format: ${results.requestFormat ? 'WORKING' : 'FAILED'}`)
  console.log(`   ✅ Reasoning Capabilities: ${results.reasoning ? 'WORKING' : 'FAILED'}`)
  
  const allPassed = Object.values(results).every(Boolean)
  
  if (allPassed) {
    console.log('\n🎉 DEEPSEEK-R1 INTEGRATION FULLY OPERATIONAL!')
    console.log('✅ io.net Intelligence API connection established')
    console.log('✅ DeepSeek-R1-0528 model accessible and responding')
    console.log('✅ Authentication working correctly')
    console.log('✅ Request format compliant with io.net specifications')
    console.log('✅ Advanced reasoning capabilities verified')
    console.log('✅ LayerEdge-specific knowledge integration successful')
    console.log('')
    console.log('🚀 Ready for production deployment!')
  } else {
    console.log('\n⚠️ DEEPSEEK-R1 INTEGRATION ISSUES DETECTED')
    
    if (!results.modelAccess) {
      console.log('❌ Model Access: Check DeepSeek-R1-0528 availability')
    }
    if (!results.authentication) {
      console.log('❌ Authentication: Verify io.net API key')
    }
    if (!results.requestFormat) {
      console.log('❌ Request Format: Check API endpoint and payload structure')
    }
    if (!results.reasoning) {
      console.log('❌ Reasoning: DeepSeek-R1 responses need optimization')
    }
  }
  
  console.log('\n📋 Next Steps:')
  if (allPassed) {
    console.log('1. Deploy Edgen Helper with DeepSeek-R1 integration')
    console.log('2. Monitor token usage and response quality')
    console.log('3. Gather user feedback on AI assistance quality')
    console.log('4. Optimize prompts for better LayerEdge-specific responses')
  } else {
    console.log('1. Fix failed integration components')
    console.log('2. Verify io.net Intelligence API documentation compliance')
    console.log('3. Test DeepSeek-R1 model access independently')
    console.log('4. Re-run integration tests')
  }
  
  return allPassed
}

// Main execution
async function main() {
  console.log('🧠 DeepSeek-R1 Integration Test Suite')
  console.log('🔗 io.net Intelligence API Integration')
  console.log('🎯 LayerEdge Edgen Helper Chatbot')
  console.log('📚 Model: deepseek-ai/DeepSeek-R1-0528')
  console.log('')
  
  const success = await generateDeepSeekR1IntegrationReport()
  
  console.log('\n🏁 DeepSeek-R1 integration testing completed!')
  process.exit(success ? 0 : 1)
}

// Handle command line execution
if (require.main === module) {
  main().catch(error => {
    console.error('💥 DeepSeek-R1 integration test failed:', error)
    process.exit(1)
  })
}
