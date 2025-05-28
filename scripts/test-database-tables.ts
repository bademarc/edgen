import { prisma } from '../src/lib/db'

async function testDatabaseTables() {
  console.log('🔍 Testing Database Tables...\n')

  try {
    // Test existing tables
    console.log('1. Testing existing tables...')
    const userCount = await prisma.user.count()
    console.log(`   ✅ User table: ${userCount} records`)

    const tweetCount = await prisma.tweet.count()
    console.log(`   ✅ Tweet table: ${tweetCount} records`)

    // Test new tables
    console.log('\n2. Testing new enhanced tracking tables...')
    
    try {
      const unclaimedCount = await prisma.unclaimedTweet.count()
      console.log(`   ✅ UnclaimedTweet table: ${unclaimedCount} records`)
    } catch (error) {
      console.log('   ❌ UnclaimedTweet table not found')
      console.log('   Error:', error instanceof Error ? error.message : 'Unknown error')
    }

    try {
      const trackingLogCount = await prisma.trackingLog.count()
      console.log(`   ✅ TrackingLog table: ${trackingLogCount} records`)
    } catch (error) {
      console.log('   ❌ TrackingLog table not found')
      console.log('   Error:', error instanceof Error ? error.message : 'Unknown error')
    }

    // Test creating a sample unclaimed tweet
    console.log('\n3. Testing UnclaimedTweet creation...')
    try {
      const testTweet = await prisma.unclaimedTweet.create({
        data: {
          tweetId: 'test123456789',
          content: 'Test tweet about $Edgen and LayerEdge',
          authorUsername: 'testuser',
          authorId: 'testuser123',
          likes: 5,
          retweets: 2,
          replies: 1,
          createdAt: new Date(),
          source: 'test'
        }
      })
      console.log(`   ✅ Created test unclaimed tweet: ${testTweet.id}`)
      
      // Clean up
      await prisma.unclaimedTweet.delete({
        where: { id: testTweet.id }
      })
      console.log('   ✅ Cleaned up test tweet')
    } catch (error) {
      console.log('   ❌ Failed to create test unclaimed tweet')
      console.log('   Error:', error instanceof Error ? error.message : 'Unknown error')
    }

    // Test creating a sample tracking log
    console.log('\n4. Testing TrackingLog creation...')
    try {
      const testLog = await prisma.trackingLog.create({
        data: {
          method: 'test',
          success: true,
          tweetsFound: 1,
          duration: 1000,
          metadata: {
            test: true,
            timestamp: new Date().toISOString()
          }
        }
      })
      console.log(`   ✅ Created test tracking log: ${testLog.id}`)
      
      // Clean up
      await prisma.trackingLog.delete({
        where: { id: testLog.id }
      })
      console.log('   ✅ Cleaned up test log')
    } catch (error) {
      console.log('   ❌ Failed to create test tracking log')
      console.log('   Error:', error instanceof Error ? error.message : 'Unknown error')
    }

    console.log('\n✅ Database table testing completed!')

  } catch (error) {
    console.error('❌ Database test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabaseTables().catch(console.error)
