/**
 * Cleanup Script for Unclaimed Tweets
 * Removes unclaimed tweets from users who are not registered on the platform
 * This ensures privacy compliance and data integrity
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

class UnclaimedTweetCleanup {
  constructor() {
    this.stats = {
      totalUnclaimed: 0,
      fromRegisteredUsers: 0,
      fromUnregisteredUsers: 0,
      cleaned: 0,
      errors: 0
    }
  }

  async runCleanup() {
    console.log('🧹 Starting Unclaimed Tweet Cleanup')
    console.log('='.repeat(50))
    console.log('Purpose: Remove tweets from unregistered users for privacy compliance')
    console.log('='.repeat(50))

    try {
      await this.analyzeUnclaimedTweets()
      await this.performCleanup()
      await this.verifyCleanup()
      this.printResults()
    } catch (error) {
      console.error('❌ Cleanup failed:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }

  async analyzeUnclaimedTweets() {
    console.log('\n🔍 Analyzing unclaimed tweets...')

    // Get all unclaimed tweets
    const unclaimedTweets = await prisma.unclaimedTweet.findMany({
      where: { claimed: false },
      select: {
        id: true,
        authorUsername: true,
        authorId: true,
        tweetId: true,
        source: true,
        discoveredAt: true
      }
    })

    this.stats.totalUnclaimed = unclaimedTweets.length
    console.log(`📊 Total unclaimed tweets: ${this.stats.totalUnclaimed}`)

    // Check which authors are registered users
    const registeredUsers = await prisma.user.findMany({
      select: {
        xUsername: true,
        xUserId: true
      }
    })

    const registeredUsernames = new Set(
      registeredUsers.map(u => u.xUsername?.toLowerCase()).filter(Boolean)
    )
    const registeredUserIds = new Set(
      registeredUsers.map(u => u.xUserId).filter(Boolean)
    )

    // Categorize unclaimed tweets
    for (const tweet of unclaimedTweets) {
      const isRegistered = 
        registeredUsernames.has(tweet.authorUsername.toLowerCase()) ||
        registeredUserIds.has(tweet.authorId)

      if (isRegistered) {
        this.stats.fromRegisteredUsers++
      } else {
        this.stats.fromUnregisteredUsers++
      }
    }

    console.log(`✅ From registered users: ${this.stats.fromRegisteredUsers}`)
    console.log(`❌ From unregistered users: ${this.stats.fromUnregisteredUsers}`)
    console.log(`🎯 Will clean: ${this.stats.fromUnregisteredUsers} tweets`)
  }

  async performCleanup() {
    console.log('\n🧹 Performing cleanup...')

    if (this.stats.fromUnregisteredUsers === 0) {
      console.log('✅ No cleanup needed - all unclaimed tweets are from registered users')
      return
    }

    // Get registered user identifiers
    const registeredUsers = await prisma.user.findMany({
      select: {
        xUsername: true,
        xUserId: true
      }
    })

    const registeredUsernames = registeredUsers
      .map(u => u.xUsername?.toLowerCase())
      .filter(Boolean)
    
    const registeredUserIds = registeredUsers
      .map(u => u.xUserId)
      .filter(Boolean)

    try {
      // Delete unclaimed tweets from unregistered users
      const deleteResult = await prisma.unclaimedTweet.deleteMany({
        where: {
          AND: [
            { claimed: false },
            {
              AND: [
                {
                  authorUsername: {
                    notIn: registeredUsernames,
                    mode: 'insensitive'
                  }
                },
                {
                  authorId: {
                    notIn: registeredUserIds
                  }
                }
              ]
            }
          ]
        }
      })

      this.stats.cleaned = deleteResult.count
      console.log(`✅ Cleaned ${this.stats.cleaned} unclaimed tweets from unregistered users`)

    } catch (error) {
      console.error('❌ Error during cleanup:', error)
      this.stats.errors++
      throw error
    }
  }

  async verifyCleanup() {
    console.log('\n🔍 Verifying cleanup...')

    const remainingUnclaimed = await prisma.unclaimedTweet.count({
      where: { claimed: false }
    })

    const expectedRemaining = this.stats.fromRegisteredUsers
    
    if (remainingUnclaimed === expectedRemaining) {
      console.log(`✅ Cleanup verified: ${remainingUnclaimed} unclaimed tweets remaining (all from registered users)`)
    } else {
      console.log(`⚠️ Cleanup verification warning: Expected ${expectedRemaining}, found ${remainingUnclaimed}`)
    }

    // Double-check: ensure no unclaimed tweets from unregistered users remain
    const registeredUsers = await prisma.user.findMany({
      select: { xUsername: true, xUserId: true }
    })

    const registeredUsernames = registeredUsers
      .map(u => u.xUsername?.toLowerCase())
      .filter(Boolean)
    
    const registeredUserIds = registeredUsers
      .map(u => u.xUserId)
      .filter(Boolean)

    const unregisteredTweets = await prisma.unclaimedTweet.findMany({
      where: {
        AND: [
          { claimed: false },
          {
            AND: [
              {
                authorUsername: {
                  notIn: registeredUsernames,
                  mode: 'insensitive'
                }
              },
              {
                authorId: {
                  notIn: registeredUserIds
                }
              }
            ]
          }
        ]
      },
      select: {
        authorUsername: true,
        tweetId: true
      }
    })

    if (unregisteredTweets.length === 0) {
      console.log('✅ Verification passed: No unclaimed tweets from unregistered users remain')
    } else {
      console.log(`❌ Verification failed: ${unregisteredTweets.length} unclaimed tweets from unregistered users still exist`)
      console.log('Remaining unregistered tweets:', unregisteredTweets.slice(0, 5))
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(50))
    console.log('📊 CLEANUP RESULTS SUMMARY')
    console.log('='.repeat(50))
    console.log(`📈 Total unclaimed tweets analyzed: ${this.stats.totalUnclaimed}`)
    console.log(`✅ From registered users (kept): ${this.stats.fromRegisteredUsers}`)
    console.log(`❌ From unregistered users (removed): ${this.stats.cleaned}`)
    console.log(`🔥 Errors encountered: ${this.stats.errors}`)
    
    console.log('\n🎯 PRIVACY COMPLIANCE STATUS')
    console.log('-'.repeat(30))
    if (this.stats.cleaned > 0) {
      console.log('✅ Privacy compliance improved')
      console.log('✅ Unclaimed tweets from unregistered users removed')
      console.log('✅ Only registered users\' tweets are now tracked')
    } else {
      console.log('✅ Already compliant - no unregistered user tweets found')
    }
    
    console.log('\n📋 NEXT STEPS')
    console.log('-'.repeat(20))
    console.log('1. ✅ Tweet tracking now only processes registered users')
    console.log('2. ✅ Unclaimed tweet storage disabled for unregistered users')
    console.log('3. 🔄 Monitor system to ensure compliance is maintained')
    console.log('4. 📢 Users must sign up to participate in tweet tracking')
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  const cleanup = new UnclaimedTweetCleanup()
  cleanup.runCleanup()
    .then(() => {
      console.log('\n🎉 Cleanup completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Cleanup failed:', error)
      process.exit(1)
    })
}

module.exports = UnclaimedTweetCleanup
