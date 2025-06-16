/**
 * Final Quest Deployment Validation Script
 * Comprehensive test of the quest system on live deployment
 */

import fetch from 'node-fetch'

const DEPLOYMENT_URL = 'https://edgen.koyeb.app'

class QuestDeploymentValidator {
  async validateDeployment() {
    console.log('🎯 LayerEdge Quest System - Final Validation')
    console.log('='.repeat(60))
    console.log(`🌐 Testing deployment: ${DEPLOYMENT_URL}`)
    console.log('='.repeat(60))

    const results = {
      systemHealth: await this.checkSystemHealth(),
      questInitialization: await this.checkQuestInitialization(),
      apiEndpoints: await this.checkAPIEndpoints(),
      authenticationFlow: await this.checkAuthenticationFlow(),
      errorHandling: await this.checkErrorHandling()
    }

    this.printValidationResults(results)
    this.generateUserTestingGuide()
  }

  async checkSystemHealth() {
    console.log('\n🏥 System Health Check...')
    
    try {
      const response = await fetch(`${DEPLOYMENT_URL}/api/health`)
      const data = await response.json()
      
      const isHealthy = response.ok && data.system.status === 'healthy'
      console.log(`   ${isHealthy ? '✅' : '❌'} Overall system: ${data.system.status}`)
      console.log(`   ${data.services.twitterApi.healthy ? '✅' : '❌'} Twitter API: ${data.services.twitterApi.healthy ? 'Healthy' : 'Unhealthy'}`)
      console.log(`   ${data.services.cacheService ? '✅' : '❌'} Cache service: ${data.services.cacheService ? 'Working' : 'Failed'}`)
      console.log(`   ${data.environment.databaseUrl ? '✅' : '❌'} Database: ${data.environment.databaseUrl ? 'Connected' : 'Disconnected'}`)
      
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: data
      }
    } catch (error) {
      console.log('   ❌ System health check failed:', error.message)
      return { status: 'error', error: error.message }
    }
  }

  async checkQuestInitialization() {
    console.log('\n🎯 Quest Initialization Check...')
    
    try {
      const response = await fetch(`${DEPLOYMENT_URL}/api/quests/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: 'layeredge-admin-secret-2024' })
      })
      
      const data = await response.json()
      const isSuccess = response.ok && data.success
      
      console.log(`   ${isSuccess ? '✅' : '❌'} Quest initialization: ${isSuccess ? 'Success' : 'Failed'}`)
      if (!isSuccess) {
        console.log(`   Error: ${data.error}`)
      }
      
      return {
        status: isSuccess ? 'success' : 'failed',
        details: data
      }
    } catch (error) {
      console.log('   ❌ Quest initialization failed:', error.message)
      return { status: 'error', error: error.message }
    }
  }

  async checkAPIEndpoints() {
    console.log('\n🔌 API Endpoints Check...')
    
    const endpoints = [
      { path: '/api/quests', method: 'GET', expectedStatus: 401, description: 'Quest list (requires auth)' },
      { path: '/api/auth/debug', method: 'GET', expectedStatus: 200, description: 'Auth debug' },
      { path: '/api/leaderboard', method: 'GET', expectedStatus: 200, description: 'Leaderboard' }
    ]

    const results = []
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${DEPLOYMENT_URL}${endpoint.path}`, {
          method: endpoint.method
        })
        
        const isExpected = response.status === endpoint.expectedStatus
        console.log(`   ${isExpected ? '✅' : '❌'} ${endpoint.description}: ${response.status} (expected ${endpoint.expectedStatus})`)
        
        results.push({
          endpoint: endpoint.path,
          status: isExpected ? 'pass' : 'fail',
          actualStatus: response.status,
          expectedStatus: endpoint.expectedStatus
        })
      } catch (error) {
        console.log(`   ❌ ${endpoint.description}: Error - ${error.message}`)
        results.push({
          endpoint: endpoint.path,
          status: 'error',
          error: error.message
        })
      }
    }
    
    return results
  }

  async checkAuthenticationFlow() {
    console.log('\n🔐 Authentication Flow Check...')
    
    try {
      // Test Twitter OAuth initiation
      const response = await fetch(`${DEPLOYMENT_URL}/auth/twitter`, {
        method: 'GET',
        redirect: 'manual'
      })
      
      const isRedirect = response.status === 302 || response.status === 307
      console.log(`   ${isRedirect ? '✅' : '❌'} Twitter OAuth initiation: ${isRedirect ? 'Working' : 'Failed'}`)
      
      if (isRedirect) {
        const location = response.headers.get('location')
        const isTwitterRedirect = location && location.includes('twitter.com')
        console.log(`   ${isTwitterRedirect ? '✅' : '❌'} Redirect to Twitter: ${isTwitterRedirect ? 'Valid' : 'Invalid'}`)
      }
      
      return {
        status: isRedirect ? 'working' : 'failed',
        redirectUrl: response.headers.get('location')
      }
    } catch (error) {
      console.log('   ❌ Authentication flow check failed:', error.message)
      return { status: 'error', error: error.message }
    }
  }

  async checkErrorHandling() {
    console.log('\n🛡️ Error Handling Check...')
    
    try {
      // Test invalid quest action
      const response = await fetch(`${DEPLOYMENT_URL}/api/quests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invalid' })
      })
      
      const data = await response.json()
      const hasProperError = response.status === 401 && data.message
      
      console.log(`   ${hasProperError ? '✅' : '❌'} Unauthorized request handling: ${hasProperError ? 'Proper' : 'Improper'}`)
      console.log(`   Error message: "${data.message || 'None'}"`)
      
      return {
        status: hasProperError ? 'proper' : 'improper',
        errorMessage: data.message
      }
    } catch (error) {
      console.log('   ❌ Error handling check failed:', error.message)
      return { status: 'error', error: error.message }
    }
  }

  printValidationResults(results) {
    console.log('\n' + '='.repeat(60))
    console.log('📊 VALIDATION RESULTS SUMMARY')
    console.log('='.repeat(60))

    const getStatusIcon = (status) => {
      switch (status) {
        case 'healthy':
        case 'success':
        case 'working':
        case 'proper': return '✅'
        case 'unhealthy':
        case 'failed':
        case 'improper': return '❌'
        case 'error': return '🔥'
        default: return '❓'
      }
    }

    console.log(`${getStatusIcon(results.systemHealth.status)} System Health: ${results.systemHealth.status}`)
    console.log(`${getStatusIcon(results.questInitialization.status)} Quest Initialization: ${results.questInitialization.status}`)
    console.log(`${getStatusIcon(results.authenticationFlow.status)} Authentication Flow: ${results.authenticationFlow.status}`)
    console.log(`${getStatusIcon(results.errorHandling.status)} Error Handling: ${results.errorHandling.status}`)
    
    const apiPassed = results.apiEndpoints.filter(e => e.status === 'pass').length
    const apiTotal = results.apiEndpoints.length
    console.log(`${apiPassed === apiTotal ? '✅' : '❌'} API Endpoints: ${apiPassed}/${apiTotal} passed`)

    const overallStatus = [
      results.systemHealth.status,
      results.questInitialization.status,
      results.authenticationFlow.status,
      results.errorHandling.status
    ].every(status => ['healthy', 'success', 'working', 'proper'].includes(status)) && apiPassed === apiTotal

    console.log('\n' + '='.repeat(60))
    console.log(`🎯 OVERALL STATUS: ${overallStatus ? '✅ QUEST SYSTEM READY' : '⚠️ ISSUES DETECTED'}`)
    console.log('='.repeat(60))
  }

  generateUserTestingGuide() {
    console.log('\n📋 USER TESTING GUIDE')
    console.log('-'.repeat(40))
    console.log('The quest system is ready for user testing. Follow these steps:')
    console.log('')
    console.log('1. 🌐 Visit: https://edgen.koyeb.app/quests')
    console.log('2. 🔐 Click "Sign in with X" button')
    console.log('3. 🐦 Complete Twitter OAuth authentication')
    console.log('4. 🎯 Verify quests are loaded after authentication')
    console.log('5. ▶️ Test quest actions:')
    console.log('   • Start a quest')
    console.log('   • Complete quest requirements')
    console.log('   • Claim quest rewards')
    console.log('6. 🏆 Check points are awarded correctly')
    console.log('7. 📊 Verify leaderboard updates')
    console.log('')
    console.log('🔍 If issues occur:')
    console.log('• Check browser console for errors')
    console.log('• Try refreshing the page')
    console.log('• Clear browser cache and cookies')
    console.log('• Test in incognito/private mode')
    console.log('')
    console.log('✅ Expected behavior:')
    console.log('• Unauthenticated users see sign-in prompt')
    console.log('• Authenticated users see quest list')
    console.log('• Quest actions work correctly')
    console.log('• Points are awarded upon completion')
  }
}

// Run validation
const validator = new QuestDeploymentValidator()
validator.validateDeployment().catch(console.error)
