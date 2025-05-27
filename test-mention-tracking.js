// Test script for mention tracking system

async function testMentionTracking() {
  console.log('🧪 Testing mention tracking system...\n');

  // Test 1: Health check
  console.log('1. Testing health check endpoint...');
  try {
    const healthResponse = await fetch('https://edgen.koyeb.app/api/mentions/track');
    const healthData = await healthResponse.json();
    console.log('✅ Health check response:', JSON.stringify(healthData, null, 2));

    if (!healthData.configuration.hasSecret) {
      console.log('⚠️  WARNING: MENTION_TRACKER_SECRET is not set in production!');
    }

    if (!healthData.configuration.hasBearerToken) {
      console.log('⚠️  WARNING: TWITTER_BEARER_TOKEN is not set in production!');
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  console.log('\n2. Testing manual mention tracking...');
  try {
    const trackResponse = await fetch('https://edgen.koyeb.app/api/mentions/track', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer layeredge-mention-tracker-2024-secure-key',
        'Content-Type': 'application/json'
      }
    });

    const trackData = await trackResponse.json();
    console.log('📊 Manual tracking response:', JSON.stringify(trackData, null, 2));

    if (trackResponse.status === 401) {
      console.log('❌ Authentication failed - secret not configured properly');
    } else if (trackResponse.status === 200) {
      console.log('✅ Manual tracking successful');
    } else {
      console.log(`⚠️  Unexpected status: ${trackResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Manual tracking failed:', error.message);
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
    console.log('🔧 Edge function response:', JSON.stringify(edgeData, null, 2));

    if (edgeResponse.status === 401) {
      console.log('❌ Edge function authentication failed');
    } else if (edgeResponse.status === 200) {
      console.log('✅ Edge function working');
    } else {
      console.log(`⚠️  Edge function status: ${edgeResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Edge function test failed:', error.message);
  }
}

testMentionTracking().catch(console.error);
