#!/usr/bin/env node
/**
 * Deployment Readiness Verification Script
 * Verifies that package-lock.json is synchronized and build is ready for Koyeb
 */

const fs = require('fs')
const { execSync } = require('child_process')

async function verifyPackageLockSync() {
  console.log('🔍 PACKAGE-LOCK.JSON SYNCHRONIZATION CHECK')
  console.log('─'.repeat(50))
  
  try {
    // Check if package-lock.json exists
    if (!fs.existsSync('package-lock.json')) {
      console.log('❌ package-lock.json does not exist')
      return false
    }
    
    console.log('✅ package-lock.json exists')
    
    // Read package-lock.json
    const lockFile = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'))
    
    // Check for critical dependencies
    const criticalDeps = [
      '@radix-ui/react-scroll-area',
      'twitter-api-v2',
      'framer-motion',
      'lucide-react'
    ]
    
    console.log('\n📦 Checking critical dependencies in lock file:')
    let allFound = true
    
    for (const dep of criticalDeps) {
      if (lockFile.packages && lockFile.packages[`node_modules/${dep}`]) {
        const version = lockFile.packages[`node_modules/${dep}`].version
        console.log(`✅ ${dep}: ${version}`)
      } else {
        console.log(`❌ ${dep}: NOT FOUND`)
        allFound = false
      }
    }
    
    if (allFound) {
      console.log('\n✅ All critical dependencies found in package-lock.json')
      return true
    } else {
      console.log('\n❌ Some critical dependencies missing from package-lock.json')
      return false
    }
  } catch (error) {
    console.log(`❌ Error checking package-lock.json: ${error.message}`)
    return false
  }
}

async function testNpmCi() {
  console.log('\n🧪 NPM CI SYNCHRONIZATION TEST')
  console.log('─'.repeat(50))
  
  try {
    console.log('Testing npm ci --dry-run...')
    
    // Test npm ci in dry-run mode
    execSync('npm ci --dry-run', { stdio: 'pipe' })
    
    console.log('✅ npm ci dry-run successful - package files are synchronized')
    return true
  } catch (error) {
    console.log('❌ npm ci dry-run failed - package files are NOT synchronized')
    console.log(`Error: ${error.message}`)
    return false
  }
}

async function verifyEdgenHelperDeps() {
  console.log('\n🤖 EDGEN HELPER DEPENDENCIES CHECK')
  console.log('─'.repeat(50))
  
  try {
    // Check if Edgen Helper files exist
    const edgenFiles = [
      'src/lib/ionet-api-service.ts',
      'src/components/edgen-helper-chatbot.tsx',
      'src/components/ui/scroll-area.tsx',
      'src/app/api/edgen-helper/chat/route.ts'
    ]
    
    console.log('Checking Edgen Helper component files:')
    let allFilesExist = true
    
    for (const file of edgenFiles) {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file}`)
      } else {
        console.log(`❌ ${file}: MISSING`)
        allFilesExist = false
      }
    }
    
    if (allFilesExist) {
      console.log('\n✅ All Edgen Helper files present')
      return true
    } else {
      console.log('\n❌ Some Edgen Helper files missing')
      return false
    }
  } catch (error) {
    console.log(`❌ Error checking Edgen Helper files: ${error.message}`)
    return false
  }
}

async function testTypeScriptCompilation() {
  console.log('\n📝 TYPESCRIPT COMPILATION TEST')
  console.log('─'.repeat(50))
  
  try {
    console.log('Testing TypeScript compilation...')
    
    // Test TypeScript compilation
    execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' })
    
    console.log('✅ TypeScript compilation successful')
    return true
  } catch (error) {
    console.log('❌ TypeScript compilation failed')
    console.log(`Error: ${error.message}`)
    return false
  }
}

async function generateDeploymentReport() {
  console.log('📋 KOYEB DEPLOYMENT READINESS REPORT')
  console.log('=' .repeat(60))
  
  const results = {
    packageLockSync: await verifyPackageLockSync(),
    npmCiTest: await testNpmCi(),
    edgenHelperDeps: await verifyEdgenHelperDeps(),
    typeScriptCompilation: await testTypeScriptCompilation()
  }
  
  console.log('\n📊 DEPLOYMENT READINESS SUMMARY')
  console.log('=' .repeat(60))
  
  console.log('🔧 Package Management:')
  console.log(`   ✅ Package Lock Synchronized: ${results.packageLockSync ? 'YES' : 'NO'}`)
  console.log(`   ✅ npm ci Test: ${results.npmCiTest ? 'PASSED' : 'FAILED'}`)
  
  console.log('\n🤖 Edgen Helper Chatbot:')
  console.log(`   ✅ Dependencies Available: ${results.edgenHelperDeps ? 'YES' : 'NO'}`)
  console.log(`   ✅ TypeScript Compilation: ${results.typeScriptCompilation ? 'PASSED' : 'FAILED'}`)
  
  const allPassed = Object.values(results).every(Boolean)
  
  if (allPassed) {
    console.log('\n🎉 DEPLOYMENT READY!')
    console.log('✅ package-lock.json is synchronized with package.json')
    console.log('✅ @radix-ui/react-scroll-area dependency resolved')
    console.log('✅ All Edgen Helper dependencies available')
    console.log('✅ TypeScript compilation working')
    console.log('✅ Ready for Koyeb deployment')
    console.log('')
    console.log('🚀 NEXT STEPS:')
    console.log('1. Commit the updated package-lock.json file')
    console.log('2. Push changes to trigger Koyeb deployment')
    console.log('3. Monitor deployment logs')
    console.log('4. Test Edgen Helper chatbot after deployment')
  } else {
    console.log('\n⚠️ DEPLOYMENT NOT READY')
    console.log('❌ Some checks failed - review the issues above')
    console.log('')
    console.log('🔧 FIX STEPS:')
    
    if (!results.packageLockSync) {
      console.log('• Run: npm install to regenerate package-lock.json')
    }
    if (!results.npmCiTest) {
      console.log('• Fix package.json and package-lock.json synchronization')
    }
    if (!results.edgenHelperDeps) {
      console.log('• Ensure all Edgen Helper files are present')
    }
    if (!results.typeScriptCompilation) {
      console.log('• Fix TypeScript compilation errors')
    }
  }
  
  return allPassed
}

// Main execution
async function main() {
  console.log('🚀 LayerEdge Koyeb Deployment Readiness Check')
  console.log('🤖 Verifying Edgen Helper AI Chatbot Dependencies')
  console.log('📦 Checking package-lock.json Synchronization')
  console.log('')
  
  const success = await generateDeploymentReport()
  
  console.log('\n🏁 Deployment readiness check completed!')
  process.exit(success ? 0 : 1)
}

// Handle command line execution
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Deployment readiness check failed:', error)
    process.exit(1)
  })
}
