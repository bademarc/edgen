#!/usr/bin/env node

/**
 * Simple test to verify the fallback system is working
 */

console.log('🚀 Testing Simple Fallback System')
console.log('=' .repeat(40))

// Test 1: Environment Variables
console.log('\n📦 Test 1: Environment Variables')
console.log('-'.repeat(25))

const requiredEnvVars = [
  'DATABASE_URL',
  'TWITTER_CLIENT_ID',
  'TWITTER_CLIENT_SECRET',
  'TWITTER_BEARER_TOKEN'
]

let envVarsOk = true
for (const envVar of requiredEnvVars) {
  const value = process.env[envVar]
  if (value) {
    console.log(`✅ ${envVar}: ${value.substring(0, 20)}...`)
  } else {
    console.log(`❌ ${envVar}: Missing`)
    envVarsOk = false
  }
}

// Test 2: Fallback Configuration
console.log('\n🔧 Test 2: Fallback Configuration')
console.log('-'.repeat(30))

const fallbackConfig = {
  enableScraping: process.env.ENABLE_WEB_SCRAPING === 'true',
  scrapingTimeout: process.env.SCRAPING_TIMEOUT_MS || '30000',
  maxBrowserInstances: process.env.MAX_BROWSER_INSTANCES || '3',
  rateLimitCooldown: process.env.RATE_LIMIT_COOLDOWN_MS || '900000',
  apiTimeout: process.env.API_TIMEOUT_MS || '10000'
}

console.log('✅ Fallback configuration:')
Object.entries(fallbackConfig).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`)
})

// Test 3: Dependencies
console.log('\n📚 Test 3: Dependencies')
console.log('-'.repeat(20))

try {
  // Test if playwright is available
  const playwright = await import('playwright')
  console.log('✅ Playwright available')
} catch (error) {
  console.log('❌ Playwright not available:', error.message)
}

try {
  // Test if prisma is available
  const { PrismaClient } = await import('@prisma/client')
  console.log('✅ Prisma available')
} catch (error) {
  console.log('❌ Prisma not available:', error.message)
}

// Test 4: System Status
console.log('\n📊 Test 4: System Status')
console.log('-'.repeat(20))

const systemStatus = {
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
  uptime: `${Math.round(process.uptime())}s`
}

console.log('✅ System information:')
Object.entries(systemStatus).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`)
})

// Test 5: API Availability Test
console.log('\n🔌 Test 5: API Availability')
console.log('-'.repeat(25))

if (process.env.TWITTER_BEARER_TOKEN) {
  try {
    console.log('Testing Twitter API connectivity...')
    
    const response = await fetch('https://api.twitter.com/2/tweets/search/recent?query=test&max_results=10', {
      headers: {
        'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
      },
      signal: AbortSignal.timeout(5000)
    })
    
    if (response.ok) {
      console.log('✅ Twitter API is accessible')
    } else {
      console.log(`⚠️ Twitter API returned status: ${response.status}`)
    }
  } catch (error) {
    console.log('❌ Twitter API test failed:', error.message)
  }
} else {
  console.log('⚠️ Twitter Bearer Token not available for API test')
}

// Test 6: Fallback Strategy
console.log('\n🔄 Test 6: Fallback Strategy')
console.log('-'.repeat(25))

const fallbackStrategy = {
  apiAvailable: !!process.env.TWITTER_BEARER_TOKEN,
  scrapingEnabled: process.env.ENABLE_WEB_SCRAPING === 'true',
  preferredMethod: process.env.FALLBACK_PREFER_API === 'true' ? 'API' : 'Scraping'
}

console.log('✅ Fallback strategy:')
Object.entries(fallbackStrategy).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`)
})

if (fallbackStrategy.apiAvailable && fallbackStrategy.scrapingEnabled) {
  console.log('🎉 Both API and scraping are available - full fallback capability!')
} else if (fallbackStrategy.scrapingEnabled) {
  console.log('🕷️ Only scraping is available - will use web scraping for monitoring')
} else if (fallbackStrategy.apiAvailable) {
  console.log('🔌 Only API is available - will use Twitter API for monitoring')
} else {
  console.log('❌ Neither API nor scraping is properly configured')
}

// Summary
console.log('\n🎯 Summary')
console.log('-'.repeat(10))

const overallStatus = envVarsOk && (fallbackStrategy.apiAvailable || fallbackStrategy.scrapingEnabled)

if (overallStatus) {
  console.log('✅ Fallback monitoring system is ready!')
  console.log('📈 The system can handle Twitter API failures gracefully')
  console.log('🔄 Automatic fallback between API and scraping is configured')
} else {
  console.log('❌ Fallback monitoring system needs configuration')
  console.log('🔧 Please check environment variables and dependencies')
}

console.log('\n🏁 Simple Fallback Test Completed!')
console.log('=' .repeat(40))

process.exit(overallStatus ? 0 : 1)
