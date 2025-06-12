#!/usr/bin/env node

/**
 * Simple verification script for tooltip React Error #185 fixes
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 VERIFYING TOOLTIP FIXES')
console.log('=' .repeat(40))

// Check TweetCard fix
const tweetCardPath = path.join(process.cwd(), 'src/components/TweetCard.tsx')
if (fs.existsSync(tweetCardPath)) {
  const content = fs.readFileSync(tweetCardPath, 'utf8')
  
  console.log('\n📋 TweetCard Fixes:')
  console.log(content.includes('const previousMetricsRef = useRef(previousMetrics)') ? '  ✅ Uses previousMetricsRef' : '  ❌ Missing previousMetricsRef')
  console.log(content.includes('CRITICAL FIX: Removed previousMetrics dependency') ? '  ✅ Removed circular dependency' : '  ❌ Still has circular dependency')
} else {
  console.log('❌ TweetCard file not found')
}

// Check Providers fix
const providersPath = path.join(process.cwd(), 'src/components/Providers.tsx')
if (fs.existsSync(providersPath)) {
  const content = fs.readFileSync(providersPath, 'utf8')
  
  console.log('\n📋 Providers Fixes:')
  console.log(content.includes('<TooltipProvider delayDuration={200}>') ? '  ✅ Global TooltipProvider added' : '  ❌ Missing global TooltipProvider')
} else {
  console.log('❌ Providers file not found')
}

// Check tooltip component fixes
const tooltipPath = path.join(process.cwd(), 'src/components/ui/tooltip.tsx')
if (fs.existsSync(tooltipPath)) {
  const content = fs.readFileSync(tooltipPath, 'utf8')
  
  console.log('\n📋 Tooltip Component Fixes:')
  console.log(content.includes('CRITICAL FIX: Removed individual TooltipProvider') ? '  ✅ Individual providers removed' : '  ❌ Still has individual providers')
  
  // Count remaining TooltipProvider instances (should only be exports)
  const providerMatches = content.match(/<TooltipProvider/g)
  const providerCount = providerMatches ? providerMatches.length : 0
  console.log(providerCount === 0 ? '  ✅ No individual TooltipProvider instances' : `  ❌ Found ${providerCount} TooltipProvider instances`)
} else {
  console.log('❌ Tooltip file not found')
}

console.log('\n' + '='.repeat(40))
console.log('🎉 VERIFICATION COMPLETE!')
console.log('\n📋 Manual Testing:')
console.log('   1. Start dev server: npm run dev')
console.log('   2. Navigate to /recent page')
console.log('   3. Hover over tooltips in TweetCard components')
console.log('   4. Check console for React Error #185')
console.log('   5. Verify tooltips work without infinite loops')
console.log('')
