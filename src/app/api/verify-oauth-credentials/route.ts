import { NextResponse } from 'next/server'
import { TwitterOAuthService } from '@/lib/twitter-oauth'

/**
 * API endpoint to verify which Twitter OAuth credentials are currently being used
 * This helps diagnose credential caching issues in production
 */
export async function GET() {
  try {
    // Get current environment variables
    const currentCredentials = {
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      bearerToken: process.env.TWITTER_BEARER_TOKEN,
      apiKey: process.env.TWITTER_API_KEY,
      apiSecret: process.env.TWITTER_API_SECRET
    }

    // Expected new credentials (for comparison)
    const expectedCredentials = {
      clientId: 'TXdBWXdPQWNMMjdpcHRGblIyaVg6MTpjaQ',
      clientSecret: 'nsN3ICJpwMHpfxYCAP6EG5hC4Q9jmaOGgiKq3v1XB8LTAm2-xJ'
    }

    // Check if credentials match expected values
    const credentialStatus = {
      clientIdCorrect: currentCredentials.clientId === expectedCredentials.clientId,
      clientSecretCorrect: currentCredentials.clientSecret === expectedCredentials.clientSecret,
      hasClientId: !!currentCredentials.clientId,
      hasClientSecret: !!currentCredentials.clientSecret,
      hasBearerToken: !!currentCredentials.bearerToken,
      hasApiKey: !!currentCredentials.apiKey,
      hasApiSecret: !!currentCredentials.apiSecret
    }

    // Test OAuth service initialization
    let oauthServiceStatus = {
      canInitialize: false,
      error: null as string | null,
      authUrlGenerated: false,
      clientIdInUrl: null as string | null
    }

    try {
      const twitterOAuth = new TwitterOAuthService()
      oauthServiceStatus.canInitialize = true

      // Try to generate auth URL
      const { url } = twitterOAuth.generateAuthUrl()
      oauthServiceStatus.authUrlGenerated = true

      // Extract client_id from the URL to see which one is actually being used
      const urlParams = new URLSearchParams(url.split('?')[1])
      oauthServiceStatus.clientIdInUrl = urlParams.get('client_id')

    } catch (error) {
      oauthServiceStatus.error = error instanceof Error ? error.message : 'Unknown error'
    }

    // Determine overall status
    const isUsingCorrectCredentials = 
      credentialStatus.clientIdCorrect && 
      credentialStatus.clientSecretCorrect &&
      oauthServiceStatus.clientIdInUrl === expectedCredentials.clientId

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      
      // Current credentials (masked for security)
      currentCredentials: {
        clientId: currentCredentials.clientId ? 
          currentCredentials.clientId.substring(0, 10) + '...' : 'not set',
        clientSecret: currentCredentials.clientSecret ? 
          currentCredentials.clientSecret.substring(0, 10) + '...' : 'not set',
        bearerToken: currentCredentials.bearerToken ? 
          currentCredentials.bearerToken.substring(0, 20) + '...' : 'not set',
        apiKey: currentCredentials.apiKey ? 
          currentCredentials.apiKey.substring(0, 10) + '...' : 'not set',
        apiSecret: currentCredentials.apiSecret ? 
          currentCredentials.apiSecret.substring(0, 10) + '...' : 'not set'
      },

      // Expected credentials (masked for security)
      expectedCredentials: {
        clientId: expectedCredentials.clientId.substring(0, 10) + '...',
        clientSecret: expectedCredentials.clientSecret.substring(0, 10) + '...'
      },

      // Status checks
      credentialStatus,
      oauthServiceStatus,

      // Overall assessment
      assessment: {
        isUsingCorrectCredentials,
        status: isUsingCorrectCredentials ? 'CORRECT' : 'OUTDATED',
        message: isUsingCorrectCredentials ? 
          'Using correct new Twitter OAuth credentials' : 
          'Still using old Twitter OAuth credentials',
        
        // Action items if credentials are wrong
        actionItems: isUsingCorrectCredentials ? [] : [
          'Update TWITTER_CLIENT_ID in Koyeb environment variables',
          'Update TWITTER_CLIENT_SECRET in Koyeb environment variables', 
          'Restart the Koyeb deployment',
          'Clear application cache if needed'
        ]
      },

      // Debugging information
      debug: {
        nodeEnv: process.env.NODE_ENV,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        clientIdFromUrl: oauthServiceStatus.clientIdInUrl
      }
    })

  } catch (error) {
    console.error('OAuth credential verification failed:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      message: 'Failed to verify OAuth credentials'
    }, { status: 500 })
  }
}

/**
 * POST endpoint for admin-level credential verification with more detailed info
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { adminSecret } = body

    // Simple admin verification (in production, use proper authentication)
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Return full credential details for admin
    const fullCredentials = {
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      bearerToken: process.env.TWITTER_BEARER_TOKEN,
      apiKey: process.env.TWITTER_API_KEY,
      apiSecret: process.env.TWITTER_API_SECRET
    }

    const expectedCredentials = {
      clientId: 'TXdBWXdPQWNMMjdpcHRGblIyaVg6MTpjaQ',
      clientSecret: 'nsN3ICJpwMHpfxYCAP6EG5hC4Q9jmaOGgiKq3v1XB8LTAm2-xJ'
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      fullCredentials,
      expectedCredentials,
      matches: {
        clientId: fullCredentials.clientId === expectedCredentials.clientId,
        clientSecret: fullCredentials.clientSecret === expectedCredentials.clientSecret
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
        nextAuthUrl: process.env.NEXTAUTH_URL
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
