async function testApiEndpoints() {
  console.log('🧪 Testing API Endpoints...\n')

  const baseUrl = 'http://localhost:3000'
  const adminSecret = process.env.ADMIN_SECRET || 'layeredge-admin-secret-2024'

  try {
    // Test 1: Test tracking status endpoint
    console.log('1. Testing tracking status endpoint...')
    try {
      const response = await fetch(`${baseUrl}/api/tracking/status`)
      const data = await response.json()
      
      if (response.ok) {
        console.log('   ✅ Status endpoint works')
        console.log('   📊 Status:', {
          isRunning: data.status?.isRunning,
          keywords: data.status?.keywords?.length,
          uptime: data.status?.uptime
        })
      } else {
        console.log('   ❌ Status endpoint failed:', data.error)
      }
    } catch (error) {
      console.log('   ❌ Status endpoint error:', error instanceof Error ? error.message : 'Unknown error')
    }

    // Test 2: Test tracking management (start)
    console.log('\n2. Testing tracking management (start)...')
    try {
      const response = await fetch(`${baseUrl}/api/tracking/status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'start' })
      })
      const data = await response.json()
      
      if (response.ok) {
        console.log('   ✅ Start tracking works')
        console.log('   📊 Result:', data.message)
      } else {
        console.log('   ❌ Start tracking failed:', data.error)
      }
    } catch (error) {
      console.log('   ❌ Start tracking error:', error instanceof Error ? error.message : 'Unknown error')
    }

    // Test 3: Test manual discovery
    console.log('\n3. Testing manual discovery...')
    try {
      const response = await fetch(`${baseUrl}/api/tracking/discover`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ method: 'twscrape' })
      })
      const data = await response.json()
      
      if (response.ok) {
        console.log('   ✅ Manual discovery works')
        console.log('   📊 Result:', data.results?.summary)
      } else {
        console.log('   ❌ Manual discovery failed:', data.error)
      }
    } catch (error) {
      console.log('   ❌ Manual discovery error:', error instanceof Error ? error.message : 'Unknown error')
    }

    // Test 4: Test unclaimed tweets endpoint (without auth - should fail)
    console.log('\n4. Testing unclaimed tweets endpoint (no auth)...')
    try {
      const response = await fetch(`${baseUrl}/api/tweets/claim`)
      const data = await response.json()
      
      if (response.status === 401) {
        console.log('   ✅ Unclaimed tweets endpoint properly requires auth')
      } else {
        console.log('   ❌ Unclaimed tweets endpoint should require auth')
      }
    } catch (error) {
      console.log('   ❌ Unclaimed tweets endpoint error:', error instanceof Error ? error.message : 'Unknown error')
    }

    // Test 5: Test discovery stats
    console.log('\n5. Testing discovery stats...')
    try {
      const response = await fetch(`${baseUrl}/api/tracking/discover?hours=24`)
      const data = await response.json()
      
      if (response.ok) {
        console.log('   ✅ Discovery stats works')
        console.log('   📊 Stats:', {
          totalTweets: data.stats?.totalTweets,
          claimedTweets: data.stats?.claimedTweets,
          unclaimedTweets: data.stats?.unclaimedTweets
        })
      } else {
        console.log('   ❌ Discovery stats failed:', data.error)
      }
    } catch (error) {
      console.log('   ❌ Discovery stats error:', error instanceof Error ? error.message : 'Unknown error')
    }

    console.log('\n✅ API endpoints testing completed!')
    console.log('\n📋 Notes:')
    console.log('   - Make sure the development server is running (npm run dev)')
    console.log('   - Some endpoints require authentication')
    console.log('   - Manual discovery may take time depending on method')

  } catch (error) {
    console.error('❌ API endpoints test failed:', error)
  }
}

// Check if server is likely running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/health', { 
      signal: AbortSignal.timeout(5000) 
    })
    return response.ok
  } catch {
    return false
  }
}

async function main() {
  console.log('🔍 Checking if development server is running...')
  
  const serverRunning = await checkServer()
  if (!serverRunning) {
    console.log('❌ Development server is not running')
    console.log('💡 Please run: npm run dev')
    console.log('   Then run this test again')
    return
  }
  
  console.log('✅ Development server is running\n')
  await testApiEndpoints()
}

main().catch(console.error)
