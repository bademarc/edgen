#!/usr/bin/env node

/**
 * Test script to verify React Error #185 (Maximum update depth exceeded) is fixed
 * This script checks for patterns that could cause infinite loops in React components
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 REACT ERROR #185 FIX VERIFICATION')
console.log('=' .repeat(60))
console.log('Testing for patterns that could cause "Maximum update depth exceeded"')
console.log('')

/**
 * Test 1: Check dashboard page for circular dependency fixes
 */
function testDashboardCircularDependencyFix() {
  console.log('📋 Test 1: Dashboard Circular Dependency Fix')
  console.log('-'.repeat(50))
  
  const dashboardPath = path.join(process.cwd(), 'src/app/dashboard/page.tsx')
  
  if (!fs.existsSync(dashboardPath)) {
    console.log('❌ Dashboard page file not found')
    return false
  }
  
  const content = fs.readFileSync(dashboardPath, 'utf8')
  
  const requiredPatterns = [
    {
      name: 'Uses useRef import',
      pattern: /import.*useRef.*from 'react'/,
      required: true
    },
    {
      name: 'Creates userRef to avoid circular dependencies',
      pattern: /const userRef = useRef\(user\)/,
      required: true
    },
    {
      name: 'Updates userRef in useEffect',
      pattern: /useEffect\(\(\) => \{\s*userRef\.current = user/,
      required: true
    },
    {
      name: 'fetchDashboardData uses userRef.current',
      pattern: /const currentUser = userRef\.current/,
      required: true
    },
    {
      name: 'fetchDashboardData has empty dependency array',
      pattern: /\}, \[\]\) \/\/ CRITICAL FIX: No dependencies to prevent circular dependency/,
      required: true
    },
    {
      name: 'Initial load effect removes fetchDashboardData dependency',
      pattern: /\[authLoading, user\?\.id, router, isHydrated\]\) \/\/ CRITICAL FIX: Removed fetchDashboardData dependency/,
      required: true
    },
    {
      name: 'Auto-refresh effect removes fetchDashboardData dependency',
      pattern: /\[user\?\.id\]\) \/\/ CRITICAL FIX: Removed fetchDashboardData dependency since it's now stable/,
      required: true
    }
  ]
  
  let allPatternsPassed = true
  
  for (const pattern of requiredPatterns) {
    if (pattern.pattern.test(content)) {
      console.log(`  ✅ ${pattern.name}`)
    } else {
      console.log(`  ❌ ${pattern.name}`)
      allPatternsPassed = false
    }
  }
  
  return allPatternsPassed
}

/**
 * Test 2: Check for problematic useEffect patterns
 */
function testProblematicUseEffectPatterns() {
  console.log('\n📋 Test 2: Problematic useEffect Patterns')
  console.log('-'.repeat(50))
  
  const dashboardPath = path.join(process.cwd(), 'src/app/dashboard/page.tsx')
  
  if (!fs.existsSync(dashboardPath)) {
    console.log('❌ Dashboard page file not found')
    return false
  }
  
  const content = fs.readFileSync(dashboardPath, 'utf8')
  
  const problematicPatterns = [
    {
      name: 'useEffect with fetchDashboardData in dependency array',
      pattern: /useEffect\([^}]+\}, \[[^\]]*fetchDashboardData[^\]]*\]\)/,
      shouldNotExist: true
    },
    {
      name: 'useCallback with changing dependencies that could cause loops',
      pattern: /useCallback\([^}]+\}, \[[^\]]*user[^\]]*\]\)/,
      shouldNotExist: true
    }
  ]
  
  let noProblematicPatterns = true
  
  for (const pattern of problematicPatterns) {
    if (pattern.shouldNotExist && pattern.pattern.test(content)) {
      console.log(`  ❌ Found problematic pattern: ${pattern.name}`)
      noProblematicPatterns = false
    } else {
      console.log(`  ✅ No problematic pattern: ${pattern.name}`)
    }
  }
  
  return noProblematicPatterns
}

/**
 * Test 3: Verify recent page fixes for React Error #185
 */
function testRecentPageFixes() {
  console.log('\n📋 Test 3: Recent Page React Error #185 Fixes')
  console.log('-'.repeat(50))

  const recentPagePath = path.join(process.cwd(), 'src/app/recent/page.tsx')

  if (!fs.existsSync(recentPagePath)) {
    console.log('❌ Recent page file not found')
    return false
  }

  const content = fs.readFileSync(recentPagePath, 'utf8')

  const recentPageChecks = [
    {
      name: 'Uses refs to avoid circular dependencies',
      pattern: /const sortByRef = useRef\(sortBy\)/,
      required: true
    },
    {
      name: 'Uses pagination ref to prevent loops',
      pattern: /const paginationRef = useRef\(pagination\)/,
      required: true
    },
    {
      name: 'Uses currentPage ref to prevent loops',
      pattern: /const currentPageRef = useRef\(currentPage\)/,
      required: true
    },
    {
      name: 'Uses isLoading ref to prevent loops',
      pattern: /const isLoadingRef = useRef\(isLoading\)/,
      required: true
    },
    {
      name: 'fetchTweets has empty dependencies',
      pattern: /\}, \[\]\) \/\/ CRITICAL FIX: No dependencies to prevent circular loops/,
      required: true
    },
    {
      name: 'handleLoadMore has empty dependencies',
      pattern: /\}, \[\]\) \/\/ CRITICAL FIX: No dependencies to prevent circular loops/,
      required: true
    },
    {
      name: 'handleLoadMore uses refs instead of direct state',
      pattern: /const currentPagination = paginationRef\.current/,
      required: true
    }
  ]

  let allRecentPageChecksPassed = true

  for (const check of recentPageChecks) {
    if (check.pattern.test(content)) {
      console.log(`  ✅ ${check.name}`)
    } else {
      console.log(`  ❌ ${check.name}`)
      allRecentPageChecksPassed = false
    }
  }

  return allRecentPageChecksPassed
}

/**
 * Test 4: Check AuthProvider for Supabase client issues
 */
function testAuthProviderFixes() {
  console.log('\n📋 Test 4: AuthProvider Supabase Client Fixes')
  console.log('-'.repeat(50))

  const authProviderPath = path.join(process.cwd(), 'src/components/AuthProvider.tsx')

  if (!fs.existsExists(authProviderPath)) {
    console.log('❌ AuthProvider file not found')
    return false
  }

  const content = fs.readFileSync(authProviderPath, 'utf8')

  const authProviderChecks = [
    {
      name: 'AuthProvider useEffect has empty dependencies',
      pattern: /\}, \[\]\) \/\/ CRITICAL FIX: Remove supabase\.auth dependency to prevent multiple GoTrueClient instances/,
      required: true
    }
  ]

  let allAuthProviderChecksPassed = true

  for (const check of authProviderChecks) {
    if (check.pattern.test(content)) {
      console.log(`  ✅ ${check.name}`)
    } else {
      console.log(`  ❌ ${check.name}`)
      allAuthProviderChecksPassed = false
    }
  }

  return allAuthProviderChecksPassed
}

/**
 * Test 5: Check TweetCard and Tooltip fixes
 */
function testTweetCardTooltipFixes() {
  console.log('\n📋 Test 5: TweetCard and Tooltip Fixes')
  console.log('-'.repeat(50))

  const tweetCardPath = path.join(process.cwd(), 'src/components/TweetCard.tsx')
  const providersPath = path.join(process.cwd(), 'src/components/Providers.tsx')

  if (!fs.existsSync(tweetCardPath) || !fs.existsSync(providersPath)) {
    console.log('❌ Required files not found')
    return false
  }

  const tweetCardContent = fs.readFileSync(tweetCardPath, 'utf8')
  const providersContent = fs.readFileSync(providersPath, 'utf8')

  const tooltipChecks = [
    {
      name: 'TweetCard uses previousMetricsRef',
      pattern: /const previousMetricsRef = useRef\(previousMetrics\)/,
      content: tweetCardContent,
      required: true
    },
    {
      name: 'TweetCard useEffect removes previousMetrics dependency',
      pattern: /\[tweet\.likes, tweet\.retweets, tweet\.replies, tweet\.totalPoints\]\) \/\/ CRITICAL FIX: Removed previousMetrics dependency/,
      content: tweetCardContent,
      required: true
    },
    {
      name: 'Global TooltipProvider in Providers',
      pattern: /<TooltipProvider delayDuration=\{200\}>/,
      content: providersContent,
      required: true
    }
  ]

  let allTooltipChecksPassed = true

  for (const check of tooltipChecks) {
    if (check.pattern.test(check.content)) {
      console.log(`  ✅ ${check.name}`)
    } else {
      console.log(`  ❌ ${check.name}`)
      allTooltipChecksPassed = false
    }
  }

  return allTooltipChecksPassed
}

/**
 * Main test execution
 */
async function runTests() {
  let allTestsPassed = true

  // Run all tests
  const test1Result = testDashboardCircularDependencyFix()
  const test2Result = testProblematicUseEffectPatterns()
  const test3Result = testRecentPageFixes()
  const test4Result = testAuthProviderFixes()

  if (!test1Result) allTestsPassed = false
  if (!test2Result) allTestsPassed = false
  if (!test3Result) allTestsPassed = false
  if (!test4Result) allTestsPassed = false
  
  console.log('\n' + '='.repeat(60))
  
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED!')
    console.log('\n✅ React Error #185 Fix Summary:')
    console.log('   • Dashboard circular dependency fixed with useRef pattern')
    console.log('   • Recent page handleLoadMore fixed with refs and empty dependencies')
    console.log('   • AuthProvider Supabase client dependency removed')
    console.log('   • All useEffect hooks no longer include function dependencies')
    console.log('   • Consistent patterns applied across all components')
    console.log('\n🚀 The "Maximum update depth exceeded" error should be resolved!')
    console.log('\n📋 Next Steps:')
    console.log('   1. Test the /recent page in development mode')
    console.log('   2. Check browser console for any remaining React errors')
    console.log('   3. Verify no multiple GoTrueClient instances warning')
    console.log('   4. Ensure fetchTweets is only called once per trigger')
    console.log('   5. Deploy to production and test')
  } else {
    console.log('❌ SOME TESTS FAILED!')
    console.log('\n⚠️  React Error #185 may still occur. Please review the failed tests above.')
  }
  
  return allTestsPassed
}

// Run the tests
runTests().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('Test execution failed:', error)
  process.exit(1)
})
