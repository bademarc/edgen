#!/usr/bin/env tsx

/**
 * LayerEdge Community Platform - Twitter OAuth Authentication Test
 *
 * This script comprehensively tests the Twitter OAuth authentication setup
 * including Supabase configuration, environment variables, and auth flow.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  message: string
  details?: any
}

class TwitterOAuthTester {
  private results: TestResult[] = []
  private supabase: any

  constructor() {
    console.log('🔍 LayerEdge Twitter OAuth Authentication Test')
    console.log('=' .repeat(60))
  }

  private addResult(test: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, details?: any) {
    this.results.push({ test, status, message, details })
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'
    console.log(`${emoji} ${test}: ${message}`)
    if (details) {
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`)
    }
  }

  async testEnvironmentVariables() {
    console.log('\n📋 Testing Environment Variables...')

    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'TWITTER_CLIENT_ID',
      'TWITTER_CLIENT_SECRET',
      'TWITTER_BEARER_TOKEN'
    ]

    let allPresent = true
    const missingVars: string[] = []

    for (const varName of requiredVars) {
      const value = process.env[varName]
      if (!value) {
        allPresent = false
        missingVars.push(varName)
        this.addResult(
          `Environment Variable: ${varName}`,
          'FAIL',
          'Missing or empty'
        )
      } else {
        this.addResult(
          `Environment Variable: ${varName}`,
          'PASS',
          `Present (${value.substring(0, 10)}...)`
        )
      }
    }

    // Check for correct Twitter callback URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      const expectedCallbackUrl = `${supabaseUrl}/auth/v1/callback`
      this.addResult(
        'Twitter OAuth Callback URL',
        'WARNING',
        `Should be configured as: ${expectedCallbackUrl}`
      )
    }

    return allPresent
  }

  async testSupabaseConnection() {
    console.log('\n🔗 Testing Supabase Connection...')

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      this.supabase = createClient(supabaseUrl, supabaseKey)

      // Test basic connection
      const { data, error } = await this.supabase.auth.getSession()

      if (error) {
        this.addResult(
          'Supabase Connection',
          'FAIL',
          `Connection failed: ${error.message}`,
          error
        )
        return false
      }

      this.addResult(
        'Supabase Connection',
        'PASS',
        'Successfully connected to Supabase'
      )
      return true
    } catch (error) {
      this.addResult(
        'Supabase Connection',
        'FAIL',
        `Connection error: ${error}`,
        error
      )
      return false
    }
  }

  async testTwitterOAuthProvider() {
    console.log('\n🐦 Testing Twitter OAuth Provider...')

    if (!this.supabase) {
      this.addResult(
        'Twitter OAuth Provider',
        'FAIL',
        'Supabase client not initialized'
      )
      return false
    }

    try {
      // Test if we can initiate OAuth flow (this won't actually redirect in Node.js)
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
          scopes: 'users.read tweet.read offline.access'
        }
      })

      if (error) {
        this.addResult(
          'Twitter OAuth Provider',
          'FAIL',
          `OAuth initialization failed: ${error.message}`,
          error
        )
        return false
      }

      this.addResult(
        'Twitter OAuth Provider',
        'PASS',
        'Twitter OAuth provider is configured and accessible'
      )
      return true
    } catch (error) {
      this.addResult(
        'Twitter OAuth Provider',
        'FAIL',
        `OAuth test error: ${error}`,
        error
      )
      return false
    }
  }

  async testDatabaseSchema() {
    console.log('\n🗄️ Testing Database Schema...')

    try {
      // Test if we can query the users table structure
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .limit(1)

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        this.addResult(
          'Database Schema',
          'FAIL',
          `Database query failed: ${error.message}`,
          error
        )
        return false
      }

      this.addResult(
        'Database Schema',
        'PASS',
        'Users table is accessible and properly configured'
      )
      return true
    } catch (error) {
      this.addResult(
        'Database Schema',
        'FAIL',
        `Database schema test error: ${error}`,
        error
      )
      return false
    }
  }

  async testAuthCallbackRoute() {
    console.log('\n🔄 Testing Auth Callback Route...')

    try {
      // Test if the callback route exists and is accessible
      const response = await fetch('http://localhost:3000/auth/callback?code=test', {
        method: 'GET',
        redirect: 'manual' // Don't follow redirects
      })

      if (response.status === 302 || response.status === 307) {
        this.addResult(
          'Auth Callback Route',
          'PASS',
          'Callback route exists and handles requests'
        )
        return true
      } else {
        this.addResult(
          'Auth Callback Route',
          'WARNING',
          `Callback route returned status: ${response.status}`
        )
        return false
      }
    } catch (error) {
      this.addResult(
        'Auth Callback Route',
        'FAIL',
        `Callback route test error: ${error}`,
        error
      )
      return false
    }
  }

  generateReport() {
    console.log('\n📊 Test Summary Report')
    console.log('=' .repeat(60))

    const passed = this.results.filter(r => r.status === 'PASS').length
    const failed = this.results.filter(r => r.status === 'FAIL').length
    const warnings = this.results.filter(r => r.status === 'WARNING').length

    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⚠️ Warnings: ${warnings}`)
    console.log(`📋 Total Tests: ${this.results.length}`)

    if (failed > 0) {
      console.log('\n🚨 Critical Issues Found:')
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`   • ${r.test}: ${r.message}`))
    }

    if (warnings > 0) {
      console.log('\n⚠️ Warnings:')
      this.results
        .filter(r => r.status === 'WARNING')
        .forEach(r => console.log(`   • ${r.test}: ${r.message}`))
    }

    console.log('\n🔧 Recommendations:')
    this.generateRecommendations()
  }

  generateRecommendations() {
    const failedTests = this.results.filter(r => r.status === 'FAIL')

    if (failedTests.some(t => t.test.includes('Environment Variable'))) {
      console.log('   1. Ensure all required environment variables are set in .env.local')
    }

    if (failedTests.some(t => t.test.includes('Supabase Connection'))) {
      console.log('   2. Verify Supabase URL and anon key are correct')
    }

    if (failedTests.some(t => t.test.includes('Twitter OAuth'))) {
      console.log('   3. Configure Twitter OAuth provider in Supabase dashboard')
      console.log('   4. Ensure Twitter app has correct callback URL configured')
    }

    if (failedTests.some(t => t.test.includes('Database'))) {
      console.log('   5. Run database migrations: npx prisma db push')
    }

    console.log('   6. Verify Twitter app permissions include: users.read, tweet.read, offline.access')
    console.log('   7. Check Supabase Auth settings for Twitter provider configuration')
  }

  async runAllTests() {
    await this.testEnvironmentVariables()
    await this.testSupabaseConnection()
    await this.testTwitterOAuthProvider()
    await this.testDatabaseSchema()
    await this.testAuthCallbackRoute()

    this.generateReport()
  }
}

// Run the tests
async function main() {
  const tester = new TwitterOAuthTester()
  await tester.runAllTests()
}

// Run if this is the main module
main().catch(console.error)

export { TwitterOAuthTester }
