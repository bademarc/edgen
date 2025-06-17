import fetch from 'node-fetch'

async function testAPIs() {
  const baseUrl = 'http://localhost:3000'
  
  console.log('🧪 Testing LayerEdge API endpoints...\n')

  try {
    // Test leaderboard API
    console.log('📋 Testing leaderboard API...')
    const leaderboardResponse = await fetch(`${baseUrl}/api/leaderboard?limit=3`)
    
    if (leaderboardResponse.ok) {
      const leaderboardData = await leaderboardResponse.json()
      console.log('✅ Leaderboard API working')
      console.log('Response structure:', Object.keys(leaderboardData))
      
      if (leaderboardData.users && leaderboardData.users.length > 0) {
        const firstUser = leaderboardData.users[0]
        console.log('First user structure:', Object.keys(firstUser))
        console.log('First user data:', {
          name: firstUser.name,
          xUsername: firstUser.xUsername,
          totalPoints: firstUser.totalPoints,
          rank: firstUser.rank,
          tweetsCount: firstUser.tweetsCount,
          averagePointsPerTweet: firstUser.averagePointsPerTweet
        })
      }
    } else {
      console.log('❌ Leaderboard API failed:', leaderboardResponse.status)
    }

    console.log('\n📊 Testing recent tweets API...')
    const recentResponse = await fetch(`${baseUrl}/api/recent-tweets?limit=3`)
    
    if (recentResponse.ok) {
      const recentData = await recentResponse.json()
      console.log('✅ Recent tweets API working')
      console.log('Response structure:', Object.keys(recentData))
      
      if (recentData.tweets && recentData.tweets.length > 0) {
        const firstTweet = recentData.tweets[0]
        console.log('First tweet structure:', Object.keys(firstTweet))
        console.log('First tweet engagement:', {
          likes: firstTweet.likes,
          retweets: firstTweet.retweets,
          replies: firstTweet.replies,
          totalPoints: firstTweet.totalPoints
        })
      }
    } else {
      console.log('❌ Recent tweets API failed:', recentResponse.status)
    }

    console.log('\n👤 Testing user stats API...')
    // This would need authentication, so we'll skip for now
    console.log('⏭️ Skipping user stats API (requires authentication)')

    console.log('\n🎯 Testing activity timeline API...')
    // Get a user ID from leaderboard first
    if (leaderboardResponse.ok) {
      const leaderboardData = await leaderboardResponse.json()
      if (leaderboardData.users && leaderboardData.users.length > 0) {
        const userId = leaderboardData.users[0].id
        const activityResponse = await fetch(`${baseUrl}/api/user/activity?userId=${userId}&limit=5`)
        
        if (activityResponse.ok) {
          const activityData = await activityResponse.json()
          console.log('✅ Activity timeline API working')
          console.log('Activities count:', activityData.activities?.length || 0)
          
          if (activityData.activities && activityData.activities.length > 0) {
            const firstActivity = activityData.activities[0]
            console.log('First activity:', {
              type: firstActivity.type,
              title: firstActivity.title,
              points: firstActivity.points
            })
          }
        } else {
          console.log('❌ Activity timeline API failed:', activityResponse.status)
        }
      }
    }

  } catch (error) {
    console.error('❌ Error testing APIs:', error)
  }
}

// Wait a bit for server to start, then test
setTimeout(testAPIs, 5000)
