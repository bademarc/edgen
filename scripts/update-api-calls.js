#!/usr/bin/env node

/**
 * Script to identify and help update frontend components that still use direct API calls
 * This script scans for fetch() calls to /api/* endpoints and suggests replacements
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Patterns to search for
const API_PATTERNS = [
  /fetch\s*\(\s*['"`]\/api\/([^'"`]+)['"`]/g,
  /fetch\s*\(\s*`\/api\/([^`]+)`/g,
  /axios\.(get|post|put|delete|patch)\s*\(\s*['"`]\/api\/([^'"`]+)['"`]/g,
  /\$\{.*\}\/api\/([^'"`\s]+)/g
]

// API endpoint mappings to new API client methods
const API_MAPPINGS = {
  'auth/validate-credentials': 'api.auth.validateCredentials(credentials)',
  'auth/sync-user': 'api.auth.syncUser(userData)',
  'auth/debug': 'api.auth.debug()',
  'auth/test': 'api.auth.test()',
  'tweets': 'api.tweets.submit(tweetData)',
  'tweets/preview': 'api.tweets.preview(tweetData)',
  'tweets/user-history': 'api.tweets.getUserHistory(userId)',
  'user/stats': 'api.user.getStats(userId)',
  'user/profile': 'api.user.getProfile(userId)',
  'leaderboard': 'api.leaderboard.getLeaderboard(params)',
  'recent-tweets': 'api.recentTweets.getRecentTweets(params)',
  'content/validate': 'api.content.validate(data)',
  'edgen-helper/chat': 'api.edgenHelper.chat(data)',
  'x-api/login': 'api.xApi.verifyLogin(data)',
  'x-api/tweet': 'api.xApi.fetchTweet(data)',
  'monitoring/health': 'api.monitoring.health()',
  'debug/validate-points': 'api.debug.validatePoints(userId)',
  'debug/points-system': 'api.debug.pointsSystem()',
  'quests': 'api.quests.getQuests()',
  'health': 'api.healthCheck()'
}

function scanDirectory(dir, results = []) {
  const files = fs.readdirSync(dir)
  
  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      // Skip node_modules and .next directories
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
        scanDirectory(filePath, results)
      }
    } else if (file.match(/\.(tsx?|jsx?)$/)) {
      scanFile(filePath, results)
    }
  }
  
  return results
}

function scanFile(filePath, results) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const relativePath = path.relative(process.cwd(), filePath)
    
    // Check for API calls
    const apiCalls = []
    
    API_PATTERNS.forEach(pattern => {
      let match
      while ((match = pattern.exec(content)) !== null) {
        const endpoint = match[1] || match[2]
        const fullMatch = match[0]
        const lineNumber = content.substring(0, match.index).split('\n').length
        
        apiCalls.push({
          endpoint,
          fullMatch,
          lineNumber,
          suggestion: API_MAPPINGS[endpoint] || `api.${endpoint.replace(/\//g, '.')}`
        })
      }
    })
    
    if (apiCalls.length > 0) {
      results.push({
        file: relativePath,
        calls: apiCalls
      })
    }
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}:`, error.message)
  }
}

function generateReport(results) {
  console.log('🔍 API Call Migration Report\n')
  console.log('=' .repeat(60))
  
  if (results.length === 0) {
    console.log('✅ No direct API calls found! Migration appears complete.')
    return
  }
  
  let totalCalls = 0
  
  results.forEach(({ file, calls }) => {
    console.log(`\n📄 ${file}`)
    console.log('-'.repeat(40))
    
    calls.forEach(({ endpoint, fullMatch, lineNumber, suggestion }) => {
      totalCalls++
      console.log(`  Line ${lineNumber}: ${fullMatch}`)
      console.log(`  📝 Suggested replacement: ${suggestion}`)
      console.log('')
    })
  })
  
  console.log('=' .repeat(60))
  console.log(`📊 Summary: Found ${totalCalls} API calls in ${results.length} files`)
  console.log('\n🔧 To fix these issues:')
  console.log('1. Import the API client: import api from "@/lib/api-client"')
  console.log('2. Replace fetch() calls with the suggested API client methods')
  console.log('3. Update error handling to use APIError class')
  console.log('4. Test the updated components')
}

function generateFixScript(results) {
  if (results.length === 0) return
  
  const scriptPath = path.join(__dirname, 'fix-api-calls.sh')
  let script = '#!/bin/bash\n\n'
  script += '# Auto-generated script to help fix API calls\n'
  script += '# Review each change before applying!\n\n'
  
  results.forEach(({ file }) => {
    script += `echo "🔧 Fixing ${file}..."\n`
    script += `# TODO: Manually update ${file}\n`
    script += `code "${file}"\n\n`
  })
  
  fs.writeFileSync(scriptPath, script)
  fs.chmodSync(scriptPath, '755')
  
  console.log(`\n📝 Generated fix script: ${scriptPath}`)
  console.log('Run it with: ./scripts/fix-api-calls.sh')
}

// Main execution
function main() {
  console.log('🚀 Scanning for API calls that need migration...\n')
  
  const srcDir = path.join(process.cwd(), 'src')
  
  if (!fs.existsSync(srcDir)) {
    console.error('❌ src directory not found. Run this script from the project root.')
    process.exit(1)
  }
  
  const results = scanDirectory(srcDir)
  generateReport(results)
  generateFixScript(results)
  
  if (results.length > 0) {
    console.log('\n🎯 Next steps:')
    console.log('1. Review the files listed above')
    console.log('2. Replace direct API calls with the API client')
    console.log('3. Test the updated functionality')
    console.log('4. Run this script again to verify completion')
  } else {
    console.log('\n🎉 Migration complete! All API calls are using the backend.')
  }
}

main()
