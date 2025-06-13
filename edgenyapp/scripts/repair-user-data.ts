import { prisma } from '../src/lib/db'

async function repairUserData() {
  console.log('🔧 Starting user data repair process...\n')

  // Find users with xUserId but missing xUsername
  const problematicUsers = await prisma.user.findMany({
    where: {
      xUserId: {
        not: null
      },
      xUsername: null
    },
    select: {
      id: true,
      name: true,
      xUserId: true,
      autoMonitoringEnabled: true,
    }
  })

  console.log(`Found ${problematicUsers.length} users with missing Twitter usernames\n`)

  if (problematicUsers.length === 0) {
    console.log('✅ No users need repair!')
    await prisma.$disconnect()
    return
  }

  // For now, we'll disable monitoring for these users until they re-authenticate
  // In a real scenario, you might want to try to fetch usernames from Twitter API
  console.log('🔧 Disabling automatic monitoring for users with missing Twitter usernames...')

  for (const user of problematicUsers) {
    try {
      // Disable monitoring for users without proper Twitter data
      await prisma.user.update({
        where: { id: user.id },
        data: {
          autoMonitoringEnabled: false
        }
      })

      // Update their monitoring status to indicate the issue
      await prisma.tweetMonitoring.upsert({
        where: { userId: user.id },
        update: {
          status: 'error',
          errorMessage: 'Missing Twitter username - please re-authenticate'
        },
        create: {
          userId: user.id,
          status: 'error',
          errorMessage: 'Missing Twitter username - please re-authenticate',
          tweetsFound: 0
        }
      })

      console.log(`✅ Updated user ${user.name || user.id} - monitoring disabled`)
    } catch (error) {
      console.error(`❌ Failed to update user ${user.id}:`, error)
    }
  }

  // Also check for users with invalid/empty usernames
  const usersWithEmptyUsernames = await prisma.user.findMany({
    where: {
      OR: [
        { xUsername: '' },
        { xUsername: null }
      ],
      autoMonitoringEnabled: true
    },
    select: {
      id: true,
      name: true,
      xUsername: true,
      xUserId: true,
    }
  })

  if (usersWithEmptyUsernames.length > 0) {
    console.log(`\n🔧 Found ${usersWithEmptyUsernames.length} users with empty/null usernames`)
    
    for (const user of usersWithEmptyUsernames) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          autoMonitoringEnabled: false
        }
      })
      console.log(`✅ Disabled monitoring for user ${user.name || user.id}`)
    }
  }

  console.log('\n📊 Final status check...')
  
  // Check final state
  const finalCheck = await prisma.user.findMany({
    where: {
      autoMonitoringEnabled: true
    },
    select: {
      id: true,
      name: true,
      xUsername: true,
      xUserId: true,
    }
  })

  const validUsers = finalCheck.filter(u => u.xUsername && u.xUserId)
  const invalidUsers = finalCheck.filter(u => !u.xUsername || !u.xUserId)

  console.log(`✅ Users with valid Twitter data and monitoring enabled: ${validUsers.length}`)
  console.log(`❌ Users still with invalid data: ${invalidUsers.length}`)

  if (validUsers.length > 0) {
    console.log('\n✅ Users ready for monitoring:')
    validUsers.forEach(user => {
      console.log(`  - ${user.name || 'No name'} (@${user.xUsername})`)
    })
  }

  if (invalidUsers.length > 0) {
    console.log('\n❌ Users still with issues:')
    invalidUsers.forEach(user => {
      console.log(`  - ${user.name || 'No name'} (username: ${user.xUsername || 'MISSING'})`)
    })
  }

  console.log('\n🎉 User data repair completed!')
  await prisma.$disconnect()
}

repairUserData().catch(console.error)
