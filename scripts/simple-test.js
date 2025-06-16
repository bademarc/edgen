/**
 * Simple test to verify critical fixes
 */

console.log('🧪 Testing LayerEdge Critical Fixes')
console.log('==================================')

// Test 1: Check if server is running
console.log('\n1. Server Status Check')
try {
  const response = await fetch('http://localhost:3000/api/health')
  console.log('✅ Server is running')
} catch (error) {
  console.log('❌ Server not responding:', error.message)
}

// Test 2: Check leaderboard endpoint
console.log('\n2. Leaderboard API Test')
try {
  const response = await fetch('http://localhost:3000/api/leaderboard')
  const data = await response.text()
  
  if (response.ok) {
    console.log('✅ Leaderboard API responding')
    
    // Check for data corruption
    if (data.includes('[object Object]')) {
      console.log('❌ Found corrupted data in leaderboard')
    } else {
      console.log('✅ No data corruption detected')
    }
  } else {
    console.log('❌ Leaderboard API error:', response.status)
  }
} catch (error) {
  console.log('❌ Leaderboard API failed:', error.message)
}

// Test 3: Check quest endpoint (should require auth)
console.log('\n3. Quest API Test')
try {
  const response = await fetch('http://localhost:3000/api/quests')
  
  if (response.status === 401) {
    console.log('✅ Quest API properly requires authentication')
  } else {
    console.log('❌ Quest API should require authentication, got:', response.status)
  }
} catch (error) {
  console.log('❌ Quest API failed:', error.message)
}

// Test 4: Check auth debug endpoint
console.log('\n4. Auth Debug Test')
try {
  const response = await fetch('http://localhost:3000/api/auth/debug')
  
  if (response.ok) {
    console.log('✅ Auth debug endpoint accessible')
  } else {
    console.log('❌ Auth debug endpoint error:', response.status)
  }
} catch (error) {
  console.log('❌ Auth debug endpoint failed:', error.message)
}

// Test 5: Check tweet submission endpoint (should require auth)
console.log('\n5. Tweet Submission Test')
try {
  const response = await fetch('http://localhost:3000/api/tweets/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tweetUrl: 'https://x.com/test/status/123' })
  })
  
  if (response.status === 401) {
    console.log('✅ Tweet submission properly requires authentication')
  } else {
    console.log('❌ Tweet submission should require authentication, got:', response.status)
  }
} catch (error) {
  console.log('❌ Tweet submission failed:', error.message)
}

console.log('\n✅ Critical fixes test completed!')
console.log('Check the results above to verify all systems are working.')
