import crypto from 'crypto'

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
      redirectUri: `${siteUrl}/auth/twitter/callback`
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

    const url = `https://twitter.com/i/oauth2/authorize?${params.toString()}`

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

    // Create Basic Auth header - ensure proper encoding
    const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')

    // Twitter OAuth 2.0 requires these specific parameters
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
      clientSecretLength: this.config.clientSecret.length,
      clientSecretPreview: this.config.clientSecret.substring(0, 10) + '...' + this.config.clientSecret.slice(-10),
      codeLength: code.length,
      codeVerifierLength: codeVerifier.length,
      hasClientSecret: !!this.config.clientSecret,
      authHeaderPreview: `Basic ${credentials.substring(0, 20)}...`
    })

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json',
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

        // If Basic Auth failed, try with client credentials in body
        if (response.status === 401 && responseText.includes('unauthorized_client')) {
          console.log('Retrying token exchange with client credentials in body...')
          return this.exchangeCodeForTokenAlternative(code, codeVerifier)
        }

        // Parse error response if possible
        try {
          const errorData = JSON.parse(responseText)
          throw new Error(`Token exchange failed: ${response.status} ${response.statusText}. Error: ${errorData.error_description || errorData.error || 'Unknown error'}`)
        } catch (parseError) {
          throw new Error(`Token exchange failed: ${response.status} ${response.statusText}. Response: ${responseText}`)
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
   * Alternative token exchange method with client credentials in body
   */
  private async exchangeCodeForTokenAlternative(code: string, codeVerifier: string): Promise<TokenResponse> {
    const tokenUrl = 'https://api.twitter.com/2/oauth2/token'

    // Include client credentials in the request body instead of Authorization header
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.config.redirectUri,
      code_verifier: codeVerifier,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    })

    console.log('Alternative token exchange request (credentials in body):', {
      url: tokenUrl,
      redirectUri: this.config.redirectUri,
      clientId: this.config.clientId,
      hasClientSecret: !!this.config.clientSecret,
      method: 'credentials_in_body'
    })

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'LayerEdge/1.0'
        },
        body: body.toString()
      })

      const responseText = await response.text()

      console.log('Alternative token exchange response:', {
        status: response.status,
        statusText: response.statusText,
        bodyPreview: responseText.substring(0, 200)
      })

      if (!response.ok) {
        console.error('Alternative token exchange also failed:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText
        })

        // Parse error response if possible
        try {
          const errorData = JSON.parse(responseText)
          throw new Error(`Alternative token exchange failed: ${response.status} ${response.statusText}. Error: ${errorData.error_description || errorData.error || 'Unknown error'}`)
        } catch (parseError) {
          throw new Error(`Alternative token exchange failed: ${response.status} ${response.statusText}. Response: ${responseText}`)
        }
      }

      const tokenData = JSON.parse(responseText)

      console.log('Alternative token exchange successful:', {
        tokenType: tokenData.token_type,
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope
      })

      return tokenData
    } catch (error) {
      console.error('Alternative token exchange error:', error)
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
          'Authorization': `Bearer ${accessToken}`,
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
        throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`)
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
