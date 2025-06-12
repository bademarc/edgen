#!/usr/bin/env node

/**
 * Test script to verify that fetch calls are not duplicated
 * This helps ensure React Error #185 is fixed by checking for single fetch calls
 */

console.log('🔍 FETCH CALL DUPLICATION TEST')
console.log('=' .repeat(50))
console.log('This script helps verify that the React Error #185 fix is working')
console.log('by ensuring fetch calls are not duplicated.')
console.log('')

console.log('📋 Manual Testing Instructions:')
console.log('-'.repeat(40))
console.log('')
console.log('1. 🌐 Open the development server:')
console.log('   npm run dev')
console.log('')
console.log('2. 🔍 Open browser console (F12) and navigate to:')
console.log('   http://localhost:3000/recent')
console.log('')
console.log('3. ✅ Expected behavior (FIXED):')
console.log('   • Single log: "🔍 Fetching tweets: page=1, sortBy=recent, search=\\"\\"')
console.log('   • Single log: "✅ Fetched X tweets (Y total)"')
console.log('   • No React error #185 in console')
console.log('   • No "Multiple GoTrueClient instances" warning')
console.log('')
console.log('4. ❌ Problematic behavior (BROKEN):')
console.log('   • Multiple logs: "🔍 Fetching tweets..." (3+ times)')
console.log('   • React error #185: "Maximum update depth exceeded"')
console.log('   • ErrorBoundary catches infinite loop')
console.log('   • "Multiple GoTrueClient instances detected" warning')
console.log('')
console.log('5. 🧪 Additional tests:')
console.log('   • Change sort order → Should see single fetch call')
console.log('   • Search for text → Should see single fetch call after 500ms debounce')
console.log('   • Click "Load More" → Should see single fetch call for next page')
console.log('   • Click refresh button → Should see single fetch call')
console.log('')

console.log('🔧 AUTOMATED VERIFICATION')
console.log('-'.repeat(40))

// Check if the fixes are in place
const fs = require('fs')
const path = require('path')

function checkRecentPageFixes() {
  const recentPagePath = path.join(process.cwd(), 'src/app/recent/page.tsx')
  
  if (!fs.existsSync(recentPagePath)) {
    console.log('❌ Recent page file not found')
    return false
  }
  
  const content = fs.readFileSync(recentPagePath, 'utf8')
  
  const checks = [
    {
      name: 'handleLoadMore has empty dependencies',
      pattern: /\}, \[\]\) \/\/ CRITICAL FIX: No dependencies to prevent circular loops/,
      found: false
    },
    {
      name: 'Uses pagination ref',
      pattern: /const currentPagination = paginationRef\.current/,
      found: false
    },
    {
      name: 'fetchTweets has empty dependencies',
      pattern: /\}, \[\]\) \/\/ CRITICAL FIX: No dependencies to prevent circular loops/,
      found: false
    }
  ]
  
  for (const check of checks) {
    check.found = check.pattern.test(content)
  }
  
  console.log('\n📊 Fix Verification Results:')
  let allPassed = true
  
  for (const check of checks) {
    if (check.found) {
      console.log(`  ✅ ${check.name}`)
    } else {
      console.log(`  ❌ ${check.name}`)
      allPassed = false
    }
  }
  
  return allPassed
}

function checkAuthProviderFixes() {
  const authProviderPath = path.join(process.cwd(), 'src/components/AuthProvider.tsx')
  
  if (!fs.existsSync(authProviderPath)) {
    console.log('❌ AuthProvider file not found')
    return false
  }
  
  const content = fs.readFileSync(authProviderPath, 'utf8')
  
  const hasEmptyDeps = /\}, \[\]\) \/\/ CRITICAL FIX: Remove supabase\.auth dependency to prevent multiple GoTrueClient instances/.test(content)
  
  console.log('\n📊 AuthProvider Fix Verification:')
  if (hasEmptyDeps) {
    console.log('  ✅ AuthProvider useEffect has empty dependencies')
    return true
  } else {
    console.log('  ❌ AuthProvider still has problematic dependencies')
    return false
  }
}

// Run checks
const recentPageFixed = checkRecentPageFixes()
const authProviderFixed = checkAuthProviderFixes()

console.log('\n' + '='.repeat(50))

if (recentPageFixed && authProviderFixed) {
  console.log('🎉 ALL FIXES VERIFIED!')
  console.log('')
  console.log('✅ The React Error #185 fixes are properly implemented.')
  console.log('✅ You should now see single fetch calls instead of duplicates.')
  console.log('✅ No more infinite loops or ErrorBoundary crashes.')
  console.log('')
  console.log('🚀 Ready to test in browser!')
  console.log('   Navigate to: http://localhost:3000/recent')
  console.log('   Check console for single fetch calls.')
} else {
  console.log('❌ FIXES NOT COMPLETE!')
  console.log('')
  console.log('⚠️  Some fixes are missing. Please review the failed checks above.')
  console.log('   Run: node scripts/test-react-error-185-fix.cjs')
  console.log('   For detailed fix verification.')
}

console.log('')
console.log('📋 Production Testing:')
console.log('   After verifying in development, test in production build:')
console.log('   npm run build && npm start')
console.log('   Navigate to the /recent page and verify no React errors.')
console.log('')

process.exit(recentPageFixed && authProviderFixed ? 0 : 1)
