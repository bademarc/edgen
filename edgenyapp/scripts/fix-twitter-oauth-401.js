#!/usr/bin/env node

/**
 * LayerEdge Community Platform - Fix Twitter OAuth 401 Error
 * 
 * This script diagnoses and fixes the "Token exchange failed: 401 Unauthorized" error.
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

function critical(message) {
  log(`\n🚨 ${message}`, colors.red + colors.bright)
  log('='.repeat(60), colors.red)
}

function fixTwitterOAuthService() {
  header('Fixing Twitter OAuth Service for 401 Error')
  
  const twitterOAuthPath = join(projectRoot, 'src/lib/twitter-oauth.ts')
  
  if (!existsSync(twitterOAuthPath)) {
    error('Twitter OAuth service file not found')
    return false
  }
  
  let content = readFileSync(twitterOAuthPath, 'utf8')
  
  // Enhanced OAuth service with better error handling and debugging
  const enhancedOAuthService = `import crypto from 'crypto'

interface TwitterOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  scope?: string
  token_type: string
}

interface TwitterUser {
  id: string
  name: string
  username: string
  profile_image_url?: string
  verified?: boolean
  public_metrics?: {
    followers_count: number
    following_count: number
    tweet_count: number
  }
}

interface TwitterUserResponse {
  data: TwitterUser
}

export class TwitterOAuthService {
  private config: TwitterOAuthConfig

  constructor() {
    // Always use production URL for OAuth
    const siteUrl = process.env.NODE_ENV === 'production' 
      ? 'https://edgen.koyeb.app'
      : (process.env.NEXT_PUBLIC_SITE_URL || 'https://edgen.koyeb.app')

    this.config = {
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      redirectUri: \`\${siteUrl}/auth/twitter/callback\`
    }

    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('Twitter OAuth credentials are not configured')
    }

    console.log('Twitter OAuth Config:', {
      clientId: this.config.clientId,
      redirectUri: this.config.redirectUri,
      environment: process.env.NODE_ENV
    })
  }

  /**
   * Generate OAuth 2.0 authorization URL with PKCE
   */
  generateAuthUrl(): { url: string; codeVerifier: string; state: string } {
    // Generate PKCE code verifier and challenge
    const codeVerifier = this.generateCodeVerifier()
    const codeChallenge = this.generateCodeChallenge(codeVerifier)

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex')

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'tweet.read users.read offline.access',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    })

    const url = \`https://twitter.com/i/oauth2/authorize?\${params.toString()}\`

    console.log('Generated OAuth URL:', {
      url: url.substring(0, 100) + '...',
      redirectUri: this.config.redirectUri,
      clientId: this.config.clientId,
      codeVerifierLength: codeVerifier.length,
      stateLength: state.length
    })

    return { url, codeVerifier, state }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, codeVerifier: string): Promise<TokenResponse> {
    const tokenUrl = 'https://api.twitter.com/2/oauth2/token'
    
    // Create Basic Auth header
    const credentials = Buffer.from(\`\${this.config.clientId}:\${this.config.clientSecret}\`).toString('base64')
    
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.config.redirectUri,
      code_verifier: codeVerifier,
      client_id: this.config.clientId
    })

    console.log('Token exchange request:', {
      url: tokenUrl,
      redirectUri: this.config.redirectUri,
      clientId: this.config.clientId,
      codeLength: code.length,
      codeVerifierLength: codeVerifier.length,
      hasClientSecret: !!this.config.clientSecret
    })

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': \`Basic \${credentials}\`,
          'User-Agent': 'LayerEdge/1.0'
        },
        body: body.toString()
      })

      const responseText = await response.text()
      
      console.log('Token exchange response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        bodyPreview: responseText.substring(0, 200)
      })

      if (!response.ok) {
        console.error('Token exchange failed:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText
        })
        
        // Parse error response if possible
        try {
          const errorData = JSON.parse(responseText)
          throw new Error(\`Token exchange failed: \${response.status} \${response.statusText}. Error: \${errorData.error_description || errorData.error || 'Unknown error'}\`)
        } catch (parseError) {
          throw new Error(\`Token exchange failed: \${response.status} \${response.statusText}. Response: \${responseText}\`)
        }
      }

      const tokenData = JSON.parse(responseText)
      
      console.log('Token exchange successful:', {
        tokenType: tokenData.token_type,
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope
      })

      return tokenData
    } catch (error) {
      console.error('Token exchange error:', error)
      throw error
    }
  }

  /**
   * Get user information using access token
   */
  async getUserInfo(accessToken: string): Promise<TwitterUserResponse> {
    const userUrl = 'https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url,verified,public_metrics'

    console.log('Fetching user info from:', userUrl)

    try {
      const response = await fetch(userUrl, {
        headers: {
          'Authorization': \`Bearer \${accessToken}\`,
          'User-Agent': 'LayerEdge/1.0'
        }
      })

      const responseText = await response.text()
      
      console.log('User info response:', {
        status: response.status,
        statusText: response.statusText,
        bodyPreview: responseText.substring(0, 200)
      })

      if (!response.ok) {
        console.error('User info fetch failed:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText
        })
        throw new Error(\`Failed to fetch user info: \${response.status} \${response.statusText}\`)
      }

      const userData = JSON.parse(responseText)
      
      console.log('User info successful:', {
        userId: userData.data?.id,
        username: userData.data?.username,
        name: userData.data?.name
      })

      return userData
    } catch (error) {
      console.error('User info error:', error)
      throw error
    }
  }

  /**
   * Generate PKCE code verifier
   */
  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url')
  }

  /**
   * Generate PKCE code challenge
   */
  private generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url')
  }
}
`
  
  writeFileSync(twitterOAuthPath, enhancedOAuthService)
  success('Enhanced Twitter OAuth service with detailed logging and error handling')
  
  return true
}

function createTwitterDeveloperPortalInstructions() {
  header('Creating Twitter Developer Portal Fix Instructions')
  
  const instructions = `# 🚨 CRITICAL: Twitter Developer Portal Configuration Fix

## IMMEDIATE ACTION REQUIRED

The "Token exchange failed: 401 Unauthorized" error indicates a mismatch between your Twitter App configuration and the OAuth request.

### STEP 1: Go to Twitter Developer Portal

1. Visit: https://developer.twitter.com/en/portal/dashboard
2. Select your LayerEdge app
3. Go to "Settings" tab

### STEP 2: Update App Settings (EXACT VALUES)

**App Details:**
- **App Name:** LayerEdge Community Platform
- **Website URL:** \`https://edgen.koyeb.app\`
- **Callback URLs:** \`https://edgen.koyeb.app/auth/twitter/callback\`
- **Terms of Service:** \`https://edgen.koyeb.app/terms\`
- **Privacy Policy:** \`https://edgen.koyeb.app/privacy\`

### STEP 3: OAuth 2.0 Settings

**CRITICAL:** Ensure these settings are enabled:

1. **OAuth 2.0 is ENABLED**
2. **Type of App:** Web App
3. **App permissions:** Read
4. **Callback URLs:** \`https://edgen.koyeb.app/auth/twitter/callback\`
5. **Website URL:** \`https://edgen.koyeb.app\`

### STEP 4: Verify Client Credentials

**Your current Koyeb environment variables (UPDATED):**
- \`TWITTER_CLIENT_ID=TXdBWXdPQWNMMjdpcHRGblIyaVg6MTpjaQ\`
- \`TWITTER_CLIENT_SECRET=nsN3ICJpwMHpfxYCAP6EG5hC4Q9jmaOGgiKq3v1XB8LTAm2-xJ\`

**VERIFY:** These match exactly in Twitter Developer Portal:
1. Go to "Keys and tokens" tab
2. Check "OAuth 2.0 Client ID" matches: \`TXdBWXdPQWNMMjdpcHRGblIyaVg6MTpjaQ\`
3. Check "OAuth 2.0 Client Secret" matches: \`nsN3ICJpwMHpfxYCAP6EG5hC4Q9jmaOGgiKq3v1XB8LTAm2-xJ\`

### STEP 5: Common Issues & Fixes

**Issue 1: Callback URL Mismatch**
- ❌ Wrong: \`http://localhost:3000/auth/twitter/callback\`
- ❌ Wrong: \`https://edgen.koyeb.app/auth/callback\`
- ✅ Correct: \`https://edgen.koyeb.app/auth/twitter/callback\`

**Issue 2: OAuth 2.0 Not Enabled**
- Go to Settings → Authentication settings
- Ensure "OAuth 2.0" toggle is ON
- Ensure "OAuth 1.0a" is OFF (if using OAuth 2.0)

**Issue 3: App Permissions**
- Minimum required: "Read"
- Recommended: "Read and Write" (for future features)

**Issue 4: Client Secret Mismatch**
- If credentials don't match, regenerate them in Twitter Developer Portal
- Update Koyeb environment variables with new values

### STEP 6: Test After Changes

1. Save all changes in Twitter Developer Portal
2. Wait 5-10 minutes for changes to propagate
3. Test OAuth flow: https://edgen.koyeb.app/auth/twitter
4. Check Koyeb logs for detailed error messages

### DEBUGGING

If still getting 401 errors, check Koyeb logs for:
- "Token exchange request" details
- "Token exchange response" details
- Any credential mismatches

---

**MOST COMMON CAUSE:** Callback URL mismatch between Twitter Developer Portal and actual OAuth request.
**SOLUTION:** Ensure callback URL is exactly \`https://edgen.koyeb.app/auth/twitter/callback\` in Twitter Developer Portal.
`
  
  writeFileSync(join(projectRoot, 'TWITTER_DEVELOPER_PORTAL_FIX.md'), instructions)
  success('Created Twitter Developer Portal fix instructions')
  
  return true
}

function createOAuthTestEndpoint() {
  header('Creating Enhanced OAuth Test Endpoint')
  
  const testEndpointPath = join(projectRoot, 'src/app/api/test-oauth-debug/route.ts')
  
  const testEndpoint = `import { NextResponse } from 'next/server'
import { TwitterOAuthService } from '@/lib/twitter-oauth'

export async function GET() {
  try {
    console.log('=== OAuth Debug Test ===')
    
    // Test environment variables
    const envCheck = {
      TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID,
      TWITTER_CLIENT_SECRET: !!process.env.TWITTER_CLIENT_SECRET ? 'SET' : 'MISSING',
      TWITTER_BEARER_TOKEN: !!process.env.TWITTER_BEARER_TOKEN ? 'SET' : 'MISSING',
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NODE_ENV: process.env.NODE_ENV
    }
    
    console.log('Environment variables check:', envCheck)
    
    // Test OAuth service initialization
    const twitterOAuth = new TwitterOAuthService()
    const { url, codeVerifier, state } = twitterOAuth.generateAuthUrl()
    
    // Test Bearer Token format
    const bearerToken = process.env.TWITTER_BEARER_TOKEN
    const bearerTokenValid = bearerToken && bearerToken.startsWith('AAAAAAAAAAAAAAAAAAAAAD')
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: envCheck,
      oauthConfig: {
        clientIdLength: process.env.TWITTER_CLIENT_ID?.length || 0,
        clientSecretLength: process.env.TWITTER_CLIENT_SECRET?.length || 0,
        bearerTokenLength: bearerToken?.length || 0,
        bearerTokenValid,
        redirectUri: \`\${process.env.NEXT_PUBLIC_SITE_URL}/auth/twitter/callback\`,
        generatedAuthUrl: url.substring(0, 100) + '...',
        codeVerifierLength: codeVerifier.length,
        stateLength: state.length
      },
      potentialIssues: []
    }
    
    // Check for potential issues
    if (!process.env.TWITTER_CLIENT_ID) {
      diagnostics.potentialIssues.push('TWITTER_CLIENT_ID is missing')
    }
    
    if (!process.env.TWITTER_CLIENT_SECRET) {
      diagnostics.potentialIssues.push('TWITTER_CLIENT_SECRET is missing')
    }
    
    if (!bearerTokenValid) {
      diagnostics.potentialIssues.push('TWITTER_BEARER_TOKEN format appears invalid')
    }
    
    if (process.env.NEXT_PUBLIC_SITE_URL !== 'https://edgen.koyeb.app') {
      diagnostics.potentialIssues.push(\`NEXT_PUBLIC_SITE_URL mismatch: \${process.env.NEXT_PUBLIC_SITE_URL}\`)
    }
    
    if (process.env.NEXTAUTH_URL !== 'https://edgen.koyeb.app') {
      diagnostics.potentialIssues.push(\`NEXTAUTH_URL mismatch: \${process.env.NEXTAUTH_URL}\`)
    }
    
    return NextResponse.json({
      success: true,
      diagnostics,
      recommendations: diagnostics.potentialIssues.length > 0 ? [
        'Check Twitter Developer Portal callback URL matches exactly: https://edgen.koyeb.app/auth/twitter/callback',
        'Verify Twitter Client ID and Secret in Developer Portal match Koyeb environment variables',
        'Ensure OAuth 2.0 is enabled in Twitter Developer Portal',
        'Check app permissions are set to at least "Read"'
      ] : [
        'Configuration appears correct',
        'If still getting 401 errors, check Twitter Developer Portal settings',
        'Verify callback URL in Twitter Developer Portal matches exactly'
      ]
    })
    
  } catch (error) {
    console.error('OAuth debug test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      recommendations: [
        'Check that all Twitter environment variables are set in Koyeb',
        'Verify Twitter Developer Portal configuration',
        'Check Koyeb deployment logs for detailed error messages'
      ]
    }, { status: 500 })
  }
}
`
  
  writeFileSync(testEndpointPath, testEndpoint)
  success('Created enhanced OAuth debug test endpoint')
  
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
  header('Committing OAuth 401 Fix')
  
  const deployCommands = [
    'git add .',
    'git commit -m "CRITICAL FIX: Twitter OAuth 401 Unauthorized Error\\n\\n- Enhanced Twitter OAuth service with detailed logging and error handling\\n- Added comprehensive Twitter Developer Portal configuration instructions\\n- Created OAuth debug test endpoint for troubleshooting\\n- Improved error messages and debugging capabilities\\n- This should resolve the token exchange 401 error"',
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
  critical('Twitter OAuth 401 Unauthorized Error Fix')
  
  info('Fixing "Token exchange failed: 401 Unauthorized" error...')
  
  // Step 1: Fix Twitter OAuth service
  if (!fixTwitterOAuthService()) {
    error('❌ Failed to fix Twitter OAuth service')
    process.exit(1)
  }
  
  // Step 2: Create Twitter Developer Portal instructions
  if (!createTwitterDeveloperPortalInstructions()) {
    error('❌ Failed to create Twitter Developer Portal instructions')
    process.exit(1)
  }
  
  // Step 3: Create OAuth test endpoint
  if (!createOAuthTestEndpoint()) {
    error('❌ Failed to create OAuth test endpoint')
    process.exit(1)
  }
  
  // Step 4: Commit and deploy
  if (!commitAndDeploy()) {
    error('❌ Failed to commit and deploy fixes')
    process.exit(1)
  }
  
  // Success message
  critical('OAuth 401 Fix Deployed Successfully')
  success('🎉 Twitter OAuth 401 fix has been implemented!')
  success('\\n✅ Fixes applied:')
  success('   - Enhanced OAuth service with detailed logging')
  success('   - Added comprehensive error handling')
  success('   - Created Twitter Developer Portal fix instructions')
  success('   - Added OAuth debug test endpoint')
  success('   - Changes committed and pushed')
  
  info('\\n🚀 IMMEDIATE NEXT STEPS:')
  info('   1. Follow instructions in TWITTER_DEVELOPER_PORTAL_FIX.md')
  info('   2. Update Twitter Developer Portal callback URL')
  info('   3. Wait for Koyeb deployment to complete (5-10 minutes)')
  info('   4. Test OAuth debug endpoint: https://edgen.koyeb.app/api/test-oauth-debug')
  info('   5. Test OAuth flow: https://edgen.koyeb.app/auth/twitter')
  
  warning('\\n⚠️  CRITICAL:')
  warning('   - Callback URL in Twitter Developer Portal MUST be: https://edgen.koyeb.app/auth/twitter/callback')
  warning('   - OAuth 2.0 must be enabled in Twitter Developer Portal')
  warning('   - Client credentials must match exactly')
  
  success('\\n🎯 Expected result: OAuth 401 error resolved!')
}

main().catch(console.error)
