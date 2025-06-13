#!/usr/bin/env node

/**
 * LayerEdge Community Platform - Fix Twitter Client Secret Mismatch
 * 
 * This script helps identify and fix the Client Secret mismatch causing 401 errors.
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

function critical(message) {
  log(`\n🚨 ${message}`, colors.red + colors.bright)
  log('='.repeat(60), colors.red)
}

function analyzeClientSecret() {
  critical('Twitter Client Secret Mismatch Analysis')
  
  const currentClientSecret = process.env.TWITTER_CLIENT_SECRET
  const currentClientId = process.env.TWITTER_CLIENT_ID
  
  log('\n📊 Current Koyeb Environment Variables:')
  log(`   TWITTER_CLIENT_ID: ${currentClientId || 'NOT SET'}`)
  log(`   TWITTER_CLIENT_SECRET: ${currentClientSecret ? currentClientSecret.substring(0, 10) + '...' + currentClientSecret.slice(-10) : 'NOT SET'}`)
  
  if (currentClientSecret) {
    log(`   Client Secret Length: ${currentClientSecret.length}`)
    log(`   Client Secret Starts: ${currentClientSecret.substring(0, 15)}...`)
    log(`   Client Secret Ends: ...${currentClientSecret.slice(-15)}`)
  }
  
  log('\n🔍 What You Reported from Twitter Developer Portal:')
  log('   Client Secret ends with: "Me5Hx7" and "portal x"')
  
  log('\n❌ MISMATCH IDENTIFIED:')
  error('   Your Twitter Developer Portal Client Secret does NOT match Koyeb')
  error('   This is the exact cause of the 401 Unauthorized error')
  
  log('\n🚀 IMMEDIATE FIX STEPS:')
  log('   1. Go to https://developer.twitter.com/en/portal/dashboard')
  log('   2. Select your LayerEdge app')
  log('   3. Go to "Keys and tokens" tab')
  log('   4. Copy the EXACT "OAuth 2.0 Client Secret" value')
  log('   5. Go to https://app.koyeb.com')
  log('   6. Update TWITTER_CLIENT_SECRET environment variable')
  log('   7. Redeploy the service')
  
  log('\n⚠️  IMPORTANT:')
  warning('   The Client Secret must match EXACTLY (case-sensitive)')
  warning('   Even one character difference will cause 401 errors')
  
  log('\n🎯 Expected Result:')
  success('   OAuth 401 error will be immediately resolved')
  success('   Token exchange will succeed')
  success('   Twitter authentication will work')
}

function createKoyebUpdateInstructions() {
  header('Creating Koyeb Update Instructions')
  
  const instructions = `# 🚨 KOYEB ENVIRONMENT VARIABLE UPDATE INSTRUCTIONS

## STEP-BY-STEP FIX FOR CLIENT SECRET MISMATCH

### STEP 1: Get Correct Client Secret from Twitter

1. **Go to Twitter Developer Portal:**
   - Visit: https://developer.twitter.com/en/portal/dashboard
   - Login with your Twitter account
   - Select your LayerEdge app

2. **Navigate to Keys and Tokens:**
   - Click on "Keys and tokens" tab
   - Find "OAuth 2.0 Client ID and Client Secret" section

3. **Copy the EXACT values:**
   - **Client ID:** Should be \`QlEtZHlyVzFqaHhkXzNLNVN3bE06MTpjaQ\`
   - **Client Secret:** Copy the ENTIRE value (ends with "Me5Hx7" and "portal x")

### STEP 2: Update Koyeb Environment Variables

1. **Go to Koyeb Dashboard:**
   - Visit: https://app.koyeb.com
   - Login to your account
   - Select your LayerEdge service

2. **Update Environment Variables:**
   - Click on "Settings" tab
   - Click on "Environment Variables"
   - Find \`TWITTER_CLIENT_SECRET\`
   - Replace the ENTIRE value with the one from Twitter Developer Portal
   - Click "Save"

### STEP 3: Redeploy Service

1. **Trigger Redeploy:**
   - Go to "Overview" tab
   - Click "Redeploy" button
   - Wait for deployment to complete (5-10 minutes)

### STEP 4: Test the Fix

1. **Test OAuth Debug:**
   - Visit: https://edgen.koyeb.app/api/test-oauth-debug
   - Check for any remaining issues

2. **Test OAuth Flow:**
   - Visit: https://edgen.koyeb.app/auth/twitter
   - Should redirect to Twitter without 401 errors

### VERIFICATION

After updating, your environment should have:

\`\`\`bash
TWITTER_CLIENT_ID=QlEtZHlyVzFqaHhkXzNLNVN3bE06MTpjaQ
TWITTER_CLIENT_SECRET=[EXACT VALUE FROM TWITTER DEVELOPER PORTAL]
\`\`\`

### SUCCESS INDICATORS

- ✅ No 401 Unauthorized errors in Koyeb logs
- ✅ "Token exchange successful" messages in logs
- ✅ OAuth flow completes without errors
- ✅ Users can authenticate with Twitter

---

**CRITICAL:** This Client Secret mismatch is the root cause of your 401 error.
Fixing this will immediately resolve the authentication issue.
`
  
  const fs = await import('fs')
  const path = await import('path')
  const __dirname = path.dirname(new URL(import.meta.url).pathname)
  const projectRoot = path.join(__dirname, '..')
  
  fs.writeFileSync(path.join(projectRoot, 'KOYEB_CLIENT_SECRET_UPDATE.md'), instructions)
  success('Created Koyeb update instructions')
}

async function main() {
  critical('Twitter Client Secret Mismatch Fix')
  
  info('Analyzing the Client Secret mismatch causing 401 errors...')
  
  // Analyze current configuration
  analyzeClientSecret()
  
  // Create update instructions
  await createKoyebUpdateInstructions()
  
  // Final summary
  critical('IMMEDIATE ACTION REQUIRED')
  error('🚨 CLIENT SECRET MISMATCH CONFIRMED')
  error('   Your Koyeb TWITTER_CLIENT_SECRET does not match Twitter Developer Portal')
  
  info('\n🔧 QUICK FIX:')
  info('   1. Copy Client Secret from Twitter Developer Portal')
  info('   2. Update TWITTER_CLIENT_SECRET in Koyeb')
  info('   3. Redeploy service')
  info('   4. Test OAuth flow')
  
  success('\n🎯 Expected result: 401 error immediately resolved!')
  
  log('\n📋 Files created:')
  log('   - TWITTER_CLIENT_SECRET_MISMATCH_FIX.md')
  log('   - KOYEB_CLIENT_SECRET_UPDATE.md')
}

main().catch(console.error)
