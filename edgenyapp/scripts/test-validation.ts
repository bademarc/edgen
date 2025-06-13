#!/usr/bin/env tsx

/**
 * Test script to validate LayerEdge community URL validation
 */

import { isValidTwitterUrl, isLayerEdgeCommunityUrl } from '../src/lib/utils'

// Test URLs
const testUrls = [
  // Your actual URL from the screenshot
  'https://x.com/norsultan/status/1930857866453636167',

  // Community post URLs (different formats)
  'https://x.com/i/communities/1890107751621357663',
  'https://x.com/i/communities/1890107751621357663/post/1234567890',

  // Regular tweet URLs that might be from community
  'https://x.com/username/status/1234567890123456789',
  'https://twitter.com/username/status/1234567890123456789',

  // Invalid URLs
  'https://x.com/username',
  'https://google.com',
  'not-a-url',

  // Old community ID (should fail)
  'https://x.com/i/communities/1890107751621363',
]

console.log('🧪 Testing LayerEdge Community URL Validation\n')
console.log('Community ID: 1890107751621357663\n')

testUrls.forEach((url, index) => {
  console.log(`Test ${index + 1}: ${url}`)

  const isValidTwitter = isValidTwitterUrl(url)
  const isValidCommunity = isLayerEdgeCommunityUrl(url)

  console.log(`  ✅ Valid Twitter URL: ${isValidTwitter}`)
  console.log(`  🏘️  Valid Community URL: ${isValidCommunity}`)

  if (isValidTwitter && isValidCommunity) {
    console.log(`  ✅ RESULT: ACCEPTED`)
  } else if (isValidTwitter && !isValidCommunity) {
    console.log(`  ❌ RESULT: REJECTED (Valid Twitter URL but not from community)`)
  } else {
    console.log(`  ❌ RESULT: REJECTED (Invalid Twitter URL)`)
  }

  console.log('')
})

console.log('📝 Explanation of Current Validation Logic:')
console.log('1. First checks if URL is a valid Twitter/X URL')
console.log('2. Then checks if URL contains the LayerEdge community ID')
console.log('3. For regular tweet URLs, temporarily accepts all valid Twitter URLs')
console.log('4. In production, would use Twitter API to verify community membership')

console.log('\n🔍 Testing Your Specific URL:')
const yourUrl = 'https://x.com/norsultan/status/1930857866453636167'
console.log(`URL: ${yourUrl}`)
console.log(`✅ Valid Twitter URL: ${isValidTwitterUrl(yourUrl)}`)
console.log(`🏘️  Valid Community URL: ${isLayerEdgeCommunityUrl(yourUrl)}`)

if (isValidTwitterUrl(yourUrl) && isLayerEdgeCommunityUrl(yourUrl)) {
  console.log('✅ RESULT: Your URL should now be ACCEPTED by the frontend validation!')
  console.log('✅ RESULT: Your URL should now be ACCEPTED by the backend validation!')
} else {
  console.log('❌ RESULT: There might still be an issue...')
}

console.log('\n💡 Next Steps:')
console.log('1. Try submitting your tweet again')
console.log('2. If it still fails, check the browser console for errors')
console.log('3. Check the network tab to see the exact API response')
console.log('4. The validation has been updated to be more permissive')
