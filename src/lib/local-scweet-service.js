#!/usr/bin/env node
/**
 * Local Scweet Service for Windows/Local Development
 * Provides tweet data fetching without Docker dependencies
 * Addresses Priority 1 (Network Resolution) and Priority 4 (Twikit Integration)
 */

const express = require('express')
const cors = require('cors')
const { chromium } = require('playwright')

const app = express()
const PORT = process.env.PORT || 8001

// Middleware
app.use(cors())
app.use(express.json())

// Global variables
let browser = null
let isInitialized = false

// Initialize Playwright browser
async function initializeBrowser() {
  try {
    console.log('🔍 Initializing Playwright browser...')
    
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    })
    
    console.log('✅ Playwright browser initialized successfully')
    isInitialized = true
    return true
  } catch (error) {
    console.error('❌ Failed to initialize Playwright browser:', error)
    isInitialized = false
    return false
  }
}

// Extract tweet ID from URL
function extractTweetId(url) {
  const tweetIdMatch = url.match(/status\/(\d+)/)
  if (!tweetIdMatch) {
    throw new Error('Invalid tweet URL format')
  }
  return tweetIdMatch[1]
}

// Check if content is LayerEdge community related
function isLayerEdgeCommunity(content) {
  const contentLower = content.toLowerCase()
  return contentLower.includes('@layeredge') || contentLower.includes('$edgen')
}

// Scrape tweet data using Playwright
async function scrapeTweetData(tweetUrl) {
  if (!browser) {
    throw new Error('Browser not initialized')
  }
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  })
  
  const page = await context.newPage()
  
  try {
    console.log(`🐦 Scraping tweet: ${tweetUrl}`)
    
    // Navigate to tweet
    await page.goto(tweetUrl, { waitUntil: 'networkidle', timeout: 30000 })
    
    // Wait for tweet content to load
    await page.waitForSelector('[data-testid="tweetText"], [data-testid="tweet"]', { timeout: 10000 })
    
    // Extract tweet data
    const tweetData = await page.evaluate(() => {
      // Try to find tweet text
      const tweetTextElement = document.querySelector('[data-testid="tweetText"]')
      const content = tweetTextElement ? tweetTextElement.innerText : ''
      
      // Try to find author information
      const authorElement = document.querySelector('[data-testid="User-Name"]')
      const authorName = authorElement ? authorElement.innerText : ''
      
      // Try to find username
      const usernameElement = document.querySelector('[data-testid="User-Name"] a')
      const username = usernameElement ? usernameElement.getAttribute('href')?.replace('/', '') : ''
      
      // Try to find engagement metrics
      const likeElement = document.querySelector('[data-testid="like"]')
      const retweetElement = document.querySelector('[data-testid="retweet"]')
      const replyElement = document.querySelector('[data-testid="reply"]')
      
      const likes = likeElement ? parseInt(likeElement.getAttribute('aria-label')?.match(/\d+/)?.[0] || '0') : 0
      const retweets = retweetElement ? parseInt(retweetElement.getAttribute('aria-label')?.match(/\d+/)?.[0] || '0') : 0
      const replies = replyElement ? parseInt(replyElement.getAttribute('aria-label')?.match(/\d+/)?.[0] || '0') : 0
      
      return {
        content,
        author: {
          name: authorName,
          username: username
        },
        engagement: {
          likes,
          retweets,
          replies
        }
      }
    })
    
    await context.close()
    
    if (!tweetData.content) {
      throw new Error('Could not extract tweet content')
    }
    
    console.log('✅ Tweet data extracted successfully')
    return tweetData
    
  } catch (error) {
    await context.close()
    throw error
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'local-scweet',
    timestamp: new Date().toISOString(),
    scweet_ready: isInitialized,
    twikit_ready: false, // Not implemented in local version
    browser_ready: browser !== null
  })
})

// Tweet data endpoint
app.post('/tweet', async (req, res) => {
  try {
    const { tweet_url } = req.body
    
    if (!tweet_url) {
      return res.status(400).json({ error: 'tweet_url is required' })
    }
    
    // Validate URL format
    if (!tweet_url.includes('status/')) {
      return res.status(400).json({ 
        error: 'Invalid tweet URL format. Expected format: https://x.com/username/status/1234567890'
      })
    }
    
    if (!isInitialized) {
      return res.status(503).json({ error: 'Service not initialized' })
    }
    
    const tweetId = extractTweetId(tweet_url)
    const tweetData = await scrapeTweetData(tweet_url)
    
    const response = {
      tweet_id: tweetId,
      content: tweetData.content,
      author: {
        username: tweetData.author.username || 'unknown',
        display_name: tweetData.author.name || 'Unknown User',
        verified: false,
        followers_count: 0,
        following_count: 0
      },
      engagement: {
        likes: tweetData.engagement.likes,
        retweets: tweetData.engagement.retweets,
        replies: tweetData.engagement.replies
      },
      created_at: new Date().toISOString(),
      source: 'local-scweet',
      is_from_layeredge_community: isLayerEdgeCommunity(tweetData.content)
    }
    
    res.json(response)
    
  } catch (error) {
    console.error('Error fetching tweet:', error)
    res.status(500).json({ 
      error: 'Failed to fetch tweet data',
      details: error.message 
    })
  }
})

// Engagement metrics endpoint
app.post('/engagement', async (req, res) => {
  try {
    const { tweet_url } = req.body
    
    if (!tweet_url) {
      return res.status(400).json({ error: 'tweet_url is required' })
    }
    
    if (!isInitialized) {
      return res.status(503).json({ error: 'Service not initialized' })
    }
    
    const tweetData = await scrapeTweetData(tweet_url)
    
    const response = {
      likes: tweetData.engagement.likes,
      retweets: tweetData.engagement.retweets,
      replies: tweetData.engagement.replies,
      timestamp: new Date().toISOString(),
      source: 'local-scweet'
    }
    
    res.json(response)
    
  } catch (error) {
    console.error('Error fetching engagement:', error)
    res.status(500).json({ 
      error: 'Failed to fetch engagement metrics',
      details: error.message 
    })
  }
})

// Twikit endpoints (placeholder - not implemented in local version)
app.post('/twikit/tweet', (req, res) => {
  res.status(503).json({ 
    error: 'Twikit not available in local service',
    message: 'Use Docker version for full Twikit integration'
  })
})

app.post('/twikit/engagement', (req, res) => {
  res.status(503).json({ 
    error: 'Twikit not available in local service',
    message: 'Use Docker version for full Twikit integration'
  })
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error)
  res.status(500).json({ 
    error: 'Internal server error',
    details: error.message 
  })
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down local Scweet service...')
  
  if (browser) {
    await browser.close()
    console.log('✅ Browser closed')
  }
  
  process.exit(0)
})

// Start server
async function startServer() {
  console.log('🚀 Starting Local Scweet Service...')
  console.log('=' .repeat(50))
  
  // Initialize browser
  const browserReady = await initializeBrowser()
  
  if (!browserReady) {
    console.log('⚠️ Browser initialization failed, but starting server anyway')
    console.log('💡 Some features may not work without browser')
  }
  
  // Start Express server
  app.listen(PORT, () => {
    console.log('')
    console.log('✅ Local Scweet Service started successfully!')
    console.log(`🌐 Server running on: http://localhost:${PORT}`)
    console.log(`🔍 Health check: http://localhost:${PORT}/health`)
    console.log(`🐦 Tweet endpoint: http://localhost:${PORT}/tweet`)
    console.log('')
    console.log('📋 Service Status:')
    console.log(`   Browser Ready: ${browserReady ? '✅' : '❌'}`)
    console.log(`   Scweet Ready: ${isInitialized ? '✅' : '❌'}`)
    console.log(`   Twikit Ready: ❌ (Not available in local version)`)
    console.log('')
    console.log('🎯 Ready to handle tweet requests!')
    console.log('💡 Test with: curl -X POST http://localhost:8001/tweet -H "Content-Type: application/json" -d \'{"tweet_url": "https://x.com/nxrsultxn/status/1931733077400641998"}\'')
  })
}

// Start the service
if (require.main === module) {
  startServer().catch(error => {
    console.error('💥 Failed to start local Scweet service:', error)
    process.exit(1)
  })
}

module.exports = { app, startServer }
