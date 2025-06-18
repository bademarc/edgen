import { NextResponse } from 'next/server'
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

    // Test Bearer Token format - Twitter Bearer Tokens should start with 'AAAAAAAAAAAAAAAAAAAAAA'
    // and be at least 100 characters long (typical length is around 100-120 characters)
    const bearerToken = process.env.TWITTER_BEARER_TOKEN
    const bearerTokenValid = bearerToken && bearerToken.startsWith('AAAAAAAAAAAAAAAAAAAAAA') && bearerToken.length >= 100

    // Test Basic Auth header construction
    const clientId = process.env.TWITTER_CLIENT_ID
    const clientSecret = process.env.TWITTER_CLIENT_SECRET
    const basicAuthCredentials = clientId && clientSecret
      ? Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      : null

    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: envCheck,
      oauthConfig: {
        clientIdLength: process.env.TWITTER_CLIENT_ID?.length || 0,
        clientSecretLength: process.env.TWITTER_CLIENT_SECRET?.length || 0,
        clientSecretPreview: clientSecret ? clientSecret.substring(0, 10) + '...' + clientSecret.slice(-10) : 'MISSING',
        bearerTokenLength: bearerToken?.length || 0,
        bearerTokenValid,
        redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/twitter/callback`,
        generatedAuthUrl: url.substring(0, 100) + '...',
        codeVerifierLength: codeVerifier.length,
        stateLength: state.length,
        basicAuthHeaderPreview: basicAuthCredentials ? `Basic ${basicAuthCredentials.substring(0, 20)}...` : 'CANNOT_GENERATE'
      },
      potentialIssues: [] as string[]
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
      diagnostics.potentialIssues.push(`NEXT_PUBLIC_SITE_URL mismatch: ${process.env.NEXT_PUBLIC_SITE_URL}`)
    }

    if (process.env.NEXTAUTH_URL !== 'https://edgen.koyeb.app') {
      diagnostics.potentialIssues.push(`NEXTAUTH_URL mismatch: ${process.env.NEXTAUTH_URL}`)
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
