import { prisma } from '../lib/db'

interface SessionAnalysis {
  activeSupabaseSessions: number
  activePrismaSessions: number
  totalPrismaUsers: number
  usersWithoutAuth: Array<{
    id: string
    name: string | null
    xUsername: string | null
    joinDate: Date
    totalPoints: number
  }>
  authenticationIssues: string[]
}

async function checkCurrentAuthSessions(): Promise<SessionAnalysis> {
  console.log('🔍 Checking current authentication sessions...\n')

  const analysis: SessionAnalysis = {
    activeSupabaseSessions: 0,
    activePrismaSessions: 0,
    totalPrismaUsers: 0,
    usersWithoutAuth: [],
    authenticationIssues: []
  }

  try {
    // Get all users from Prisma database
    const prismaUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        xUsername: true,
        xUserId: true,
        totalPoints: true,
        joinDate: true,
        autoMonitoringEnabled: true
      },
      orderBy: {
        totalPoints: 'desc'
      }
    })

    analysis.totalPrismaUsers = prismaUsers.length

    console.log(`📊 Found ${prismaUsers.length} users in Prisma database`)

    // Check for potential authentication issues
    const usersWithoutEmail = prismaUsers.filter(u => !u.email)
    const usersWithoutXCredentials = prismaUsers.filter(u => !u.xUsername || !u.xUserId)
    const systemUsers = prismaUsers.filter(u => u.id === 'system' || u.email?.includes('system'))

    if (usersWithoutEmail.length > 0) {
      analysis.authenticationIssues.push(`${usersWithoutEmail.length} users without email addresses`)
    }

    if (usersWithoutXCredentials.length > 0) {
      analysis.authenticationIssues.push(`${usersWithoutXCredentials.length} users without X/Twitter credentials`)
    }

    // Identify users who might have authentication issues
    analysis.usersWithoutAuth = prismaUsers.filter(user => 
      user.id !== 'system' && 
      !user.email?.includes('system') &&
      (!user.email || (!user.xUsername && !user.xUserId))
    )

    console.log('\n📋 USER ANALYSIS')
    console.log('================')
    console.log(`Total users in database: ${analysis.totalPrismaUsers}`)
    console.log(`Users without email: ${usersWithoutEmail.length}`)
    console.log(`Users without X credentials: ${usersWithoutXCredentials.length}`)
    console.log(`System users: ${systemUsers.length}`)
    console.log(`Users with potential auth issues: ${analysis.usersWithoutAuth.length}`)

    if (analysis.usersWithoutAuth.length > 0) {
      console.log('\n⚠️  USERS WITH POTENTIAL AUTHENTICATION ISSUES:')
      analysis.usersWithoutAuth.forEach(user => {
        console.log(`  - ${user.name || 'Unknown'} (${user.id})`)
        console.log(`    X Username: ${user.xUsername || 'Missing'}`)
        console.log(`    Points: ${user.totalPoints}`)
        console.log(`    Joined: ${user.joinDate.toISOString().split('T')[0]}`)
        console.log('')
      })
    }

    // Display top users by points
    const topUsers = prismaUsers.slice(0, 10)
    console.log('\n🏆 TOP 10 USERS BY POINTS:')
    topUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name || 'Unknown'} - ${user.totalPoints} points`)
      console.log(`     X: @${user.xUsername || 'N/A'} | Joined: ${user.joinDate.toISOString().split('T')[0]}`)
    })

    // Check for recent activity
    const recentUsers = prismaUsers.filter(user => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return user.joinDate > thirtyDaysAgo
    })

    console.log(`\n📈 Recent activity (last 30 days): ${recentUsers.length} new users`)

    if (analysis.authenticationIssues.length > 0) {
      console.log('\n⚠️  AUTHENTICATION ISSUES DETECTED:')
      analysis.authenticationIssues.forEach(issue => {
        console.log(`  • ${issue}`)
      })
    }

  } catch (error) {
    console.error('Error analyzing authentication sessions:', error)
    analysis.authenticationIssues.push('Failed to analyze database users')
  }

  return analysis
}

async function checkDatabaseIntegrity() {
  console.log('\n🔍 Checking database integrity...')

  try {
    // Check for duplicate usernames
    const duplicateUsernames = await prisma.user.groupBy({
      by: ['xUsername'],
      where: {
        xUsername: {
          not: null
        }
      },
      having: {
        xUsername: {
          _count: {
            gt: 1
          }
        }
      },
      _count: {
        xUsername: true
      }
    })

    if (duplicateUsernames.length > 0) {
      console.log('⚠️  Duplicate X usernames found:')
      for (const dup of duplicateUsernames) {
        console.log(`  - @${dup.xUsername}: ${dup._count.xUsername} users`)
      }
    }

    // Check for users with points but no tweets
    const usersWithPointsNoTweets = await prisma.user.findMany({
      where: {
        totalPoints: {
          gt: 0
        },
        tweets: {
          none: {}
        }
      },
      select: {
        id: true,
        name: true,
        xUsername: true,
        totalPoints: true
      }
    })

    if (usersWithPointsNoTweets.length > 0) {
      console.log(`\n⚠️  ${usersWithPointsNoTweets.length} users have points but no recorded tweets`)
      console.log('   This might indicate points awarded through automatic tracking')
    }

    // Check tweet statistics
    const tweetStats = await prisma.tweet.aggregate({
      _count: true,
      _sum: {
        totalPoints: true
      }
    })

    const pointsStats = await prisma.pointsHistory.aggregate({
      _count: true,
      _sum: {
        pointsAwarded: true
      }
    })

    console.log('\n📊 PLATFORM STATISTICS:')
    console.log(`Total tweets: ${tweetStats._count}`)
    console.log(`Total points from tweets: ${tweetStats._sum.totalPoints || 0}`)
    console.log(`Total points history entries: ${pointsStats._count}`)
    console.log(`Total points awarded: ${pointsStats._sum.pointsAwarded || 0}`)

  } catch (error) {
    console.error('Error checking database integrity:', error)
  }
}

// Main execution
async function runSessionCheck() {
  try {
    const analysis = await checkCurrentAuthSessions()
    await checkDatabaseIntegrity()

    console.log('\n📋 SUMMARY & RECOMMENDATIONS:')
    console.log('==============================')
    
    if (analysis.usersWithoutAuth.length > 0) {
      console.log('• Some users may have authentication issues')
      console.log('• Consider implementing a user verification system')
      console.log('• Review the authentication flow for completeness')
    }
    
    if (analysis.authenticationIssues.length > 0) {
      console.log('• Address the authentication issues listed above')
      console.log('• Ensure all users have proper X/Twitter credentials')
    }
    
    console.log('• Monitor user registration flow to ensure proper data collection')
    console.log('• Consider implementing periodic data validation checks')
    
    console.log('\n✅ Session analysis completed!')
    
  } catch (error) {
    console.error('Session check failed:', error)
    throw error
  }
}

// Run the session check
runSessionCheck()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Session check failed:', error)
    process.exit(1)
  })
