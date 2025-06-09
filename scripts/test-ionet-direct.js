// Use Node.js built-in fetch (Node 18+) or polyfill
const fetch = globalThis.fetch || require('node-fetch');
require('dotenv').config();

async function testIoNetDirectly() {
  console.log('🔍 TESTING IO.NET INTELLIGENCE API DIRECTLY');
  console.log('─'.repeat(50));

  const apiKey = process.env.IO_NET_API_KEY;
  const baseUrl = process.env.IO_NET_BASE_URL || 'https://api.intelligence.io.solutions/api';
  const model = process.env.IO_NET_MODEL || 'deepseek-ai/DeepSeek-R1-0528';
  
  console.log('Environment check:');
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 20)}...` : 'MISSING');
  console.log('Base URL:', baseUrl);
  console.log('Model:', model);
  
  if (!apiKey) {
    console.log('❌ API key is missing');
    return false;
  }
  
  try {
    const requestPayload = {
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are Edgen Helper, an AI assistant for LayerEdge community platform.'
        },
        {
          role: 'user',
          content: 'Hello! How do I earn points on LayerEdge?'
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
      top_p: 0.9
    };
    
    console.log('\n🌐 Making request to io.net Intelligence API...');
    console.log(`URL: ${baseUrl}/v1/chat/completions`);
    console.log('Payload:', JSON.stringify(requestPayload, null, 2));
    
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'LayerEdge-EdgenHelper/2.0'
      },
      body: JSON.stringify(requestPayload)
    });
    
    console.log('\n📡 Response received:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('Response Body:', responseText);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('\n✅ SUCCESS!');
        console.log('Model:', data.model);
        console.log('Message:', data.choices?.[0]?.message?.content?.substring(0, 200) + '...');
        console.log('Usage:', data.usage);
        return true;
      } catch (parseError) {
        console.log('❌ Failed to parse JSON response:', parseError.message);
        return false;
      }
    } else {
      console.log('❌ API request failed');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Request error:', error.message);
    return false;
  }
}

testIoNetDirectly().then(success => {
  console.log('\n🏁 Test completed:', success ? 'SUCCESS' : 'FAILED');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
