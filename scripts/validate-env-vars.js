#!/usr/bin/env node

/**
 * Environment Variables Validation for Koyeb Deployment
 */

const requiredEnvVars = {
  // Twitter API Configuration - UPDATED WITH NEW CREDENTIALS
  'TWITTER_BEARER_TOKEN': 'AAAAAAAAAAAAAAAAAAAAAKWj2QEAAAAAlVAUukDCs1%2B2%2FhUHXgO69Wr9imE%3DfVOxPgMgwNIaZ6g0aS3EWrSsJRfgYSotWagfZQCkwsv6sfkw8X%2FhO29FyDp64JGN8gDGTYYuo9NQ%3DYgGDDSNiLqss5w00qemo4HRin6TIqpO0raV9u4nEEJ71SsH2Qt',
  'TWITTER_CLIENT_ID': 'TXdBWXdPQWNMMjdpcHRGblIyaVg6MTpjaQ',
  'TWITTER_CLIENT_SECRET': 'nsN3ICJpwMHpfxYCAP6EG5hC4Q9jmaOGgiKq3v1XB8LTAm2-xJ',
  
  // Production URLs
  'NEXT_PUBLIC_SITE_URL': 'https://edgen.koyeb.app',
  'NEXTAUTH_URL': 'https://edgen.koyeb.app',
  
  // Redis Configuration
  'UPSTASH_REDIS_REST_URL': 'https://gusc1-national-lemur-31832.upstash.io',
  'UPSTASH_REDIS_REST_TOKEN': 'acd4b50ce33b4436b09f6f278848dfb7',
  'REDIS_HOST': 'gusc1-national-lemur-31832.upstash.io',
  'REDIS_PORT': '31832',
  'REDIS_PASSWORD': 'acd4b50ce33b4436b09f6f278848dfb7',
  
  // Database Configuration
  'DATABASE_URL': 'postgres://postgres.bzqayhnlogpaxfcmmrlq:d234A879a1%23@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=3',
  'DIRECT_URL': 'postgres://postgres.bzqayhnlogpaxfcmmrlq:d234A879a1%23@aws-0-eu-north-1.pooler.supabase.com:5432/postgres',
  
  // Supabase Configuration
  'NEXT_PUBLIC_SUPABASE_URL': 'https://bzqayhnlogpaxfcmmrlq.supabase.co',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6cWF5aG5sb2dwYXhmY21tcmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMTk5MzgsImV4cCI6MjA2Mzc5NTkzOH0.Axa-qsNiIRoEGG18760uWNsxMrhNOV648snajCNenjU',
  'SUPABASE_SERVICE_ROLE_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6cWF5aG5sb2dwYXhmY21tcmxxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODIxOTkzOCwiZXhwIjoyMDYzNzk1OTM4fQ.El521R-8GXuyULGE6uj5U_Ci3DCISkPWuwvfOEQnBtQ',
  
  // Security
  'NEXTAUTH_SECRET': 'layeredge-nextauth-secret-2024-production',
  'TOKEN_ENCRYPTION_KEY': 'layeredge-encryption-key-32chars',
  
  // Additional Configuration
  'LAYEREDGE_COMMUNITY_URL': 'https://x.com/i/communities/1890107751621357663',
  'NODE_ENV': 'production',
  'PORT': '3000',
  'HOSTNAME': '0.0.0.0'
}

console.log('🔍 Environment Variables Validation for Koyeb')
console.log('=' .repeat(60))

let allValid = true
const issues = []

for (const [key, expectedValue] of Object.entries(requiredEnvVars)) {
  const currentValue = process.env[key]
  
  if (!currentValue) {
    console.log(`❌ MISSING: ${key}`)
    issues.push(`Add: ${key}=${expectedValue}`)
    allValid = false
  } else if (currentValue !== expectedValue) {
    console.log(`⚠️  MISMATCH: ${key}`)
    console.log(`   Current: ${currentValue.substring(0, 50)}...`)
    console.log(`   Expected: ${expectedValue.substring(0, 50)}...`)
    issues.push(`Update: ${key}=${expectedValue}`)
    allValid = false
  } else {
    console.log(`✅ VALID: ${key}`)
  }
}

if (allValid) {
  console.log('\n🎉 All environment variables are correctly configured!')
} else {
  console.log('\n❌ Environment variable issues found:')
  issues.forEach(issue => console.log(`   - ${issue}`))
  console.log('\n📋 Add these to Koyeb Environment Variables:')
  issues.forEach(issue => console.log(issue))
}

process.exit(allValid ? 0 : 1)
