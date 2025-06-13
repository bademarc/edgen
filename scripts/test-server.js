async function testServer() {
  try {
    console.log('🔍 Testing server connectivity...');
    
    // Test basic server response
    const response = await fetch('http://localhost:3000');
    console.log('📡 Server response status:', response.status);
    
    if (response.ok) {
      console.log('✅ Server is running and accessible');
      
      // Test quest initialization endpoint
      console.log('🎯 Testing quest initialization endpoint...');
      const questResponse = await fetch('http://localhost:3000/api/quests/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: 'layeredge-admin-secret-2024'
        })
      });
      
      console.log('📊 Quest API response status:', questResponse.status);
      const questResult = await questResponse.text();
      console.log('📋 Quest API response:', questResult);
      
    } else {
      console.log('❌ Server is not responding correctly');
    }
    
  } catch (error) {
    console.error('❌ Error testing server:', error.message);
  }
}

testServer();
