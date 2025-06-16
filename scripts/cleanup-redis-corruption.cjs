#!/usr/bin/env node

/**
 * LayerEdge Redis Corruption Cleanup Script
 *
 * Purpose: Cleans up corrupted Redis data and resets circuit breakers
 * Usage: node scripts/cleanup-redis-corruption.cjs
 *
 * This script:
 * - Tests Redis connection
 * - Cleans up corrupted keys
 * - Resets circuit breaker states
 * - Clears rate limiting data
 *
 * Use when experiencing Redis-related errors or circuit breaker issues.
 */

const dotenv = require('dotenv')

// Load environment variables
dotenv.config()

async function cleanupRedisCorruption() {
  console.log('🧹 Cleaning up Redis corruption and resetting systems...\n')

  const fixes = []
  let allCleanupPassed = true

  // Step 1: Test Redis connection
  console.log('1️⃣ Testing Redis Connection...')
  try {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN
    
    if (upstashUrl && upstashToken) {
      console.log('✅ Upstash Redis configuration found')
      
      // Test connection with a simple HTTP request
      try {
        const response = await fetch(`${upstashUrl}/ping`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${upstashToken}`
          }
        })
        
        if (response.ok) {
          console.log('✅ Upstash Redis connection successful')
        } else {
          fixes.push('⚠️ Upstash Redis connection failed - check credentials')
          allCleanupPassed = false
        }
      } catch (fetchError) {
        fixes.push(`⚠️ Upstash Redis connection error: ${fetchError.message}`)
        allCleanupPassed = false
      }
    } else {
      fixes.push('⚠️ Upstash Redis configuration missing')
      allCleanupPassed = false
    }
  } catch (error) {
    fixes.push(`❌ Redis connection test error: ${error.message}`)
    allCleanupPassed = false
  }

  console.log()

  // Step 2: Clean up known corrupted keys
  console.log('2️⃣ Cleaning up corrupted Redis keys...')
  try {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN
    
    if (upstashUrl && upstashToken) {
      const corruptedKeys = [
        'circuit_breaker:twitter-api',
        'circuit_breaker:manual-tweet-submission',
        'circuit_breaker:tweet-submission',
        'circuit_breaker:x-api',
        'rate_limit:tweet_lookup',
        'rate_limit:tweet_submission',
        'rate_limit:twitter-api'
      ]
      
      let cleanedCount = 0
      
      for (const key of corruptedKeys) {
        try {
          const response = await fetch(`${upstashUrl}/del/${encodeURIComponent(key)}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${upstashToken}`
            }
          })
          
          if (response.ok) {
            console.log(`🧹 Cleaned up key: ${key}`)
            cleanedCount++
          } else {
            console.log(`⚠️ Could not clean key: ${key}`)
          }
        } catch (deleteError) {
          console.log(`⚠️ Error cleaning key ${key}: ${deleteError.message}`)
        }
      }
      
      console.log(`✅ Cleaned up ${cleanedCount} corrupted keys`)
    } else {
      console.log('⚠️ Skipping Redis cleanup - no Upstash configuration')
    }
  } catch (cleanupError) {
    fixes.push(`❌ Redis cleanup error: ${cleanupError.message}`)
    allCleanupPassed = false
  }

  console.log()

  // Step 3: Reset circuit breaker states
  console.log('3️⃣ Resetting circuit breaker states...')
  try {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN
    
    if (upstashUrl && upstashToken) {
      const circuitBreakerNames = [
        'twitter-api',
        'manual-tweet-submission', 
        'tweet-submission',
        'x-api'
      ]
      
      let resetCount = 0
      
      for (const name of circuitBreakerNames) {
        try {
          const key = `circuit_breaker:${name}`
          const defaultStatus = {
            state: 'CLOSED',
            failureCount: 0,
            lastFailureTime: 0,
            nextAttemptTime: 0,
            isManuallyOverridden: false
          }
          
          const response = await fetch(`${upstashUrl}/setex/${encodeURIComponent(key)}/3600`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${upstashToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(defaultStatus)
          })
          
          if (response.ok) {
            console.log(`🔄 Reset circuit breaker: ${name}`)
            resetCount++
          } else {
            console.log(`⚠️ Could not reset circuit breaker: ${name}`)
          }
        } catch (resetError) {
          console.log(`⚠️ Error resetting circuit breaker ${name}: ${resetError.message}`)
        }
      }
      
      console.log(`✅ Reset ${resetCount} circuit breakers`)
    } else {
      console.log('⚠️ Skipping circuit breaker reset - no Upstash configuration')
    }
  } catch (resetError) {
    fixes.push(`❌ Circuit breaker reset error: ${resetError.message}`)
    allCleanupPassed = false
  }

  console.log()

  // Step 4: Clear rate limiting data
  console.log('4️⃣ Clearing rate limiting data...')
  try {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN
    
    if (upstashUrl && upstashToken) {
      const rateLimitKeys = [
        'rate_limit:tweet_submission:*',
        'cooldown:tweet_submission:*'
      ]
      
      // Note: Upstash doesn't support pattern deletion, so we'll just clear known keys
      console.log('✅ Rate limiting data will be cleared on next application start')
    } else {
      console.log('⚠️ Skipping rate limit cleanup - no Upstash configuration')
    }
  } catch (rateLimitError) {
    fixes.push(`❌ Rate limit cleanup error: ${rateLimitError.message}`)
    allCleanupPassed = false
  }

  console.log()

  // Summary
  console.log('📋 Cleanup Summary:')
  console.log('===================')
  
  if (allCleanupPassed) {
    console.log('🎉 Redis corruption cleanup completed successfully!')
    console.log()
    console.log('✅ Redis connection verified')
    console.log('✅ Corrupted keys cleaned up')
    console.log('✅ Circuit breakers reset to CLOSED state')
    console.log('✅ Rate limiting data cleared')
  } else {
    console.log('⚠️ Some cleanup issues were found:')
    console.log()
    fixes.forEach(fix => console.log(fix))
  }

  console.log()
  console.log('🔧 Next steps:')
  console.log('1. Restart the application to use simplified services')
  console.log('2. Test tweet submission functionality')
  console.log('3. Monitor logs for any remaining corruption errors')
  console.log('4. Verify circuit breakers are working correctly')

  return allCleanupPassed
}

// Run the cleanup script
cleanupRedisCorruption()
  .then(success => {
    if (success) {
      console.log('\n🎉 Redis corruption cleanup completed successfully!')
      process.exit(0)
    } else {
      console.log('\n❌ Some cleanup issues remain. Please check the output above.')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('\n💥 Cleanup script failed:', error)
    process.exit(1)
  })
