// Test script for the engagement API endpoint
// Run with: node test-engagement-api.js

const BASE_URL = 'http://localhost:3000';

async function testEngagementAPI() {
  console.log('🧪 Testing Engagement API Endpoints...\n');

  try {
    // First, let's get some tweets to test with
    console.log('📋 Fetching tweets...');
    const tweetsResponse = await fetch(`${BASE_URL}/api/tweets?limit=5`);

    if (!tweetsResponse.ok) {
      throw new Error(`Failed to fetch tweets: ${tweetsResponse.status}`);
    }

    const tweets = await tweetsResponse.json();
    console.log(`✅ Found ${tweets.length} tweets\n`);

    if (tweets.length === 0) {
      console.log('⚠️  No tweets found to test with. Please submit some tweets first.');
      return;
    }

    // Test single tweet engagement update
    const testTweet = tweets[0];
    console.log(`🎯 Testing single tweet engagement update for tweet: ${testTweet.id}`);
    console.log(`   Current metrics: ${testTweet.likes} likes, ${testTweet.retweets} retweets, ${testTweet.replies} replies\n`);

    const singleUpdateResponse = await fetch(`${BASE_URL}/api/tweets/${testTweet.id}/engagement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`📡 Single update response status: ${singleUpdateResponse.status}`);

    if (singleUpdateResponse.ok) {
      const singleResult = await singleUpdateResponse.json();
      console.log('✅ Single tweet update successful!');
      console.log(`   Response:`, JSON.stringify(singleResult, null, 2));
    } else {
      const errorData = await singleUpdateResponse.json();
      console.log('❌ Single tweet update failed:');
      console.log(`   Error:`, JSON.stringify(errorData, null, 2));
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test batch engagement update
    const tweetIds = tweets.slice(0, Math.min(3, tweets.length)).map(t => t.id);
    console.log(`🎯 Testing batch engagement update for ${tweetIds.length} tweets:`);
    console.log(`   Tweet IDs: ${tweetIds.join(', ')}\n`);

    const batchUpdateResponse = await fetch(`${BASE_URL}/api/tweets/engagement/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tweetIds: tweetIds,
      }),
    });

    console.log(`📡 Batch update response status: ${batchUpdateResponse.status}`);

    if (batchUpdateResponse.ok) {
      const batchResult = await batchUpdateResponse.json();
      console.log('✅ Batch update successful!');
      console.log(`   Updated ${batchResult.updatedCount} tweets`);
      console.log(`   Response:`, JSON.stringify(batchResult, null, 2));
    } else {
      const errorData = await batchUpdateResponse.json();
      console.log('❌ Batch update failed:');
      console.log(`   Error:`, JSON.stringify(errorData, null, 2));
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test rate limiting
    console.log('🚦 Testing rate limiting (should fail on second immediate request)...');

    const rateLimitTest1 = await fetch(`${BASE_URL}/api/tweets/${testTweet.id}/engagement`, {
      method: 'POST',
    });

    console.log(`📡 First rate limit test: ${rateLimitTest1.status}`);

    // Immediate second request (should be rate limited)
    const rateLimitTest2 = await fetch(`${BASE_URL}/api/tweets/${testTweet.id}/engagement`, {
      method: 'POST',
    });

    console.log(`📡 Second rate limit test: ${rateLimitTest2.status}`);

    if (rateLimitTest2.status === 429) {
      const rateLimitError = await rateLimitTest2.json();
      console.log('✅ Rate limiting working correctly!');
      console.log(`   Rate limit response:`, JSON.stringify(rateLimitError, null, 2));
    } else {
      console.log('⚠️  Rate limiting may not be working as expected');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('   Stack trace:', error.stack);
  }
}

// Test error cases
async function testErrorCases() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 Testing Error Cases...\n');

  try {
    // Test with invalid tweet ID
    console.log('🎯 Testing with invalid tweet ID...');
    const invalidResponse = await fetch(`${BASE_URL}/api/tweets/invalid-id/engagement`, {
      method: 'POST',
    });

    console.log(`📡 Invalid ID response status: ${invalidResponse.status}`);

    if (!invalidResponse.ok) {
      const errorData = await invalidResponse.json();
      console.log('✅ Invalid ID handled correctly!');
      console.log(`   Error response:`, JSON.stringify(errorData, null, 2));
    }

    // Test batch with empty array
    console.log('\n🎯 Testing batch with empty tweet IDs...');
    const emptyBatchResponse = await fetch(`${BASE_URL}/api/tweets/engagement/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tweetIds: [],
      }),
    });

    console.log(`📡 Empty batch response status: ${emptyBatchResponse.status}`);

    if (!emptyBatchResponse.ok) {
      const errorData = await emptyBatchResponse.json();
      console.log('✅ Empty batch handled correctly!');
      console.log(`   Error response:`, JSON.stringify(errorData, null, 2));
    }

    // Test batch with too many IDs
    console.log('\n🎯 Testing batch with too many tweet IDs (>20)...');
    const tooManyIds = Array.from({ length: 25 }, (_, i) => `tweet-${i}`);
    const tooManyResponse = await fetch(`${BASE_URL}/api/tweets/engagement/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tweetIds: tooManyIds,
      }),
    });

    console.log(`📡 Too many IDs response status: ${tooManyResponse.status}`);

    if (!tooManyResponse.ok) {
      const errorData = await tooManyResponse.json();
      console.log('✅ Too many IDs handled correctly!');
      console.log(`   Error response:`, JSON.stringify(errorData, null, 2));
    }

  } catch (error) {
    console.error('❌ Error case test failed:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Engagement API Tests\n');
  console.log('='.repeat(50));

  await testEngagementAPI();
  await testErrorCases();

  console.log('\n' + '='.repeat(50));
  console.log('✨ All tests completed!');
  console.log('\n💡 Next steps:');
  console.log('   1. Check the browser at http://localhost:3000/recent');
  console.log('   2. Verify real-time updates are working');
  console.log('   3. Test the dashboard engagement updates');
  console.log('   4. Submit a new tweet and watch it update');
}

// Run the tests
runAllTests().catch(console.error);
