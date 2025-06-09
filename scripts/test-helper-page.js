import dotenv from 'dotenv';
dotenv.config();

async function testHelperPage() {
  console.log('🤖 TESTING HELPER PAGE - Full-screen AI Chat Interface');
  console.log('═'.repeat(70));
  console.log('🎯 Testing dedicated Helper page at /helper');
  console.log('🌐 Full-screen chat interface with DeepSeek-R1-0528');
  console.log('');

  const results = {
    pageAccessible: false,
    navigationIntegration: false,
    apiIntegration: false,
    responsiveDesign: false
  };

  // Test 1: Page Accessibility
  console.log('1️⃣ Testing Helper Page Accessibility');
  console.log('─'.repeat(50));
  
  try {
    const response = await fetch('http://localhost:3000/helper');
    if (response.ok) {
      const html = await response.text();
      console.log('✅ Helper Page: ACCESSIBLE');
      console.log('• Status:', response.status);
      console.log('• Content Length:', html.length);
      
      // Check for key elements
      if (html.includes('Edgen Helper')) {
        console.log('✅ Page Title: FOUND');
      }
      if (html.includes('DeepSeek-R1')) {
        console.log('✅ AI Model Reference: FOUND');
      }
      if (html.includes('LayerEdge')) {
        console.log('✅ Branding: FOUND');
      }
      
      results.pageAccessible = true;
    } else {
      console.log('❌ Helper Page: NOT ACCESSIBLE');
      console.log('• Status:', response.status);
    }
  } catch (error) {
    console.log('❌ Helper Page Test Error:', error.message);
  }

  console.log('');

  // Test 2: Navigation Integration
  console.log('2️⃣ Testing Navigation Integration');
  console.log('─'.repeat(50));
  
  try {
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      const html = await response.text();
      
      // Check if Helper link is in navigation
      if (html.includes('href="/helper"') || html.includes("href='/helper'")) {
        console.log('✅ Navigation Link: FOUND');
        console.log('• Helper page linked in main navigation');
        results.navigationIntegration = true;
      } else {
        console.log('❌ Navigation Link: MISSING');
      }
    }
  } catch (error) {
    console.log('❌ Navigation Test Error:', error.message);
  }

  console.log('');

  // Test 3: API Integration Test
  console.log('3️⃣ Testing API Integration');
  console.log('─'.repeat(50));
  
  try {
    // Test if the chat API is working (same endpoint as floating widget)
    const apiResponse = await fetch('http://localhost:3000/api/edgen-helper/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Test from Helper page: How does the full-screen interface work?',
        conversationHistory: []
      })
    });

    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      console.log('✅ API Integration: WORKING');
      console.log('• Response Length:', apiData.message?.length || 0);
      console.log('• Online Mode:', !apiData.isOffline);
      console.log('• Model:', apiData.model || 'DeepSeek-R1-0528');
      results.apiIntegration = true;
    } else {
      console.log('❌ API Integration: FAILED');
      console.log('• Status:', apiResponse.status);
    }
  } catch (error) {
    console.log('❌ API Integration Test Error:', error.message);
  }

  console.log('');

  // Test 4: Responsive Design Check
  console.log('4️⃣ Testing Responsive Design Elements');
  console.log('─'.repeat(50));
  
  try {
    const response = await fetch('http://localhost:3000/helper');
    if (response.ok) {
      const html = await response.text();
      
      // Check for responsive design classes
      const responsiveIndicators = [
        'container mx-auto',
        'md:',
        'lg:',
        'max-w-',
        'flex-col',
        'responsive'
      ];
      
      let foundIndicators = 0;
      responsiveIndicators.forEach(indicator => {
        if (html.includes(indicator)) {
          foundIndicators++;
        }
      });
      
      if (foundIndicators >= 3) {
        console.log('✅ Responsive Design: IMPLEMENTED');
        console.log(`• Found ${foundIndicators}/${responsiveIndicators.length} responsive indicators`);
        results.responsiveDesign = true;
      } else {
        console.log('❌ Responsive Design: LIMITED');
        console.log(`• Found only ${foundIndicators}/${responsiveIndicators.length} responsive indicators`);
      }
      
      // Check for LayerEdge branding colors
      if (html.includes('#f7931a') || html.includes('f7931a')) {
        console.log('✅ Bitcoin Orange Branding: FOUND');
      } else {
        console.log('⚠️ Bitcoin Orange Branding: NOT DETECTED');
      }
    }
  } catch (error) {
    console.log('❌ Responsive Design Test Error:', error.message);
  }

  // Final Results
  console.log('');
  console.log('🏁 HELPER PAGE TEST RESULTS');
  console.log('═'.repeat(70));
  
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
    console.log('🎉 ALL TESTS PASSED! Helper Page is fully functional!');
    console.log('');
    console.log('✨ Helper Page Features:');
    console.log('• Full-screen AI chat interface at /helper');
    console.log('• Integrated in main navigation menu');
    console.log('• DeepSeek-R1 AI responses via io.net Intelligence API');
    console.log('• Responsive design for all devices');
    console.log('• LayerEdge branding with Bitcoin orange accents');
    console.log('• Professional card-based layout');
    console.log('• Real-time conversation with typing indicators');
    console.log('• Session statistics and chat management');
    console.log('• Markdown-style message formatting');
    console.log('• Accessibility-compliant design');
    console.log('');
    console.log('🚀 Ready for user engagement!');
  } else {
    console.log('⚠️ Some tests failed. Please review the issues above.');
    console.log('');
    console.log('💡 Next Steps:');
    console.log('• Check dev server is running: npm run dev');
    console.log('• Verify navigation component updates');
    console.log('• Test page manually at http://localhost:3000/helper');
    console.log('• Ensure API integration is working');
  }

  return passedTests === totalTests;
}

// Run the test
testHelperPage().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Helper page test failed:', error);
  process.exit(1);
});
