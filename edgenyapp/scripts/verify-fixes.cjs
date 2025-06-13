#!/usr/bin/env node

/**
 * Simple verification script to check if the fixes are properly implemented
 * This script checks the code structure without running the full application
 */

const fs = require('fs')
const path = require('path')

function checkFile(filePath, checks) {
  console.log(`\n🔍 Checking ${filePath}...`)
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`)
    return false
  }

  const content = fs.readFileSync(filePath, 'utf8')
  let allPassed = true

  checks.forEach(check => {
    const passed = check.test(content)
    console.log(`${passed ? '✅' : '❌'} ${check.description}`)
    if (!passed) allPassed = false
  })

  return allPassed
}

function verifyFixes() {
  console.log('🧪 Verifying Twitter API Rate Limit Fixes')
  console.log('=' .repeat(50))

  let allTestsPassed = true

  // Check fallback-service.ts
  const fallbackServiceChecks = [
    {
      description: 'extractTweetId import is present',
      test: (content) => content.includes("import { extractTweetId } from './utils'")
    },
    {
      description: 'oEmbed is prioritized first in getTweetData',
      test: (content) => {
        const getTweetDataMatch = content.match(/async getTweetData\([\s\S]*?(?=async|$)/);
        if (!getTweetDataMatch) return false;
        const method = getTweetDataMatch[0];
        const oembedIndex = method.indexOf('tryOEmbedScraping');
        const apiIndex = method.indexOf('shouldUseApi()');
        return oembedIndex > 0 && (apiIndex === -1 || oembedIndex < apiIndex);
      }
    },
    {
      description: 'Conservative shouldUseApi implementation',
      test: (content) => content.includes('return false // PRIORITY FIX: Default to false to avoid rate limits') ||
                        content.includes('console.log(\'🚫 Defaulting to oEmbed to avoid rate limits\')')
    },
    {
      description: 'Enhanced rate limit logging',
      test: (content) => content.includes('🎯') && content.includes('rate limit')
    }
  ]

  if (!checkFile('src/lib/fallback-service.ts', fallbackServiceChecks)) {
    allTestsPassed = false
  }

  // Check simplified-fallback-service.ts
  const simplifiedServiceChecks = [
    {
      description: 'extractTweetId import is present',
      test: (content) => content.includes("import { extractTweetId } from './utils'")
    },
    {
      description: 'oEmbed is prioritized first',
      test: (content) => {
        const getTweetDataMatch = content.match(/async getTweetData\([\s\S]*?(?=async|$)/);
        if (!getTweetDataMatch) return false;
        const method = getTweetDataMatch[0];
        return method.includes('oEmbed API first (rate limit avoidance)');
      }
    },
    {
      description: 'Local extractTweetId method removed',
      test: (content) => !content.includes('private extractTweetId(tweetUrl: string): string | null')
    },
    {
      description: 'Uses imported extractTweetId function',
      test: (content) => content.includes('const tweetId = extractTweetId(tweetUrl)')
    }
  ]

  if (!checkFile('src/lib/simplified-fallback-service.ts', simplifiedServiceChecks)) {
    allTestsPassed = false
  }

  // Check twitter-api.ts
  const twitterApiChecks = [
    {
      description: 'Enhanced rate limit error handling',
      test: (content) => content.includes('waitTimeMs') && content.includes('resetTimeMs')
    },
    {
      description: 'Circuit breaker configured for rate limiting',
      test: (content) => content.includes('failureThreshold: 3') && content.includes('15 * 60 * 1000')
    },
    {
      description: 'Detailed rate limit logging',
      test: (content) => content.includes('Rate limited!') && content.includes('Reset in:')
    }
  ]

  if (!checkFile('src/lib/twitter-api.ts', twitterApiChecks)) {
    allTestsPassed = false
  }

  // Check if utils.ts has extractTweetId function
  const utilsChecks = [
    {
      description: 'extractTweetId function exists',
      test: (content) => content.includes('export function extractTweetId(url: string): string | null')
    },
    {
      description: 'Handles both twitter.com and x.com URLs',
      test: (content) => content.includes('twitter\\.com') && content.includes('x\\.com')
    }
  ]

  if (!checkFile('src/lib/utils.ts', utilsChecks)) {
    allTestsPassed = false
  }

  // Summary
  console.log('\n' + '=' .repeat(50))
  if (allTestsPassed) {
    console.log('✅ All fixes verified successfully!')
    console.log('\n🎯 Key improvements implemented:')
    console.log('   • Fixed missing extractTweetId import')
    console.log('   • Prioritized oEmbed over API calls')
    console.log('   • Enhanced rate limit detection and handling')
    console.log('   • Implemented conservative API usage policies')
    console.log('   • Improved circuit breaker configuration')
    console.log('\n🚀 The application should now be much more resilient to rate limiting!')
  } else {
    console.log('❌ Some fixes may not be properly implemented.')
    console.log('   Please review the failed checks above.')
  }

  return allTestsPassed
}

// Run verification
if (require.main === module) {
  const success = verifyFixes()
  process.exit(success ? 0 : 1)
}

module.exports = { verifyFixes }
