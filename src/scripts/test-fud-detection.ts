/**
 * Comprehensive FUD Detection Testing Suite
 * 
 * This script tests the current FUD detection system to identify gaps
 * and verify that harmful content is properly blocked while legitimate
 * content is allowed through.
 */

import { getFUDDetectionService, FUDAnalysisResult } from '../lib/fud-detection-service'
import { getEnhancedContentValidator } from '../lib/enhanced-content-validator'
import { getAdvancedFUDDetectionService } from '../lib/advanced-fud-detection'

interface FUDTestCase {
  content: string
  expectedBlocked: boolean
  expectedWarning: boolean
  category: string
  description: string
}

interface TestResult {
  testCase: FUDTestCase
  result: FUDAnalysisResult
  passed: boolean
  reason: string
}

class FUDDetectionTestSuite {
  private fudService = getFUDDetectionService()
  private advancedFudService = getAdvancedFUDDetectionService()
  private contentValidator = getEnhancedContentValidator()
  private results: TestResult[] = []

  // Test cases covering various FUD scenarios
  private testCases: FUDTestCase[] = [
    // Obvious FUD that should be blocked
    {
      content: "LayerEdge is a scam! Don't invest in $EDGEN, it's a rug pull waiting to happen!",
      expectedBlocked: true,
      expectedWarning: false,
      category: "Obvious FUD",
      description: "Direct scam accusations"
    },
    {
      content: "@layeredge is fake and worthless. This is a pyramid scheme designed to steal your money.",
      expectedBlocked: true,
      expectedWarning: false,
      category: "Obvious FUD",
      description: "Multiple scam indicators"
    },
    {
      content: "Warning everyone: $EDGEN is a ponzi scheme. Avoid at all costs, it's dangerous!",
      expectedBlocked: true,
      expectedWarning: false,
      category: "Obvious FUD",
      description: "Fear-mongering with warnings"
    },

    // Subtle FUD that should be caught
    {
      content: "I'm really worried about @layeredge. Seems risky and I'm having doubts about $EDGEN.",
      expectedBlocked: false,
      expectedWarning: true,
      category: "Subtle FUD",
      description: "Expressing doubt and concern"
    },
    {
      content: "LayerEdge looks suspicious to me. The project seems disappointing and poorly executed.",
      expectedBlocked: false,
      expectedWarning: true,
      category: "Subtle FUD",
      description: "Negative sentiment without direct accusations"
    },

    // Legitimate criticism that should be allowed
    {
      content: "I have some concerns about @layeredge's roadmap timeline, but excited about the AI technology!",
      expectedBlocked: false,
      expectedWarning: false,
      category: "Legitimate Criticism",
      description: "Constructive feedback with positive elements"
    },
    {
      content: "While $EDGEN has potential, I think the team could improve their communication strategy.",
      expectedBlocked: false,
      expectedWarning: false,
      category: "Legitimate Criticism",
      description: "Balanced perspective with suggestions"
    },

    // Positive content that should pass
    {
      content: "Excited about @layeredge! The decentralized AI technology is revolutionary. Bullish on $EDGEN!",
      expectedBlocked: false,
      expectedWarning: false,
      category: "Positive Content",
      description: "Enthusiastic support"
    },
    {
      content: "LayerEdge community is amazing! Love the innovation in decentralized AI. $EDGEN to the moon!",
      expectedBlocked: false,
      expectedWarning: false,
      category: "Positive Content",
      description: "Community appreciation"
    },

    // Edge cases and sophisticated FUD attempts
    {
      content: "Just heard some rumors about @layeredge. Allegedly there are issues with the tokenomics. Unconfirmed but concerning.",
      expectedBlocked: false,
      expectedWarning: true,
      category: "Sophisticated FUD",
      description: "Spreading rumors with disclaimers"
    },
    {
      content: "LayerEdge team seems great, but I'm skeptical about $EDGEN's long-term value. Market conditions are uncertain.",
      expectedBlocked: false,
      expectedWarning: true,
      category: "Sophisticated FUD",
      description: "Mixed messaging with doubt"
    },

    // Spam and promotional content
    {
      content: "Click here for guaranteed profits with $EDGEN! Easy money, no risk! Act fast, limited time offer!",
      expectedBlocked: true,
      expectedWarning: false,
      category: "Spam",
      description: "Obvious spam with get-rich-quick promises"
    },

    // Profanity tests
    {
      content: "LayerEdge is fucking awesome! This shit is revolutionary, damn excited about $EDGEN!",
      expectedBlocked: false,
      expectedWarning: true,
      category: "Profanity",
      description: "Positive content with profanity"
    },

    // Content without LayerEdge mentions (should be handled by keyword validation)
    {
      content: "This project is a complete scam and fraud. Don't trust it!",
      expectedBlocked: true,
      expectedWarning: false,
      category: "Non-LayerEdge FUD",
      description: "Generic FUD without LayerEdge mentions"
    }
  ]

  async runAllTests(): Promise<void> {
    console.log('🛡️ Starting Comprehensive FUD Detection Test Suite...\n')
    console.log(`Testing ${this.testCases.length} different scenarios\n`)

    for (const testCase of this.testCases) {
      await this.runSingleTest(testCase)
    }

    this.generateReport()
  }

  private async runSingleTest(testCase: FUDTestCase): Promise<void> {
    try {
      console.log(`\n📝 Testing: ${testCase.description}`)
      console.log(`Content: "${testCase.content}"`)
      
      // Test FUD detection service directly
      const fudResult = await this.fudService.detectFUD(testCase.content)

      // Test advanced FUD detection
      const advancedFudResult = await this.advancedFudService.analyzeAdvanced(testCase.content)

      // Test enhanced content validator with advanced detection
      const validationResult = await this.contentValidator.validateContent(testCase.content, {
        enableFUDDetection: true,
        enableAdvancedFUDDetection: true,
        strictMode: false,
        requireLayerEdgeKeywords: true,
        allowWarnings: true
      })

      // Determine if test passed (use advanced result for evaluation)
      const resultToEvaluate = advancedFudResult
      const blockedCorrectly = resultToEvaluate.isBlocked === testCase.expectedBlocked
      const warningCorrectly = resultToEvaluate.isWarning === testCase.expectedWarning
      const passed = blockedCorrectly && (testCase.expectedBlocked || warningCorrectly)

      let reason = ''
      if (!blockedCorrectly) {
        reason = `Block status incorrect: expected ${testCase.expectedBlocked}, got ${resultToEvaluate.isBlocked}`
      } else if (!testCase.expectedBlocked && !warningCorrectly) {
        reason = `Warning status incorrect: expected ${testCase.expectedWarning}, got ${resultToEvaluate.isWarning}`
      } else {
        reason = 'Test passed correctly'
      }

      this.results.push({
        testCase,
        result: resultToEvaluate,
        passed,
        reason
      })

      // Log result
      const status = passed ? '✅ PASS' : '❌ FAIL'
      console.log(`${status} - ${reason}`)
      console.log(`   Basic FUD Score: ${fudResult.score} | Advanced Score: ${advancedFudResult.score}`)
      console.log(`   Blocked: ${resultToEvaluate.isBlocked}, Warning: ${resultToEvaluate.isWarning}`)
      console.log(`   Categories: ${resultToEvaluate.detectedCategories.join(', ') || 'None'}`)
      console.log(`   Flagged Terms: ${resultToEvaluate.flaggedTerms.join(', ') || 'None'}`)
      console.log(`   Sentiment Score: ${advancedFudResult.sentimentScore.toFixed(2)}`)
      console.log(`   Manipulation Patterns: ${advancedFudResult.manipulationPatterns.join(', ') || 'None'}`)
      console.log(`   Contextual Risk: ${advancedFudResult.contextualRisk}`)
      console.log(`   Confidence: ${(advancedFudResult.confidenceLevel * 100).toFixed(1)}%`)
      console.log(`   Validation Allows Submission: ${validationResult.allowSubmission}`)

    } catch (error) {
      console.error(`❌ Test failed with error: ${error}`)
      this.results.push({
        testCase,
        result: {
          isBlocked: false,
          isWarning: false,
          score: 0,
          detectedCategories: [],
          flaggedTerms: [],
          suggestions: [],
          message: `Test error: ${error}`,
          allowResubmit: false
        },
        passed: false,
        reason: `Test error: ${error}`
      })
    }
  }

  private generateReport(): void {
    console.log('\n' + '='.repeat(80))
    console.log('📊 FUD DETECTION TEST RESULTS SUMMARY')
    console.log('='.repeat(80))

    const totalTests = this.results.length
    const passedTests = this.results.filter(r => r.passed).length
    const failedTests = totalTests - passedTests

    console.log(`\n📈 Overall Results:`)
    console.log(`   Total Tests: ${totalTests}`)
    console.log(`   Passed: ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`)
    console.log(`   Failed: ${failedTests} (${((failedTests / totalTests) * 100).toFixed(1)}%)`)

    // Group results by category
    const categories = [...new Set(this.results.map(r => r.testCase.category))]
    
    console.log(`\n📋 Results by Category:`)
    for (const category of categories) {
      const categoryResults = this.results.filter(r => r.testCase.category === category)
      const categoryPassed = categoryResults.filter(r => r.passed).length
      const categoryTotal = categoryResults.length
      
      console.log(`\n   ${category}:`)
      console.log(`     Passed: ${categoryPassed}/${categoryTotal} (${((categoryPassed / categoryTotal) * 100).toFixed(1)}%)`)
      
      // Show failed tests in this category
      const failed = categoryResults.filter(r => !r.passed)
      if (failed.length > 0) {
        console.log(`     Failed tests:`)
        failed.forEach(f => {
          console.log(`       - ${f.testCase.description}: ${f.reason}`)
        })
      }
    }

    // Show configuration being tested
    console.log(`\n⚙️ Current FUD Detection Configuration:`)
    const config = this.fudService.getConfig()
    console.log(`   Enabled: ${config.enabled}`)
    console.log(`   Strict Mode: ${config.strictMode}`)
    console.log(`   Block Threshold: ${config.blockThreshold}`)
    console.log(`   Warning Threshold: ${config.warnThreshold}`)
    console.log(`   Whitelist Enabled: ${config.whitelistEnabled}`)

    // Recommendations
    console.log(`\n💡 Recommendations:`)
    if (failedTests > 0) {
      console.log(`   - Review failed test cases to improve detection accuracy`)
      console.log(`   - Consider adjusting thresholds or keyword weights`)
      console.log(`   - Add more sophisticated pattern detection`)
    }

    const obviousFudFails = this.results.filter(r =>
      r.testCase.category === 'Obvious FUD' && !r.passed
    ).length

    if (obviousFudFails > 0) {
      console.log(`   - CRITICAL: ${obviousFudFails} obvious FUD cases not blocked properly`)
      console.log(`   - Consider lowering block threshold or increasing keyword weights`)
    }

    const legitimateFails = this.results.filter(r =>
      (r.testCase.category === 'Legitimate Criticism' || r.testCase.category === 'Positive Content') &&
      !r.passed
    ).length

    if (legitimateFails > 0) {
      console.log(`   - WARNING: ${legitimateFails} legitimate content incorrectly flagged`)
      console.log(`   - Consider raising thresholds or improving whitelist patterns`)
    }

    console.log(`\n🔍 Next Steps:`)
    console.log(`   1. Address any critical failures in obvious FUD detection`)
    console.log(`   2. Fine-tune thresholds to reduce false positives`)
    console.log(`   3. Test with real-world FUD examples from the community`)
    console.log(`   4. Monitor production logs for edge cases`)
    console.log(`   5. Consider implementing machine learning for better detection`)
  }
}

// Run the test suite
async function runFUDDetectionTests() {
  const testSuite = new FUDDetectionTestSuite()
  await testSuite.runAllTests()
}

// Auto-execute the tests
runFUDDetectionTests()
  .then(() => {
    console.log('\n🎉 FUD Detection tests completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 FUD Detection tests failed:', error)
    process.exit(1)
  })

export { FUDDetectionTestSuite, runFUDDetectionTests }
