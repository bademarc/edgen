import dotenv from 'dotenv';
dotenv.config();

async function testIoNetAPI() {
  console.log('🔍 Testing io.net Intelligence API');
  console.log('─'.repeat(50));
  
  const apiKey = process.env.IO_NET_API_KEY;
  const baseUrl = process.env.IO_NET_BASE_URL || 'https://api.intelligence.io.solutions/api';
  const model = process.env.IO_NET_MODEL || 'deepseek-ai/DeepSeek-R1-0528';
  
  console.log('Configuration:');
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
    
    console.log('\n🌐 Making request...');
    console.log(`URL: ${baseUrl}/v1/chat/completions`);
    
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
    
    console.log('\n📡 Response:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('Response Body Length:', responseText.length);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('\n✅ SUCCESS!');
        console.log('Model:', data.model);
        console.log('Message Preview:', data.choices?.[0]?.message?.content?.substring(0, 200) + '...');
        console.log('Usage:', data.usage);
        return true;
      } catch (parseError) {
        console.log('❌ Failed to parse JSON response:', parseError.message);
        console.log('Raw response:', responseText.substring(0, 500));
        return false;
      }
    } else {
      console.log('❌ API request failed');
      console.log('Error response:', responseText.substring(0, 500));
      return false;
    }
    
  } catch (error) {
    console.log('❌ Request error:', error.message);
    return false;
  }
}

testIoNetAPI().then(success => {
  console.log('\n🏁 Test result:', success ? 'SUCCESS' : 'FAILED');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
