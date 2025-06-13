'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface OAuthTestResult {
  success: boolean
  environment: {
    TWITTER_CLIENT_ID: boolean
    TWITTER_CLIENT_SECRET: boolean
    NEXT_PUBLIC_SITE_URL: string
    NODE_ENV: string
  }
  oauth?: {
    url: string
    fullUrl: string
    redirectUri: string
    clientId: string
    codeVerifierLength: number
    stateLength: number
  }
  error?: string
  message?: string
}

export default function TestOAuthPage() {
  const [testResult, setTestResult] = useState<OAuthTestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [manualUrl, setManualUrl] = useState('')

  const testOAuthConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/test-oauth-config')
      const result = await response.json()
      setTestResult(result)
      if (result.oauth?.fullUrl) {
        setManualUrl(result.oauth.fullUrl)
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        environment: {
          TWITTER_CLIENT_ID: false,
          TWITTER_CLIENT_SECRET: false,
          NEXT_PUBLIC_SITE_URL: 'unknown',
          NODE_ENV: 'unknown'
        }
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testOAuthFlow = () => {
    if (testResult?.oauth?.fullUrl) {
      window.location.href = testResult.oauth.fullUrl
    }
  }

  useEffect(() => {
    testOAuthConfig()
  }, [])

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Twitter OAuth Debug & Test
          </h1>
          <p className="text-muted-foreground">
            Test and debug the Twitter OAuth authentication flow
          </p>
        </motion.div>

        <div className="grid gap-6">
          {/* Configuration Test */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-card border border-border rounded-lg p-6"
          >
            <h2 className="text-xl font-semibold text-foreground mb-4">
              OAuth Configuration Test
            </h2>
            
            <button
              onClick={testOAuthConfig}
              disabled={isLoading}
              className="mb-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Testing...' : 'Test Configuration'}
            </button>

            {testResult && (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${
                  testResult.success 
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">
                      {testResult.success ? '✅ Configuration Valid' : '❌ Configuration Error'}
                    </span>
                  </div>
                  {testResult.error && (
                    <p className="text-sm">{testResult.error}</p>
                  )}
                  {testResult.message && (
                    <p className="text-sm">{testResult.message}</p>
                  )}
                </div>

                {/* Environment Variables */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-medium text-foreground mb-2">Environment Variables</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>TWITTER_CLIENT_ID:</span>
                      <span className={testResult.environment.TWITTER_CLIENT_ID ? 'text-green-400' : 'text-red-400'}>
                        {testResult.environment.TWITTER_CLIENT_ID ? '✅ Present' : '❌ Missing'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>TWITTER_CLIENT_SECRET:</span>
                      <span className={testResult.environment.TWITTER_CLIENT_SECRET ? 'text-green-400' : 'text-red-400'}>
                        {testResult.environment.TWITTER_CLIENT_SECRET ? '✅ Present' : '❌ Missing'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>NEXT_PUBLIC_SITE_URL:</span>
                      <span className="text-muted-foreground">{testResult.environment.NEXT_PUBLIC_SITE_URL}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>NODE_ENV:</span>
                      <span className="text-muted-foreground">{testResult.environment.NODE_ENV}</span>
                    </div>
                  </div>
                </div>

                {/* OAuth Details */}
                {testResult.oauth && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h3 className="font-medium text-foreground mb-2">OAuth Configuration</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Redirect URI:</span>
                        <span className="text-muted-foreground">{testResult.oauth.redirectUri}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Client ID:</span>
                        <span className="text-muted-foreground font-mono text-xs">{testResult.oauth.clientId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Code Verifier Length:</span>
                        <span className="text-muted-foreground">{testResult.oauth.codeVerifierLength}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>State Length:</span>
                        <span className="text-muted-foreground">{testResult.oauth.stateLength}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* OAuth Flow Test */}
          {testResult?.success && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">
                OAuth Flow Test
              </h2>
              
              <div className="space-y-4">
                <button
                  onClick={testOAuthFlow}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  🚀 Test OAuth Flow (Redirect to Twitter)
                </button>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-medium text-foreground mb-2">Manual Test URL</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Copy this URL and paste it in a new browser tab to test manually:
                  </p>
                  <div className="bg-background border rounded p-2">
                    <code className="text-xs break-all text-muted-foreground">
                      {manualUrl}
                    </code>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(manualUrl)}
                    className="mt-2 text-sm bg-muted hover:bg-muted/80 text-foreground px-3 py-1 rounded transition-colors"
                  >
                    📋 Copy URL
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Troubleshooting Guide */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-card border border-border rounded-lg p-6"
          >
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Troubleshooting Guide
            </h2>
            
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-medium text-foreground mb-2">Common Issues:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• <strong>Access Denied:</strong> Check Twitter Developer Console callback URL matches exactly</li>
                  <li>• <strong>OAuth 2.0 Not Enabled:</strong> Enable OAuth 2.0 in Twitter app settings</li>
                  <li>• <strong>Localhost Issues:</strong> Ensure Twitter app allows localhost callbacks for development</li>
                  <li>• <strong>Client ID Format:</strong> Should be base64 encoded with colon separator</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-foreground mb-2">Required Twitter App Settings:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• <strong>App Type:</strong> Web App</li>
                  <li>• <strong>OAuth 2.0:</strong> Enabled</li>
                  <li>• <strong>Callback URL:</strong> http://localhost:3000/auth/twitter/callback</li>
                  <li>• <strong>Website URL:</strong> http://localhost:3000</li>
                  <li>• <strong>Permissions:</strong> Read (minimum)</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
