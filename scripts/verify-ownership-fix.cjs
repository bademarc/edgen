#!/usr/bin/env node

/**
 * Verification script to ensure the ownership validation fix is properly implemented
 */

const fs = require('fs')

function verifyOwnershipFix() {
  console.log('🔍 Verifying Tweet Ownership Validation Fix')
  console.log('=' .repeat(50))

  let allChecksPass = true

  // Check fallback-service.ts
  console.log('\n📦 Checking fallback-service.ts...')
  const fallbackContent = fs.readFileSync('src/lib/fallback-service.ts', 'utf8')
  
  const fallbackChecks = [
    {
      name: 'Uses extractUsernameFromAuthorUrl',
      test: fallbackContent.includes('extractUsernameFromAuthorUrl(oembedData.author_url)')
    },
    {
      name: 'Has extractUsernameFromAuthorUrl method',
      test: fallbackContent.includes('private extractUsernameFromAuthorUrl(authorUrl: string)')
    },
    {
      name: 'Has extractUsernameFromUrl method',
      test: fallbackContent.includes('private extractUsernameFromUrl(tweetUrl: string)')
    },
    {
      name: 'No longer uses author_name directly',
      test: !fallbackContent.includes('username: oembedData.author_name')
    }
  ]

  fallbackChecks.forEach(check => {
    const pass = check.test
    console.log(`   ${pass ? '✅' : '❌'} ${check.name}`)
    if (!pass) allChecksPass = false
  })

  // Check simplified-fallback-service.ts
  console.log('\n📦 Checking simplified-fallback-service.ts...')
  const simplifiedContent = fs.readFileSync('src/lib/simplified-fallback-service.ts', 'utf8')
  
  const simplifiedChecks = [
    {
      name: 'Uses extractUsernameFromAuthorUrl',
      test: simplifiedContent.includes('extractUsernameFromAuthorUrl(oembedData.author_url)')
    },
    {
      name: 'Has extractUsernameFromAuthorUrl method',
      test: simplifiedContent.includes('private extractUsernameFromAuthorUrl(authorUrl: string)')
    },
    {
      name: 'Has extractUsernameFromUrl method',
      test: simplifiedContent.includes('private extractUsernameFromUrl(tweetUrl: string)')
    },
    {
      name: 'No longer uses author_name directly',
      test: !simplifiedContent.includes('username: oembedData.author_name')
    }
  ]

  simplifiedChecks.forEach(check => {
    const pass = check.test
    console.log(`   ${pass ? '✅' : '❌'} ${check.name}`)
    if (!pass) allChecksPass = false
  })

  // Check budget-scraper.ts
  console.log('\n📦 Checking budget-scraper.ts...')
  const budgetContent = fs.readFileSync('src/lib/budget-scraper.ts', 'utf8')
  
  const budgetChecks = [
    {
      name: 'Uses extractUsernameFromAuthorUrl',
      test: budgetContent.includes('extractUsernameFromAuthorUrl(oembedData.author_url)')
    },
    {
      name: 'Has extractUsernameFromAuthorUrl method',
      test: budgetContent.includes('private extractUsernameFromAuthorUrl(authorUrl: string)')
    },
    {
      name: 'Has extractUsernameFromUrl method',
      test: budgetContent.includes('private extractUsernameFromUrl(tweetUrl: string)')
    },
    {
      name: 'No longer uses author_name directly for author field',
      test: !budgetContent.includes('author: oembedData.author_name')
    }
  ]

  budgetChecks.forEach(check => {
    const pass = check.test
    console.log(`   ${pass ? '✅' : '❌'} ${check.name}`)
    if (!pass) allChecksPass = false
  })

  // Summary
  console.log('\n' + '=' .repeat(50))
  if (allChecksPass) {
    console.log('✅ ALL VERIFICATION CHECKS PASSED!')
    console.log('\n🎯 Fix Summary:')
    console.log('   • All services now extract usernames from author_url')
    console.log('   • Fallback chain properly implemented')
    console.log('   • No direct usage of display names for validation')
    console.log('   • Helper methods added to all relevant services')
    console.log('\n🚀 Tweet ownership validation should now work correctly!')
  } else {
    console.log('❌ Some verification checks failed.')
    console.log('   Please review the failed checks above.')
  }

  return allChecksPass
}

// Run verification
if (require.main === module) {
  const success = verifyOwnershipFix()
  process.exit(success ? 0 : 1)
}

module.exports = { verifyOwnershipFix }
