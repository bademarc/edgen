#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixAuthenticationIssues() {
  try {
    console.log('🔧 Fixing authentication issues...')
    
    // Find users with missing credentials
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
    
    console.log(`Found ${usersWithMissingCredentials.length} users with missing credentials`)
    
    let fixedCount = 0
    
    for (const user of usersWithMissingCredentials) {
      try {
        console.log(`Fixing user: ${user.name || user.id}`)
        
        // Disable monitoring for users with incomplete credentials
        await prisma.user.update({
          where: { id: user.id },
          data: {
            autoMonitoringEnabled: false
          }
        })
        
        // Update monitoring status with clear error message
        await prisma.tweetMonitoring.upsert({
          where: { userId: user.id },
          update: {
            status: 'error',
            errorMessage: 'Incomplete Twitter credentials - please re-authenticate with Twitter to refresh your credentials'
          },
          create: {
            userId: user.id,
            status: 'error',
            errorMessage: 'Incomplete Twitter credentials - please re-authenticate with Twitter to refresh your credentials',
            tweetsFound: 0
          }
        })
        
        console.log(`✅ Fixed user: ${user.name || user.id}`)
        fixedCount++
        
      } catch (error) {
        console.error(`❌ Failed to fix user ${user.id}:`, error)
      }
    }
    
    console.log(`\n🎉 Successfully fixed ${fixedCount} users`)
    console.log('\n📋 Next steps for users:')
    console.log('1. Users will see a re-authentication button in their dashboard')
    console.log('2. They should click the re-authentication button (↗) to sign out and sign in again')
    console.log('3. This will refresh their Twitter credentials and re-enable monitoring')
    
  } catch (error) {
    console.error('❌ Fix operation failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAuthenticationIssues()
