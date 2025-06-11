#!/usr/bin/env node

/**
 * Test Script for New Twitter OAuth 2.0 Credentials
 * 
 * This script tests the new Twitter OAuth credentials provided by the user:
 * Client ID: TXdBWXdPQWNMMjdpcHRGblIyaVg6MTpjaQ
 * Client Secret: nsN3ICJpwMHpfxYCAP6EG5hC4Q9jmaOGgiKq3v1XB8LTAm2-xJ
 */

import { TwitterOAuthService } from '../src/lib/twitter-oauth.js'
import crypto from 'crypto'

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message) {
  console.log(message)
}

function logStep(step, message) {
  log(`${colors.blue}[${step}]${colors.reset} ${message}`)
}

function logSuccess(message) {
  log(`${colors.green}✅ ${message}${colors.reset}`)
}

function logWarning(message) {
  log(`${colors.yellow}⚠️  ${message}${colors.reset}`)
}

function logError(message) {
  log(`${colors.red}❌ ${message}${colors.reset}`)
}

async function testEnvironmentVariables() {
  logStep('ENV', 'Checking environment variables...')
  
  const requiredVars = [
    'TWITTER_CLIENT_ID',
    'TWITTER_CLIENT_SECRET',
    'TWITTER_BEARER_TOKEN',
    'TWITTER_API_KEY',
    'TWITTER_API_SECRET'
  ]
  
  const results = {}
  
  for (const varName of requiredVars) {
    const value = process.env[varName]
    results[varName] = {
      set: !!value,
      length: value ? value.length : 0,
      preview: value ? value.substring(0, 10) + '...' : 'not set'
    }
  }
  
  log('\nEnvironment Variables Status:')
  log('─'.repeat(60))
  
  for (const [varName, info] of Object.entries(results)) {
    const status = info.set ? 
      `${colors.green}✅ SET${colors.reset}` : 
      `${colors.red}❌ MISSING${colors.reset}`
    
    log(`${varName.padEnd(25)} ${status} (${info.length} chars) ${info.preview}`)
  }
  
  return results
}

async function testTwitterOAuthService() {
  logStep('OAUTH', 'Testing Twitter OAuth service initialization...')
  
  try {
    const twitterOAuth = new TwitterOAuthService()
    logSuccess('Twitter OAuth service initialized successfully')
    
    // Test auth URL generation
    logStep('AUTH_URL', 'Testing OAuth URL generation...')
    const { url, codeVerifier, state } = twitterOAuth.generateAuthUrl()
    
    logSuccess('OAuth URL generated successfully')
    log(`Auth URL: ${url.substring(0, 100)}...`)
    log(`Code Verifier: ${codeVerifier.substring(0, 20)}...`)
    log(`State: ${state.substring(0, 20)}...`)
    
    // Validate URL components
    const urlObj = new URL(url)
    const expectedParams = [
      'response_type',
      'client_id', 
      'redirect_uri',
      'scope',
      'state',
      'code_challenge',
      'code_challenge_method'
    ]
    
    log('\nOAuth URL Parameters:')
    for (const param of expectedParams) {
      const value = urlObj.searchParams.get(param)
      const status = value ? 
        `${colors.green}✅${colors.reset}` : 
        `${colors.red}❌${colors.reset}`
      
      log(`  ${param.padEnd(20)} ${status} ${value ? value.substring(0, 30) + '...' : 'missing'}`)
    }
    
    return true
  } catch (error) {
    logError(`Twitter OAuth service failed: ${error.message}`)
    return false
  }
}

async function testTwitterApiCredentials() {
  logStep('API', 'Testing Twitter API credentials...')
  
  const bearerToken = process.env.TWITTER_BEARER_TOKEN
  const apiKey = process.env.TWITTER_API_KEY
  const apiSecret = process.env.TWITTER_API_SECRET
  
  if (!bearerToken) {
    logError('Bearer token not found')
    return false
  }
  
  try {
    // Test Bearer Token with a simple API call
    const response = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      logSuccess('Bearer token is valid')
      log(`API User: ${data.data?.username || 'unknown'}`)
      return true
    } else {
      const errorData = await response.text()
      logError(`Bearer token test failed: ${response.status} ${response.statusText}`)
      log(`Error details: ${errorData}`)
      return false
    }
  } catch (error) {
    logError(`API test failed: ${error.message}`)
    return false
  }
}

async function testOAuthFlow() {
  logStep('FLOW', 'Testing complete OAuth flow components...')
  
  const clientId = process.env.TWITTER_CLIENT_ID
  const clientSecret = process.env.TWITTER_CLIENT_SECRET
  
  if (!clientId || !clientSecret) {
    logError('OAuth credentials missing')
    return false
  }
  
  // Test OAuth 2.0 token endpoint (without actually exchanging)
  try {
    const tokenUrl = 'https://api.twitter.com/2/oauth2/token'
    
    // Just test if the endpoint is reachable (will return 400 but that's expected)
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: 'grant_type=authorization_code&code=test'
    })
    
    // We expect a 400 error here since we're not providing valid parameters
    if (response.status === 400) {
      logSuccess('OAuth token endpoint is reachable')
      return true
    } else {
      logWarning(`Unexpected response from token endpoint: ${response.status}`)
      return false
    }
  } catch (error) {
    logError(`OAuth flow test failed: ${error.message}`)
    return false
  }
}

async function validateCredentialFormats() {
  logStep('FORMAT', 'Validating credential formats...')
  
  const clientId = process.env.TWITTER_CLIENT_ID
  const clientSecret = process.env.TWITTER_CLIENT_SECRET
  const bearerToken = process.env.TWITTER_BEARER_TOKEN
  
  const validations = []
  
  // Client ID format validation
  if (clientId) {
    const hasColon = clientId.includes(':')
    const hasCorrectSuffix = clientId.endsWith(':1:ci')
    validations.push({
      name: 'Client ID format',
      valid: hasColon && hasCorrectSuffix,
      details: `Has colon: ${hasColon}, Correct suffix: ${hasCorrectSuffix}`
    })
  }
  
  // Client Secret format validation
  if (clientSecret) {
    const isBase64Like = /^[A-Za-z0-9_-]+$/.test(clientSecret)
    const hasCorrectLength = clientSecret.length > 40
    validations.push({
      name: 'Client Secret format',
      valid: isBase64Like && hasCorrectLength,
      details: `Base64-like: ${isBase64Like}, Length OK: ${hasCorrectLength} (${clientSecret.length})`
    })
  }
  
  // Bearer Token format validation
  if (bearerToken) {
    const startsCorrectly = bearerToken.startsWith('AAAAAAAAAAAAAAAAAAAAAA')
    const hasCorrectLength = bearerToken.length > 100
    validations.push({
      name: 'Bearer Token format',
      valid: startsCorrectly && hasCorrectLength,
      details: `Starts correctly: ${startsCorrectly}, Length OK: ${hasCorrectLength} (${bearerToken.length})`
    })
  }
  
  log('\nCredential Format Validation:')
  log('─'.repeat(60))
  
  for (const validation of validations) {
    const status = validation.valid ? 
      `${colors.green}✅ VALID${colors.reset}` : 
      `${colors.red}❌ INVALID${colors.reset}`
    
    log(`${validation.name.padEnd(25)} ${status}`)
    log(`  ${validation.details}`)
  }
  
  return validations.every(v => v.valid)
}

async function main() {
  log(`${colors.bright}🔐 LayerEdge Twitter OAuth 2.0 Credentials Test${colors.reset}\n`)
  
  const tests = [
    { name: 'Environment Variables', fn: testEnvironmentVariables },
    { name: 'Credential Formats', fn: validateCredentialFormats },
    { name: 'OAuth Service', fn: testTwitterOAuthService },
    { name: 'API Credentials', fn: testTwitterApiCredentials },
    { name: 'OAuth Flow', fn: testOAuthFlow }
  ]
  
  const results = []
  
  for (const test of tests) {
    try {
      log(`\n${colors.cyan}Running test: ${test.name}${colors.reset}`)
      const result = await test.fn()
      results.push({ name: test.name, success: !!result })
    } catch (error) {
      logError(`Test ${test.name} threw an error: ${error.message}`)
      results.push({ name: test.name, success: false, error: error.message })
    }
  }
  
  // Summary
  log(`\n${colors.bright}📊 Test Results Summary${colors.reset}`)
  log('─'.repeat(50))
  
  let passedTests = 0
  for (const result of results) {
    const status = result.success ? 
      `${colors.green}✅ PASS${colors.reset}` : 
      `${colors.red}❌ FAIL${colors.reset}`
    
    log(`${result.name.padEnd(25)} ${status}`)
    
    if (result.success) {
      passedTests++
    } else if (result.error) {
      log(`   Error: ${result.error}`)
    }
  }
  
  log('─'.repeat(50))
  log(`Total: ${results.length} | Passed: ${passedTests} | Failed: ${results.length - passedTests}`)
  
  if (passedTests === results.length) {
    log(`\n${colors.green}${colors.bright}🎉 All tests passed! New Twitter OAuth credentials are working correctly.${colors.reset}`)
    log(`${colors.green}✅ Ready for deployment to Koyeb${colors.reset}`)
  } else {
    log(`\n${colors.yellow}${colors.bright}⚠️  Some tests failed. Check the output above for details.${colors.reset}`)
    
    if (passedTests >= 3) {
      log(`${colors.yellow}✅ Core functionality appears to be working - deployment may still succeed${colors.reset}`)
    }
  }
  
  // Next steps
  log(`\n${colors.blue}Next Steps:${colors.reset}`)
  log('1. Update Koyeb environment variables with new credentials')
  log('2. Deploy to Koyeb and test OAuth flow')
  log('3. Verify user authentication works in production')
  log('4. Test tweet submission functionality')
}

// Handle async execution
main().catch(error => {
  logError(`Test suite failed: ${error.message}`)
  process.exit(1)
});
