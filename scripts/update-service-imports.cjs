#!/usr/bin/env node

/**
 * Service Import Update Script
 * Updates all imports to use simplified services instead of complex ones
 */

const fs = require('fs')
const path = require('path')

// Mapping of old imports to new simplified imports
const importMappings = {
  "import { getCacheService } from '@/lib/cache'": "import { getSimplifiedCacheService } from '@/lib/simplified-cache'",
  "import { getCircuitBreaker } from '@/lib/improved-circuit-breaker'": "import { getSimplifiedCircuitBreaker } from '@/lib/simplified-circuit-breaker'",
  "import { getXApiService } from '@/lib/x-api-service'": "import { getSimplifiedXApiService } from '@/lib/simplified-x-api'",
  "import { getManualTweetSubmissionService } from '@/lib/manual-tweet-submission'": "import { getSimplifiedTweetSubmissionService } from '@/lib/simplified-tweet-submission'",
  "getCacheService()": "getSimplifiedCacheService()",
  "getCircuitBreaker(": "getSimplifiedCircuitBreaker(",
  "getXApiService()": "getSimplifiedXApiService()",
  "getManualTweetSubmissionService()": "getSimplifiedTweetSubmissionService()"
}

// Files to update (excluding the simplified services themselves)
const filesToUpdate = [
  'src/app/api/tweets/submit/route.ts',
  'src/app/api/tweets/verify/route.ts',
  'src/app/api/x-api/tweet/route.ts',
  'src/app/api/x-api/login/route.ts',
  'src/app/api/admin/circuit-breaker/route.ts',
  'src/app/api/test-redis-health/route.ts',
  'src/app/api/health/route.ts',
  'src/app/api/monitoring/health/route.ts',
  'src/app/api/monitoring/redis-health/route.ts'
]

function updateFileImports(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ File not found: ${filePath}`)
      return false
    }

    let content = fs.readFileSync(filePath, 'utf8')
    let updated = false

    // Apply import mappings
    for (const [oldImport, newImport] of Object.entries(importMappings)) {
      if (content.includes(oldImport)) {
        content = content.replace(new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImport)
        updated = true
        console.log(`✅ Updated import in ${filePath}: ${oldImport} -> ${newImport}`)
      }
    }

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`💾 Saved updated file: ${filePath}`)
      return true
    } else {
      console.log(`ℹ️ No updates needed for: ${filePath}`)
      return false
    }

  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message)
    return false
  }
}

async function updateAllServiceImports() {
  console.log('🔄 Updating service imports to use simplified services...\n')

  let totalUpdated = 0
  let totalFiles = 0

  for (const filePath of filesToUpdate) {
    totalFiles++
    console.log(`\n📝 Processing: ${filePath}`)
    
    if (updateFileImports(filePath)) {
      totalUpdated++
    }
  }

  console.log('\n📋 Update Summary:')
  console.log('==================')
  console.log(`Total files processed: ${totalFiles}`)
  console.log(`Files updated: ${totalUpdated}`)
  console.log(`Files unchanged: ${totalFiles - totalUpdated}`)

  if (totalUpdated > 0) {
    console.log('\n✅ Service imports updated successfully!')
    console.log('\n🔧 Next steps:')
    console.log('1. Restart the development server')
    console.log('2. Test tweet submission functionality')
    console.log('3. Monitor logs for simplified service usage')
    console.log('4. Verify no more "[object Object]" errors')
  } else {
    console.log('\n✅ All service imports are already up to date!')
  }

  return totalUpdated > 0
}

// Run the update script
updateAllServiceImports()
  .then(hasUpdates => {
    if (hasUpdates) {
      console.log('\n🎉 Service import updates completed successfully!')
      process.exit(0)
    } else {
      console.log('\n✅ No updates were needed - all imports are current!')
      process.exit(0)
    }
  })
  .catch(error => {
    console.error('\n💥 Update script failed:', error)
    process.exit(1)
  })
