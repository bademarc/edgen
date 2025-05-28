#!/usr/bin/env tsx

import crypto from 'crypto'
import { getTokenEncryption } from '../src/lib/token-encryption'

/**
 * Script to diagnose and fix token encryption issues for Koyeb deployment
 */

interface EncryptionTest {
  component: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  fix?: string
}

class TokenEncryptionFixer {
  private results: EncryptionTest[] = []

  private test(component: string, condition: boolean, message: string, fix?: string): void {
    this.results.push({
      component,
      status: condition ? 'pass' : 'fail',
      message,
      fix
    })

    const icon = condition ? '✅' : '❌'
    console.log(`   ${icon} ${message}`)
    if (!condition && fix) {
      console.log(`      💡 Fix: ${fix}`)
    }
  }

  private warn(component: string, message: string, fix?: string): void {
    this.results.push({
      component,
      status: 'warn',
      message,
      fix
    })
    console.log(`   ⚠️  ${message}`)
    if (fix) {
      console.log(`      💡 Recommendation: ${fix}`)
    }
  }

  /**
   * Generate a secure 32-byte encryption key
   */
  generateEncryptionKey(): string {
    const key = crypto.randomBytes(32).toString('hex')
    console.log('🔑 Generated new TOKEN_ENCRYPTION_KEY:')
    console.log(`TOKEN_ENCRYPTION_KEY=${key}`)
    console.log('')
    return key
  }

  /**
   * Test environment variable configuration
   */
  async testEnvironmentVariables(): Promise<void> {
    console.log('1️⃣ Testing Environment Variables...')

    const tokenKey = process.env.TOKEN_ENCRYPTION_KEY
    const nextAuthSecret = process.env.NEXTAUTH_SECRET
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    this.test(
      'Environment',
      !!tokenKey,
      'TOKEN_ENCRYPTION_KEY is set',
      'Set TOKEN_ENCRYPTION_KEY environment variable'
    )

    if (tokenKey) {
      this.test(
        'Environment',
        tokenKey.length === 64 && /^[0-9a-f]+$/i.test(tokenKey),
        'TOKEN_ENCRYPTION_KEY is valid 32-byte hex key',
        'Use a 64-character hex string (32 bytes)'
      )
    }

    // Only require fallbacks if primary key is not set
    if (!tokenKey) {
      this.test(
        'Environment',
        !!nextAuthSecret,
        'NEXTAUTH_SECRET is set (fallback)',
        'Set NEXTAUTH_SECRET as fallback for token encryption'
      )

      if (!nextAuthSecret) {
        this.test(
          'Environment',
          !!supabaseUrl,
          'NEXT_PUBLIC_SUPABASE_URL is set (last resort fallback)',
          'Set NEXT_PUBLIC_SUPABASE_URL'
        )
      } else {
        this.warn(
          'Environment',
          'NEXT_PUBLIC_SUPABASE_URL available as last resort',
          'Consider setting TOKEN_ENCRYPTION_KEY for better security'
        )
      }
    } else {
      this.warn(
        'Environment',
        'NEXTAUTH_SECRET available as fallback',
        'Primary TOKEN_ENCRYPTION_KEY is set'
      )
      this.warn(
        'Environment',
        'NEXT_PUBLIC_SUPABASE_URL available as last resort',
        'Primary TOKEN_ENCRYPTION_KEY is set'
      )
    }

    if (!tokenKey && !nextAuthSecret && !supabaseUrl) {
      console.log('   ❌ No encryption key sources available!')
    }

    console.log('')
  }

  /**
   * Test token encryption functionality
   */
  async testTokenEncryption(): Promise<void> {
    console.log('2️⃣ Testing Token Encryption...')

    try {
      const tokenService = getTokenEncryption()

      // Test with a sample token
      const testToken = 'test-oauth-token-12345'

      console.log('   🔄 Testing encryption...')
      const encrypted = tokenService.encrypt(testToken)

      this.test(
        'Encryption',
        !!encrypted && encrypted !== testToken,
        'Token encryption successful',
        'Check TOKEN_ENCRYPTION_KEY or NEXTAUTH_SECRET'
      )

      console.log('   🔄 Testing decryption...')
      const decrypted = tokenService.decrypt(encrypted)

      this.test(
        'Encryption',
        decrypted === testToken,
        'Token decryption successful',
        'Check encryption key consistency'
      )

      console.log('   🔄 Testing safe encryption...')
      const safeEncrypted = tokenService.safeEncrypt(testToken)
      const safeDecrypted = tokenService.safeDecrypt(safeEncrypted)

      this.test(
        'Encryption',
        safeDecrypted === testToken,
        'Safe encryption/decryption successful'
      )

      console.log('   🔄 Testing encrypted token detection...')
      const isEncryptedDetected = tokenService.isEncrypted(encrypted)
      const isPlainDetected = !tokenService.isEncrypted(testToken)

      this.test(
        'Encryption',
        isEncryptedDetected && isPlainDetected,
        'Encrypted token detection working'
      )

    } catch (error) {
      console.log('   ❌ Token encryption failed:', error)
      this.test(
        'Encryption',
        false,
        `Encryption test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Check environment variables and crypto implementation'
      )
    }

    console.log('')
  }

  /**
   * Test OAuth callback flow simulation
   */
  async testOAuthFlow(): Promise<void> {
    console.log('3️⃣ Testing OAuth Flow Simulation...')

    try {
      const tokenService = getTokenEncryption()

      // Simulate Twitter OAuth tokens
      const mockAccessToken = 'mock-twitter-access-token-abc123'
      const mockRefreshToken = 'mock-twitter-refresh-token-def456'

      console.log('   🔄 Simulating OAuth callback encryption...')

      const encryptedAccess = tokenService.encrypt(mockAccessToken)
      const encryptedRefresh = tokenService.encrypt(mockRefreshToken)

      this.test(
        'OAuth',
        !!encryptedAccess && !!encryptedRefresh,
        'OAuth tokens encrypted successfully'
      )

      console.log('   🔄 Simulating token retrieval...')

      const decryptedAccess = tokenService.safeDecrypt(encryptedAccess)
      const decryptedRefresh = tokenService.safeDecrypt(encryptedRefresh)

      this.test(
        'OAuth',
        decryptedAccess === mockAccessToken && decryptedRefresh === mockRefreshToken,
        'OAuth tokens decrypted successfully'
      )

    } catch (error) {
      console.log('   ❌ OAuth flow simulation failed:', error)
      this.test(
        'OAuth',
        false,
        `OAuth simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Fix token encryption before deploying OAuth functionality'
      )
    }

    console.log('')
  }

  /**
   * Generate deployment instructions
   */
  generateDeploymentInstructions(): void {
    console.log('4️⃣ Koyeb Deployment Instructions...')

    const hasFailures = this.results.some(r => r.status === 'fail')

    if (hasFailures) {
      console.log('   ❌ Fix the following issues before deploying:')
      this.results
        .filter(r => r.status === 'fail')
        .forEach(r => {
          console.log(`      • ${r.message}`)
          if (r.fix) {
            console.log(`        Fix: ${r.fix}`)
          }
        })
    } else {
      console.log('   ✅ All encryption tests passed!')
    }

    console.log('')
    console.log('   📋 Required Koyeb Environment Variables:')

    if (!process.env.TOKEN_ENCRYPTION_KEY) {
      const newKey = this.generateEncryptionKey()
      console.log('   Add this to your Koyeb environment variables:')
      console.log(`   TOKEN_ENCRYPTION_KEY=${newKey}`)
    } else {
      console.log('   ✅ TOKEN_ENCRYPTION_KEY is already configured')
    }

    console.log('')
    console.log('   🔧 Alternative Configuration (if TOKEN_ENCRYPTION_KEY not available):')
    console.log('   NEXTAUTH_SECRET=your-secure-secret-key-here')
    console.log('')
  }

  /**
   * Run all tests and generate report
   */
  async run(): Promise<void> {
    console.log('🔐 LayerEdge Token Encryption Diagnostic & Fix')
    console.log('=' .repeat(50))
    console.log('')

    await this.testEnvironmentVariables()
    await this.testTokenEncryption()
    await this.testOAuthFlow()
    this.generateDeploymentInstructions()

    // Summary
    const passed = this.results.filter(r => r.status === 'pass').length
    const failed = this.results.filter(r => r.status === 'fail').length
    const warnings = this.results.filter(r => r.status === 'warn').length

    console.log('📊 Test Summary:')
    console.log(`   ✅ Passed: ${passed}`)
    console.log(`   ❌ Failed: ${failed}`)
    console.log(`   ⚠️  Warnings: ${warnings}`)
    console.log('')

    if (failed === 0) {
      console.log('🎉 Token encryption is ready for Koyeb deployment!')
    } else {
      console.log('🚨 Fix the failed tests before deploying to Koyeb.')
      process.exit(1)
    }
  }
}

// Run the diagnostic
const fixer = new TokenEncryptionFixer()
fixer.run().catch(error => {
  console.error('❌ Diagnostic failed:', error)
  process.exit(1)
})
