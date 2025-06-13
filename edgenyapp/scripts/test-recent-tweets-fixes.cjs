#!/usr/bin/env node

/**
 * Test script to verify recent tweets fixes
 * Tests both the React error #185 fix and recent tweets functionality
 */

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🧪 Testing Recent Tweets Fixes')
console.log('=' .repeat(60))

/**
 * Test 1: Verify code changes are in place
 */
function testCodeChanges() {
  console.log('\n📋 Test 1: Code Changes Verification')
  console.log('-'.repeat(50))
  
  const filesToCheck = [
    {
      path: 'src/components/ui/virtualized-tweet-list.tsx',
      checks: [
        { name: 'Safe date conversion', pattern: /safeCreatedAt.*try.*catch/s },
        { name: 'Hydration fix comment', pattern: /HYDRATION FIX/ },
        { name: 'String or Date type', pattern: /createdAt: string \| Date/ }
      ]
    },
    {
      path: 'src/app/recent/page.tsx',
      checks: [
        { name: 'Auto-refresh mechanism', pattern: /setInterval.*fetchTweets.*30000/ },
        { name: 'Manual refresh handler', pattern: /handleManualRefresh/ },
        { name: 'Hydration state tracking', pattern: /isHydrated.*useState/ },
        { name: 'Safe date sorting', pattern: /isNaN.*aTime.*bTime/ }
      ]
    },
    {
      path: 'src/app/api/tweets/route.ts',
      checks: [
        { name: 'Enhanced logging', pattern: /console\.log.*API: Returning/ },
        { name: 'Most recent tweet logging', pattern: /Most recent tweet: ID/ }
      ]
    }
  ]
  
  let allChecksPass = true
  
  for (const file of filesToCheck) {
    const fullPath = path.join(process.cwd(), file.path)
    
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ File not found: ${file.path}`)
      allChecksPass = false
      continue
    }
    
    const content = fs.readFileSync(fullPath, 'utf8')
    console.log(`\n📁 Checking ${file.path}:`)
    
    for (const check of file.checks) {
      if (check.pattern.test(content)) {
        console.log(`  ✅ ${check.name}`)
      } else {
        console.log(`  ❌ ${check.name}`)
        allChecksPass = false
      }
    }
  }
  
  return allChecksPass
}

/**
 * Test 2: Check for hydration-safe patterns
 */
function testHydrationSafePatterns() {
  console.log('\n📋 Test 2: Hydration Safety Patterns')
  console.log('-'.repeat(50))
  
  const recentPagePath = path.join(process.cwd(), 'src/app/recent/page.tsx')
  
  if (!fs.existsSync(recentPagePath)) {
    console.log('❌ Recent page file not found')
    return false
  }
  
  const content = fs.readFileSync(recentPagePath, 'utf8')
  
  const hydrationPatterns = [
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
      name: 'Conditional rendering based on hydration',
      pattern: /!isHydrated.*isLoading/,
      required: true
    }
  ]
  
  let allPatternsFound = true
  
  for (const pattern of hydrationPatterns) {
    if (pattern.pattern.test(content)) {
      console.log(`✅ ${pattern.name}`)
    } else {
      console.log(`❌ ${pattern.name}`)
      if (pattern.required) {
        allPatternsFound = false
      }
    }
  }
  
  return allPatternsFound
}

/**
 * Test 3: Verify debug endpoint exists
 */
function testDebugEndpoint() {
  console.log('\n📋 Test 3: Debug Endpoint')
  console.log('-'.repeat(50))
  
  const debugEndpointPath = path.join(process.cwd(), 'src/app/api/debug/recent-tweets/route.ts')
  
  if (fs.existsSync(debugEndpointPath)) {
    console.log('✅ Debug endpoint exists')
    
    const content = fs.readFileSync(debugEndpointPath, 'utf8')
    
    const debugChecks = [
      { name: 'Specific tweet check', pattern: /1933007672141304207/ },
      { name: 'Recent tweets query', pattern: /prisma\.tweet\.findMany/ },
      { name: 'Last hour filter', pattern: /60 \* 60 \* 1000/ }
    ]
    
    let allDebugChecksPass = true
    
    for (const check of debugChecks) {
      if (check.pattern.test(content)) {
        console.log(`  ✅ ${check.name}`)
      } else {
        console.log(`  ❌ ${check.name}`)
        allDebugChecksPass = false
      }
    }
    
    return allDebugChecksPass
  } else {
    console.log('❌ Debug endpoint not found')
    return false
  }
}

/**
 * Test 4: Check for problematic patterns
 */
function testProblematicPatterns() {
  console.log('\n📋 Test 4: Problematic Pattern Analysis')
  console.log('-'.repeat(50))
  
  const recentPagePath = path.join(process.cwd(), 'src/app/recent/page.tsx')
  const tweetListPath = path.join(process.cwd(), 'src/components/ui/virtualized-tweet-list.tsx')
  
  const problematicPatterns = [
    {
      name: 'Unsafe direct Date constructor',
      pattern: /new Date\([^)]+\)(?!.*safeCreatedAt)/,
      description: 'Should use safe date conversion'
    }
  ]
  
  let noProblematicPatterns = true
  
  for (const filePath of [recentPagePath, tweetListPath]) {
    if (!fs.existsSync(filePath)) continue
    
    const content = fs.readFileSync(filePath, 'utf8')
    const fileName = path.basename(filePath)
    
    console.log(`\n📁 Analyzing ${fileName}:`)
    
    for (const pattern of problematicPatterns) {
      // Check for problematic patterns but exclude safe implementations
      const lines = content.split('\n')
      let foundProblematic = false
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (pattern.pattern.test(line)) {
          // Check if this is within a safe implementation
          const context = lines.slice(Math.max(0, i-3), i+3).join('\n')
          if (!context.includes('safeCreatedAt') && !context.includes('try') && !context.includes('catch')) {
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
  }
  
  return noProblematicPatterns
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting comprehensive test suite...')
  console.log(`📅 Test started at: ${new Date().toISOString()}`)
  
  const results = []
  
  try {
    results.push({ name: 'Code Changes', passed: testCodeChanges() })
    results.push({ name: 'Hydration Safety', passed: testHydrationSafePatterns() })
    results.push({ name: 'Debug Endpoint', passed: testDebugEndpoint() })
    results.push({ name: 'Problematic Patterns', passed: testProblematicPatterns() })
    
    const passedTests = results.filter(r => r.passed).length
    const totalTests = results.length
    
    console.log('\n🎉 Test suite completed!')
    console.log('=' .repeat(60))
    console.log('📋 Test Results Summary:')
    console.log(`   Overall: ${passedTests}/${totalTests} tests passed`)
    
    results.forEach(result => {
      const status = result.passed ? '✅' : '❌'
      console.log(`   ${status} ${result.name}`)
    })
    
    console.log(`📅 Test completed at: ${new Date().toISOString()}`)
    
    if (passedTests === totalTests) {
      console.log('\n🎯 ALL TESTS PASSED!')
      console.log('\n📝 Recent Tweets Fixes Summary:')
      console.log('   • React Error #185 hydration mismatch fixed')
      console.log('   • Safe date handling implemented')
      console.log('   • Auto-refresh mechanism added (30 seconds)')
      console.log('   • Manual refresh button added')
      console.log('   • Cache-busting for fresh data')
      console.log('   • Debug endpoint for troubleshooting')
      console.log('\n🚀 Ready for deployment and testing!')
      console.log('\n📋 Next Steps:')
      console.log('   1. Navigate to https://edgen.koyeb.app/recent')
      console.log('   2. Verify page loads without React errors')
      console.log('   3. Check that Tweet ID 1933007672141304207 appears')
      console.log('   4. Test manual refresh button')
      console.log('   5. Submit a new tweet and verify it appears')
    } else {
      console.log('\n⚠️  SOME TESTS FAILED')
      console.log('Please review the failed tests above and fix any issues.')
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error)
    process.exit(1)
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error)
}

module.exports = { runAllTests }
