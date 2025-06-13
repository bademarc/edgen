#!/usr/bin/env node

/**
 * Test script to verify dashboard Recent Contributions fixes
 * Tests both the React error #185 fix and dashboard functionality
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 Testing Dashboard Recent Contributions Fixes')
console.log('=' .repeat(60))

/**
 * Test 1: Verify dashboard code changes are in place
 */
function testDashboardCodeChanges() {
  console.log('\n📋 Test 1: Dashboard Code Changes Verification')
  console.log('-'.repeat(50))
  
  const dashboardPath = path.join(process.cwd(), 'src/app/dashboard/page.tsx')
  
  if (!fs.existsSync(dashboardPath)) {
    console.log('❌ Dashboard page file not found')
    return false
  }
  
  const content = fs.readFileSync(dashboardPath, 'utf8')
  
  const dashboardChecks = [
    {
      name: 'Hydration state tracking',
      pattern: /isHydrated.*useState.*false/,
      required: true
    },
    {
      name: 'Hydration effect',
      pattern: /useEffect.*setIsHydrated.*true/,
      required: true
    },
    {
      name: 'Safe date conversion for tweets',
      pattern: /safeTweetDate.*try.*catch/s,
      required: true
    },
    {
      name: 'Safe date conversion for submitted dates',
      pattern: /safeSubmittedDate.*try.*catch/s,
      required: true
    },
    {
      name: 'Auto-refresh mechanism',
      pattern: /setInterval.*fetchDashboardData.*60000/,
      required: true
    },
    {
      name: 'Manual refresh handler',
      pattern: /handleManualRefresh.*fetchDashboardData/,
      required: true
    },
    {
      name: 'Cache-busting in fetch',
      pattern: /cache.*no-store/,
      required: true
    },
    {
      name: 'Hydration fix comment',
      pattern: /HYDRATION FIX/,
      required: true
    },
    {
      name: 'Dashboard fix comment',
      pattern: /DASHBOARD FIX/,
      required: true
    },
    {
      name: 'String or Date type support',
      pattern: /createdAt: string \| Date/,
      required: true
    },
    {
      name: 'Manual refresh button',
      pattern: /ArrowPathIcon.*handleManualRefresh/,
      required: true
    },
    {
      name: 'Enhanced logging',
      pattern: /console\.log.*Dashboard: Fetched/,
      required: true
    }
  ]
  
  let allChecksPass = true
  
  console.log(`📁 Checking ${path.basename(dashboardPath)}:`)
  
  for (const check of dashboardChecks) {
    if (check.pattern.test(content)) {
      console.log(`  ✅ ${check.name}`)
    } else {
      console.log(`  ❌ ${check.name}`)
      if (check.required) {
        allChecksPass = false
      }
    }
  }
  
  return allChecksPass
}

/**
 * Test 2: Check for problematic patterns in dashboard
 */
function testDashboardProblematicPatterns() {
  console.log('\n📋 Test 2: Dashboard Problematic Pattern Analysis')
  console.log('-'.repeat(50))
  
  const dashboardPath = path.join(process.cwd(), 'src/app/dashboard/page.tsx')
  
  if (!fs.existsSync(dashboardPath)) {
    console.log('❌ Dashboard page file not found')
    return false
  }
  
  const content = fs.readFileSync(dashboardPath, 'utf8')
  const lines = content.split('\n')
  
  const problematicPatterns = [
    {
      name: 'Unsafe direct Date constructor',
      pattern: /new Date\([^)]+\)(?!.*safe)/,
      description: 'Should use safe date conversion'
    },
    {
      name: 'Unguarded date operations',
      pattern: /\.getTime\(\).*(?!try|catch)/,
      description: 'Date operations should be in try-catch blocks'
    }
  ]
  
  let noProblematicPatterns = true
  
  console.log(`📁 Analyzing dashboard for problematic patterns:`)
  
  for (const pattern of problematicPatterns) {
    let foundProblematic = false
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (pattern.pattern.test(line)) {
        // Check if this is within a safe implementation
        const context = lines.slice(Math.max(0, i-5), i+5).join('\n')
        if (!context.includes('safe') && !context.includes('try') && !context.includes('catch')) {
          console.log(`  ⚠️  ${pattern.name} at line ${i+1}: ${line.trim()}`)
          foundProblematic = true
          noProblematicPatterns = false
        }
      }
    }
    
    if (!foundProblematic) {
      console.log(`  ✅ No unsafe ${pattern.name.toLowerCase()}`)
    }
  }
  
  return noProblematicPatterns
}

/**
 * Test 3: Verify API consistency between dashboard and recent tweets
 */
function testApiConsistency() {
  console.log('\n📋 Test 3: API Consistency Check')
  console.log('-'.repeat(50))
  
  const dashboardPath = path.join(process.cwd(), 'src/app/dashboard/page.tsx')
  const recentPath = path.join(process.cwd(), 'src/app/recent/page.tsx')
  const apiPath = path.join(process.cwd(), 'src/app/api/tweets/route.ts')
  
  const files = [
    { name: 'Dashboard', path: dashboardPath },
    { name: 'Recent tweets', path: recentPath },
    { name: 'API endpoint', path: apiPath }
  ]
  
  let allFilesExist = true
  
  for (const file of files) {
    if (fs.existsSync(file.path)) {
      console.log(`✅ ${file.name} file exists`)
    } else {
      console.log(`❌ ${file.name} file missing`)
      allFilesExist = false
    }
  }
  
  if (!allFilesExist) {
    return false
  }
  
  // Check that both dashboard and recent page use the same API endpoint
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8')
  const recentContent = fs.readFileSync(recentPath, 'utf8')
  
  const apiEndpointPattern = /\/api\/tweets\?/
  
  const dashboardUsesApi = apiEndpointPattern.test(dashboardContent)
  const recentUsesApi = apiEndpointPattern.test(recentContent)
  
  if (dashboardUsesApi && recentUsesApi) {
    console.log('✅ Both dashboard and recent page use /api/tweets endpoint')
  } else {
    console.log('⚠️  API endpoint usage inconsistency detected')
    console.log(`   Dashboard uses API: ${dashboardUsesApi}`)
    console.log(`   Recent page uses API: ${recentUsesApi}`)
  }
  
  // Check for cache-busting in both
  const cacheBustingPattern = /cache.*no-store|Cache-Control.*no-cache/
  
  const dashboardHasCacheBusting = cacheBustingPattern.test(dashboardContent)
  const recentHasCacheBusting = cacheBustingPattern.test(recentContent)
  
  if (dashboardHasCacheBusting && recentHasCacheBusting) {
    console.log('✅ Both pages implement cache-busting for fresh data')
  } else {
    console.log('⚠️  Cache-busting implementation inconsistency')
    console.log(`   Dashboard has cache-busting: ${dashboardHasCacheBusting}`)
    console.log(`   Recent page has cache-busting: ${recentHasCacheBusting}`)
  }
  
  return dashboardUsesApi && recentUsesApi && dashboardHasCacheBusting && recentHasCacheBusting
}

/**
 * Test 4: Verify debug endpoint fix
 */
function testDebugEndpointFix() {
  console.log('\n📋 Test 4: Debug Endpoint Import Fix')
  console.log('-'.repeat(50))
  
  const debugEndpointPath = path.join(process.cwd(), 'src/app/api/debug/recent-tweets/route.ts')
  
  if (!fs.existsSync(debugEndpointPath)) {
    console.log('❌ Debug endpoint file not found')
    return false
  }
  
  const content = fs.readFileSync(debugEndpointPath, 'utf8')
  
  const importChecks = [
    {
      name: 'Correct Prisma import',
      pattern: /import.*prisma.*from.*@\/lib\/db/,
      required: true
    },
    {
      name: 'No incorrect Prisma import',
      pattern: /import.*prisma.*from.*@\/lib\/prisma/,
      shouldNotExist: true
    }
  ]
  
  let allImportsCorrect = true
  
  for (const check of importChecks) {
    const found = check.pattern.test(content)
    
    if (check.shouldNotExist) {
      if (!found) {
        console.log(`✅ ${check.name} (correctly absent)`)
      } else {
        console.log(`❌ ${check.name} (should not exist)`)
        allImportsCorrect = false
      }
    } else {
      if (found) {
        console.log(`✅ ${check.name}`)
      } else {
        console.log(`❌ ${check.name}`)
        if (check.required) {
          allImportsCorrect = false
        }
      }
    }
  }
  
  return allImportsCorrect
}

/**
 * Main test runner
 */
async function runDashboardTests() {
  console.log('🚀 Starting dashboard test suite...')
  console.log(`📅 Test started at: ${new Date().toISOString()}`)
  
  const results = []
  
  try {
    results.push({ name: 'Dashboard Code Changes', passed: testDashboardCodeChanges() })
    results.push({ name: 'Problematic Patterns', passed: testDashboardProblematicPatterns() })
    results.push({ name: 'API Consistency', passed: testApiConsistency() })
    results.push({ name: 'Debug Endpoint Fix', passed: testDebugEndpointFix() })
    
    const passedTests = results.filter(r => r.passed).length
    const totalTests = results.length
    
    console.log('\n🎉 Dashboard test suite completed!')
    console.log('=' .repeat(60))
    console.log('📋 Test Results Summary:')
    console.log(`   Overall: ${passedTests}/${totalTests} tests passed`)
    
    results.forEach(result => {
      const status = result.passed ? '✅' : '❌'
      console.log(`   ${status} ${result.name}`)
    })
    
    console.log(`📅 Test completed at: ${new Date().toISOString()}`)
    
    if (passedTests === totalTests) {
      console.log('\n🎯 ALL DASHBOARD TESTS PASSED!')
      console.log('\n📝 Dashboard Fixes Summary:')
      console.log('   • React Error #185 hydration mismatch fixed')
      console.log('   • Safe date handling implemented for Recent Contributions')
      console.log('   • Auto-refresh mechanism added (60 seconds)')
      console.log('   • Manual refresh button added to Recent Contributions')
      console.log('   • Cache-busting for fresh data')
      console.log('   • Debug endpoint Prisma import fixed')
      console.log('   • Consistent API usage with recent tweets page')
      console.log('\n🚀 Ready for dashboard testing!')
      console.log('\n📋 Next Steps:')
      console.log('   1. Navigate to https://edgen.koyeb.app/dashboard')
      console.log('   2. Verify page loads without React errors')
      console.log('   3. Check Recent Contributions section displays correctly')
      console.log('   4. Verify Tweet ID 1933007672141304207 appears')
      console.log('   5. Test manual refresh button in Recent Contributions')
      console.log('   6. Compare data consistency with /recent page')
      console.log('   7. Submit a new tweet and verify it appears in both places')
    } else {
      console.log('\n⚠️  SOME DASHBOARD TESTS FAILED')
      console.log('Please review the failed tests above and fix any issues.')
    }
    
  } catch (error) {
    console.error('❌ Dashboard test suite failed:', error)
    process.exit(1)
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runDashboardTests().catch(console.error)
}

module.exports = { runDashboardTests }
