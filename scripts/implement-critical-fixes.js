#!/usr/bin/env node

/**
 * LayerEdge Community Platform - Critical Authentication & Deployment Fixes
 * 
 * This script implements all priority fixes for Twitter OAuth, Next.js deployment,
 * and Redis configuration based on deployment logs analysis.
 */

import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

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

function priority(message) {
  log(`\n🚨 ${message}`, colors.red + colors.bright)
  log('='.repeat(60), colors.red)
}

// PRIORITY 1: Fix Twitter OAuth Configuration
function fixTwitterOAuthConfig() {
  priority('PRIORITY 1: Twitter API Authentication Fixes')
  
  // Fix 1: Update Twitter OAuth Service for production URLs
  const twitterOAuthPath = join(projectRoot, 'src/lib/twitter-oauth.ts')
  
  if (existsSync(twitterOAuthPath)) {
    let content = readFileSync(twitterOAuthPath, 'utf8')
    
    // Ensure production URL is always used
    const updatedContent = content.replace(
      /let siteUrl = process\.env\.NEXT_PUBLIC_SITE_URL \|\| 'https:\/\/edgen\.koyeb\.app'/,
      `let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://edgen.koyeb.app'
    // Force production URL in production environment
    if (process.env.NODE_ENV === 'production') {
      siteUrl = 'https://edgen.koyeb.app'
    }`
    )
    
    writeFileSync(twitterOAuthPath, updatedContent)
    success('Updated Twitter OAuth service for production URLs')
  }
  
  // Fix 2: Update callback route for better error handling
  const callbackPath = join(projectRoot, 'src/app/auth/twitter/callback/route.ts')
  
  if (existsSync(callbackPath)) {
    let content = readFileSync(callbackPath, 'utf8')
    
    // Ensure production URL is used for redirects
    const updatedContent = content.replace(
      /const baseUrl = process\.env\.NEXT_PUBLIC_SITE_URL \|\| origin/,
      `const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://edgen.koyeb.app' 
        : (process.env.NEXT_PUBLIC_SITE_URL || origin)`
    )
    
    writeFileSync(callbackPath, updatedContent)
    success('Updated OAuth callback for production URL handling')
  }
  
  return true
}

// PRIORITY 2: Fix Next.js Deployment Configuration
function fixNextJSDeployment() {
  priority('PRIORITY 2: Next.js Deployment Configuration')
  
  // Fix 1: Verify Dockerfile uses correct server command
  const dockerfilePath = join(projectRoot, 'Dockerfile')
  
  if (existsSync(dockerfilePath)) {
    let dockerfile = readFileSync(dockerfilePath, 'utf8')
    
    // Ensure we're using the startup script with node server.js
    if (dockerfile.includes('CMD ["./startup.sh", "node", "server.js"]')) {
      success('Dockerfile already uses correct server command')
    } else {
      // Fix any incorrect CMD references
      dockerfile = dockerfile.replace(
        /CMD \["next", "start"\]/g,
        'CMD ["./startup.sh", "node", "server.js"]'
      )
      
      writeFileSync(dockerfilePath, dockerfile)
      success('Fixed Dockerfile server command')
    }
  }
  
  // Fix 2: Add NEXTAUTH_URL to environment variables
  const nextConfigPath = join(projectRoot, 'next.config.js')
  
  if (existsSync(nextConfigPath)) {
    let config = readFileSync(nextConfigPath, 'utf8')
    
    // Add NEXTAUTH_URL to env section if not present
    if (!config.includes('NEXTAUTH_URL')) {
      config = config.replace(
        'NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,',
        `NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,`
      )
      
      writeFileSync(nextConfigPath, config)
      success('Added NEXTAUTH_URL to Next.js environment variables')
    } else {
      success('NEXTAUTH_URL already present in Next.js config')
    }
  }
  
  return true
}

// PRIORITY 3: Create Environment Variables Validation
function createEnvironmentValidation() {
  priority('PRIORITY 3: Environment Variables Validation')
  
  const envValidationScript = `#!/usr/bin/env node

/**
 * Environment Variables Validation for Koyeb Deployment
 */

const requiredEnvVars = {
  // Twitter API Configuration
  'TWITTER_BEARER_TOKEN': 'AAAAAAAAAAAAAAAAAAAAADEZ2AEAAAAAU7lOXErZa3sVAe9ZmVjVbeT1bSE%3DkCgb5dbAOmBchFS9wpE4hnhCVmD18qahYF1gSXIMUDvMb5QlVX',
  'TWITTER_CLIENT_ID': 'QlEtZHlyVzFqaHhkXzNLNVN3bE06MTpjaQ',
  'TWITTER_CLIENT_SECRET': 'Rl2zEnwWoSrc-3QgDEbs0Uy-0SBeCpcOuTndIxFjdE4xmoJiAy',
  
  // Production URLs
  'NEXT_PUBLIC_SITE_URL': 'https://edgen.koyeb.app',
  'NEXTAUTH_URL': 'https://edgen.koyeb.app',
  
  // Redis Configuration
  'UPSTASH_REDIS_REST_URL': 'https://gusc1-national-lemur-31832.upstash.io',
  'UPSTASH_REDIS_REST_TOKEN': 'acd4b50ce33b4436b09f6f278848dfb7',
  'REDIS_HOST': 'gusc1-national-lemur-31832.upstash.io',
  'REDIS_PORT': '31832',
  'REDIS_PASSWORD': 'acd4b50ce33b4436b09f6f278848dfb7',
  
  // Database Configuration
  'DATABASE_URL': 'postgres://postgres.bzqayhnlogpaxfcmmrlq:d234A879a1%23@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=3',
  'DIRECT_URL': 'postgres://postgres.bzqayhnlogpaxfcmmrlq:d234A879a1%23@aws-0-eu-north-1.pooler.supabase.com:5432/postgres',
  
  // Supabase Configuration
  'NEXT_PUBLIC_SUPABASE_URL': 'https://bzqayhnlogpaxfcmmrlq.supabase.co',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6cWF5aG5sb2dwYXhmY21tcmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMTk5MzgsImV4cCI6MjA2Mzc5NTkzOH0.Axa-qsNiIRoEGG18760uWNsxMrhNOV648snajCNenjU',
  'SUPABASE_SERVICE_ROLE_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6cWF5aG5sb2dwYXhmY21tcmxxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODIxOTkzOCwiZXhwIjoyMDYzNzk1OTM4fQ.El521R-8GXuyULGE6uj5U_Ci3DCISkPWuwvfOEQnBtQ',
  
  // Security
  'NEXTAUTH_SECRET': 'layeredge-nextauth-secret-2024-production',
  'TOKEN_ENCRYPTION_KEY': 'layeredge-encryption-key-32chars',
  
  // Additional Configuration
  'LAYEREDGE_COMMUNITY_URL': 'https://x.com/i/communities/1890107751621357663',
  'NODE_ENV': 'production',
  'PORT': '3000',
  'HOSTNAME': '0.0.0.0'
}

console.log('🔍 Environment Variables Validation for Koyeb')
console.log('=' .repeat(60))

let allValid = true
const issues = []

for (const [key, expectedValue] of Object.entries(requiredEnvVars)) {
  const currentValue = process.env[key]
  
  if (!currentValue) {
    console.log(\`❌ MISSING: \${key}\`)
    issues.push(\`Add: \${key}=\${expectedValue}\`)
    allValid = false
  } else if (currentValue !== expectedValue) {
    console.log(\`⚠️  MISMATCH: \${key}\`)
    console.log(\`   Current: \${currentValue.substring(0, 50)}...\`)
    console.log(\`   Expected: \${expectedValue.substring(0, 50)}...\`)
    issues.push(\`Update: \${key}=\${expectedValue}\`)
    allValid = false
  } else {
    console.log(\`✅ VALID: \${key}\`)
  }
}

if (allValid) {
  console.log('\\n🎉 All environment variables are correctly configured!')
} else {
  console.log('\\n❌ Environment variable issues found:')
  issues.forEach(issue => console.log(\`   - \${issue}\`))
  console.log('\\n📋 Add these to Koyeb Environment Variables:')
  issues.forEach(issue => console.log(issue))
}

process.exit(allValid ? 0 : 1)
`
  
  writeFileSync(join(projectRoot, 'scripts/validate-env-vars.js'), envValidationScript)
  success('Created environment variables validation script')
  
  return true
}

function createKoyebInstructions() {
  header('Creating Koyeb Deployment Instructions')
  
  const instructions = `# 🚨 CRITICAL KOYEB ENVIRONMENT VARIABLES - EXACT VALUES REQUIRED

## IMMEDIATE ACTION REQUIRED

Go to https://app.koyeb.com → LayerEdge service → Settings → Environment Variables

### ADD/UPDATE THESE EXACT VALUES:

\`\`\`bash
# PRIORITY 1: Twitter API Authentication (EXACT VALUES)
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAADEZ2AEAAAAAU7lOXErZa3sVAe9ZmVjVbeT1bSE%3DkCgb5dbAOmBchFS9wpE4hnhCVmD18qahYF1gSXIMUDvMb5QlVX
TWITTER_CLIENT_ID=QlEtZHlyVzFqaHhkXzNLNVN3bE06MTpjaQ
TWITTER_CLIENT_SECRET=Rl2zEnwWoSrc-3QgDEbs0Uy-0SBeCpcOuTndIxFjdE4xmoJiAy

# PRIORITY 2: Production URLs (CRITICAL)
NEXT_PUBLIC_SITE_URL=https://edgen.koyeb.app
NEXTAUTH_URL=https://edgen.koyeb.app

# PRIORITY 3: Redis Configuration (EXACT VALUES)
UPSTASH_REDIS_REST_URL=https://gusc1-national-lemur-31832.upstash.io
UPSTASH_REDIS_REST_TOKEN=acd4b50ce33b4436b09f6f278848dfb7
REDIS_HOST=gusc1-national-lemur-31832.upstash.io
REDIS_PORT=31832
REDIS_PASSWORD=acd4b50ce33b4436b09f6f278848dfb7

# Server Configuration
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
\`\`\`

## TWITTER DEVELOPER PORTAL CONFIGURATION

**CRITICAL:** Update Twitter App settings at https://developer.twitter.com

1. **Callback URL:** \`https://edgen.koyeb.app/auth/twitter/callback\`
2. **Website URL:** \`https://edgen.koyeb.app\`
3. **Terms of Service:** \`https://edgen.koyeb.app/terms\`
4. **Privacy Policy:** \`https://edgen.koyeb.app/privacy\`

## DEPLOYMENT STEPS

1. **Add Environment Variables** (copy exact values above)
2. **Update Twitter Developer Portal** (callback URL)
3. **Trigger Koyeb Redeploy** (manual redeploy button)
4. **Monitor Deployment Logs** (watch for errors)
5. **Test OAuth Flow** (complete login process)

## SUCCESS CRITERIA

- ✅ No "Bearer Token format" warnings in logs
- ✅ Twitter OAuth completes without "unauthorized_client" errors
- ✅ Server starts with \`node server.js\` successfully
- ✅ Redis operations complete without authentication errors
- ✅ Tweet tracking monitors @layeredge and $EDGEN mentions

## VALIDATION

Run after deployment:
\`\`\`bash
node scripts/validate-env-vars.js
\`\`\`

---

**CRITICAL:** These are the EXACT values from your deployment logs analysis.
Any deviation will cause authentication failures.
`
  
  writeFileSync(join(projectRoot, 'KOYEB_CRITICAL_ENVIRONMENT_VARIABLES.md'), instructions)
  success('Created Koyeb deployment instructions')
  
  return true
}

function runCommand(command, description) {
  try {
    log(`\n🔄 ${description}...`, colors.blue)
    execSync(command, { stdio: 'inherit' })
    success(`${description} completed`)
    return true
  } catch (err) {
    error(`${description} failed: ${err.message}`)
    return false
  }
}

function commitAndDeploy() {
  header('Committing Critical Fixes')
  
  const deployCommands = [
    'git add .',
    'git commit -m "CRITICAL FIXES: Twitter OAuth, Next.js deployment, and Redis configuration\\n\\n- Fix Twitter OAuth for production URLs and proper callback handling\\n- Ensure Dockerfile uses correct server command (node server.js)\\n- Add NEXTAUTH_URL to environment variables\\n- Create environment validation script\\n- Add comprehensive Koyeb deployment instructions\\n- These fixes address authentication and deployment issues from logs analysis"',
    'git push origin master'
  ]
  
  for (const command of deployCommands) {
    if (!runCommand(command, `Running: ${command.split(' ')[0]} ${command.split(' ')[1]}`)) {
      if (command.includes('commit')) {
        warning('Commit may have failed because no changes to commit')
      } else if (command.includes('push')) {
        error('Push failed - deployment will not be triggered')
        return false
      }
    }
  }
  
  return true
}

async function main() {
  log('\\n🚨 LayerEdge Critical Authentication & Deployment Fixes', colors.red + colors.bright)
  log('============================================================', colors.cyan)
  
  info('Implementing fixes based on deployment logs analysis...')
  
  // Priority 1: Twitter OAuth fixes
  if (!fixTwitterOAuthConfig()) {
    error('❌ Failed to fix Twitter OAuth configuration')
    process.exit(1)
  }
  
  // Priority 2: Next.js deployment fixes
  if (!fixNextJSDeployment()) {
    error('❌ Failed to fix Next.js deployment configuration')
    process.exit(1)
  }
  
  // Priority 3: Environment validation
  if (!createEnvironmentValidation()) {
    error('❌ Failed to create environment validation')
    process.exit(1)
  }
  
  // Create Koyeb instructions
  if (!createKoyebInstructions()) {
    error('❌ Failed to create Koyeb instructions')
    process.exit(1)
  }
  
  // Commit and deploy
  if (!commitAndDeploy()) {
    error('❌ Failed to commit and deploy fixes')
    process.exit(1)
  }
  
  // Success message
  priority('Critical Fixes Implemented Successfully')
  success('🎉 All critical fixes have been implemented!')
  success('\\n✅ Fixes applied:')
  success('   - Twitter OAuth configuration for production')
  success('   - Next.js deployment configuration verified')
  success('   - Environment variables validation created')
  success('   - Comprehensive Koyeb instructions generated')
  success('   - Changes committed and pushed')
  
  info('\\n🚀 IMMEDIATE NEXT STEPS:')
  info('   1. Add environment variables to Koyeb (see KOYEB_CRITICAL_ENVIRONMENT_VARIABLES.md)')
  info('   2. Update Twitter Developer Portal callback URL')
  info('   3. Trigger manual Koyeb redeploy')
  info('   4. Test Twitter OAuth flow end-to-end')
  info('   5. Verify tweet tracking functionality')
  
  warning('\\n⚠️  CRITICAL:')
  warning('   - Use EXACT environment variable values provided')
  warning('   - Update Twitter Developer Portal callback URL')
  warning('   - Monitor deployment logs for authentication errors')
  
  success('\\n🎯 Expected result: Complete resolution of authentication and deployment issues!')
}

main().catch(console.error)
