/**
 * Simple test for Redis and Twitter API issues
 */

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

console.log('🔧 Simple Redis and Twitter API Diagnostic...\n')

// Check Redis Configuration
console.log('1️⃣ Redis Configuration Check:')
const redisHost = process.env.REDIS_HOST
const redisPort = process.env.REDIS_PORT
const redisPassword = process.env.REDIS_PASSWORD
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

console.log(`REDIS_HOST: ${redisHost || 'MISSING'}`)
console.log(`REDIS_PORT: ${redisPort || 'MISSING'}`)
console.log(`REDIS_PASSWORD: ${redisPassword ? 'PRESENT' : 'MISSING'}`)
console.log(`UPSTASH_REDIS_REST_URL: ${upstashUrl ? 'PRESENT' : 'MISSING (COMMENTED OUT)'}`)
console.log(`UPSTASH_REDIS_REST_TOKEN: ${upstashToken ? 'PRESENT' : 'MISSING (COMMENTED OUT)'}`)

// Check Twitter Configuration
console.log('\n2️⃣ Twitter API Configuration Check:')
const bearerToken = process.env.TWITTER_BEARER_TOKEN
const clientId = process.env.TWITTER_CLIENT_ID
const clientSecret = process.env.TWITTER_CLIENT_SECRET

console.log(`TWITTER_BEARER_TOKEN: ${bearerToken ? 'PRESENT' : 'MISSING'}`)
console.log(`TWITTER_CLIENT_ID: ${clientId ? 'PRESENT' : 'MISSING'}`)
console.log(`TWITTER_CLIENT_SECRET: ${clientSecret ? 'PRESENT' : 'MISSING'}`)

if (bearerToken) {
  console.log(`Bearer Token length: ${bearerToken.length} characters`)
  console.log(`Bearer Token format: ${bearerToken.substring(0, 25)}...`)
  console.log(`Starts with expected format: ${bearerToken.startsWith('AAAAAAAAAAAAAAAAAAAAAA') ? '✅ Yes' : '❌ No'}`)
}

// Identify Issues
console.log('\n3️⃣ Issue Analysis:')

const issues = []

// Redis Issues
if (!redisHost || !redisPort || !redisPassword) {
  issues.push('❌ Redis credentials incomplete')
}

if (!upstashUrl || !upstashToken) {
  issues.push('⚠️ Upstash REST API credentials commented out')
  console.log('⚠️ Upstash REST API is commented out in .env.local')
  console.log('   This may be causing "WRONGPASS invalid or missing auth token" errors')
}

if (redisHost && redisHost.includes('upstash.io') && (!upstashUrl || !upstashToken)) {
  issues.push('🔧 Using Upstash host but REST API disabled')
  console.log('🔧 Configuration mismatch: Using Upstash host but REST API is disabled')
}

// Twitter Issues
if (!bearerToken) {
  issues.push('❌ Twitter Bearer Token missing')
}

if (bearerToken && !bearerToken.startsWith('AAAAAAAAAAAAAAAAAAAAAA')) {
  issues.push('⚠️ Twitter Bearer Token format may be incorrect')
}

// Solutions
console.log('\n4️⃣ Recommended Fixes:')

if (issues.length === 0) {
  console.log('✅ No obvious configuration issues detected')
} else {
  console.log('Issues found:')
  issues.forEach(issue => console.log(`   ${issue}`))
}

console.log('\n💡 Immediate Actions:')

console.log('\n🔧 REDIS FIXES:')
console.log('1. Enable Upstash REST API by uncommenting these lines in .env.local:')
console.log('   UPSTASH_REDIS_REST_URL="https://gusc1-national-lemur-31832.upstash.io"')
console.log('   UPSTASH_REDIS_REST_TOKEN="acd4b50ce33b4436b09f6f278848dfb7"')
console.log('')
console.log('2. Update cache service to prefer Upstash REST API over traditional Redis')
console.log('3. This should fix "WRONGPASS invalid or missing auth token" errors')

console.log('\n🐦 TWITTER API FIXES:')
console.log('1. Implement more aggressive caching (4-6 hour TTL for engagement metrics)')
console.log('2. Increase monitoring intervals from 15 minutes to 30-60 minutes')
console.log('3. Add circuit breaker pattern for rate limit failures')
console.log('4. Implement exponential backoff with jitter')

console.log('\n⏱️ RATE LIMITING IMPROVEMENTS:')
console.log('1. Reduce API call frequency by 50-80%')
console.log('2. Cache tweet search results for longer periods')
console.log('3. Batch engagement metric updates')
console.log('4. Add rate limit monitoring and alerts')

console.log('\n🎯 EXPECTED RESULTS:')
console.log('- Redis caching should reduce Twitter API calls by 80-90%')
console.log('- Automated tweet monitoring should work without hitting rate limits')
console.log('- Engagement metrics should update reliably')
console.log('- System should handle temporary API failures gracefully')

console.log('\n✅ Diagnostic completed!')
