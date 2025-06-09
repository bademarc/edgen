import dotenv from 'dotenv';
dotenv.config();

async function testChatbotAPI() {
  console.log('🤖 Testing Edgen Helper Chatbot API');
  console.log('─'.repeat(50));
  
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Test GET endpoint first
    console.log('\n1. Testing GET /api/edgen-helper/chat...');
    const getResponse = await fetch(`${baseUrl}/api/edgen-helper/chat`);
    console.log('GET Status:', getResponse.status);
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('✅ GET Success:', getData.service);
      console.log('Status:', getData.status);
      console.log('io.net API Status:', getData.ionetApiStatus);
    } else {
      console.log('❌ GET Failed:', await getResponse.text());
    }
    
    // Test POST endpoint
    console.log('\n2. Testing POST /api/edgen-helper/chat...');
    const postResponse = await fetch(`${baseUrl}/api/edgen-helper/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello! How do I earn points on LayerEdge?',
        conversationHistory: []
      })
    });
    
    console.log('POST Status:', postResponse.status);
    
    if (postResponse.ok) {
      const postData = await postResponse.json();
      console.log('✅ POST Success!');
      console.log('Response:', postData.message?.substring(0, 200) + '...');
      console.log('Is Offline:', postData.isOffline);
      console.log('Mode:', postData.mode);
      return true;
    } else {
      console.log('❌ POST Failed:', await postResponse.text());
      return false;
    }
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
    return false;
  }
}

// Wait a bit for the dev server to start
setTimeout(() => {
  testChatbotAPI().then(success => {
    console.log('\n🏁 Chatbot API test result:', success ? 'SUCCESS' : 'FAILED');
  }).catch(error => {
    console.error('💥 Test failed:', error);
  });
}, 5000); // Wait 5 seconds for dev server to start
