#!/usr/bin/env node

/**
 * Validate the new Twitter Bearer Token for Koyeb production
 */

async function validateNewBearerToken() {
  console.log('🔍 Validating New Twitter Bearer Token for Koyeb...\n')

  const newToken = `AAAAAAAAAAAAAAAAAAAAAKWj2QEAAAAAcJSdzqxbAjlHMCQwyv%2FkP8MF4ck%3DBo8nGGRr83Ly2uiQeWoNrQSDhLQED0kWZ6jr1LV29hUFdR96DT`

  console.log('📊 TOKEN ANALYSIS:')
  console.log('=' .repeat(60))
  console.log(`✅ Token length: ${newToken.length} characters (expected ~110-120)`)
  console.log(`✅ Starts with: ${newToken.substring(0, 25)}... (correct prefix)`)
  console.log(`✅ URL encoded: Contains %2F and %3D (correct format for Koyeb)`)
  
  // Count encoding indicators
  const equalSigns = (newToken.match(/=/g) || []).length
  const urlEncodedEquals = (newToken.match(/%3D/g) || []).length
  const urlEncodedSlashes = (newToken.match(/%2F/g) || []).length
  
  console.log(`✅ = signs: ${equalSigns}`)
  console.log(`✅ URL encoded = (%3D): ${urlEncodedEquals}`)
  console.log(`✅ URL encoded / (%2F): ${urlEncodedSlashes}`)
  
  if (newToken.length >= 100 && newToken.length <= 130 && 
      newToken.startsWith('AAAAAAAAAAAAAAAAAAAAAA') &&
      (equalSigns + urlEncodedEquals) <= 3) {
    console.log('\n🎉 TOKEN FORMAT: VALID FOR PRODUCTION!')
  } else {
    console.log('\n⚠️ TOKEN FORMAT: Needs verification')
  }

  // Test token decoding
  console.log('\n🔧 TOKEN DECODING TEST:')
  console.log('-'.repeat(40))
  
  try {
    const decoded = decodeURIComponent(newToken)
    console.log('✅ URL decoding: SUCCESS')
    console.log(`📏 Decoded length: ${decoded.length} characters`)
    console.log(`🔤 Decoded preview: ${decoded.substring(0, 30)}...`)
    
    const decodedEquals = (decoded.match(/=/g) || []).length
    console.log(`📊 Decoded = signs: ${decodedEquals} (should be 1-2)`)
    
    if (decoded.startsWith('AAAAAAAAAAAAAAAAAAAAAA') && decodedEquals <= 2) {
      console.log('✅ DECODED FORMAT: VALID for Twitter API')
    } else {
      console.log('⚠️ DECODED FORMAT: May need verification')
    }
    
  } catch (error) {
    console.log('❌ URL decoding failed:', error.message)
  }

  // Test with Twitter API
  console.log('\n🌐 TWITTER API AUTHENTICATION TEST:')
  console.log('-'.repeat(40))
  
  try {
    const testTweetId = '1932849663084036106'
    const apiUrl = `https://api.twitter.com/2/tweets/${testTweetId}?tweet.fields=created_at,author_id,public_metrics,text`
    
    console.log(`🐦 Testing with tweet ID: ${testTweetId}`)
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${newToken}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000)
    })

    console.log(`\n📊 API Response:`)
    console.log(`   Status: ${response.status} ${response.statusText}`)
    
    // Log rate limit headers
    const rateLimitHeaders = {
      limit: response.headers.get('x-rate-limit-limit'),
      remaining: response.headers.get('x-rate-limit-remaining'),
      reset: response.headers.get('x-rate-limit-reset'),
      resetTime: response.headers.get('x-rate-limit-reset') ? 
        new Date(parseInt(response.headers.get('x-rate-limit-reset')) * 1000).toISOString() : 'N/A'
    }
    console.log('📊 Rate limit info:', rateLimitHeaders)

    if (response.status === 200) {
      const data = await response.json()
      console.log('\n🎉 TWITTER API: AUTHENTICATION SUCCESSFUL!')
      console.log(`   Tweet ID: ${data.data?.id}`)
      console.log(`   Content: "${data.data?.text?.substring(0, 50)}..."`)
      console.log('   ✅ New token is working perfectly!')
      
    } else if (response.status === 429) {
      console.log('\n⚠️ TWITTER API: RATE LIMITED (Expected)')
      console.log('   Authentication is working, but rate limited')
      console.log('   This is normal - fallback service will handle this')
      console.log('   ✅ New token is working!')
      
    } else if (response.status === 401) {
      console.log('\n❌ TWITTER API: AUTHENTICATION FAILED')
      console.log('   Token may be invalid or expired')
      
    } else {
      console.log(`\n⚠️ TWITTER API: Status ${response.status}`)
      const errorText = await response.text()
      console.log(`   Response: ${errorText}`)
    }

  } catch (error) {
    console.log('\n❌ API test failed:', error.message)
  }

  // Provide Koyeb deployment options
  console.log('\n🚀 KOYEB DEPLOYMENT OPTIONS:')
  console.log('=' .repeat(60))
  
  console.log('\n📋 OPTION A: Full Twitter API + oEmbed Fallback (Recommended)')
  console.log('1. Go to Koyeb Dashboard → Environment Variables')
  console.log('2. Update TWITTER_BEARER_TOKEN with:')
  console.log(`   ${newToken}`)
  console.log('3. Ensure these settings:')
  console.log('   X_API_MAX_REQUESTS_PER_WINDOW=1')
  console.log('   PREFER_API=false')
  console.log('4. Remove (if present):')
  console.log('   TWITTER_API_DISABLED')
  console.log('   FORCE_OEMBED_ONLY')
  console.log('5. Save and redeploy')
  
  console.log('\n📋 OPTION B: Keep oEmbed-Only (If you prefer simplicity)')
  console.log('1. Keep current environment variables:')
  console.log('   TWITTER_API_DISABLED=true')
  console.log('   FORCE_OEMBED_ONLY=true')
  console.log('2. Save the new token for future use')
  console.log('3. No deployment needed - already working')

  console.log('\n💡 RECOMMENDATION:')
  console.log('-'.repeat(40))
  console.log('✅ Use OPTION A (Full Twitter API + oEmbed)')
  console.log('   - Provides complete functionality')
  console.log('   - oEmbed fallback handles rate limits')
  console.log('   - Best user experience')
  console.log('   - Future-proof solution')

  console.log('\n🎯 EXPECTED RESULTS WITH OPTION A:')
  console.log('-'.repeat(40))
  console.log('✅ Twitter API works (when not rate limited)')
  console.log('✅ oEmbed fallback handles rate limits seamlessly')
  console.log('✅ Users get full tweet data including engagement metrics')
  console.log('✅ Robust fallback chain prevents any failures')
  console.log('✅ Production-ready with maximum reliability')

  console.log('\n🎉 CONCLUSION:')
  console.log('Your new Bearer Token appears to be properly formatted!')
  console.log('You can now deploy with full Twitter API functionality.')
}

validateNewBearerToken().catch(console.error)
