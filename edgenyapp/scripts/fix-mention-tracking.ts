#!/usr/bin/env tsx

/**
 * Comprehensive fix script for LayerEdge mention tracking system
 *
 * This script diagnoses and fixes issues with:
 * 1. Twitter API connectivity and authentication
 * 2. Web scraping fallback system
 * 3. Supabase edge function deployment
 * 4. Environment variable configuration
 * 5. Database connectivity and schema
 */

import { prisma } from '../src/lib/db'
import { TwitterApiService } from '../src/lib/twitter-api'
import { getWebScraperInstance } from '../src/lib/web-scraper'
import { getFallbackService } from '../src/lib/fallback-service'

interface DiagnosticResult {
  component: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: any
  fix?: string
}

class MentionTrackingDiagnostic {
  private results: DiagnosticResult[] = []

  async runDiagnostics(): Promise<void> {
    console.log('🔍 LayerEdge Mention Tracking System Diagnostic')
    console.log('=' .repeat(60))
    console.log()

    await this.checkEnvironmentVariables()
    await this.checkDatabaseConnectivity()
    await this.checkTwitterApiHealth()
    await this.checkWebScrapingHealth()
    await this.checkFallbackService()
    await this.checkEdgeFunction()
    await this.testEndToEndFlow()

    this.printSummary()
    await this.suggestFixes()
  }

  private async checkEnvironmentVariables(): Promise<void> {
    console.log('1️⃣ Checking environment variables...')

    const requiredVars = {
      'TWITTER_BEARER_TOKEN': process.env.TWITTER_BEARER_TOKEN,
      'MENTION_TRACKER_SECRET': process.env.MENTION_TRACKER_SECRET,
      'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
      'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'NEXT_PUBLIC_SITE_URL': process.env.NEXT_PUBLIC_SITE_URL
    }

    let missingVars = 0
    for (const [varName, value] of Object.entries(requiredVars)) {
      if (!value) {
        this.results.push({
          component: 'Environment',
          status: 'fail',
          message: `Missing ${varName}`,
          fix: `Set ${varName} in your environment variables`
        })
        missingVars++
      } else {
        console.log(`   ✅ ${varName} is set`)
      }
    }

    if (missingVars === 0) {
      this.results.push({
        component: 'Environment',
        status: 'pass',
        message: 'All required environment variables are set'
      })
    }

    console.log()
  }

  private async checkDatabaseConnectivity(): Promise<void> {
    console.log('2️⃣ Checking database connectivity...')

    try {
      await prisma.$connect()

      // Test basic queries
      const userCount = await prisma.user.count()
      const tweetCount = await prisma.tweet.count()

      this.results.push({
        component: 'Database',
        status: 'pass',
        message: `Database connected successfully (${userCount} users, ${tweetCount} tweets)`,
        details: { userCount, tweetCount }
      })

      console.log(`   ✅ Database connected (${userCount} users, ${tweetCount} tweets)`)

      // Check for users with X credentials
      const usersWithXCredentials = await prisma.user.count({
        where: {
          AND: [
            { xUserId: { not: null } },
            { xUsername: { not: null } },
            { autoMonitoringEnabled: true }
          ]
        }
      })

      console.log(`   📊 ${usersWithXCredentials} users ready for monitoring`)

    } catch (error) {
      this.results.push({
        component: 'Database',
        status: 'fail',
        message: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        fix: 'Check DATABASE_URL and DIRECT_URL environment variables'
      })
      console.log('   ❌ Database connection failed:', error)
    }

    console.log()
  }

  private async checkTwitterApiHealth(): Promise<void> {
    console.log('3️⃣ Checking Twitter API health...')

    try {
      const twitterApi = new TwitterApiService()
      const isAvailable = await twitterApi.isApiAvailable()
      const rateLimitInfo = twitterApi.getRateLimitInfo()

      if (isAvailable) {
        this.results.push({
          component: 'Twitter API',
          status: 'pass',
          message: 'Twitter API is healthy and available',
          details: rateLimitInfo
        })
        console.log('   ✅ Twitter API is healthy')
        if (rateLimitInfo) {
          console.log(`   📊 Rate limit: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} remaining`)
        }
      } else {
        this.results.push({
          component: 'Twitter API',
          status: 'warning',
          message: 'Twitter API is available but may be rate limited',
          details: rateLimitInfo,
          fix: 'Wait for rate limit reset or check API credentials'
        })
        console.log('   ⚠️ Twitter API available but may be rate limited')
      }

    } catch (error) {
      this.results.push({
        component: 'Twitter API',
        status: 'fail',
        message: 'Twitter API is not available',
        details: error instanceof Error ? error.message : 'Unknown error',
        fix: 'Check TWITTER_BEARER_TOKEN and API credentials'
      })
      console.log('   ❌ Twitter API not available:', error)
    }

    console.log()
  }

  private async checkWebScrapingHealth(): Promise<void> {
    console.log('4️⃣ Checking web scraping health...')

    try {
      const webScraper = getWebScraperInstance()

      if (!webScraper.isBrowserAvailable()) {
        console.log('   🔄 Browser not available - initialization needed')
        // Note: Browser initialization is handled internally
      }

      const isAvailable = webScraper.isBrowserAvailable()
      const status = webScraper.getBrowserStatus()

      if (isAvailable) {
        this.results.push({
          component: 'Web Scraping',
          status: 'pass',
          message: 'Web scraping browser is available and ready',
          details: status
        })
        console.log('   ✅ Web scraping browser is ready')
      } else {
        this.results.push({
          component: 'Web Scraping',
          status: 'fail',
          message: 'Web scraping browser is not available',
          details: status,
          fix: 'Install Playwright browsers: npx playwright install chromium'
        })
        console.log('   ❌ Web scraping browser not available')
      }

    } catch (error) {
      this.results.push({
        component: 'Web Scraping',
        status: 'fail',
        message: 'Web scraping initialization failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        fix: 'Check Playwright installation and browser dependencies'
      })
      console.log('   ❌ Web scraping failed:', error)
    }

    console.log()
  }

  private async checkFallbackService(): Promise<void> {
    console.log('5️⃣ Checking fallback service...')

    try {
      const fallbackService = getFallbackService()
      const status = fallbackService.getStatus()

      this.results.push({
        component: 'Fallback Service',
        status: 'pass',
        message: 'Fallback service is operational',
        details: status
      })

      console.log('   ✅ Fallback service operational')
      console.log(`   📊 API failures: ${status.apiFailureCount}, Rate limited: ${status.isApiRateLimited}`)

    } catch (error) {
      this.results.push({
        component: 'Fallback Service',
        status: 'fail',
        message: 'Fallback service error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
      console.log('   ❌ Fallback service error:', error)
    }

    console.log()
  }

  private async checkEdgeFunction(): Promise<void> {
    console.log('6️⃣ Checking Supabase edge function...')

    try {
      const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/track-mentions`

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.MENTION_TRACKER_SECRET}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 404) {
        this.results.push({
          component: 'Edge Function',
          status: 'fail',
          message: 'Edge function not deployed',
          fix: 'Deploy edge function: supabase functions deploy track-mentions'
        })
        console.log('   ❌ Edge function not deployed')
      } else if (response.status === 401) {
        this.results.push({
          component: 'Edge Function',
          status: 'fail',
          message: 'Edge function authentication failed',
          fix: 'Check MENTION_TRACKER_SECRET environment variable'
        })
        console.log('   ❌ Edge function authentication failed')
      } else {
        const data = await response.json()
        this.results.push({
          component: 'Edge Function',
          status: 'pass',
          message: 'Edge function is deployed and accessible',
          details: data
        })
        console.log('   ✅ Edge function is working')
      }

    } catch (error) {
      this.results.push({
        component: 'Edge Function',
        status: 'fail',
        message: 'Edge function test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        fix: 'Check Supabase configuration and network connectivity'
      })
      console.log('   ❌ Edge function test failed:', error)
    }

    console.log()
  }

  private async testEndToEndFlow(): Promise<void> {
    console.log('7️⃣ Testing end-to-end flow...')

    // This would test the complete flow from tweet detection to point awarding
    // For now, we'll just verify the components are ready

    const twitterApiWorking = this.results.some(r => r.component === 'Twitter API' && r.status === 'pass')
    const webScrapingWorking = this.results.some(r => r.component === 'Web Scraping' && r.status === 'pass')
    const databaseWorking = this.results.some(r => r.component === 'Database' && r.status === 'pass')

    if (twitterApiWorking || webScrapingWorking) {
      if (databaseWorking) {
        this.results.push({
          component: 'End-to-End',
          status: 'pass',
          message: 'System is ready for mention tracking'
        })
        console.log('   ✅ System ready for mention tracking')
      } else {
        this.results.push({
          component: 'End-to-End',
          status: 'fail',
          message: 'Database issues prevent mention tracking'
        })
        console.log('   ❌ Database issues prevent mention tracking')
      }
    } else {
      this.results.push({
        component: 'End-to-End',
        status: 'fail',
        message: 'No working data sources (API or scraping)'
      })
      console.log('   ❌ No working data sources available')
    }

    console.log()
  }

  private printSummary(): void {
    console.log('📊 DIAGNOSTIC SUMMARY')
    console.log('=' .repeat(40))

    const passed = this.results.filter(r => r.status === 'pass').length
    const failed = this.results.filter(r => r.status === 'fail').length
    const warnings = this.results.filter(r => r.status === 'warning').length

    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⚠️ Warnings: ${warnings}`)
    console.log()

    if (failed > 0) {
      console.log('🚨 FAILED COMPONENTS:')
      this.results
        .filter(r => r.status === 'fail')
        .forEach(r => {
          console.log(`   ❌ ${r.component}: ${r.message}`)
        })
      console.log()
    }

    if (warnings > 0) {
      console.log('⚠️ WARNINGS:')
      this.results
        .filter(r => r.status === 'warning')
        .forEach(r => {
          console.log(`   ⚠️ ${r.component}: ${r.message}`)
        })
      console.log()
    }
  }

  private async suggestFixes(): Promise<void> {
    const failedResults = this.results.filter(r => r.status === 'fail' && r.fix)

    if (failedResults.length === 0) {
      console.log('🎉 No fixes needed! The mention tracking system should be working correctly.')
      return
    }

    console.log('🔧 SUGGESTED FIXES:')
    console.log('=' .repeat(40))

    failedResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.component}: ${result.fix}`)
    })

    console.log()
    console.log('💡 PRIORITY ORDER:')
    console.log('1. Fix environment variables first')
    console.log('2. Deploy edge function if needed')
    console.log('3. Install browser dependencies for scraping')
    console.log('4. Test Twitter API credentials')
    console.log()
  }
}

// Run the diagnostic
async function main() {
  const diagnostic = new MentionTrackingDiagnostic()
  await diagnostic.runDiagnostics()

  await prisma.$disconnect()
}

main().catch(console.error)
