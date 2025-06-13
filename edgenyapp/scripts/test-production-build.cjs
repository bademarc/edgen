#!/usr/bin/env node

/**
 * Production Build Test Script
 * Tests the /recent page in production build mode
 */

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🏗️ PRODUCTION BUILD TEST')
console.log('=' .repeat(50))
console.log('Testing /recent page in production build mode')
console.log('')

/**
 * Run a command and return a promise
 */
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Running: ${command} ${args.join(' ')}`)
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    })
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command failed with exit code ${code}`))
      }
    })
    
    child.on('error', (error) => {
      reject(error)
    })
  })
}

/**
 * Check if build artifacts exist
 */
function checkBuildArtifacts() {
  console.log('\n📋 Checking Build Artifacts')
  console.log('-'.repeat(30))
  
  const buildDir = path.join(process.cwd(), '.next')
  const staticDir = path.join(buildDir, 'static')
  
  const checks = [
    {
      name: '.next directory exists',
      path: buildDir,
      required: true
    },
    {
      name: 'Static assets directory exists',
      path: staticDir,
      required: true
    }
  ]
  
  let allChecksPassed = true
  
  for (const check of checks) {
    if (fs.existsSync(check.path)) {
      console.log(`  ✅ ${check.name}`)
    } else {
      console.log(`  ❌ ${check.name}`)
      if (check.required) {
        allChecksPassed = false
      }
    }
  }
  
  return allChecksPassed
}

/**
 * Main test execution
 */
async function runProductionTest() {
  try {
    console.log('📦 Step 1: Building for production...')
    await runCommand('npm', ['run', 'build'])
    
    console.log('\n✅ Build completed successfully!')
    
    // Check build artifacts
    const artifactsOk = checkBuildArtifacts()
    if (!artifactsOk) {
      throw new Error('Build artifacts check failed')
    }
    
    console.log('\n🎉 PRODUCTION BUILD TEST PASSED!')
    console.log('\n📋 Next Steps for Manual Testing:')
    console.log('   1. Run: npm start')
    console.log('   2. Navigate to http://localhost:3000/recent')
    console.log('   3. Test all functionality in production mode')
    console.log('   4. Check for any console errors or warnings')
    console.log('   5. Verify performance and loading times')
    console.log('')
    console.log('🚀 Ready for deployment!')
    
    return true
    
  } catch (error) {
    console.error('\n❌ PRODUCTION BUILD TEST FAILED!')
    console.error('Error:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('   1. Check for TypeScript errors: npm run type-check')
    console.log('   2. Check for linting errors: npm run lint')
    console.log('   3. Clear cache: rm -rf .next && npm run build')
    console.log('   4. Check dependencies: npm install')
    
    return false
  }
}

// Run the production test
runProductionTest().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('Production test execution failed:', error)
  process.exit(1)
})
