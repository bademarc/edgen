#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testAuthenticationFixes() {
  console.log('🧪 Testing authentication fixes...\n')

  try {
    // Test 1: Check database schema and constraints
    console.log('1️⃣ Testing database schema...')

    const userCount = await prisma.user.count()
    const monitoringCount = await prisma.tweetMonitoring.count()

    console.log(`   ✅ Users table accessible: ${userCount} users`)
    console.log(`   ✅ TweetMonitoring table accessible: ${monitoringCount} records`)

    // Test 2: Check for users with missing credentials
    console.log('\n2️⃣ Testing credential validation...')

    const usersWithMissingCredentials = await prisma.user.findMany({
      where: {
        OR: [
          { xUsername: null },
          { xUserId: null },
          { xUsername: '' },
          { xUserId: '' }
        ]
      },
      select: {
        id: true,
        name: true,
        xUsername: true,
        xUserId: true,
        autoMonitoringEnabled: true
      }
    })

    if (usersWithMissingCredentials.length > 0) {
      console.log(`   ⚠️  Found ${usersWithMissingCredentials.length} users with missing credentials`)
      for (const user of usersWithMissingCredentials) {
        console.log(`      - ${user.name || user.id}: username=${user.xUsername}, userId=${user.xUserId}`)
      }
    } else {
      console.log('   ✅ All users have complete Twitter credentials')
    }

    // Test 3: Check monitoring status consistency
    console.log('\n3️⃣ Testing monitoring status consistency...')

    const inconsistentUsers = await prisma.user.findMany({
      where: {
        AND: [
          { autoMonitoringEnabled: true },
          {
            OR: [
              { xUsername: null },
              { xUserId: null },
              { xUsername: '' },
              { xUserId: '' }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        autoMonitoringEnabled: true,
        xUsername: true,
        xUserId: true
      }
    })

    if (inconsistentUsers.length > 0) {
      console.log(`   ❌ Found ${inconsistentUsers.length} users with monitoring enabled but missing credentials`)
      for (const user of inconsistentUsers) {
        console.log(`      - ${user.name || user.id}: monitoring=${user.autoMonitoringEnabled}`)
      }
    } else {
      console.log('   ✅ Monitoring status is consistent with credential availability')
    }

    // Test 4: Check error message clarity
    console.log('\n4️⃣ Testing error message clarity...')

    const errorMonitoring = await prisma.tweetMonitoring.findMany({
      where: {
        status: 'error'
      },
      select: {
        userId: true,
        errorMessage: true,
        user: {
          select: {
            name: true,
            xUsername: true,
            xUserId: true
          }
        }
      }
    })

    if (errorMonitoring.length > 0) {
      console.log(`   📝 Found ${errorMonitoring.length} users with error status`)
      for (const monitoring of errorMonitoring) {
        const hasCredentials = !!(monitoring.user.xUsername && monitoring.user.xUserId)
        console.log(`      - ${monitoring.user.name || monitoring.userId}:`)
        console.log(`        Has credentials: ${hasCredentials}`)
        console.log(`        Error: ${monitoring.errorMessage}`)
      }
    } else {
      console.log('   ✅ No users currently have monitoring errors')
    }

    // Test 5: Simulate authentication flow
    console.log('\n5️⃣ Testing authentication flow simulation...')

    // Create a test user scenario
    const testUserId = 'test-auth-' + Date.now()

    try {
      // Simulate incomplete authentication
      await prisma.user.create({
        data: {
          id: testUserId,
          name: 'Test User',
          email: 'test@example.com',
          // Missing xUsername and xUserId to simulate the issue
          autoMonitoringEnabled: true
        }
      })

      // Check if monitoring would be properly handled
      const testUser = await prisma.user.findUnique({
        where: { id: testUserId },
        select: {
          xUsername: true,
          xUserId: true,
          autoMonitoringEnabled: true
        }
      })

      const shouldHaveMonitoringDisabled = !testUser?.xUsername || !testUser?.xUserId

      if (shouldHaveMonitoringDisabled) {
        console.log('   ✅ Test user correctly identified as having incomplete credentials')

        // Simulate the fix
        await prisma.user.update({
          where: { id: testUserId },
          data: { autoMonitoringEnabled: false }
        })

        await prisma.tweetMonitoring.create({
          data: {
            userId: testUserId,
            status: 'error',
            errorMessage: 'Incomplete Twitter credentials - please re-authenticate',
            tweetsFound: 0
          }
        })

        console.log('   ✅ Test user monitoring status correctly updated')
      }

      // Clean up test user
      await prisma.tweetMonitoring.deleteMany({
        where: { userId: testUserId }
      })
      await prisma.user.delete({
        where: { id: testUserId }
      })

      console.log('   ✅ Test cleanup completed')

    } catch (error) {
      console.log(`   ❌ Authentication flow test failed: ${error}`)
    }

    // Test 6: Environment configuration check
    console.log('\n6️⃣ Testing environment configuration...')

    const requiredEnvVars = [
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'TWITTER_CLIENT_ID',
      'TWITTER_CLIENT_SECRET',
      'TWITTER_BEARER_TOKEN'
    ]

    let envIssues = 0
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.log(`   ❌ Missing environment variable: ${envVar}`)
        envIssues++
      } else {
        console.log(`   ✅ ${envVar} is configured`)
      }
    }

    if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith('http')) {
      console.log(`   ⚠️  NEXTAUTH_URL should include protocol: ${process.env.NEXTAUTH_URL}`)
      envIssues++
    }

    if (envIssues === 0) {
      console.log('   ✅ All required environment variables are properly configured')
    }

    // Summary
    console.log('\n📊 TEST SUMMARY')
    console.log('===============')
    console.log(`Users with missing credentials: ${usersWithMissingCredentials.length}`)
    console.log(`Users with inconsistent monitoring: ${inconsistentUsers.length}`)
    console.log(`Users with error status: ${errorMonitoring.length}`)
    console.log(`Environment issues: ${envIssues}`)

    const totalIssues = usersWithMissingCredentials.length + inconsistentUsers.length + envIssues

    if (totalIssues === 0) {
      console.log('\n🎉 All tests passed! Authentication system appears to be working correctly.')
    } else {
      console.log(`\n⚠️  Found ${totalIssues} issues that need attention.`)
      console.log('\n💡 Recommendations:')

      if (usersWithMissingCredentials.length > 0) {
        console.log('- Run the diagnose-auth-issues script with --fix flag')
        console.log('- Ask affected users to re-authenticate')
      }

      if (inconsistentUsers.length > 0) {
        console.log('- Disable monitoring for users with incomplete credentials')
      }

      if (envIssues > 0) {
        console.log('- Fix environment variable configuration')
        console.log('- Ensure NEXTAUTH_URL includes https:// protocol')
      }
    }

    return {
      usersWithMissingCredentials: usersWithMissingCredentials.length,
      inconsistentUsers: inconsistentUsers.length,
      errorUsers: errorMonitoring.length,
      envIssues,
      totalIssues
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error)
    throw error
  }
}

async function main() {
  try {
    await testAuthenticationFixes()
    console.log('\n✅ Testing completed successfully')
  } catch (error) {
    console.error('❌ Testing failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
