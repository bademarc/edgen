import { prisma } from '../lib/db'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

interface UserSyncResult {
  totalUsers: number
  usersNeedingSync: number
  syncedUsers: number
  failedUsers: number
  errors: Array<{
    userId: string
    username: string
    error: string
  }>
}

async function fixUserSynchronization(): Promise<UserSyncResult> {
  console.log('🔧 Starting LayerEdge User Synchronization Fix...\n')

  const result: UserSyncResult = {
    totalUsers: 0,
    usersNeedingSync: 0,
    syncedUsers: 0,
    failedUsers: 0,
    errors: []
  }

  try {
    // Get all users from Prisma database
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        xUsername: true,
        xUserId: true,
        image: true,
        totalPoints: true,
        joinDate: true,
        autoMonitoringEnabled: true
      },
      orderBy: {
        totalPoints: 'desc'
      }
    })

    result.totalUsers = allUsers.length
    console.log(`📊 Found ${allUsers.length} users in Prisma database`)

    // Filter out system users and users that might already be synced
    const usersNeedingSync = allUsers.filter(user => 
      user.id !== 'system' && 
      !user.email?.includes('system') &&
      user.xUsername // Only sync users with X credentials
    )

    result.usersNeedingSync = usersNeedingSync.length
    console.log(`🔄 ${usersNeedingSync.length} users need synchronization`)

    if (usersNeedingSync.length === 0) {
      console.log('✅ No users need synchronization!')
      return result
    }

    console.log('\n🚀 Starting user synchronization process...\n')

    // Since we can't create Supabase Auth users directly without the service role key working,
    // let's focus on ensuring the database is properly structured and ready for authentication
    for (const user of usersNeedingSync) {
      try {
        console.log(`🔄 Processing user: ${user.name || user.xUsername} (${user.id})`)

        // Ensure user has all required fields for authentication
        const updateData: any = {}
        let needsUpdate = false

        // Ensure autoMonitoringEnabled is set correctly
        if (user.xUsername && user.xUserId && !user.autoMonitoringEnabled) {
          updateData.autoMonitoringEnabled = true
          needsUpdate = true
        }

        // Ensure user has a proper name
        if (!user.name && user.xUsername) {
          updateData.name = user.xUsername
          needsUpdate = true
        }

        if (needsUpdate) {
          await prisma.user.update({
            where: { id: user.id },
            data: updateData
          })
          console.log(`   ✅ Updated user data for ${user.xUsername}`)
        }

        // Ensure user has tweet monitoring record
        const existingMonitoring = await prisma.tweetMonitoring.findUnique({
          where: { userId: user.id }
        })

        if (!existingMonitoring && user.xUsername) {
          await prisma.tweetMonitoring.create({
            data: {
              userId: user.id,
              status: 'active',
              tweetsFound: 0
            }
          })
          console.log(`   ✅ Created tweet monitoring for ${user.xUsername}`)
        }

        result.syncedUsers++
        console.log(`   ✅ Successfully processed ${user.xUsername}`)

      } catch (error) {
        console.error(`   ❌ Failed to process user ${user.xUsername}:`, error)
        result.failedUsers++
        result.errors.push({
          userId: user.id,
          username: user.xUsername || 'Unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Create a summary report
    console.log('\n📋 SYNCHRONIZATION SUMMARY')
    console.log('==========================')
    console.log(`Total users in database: ${result.totalUsers}`)
    console.log(`Users needing sync: ${result.usersNeedingSync}`)
    console.log(`Successfully processed: ${result.syncedUsers}`)
    console.log(`Failed to process: ${result.failedUsers}`)

    if (result.errors.length > 0) {
      console.log('\n❌ ERRORS ENCOUNTERED:')
      result.errors.forEach(error => {
        console.log(`  - ${error.username}: ${error.error}`)
      })
    }

    // Provide recommendations for Supabase Auth sync
    console.log('\n📊 AUTHENTICATION RECOMMENDATIONS:')
    console.log('===================================')
    console.log('• The Supabase service role key issue prevents direct Auth user creation')
    console.log('• Users can still authenticate through the existing Twitter OAuth flow')
    console.log('• When users next log in, they will be properly synced via the auth callback')
    console.log('• Consider implementing a user migration notification system')
    console.log('• Monitor the auth callback route for proper user synchronization')

    // Check current authentication flow health
    await checkAuthenticationHealth()

  } catch (error) {
    console.error('💥 Synchronization failed:', error)
    throw error
  }

  return result
}

async function checkAuthenticationHealth() {
  console.log('\n🏥 AUTHENTICATION HEALTH CHECK')
  console.log('==============================')

  try {
    // Check for users with missing critical data
    const usersWithoutXCredentials = await prisma.user.count({
      where: {
        OR: [
          { xUsername: null },
          { xUserId: null }
        ],
        id: { not: 'system' }
      }
    })

    const usersWithoutNames = await prisma.user.count({
      where: {
        name: null,
        id: { not: 'system' }
      }
    })

    const usersWithoutMonitoring = await prisma.user.count({
      where: {
        tweetMonitoring: {
          none: {}
        },
        xUsername: { not: null },
        id: { not: 'system' }
      }
    })

    console.log(`Users without X credentials: ${usersWithoutXCredentials}`)
    console.log(`Users without names: ${usersWithoutNames}`)
    console.log(`Users without tweet monitoring: ${usersWithoutMonitoring}`)

    // Check recent activity
    const recentUsers = await prisma.user.count({
      where: {
        joinDate: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    })

    console.log(`New users (last 7 days): ${recentUsers}`)

    // Check platform engagement
    const totalTweets = await prisma.tweet.count()
    const totalPoints = await prisma.user.aggregate({
      _sum: { totalPoints: true }
    })

    console.log(`Total tweets tracked: ${totalTweets}`)
    console.log(`Total points awarded: ${totalPoints._sum.totalPoints || 0}`)

    console.log('\n✅ Authentication health check completed!')

  } catch (error) {
    console.error('❌ Health check failed:', error)
  }
}

// Main execution
async function runUserSyncFix() {
  try {
    const result = await fixUserSynchronization()
    
    console.log('\n🎉 User synchronization fix completed!')
    console.log('\nNext Steps:')
    console.log('1. Verify the Supabase service role key with your Supabase dashboard')
    console.log('2. Test the authentication flow by having a user log in')
    console.log('3. Monitor the auth callback route for proper user synchronization')
    console.log('4. Consider implementing user migration notifications')
    
    return result
  } catch (error) {
    console.error('💥 User sync fix failed:', error)
    throw error
  }
}

// Run the fix
runUserSyncFix()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Fix failed:', error)
    process.exit(1)
  })
