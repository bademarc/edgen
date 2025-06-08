#!/usr/bin/env node

/**
 * LayerEdge Community Platform - Test Critical Fixes
 * 
 * This script tests whether all critical authentication and deployment fixes are working.
 */

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function success(message) {
  log(`✅ ${message}`, colors.green)
}

function error(message) {
  log(`❌ ${message}`, colors.red)
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow)
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue)
}

function header(message) {
  log(`\n🔍 ${message}`, colors.cyan + colors.bright)
  log('='.repeat(60), colors.cyan)
}

async function testEndpoint(url, description, expectedStatus = 200) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    })
    
    if (response.status === expectedStatus) {
      success(`${description}: ✅ ${response.status}`)
      return { success: true, status: response.status, data: null }
    } else {
      error(`${description}: ❌ ${response.status} (expected ${expectedStatus})`)
      return { success: false, status: response.status, data: null }
    }
  } catch (err) {
    error(`${description}: ❌ ${err.message}`)
    return { success: false, status: null, error: err.message }
  }
}

async function testJSONEndpoint(url, description) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    })
    
    if (response.ok) {
      const data = await response.json()
      success(`${description}: ✅ ${response.status}`)
      return { success: true, status: response.status, data }
    } else {
      error(`${description}: ❌ ${response.status}`)
      return { success: false, status: response.status, data: null }
    }
  } catch (err) {
    error(`${description}: ❌ ${err.message}`)
    return { success: false, status: null, error: err.message }
  }
}

async function testMainSite() {
  header('Testing Main Site and Static Assets')
  
  const tests = [
    { url: 'https://edgen.koyeb.app', desc: 'Main Site' },
    { url: 'https://edgen.koyeb.app/manifest.json', desc: 'PWA Manifest' },
    { url: 'https://edgen.koyeb.app/icon/-AlLx9IW_400x400.png', desc: 'LayerEdge Logo' }
  ]
  
  let allPassed = true
  
  for (const test of tests) {
    const result = await testEndpoint(test.url, test.desc)
    allPassed = allPassed && result.success
  }
  
  return allPassed
}

async function testAuthEndpoints() {
  header('Testing Authentication Endpoints')
  
  const tests = [
    { url: 'https://edgen.koyeb.app/api/auth/test', desc: 'Auth Test Endpoint' },
    { url: 'https://edgen.koyeb.app/api/test-oauth', desc: 'OAuth Test Endpoint' },
    { url: 'https://edgen.koyeb.app/auth/twitter', desc: 'Twitter OAuth Initiation', expectedStatus: 302 }
  ]
  
  let allPassed = true
  
  for (const test of tests) {
    const result = await testEndpoint(test.url, test.desc, test.expectedStatus || 200)
    allPassed = allPassed && result.success
  }
  
  return allPassed
}

async function testAPIEndpoints() {
  header('Testing API Endpoints')
  
  const tests = [
    { url: 'https://edgen.koyeb.app/api/health', desc: 'Health Check' },
    { url: 'https://edgen.koyeb.app/api/leaderboard', desc: 'Leaderboard API' }
  ]
  
  let allPassed = true
  
  for (const test of tests) {
    const result = await testJSONEndpoint(test.url, test.desc)
    allPassed = allPassed && result.success
    
    if (result.success && result.data) {
      info(`   Response preview: ${JSON.stringify(result.data).substring(0, 100)}...`)
    }
  }
  
  return allPassed
}

async function testTwitterOAuthConfig() {
  header('Testing Twitter OAuth Configuration')
  
  try {
    const result = await testJSONEndpoint('https://edgen.koyeb.app/api/test-oauth', 'OAuth Configuration')
    
    if (result.success && result.data) {
      const config = result.data
      
      // Check critical configuration values
      const checks = [
        { key: 'siteUrl', expected: 'https://edgen.koyeb.app', actual: config.siteUrl },
        { key: 'redirectUri', expected: 'https://edgen.koyeb.app/auth/twitter/callback', actual: config.redirectUri },
        { key: 'clientId', expected: 'QlEtZHlyVzFqaHhkXzNLNVN3bE06MTpjaQ', actual: config.clientId },
        { key: 'hasClientSecret', expected: true, actual: config.hasClientSecret }
      ]
      
      let configValid = true
      
      for (const check of checks) {
        if (check.actual === check.expected) {
          success(`   ${check.key}: ✅ Correct`)
        } else {
          error(`   ${check.key}: ❌ Expected "${check.expected}", got "${check.actual}"`)
          configValid = false
        }
      }
      
      return configValid
    }
    
    return result.success
  } catch (err) {
    error(`OAuth configuration test failed: ${err.message}`)
    return false
  }
}

function displayResults(siteOk, authOk, apiOk, oauthOk) {
  header('Test Results Summary')
  
  const overallSuccess = siteOk && authOk && apiOk && oauthOk
  
  log('\n📊 Test Results:')
  log(`   Main Site & Assets: ${siteOk ? '✅' : '❌'}`)
  log(`   Authentication Endpoints: ${authOk ? '✅' : '❌'}`)
  log(`   API Endpoints: ${apiOk ? '✅' : '❌'}`)
  log(`   Twitter OAuth Config: ${oauthOk ? '✅' : '❌'}`)
  
  if (overallSuccess) {
    success('\n🎉 ALL CRITICAL FIXES WORKING!')
    success('\n✅ Critical fixes verified:')
    success('   - Static assets loading correctly')
    success('   - Authentication endpoints responding')
    success('   - API endpoints functioning')
    success('   - Twitter OAuth configuration correct')
    
    info('\n🚀 NEXT STEPS:')
    info('   1. Test complete Twitter OAuth flow (login)')
    info('   2. Verify tweet tracking functionality')
    info('   3. Check deployment logs for any warnings')
    info('   4. Monitor Redis operations')
    
  } else {
    error('\n❌ SOME CRITICAL FIXES NOT WORKING')
    error('\n🔧 Issues detected:')
    if (!siteOk) error('   - Main site or static assets failing')
    if (!authOk) error('   - Authentication endpoints not responding')
    if (!apiOk) error('   - API endpoints failing')
    if (!oauthOk) error('   - Twitter OAuth configuration incorrect')
    
    warning('\n⚠️  Possible causes:')
    warning('   - Environment variables not updated in Koyeb')
    warning('   - Deployment still in progress')
    warning('   - Twitter Developer Portal not updated')
    warning('   - Redis configuration issues')
    
    info('\n🔄 Recommended actions:')
    info('   1. Verify all environment variables in Koyeb match KOYEB_CRITICAL_ENVIRONMENT_VARIABLES.md')
    info('   2. Update Twitter Developer Portal callback URL')
    info('   3. Trigger manual Koyeb redeploy')
    info('   4. Check Koyeb deployment logs for errors')
  }
  
  return overallSuccess
}

async function main() {
  log('\n🔍 LayerEdge Critical Fixes - Verification Test', colors.cyan + colors.bright)
  log('============================================================', colors.cyan)
  
  info('Testing whether all critical authentication and deployment fixes are working...')
  
  // Test all categories
  const siteOk = await testMainSite()
  const authOk = await testAuthEndpoints()
  const apiOk = await testAPIEndpoints()
  const oauthOk = await testTwitterOAuthConfig()
  
  // Display results
  const overallSuccess = displayResults(siteOk, authOk, apiOk, oauthOk)
  
  // Exit with appropriate code
  process.exit(overallSuccess ? 0 : 1)
}

main().catch(console.error)
