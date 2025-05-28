#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface TwitterUser {
  id: string
  username: string
  name: string
}

async function fetchTwitterUserById(userId: string): Promise<TwitterUser | null> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN
  
  if (!bearerToken) {
    console.error('❌ Twitter Bearer Token not found')
    return null
  }

  try {
    const url = `https://api.twitter.com/2/users/${userId}?user.fields=username,name`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`❌ Twitter API error: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()
    
    if (data.errors) {
      console.error('❌ Twitter API errors:', data.errors)
      return null
    }

    if (!data.data) {
      console.error('❌ No user data returned from Twitter API')
      return null
    }

    return {
      id: data.data.id,
      username: data.data.username,
      name: data.data.name
    }
  } catch (error) {
    console.error('❌ Error fetching Twitter user:', error)
    return null
  }
}

async function fixUserData() {
  console.log('🔧 Fixing user data for LayerEdge community platform...\n')

  try {
    // Find users with missing usernames but have user IDs
    const usersWithMissingUsernames = await prisma.user.findMany({
      where: {
        AND: [
          { xUserId: { not: null } },
          { xUserId: { not: '' } },
          {
            OR: [
              { xUsername: null },
              { xUsername: '' }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        xUserId: true,
        xUsername: true,
        autoMonitoringEnabled: true
      }
    })

    console.log(`Found ${usersWithMissingUsernames.length} users with missing usernames:`)
    
    if (usersWithMissingUsernames.length === 0) {
      console.log('✅ No users need username fixes')
      return
    }

    for (const user of usersWithMissingUsernames) {
      console.log(`\n🔍 Processing user: ${user.name} (ID: ${user.id})`)
      console.log(`   Twitter User ID: ${user.xUserId}`)
      console.log(`   Current Username: ${user.xUsername || 'MISSING'}`)

      if (!user.xUserId) {
        console.log('   ⚠️ Skipping - no Twitter user ID')
        continue
      }

      // Fetch username from Twitter API
      console.log('   📡 Fetching username from Twitter API...')
      const twitterUser = await fetchTwitterUserById(user.xUserId)

      if (!twitterUser) {
        console.log('   ❌ Failed to fetch Twitter user data')
        continue
      }

      console.log(`   ✅ Found Twitter user: @${twitterUser.username} (${twitterUser.name})`)

      // Update user in database
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            xUsername: twitterUser.username,
            name: twitterUser.name // Update name too in case it changed
          }
        })

        console.log(`   ✅ Updated user ${user.id} with username: @${twitterUser.username}`)

        // Enable monitoring if it was disabled due to missing credentials
        if (!user.autoMonitoringEnabled) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              autoMonitoringEnabled: true
            }
          })
          console.log(`   ✅ Enabled auto-monitoring for user`)
        }

        // Clear any error status in monitoring
        await prisma.tweetMonitoring.updateMany({
          where: { 
            userId: user.id,
            errorMessage: {
              contains: 'Incomplete Twitter credentials'
            }
          },
          data: {
            status: 'active',
            errorMessage: null
          }
        })

      } catch (updateError) {
        console.error(`   ❌ Failed to update user ${user.id}:`, updateError)
      }

      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n📊 Summary:')
    
    // Check how many users now have complete credentials
    const usersWithCompleteCredentials = await prisma.user.count({
      where: {
        AND: [
          { xUserId: { not: null } },
          { xUserId: { not: '' } },
          { xUsername: { not: null } },
          { xUsername: { not: '' } },
          { autoMonitoringEnabled: true }
        ]
      }
    })

    const usersStillMissingCredentials = await prisma.user.count({
      where: {
        OR: [
          { xUserId: null },
          { xUserId: '' },
          { xUsername: null },
          { xUsername: '' }
        ]
      }
    })

    console.log(`✅ Users with complete Twitter credentials: ${usersWithCompleteCredentials}`)
    console.log(`⚠️ Users still missing credentials: ${usersStillMissingCredentials}`)
    console.log('\n🎉 User data fix completed!')

  } catch (error) {
    console.error('❌ Error fixing user data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the fix
fixUserData().catch(console.error)
