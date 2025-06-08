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
        redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/twitter/callback`,
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
