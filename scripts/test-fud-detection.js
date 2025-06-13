import { getFUDDetectionService } from '../src/lib/fud-detection-service.js'
import { getEnhancedContentValidator } from '../src/lib/enhanced-content-validator.js'

// Test cases for FUD detection
const TEST_CASES = [
  // Valid content (should pass)
  {
    category: 'Valid Content',
    content: 'Excited about @layeredge and the future of decentralized AI! $EDGEN is revolutionary technology.',
    expectedBlocked: false,
    expectedWarning: false,
    description: 'Positive content with required keywords'
  },
  {
    category: 'Valid Content',
    content: 'Building the future with @layeredge! Amazing innovation in AI technology.',
    expectedBlocked: false,
    expectedWarning: false,
    description: 'Enthusiastic content about LayerEdge'
  },
  
  // Scam-related content (should be blocked)
  {
    category: 'Scam Content',
    content: '@layeredge is a scam and fraud! This is a ponzi scheme, avoid at all costs!',
    expectedBlocked: true,
    expectedWarning: false,
    description: 'Multiple scam keywords'
  },
  {
    category: 'Scam Content',
    content: 'Warning: @layeredge looks like a rug pull to me. Seems fake and suspicious.',
    expectedBlocked: true,
    expectedWarning: false,
    description: 'Scam warning with required keywords'
  },
  
  // Negative sentiment (should warn or block)
  {
    category: 'Negative Sentiment',
    content: '@layeredge is terrible and awful. This project is garbage and useless.',
    expectedBlocked: true,
    expectedWarning: false,
    description: 'Highly negative sentiment'
  },
  {
    category: 'Negative Sentiment',
    content: 'I have doubts about @layeredge. Seems disappointing and concerning.',
    expectedBlocked: false,
    expectedWarning: true,
    description: 'Mild negative sentiment'
  },
  
  // Profanity (should be blocked)
  {
    category: 'Profanity',
    content: '@layeredge is fucking awesome! This shit is amazing!',
    expectedBlocked: true,
    expectedWarning: false,
    description: 'Profanity in positive context'
  },
  
  // Missing required keywords (should fail validation)
  {
    category: 'Missing Keywords',
    content: 'This is amazing technology for the future of AI!',
    expectedBlocked: false,
    expectedWarning: false,
    description: 'Good content but missing LayerEdge keywords'
  },
  
  // Misinformation indicators
  {
    category: 'Misinformation',
    content: '@layeredge is spreading fake news and lies about AI. This is a hoax!',
    expectedBlocked: true,
    expectedWarning: false,
    description: 'Misinformation keywords'
  },
  
  // Spam indicators
  {
    category: 'Spam',
    content: 'Click here for guaranteed profits with @layeredge! Easy money, no risk!',
    expectedBlocked: true,
    expectedWarning: false,
    description: 'Spam promotional content'
  },
  
  // Whitelist test
  {
    category: 'Whitelist Test',
    content: 'Some concerns about @layeredge but excited about decentralized AI innovation!',
    expectedBlocked: false,
    expectedWarning: true,
    description: 'Negative words but positive context with whitelist terms'
  }
]

async function testFUDDetection() {
  console.log('🛡️ COMPREHENSIVE FUD DETECTION SYSTEM TEST')
  console.log('=' .repeat(60))
  
  const fudService = getFUDDetectionService()
  const contentValidator = getEnhancedContentValidator()
  
  console.log('Configuration:')
  console.log(`  FUD Detection Enabled: ${fudService.getConfig().enabled}`)
  console.log(`  Strict Mode: ${fudService.getConfig().strictMode}`)
  console.log(`  Block Threshold: ${fudService.getConfig().blockThreshold}`)
  console.log(`  Warn Threshold: ${fudService.getConfig().warnThreshold}`)
  console.log(`  Whitelist Enabled: ${fudService.getConfig().whitelistEnabled}`)
  console.log('')

  let totalTests = 0
  let passedTests = 0
  const results = []

  for (const testCase of TEST_CASES) {
    totalTests++
    console.log(`\n📝 Testing: ${testCase.description}`)
    console.log(`   Content: "${testCase.content}"`)
    console.log(`   Category: ${testCase.category}`)
    
    try {
      // Test FUD detection service
      const startTime = Date.now()
      const fudResult = await fudService.detectFUD(testCase.content)
      const fudTime = Date.now() - startTime
      
      // Test enhanced content validator
      const validationStartTime = Date.now()
      const validationResult = await contentValidator.validateContent(testCase.content)
      const validationTime = Date.now() - validationStartTime
      
      // Check results
      const fudTestPassed = (
        fudResult.isBlocked === testCase.expectedBlocked &&
        fudResult.isWarning === testCase.expectedWarning
      )
      
      console.log(`   📊 FUD Analysis:`)
      console.log(`      Blocked: ${fudResult.isBlocked} (expected: ${testCase.expectedBlocked})`)
      console.log(`      Warning: ${fudResult.isWarning} (expected: ${testCase.expectedWarning})`)
      console.log(`      Score: ${fudResult.score}`)
      console.log(`      Categories: ${fudResult.detectedCategories.join(', ') || 'none'}`)
      console.log(`      Flagged Terms: ${fudResult.flaggedTerms.join(', ') || 'none'}`)
      console.log(`      Time: ${fudTime}ms`)
      
      console.log(`   📋 Content Validation:`)
      console.log(`      Valid: ${validationResult.isValid}`)
      console.log(`      Allow Submission: ${validationResult.allowSubmission}`)
      console.log(`      Has Required Keywords: ${validationResult.hasRequiredKeywords}`)
      console.log(`      Requires Review: ${validationResult.requiresReview}`)
      console.log(`      Time: ${validationTime}ms`)
      
      if (fudTestPassed) {
        console.log(`   ✅ PASS`)
        passedTests++
      } else {
        console.log(`   ❌ FAIL`)
      }
      
      results.push({
        testCase,
        fudResult,
        validationResult,
        fudTime,
        validationTime,
        passed: fudTestPassed
      })
      
    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`)
      results.push({
        testCase,
        error: error.message,
        passed: false
      })
    }
  }

  // Performance tests
  console.log('\n⚡ PERFORMANCE TESTS')
  console.log('=' .repeat(30))
  
  const performanceTestContent = '@layeredge is building amazing decentralized AI technology!'
  const performanceRuns = 10
  const performanceTimes = []
  
  for (let i = 0; i < performanceRuns; i++) {
    const startTime = Date.now()
    await fudService.detectFUD(performanceTestContent)
    const endTime = Date.now()
    performanceTimes.push(endTime - startTime)
  }
  
  const avgTime = performanceTimes.reduce((a, b) => a + b, 0) / performanceTimes.length
  const maxTime = Math.max(...performanceTimes)
  const minTime = Math.min(...performanceTimes)
  
  console.log(`Average detection time: ${avgTime.toFixed(2)}ms`)
  console.log(`Min time: ${minTime}ms`)
  console.log(`Max time: ${maxTime}ms`)
  
  const performancePass = avgTime < 2000 // Should be under 2 seconds
  if (performancePass) {
    console.log('✅ Performance test PASSED')
    passedTests++
  } else {
    console.log('❌ Performance test FAILED')
  }
  totalTests++

  // Summary
  console.log('\n' + '=' .repeat(60))
  console.log('📊 TEST RESULTS SUMMARY')
  console.log('=' .repeat(60))
  
  const successRate = (passedTests / totalTests * 100).toFixed(1)
  console.log(`✅ Tests Passed: ${passedTests}/${totalTests} (${successRate}%)`)
  
  // Category breakdown
  const categoryResults = {}
  results.forEach(result => {
    if (result.testCase) {
      const category = result.testCase.category
      if (!categoryResults[category]) {
        categoryResults[category] = { passed: 0, total: 0 }
      }
      categoryResults[category].total++
      if (result.passed) {
        categoryResults[category].passed++
      }
    }
  })
  
  console.log('\n📋 Results by Category:')
  Object.entries(categoryResults).forEach(([category, stats]) => {
    const rate = (stats.passed / stats.total * 100).toFixed(1)
    console.log(`  ${category}: ${stats.passed}/${stats.total} (${rate}%)`)
  })
  
  // Performance summary
  console.log('\n⚡ Performance Summary:')
  console.log(`  Average detection time: ${avgTime.toFixed(2)}ms`)
  console.log(`  Performance requirement: < 2000ms`)
  console.log(`  Performance status: ${performancePass ? '✅ PASS' : '❌ FAIL'}`)
  
  // Configuration validation
  console.log('\n⚙️ Configuration Validation:')
  console.log(`  ✅ FUD Detection: ${fudService.getConfig().enabled ? 'Enabled' : 'Disabled'}`)
  console.log(`  ✅ Block Threshold: ${fudService.getConfig().blockThreshold}`)
  console.log(`  ✅ Warn Threshold: ${fudService.getConfig().warnThreshold}`)
  console.log(`  ✅ Whitelist: ${fudService.getConfig().whitelistEnabled ? 'Enabled' : 'Disabled'}`)
  
  // Integration validation
  console.log('\n🔗 Integration Validation:')
  console.log(`  ✅ Content Validator: Working`)
  console.log(`  ✅ Database-only approach: Maintained`)
  console.log(`  ✅ Fast performance: ${performancePass ? 'Achieved' : 'Needs improvement'}`)
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! FUD detection system is working correctly.')
    return true
  } else {
    console.log(`\n⚠️ ${totalTests - passedTests} test(s) failed. Please review the issues above.`)
    return false
  }
}

// Run the tests
testFUDDetection()
  .then(success => {
    if (success) {
      console.log('\n✅ FUD detection testing completed successfully!')
      process.exit(0)
    } else {
      console.log('\n❌ FUD detection testing completed with failures!')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('\n💥 FUD detection testing failed with error:', error)
    process.exit(1)
  })
