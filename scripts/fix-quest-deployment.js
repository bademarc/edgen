/**
 * Quest System Deployment Fix Script
 * Diagnoses and fixes quest system issues on the live deployment
 */

// Import fetch for Node.js
import fetch from 'node-fetch'

const DEPLOYMENT_URL = 'https://edgen.koyeb.app'
const ADMIN_SECRET = 'layeredge-admin-secret-2024'

class QuestDeploymentFixer {
  constructor() {
    this.results = {
      authentication: { status: 'unknown', details: null },
      questInitialization: { status: 'unknown', details: null },
      questAPI: { status: 'unknown', details: null },
      database: { status: 'unknown', details: null }
    }
  }

  async runDiagnostics() {
    console.log('🔍 Starting Quest System Deployment Diagnostics')
    console.log('='.repeat(60))

    try {
      await this.checkSystemHealth()
      await this.checkAuthentication()
      await this.initializeQuests()
      await this.testQuestAPI()
      await this.validateDatabase()
      
      this.printResults()
      await this.generateFixRecommendations()
    } catch (error) {
      console.error('❌ Diagnostics failed:', error)
    }
  }

  async checkSystemHealth() {
    console.log('\n🏥 Checking System Health...')
    
    try {
      const response = await fetch(`${DEPLOYMENT_URL}/api/health`)
      const data = await response.json()
      
      if (response.ok && data.system.status === 'healthy') {
        console.log('✅ System health: OK')
        console.log(`   - Twitter API: ${data.services.twitterApi.healthy ? 'Healthy' : 'Unhealthy'}`)
        console.log(`   - Cache Service: ${data.services.cacheService ? 'Working' : 'Failed'}`)
        console.log(`   - Database: ${data.environment.databaseUrl ? 'Connected' : 'Disconnected'}`)
      } else {
        console.log('❌ System health: Issues detected')
        console.log('   Issues:', data.system.issues || ['Unknown'])
      }
    } catch (error) {
      console.log('❌ System health check failed:', error.message)
    }
  }

  async checkAuthentication() {
    console.log('\n🔐 Checking Authentication System...')
    
    try {
      const response = await fetch(`${DEPLOYMENT_URL}/api/auth/debug`)
      const data = await response.json()
      
      this.results.authentication.details = data
      
      if (data.supabaseAuth.error) {
        console.log('❌ Supabase Authentication Issues:')
        console.log(`   Error: ${data.supabaseAuth.error}`)
        this.results.authentication.status = 'failed'
      } else {
        console.log('✅ Authentication system configured')
        this.results.authentication.status = 'working'
      }
      
      console.log(`   Universal Auth: ${data.universalAuth.isAuthenticated ? 'Working' : 'Not authenticated'}`)
      console.log(`   Custom Session: ${data.customSession.userId ? 'Active' : 'None'}`)
      
    } catch (error) {
      console.log('❌ Authentication check failed:', error.message)
      this.results.authentication.status = 'error'
    }
  }

  async initializeQuests() {
    console.log('\n🎯 Initializing Quest System...')
    
    try {
      const response = await fetch(`${DEPLOYMENT_URL}/api/quests/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ secret: ADMIN_SECRET })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        console.log('✅ Quest initialization: Success')
        console.log('   Default quests have been created/updated')
        this.results.questInitialization.status = 'success'
        this.results.questInitialization.details = data
      } else {
        console.log('❌ Quest initialization failed:')
        console.log(`   Error: ${data.error || 'Unknown error'}`)
        console.log(`   Status: ${response.status}`)
        this.results.questInitialization.status = 'failed'
        this.results.questInitialization.details = data
      }
    } catch (error) {
      console.log('❌ Quest initialization error:', error.message)
      this.results.questInitialization.status = 'error'
    }
  }

  async testQuestAPI() {
    console.log('\n🔌 Testing Quest API Endpoints...')
    
    // Test unauthenticated request (should return 401)
    try {
      const response = await fetch(`${DEPLOYMENT_URL}/api/quests`)
      const data = await response.json()
      
      if (response.status === 401) {
        console.log('✅ Quest API authentication: Working correctly')
        console.log(`   Unauthenticated request properly rejected: ${data.message}`)
        this.results.questAPI.status = 'working'
      } else {
        console.log('❌ Quest API authentication: Issues detected')
        console.log(`   Expected 401, got ${response.status}`)
        this.results.questAPI.status = 'failed'
      }
      
      this.results.questAPI.details = { response: response.status, data }
    } catch (error) {
      console.log('❌ Quest API test failed:', error.message)
      this.results.questAPI.status = 'error'
    }
  }

  async validateDatabase() {
    console.log('\n🗄️ Validating Database Configuration...')
    
    try {
      // Check if we can access any public endpoint that uses the database
      const response = await fetch(`${DEPLOYMENT_URL}/api/leaderboard?limit=1`)
      const data = await response.json()
      
      if (response.ok && data.users) {
        console.log('✅ Database connection: Working')
        console.log(`   Leaderboard query successful: ${data.users.length} users`)
        this.results.database.status = 'working'
      } else {
        console.log('❌ Database connection: Issues detected')
        console.log(`   Leaderboard query failed: ${response.status}`)
        this.results.database.status = 'failed'
      }
      
      this.results.database.details = { response: response.status, data }
    } catch (error) {
      console.log('❌ Database validation failed:', error.message)
      this.results.database.status = 'error'
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60))
    console.log('📊 QUEST SYSTEM DIAGNOSTICS SUMMARY')
    console.log('='.repeat(60))

    const statusIcon = (status) => {
      switch (status) {
        case 'working':
        case 'success': return '✅'
        case 'failed': return '❌'
        case 'error': return '🔥'
        default: return '❓'
      }
    }

    console.log(`${statusIcon(this.results.authentication.status)} Authentication: ${this.results.authentication.status}`)
    console.log(`${statusIcon(this.results.questInitialization.status)} Quest Initialization: ${this.results.questInitialization.status}`)
    console.log(`${statusIcon(this.results.questAPI.status)} Quest API: ${this.results.questAPI.status}`)
    console.log(`${statusIcon(this.results.database.status)} Database: ${this.results.database.status}`)
  }

  async generateFixRecommendations() {
    console.log('\n🔧 FIX RECOMMENDATIONS')
    console.log('-'.repeat(40))

    const issues = []
    const fixes = []

    // Check for authentication issues
    if (this.results.authentication.status === 'failed') {
      issues.push('Authentication system not working properly')
      fixes.push('1. Check Supabase configuration in Koyeb environment variables')
      fixes.push('2. Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
      fixes.push('3. Test Twitter OAuth flow manually')
    }

    // Check for quest initialization issues
    if (this.results.questInitialization.status === 'failed') {
      issues.push('Quest initialization failed')
      fixes.push('4. Verify ADMIN_SECRET environment variable in Koyeb')
      fixes.push('5. Check database permissions for quest table operations')
      fixes.push('6. Run database migrations if needed')
    }

    // Check for API issues
    if (this.results.questAPI.status === 'failed') {
      issues.push('Quest API not responding correctly')
      fixes.push('7. Check quest service implementation')
      fixes.push('8. Verify database schema for Quest and UserQuest tables')
    }

    // Check for database issues
    if (this.results.database.status === 'failed') {
      issues.push('Database connection problems')
      fixes.push('9. Verify DATABASE_URL in Koyeb environment')
      fixes.push('10. Check Supabase database status')
      fixes.push('11. Run Prisma migrations: npx prisma migrate deploy')
    }

    if (issues.length === 0) {
      console.log('🎉 No critical issues detected!')
      console.log('   The quest system should be working correctly.')
      console.log('   If users are still experiencing issues, check:')
      console.log('   - User authentication flow')
      console.log('   - Frontend error handling')
      console.log('   - Browser console for JavaScript errors')
    } else {
      console.log('⚠️ Issues detected:')
      issues.forEach(issue => console.log(`   • ${issue}`))
      
      console.log('\n🛠️ Recommended fixes:')
      fixes.forEach(fix => console.log(`   ${fix}`))
    }

    console.log('\n📋 Next Steps:')
    console.log('1. Apply the recommended fixes above')
    console.log('2. Test the quest page manually: https://edgen.koyeb.app/quests')
    console.log('3. Sign in with Twitter and verify quest loading')
    console.log('4. Test quest actions (start, complete, claim)')
    console.log('5. Monitor server logs for any remaining errors')
  }
}

// Run the diagnostics
const fixer = new QuestDeploymentFixer()
fixer.runDiagnostics().catch(console.error)
