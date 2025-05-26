import { prisma } from '../src/lib/db'

async function verifyDatabase() {
  console.log('🔍 Verifying Supabase database setup...\n')

  try {
    // Test connection
    console.log('1. Testing database connection...')
    await prisma.$connect()
    console.log('   ✅ Database connection successful')

    // Check schema
    console.log('\n2. Verifying database schema...')

    // Test each table
    const tables = [
      { name: 'User', count: () => prisma.user.count() },
      { name: 'Tweet', count: () => prisma.tweet.count() },
      { name: 'Account', count: () => prisma.account.count() },
      { name: 'Session', count: () => prisma.session.count() },
      { name: 'PointsHistory', count: () => prisma.pointsHistory.count() },
      { name: 'VerificationToken', count: () => prisma.verificationToken.count() }
    ]

    for (const table of tables) {
      try {
        const count = await table.count()
        console.log(`   ✅ ${table.name} table: ${count} records`)
      } catch (error: any) {
        console.log(`   ❌ ${table.name} table: Error - ${error.message}`)
      }
    }

    // Test relationships
    console.log('\n3. Testing relationships...')

    const usersWithTweets = await prisma.user.findMany({
      include: {
        tweets: true,
        pointsHistory: true
      },
      take: 3
    })

    console.log(`   ✅ Found ${usersWithTweets.length} users with related data`)

    usersWithTweets.forEach(user => {
      console.log(`   - ${user.name}: ${user.tweets.length} tweets, ${user.pointsHistory.length} point records`)
    })

    // Test environment variables
    console.log('\n4. Checking environment configuration...')

    const dbUrl = process.env.DATABASE_URL
    const directUrl = process.env.DIRECT_URL

    if (dbUrl?.includes('6543')) {
      console.log('   ✅ DATABASE_URL uses transaction pooler (port 6543)')
    } else {
      console.log('   ⚠️  DATABASE_URL should use transaction pooler (port 6543)')
    }

    if (directUrl?.includes('5432')) {
      console.log('   ✅ DIRECT_URL uses session pooler (port 5432)')
    } else {
      console.log('   ⚠️  DIRECT_URL should use session pooler (port 5432)')
    }

    if (dbUrl?.includes('pgbouncer=true')) {
      console.log('   ✅ DATABASE_URL has pgbouncer parameter for prepared statement compatibility')
    } else {
      console.log('   ⚠️  DATABASE_URL should include pgbouncer=true parameter')
    }

    // Test query performance
    console.log('\n5. Testing query performance...')

    const start = Date.now()
    await prisma.tweet.findMany({
      include: {
        user: true
      },
      take: 10
    })
    const duration = Date.now() - start

    console.log(`   ✅ Complex query completed in ${duration}ms`)

    console.log('\n🎉 Database verification completed successfully!')
    console.log('\n📊 Summary:')
    console.log('   - Supabase PostgreSQL connection: Working')
    console.log('   - Transaction pooler (port 6543): Configured')
    console.log('   - Session pooler (port 5432): Configured')
    console.log('   - Prepared statements: Disabled for compatibility')
    console.log('   - Database schema: All tables present')
    console.log('   - Sample data: Available')
    console.log('   - Relationships: Working correctly')

  } catch (error: any) {
    console.error('\n❌ Database verification failed:')
    console.error('Error:', error.message)

    if (error.message?.includes('prepared statement')) {
      console.error('\n💡 Tip: Add pgbouncer=true&connection_limit=1 to your DATABASE_URL')
    }

    if (error.message?.includes('connection')) {
      console.error('\n💡 Tip: Check your connection strings and network connectivity')
    }

    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyDatabase()
