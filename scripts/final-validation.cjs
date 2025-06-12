#!/usr/bin/env node

/**
 * Final Validation Script
 * Runs all tests in sequence to validate the complete system
 */

const { spawn } = require('child_process')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config()

async function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Running: ${command} ${args.join(' ')}`)
    
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    })

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${command} completed successfully\n`)
        resolve(true)
      } else {
        console.log(`❌ ${command} failed with code ${code}\n`)
        resolve(false)
      }
    })

    process.on('error', (error) => {
      console.error(`❌ ${command} error:`, error.message)
      resolve(false)
    })
  })
}

async function finalValidation() {
  console.log('🚀 Final System Validation\n')
  console.log('Running comprehensive test suite...\n')

  const testResults = []
  let allTestsPassed = true

  // Test 1: Database Schema Validation
  console.log('1️⃣ Database Schema Validation')
  console.log('=' .repeat(50))
  const schemaResult = await runCommand('npm', ['run', 'validate:schema'])
  testResults.push({ test: 'Database Schema', passed: schemaResult })
  if (!schemaResult) allTestsPassed = false

  // Test 2: Simplified Services Testing
  console.log('2️⃣ Simplified Services Testing')
  console.log('=' .repeat(50))
  const simplifiedResult = await runCommand('npm', ['run', 'test:simplified'])
  testResults.push({ test: 'Simplified Services', passed: simplifiedResult })
  if (!simplifiedResult) allTestsPassed = false

  // Test 3: Tweet Verification Logic
  console.log('3️⃣ Tweet Verification Logic')
  console.log('=' .repeat(50))
  const verificationResult = await runCommand('node', ['test-verification-simple.cjs'])
  testResults.push({ test: 'Tweet Verification', passed: verificationResult })
  if (!verificationResult) allTestsPassed = false

  // Test 4: End-to-End API Testing
  console.log('4️⃣ End-to-End API Testing')
  console.log('=' .repeat(50))
  const e2eResult = await runCommand('npm', ['run', 'test:e2e'])
  testResults.push({ test: 'End-to-End APIs', passed: e2eResult })
  if (!e2eResult) allTestsPassed = false

  // Summary
  console.log('📋 Final Validation Summary')
  console.log('=' .repeat(50))
  
  testResults.forEach(result => {
    const status = result.passed ? '✅' : '❌'
    console.log(`${status} ${result.test}`)
  })

  const passedTests = testResults.filter(r => r.passed).length
  const totalTests = testResults.length

  console.log(`\n📊 Overall Results: ${passedTests}/${totalTests} test suites passed`)

  if (allTestsPassed) {
    console.log('\n🎉 FINAL VALIDATION SUCCESSFUL!')
    console.log('=' .repeat(50))
    console.log('✅ Database schema validated')
    console.log('✅ Simplified services operational')
    console.log('✅ Tweet verification working')
    console.log('✅ End-to-end APIs functional')
    console.log('✅ Authentication and security enforced')
    console.log('✅ Error handling and recovery implemented')
    console.log('\n🚀 System is ready for production use!')
    console.log('\n📋 Next Steps:')
    console.log('1. Start the development server: npm run dev')
    console.log('2. Login with Twitter/X account')
    console.log('3. Submit tweets with @layeredge mentions')
    console.log('4. Verify points and leaderboard updates')
    console.log('5. Monitor system health at /api/health')
  } else {
    console.log('\n❌ FINAL VALIDATION FAILED!')
    console.log('=' .repeat(50))
    console.log('Some test suites failed. Please review the output above.')
    console.log('Check the individual test results and fix any issues.')
  }

  return allTestsPassed
}

// Run the final validation
finalValidation()
  .then(success => {
    if (success) {
      console.log('\n🎉 All systems validated successfully!')
      process.exit(0)
    } else {
      console.log('\n❌ System validation failed.')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('\n💥 Final validation script failed:', error)
    process.exit(1)
  })
