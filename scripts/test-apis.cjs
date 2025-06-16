const { config } = require('dotenv')
const { TwitterApi } = require('twitter-api-v2')

// Load environment variables
config()

async function testOEmbedApi(tweetUrl) {
  try {
    console.log('🔍 Testing oEmbed API for:', tweetUrl)
    
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`
    
    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LayerEdge/1.0)',
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const oembedData = await response.json()
    
    console.log('✅ oEmbed API response received')
    console.log('📄 HTML length:', oembedData.html?.length || 0)
    console.log('👤 Author:', oembedData.author_name)
    console.log('🔗 Author URL:', oembedData.author_url)

    // Try to extract engagement metrics from HTML
    const html = oembedData.html || ''
    console.log('🔍 Analyzing HTML for engagement metrics...')
    console.log('HTML snippet:', html.substring(0, 500) + '...')

    // Look for engagement patterns
    const likeMatch = html.match(/(\d+)\s*(?:like|heart|❤️)/gi)
    const retweetMatch = html.match(/(\d+)\s*(?:retweet|share|🔄)/gi)
    const replyMatch = html.match(/(\d+)\s*(?:repl|comment|💬)/gi)

    console.log('Like patterns found:', likeMatch)
    console.log('Retweet patterns found:', retweetMatch)
    console.log('Reply patterns found:', replyMatch)
    
    return {
      success: true,
      data: oembedData
    }
  } catch (error) {
    console.error('❌ oEmbed API test failed:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

async function testTwitterApi(tweetUrl) {
  try {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN
    if (!bearerToken) {
      throw new Error('TWITTER_BEARER_TOKEN not found')
    }
    
    const client = new TwitterApi(bearerToken).readOnly
    console.log('🔍 Testing Twitter API for:', tweetUrl)
    
    const tweetId = tweetUrl.match(/status\/(\d+)/)?.[1]
    if (!tweetId) {
      throw new Error('Invalid tweet URL - could not extract tweet ID')
    }

    console.log('📝 Extracted tweet ID:', tweetId)

    const tweet = await client.v2.singleTweet(tweetId, {
      'tweet.fields': ['public_metrics', 'created_at', 'author_id', 'text'],
      'user.fields': ['username', 'name', 'verified'],
      expansions: ['author_id']
    })

    if (!tweet.data) {
      throw new Error('Tweet not found or not accessible')
    }

    const engagementMetrics = {
      likes: tweet.data.public_metrics?.like_count || 0,
      retweets: tweet.data.public_metrics?.retweet_count || 0,
      replies: tweet.data.public_metrics?.reply_count || 0
    }

    console.log('✅ Twitter API response received')
    console.log('📊 Engagement metrics from API:', engagementMetrics)
    console.log('📝 Tweet text:', tweet.data.text?.substring(0, 100) + '...')
    
    return {
      success: true,
      data: tweet.data,
      engagementMetrics
    }
  } catch (error) {
    console.error('❌ Twitter API test failed:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

async function main() {
  console.log('🚀 Starting API Integration Test')
  console.log('================================')

  // Test with multiple known tweet URLs
  const testUrls = [
    'https://x.com/elonmusk/status/1866267942095704439', // Recent Elon tweet
    'https://x.com/OpenAI/status/1866267942095704439',   // OpenAI tweet
    'https://twitter.com/jack/status/20',                // Jack Dorsey's first tweet
    'https://x.com/twitter/status/1'                     // Very first tweet
  ]

  for (const testUrl of testUrls) {
    console.log(`\n🔍 Testing URL: ${testUrl}`)
    console.log('─'.repeat(50))

    const [oembedResult, twitterApiResult] = await Promise.all([
      testOEmbedApi(testUrl),
      testTwitterApi(testUrl)
    ])

    console.log('\n📊 RESULTS FOR', testUrl)
    console.log('oEmbed API Success:', oembedResult.success)
    console.log('Twitter API Success:', twitterApiResult.success)

    if (twitterApiResult.success && twitterApiResult.engagementMetrics) {
      const metrics = twitterApiResult.engagementMetrics
      const totalEngagement = metrics.likes + metrics.retweets + metrics.replies
      console.log(`🎯 Total Engagement: ${totalEngagement}`)
      console.log('  - Likes:', metrics.likes)
      console.log('  - Retweets:', metrics.retweets)
      console.log('  - Replies:', metrics.replies)

      // If we found working engagement metrics, break and use this URL for further testing
      if (totalEngagement > 0) {
        console.log('✅ Found working engagement metrics! Using this URL for detailed testing.')
        break
      }
    }

    if (oembedResult.success) {
      console.log('✅ oEmbed API working for this URL')
    }
  }

  console.log('\n✅ API Integration Test Complete')
}

main().catch(console.error)
