// Comprehensive test script for mention tracking system

async function testMentionTracking() {
  console.log('🧪 Testing LayerEdge Mention Tracking System');
  console.log('=' .repeat(50));
  console.log();

  let totalTests = 0;
  let passedTests = 0;
  const issues = [];

  // Test 1: Health check
  console.log('1️⃣ Testing health check endpoint...');
  totalTests++;
  try {
    const healthResponse = await fetch('https://edgen.koyeb.app/api/mentions/track');
    const healthData = await healthResponse.json();

    if (healthData.status === 'ok') {
      console.log('✅ Health check passed');
      passedTests++;

      // Check configuration details
      if (healthData.configuration.hasSecret) {
        console.log('   ✅ MENTION_TRACKER_SECRET is configured');
      } else {
        console.log('   ❌ MENTION_TRACKER_SECRET is missing');
        issues.push('Missing MENTION_TRACKER_SECRET in production');
      }

      if (healthData.configuration.hasBearerToken) {
        console.log('   ✅ TWITTER_BEARER_TOKEN is configured');
      } else {
        console.log('   ❌ TWITTER_BEARER_TOKEN is missing');
        issues.push('Missing TWITTER_BEARER_TOKEN in production');
      }

      if (healthData.configuration.supabaseUrl) {
        console.log('   ✅ Supabase URL is configured');
      } else {
        console.log('   ❌ Supabase URL is missing');
        issues.push('Missing Supabase URL configuration');
      }
    } else {
      console.log('❌ Health check failed:', healthData);
      issues.push('Health check endpoint returned error status');
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    issues.push(`Health check network error: ${error.message}`);
  }
  console.log();

  // Test 2: Manual mention tracking trigger
  console.log('2️⃣ Testing manual mention tracking trigger...');
  totalTests++;
  try {
    const trackResponse = await fetch('https://edgen.koyeb.app/api/mentions/track', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer layeredge-mention-tracker-2024-secure-key',
        'Content-Type': 'application/json'
      }
    });

    if (trackResponse.ok) {
      const trackData = await trackResponse.json();
      console.log('✅ Manual tracking trigger successful');
      console.log('   📊 Result:', JSON.stringify(trackData, null, 2));
      passedTests++;
    } else {
      const errorData = await trackResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.log('❌ Manual tracking trigger failed:', trackResponse.status, errorData);
      issues.push(`Manual tracking failed: ${trackResponse.status} - ${errorData.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log('❌ Manual tracking trigger error:', error.message);
    issues.push(`Manual tracking network error: ${error.message}`);
  }
  console.log();

  // Test 3: Twitter API connectivity
  console.log('3️⃣ Testing Twitter API connectivity...');
  totalTests++;
  try {
    // Test a simple Twitter API call
    const testTweetUrl = 'https://x.com/layeredge/status/1234567890';
    const apiTestResponse = await fetch('https://edgen.koyeb.app/api/scrape/engagement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tweetUrl: testTweetUrl })
    });

    if (apiTestResponse.ok) {
      console.log('✅ Twitter API connectivity test passed');
      passedTests++;
    } else {
      const errorData = await apiTestResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.log('❌ Twitter API connectivity test failed:', apiTestResponse.status);
      issues.push(`Twitter API test failed: ${apiTestResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Twitter API connectivity error:', error.message);
    issues.push(`Twitter API connectivity error: ${error.message}`);
  }
  console.log();

  // Test 4: Web scraping fallback
  console.log('4️⃣ Testing web scraping fallback...');
  totalTests++;
  try {
    const testTweetUrl = 'https://x.com/layeredge/status/1234567890';
    const scrapingTestResponse = await fetch('https://edgen.koyeb.app/api/scrape/tweets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tweetUrl: testTweetUrl })
    });

    if (scrapingTestResponse.ok) {
      console.log('✅ Web scraping fallback test passed');
      passedTests++;
    } else {
      const errorData = await scrapingTestResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.log('❌ Web scraping fallback test failed:', scrapingTestResponse.status);
      issues.push(`Web scraping test failed: ${scrapingTestResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Web scraping fallback error:', error.message);
    issues.push(`Web scraping error: ${error.message}`);
  }
  console.log();

  // Test 5: Database connectivity
  console.log('5️⃣ Testing database connectivity...');
  totalTests++;
  try {
    const dbTestResponse = await fetch('https://edgen.koyeb.app/api/leaderboard?limit=1');

    if (dbTestResponse.ok) {
      const leaderboardData = await dbTestResponse.json();
      console.log('✅ Database connectivity test passed');
      console.log(`   📊 Found ${leaderboardData.length} users in leaderboard`);
      passedTests++;
    } else {
      console.log('❌ Database connectivity test failed:', dbTestResponse.status);
      issues.push(`Database connectivity test failed: ${dbTestResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Database connectivity error:', error.message);
    issues.push(`Database connectivity error: ${error.message}`);
  }
  console.log();

  // Summary
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(30));
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);

  if (issues.length > 0) {
    console.log('\n🚨 ISSUES FOUND:');
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });

    console.log('\n💡 RECOMMENDATIONS:');
    if (issues.some(issue => issue.includes('MENTION_TRACKER_SECRET'))) {
      console.log('   - Set MENTION_TRACKER_SECRET in Koyeb environment variables');
    }
    if (issues.some(issue => issue.includes('TWITTER_BEARER_TOKEN'))) {
      console.log('   - Set TWITTER_BEARER_TOKEN in Koyeb environment variables');
    }
    if (issues.some(issue => issue.includes('Twitter API'))) {
      console.log('   - Check Twitter API credentials and rate limits');
    }
    if (issues.some(issue => issue.includes('Web scraping'))) {
      console.log('   - Check Playwright browser installation in production');
    }
    if (issues.some(issue => issue.includes('Database'))) {
      console.log('   - Check Supabase database connection and credentials');
    }
  } else {
    console.log('\n🎉 All systems operational! The mention tracking system should be working correctly.');
  }
}

// Run the test
testMentionTracking().catch(console.error);
