// FUD Detection Configuration and Logic Test
console.log('🛡️ Testing FUD Detection Configuration...')

// Load environment variables
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env file
dotenv.config({ path: path.join(__dirname, '../.env') })

console.log('\n📋 Environment Configuration:')
console.log(`FUD_DETECTION_ENABLED: ${process.env.FUD_DETECTION_ENABLED || 'undefined'}`)
console.log(`FUD_STRICT_MODE: ${process.env.FUD_STRICT_MODE || 'undefined'}`)
console.log(`FUD_BLOCK_THRESHOLD: ${process.env.FUD_BLOCK_THRESHOLD || 'undefined'}`)
console.log(`FUD_WARN_THRESHOLD: ${process.env.FUD_WARN_THRESHOLD || 'undefined'}`)
console.log(`FUD_WHITELIST_ENABLED: ${process.env.FUD_WHITELIST_ENABLED || 'undefined'}`)

// Simulate the FUD detection configuration
const config = {
  enabled: process.env.FUD_DETECTION_ENABLED !== 'false',
  strictMode: process.env.FUD_STRICT_MODE === 'true',
  blockThreshold: parseInt(process.env.FUD_BLOCK_THRESHOLD || '15'),
  warnThreshold: parseInt(process.env.FUD_WARN_THRESHOLD || '8'),
  whitelistEnabled: process.env.FUD_WHITELIST_ENABLED !== 'false'
}

console.log('\n⚙️ Effective Configuration:')
console.log(JSON.stringify(config, null, 2))

// Test FUD detection logic manually
function simulateFUDDetection(content) {
  console.log(`\n🔍 Analyzing: "${content}"`)
  
  // Check if FUD detection is enabled
  if (!config.enabled) {
    console.log('   ⚠️ FUD Detection is DISABLED - all content would pass')
    return { isBlocked: false, isWarning: false, score: 0, reason: 'FUD detection disabled' }
  }
  
  const normalizedContent = content.toLowerCase()
  
  // Check for required keywords first
  const hasLayerEdge = normalizedContent.includes('@layeredge') || 
                      normalizedContent.includes('$edgen') ||
                      normalizedContent.includes('layeredge')
  
  console.log(`   📝 Has required keywords: ${hasLayerEdge}`)
  
  // Check whitelist patterns
  const whitelistPatterns = [
    /layeredge/i,
    /\$edgen/i,
    /@layeredge/i,
    /decentralized ai/i,
    /blockchain/i,
    /cryptocurrency/i,
    /web3/i,
    /innovation/i,
    /technology/i,
    /community/i,
    /building/i,
    /developing/i,
    /excited/i,
    /bullish/i,
    /optimistic/i
  ]
  
  const isWhitelisted = config.whitelistEnabled && whitelistPatterns.some(pattern => pattern.test(content))
  console.log(`   ✅ Whitelisted: ${isWhitelisted}`)
  
  // Calculate FUD score
  let fudScore = 0
  const detectedTerms = []
  
  // High severity scam keywords (weight: 10)
  const scamKeywords = ['scam', 'fraud', 'fake', 'ponzi', 'rug pull', 'rugpull', 'exit scam', 'pyramid scheme', 'pump and dump', 'dumping', 'worthless', 'steal']
  scamKeywords.forEach(keyword => {
    if (normalizedContent.includes(keyword)) {
      fudScore += 10
      detectedTerms.push(keyword)
    }
  })
  
  // Medium severity negative sentiment (weight: 4)
  const negativeKeywords = ['disappointing', 'risky', 'dangerous', 'bad', 'poor', 'failed', 'failing']
  negativeKeywords.forEach(keyword => {
    if (normalizedContent.includes(keyword)) {
      fudScore += 4
      detectedTerms.push(keyword)
    }
  })

  // Lower severity negative sentiment (weight: 2)
  const lowerNegativeKeywords = ['doubt', 'uncertain', 'worried', 'concerned', 'skeptical', 'avoid', 'suspicious', 'warning', 'bubble', 'crash', 'dump', 'falling', 'losing']
  lowerNegativeKeywords.forEach(keyword => {
    if (normalizedContent.includes(keyword)) {
      fudScore += 2
      detectedTerms.push(keyword)
    }
  })
  
  // Misinformation indicators (weight: 6-8)
  const misinfoKeywords = ['fake news', 'conspiracy', 'hoax', 'lie', 'lying', 'misleading', 'false', 'untrue', 'deceptive']
  misinfoKeywords.forEach(keyword => {
    if (normalizedContent.includes(keyword)) {
      fudScore += 6
      detectedTerms.push(keyword)
    }
  })
  
  // Spam indicators (weight: 6-9)
  const spamKeywords = ['click here', 'buy now', 'limited time', 'act fast', 'guaranteed', 'easy money', 'get rich', 'no risk', 'free money', 'instant profit', 'sure thing']
  spamKeywords.forEach(keyword => {
    if (normalizedContent.includes(keyword)) {
      fudScore += 6
      detectedTerms.push(keyword)
    }
  })
  
  // Apply strict mode multiplier
  if (config.strictMode) {
    fudScore = Math.round(fudScore * 1.5)
  }
  
  // Apply improved whitelist logic
  let adjustedScore = fudScore
  if (isWhitelisted) {
    // Only apply whitelist reduction if the content doesn't have severe FUD indicators
    if (fudScore < config.blockThreshold) {
      adjustedScore = Math.max(0, fudScore - 3) // Reduced from -5 to -3 for safety
    }
    // If content has severe FUD (>= block threshold), whitelist doesn't help much
    else {
      adjustedScore = Math.max(config.warnThreshold, fudScore - 2) // Minimal reduction for severe FUD
    }
  }
  
  console.log(`   📊 Original FUD Score: ${fudScore}`)
  console.log(`   📊 Adjusted FUD Score: ${adjustedScore}`)
  console.log(`   🏷️ Detected terms: ${detectedTerms.join(', ') || 'none'}`)
  console.log(`   🎯 Block threshold: ${config.blockThreshold}`)
  console.log(`   ⚠️ Warn threshold: ${config.warnThreshold}`)

  // Determine result based on adjusted score
  let isBlocked = false
  let isWarning = false
  let reason = 'approved'

  if (adjustedScore >= config.blockThreshold) {
    isBlocked = true
    reason = 'blocked - FUD score too high'
  } else if (adjustedScore >= config.warnThreshold) {
    isWarning = true
    reason = 'warning - potential FUD detected'
  }
  
  // Final submission decision
  const wouldBlockSubmission = !hasLayerEdge || isBlocked
  
  console.log(`   🚦 Result: ${reason}`)
  console.log(`   🚫 Would block submission: ${wouldBlockSubmission}`)
  
  return {
    isBlocked,
    isWarning,
    score: adjustedScore,
    originalScore: fudScore,
    reason,
    wouldBlockSubmission,
    hasRequiredKeywords: hasLayerEdge,
    detectedTerms
  }
}

// Test cases
console.log('\n🧪 Test Cases:')

const testCases = [
  {
    content: 'Excited about @layeredge and the future of decentralized AI!',
    description: 'Positive content with required keywords',
    expectedResult: 'should pass'
  },
  {
    content: '@layeredge is a scam and fraud!',
    description: 'Content with scam keywords',
    expectedResult: 'should be blocked'
  },
  {
    content: '@layeredge seems disappointing and risky',
    description: 'Content with negative sentiment',
    expectedResult: 'should warn or block'
  },
  {
    content: 'This is just a test without keywords',
    description: 'Content without required keywords',
    expectedResult: 'should be blocked (no keywords)'
  },
  {
    content: 'LayerEdge is building amazing decentralized AI technology!',
    description: 'Positive content with LayerEdge mention',
    expectedResult: 'should pass'
  },
  {
    content: '@layeredge fake news and lies about the project',
    description: 'Content with misinformation keywords',
    expectedResult: 'should be blocked'
  }
]

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.description}`)
  console.log(`   Expected: ${testCase.expectedResult}`)
  const result = simulateFUDDetection(testCase.content)
  
  // Determine if test passed
  let testPassed = false
  if (testCase.expectedResult.includes('should pass')) {
    testPassed = !result.wouldBlockSubmission
  } else if (testCase.expectedResult.includes('should be blocked')) {
    testPassed = result.wouldBlockSubmission
  } else if (testCase.expectedResult.includes('should warn')) {
    testPassed = result.isWarning || result.isBlocked
  }
  
  console.log(`   ${testPassed ? '✅ PASS' : '❌ FAIL'}`)
})

console.log('\n🎯 Summary:')
console.log('1. FUD Detection is', config.enabled ? 'ENABLED' : 'DISABLED')
console.log('2. Block threshold:', config.blockThreshold)
console.log('3. Warn threshold:', config.warnThreshold)
console.log('4. Whitelist is', config.whitelistEnabled ? 'ENABLED' : 'DISABLED')
console.log('5. Strict mode is', config.strictMode ? 'ENABLED' : 'DISABLED')

if (!config.enabled) {
  console.log('\n⚠️ WARNING: FUD Detection is DISABLED - all content will pass through!')
}
