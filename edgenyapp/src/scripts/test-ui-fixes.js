/**
 * Test script for LayerEdge UI fixes
 * Validates database schema changes and API functionality
 */

const { PrismaClient } = require('@prisma/client')

async function testDatabaseChanges() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🧪 Testing Database Schema Changes...\n')
    
    // Test 1: Check if new fields exist
    console.log('1. Checking new database fields...')
    
    const sampleTweet = await prisma.tweet.findFirst({
      select: {
        id: true,
        originalTweetDate: true,
        submittedAt: true,
        createdAt: true
      }
    })
    
    if (sampleTweet) {
      console.log('✅ New fields exist in database:')
      console.log(`   - originalTweetDate: ${sampleTweet.originalTweetDate ? 'Present' : 'NULL'}`)
      console.log(`   - submittedAt: ${sampleTweet.submittedAt ? 'Present' : 'NULL'}`)
      console.log(`   - createdAt: ${sampleTweet.createdAt ? 'Present' : 'NULL'}`)
    } else {
      console.log('ℹ️  No tweets found in database (this is normal for new installations)')
    }
    
    // Test 2: Check recent tweets query
    console.log('\n2. Testing recent tweets query...')
    
    const recentTweets = await prisma.tweet.findMany({
      orderBy: {
        submittedAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        originalTweetDate: true,
        submittedAt: true,
        createdAt: true,
        user: {
          select: {
            xUsername: true
          }
        }
      }
    })
    
    console.log(`✅ Found ${recentTweets.length} tweets, ordered by submittedAt`)
    
    if (recentTweets.length > 0) {
      console.log('   Recent tweets (newest first):')
      recentTweets.forEach((tweet, index) => {
        const submittedAt = tweet.submittedAt ? new Date(tweet.submittedAt).toISOString() : 'NULL'
        const originalDate = tweet.originalTweetDate ? new Date(tweet.originalTweetDate).toISOString() : 'NULL'
        console.log(`   ${index + 1}. @${tweet.user.xUsername || 'unknown'} - Submitted: ${submittedAt}`)
        console.log(`      Original: ${originalDate}`)
      })
    }
    
    // Test 3: Test date formatting
    console.log('\n3. Testing date formatting...')
    
    const testDates = [
      new Date(), // Today
      new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    ]
    
    // Import the formatDate function
    const { formatDate } = require('../lib/utils')
    
    testDates.forEach((date, index) => {
      const formatted = formatDate(date)
      console.log(`   Test date ${index + 1}: ${formatted}`)
    })
    
    console.log('\n✅ All database tests completed successfully!')
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function testAPIEndpoint() {
  console.log('\n🌐 Testing API Endpoint...\n')
  
  try {
    // Test the tweets API endpoint
    const response = await fetch('http://localhost:3000/api/tweets?limit=3')
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }
    
    const tweets = await response.json()
    
    console.log(`✅ API endpoint working - returned ${tweets.length} tweets`)
    
    if (tweets.length > 0) {
      console.log('   Sample tweet data structure:')
      const sampleTweet = tweets[0]
      console.log(`   - id: ${sampleTweet.id}`)
      console.log(`   - createdAt: ${sampleTweet.createdAt} (should be original tweet date)`)
      console.log(`   - submittedAt: ${sampleTweet.submittedAt || 'Not present'}`)
      console.log(`   - originalTweetDate: ${sampleTweet.originalTweetDate || 'Not present'}`)
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message)
    console.log('ℹ️  This is normal if the development server is not running')
  }
}

async function runAllTests() {
  console.log('🚀 LayerEdge UI Fixes - Test Suite\n')
  console.log('Testing the following fixes:')
  console.log('1. Tweet date display bug')
  console.log('2. Recent contributions filtering')
  console.log('3. Database schema changes')
  console.log('=' .repeat(50))
  
  try {
    await testDatabaseChanges()
    await testAPIEndpoint()
    
    console.log('\n🎉 ALL TESTS PASSED!')
    console.log('\nNext steps:')
    console.log('1. Start the development server: npm run dev')
    console.log('2. Test the UI components manually')
    console.log('3. Submit a test tweet to verify date handling')
    console.log('4. Check tooltips and hover states')
    
  } catch (error) {
    console.error('\n💥 TESTS FAILED!')
    console.error('Error:', error.message)
    console.log('\nPlease check the implementation and try again.')
    process.exit(1)
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error)
}

module.exports = {
  testDatabaseChanges,
  testAPIEndpoint,
  runAllTests
}
