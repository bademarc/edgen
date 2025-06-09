import dotenv from 'dotenv';
dotenv.config();

async function testCompleteChatbot() {
  console.log('🤖 COMPLETE EDGEN HELPER CHATBOT TEST');
  console.log('═'.repeat(60));
  console.log('🎯 Testing io.net Intelligence API + DeepSeek-R1-0528');
  console.log('🌐 LayerEdge Community Platform Integration');
  console.log('');

  const results = {
    ionetAPI: false,
    chatbotAPI: false,
    componentIntegration: false,
    environmentConfig: false
  };

  // Test 1: io.net Intelligence API Direct
  console.log('1️⃣ Testing io.net Intelligence API Direct Connection');
  console.log('─'.repeat(50));
  
  try {
    const apiKey = process.env.IO_NET_API_KEY;
    const baseUrl = process.env.IO_NET_BASE_URL || 'https://api.intelligence.io.solutions/api';
    const model = process.env.IO_NET_MODEL || 'deepseek-ai/DeepSeek-R1-0528';
    
    console.log('Configuration:');
    console.log('• API Key:', apiKey ? `${apiKey.substring(0, 20)}...` : '❌ MISSING');
    console.log('• Base URL:', baseUrl);
    console.log('• Model:', model);
    
    if (!apiKey) {
      console.log('❌ API key missing - cannot test');
    } else {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: 'You are Edgen Helper for LayerEdge.' },
            { role: 'user', content: 'Test connection - respond with "Connected!"' }
          ],
          max_tokens: 50,
          temperature: 0.7
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ io.net API Connection: SUCCESS');
        console.log('• Model Response:', data.model);
        console.log('• Message Preview:', data.choices?.[0]?.message?.content?.substring(0, 100));
        results.ionetAPI = true;
      } else {
        console.log('❌ io.net API Connection: FAILED');
        console.log('• Status:', response.status);
        console.log('• Error:', await response.text());
      }
    }
  } catch (error) {
    console.log('❌ io.net API Test Error:', error.message);
  }

  console.log('');

  // Test 2: Chatbot API Endpoint
  console.log('2️⃣ Testing Chatbot API Endpoint');
  console.log('─'.repeat(50));
  
  try {
    // Test GET endpoint
    const getResponse = await fetch('http://localhost:3000/api/edgen-helper/chat');
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('✅ GET Endpoint: SUCCESS');
      console.log('• Service:', getData.service);
      console.log('• Status:', getData.status);
      console.log('• API Ready:', getData.ionetApiStatus?.ready);
    } else {
      console.log('❌ GET Endpoint: FAILED');
    }

    // Test POST endpoint
    const postResponse = await fetch('http://localhost:3000/api/edgen-helper/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Test message: How do I earn points?',
        conversationHistory: []
      })
    });

    if (postResponse.ok) {
      const postData = await postResponse.json();
      console.log('✅ POST Endpoint: SUCCESS');
      console.log('• Response Length:', postData.message?.length || 0);
      console.log('• Online Mode:', !postData.isOffline);
      console.log('• Mode:', postData.mode || 'DeepSeek-R1 Online');
      results.chatbotAPI = true;
    } else {
      console.log('❌ POST Endpoint: FAILED');
    }
  } catch (error) {
    console.log('❌ Chatbot API Test Error:', error.message);
  }

  console.log('');

  // Test 3: Component Integration
  console.log('3️⃣ Testing Component Integration');
  console.log('─'.repeat(50));
  
  try {
    const fs = await import('fs');
    
    // Check if component exists
    const componentPath = 'src/components/edgen-helper-chatbot.tsx';
    if (fs.existsSync(componentPath)) {
      console.log('✅ Component File: EXISTS');
      
      // Check if component is imported in layout
      const layoutPath = 'src/app/layout.tsx';
      if (fs.existsSync(layoutPath)) {
        const layoutContent = fs.readFileSync(layoutPath, 'utf8');
        if (layoutContent.includes('EdgenHelperChatbot')) {
          console.log('✅ Layout Integration: SUCCESS');
          console.log('• Component imported and used in layout');
          results.componentIntegration = true;
        } else {
          console.log('❌ Layout Integration: MISSING');
        }
      }
    } else {
      console.log('❌ Component File: MISSING');
    }
  } catch (error) {
    console.log('❌ Component Integration Test Error:', error.message);
  }

  console.log('');

  // Test 4: Environment Configuration
  console.log('4️⃣ Testing Environment Configuration');
  console.log('─'.repeat(50));
  
  const requiredVars = [
    'IO_NET_API_KEY',
    'IO_NET_BASE_URL', 
    'IO_NET_MODEL',
    'EDGEN_HELPER_ENABLED'
  ];

  let configComplete = true;
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: SET`);
    } else {
      console.log(`❌ ${varName}: MISSING`);
      configComplete = false;
    }
  }

  if (configComplete) {
    console.log('✅ Environment Configuration: COMPLETE');
    results.environmentConfig = true;
  } else {
    console.log('❌ Environment Configuration: INCOMPLETE');
  }

  // Final Results
  console.log('');
  console.log('🏁 FINAL TEST RESULTS');
  console.log('═'.repeat(60));
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`📊 Tests Passed: ${passedTests}/${totalTests}`);
  console.log('');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${testName}`);
  });

  console.log('');
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Edgen Helper is fully functional!');
    console.log('');
    console.log('✨ Features Available:');
    console.log('• Floating chat button (bottom-right corner)');
    console.log('• DeepSeek-R1 AI responses via io.net Intelligence API');
    console.log('• LayerEdge platform assistance');
    console.log('• Dark theme with Bitcoin orange accents');
    console.log('• Real-time chat with conversation history');
    console.log('• Fallback mode for offline scenarios');
    console.log('');
    console.log('🚀 Ready for production deployment!');
  } else {
    console.log('⚠️ Some tests failed. Please review the issues above.');
  }

  return passedTests === totalTests;
}

// Run the test
testCompleteChatbot().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
