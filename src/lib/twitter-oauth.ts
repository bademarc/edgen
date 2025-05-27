import crypto from 'crypto'

export interface TwitterOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface TwitterTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope: string
}

export interface TwitterUserResponse {
  data: {
    id: string
    name: string
    username: string
    profile_image_url?: string
    public_metrics?: {
      followers_count: number
      following_count: number
      tweet_count: number
    }
  }
}

export class TwitterOAuthService {
  private config: TwitterOAuthConfig

  constructor() {
    // Ensure we always have https:// protocol
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://edgen.koyeb.app'
    if (!siteUrl.startsWith('http')) {
      siteUrl = `https://${siteUrl}`
    }

    this.config = {
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      redirectUri: `${siteUrl}/auth/twitter/callback`
    }

    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('Twitter OAuth credentials are not configured')
    }

    console.log('Twitter OAuth Config:', {
      clientId: this.config.clientId,
      redirectUri: this.config.redirectUri
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

    const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`

    console.log('Generated OAuth URL:', authUrl)
    console.log('Redirect URI being used:', this.config.redirectUri)

    return {
      url: authUrl,
      codeVerifier,
      state
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    code: string,
    codeVerifier: string
  ): Promise<TwitterTokenResponse> {
    const tokenUrl = 'https://api.twitter.com/2/oauth2/token'

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      code: code,
      redirect_uri: this.config.redirectUri,
      code_verifier: codeVerifier
    })

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`
      },
      body: params.toString()
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Token exchange failed:', errorData)
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Get user information using access token
   */
  async getUserInfo(accessToken: string): Promise<TwitterUserResponse> {
    const userUrl = 'https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url,public_metrics'

    const response = await fetch(userUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('User info fetch failed:', errorData)
      throw new Error(`User info fetch failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
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
    return crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url')
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<TwitterTokenResponse> {
    const tokenUrl = 'https://api.twitter.com/2/oauth2/token'

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId
    })

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`
      },
      body: params.toString()
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Token refresh failed:', errorData)
      throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }
}
