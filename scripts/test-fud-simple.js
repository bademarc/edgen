// Simple FUD detection test
console.log('🛡️ Testing FUD Detection System...')

// Test the FUD detection service directly
async function testFUDDetection() {
  try {
    // Import the FUD detection service
    const { getFUDDetectionService } = await import('../src/lib/fud-detection-service.js')
    
    const fudService = getFUDDetectionService()
    console.log('✅ FUD Detection Service loaded')
    
    // Test cases
    const testCases = [
      {
        content: 'Excited about @layeredge and the future of decentralized AI!',
        expected: 'approved',
        description: 'Positive content'
      },
      {
        content: '@layeredge is a scam and fraud!',
        expected: 'blocked',
        description: 'Scam content'
      },
      {
        content: '@layeredge seems disappointing',
        expected: 'warning',
        description: 'Negative sentiment'
      }
    ]
    
    console.log('\n📝 Running test cases...')
    
    for (const testCase of testCases) {
      console.log(`\nTesting: ${testCase.description}`)
      console.log(`Content: "${testCase.content}"`)
      
      const result = await fudService.detectFUD(testCase.content)
      
      console.log(`Score: ${result.score}`)
      console.log(`Blocked: ${result.isBlocked}`)
      console.log(`Warning: ${result.isWarning}`)
      console.log(`Categories: ${result.detectedCategories.join(', ') || 'none'}`)
      
      let status = 'approved'
      if (result.isBlocked) status = 'blocked'
      else if (result.isWarning) status = 'warning'
      
      if (status === testCase.expected) {
        console.log('✅ PASS')
      } else {
        console.log(`❌ FAIL (expected: ${testCase.expected}, got: ${status})`)
      }
    }
    
    console.log('\n🎉 FUD Detection test completed!')
    
  } catch (error) {
    console.error('❌ Error testing FUD detection:', error)
  }
}

testFUDDetection()
