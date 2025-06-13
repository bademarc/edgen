#!/usr/bin/env node

/**
 * Fix OAuth Credentials Cache Issue
 * 
 * This script identifies and fixes all instances of old Twitter OAuth credentials
 * that might be cached or hardcoded in the LayerEdge platform, ensuring the new
 * credentials are used consistently across all environments.
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

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

// New credentials (correct ones)
const NEW_CREDENTIALS = {
  CLIENT_ID: 'TXdBWXdPQWNMMjdpcHRGblIyaVg6MTpjaQ',
  CLIENT_SECRET: 'nsN3ICJpwMHpfxYCAP6EG5hC4Q9jmaOGgiKq3v1XB8LTAm2-xJ',
  BEARER_TOKEN: 'AAAAAAAAAAAAAAAAAAAAAKWj2QEAAAAAlVAUukDCs1%2B2%2FhUHXgO69Wr9imE%3DfVOxPgMgwNIaZ6g0aS3EWrSsJRfgYSotWagfZQCkwsv6sfkw8X%2FhO29FyDp64JGN8gDGTYYuo9NQ%3DYgGDDSNiLqss5w00qemo4HRin6TIqpO0raV9u4nEEJ71SsH2Qt'
}

// Old credentials that need to be replaced
const OLD_CREDENTIALS = [
  'QlEtZHlyVzFqaHhkXzNLNVN3bE06MTpjaQ', // Old Client ID 1
  'SzVkU3VsQ0NheWcwMVU1MW8ta1I6MTpjaQ', // Old Client ID 2 (the one showing in logs)
  'Rl2zEnwWoSrc-3QgDEbs0Uy-0SBeCpcOuTndIxFjdE4xmoJiAy', // Old Client Secret 1
  '5xgAU__WADOOdRteatLt9tpm62HwaiDkDW-cK47fWNJviUvYsu', // Old Client Secret 2
  'AAAAAAAAAAAAAAAAAAAAADEZ2AEAAAAAU7lOXErZa3sVAe9ZmVjVbeT1bSE%3DkCgb5dbAOmBchFS9wpE4hnhCVmD18qahYF1gSXIMUDvMb5QlVX' // Old Bearer Token
]

// Files that might contain hardcoded credentials
const FILES_TO_CHECK = [
  'scripts/validate-env-vars.js',
  'scripts/implement-critical-fixes.js',
  'scripts/validate-environment.cjs',
  'scripts/fix-twitter-oauth-401.js',
  'scripts/setup-x-credentials.sh',
  'next.config.js',
  'src/lib/twitter-oauth.ts',
  'src/lib/x-api-service.ts',
  'src/app/api/test-oauth/route.ts',
  '.env',
  '.env.local',
  '.env.production'
]

async function checkEnvironmentVariables() {
  logStep('ENV', 'Checking current environment variables...')
  
  const currentCredentials = {
    CLIENT_ID: process.env.TWITTER_CLIENT_ID,
    CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET,
    BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN
  }
  
  log('\nCurrent Environment Variables:')
  log('─'.repeat(60))
  
  for (const [key, value] of Object.entries(currentCredentials)) {
    if (value) {
      const isCorrect = value === NEW_CREDENTIALS[key]
      const status = isCorrect ? 
        `${colors.green}✅ CORRECT${colors.reset}` : 
        `${colors.red}❌ OUTDATED${colors.reset}`
      
      log(`${key.padEnd(15)} ${status} ${value.substring(0, 20)}...`)
      
      if (!isCorrect) {
        logWarning(`Expected: ${NEW_CREDENTIALS[key].substring(0, 20)}...`)
      }
    } else {
      log(`${key.padEnd(15)} ${colors.red}❌ NOT SET${colors.reset}`)
    }
  }
  
  return currentCredentials
}

async function scanFilesForOldCredentials() {
  logStep('SCAN', 'Scanning files for old credentials...')
  
  const foundIssues = []
  
  for (const filePath of FILES_TO_CHECK) {
    if (!existsSync(filePath)) {
      continue
    }
    
    try {
      const content = readFileSync(filePath, 'utf8')
      
      for (const oldCred of OLD_CREDENTIALS) {
        if (content.includes(oldCred)) {
          foundIssues.push({
            file: filePath,
            credential: oldCred.substring(0, 20) + '...',
            type: 'hardcoded'
          })
        }
      }
    } catch (error) {
      logWarning(`Could not read file: ${filePath}`)
    }
  }
  
  if (foundIssues.length > 0) {
    log('\nFound hardcoded old credentials:')
    log('─'.repeat(60))
    
    for (const issue of foundIssues) {
      logError(`${issue.file}: ${issue.credential}`)
    }
  } else {
    logSuccess('No hardcoded old credentials found in files')
  }
  
  return foundIssues
}

async function checkKoyebEnvironment() {
  logStep('KOYEB', 'Checking Koyeb environment configuration...')
  
  // Since we can't directly access Koyeb environment, provide instructions
  log('\nKoyeb Environment Variables Check:')
  log('─'.repeat(60))
  log('Please verify these variables are set correctly in Koyeb:')
  log('')
  log(`TWITTER_CLIENT_ID=${NEW_CREDENTIALS.CLIENT_ID}`)
  log(`TWITTER_CLIENT_SECRET=${NEW_CREDENTIALS.CLIENT_SECRET}`)
  log(`TWITTER_BEARER_TOKEN=${NEW_CREDENTIALS.BEARER_TOKEN}`)
  log('')
  logWarning('If these don\'t match your Koyeb settings, update them manually')
  
  return true
}

async function clearApplicationCache() {
  logStep('CACHE', 'Clearing application cache...')
  
  try {
    // Clear Next.js cache
    if (existsSync('.next')) {
      execSync('rm -rf .next', { stdio: 'pipe' })
      logSuccess('Cleared Next.js build cache')
    }
    
    // Clear node_modules/.cache if it exists
    if (existsSync('node_modules/.cache')) {
      execSync('rm -rf node_modules/.cache', { stdio: 'pipe' })
      logSuccess('Cleared Node.js module cache')
    }
    
    // Clear any Prisma generated files
    if (existsSync('node_modules/.prisma')) {
      execSync('rm -rf node_modules/.prisma', { stdio: 'pipe' })
      logSuccess('Cleared Prisma generated cache')
    }
    
    return true
  } catch (error) {
    logWarning(`Cache clearing failed: ${error.message}`)
    return false
  }
}

async function testNewCredentials() {
  logStep('TEST', 'Testing new Twitter OAuth credentials...')
  
  try {
    // Test if the OAuth service can be initialized with new credentials
    const { TwitterOAuthService } = await import('../src/lib/twitter-oauth.js')
    
    // Temporarily override environment variables for testing
    const originalClientId = process.env.TWITTER_CLIENT_ID
    const originalClientSecret = process.env.TWITTER_CLIENT_SECRET
    
    process.env.TWITTER_CLIENT_ID = NEW_CREDENTIALS.CLIENT_ID
    process.env.TWITTER_CLIENT_SECRET = NEW_CREDENTIALS.CLIENT_SECRET
    
    try {
      const twitterOAuth = new TwitterOAuthService()
      const { url } = twitterOAuth.generateAuthUrl()
      
      // Check if the URL contains the new client ID
      if (url.includes(NEW_CREDENTIALS.CLIENT_ID)) {
        logSuccess('New credentials are working correctly')
        return true
      } else {
        logError('OAuth URL still contains old credentials')
        return false
      }
    } finally {
      // Restore original environment variables
      process.env.TWITTER_CLIENT_ID = originalClientId
      process.env.TWITTER_CLIENT_SECRET = originalClientSecret
    }
  } catch (error) {
    logError(`Credential test failed: ${error.message}`)
    return false
  }
}

async function generateKoyebUpdateScript() {
  logStep('SCRIPT', 'Generating Koyeb update script...')
  
  const updateScript = `#!/bin/bash

# Koyeb Environment Variables Update Script
# Run this to update your Koyeb app with new Twitter OAuth credentials

echo "🔧 Updating Koyeb environment variables with new Twitter OAuth credentials..."

# Note: Replace 'your-app-name' with your actual Koyeb app name
APP_NAME="layeredge-community"

echo "Setting TWITTER_CLIENT_ID..."
koyeb env set TWITTER_CLIENT_ID="${NEW_CREDENTIALS.CLIENT_ID}" --app \$APP_NAME

echo "Setting TWITTER_CLIENT_SECRET..."
koyeb env set TWITTER_CLIENT_SECRET="${NEW_CREDENTIALS.CLIENT_SECRET}" --app \$APP_NAME

echo "Setting TWITTER_BEARER_TOKEN..."
koyeb env set TWITTER_BEARER_TOKEN="${NEW_CREDENTIALS.BEARER_TOKEN}" --app \$APP_NAME

echo "✅ Environment variables updated successfully!"
echo "🔄 Restarting application to apply changes..."

koyeb app restart \$APP_NAME

echo "🎉 Update complete! Check your application logs to verify the new credentials are being used."
`
  
  writeFileSync('update-koyeb-credentials.sh', updateScript)
  execSync('chmod +x update-koyeb-credentials.sh')
  
  logSuccess('Created update-koyeb-credentials.sh script')
  
  return true
}

async function main() {
  log(`${colors.bright}🔐 LayerEdge OAuth Credentials Cache Fix${colors.reset}\n`)
  
  const tests = [
    { name: 'Environment Variables', fn: checkEnvironmentVariables },
    { name: 'File Scan', fn: scanFilesForOldCredentials },
    { name: 'Koyeb Check', fn: checkKoyebEnvironment },
    { name: 'Cache Clear', fn: clearApplicationCache },
    { name: 'Credential Test', fn: testNewCredentials },
    { name: 'Koyeb Script', fn: generateKoyebUpdateScript }
  ]
  
  const results = []
  
  for (const test of tests) {
    try {
      log(`\n${colors.cyan}Running: ${test.name}${colors.reset}`)
      const result = await test.fn()
      results.push({ name: test.name, success: !!result })
    } catch (error) {
      logError(`${test.name} failed: ${error.message}`)
      results.push({ name: test.name, success: false, error: error.message })
    }
  }
  
  // Summary
  log(`\n${colors.bright}📊 Fix Results Summary${colors.reset}`)
  log('─'.repeat(50))
  
  let passedTests = 0
  for (const result of results) {
    const status = result.success ? 
      `${colors.green}✅ PASS${colors.reset}` : 
      `${colors.red}❌ FAIL${colors.reset}`
    
    log(`${result.name.padEnd(25)} ${status}`)
    
    if (result.success) {
      passedTests++
    }
  }
  
  log('─'.repeat(50))
  log(`Total: ${results.length} | Passed: ${passedTests} | Failed: ${results.length - passedTests}`)
  
  // Action items
  log(`\n${colors.blue}🎯 Action Items:${colors.reset}`)
  log('1. Update Koyeb environment variables using the generated script')
  log('2. Restart your Koyeb deployment')
  log('3. Check application logs to verify new credentials are being used')
  log('4. Test Twitter OAuth login functionality')
  
  if (passedTests >= 4) {
    log(`\n${colors.green}${colors.bright}🎉 Ready for deployment! Most issues have been resolved.${colors.reset}`)
  } else {
    log(`\n${colors.yellow}${colors.bright}⚠️  Some issues remain. Check the output above for details.${colors.reset}`)
  }
}

// Handle async execution
main().catch(error => {
  logError(`Fix script failed: ${error.message}`)
  process.exit(1)
});
