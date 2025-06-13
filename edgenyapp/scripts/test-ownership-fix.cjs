#!/usr/bin/env node

/**
 * Test script to verify the tweet ownership validation fix
 * This script tests the corrected username extraction from oEmbed data
 */

async function testOwnershipFix() {
  console.log('🧪 Testing Tweet Ownership Validation Fix')
  console.log('=' .repeat(50))

  const testTweetUrl = 'https://x.com/pentestr1/status/1933007672141304207'

  console.log(`\n📋 Test Parameters:`)
  console.log(`- Tweet URL: ${testTweetUrl}`)

  // Test the oEmbed data extraction
  console.log(`\n🔍 Step 1: Testing oEmbed data extraction...`)
  
  try {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(testTweetUrl)}&omit_script=true`
    console.log(`   Making request to: ${oembedUrl}`)
    
    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LayerEdge/1.0)',
      },
      signal: AbortSignal.timeout(10000)
    })

    if (response.ok) {
      const oembedData = await response.json()
      console.log(`✅ oEmbed data retrieved:`)
      console.log(`   - Author Name (display): ${oembedData.author_name}`)
      console.log(`   - Author URL: ${oembedData.author_url}`)

      // Test the username extraction logic (simulating our fix)
      console.log(`\n🔍 Step 2: Testing username extraction logic...`)
      
      // Extract username from author_url (our fix)
      const extractUsernameFromAuthorUrl = (authorUrl) => {
        if (!authorUrl) return null
        try {
          const match = authorUrl.match(/(?:twitter\.com|x\.com)\/([^\/\?]+)/)
          return match ? match[1] : null
        } catch (error) {
          return null
        }
      }

      // Extract username from tweet URL (fallback)
      const extractUsernameFromUrl = (tweetUrl) => {
        if (!tweetUrl) return null
        try {
          const match = tweetUrl.match(/(?:twitter\.com|x\.com)\/([^\/]+)\/status\//)
          return match ? match[1] : null
        } catch (error) {
          return null
        }
      }

      const authorUsername = extractUsernameFromAuthorUrl(oembedData.author_url) || 
                            extractUsernameFromUrl(testTweetUrl) || 
                            oembedData.author_name || 
                            'Unknown'

      console.log(`✅ Username extraction results:`)
      console.log(`   - From author_url: ${extractUsernameFromAuthorUrl(oembedData.author_url)}`)
      console.log(`   - From tweet URL: ${extractUsernameFromUrl(testTweetUrl)}`)
      console.log(`   - Final username: ${authorUsername}`)

      // Test the validation logic
      console.log(`\n🔍 Step 3: Testing validation logic...`)
      
      const storedUsername = 'pentestr1' // From our debug script
      const isMatch = authorUsername.toLowerCase() === storedUsername.toLowerCase()

      console.log(`   - Stored username: "${storedUsername}"`)
      console.log(`   - Extracted username: "${authorUsername}"`)
      console.log(`   - Match result: ${isMatch ? '✅ PASS' : '❌ FAIL'}`)

      // Summary
      console.log(`\n📊 Fix Validation Summary:`)
      if (isMatch) {
        console.log(`✅ SUCCESS: The fix correctly extracts the username`)
        console.log(`   - Before fix: Used "${oembedData.author_name}" (display name)`)
        console.log(`   - After fix: Uses "${authorUsername}" (actual username)`)
        console.log(`   - Validation now passes correctly`)
      } else {
        console.log(`❌ ISSUE: The fix still has problems`)
        console.log(`   - Expected: "${storedUsername}"`)
        console.log(`   - Got: "${authorUsername}"`)
      }

    } else {
      console.log(`❌ oEmbed request failed: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.log(`❌ Test error: ${error.message}`)
  }

  console.log('\n' + '=' .repeat(50))
  console.log('🏁 Ownership fix test completed')
}

// Run the test
if (require.main === module) {
  testOwnershipFix().catch(console.error)
}

module.exports = { testOwnershipFix }
