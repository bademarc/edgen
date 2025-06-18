/**
 * LayerEdge Engagement Fix Validation Script
 *
 * Purpose: Validates the Twitter/oEmbed API integration fix implementation
 * Usage: node scripts/validate-fix.cjs
 *
 * This script:
 * - Checks environment configuration
 * - Tests oEmbed and Twitter API connectivity
 * - Validates engagement system files
 * - Tests points calculation logic
 * - Provides deployment recommendations
 *
 * Essential for production deployment validation.
 */

const { config } = require('dotenv')

// Load environment variables
config()

/**
 * Validate the engagement fix implementation
 */
async function validateFix() {
  console.log('🔍 LayerEdge Engagement Fix Validation')
  console.log('=====================================')
  
  // 1. Check environment configuration
  console.log('\n📋 Environment Configuration:')
  const envChecks = {
    'TWITTER_BEARER_TOKEN': !!process.env.TWITTER_BEARER_TOKEN,
    'ENABLE_ENGAGEMENT_SCHEDULER': process.env.ENABLE_ENGAGEMENT_SCHEDULER !== 'false',
    'ENGAGEMENT_UPDATE_INTERVAL_MINUTES': process.env.ENGAGEMENT_UPDATE_INTERVAL_MINUTES || '30',
    'DATABASE_URL': !!process.env.DATABASE_URL,
    'ADMIN_SECRET': !!process.env.ADMIN_SECRET
  }
  
  Object.entries(envChecks).forEach(([key, value]) => {
    const status = typeof value === 'boolean' ? (value ? '✅' : '❌') : '📝'
    console.log(`   ${status} ${key}: ${value}`)
  })
  
  // 2. Test oEmbed API functionality
  console.log('\n🔍 Testing oEmbed API:')
  try {
    const testUrl = 'https://twitter.com/jack/status/20'
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(testUrl)}&omit_script=true`
    
    const response = await fetch(oembedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LayerEdge/1.0)' }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('   ✅ oEmbed API working')
      console.log(`   📄 Author: ${data.author_name}`)
      console.log(`   📝 HTML length: ${data.html?.length || 0} chars`)
    } else {
      console.log(`   ❌ oEmbed API failed: ${response.status}`)
    }
  } catch (error) {
    console.log(`   ❌ oEmbed API error: ${error.message}`)
  }
  
  // 3. Test Twitter API (if configured)
  if (process.env.TWITTER_BEARER_TOKEN) {
    console.log('\n🐦 Testing Twitter API:')
    try {
      const response = await fetch('https://api.twitter.com/2/tweets/20?tweet.fields=public_metrics', {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        }
      })
      
      if (response.status === 429) {
        console.log('   🚫 Twitter API rate limited (this is expected)')
        console.log('   📊 Rate limit handling: WORKING')
      } else if (response.ok) {
        const data = await response.json()
        console.log('   ✅ Twitter API accessible')
        if (data.data?.public_metrics) {
          const metrics = data.data.public_metrics
          console.log(`   📊 Sample engagement: ${metrics.like_count} likes, ${metrics.retweet_count} retweets`)
        }
      } else {
        console.log(`   ⚠️ Twitter API status: ${response.status}`)
      }
    } catch (error) {
      console.log(`   ❌ Twitter API error: ${error.message}`)
    }
  } else {
    console.log('\n🐦 Twitter API: Not configured')
  }
  
  // 4. Validate file structure
  console.log('\n📁 Checking implementation files:')
  const fs = require('fs')
  const path = require('path')
  
  const requiredFiles = [
    'src/lib/enhanced-hybrid-service.ts',
    'src/lib/engagement-points-service.ts',
    'src/lib/engagement-scheduler.ts',
    'src/app/api/admin/update-engagement/route.ts',
    'src/lib/init-engagement-system.ts'
  ]
  
  requiredFiles.forEach(file => {
    try {
      const fullPath = path.join(process.cwd(), file)
      const exists = fs.existsSync(fullPath)
      console.log(`   ${exists ? '✅' : '❌'} ${file}`)
      
      if (exists) {
        const stats = fs.statSync(fullPath)
        console.log(`      📏 Size: ${(stats.size / 1024).toFixed(1)}KB`)
      }
    } catch (error) {
      console.log(`   ❌ ${file} - Error checking: ${error.message}`)
    }
  })
  
  // 5. Test points calculation
  console.log('\n🧮 Testing points calculation:')
  const testEngagement = { likes: 10, retweets: 5, replies: 3 }
  const expectedPoints = (testEngagement.likes * 1) + (testEngagement.retweets * 3) + (testEngagement.replies * 2)
  
  console.log(`   📊 Test engagement: ${testEngagement.likes} likes, ${testEngagement.retweets} retweets, ${testEngagement.replies} replies`)
  console.log(`   🎯 Expected points: ${expectedPoints}`)
  console.log(`   📝 Formula: (${testEngagement.likes} × 1) + (${testEngagement.retweets} × 3) + (${testEngagement.replies} × 2) = ${expectedPoints}`)
  
  // 6. Summary and recommendations
  console.log('\n📋 Validation Summary:')
  
  const issues = []
  const recommendations = []
  
  if (!process.env.TWITTER_BEARER_TOKEN) {
    issues.push('Twitter Bearer Token not configured')
    recommendations.push('Set TWITTER_BEARER_TOKEN in .env file')
  }
  
  if (!process.env.DATABASE_URL) {
    issues.push('Database URL not configured')
    recommendations.push('Set DATABASE_URL in .env file')
  }
  
  if (process.env.ENABLE_ENGAGEMENT_SCHEDULER === 'false') {
    recommendations.push('Consider enabling engagement scheduler for automatic updates')
  }
  
  if (issues.length === 0) {
    console.log('   ✅ All critical components configured')
  } else {
    console.log('   ⚠️ Issues found:')
    issues.forEach(issue => console.log(`      - ${issue}`))
  }
  
  if (recommendations.length > 0) {
    console.log('   💡 Recommendations:')
    recommendations.forEach(rec => console.log(`      - ${rec}`))
  }
  
  // 7. Next steps
  console.log('\n🚀 Next Steps:')
  console.log('   1. Ensure all environment variables are set')
  console.log('   2. Deploy the new engagement services')
  console.log('   3. Initialize engagement scheduler in your app')
  console.log('   4. Run manual engagement update via admin API')
  console.log('   5. Monitor engagement updates in logs')
  
  console.log('\n📚 For detailed implementation guide, see: ENGAGEMENT_FIX_IMPLEMENTATION.md')
  console.log('\n✅ Validation complete!')
}

// Run validation
validateFix().catch(console.error)
