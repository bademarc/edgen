/**
 * Test specific FUD content that was seen in production
 */

import { getFUDDetectionService } from '../lib/fud-detection-service'
import { getEnhancedContentValidator } from '../lib/enhanced-content-validator'
import { getAdvancedFUDDetectionService } from '../lib/advanced-fud-detection'

async function testProductionFUD() {
  console.log('🧪 Testing Production FUD Content...\n')
  
  // Test the exact content from the screenshot
  const testContent = "@layeredge scam"
  
  console.log(`📝 Testing content: "${testContent}"`)
  console.log('🔍 This should be BLOCKED by our FUD detection system\n')
  
  try {
    // Test basic FUD detection
    console.log('1️⃣ Testing Basic FUD Detection:')
    const fudService = getFUDDetectionService()
    const basicResult = await fudService.detectFUD(testContent)
    
    console.log('   - Is Blocked:', basicResult.isBlocked)
    console.log('   - Is Warning:', basicResult.isWarning)
    console.log('   - Score:', basicResult.score)
    console.log('   - Flagged Terms:', basicResult.flaggedTerms)
    console.log('   - Categories:', basicResult.detectedCategories)
    console.log('   - Message:', basicResult.message)
    
    // Test advanced FUD detection
    console.log('\n2️⃣ Testing Advanced FUD Detection:')
    const advancedService = getAdvancedFUDDetectionService()
    const advancedResult = await advancedService.analyzeAdvanced(testContent)
    
    console.log('   - Is Blocked:', advancedResult.isBlocked)
    console.log('   - Is Warning:', advancedResult.isWarning)
    console.log('   - Score:', advancedResult.score)
    console.log('   - Sentiment Score:', advancedResult.sentimentScore)
    console.log('   - Manipulation Patterns:', advancedResult.manipulationPatterns)
    console.log('   - Contextual Risk:', advancedResult.contextualRisk)
    console.log('   - Confidence:', advancedResult.confidenceLevel)
    
    // Test enhanced content validator
    console.log('\n3️⃣ Testing Enhanced Content Validator:')
    const validator = getEnhancedContentValidator()
    const validationResult = await validator.validateContent(testContent, {
      enableFUDDetection: true,
      enableAdvancedFUDDetection: true,
      strictMode: false,
      requireLayerEdgeKeywords: true,
      allowWarnings: true
    })
    
    console.log('   - Allow Submission:', validationResult.allowSubmission)
    console.log('   - Is Valid:', validationResult.isValid)
    console.log('   - Has Required Keywords:', validationResult.hasRequiredKeywords)
    console.log('   - Message:', validationResult.message)
    
    // Test with different configurations
    console.log('\n4️⃣ Testing with Strict Mode:')
    const strictValidation = await validator.validateContent(testContent, {
      enableFUDDetection: true,
      enableAdvancedFUDDetection: true,
      strictMode: true,
      requireLayerEdgeKeywords: true,
      allowWarnings: false
    })
    
    console.log('   - Allow Submission (Strict):', strictValidation.allowSubmission)
    console.log('   - Message (Strict):', strictValidation.message)
    
    // Final verdict
    console.log('\n' + '='.repeat(60))
    console.log('🎯 FINAL VERDICT')
    console.log('='.repeat(60))
    
    const isProperlyBlocked = basicResult.isBlocked || advancedResult.isBlocked || !validationResult.allowSubmission
    
    if (isProperlyBlocked) {
      console.log('✅ SUCCESS: FUD content "@layeredge scam" is properly blocked!')
      console.log('   The content moderation system is working correctly.')
    } else {
      console.log('❌ CRITICAL FAILURE: FUD content "@layeredge scam" is NOT being blocked!')
      console.log('   This is a serious security vulnerability.')
      console.log('\n🔧 Debugging Information:')
      console.log('   - Basic FUD blocked:', basicResult.isBlocked)
      console.log('   - Advanced FUD blocked:', advancedResult.isBlocked)
      console.log('   - Validation allows submission:', validationResult.allowSubmission)
      console.log('   - Has LayerEdge keywords:', validationResult.hasRequiredKeywords)
      
      console.log('\n💡 Possible Issues:')
      console.log('   1. Thresholds may be too high')
      console.log('   2. Whitelist may be overriding FUD detection')
      console.log('   3. Keyword detection may not be working')
      console.log('   4. Environment variables may not be loaded')
    }
    
    // Test additional FUD examples
    console.log('\n5️⃣ Testing Additional FUD Examples:')
    const additionalTests = [
      "LayerEdge is a scam! Don't invest in $EDGEN",
      "$EDGEN is a rug pull waiting to happen",
      "@layeredge fake and worthless",
      "Warning everyone: $EDGEN is dangerous"
    ]
    
    for (const content of additionalTests) {
      const result = await fudService.detectFUD(content)
      console.log(`   "${content}" -> Blocked: ${result.isBlocked}, Score: ${result.score}`)
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error)
    console.log('\n🔧 Error Details:')
    console.log('   Message:', error instanceof Error ? error.message : String(error))
    console.log('   Stack:', error instanceof Error ? error.stack : 'No stack trace available')
  }
}

// Run the test
testProductionFUD()
  .then(() => {
    console.log('\n🎉 Production FUD test completed!')
  })
  .catch((error) => {
    console.error('\n💥 Production FUD test failed:', error)
    process.exit(1)
  })
