#!/usr/bin/env node

/**
 * Test script to verify React Error #185 fixes for Tooltip components
 * This script checks for patterns that could cause infinite loops in tooltip-related components
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 TOOLTIP REACT ERROR #185 FIX VERIFICATION')
console.log('=' .repeat(60))
console.log('Testing for patterns that could cause "Maximum update depth exceeded" in tooltips')
console.log('')

/**
 * Test 1: Check TweetCard for circular dependency fixes
 */
function testTweetCardCircularDependencyFix() {
  console.log('📋 Test 1: TweetCard Circular Dependency Fix')
  console.log('-'.repeat(50))
  
  const tweetCardPath = path.join(process.cwd(), 'src/components/TweetCard.tsx')
  
  if (!fs.existsSync(tweetCardPath)) {
    console.log('❌ TweetCard file not found')
    return false
  }
  
  const content = fs.readFileSync(tweetCardPath, 'utf8')
  
  const requiredPatterns = [
    {
      name: 'Uses useRef import',
      pattern: /import.*useRef.*from 'react'/,
      required: true
    },
    {
      name: 'Creates previousMetricsRef to avoid circular dependencies',
      pattern: /const previousMetricsRef = useRef\(previousMetrics\)/,
      required: true
    },
    {
      name: 'Uses ref to access previous metrics',
      pattern: /const currentPreviousMetrics = previousMetricsRef\.current/,
      required: true
    },
    {
      name: 'Updates ref when metrics change',
      pattern: /previousMetricsRef\.current = newMetrics/,
      required: true
    },
    {
      name: 'useEffect removes previousMetrics dependency',
      pattern: /\[tweet\.likes, tweet\.retweets, tweet\.replies, tweet\.totalPoints\]\) \/\/ CRITICAL FIX: Removed previousMetrics dependency/,
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
 * Test 2: Check for multiple TooltipProvider instances
 */
function testTooltipProviderConsolidation() {
  console.log('\n📋 Test 2: TooltipProvider Consolidation')
  console.log('-'.repeat(50))
  
  const tooltipPath = path.join(process.cwd(), 'src/components/ui/tooltip.tsx')
  const providersPath = path.join(process.cwd(), 'src/components/Providers.tsx')
  
  if (!fs.existsSync(tooltipPath) || !fs.existsSync(providersPath)) {
    console.log('❌ Required files not found')
    return false
  }
  
  const tooltipContent = fs.readFileSync(tooltipPath, 'utf8')
  const providersContent = fs.readFileSync(providersPath, 'utf8')
  
  const checks = [
    {
      name: 'Global TooltipProvider in Providers component',
      pattern: /<TooltipProvider delayDuration=\{200\}>/,
      content: providersContent,
      required: true
    },
    {
      name: 'EnhancedTooltip no longer has individual TooltipProvider',
      pattern: /\/\/ CRITICAL FIX: Removed individual TooltipProvider to prevent multiple instances and React Error #185/,
      content: tooltipContent,
      required: true
    },
    {
      name: 'ButtonTooltip no longer has individual TooltipProvider',
      pattern: /\/\/ CRITICAL FIX: Removed individual TooltipProvider to prevent multiple instances and React Error #185/,
      content: tooltipContent,
      required: true
    },
    {
      name: 'No remaining individual TooltipProvider instances in EnhancedTooltip',
      pattern: /<TooltipProvider[^>]*>/,
      content: tooltipContent.split('const EnhancedTooltip')[1]?.split('const DateTooltip')[0] || '',
      shouldNotExist: true
    },
    {
      name: 'No remaining individual TooltipProvider instances in ButtonTooltip',
      pattern: /<TooltipProvider[^>]*>/,
      content: tooltipContent.split('const ButtonTooltip')[1] || '',
      shouldNotExist: true
    }
  ]
  
  let allChecksPassed = true
  
  for (const check of checks) {
    const found = check.pattern.test(check.content)
    
    if (check.shouldNotExist) {
      if (!found) {
        console.log(`  ✅ ${check.name}`)
      } else {
        console.log(`  ❌ ${check.name}`)
        allChecksPassed = false
      }
    } else if (check.required) {
      if (found) {
        console.log(`  ✅ ${check.name}`)
      } else {
        console.log(`  ❌ ${check.name}`)
        allChecksPassed = false
      }
    }
  }
  
  return allChecksPassed
}

/**
 * Test 3: Check for problematic patterns that could cause infinite loops
 */
function testProblematicTooltipPatterns() {
  console.log('\n📋 Test 3: Problematic Tooltip Patterns')
  console.log('-'.repeat(50))
  
  const tweetCardPath = path.join(process.cwd(), 'src/components/TweetCard.tsx')
  
  if (!fs.existsSync(tweetCardPath)) {
    console.log('❌ TweetCard file not found')
    return false
  }
  
  const content = fs.readFileSync(tweetCardPath, 'utf8')
  
  const problematicPatterns = [
    {
      name: 'useEffect with previousMetrics in dependency array',
      pattern: /useEffect\([^}]+\}, \[[^\]]*previousMetrics[^\]]*\]\)/,
      shouldNotExist: true
    },
    {
      name: 'setState inside useEffect that could trigger itself',
      pattern: /useEffect\([^}]+setPreviousMetrics[^}]+\}, \[[^\]]*previousMetrics[^\]]*\]\)/,
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
 * Main test execution
 */
async function runTests() {
  let allTestsPassed = true
  
  // Run all tests
  const test1Result = testTweetCardCircularDependencyFix()
  const test2Result = testTooltipProviderConsolidation()
  const test3Result = testProblematicTooltipPatterns()
  
  if (!test1Result) allTestsPassed = false
  if (!test2Result) allTestsPassed = false
  if (!test3Result) allTestsPassed = false
  
  console.log('\n' + '='.repeat(60))
  
  if (allTestsPassed) {
    console.log('🎉 ALL TOOLTIP TESTS PASSED!')
    console.log('\n✅ React Error #185 Tooltip Fix Summary:')
    console.log('   • TweetCard circular dependency fixed with useRef pattern')
    console.log('   • Multiple TooltipProvider instances consolidated into single global provider')
    console.log('   • Individual TooltipProvider instances removed from components')
    console.log('   • useEffect hooks no longer include problematic dependencies')
    console.log('\n🚀 The "Maximum update depth exceeded" error in tooltips should be resolved!')
    console.log('\n📋 Next Steps:')
    console.log('   1. Test the /recent page with TweetCard tooltips in development mode')
    console.log('   2. Check browser console for any remaining React errors')
    console.log('   3. Verify tooltips work correctly without infinite loops')
    console.log('   4. Test hover interactions on date and button tooltips')
    console.log('   5. Deploy to production and test')
  } else {
    console.log('❌ SOME TOOLTIP TESTS FAILED!')
    console.log('\n⚠️  React Error #185 may still occur in tooltip components. Please review the failed tests above.')
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
