#!/usr/bin/env node

/**
 * Debug script to analyze Twitter Bearer Token format
 */

import dotenv from 'dotenv'
dotenv.config()

function debugTwitterToken() {
  console.log('🔍 Twitter Bearer Token Debug Analysis...\n')

  const bearerToken = process.env.TWITTER_BEARER_TOKEN
  
  if (!bearerToken) {
    console.error('❌ TWITTER_BEARER_TOKEN not found in environment variables')
    process.exit(1)
  }

  console.log('📊 Token Analysis:')
  console.log(`   Length: ${bearerToken.length} characters`)
  console.log(`   First 30 chars: ${bearerToken.substring(0, 30)}...`)
  console.log(`   Last 10 chars: ...${bearerToken.substring(bearerToken.length - 10)}`)
  console.log(`   Contains %: ${bearerToken.includes('%')}`)
  console.log(`   Contains =: ${bearerToken.includes('=') ? 'Yes (count: ' + (bearerToken.match(/=/g) || []).length + ')' : 'No'}`)
  console.log(`   Starts with AAAA: ${bearerToken.startsWith('AAAAAAAAAAAAAAAAAAAAAA')}`)
  
  // Check if it's URL encoded
  if (bearerToken.includes('%')) {
    console.log('\n🔧 URL Decoding Analysis:')
    try {
      const decoded = decodeURIComponent(bearerToken)
      console.log(`   Decoded length: ${decoded.length} characters`)
      console.log(`   Decoded first 30: ${decoded.substring(0, 30)}...`)
      console.log(`   Decoded last 10: ...${decoded.substring(decoded.length - 10)}`)
      console.log(`   Decoded contains =: ${decoded.includes('=') ? 'Yes (count: ' + (decoded.match(/=/g) || []).length + ')' : 'No'}`)
    } catch (error) {
      console.log(`   ❌ URL decode error: ${error.message}`)
    }
  }
  
  // Check for multiple concatenated tokens
  console.log('\n🔍 Token Structure Analysis:')
  const equalSigns = bearerToken.match(/=/g) || []
  console.log(`   Number of = signs: ${equalSigns.length}`)
  
  if (equalSigns.length > 2) {
    console.log('   ⚠️ Multiple = signs detected - might be concatenated tokens')
    
    // Try to split on = and analyze parts
    const parts = bearerToken.split('=')
    console.log(`   Number of parts when split on =: ${parts.length}`)
    
    parts.forEach((part, index) => {
      if (part.length > 10) {
        console.log(`   Part ${index + 1}: ${part.substring(0, 20)}... (${part.length} chars)`)
      }
    })
  }
  
  // Suggest fixes
  console.log('\n💡 Recommendations:')
  
  if (bearerToken.includes('%')) {
    console.log('   1. Token appears to be URL encoded - this is correct for .env files')
  }
  
  if (equalSigns.length > 2) {
    console.log('   2. ⚠️ Token might be corrupted or concatenated')
    console.log('   3. Consider getting a fresh Bearer Token from Twitter Developer Portal')
  }
  
  if (bearerToken.length < 100) {
    console.log('   4. ⚠️ Token seems short for a Bearer Token')
  }
  
  if (bearerToken.length > 150) {
    console.log('   5. ⚠️ Token seems long - might be concatenated')
  }
  
  console.log('\n🔗 Valid Bearer Token characteristics:')
  console.log('   - Should start with "AAAAAAAAAAAAAAAAAAAAAA"')
  console.log('   - Should be around 110-120 characters when URL encoded')
  console.log('   - Should have exactly 1-2 "=" signs for base64 padding')
  console.log('   - Should be URL encoded in .env files (%2B instead of +, %3D instead of =)')
}

debugTwitterToken()
