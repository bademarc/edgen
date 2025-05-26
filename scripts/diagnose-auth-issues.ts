#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface UserDiagnostic {
  id: string
  name: string | null
  email: string | null
  xUsername: string | null
  xUserId: string | null
  autoMonitoringEnabled: boolean
  lastTweetCheck: Date | null
  tweetCheckCount: number
  accounts: Array<{
    provider: string
    providerAccountId: string
  }>
  tweetMonitoring: Array<{
    status: string
    errorMessage: string | null
    lastCheckAt: Date
    tweetsFound: number
  }>
}

async function diagnoseAuthenticationIssues() {
  console.log('🔍 Starting authentication diagnostics...\n')

  try {
    // Get all users with their authentication data
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        xUsername: true,
        xUserId: true,
        autoMonitoringEnabled: true,
        lastTweetCheck: true,
        tweetCheckCount: true,
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
          }
        },
        tweetMonitoring: {
          select: {
            status: true,
            errorMessage: true,
            lastCheckAt: true,
            tweetsFound: true,
          }
        }
      }
    }) as UserDiagnostic[]

    console.log(`📊 Found ${users.length} users in database\n`)

    // Categorize users by authentication status
    const completeUsers: UserDiagnostic[] = []
    const incompleteUsers: UserDiagnostic[] = []
    const errorUsers: UserDiagnostic[] = []

    for (const user of users) {
      const hasTwitterAccount = user.accounts.some(acc => acc.provider === 'twitter')
      const hasCredentials = !!(user.xUsername && user.xUserId)
      const hasMonitoringError = user.tweetMonitoring.some(tm => tm.status === 'error')

      if (hasCredentials && hasTwitterAccount && !hasMonitoringError) {
        completeUsers.push(user)
      } else if (hasMonitoringError) {
        errorUsers.push(user)
      } else {
        incompleteUsers.push(user)
      }
    }

    // Report findings
    console.log('📈 AUTHENTICATION STATUS SUMMARY')
    console.log('================================')
    console.log(`✅ Complete authentication: ${completeUsers.length} users`)
    console.log(`⚠️  Incomplete authentication: ${incompleteUsers.length} users`)
    console.log(`❌ Authentication errors: ${errorUsers.length} users\n`)

    // Detailed analysis of problematic users
    if (incompleteUsers.length > 0) {
      console.log('⚠️  INCOMPLETE AUTHENTICATION DETAILS')
      console.log('====================================')
      for (const user of incompleteUsers) {
        console.log(`User: ${user.name || user.email || user.id}`)
        console.log(`  - Has Twitter account: ${user.accounts.some(acc => acc.provider === 'twitter')}`)
        console.log(`  - Has X username: ${!!user.xUsername} ${user.xUsername ? `(${user.xUsername})` : ''}`)
        console.log(`  - Has X user ID: ${!!user.xUserId} ${user.xUserId ? `(${user.xUserId})` : ''}`)
        console.log(`  - Monitoring enabled: ${user.autoMonitoringEnabled}`)
        console.log('')
      }
    }

    if (errorUsers.length > 0) {
      console.log('❌ AUTHENTICATION ERROR DETAILS')
      console.log('===============================')
      for (const user of errorUsers) {
        console.log(`User: ${user.name || user.email || user.id}`)
        console.log(`  - Has X username: ${!!user.xUsername} ${user.xUsername ? `(${user.xUsername})` : ''}`)
        console.log(`  - Has X user ID: ${!!user.xUserId} ${user.xUserId ? `(${user.xUserId})` : ''}`)
        console.log(`  - Monitoring enabled: ${user.autoMonitoringEnabled}`)

        const errorMonitoring = user.tweetMonitoring.find(tm => tm.status === 'error')
        if (errorMonitoring) {
          console.log(`  - Error: ${errorMonitoring.errorMessage}`)
          console.log(`  - Last check: ${errorMonitoring.lastCheckAt}`)
        }
        console.log('')
      }
    }

    // Provide recommendations
    console.log('💡 RECOMMENDATIONS')
    console.log('==================')

    if (incompleteUsers.length > 0) {
      console.log('For incomplete authentication users:')
      console.log('1. Check Twitter OAuth configuration in environment variables')
      console.log('2. Verify callback URL is correctly set in Twitter Developer Portal')
      console.log('3. Ensure NextAuth signIn event is properly capturing Twitter profile data')
      console.log('')
    }

    if (errorUsers.length > 0) {
      console.log('For users with authentication errors:')
      console.log('1. Users should sign out and sign in again')
      console.log('2. Check if Twitter API credentials are valid')
      console.log('3. Verify Twitter account permissions and access')
      console.log('')
    }

    // Offer to fix issues
    console.log('🔧 AUTOMATIC FIXES AVAILABLE')
    console.log('============================')
    console.log('Run with --fix flag to automatically:')
    console.log('- Disable monitoring for users with incomplete credentials')
    console.log('- Set appropriate error messages for problematic users')
    console.log('- Reset monitoring status for users with errors')
    console.log('')

    return {
      total: users.length,
      complete: completeUsers.length,
      incomplete: incompleteUsers.length,
      errors: errorUsers.length,
      incompleteUsers,
      errorUsers
    }

  } catch (error) {
    console.error('❌ Error during diagnostics:', error)
    throw error
  }
}

async function fixAuthenticationIssues(diagnostics: any) {
  console.log('🔧 Starting automatic fixes...\n')

  let fixedCount = 0

  // Fix incomplete users
  for (const user of diagnostics.incompleteUsers) {
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          autoMonitoringEnabled: false
        }
      })

      await prisma.tweetMonitoring.upsert({
        where: { userId: user.id },
        update: {
          status: 'error',
          errorMessage: 'Incomplete Twitter credentials - please re-authenticate'
        },
        create: {
          userId: user.id,
          status: 'error',
          errorMessage: 'Incomplete Twitter credentials - please re-authenticate',
          tweetsFound: 0
        }
      })

      console.log(`✅ Fixed incomplete authentication for user: ${user.name || user.id}`)
      fixedCount++
    } catch (error) {
      console.error(`❌ Failed to fix user ${user.id}:`, error)
    }
  }

  // Reset error users
  for (const user of diagnostics.errorUsers) {
    try {
      await prisma.tweetMonitoring.upsert({
        where: { userId: user.id },
        update: {
          status: 'error',
          errorMessage: 'Please re-authenticate with Twitter to refresh your credentials'
        },
        create: {
          userId: user.id,
          status: 'error',
          errorMessage: 'Please re-authenticate with Twitter to refresh your credentials',
          tweetsFound: 0
        }
      })

      console.log(`✅ Reset monitoring status for user: ${user.name || user.id}`)
      fixedCount++
    } catch (error) {
      console.error(`❌ Failed to reset user ${user.id}:`, error)
    }
  }

  console.log(`\n🎉 Fixed ${fixedCount} users`)
}

async function main() {
  const shouldFix = process.argv.includes('--fix')

  try {
    const diagnostics = await diagnoseAuthenticationIssues()

    if (shouldFix && (diagnostics.incomplete > 0 || diagnostics.errors > 0)) {
      await fixAuthenticationIssues(diagnostics)
    }

    console.log('✅ Diagnostics completed successfully')
  } catch (error) {
    console.error('❌ Diagnostics failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
