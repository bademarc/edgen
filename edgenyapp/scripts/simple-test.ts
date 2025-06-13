#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function simpleTest() {
  try {
    console.log('🧪 Running simple authentication test...')
    
    // Test database connection
    const userCount = await prisma.user.count()
    console.log(`✅ Database connected. Found ${userCount} users.`)
    
    // Check for users with missing credentials
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
    
    console.log(`Found ${usersWithMissingCredentials.length} users with missing credentials:`)
    
    for (const user of usersWithMissingCredentials) {
      console.log(`- ${user.name || user.id}: username=${user.xUsername || 'missing'}, userId=${user.xUserId || 'missing'}, monitoring=${user.autoMonitoringEnabled}`)
    }
    
    // Check monitoring status
    const errorMonitoring = await prisma.tweetMonitoring.findMany({
      where: {
        status: 'error'
      },
      select: {
        userId: true,
        errorMessage: true,
        user: {
          select: {
            name: true
          }
        }
      }
    })
    
    console.log(`\nFound ${errorMonitoring.length} users with monitoring errors:`)
    
    for (const monitoring of errorMonitoring) {
      console.log(`- ${monitoring.user.name || monitoring.userId}: ${monitoring.errorMessage}`)
    }
    
    console.log('\n✅ Simple test completed successfully')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

simpleTest()
