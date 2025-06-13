#!/usr/bin/env tsx

import { prisma } from '../src/lib/db'

interface TestResult {
  success: boolean
  message: string
  details?: any
}

async function testMentionTracking(): Promise<void> {
  console.log('🧪 Testing Automated Mention Tracking System')
  console.log('============================================\n')

  const results: TestResult[] = []

  try {
    // Test 1: Database Connection
    console.log('1️⃣ Testing database connection...')
    try {
      await prisma.$connect()
      results.push({ success: true, message: 'Database connection successful' })
      console.log('   ✅ Database connected successfully\n')
    } catch (error) {
      results.push({ 
        success: false, 
        message: 'Database connection failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      })
      console.log('   ❌ Database connection failed\n')
      return
    }

    // Test 2: Check Required Tables
    console.log('2️⃣ Checking required database tables...')
    try {
      const tweetTrackingCount = await prisma.tweetTracking.count()
      const systemConfigCount = await prisma.systemConfig.count()
      
      results.push({ 
        success: true, 
        message: 'Required tables exist',
        details: { tweetTrackingCount, systemConfigCount }
      })
      console.log(`   ✅ TweetTracking table: ${tweetTrackingCount} records`)
      console.log(`   ✅ SystemConfig table: ${systemConfigCount} records\n`)
    } catch (error) {
      results.push({ 
        success: false, 
        message: 'Required tables missing or inaccessible',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
      console.log('   ❌ Required tables not found\n')
    }

    // Test 3: Check Environment Variables
    console.log('3️⃣ Checking environment variables...')
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      TWITTER_BEARER_TOKEN: !!process.env.TWITTER_BEARER_TOKEN,
      MENTION_TRACKER_SECRET: !!process.env.MENTION_TRACKER_SECRET,
      NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL
    }

    const missingVars = Object.entries(envVars)
      .filter(([_, exists]) => !exists)
      .map(([name, _]) => name)

    if (missingVars.length === 0) {
      results.push({ success: true, message: 'All environment variables set' })
      console.log('   ✅ All required environment variables are set\n')
    } else {
      results.push({ 
        success: false, 
        message: 'Missing environment variables',
        details: missingVars
      })
      console.log(`   ❌ Missing variables: ${missingVars.join(', ')}\n`)
    }

    // Test 4: Check Users with X Credentials
    console.log('4️⃣ Checking users with X credentials...')
    try {
      const usersWithXCredentials = await prisma.user.findMany({
        where: {
          AND: [
            { xUserId: { not: null } },
            { xUsername: { not: null } },
            { autoMonitoringEnabled: true }
          ]
        },
        select: {
          id: true,
          name: true,
          xUsername: true,
          xUserId: true,
          totalPoints: true
        }
      })

      results.push({ 
        success: true, 
        message: `Found ${usersWithXCredentials.length} users ready for monitoring`,
        details: usersWithXCredentials
      })
      
      console.log(`   ✅ Found ${usersWithXCredentials.length} users ready for monitoring`)
      usersWithXCredentials.forEach(user => {
        console.log(`      - ${user.name} (@${user.xUsername}) - ${user.totalPoints} points`)
      })
      console.log('')
    } catch (error) {
      results.push({ 
        success: false, 
        message: 'Error checking users',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
      console.log('   ❌ Error checking users\n')
    }

    // Test 5: Test Database Functions
    console.log('5️⃣ Testing database functions...')
    try {
      // Test system config functions
      await prisma.$executeRaw`SELECT set_system_config('test_key', 'test_value')`
      const testValue = await prisma.$queryRaw<[{get_system_config: string}]>`SELECT get_system_config('test_key') as get_system_config`
      
      if (testValue[0]?.get_system_config === 'test_value') {
        results.push({ success: true, message: 'Database functions working correctly' })
        console.log('   ✅ Database functions are working correctly\n')
      } else {
        results.push({ success: false, message: 'Database functions not working correctly' })
        console.log('   ❌ Database functions not working correctly\n')
      }

      // Clean up test data
      await prisma.systemConfig.delete({ where: { key: 'test_key' } }).catch(() => {})
    } catch (error) {
      results.push({ 
        success: false, 
        message: 'Database functions test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
      console.log('   ❌ Database functions test failed\n')
    }

    // Test 6: Test API Endpoint
    console.log('6️⃣ Testing API endpoint...')
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const apiUrl = `${siteUrl}/api/mentions/track`
      
      console.log(`   Testing: ${apiUrl}`)
      
      const response = await fetch(apiUrl, {
        method: 'GET'
      })

      if (response.ok) {
        const data = await response.json()
        results.push({ 
          success: true, 
          message: 'API endpoint accessible',
          details: data
        })
        console.log('   ✅ API endpoint is accessible\n')
      } else {
        results.push({ 
          success: false, 
          message: `API endpoint returned ${response.status}`,
          details: await response.text()
        })
        console.log(`   ❌ API endpoint returned ${response.status}\n`)
      }
    } catch (error) {
      results.push({ 
        success: false, 
        message: 'API endpoint test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
      console.log('   ❌ API endpoint test failed\n')
    }

    // Summary
    console.log('📊 Test Summary')
    console.log('===============')
    
    const successCount = results.filter(r => r.success).length
    const totalTests = results.length
    
    console.log(`✅ Passed: ${successCount}/${totalTests} tests`)
    
    if (successCount === totalTests) {
      console.log('\n🎉 All tests passed! The mention tracking system is ready.')
      console.log('\n📋 Next steps:')
      console.log('1. Deploy the edge function: npm run deploy:mentions')
      console.log('2. Set up the cron job at https://cron-job.org')
      console.log('3. Monitor the system for incoming mentions')
    } else {
      console.log('\n⚠️  Some tests failed. Please review the issues above.')
      
      const failedTests = results.filter(r => !r.success)
      console.log('\n❌ Failed tests:')
      failedTests.forEach(test => {
        console.log(`   - ${test.message}`)
        if (test.details) {
          console.log(`     Details: ${JSON.stringify(test.details, null, 2)}`)
        }
      })
    }

  } catch (error) {
    console.error('💥 Fatal error during testing:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testMentionTracking().catch(console.error)
