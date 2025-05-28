#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function diagnoseSystem() {
  console.log('🔍 LayerEdge Community Platform System Diagnosis')
  console.log('=' .repeat(60))

  try {
    // 1. Database Connection
    console.log('\n1️⃣ Database Connection:')
    try {
      await prisma.$connect()
      const userCount = await prisma.user.count()
      const tweetCount = await prisma.tweet.count()
      console.log(`   ✅ Database connected successfully`)
      console.log(`   📊 Users: ${userCount}, Tweets: ${tweetCount}`)
    } catch (error) {
      console.log(`   ❌ Database connection failed: ${error}`)
      return
    }

    // 2. Environment Variables
    console.log('\n2️⃣ Environment Variables:')
    const envVars = {
      'TWITTER_BEARER_TOKEN': !!process.env.TWITTER_BEARER_TOKEN,
      'TWITTER_CLIENT_ID': !!process.env.TWITTER_CLIENT_ID,
      'TWITTER_CLIENT_SECRET': !!process.env.TWITTER_CLIENT_SECRET,
      'NEXT_PUBLIC_SUPABASE_URL': !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'DATABASE_URL': !!process.env.DATABASE_URL,
      'MENTION_TRACKER_SECRET': !!process.env.MENTION_TRACKER_SECRET,
      'ENABLE_WEB_SCRAPING': process.env.ENABLE_WEB_SCRAPING,
      'NODE_ENV': process.env.NODE_ENV
    }

    for (const [key, value] of Object.entries(envVars)) {
      const status = value === true ? '✅' : value === false ? '❌' : `📝 ${value}`
      console.log(`   ${status} ${key}`)
    }

    // 3. User Credentials Status
    console.log('\n3️⃣ User Credentials Status:')
    
    const usersWithCompleteCredentials = await prisma.user.findMany({
      where: {
        AND: [
          { xUserId: { not: null } },
          { xUserId: { not: '' } },
          { xUsername: { not: null } },
          { xUsername: { not: '' } },
          { autoMonitoringEnabled: true }
        ]
      },
      select: {
        id: true,
        name: true,
        xUsername: true,
        autoMonitoringEnabled: true
      }
    })

    const usersWithMissingCredentials = await prisma.user.findMany({
      where: {
        OR: [
          { xUserId: null },
          { xUserId: '' },
          { xUsername: null },
          { xUsername: '' }
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

    console.log(`   ✅ Users ready for monitoring: ${usersWithCompleteCredentials.length}`)
    console.log(`   ⚠️ Users with missing credentials: ${usersWithMissingCredentials.length}`)

    if (usersWithCompleteCredentials.length > 0) {
      console.log('\n   👥 Users ready for monitoring:')
      usersWithCompleteCredentials.forEach(user => {
        console.log(`      - ${user.name} (@${user.xUsername})`)
      })
    }

    if (usersWithMissingCredentials.length > 0) {
      console.log('\n   ⚠️ Users with missing credentials:')
      usersWithMissingCredentials.forEach(user => {
        console.log(`      - ${user.name}: username=${user.xUsername || 'missing'}, userId=${user.xUserId || 'missing'}`)
      })
    }

    // 4. Monitoring Status
    console.log('\n4️⃣ Monitoring Status:')
    
    const monitoringErrors = await prisma.tweetMonitoring.findMany({
      where: {
        status: 'error'
      },
      include: {
        user: {
          select: {
            name: true,
            xUsername: true
          }
        }
      },
      orderBy: {
        lastCheckAt: 'desc'
      }
    })

    console.log(`   📊 Users with monitoring errors: ${monitoringErrors.length}`)

    if (monitoringErrors.length > 0) {
      console.log('\n   ❌ Recent monitoring errors:')
      monitoringErrors.slice(0, 5).forEach(error => {
        console.log(`      - ${error.user.name} (@${error.user.xUsername}): ${error.errorMessage}`)
      })
    }

    // 5. Recent Activity
    console.log('\n5️⃣ Recent Activity:')
    
    const recentTweets = await prisma.tweet.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })

    const recentMonitoring = await prisma.tweetMonitoring.findFirst({
      orderBy: {
        lastCheckAt: 'desc'
      },
      include: {
        user: {
          select: {
            name: true,
            xUsername: true
          }
        }
      }
    })

    console.log(`   📈 Tweets processed in last 24h: ${recentTweets}`)
    if (recentMonitoring) {
      console.log(`   🕐 Last monitoring check: ${recentMonitoring.lastCheckAt.toISOString()}`)
      console.log(`   👤 Last checked user: ${recentMonitoring.user.name} (@${recentMonitoring.user.xUsername})`)
      console.log(`   📊 Status: ${recentMonitoring.status}`)
    }

    // 6. System Recommendations
    console.log('\n6️⃣ System Recommendations:')
    
    const recommendations = []

    if (!process.env.TWITTER_BEARER_TOKEN) {
      recommendations.push('❌ Set TWITTER_BEARER_TOKEN environment variable')
    }

    if (usersWithMissingCredentials.length > 0) {
      recommendations.push(`⚠️ ${usersWithMissingCredentials.length} users need to re-authenticate with Twitter`)
    }

    if (monitoringErrors.length > 0) {
      recommendations.push(`🔧 ${monitoringErrors.length} users have monitoring errors that need attention`)
    }

    if (recentTweets === 0) {
      recommendations.push('📈 No tweets processed recently - check if monitoring is working')
    }

    if (recommendations.length === 0) {
      console.log('   ✅ System appears to be functioning correctly!')
    } else {
      recommendations.forEach(rec => console.log(`   ${rec}`))
    }

    console.log('\n' + '=' .repeat(60))
    console.log('🎯 Next Steps:')
    console.log('1. Deploy the improved error logging to production')
    console.log('2. Test the manual trigger endpoint: POST /api/mentions/trigger')
    console.log('3. Check production logs for specific error details')
    console.log('4. Verify Playwright browser installation in Koyeb')
    console.log('5. Test individual user monitoring: POST /api/monitoring/user')

  } catch (error) {
    console.error('❌ Diagnosis failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the diagnosis
diagnoseSystem().catch(console.error)
