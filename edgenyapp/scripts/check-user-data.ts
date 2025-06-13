import { prisma } from '../src/lib/db'

async function checkUserData() {
  console.log('🔍 Checking user data for Twitter monitoring issues...\n')

  // Check all users
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      xUsername: true,
      xUserId: true,
      autoMonitoringEnabled: true,
      lastTweetCheck: true,
      tweetCheckCount: true,
    },
    orderBy: {
      joinDate: 'desc'
    }
  })

  console.log(`📊 Total users in database: ${allUsers.length}\n`)

  // Categorize users
  const usersWithTwitter = allUsers.filter(u => u.xUsername && u.xUserId)
  const usersWithoutTwitter = allUsers.filter(u => !u.xUsername || !u.xUserId)
  const usersWithMonitoringEnabled = allUsers.filter(u => u.autoMonitoringEnabled)
  const usersWithMonitoringDisabled = allUsers.filter(u => !u.autoMonitoringEnabled)

  console.log('📈 User Categories:')
  console.log(`✅ Users with Twitter data: ${usersWithTwitter.length}`)
  console.log(`❌ Users without Twitter data: ${usersWithoutTwitter.length}`)
  console.log(`🔄 Users with monitoring enabled: ${usersWithMonitoringEnabled.length}`)
  console.log(`⏸️  Users with monitoring disabled: ${usersWithMonitoringDisabled.length}\n`)

  // Show problematic users
  if (usersWithoutTwitter.length > 0) {
    console.log('❌ Users without Twitter data (causing monitoring errors):')
    usersWithoutTwitter.forEach(user => {
      console.log(`  - ID: ${user.id}`)
      console.log(`    Name: ${user.name || 'No name'}`)
      console.log(`    Email: ${user.email || 'No email'}`)
      console.log(`    xUsername: ${user.xUsername || 'MISSING'}`)
      console.log(`    xUserId: ${user.xUserId || 'MISSING'}`)
      console.log(`    Monitoring enabled: ${user.autoMonitoringEnabled}`)
      console.log('')
    })
  }

  // Check monitoring status
  const monitoringData = await prisma.tweetMonitoring.findMany({
    include: {
      user: {
        select: {
          xUsername: true,
          name: true,
          autoMonitoringEnabled: true,
        }
      }
    },
    orderBy: {
      lastCheckAt: 'desc'
    }
  })

  console.log(`📊 Tweet monitoring records: ${monitoringData.length}\n`)

  const errorRecords = monitoringData.filter(m => m.status === 'error')
  if (errorRecords.length > 0) {
    console.log('🚨 Monitoring records with errors:')
    errorRecords.forEach(record => {
      console.log(`  - User: ${record.user.name || 'No name'} (@${record.user.xUsername || 'NO_USERNAME'})`)
      console.log(`    Status: ${record.status}`)
      console.log(`    Error: ${record.errorMessage || 'No error message'}`)
      console.log(`    Last check: ${record.lastCheckAt}`)
      console.log(`    Tweets found: ${record.tweetsFound}`)
      console.log('')
    })
  }

  // Check for users that should be monitored but aren't
  const shouldBeMonitored = await prisma.user.findMany({
    where: {
      autoMonitoringEnabled: true,
      xUsername: {
        not: null
      }
    },
    select: {
      id: true,
      xUsername: true,
      name: true,
    }
  })

  console.log(`🎯 Users that should be monitored: ${shouldBeMonitored.length}`)
  shouldBeMonitored.forEach(user => {
    console.log(`  - ${user.name || 'No name'} (@${user.xUsername})`)
  })

  await prisma.$disconnect()
}

checkUserData().catch(console.error)
