#!/usr/bin/env node

/**
 * Test script to verify Twitter oEmbed API scraping
 */

async function testOEmbedScraping() {
  console.log('🔍 Testing Twitter oEmbed API scraping...\n')

  const tweetUrl = 'https://twitter.com/elonmusk/status/1932849663084036106'
  const tweetId = '1932849663084036106'
  
  console.log(`🐦 Testing tweet: ${tweetUrl}`)
  
  try {
    // Use Twitter's oEmbed API (free and no auth required)
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`
    
    console.log(`🌐 Making request to: ${oembedUrl}`)
    
    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LayerEdge/1.0)',
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    console.log(`📊 Response status: ${response.status}`)
    console.log(`📊 Response status text: ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ oEmbed API failed!')
      console.error('📄 Error response:', errorText)
      return
    }

    const oembedData = await response.json()
    console.log('✅ oEmbed API successful!')
    console.log('📄 oEmbed data:', JSON.stringify(oembedData, null, 2))
    
    // Extract basic information
    console.log('\n📋 Extracted Information:')
    console.log(`   Author: ${oembedData.author_name || 'Unknown'}`)
    console.log(`   Author URL: ${oembedData.author_url || 'Unknown'}`)
    console.log(`   Provider: ${oembedData.provider_name || 'Unknown'}`)
    console.log(`   Type: ${oembedData.type || 'Unknown'}`)
    console.log(`   Width: ${oembedData.width || 'Unknown'}`)
    console.log(`   Height: ${oembedData.height || 'Unknown'}`)
    
    if (oembedData.html) {
      console.log('\n📄 HTML Content (first 200 chars):')
      console.log(oembedData.html.substring(0, 200) + '...')
      
      // Try to extract text content
      const textMatch = oembedData.html.match(/<p[^>]*>(.*?)<\/p>/s)
      if (textMatch) {
        const textContent = textMatch[1].replace(/<[^>]*>/g, '').trim()
        console.log('\n📝 Extracted Text:')
        console.log(`   "${textContent}"`)
      }
    }

  } catch (error) {
    console.error('❌ Network error:', error.message)
  }
}

testOEmbedScraping().catch(console.error)
