// Test script for monitoring status fix
async function testMonitoringFix() {
  console.log('🧪 Testing monitoring status fix...\n');

  // Test 1: Health check for mention tracking
  console.log('1. Testing mention tracking health check...');
  try {
    const healthResponse = await fetch('https://edgen.koyeb.app/api/mentions/track');
    const healthData = await healthResponse.json();
    console.log('✅ Mention tracking health:', JSON.stringify(healthData, null, 2));
    
    if (healthData.configuration.hasSecret && healthData.configuration.hasBearerToken) {
      console.log('✅ Environment variables are properly configured!');
    } else {
      console.log('❌ Environment variables still missing');
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  console.log('\n2. Testing manual mention tracking trigger...');
  try {
    const trackResponse = await fetch('https://edgen.koyeb.app/api/mentions/track', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer layeredge-mention-tracker-2024-secure-key',
        'Content-Type': 'application/json'
      }
    });
    
    const trackData = await trackResponse.json();
    console.log('📊 Manual tracking result:', JSON.stringify(trackData, null, 2));
    
    if (trackResponse.status === 200) {
      console.log('✅ Manual mention tracking is working!');
      if (trackData.edgeFunctionResult) {
        console.log('📈 Edge function result:', trackData.edgeFunctionResult);
      }
    } else {
      console.log(`❌ Manual tracking failed with status: ${trackResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Manual tracking test failed:', error.message);
  }

  console.log('\n3. Testing direct edge function...');
  try {
    const edgeResponse = await fetch('https://bzqayhnlogpaxfcmmrlq.supabase.co/functions/v1/track-mentions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer layeredge-mention-tracker-2024-secure-key',
        'Content-Type': 'application/json'
      }
    });
    
    const edgeData = await edgeResponse.json();
    console.log('🔧 Direct edge function result:', JSON.stringify(edgeData, null, 2));
    
    if (edgeResponse.status === 200) {
      console.log('✅ Edge function is working directly!');
      if (edgeData.tweetsProcessed > 0) {
        console.log(`🎉 Found and processed ${edgeData.tweetsProcessed} tweets!`);
      } else {
        console.log('📝 No new tweets found (this is normal if no new mentions since last run)');
      }
    } else {
      console.log(`❌ Edge function failed with status: ${edgeResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Direct edge function test failed:', error.message);
  }

  console.log('\n🎯 Summary:');
  console.log('- If all tests pass, the automated mention tracking system is working');
  console.log('- The dashboard monitoring status should now display correctly');
  console.log('- Your tweet with "@layeredge" and "$EDGEN" should be processed');
  console.log('- Future tweets will be automatically detected every 15 minutes');
}

testMonitoringFix().catch(console.error);
