import dotenv from 'dotenv'
import { getCacheService } from '../src/lib/cache.ts'

// Load environment variables
dotenv.config()

async function clearCorruptedCache() {
  console.log('🧹 Clearing corrupted cache entries...')
  
  const cache = getCacheService()
  
  try {
    // List of cache keys that might be corrupted
    const keysToCheck = [
      'leaderboard:10',
      'leaderboard:50', 
      'leaderboard:100',
      'leaderboard:top100',
      'analytics:daily',
      'basic_stats'
    ]
    
    console.log('🔍 Checking and clearing potentially corrupted cache entries...')
    
    for (const key of keysToCheck) {
      console.log(`\n🔍 Checking key: ${key}`)
      
      try {
        const value = await cache.get(key)
        
        if (value === null) {
          console.log(`   ✅ Key ${key} is clean (not found)`)
        } else if (Array.isArray(value) && value.length === 0) {
          console.log(`   ⚠️ Key ${key} has empty array, clearing...`)
          await cache.delete(key)
        } else if (Array.isArray(value) && value.length > 0) {
          console.log(`   ✅ Key ${key} has valid data (${value.length} items)`)
        } else if (typeof value === 'object' && value !== null) {
          console.log(`   ✅ Key ${key} has valid object data`)
        } else {
          console.log(`   ✅ Key ${key} has valid data`)
        }
      } catch (error) {
        console.log(`   ❌ Key ${key} is corrupted, clearing...`)
        console.log(`      Error: ${error.message}`)
        await cache.delete(key)
      }
    }

    // Test cache functionality after clearing
    console.log('\n🧪 Testing cache functionality after clearing...')
    
    const testKey = 'test:clear:cache'
    const testData = { message: 'Cache test after clearing', timestamp: Date.now() }
    
    await cache.set(testKey, testData, 60)
    const retrieved = await cache.get(testKey)
    
    if (retrieved && retrieved.message === testData.message) {
      console.log('✅ Cache is working correctly after clearing')
      await cache.delete(testKey) // Clean up test data
    } else {
      console.log('❌ Cache still has issues after clearing')
    }

    console.log('\n🎉 Cache clearing completed!')
    
    return { success: true }

  } catch (error) {
    console.error('❌ Cache clearing failed:', error)
    return { success: false, error: error.message }
  }
}

// Run the clearing
clearCorruptedCache()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Cache clearing completed successfully')
      process.exit(0)
    } else {
      console.log('\n❌ Cache clearing failed')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Clearing execution failed:', error)
    process.exit(1)
  })
