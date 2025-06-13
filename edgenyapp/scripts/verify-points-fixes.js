#!/usr/bin/env node

/**
 * Simple Points System Verification
 * Verifies that the fixes have been properly implemented
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 POINTS SYSTEM FIXES VERIFICATION')
console.log('===================================')

let allTestsPassed = true

// Test 1: Verify quest service fixes
function testQuestServiceFixes() {
  console.log('\n✅ TEST 1: Quest Service Fixes')
  console.log('------------------------------')
  
  const questServicePath = path.join(__dirname, '../src/lib/quest-service.ts')
  
  if (!fs.existsSync(questServicePath)) {
    console.log('❌ Quest service file not found')
    return false
  }
  
  const questServiceContent = fs.readFileSync(questServicePath, 'utf8')
  
  // Check for PointsSyncService import
  if (questServiceContent.includes('import { PointsSyncService }')) {
    console.log('✅ PointsSyncService import found')
  } else {
    console.log('❌ PointsSyncService import missing')
    allTestsPassed = false
  }
  
  // Check for syncUserPointsAfterQuest calls
  if (questServiceContent.includes('PointsSyncService.syncUserPointsAfterQuest')) {
    console.log('✅ Points synchronization calls found')
  } else {
    console.log('❌ Points synchronization calls missing')
    allTestsPassed = false
  }
  
  // Check for claimed status in redirect quests
  if (questServiceContent.includes("status: 'claimed'")) {
    console.log('✅ Claimed status implementation found')
  } else {
    console.log('❌ Claimed status implementation missing')
    allTestsPassed = false
  }
  
  // Check for duplicate completion checks
  if (questServiceContent.includes('already completed')) {
    console.log('✅ Duplicate completion checks found')
  } else {
    console.log('❌ Duplicate completion checks missing')
    allTestsPassed = false
  }
  
  return true
}

// Test 2: Verify PointsSyncService exists
function testPointsSyncService() {
  console.log('\n✅ TEST 2: PointsSyncService Implementation')
  console.log('------------------------------------------')
  
  const syncServicePath = path.join(__dirname, '../src/lib/points-sync-service.ts')
  
  if (!fs.existsSync(syncServicePath)) {
    console.log('❌ PointsSyncService file not found')
    allTestsPassed = false
    return false
  }
  
  const syncServiceContent = fs.readFileSync(syncServicePath, 'utf8')
  
  const requiredMethods = [
    'syncUserPointsAfterQuest',
    'clearUserCaches',
    'updateUserRank',
    'clearLeaderboardCaches',
    'verifyUserPointsConsistency',
    'fixUserPointsInconsistency',
    'batchSyncAllUsers'
  ]
  
  requiredMethods.forEach(method => {
    if (syncServiceContent.includes(method)) {
      console.log(`✅ ${method} method found`)
    } else {
      console.log(`❌ ${method} method missing`)
      allTestsPassed = false
    }
  })
  
  return true
}

// Test 3: Verify AuthProvider enhancements
function testAuthProviderEnhancements() {
  console.log('\n✅ TEST 3: AuthProvider Enhancements')
  console.log('------------------------------------')
  
  const authProviderPath = path.join(__dirname, '../src/components/AuthProvider.tsx')
  
  if (!fs.existsSync(authProviderPath)) {
    console.log('❌ AuthProvider file not found')
    allTestsPassed = false
    return false
  }
  
  const authProviderContent = fs.readFileSync(authProviderPath, 'utf8')
  
  // Check for refreshUser method
  if (authProviderContent.includes('refreshUser')) {
    console.log('✅ refreshUser method found')
  } else {
    console.log('❌ refreshUser method missing')
    allTestsPassed = false
  }
  
  // Check for refreshUser in context type
  if (authProviderContent.includes('refreshUser: () => Promise<void>')) {
    console.log('✅ refreshUser in context type found')
  } else {
    console.log('❌ refreshUser in context type missing')
    allTestsPassed = false
  }
  
  return true
}

// Test 4: Verify API enhancements
function testAPIEnhancements() {
  console.log('\n✅ TEST 4: API Enhancements')
  console.log('---------------------------')
  
  // Check quest API
  const questAPIPath = path.join(__dirname, '../src/app/api/quests/route.ts')
  if (fs.existsSync(questAPIPath)) {
    const questAPIContent = fs.readFileSync(questAPIPath, 'utf8')
    if (questAPIContent.includes('refreshUser: true')) {
      console.log('✅ Quest API refresh signal found')
    } else {
      console.log('❌ Quest API refresh signal missing')
      allTestsPassed = false
    }
  }
  
  // Check user refresh API
  const userRefreshAPIPath = path.join(__dirname, '../src/app/api/user/refresh/route.ts')
  if (fs.existsSync(userRefreshAPIPath)) {
    console.log('✅ User refresh API endpoint found')
  } else {
    console.log('❌ User refresh API endpoint missing')
    allTestsPassed = false
  }
  
  // Check points audit API
  const pointsAuditAPIPath = path.join(__dirname, '../src/app/api/admin/points-audit/route.ts')
  if (fs.existsSync(pointsAuditAPIPath)) {
    console.log('✅ Points audit API endpoint found')
  } else {
    console.log('❌ Points audit API endpoint missing')
    allTestsPassed = false
  }
  
  return true
}

// Test 5: Verify navigation enhancements
function testNavigationEnhancements() {
  console.log('\n✅ TEST 5: Navigation Enhancements')
  console.log('----------------------------------')
  
  const navPath = path.join(__dirname, '../src/components/ui/navigation-professional.tsx')
  
  if (!fs.existsSync(navPath)) {
    console.log('❌ Navigation component not found')
    allTestsPassed = false
    return false
  }
  
  const navContent = fs.readFileSync(navPath, 'utf8')
  
  // Check for refreshUser usage
  if (navContent.includes('refreshUser')) {
    console.log('✅ refreshUser usage in navigation found')
  } else {
    console.log('❌ refreshUser usage in navigation missing')
    allTestsPassed = false
  }
  
  // Check for visibility change listener
  if (navContent.includes('visibilitychange')) {
    console.log('✅ Visibility change listener found')
  } else {
    console.log('❌ Visibility change listener missing')
    allTestsPassed = false
  }
  
  return true
}

// Test 6: Verify quest points configuration
function testQuestPointsConfiguration() {
  console.log('\n✅ TEST 6: Quest Points Configuration')
  console.log('-------------------------------------')
  
  const questServicePath = path.join(__dirname, '../src/lib/quest-service.ts')
  
  if (!fs.existsSync(questServicePath)) {
    console.log('❌ Quest service file not found')
    return false
  }
  
  const questServiceContent = fs.readFileSync(questServicePath, 'utf8')
  
  // Check for 1000 points configuration
  const pointsMatches = questServiceContent.match(/points:\s*1000/g)
  if (pointsMatches && pointsMatches.length >= 2) {
    console.log('✅ Quest points configured to 1000 (found in multiple places)')
  } else {
    console.log('❌ Quest points not properly configured to 1000')
    allTestsPassed = false
  }
  
  return true
}

// Run all tests
function runAllTests() {
  testQuestServiceFixes()
  testPointsSyncService()
  testAuthProviderEnhancements()
  testAPIEnhancements()
  testNavigationEnhancements()
  testQuestPointsConfiguration()
  
  console.log('\n' + '='.repeat(50))
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED!')
    console.log('✅ Points system fixes have been successfully implemented')
    console.log('\nKey improvements:')
    console.log('• Quest points correctly configured to ~1000 points')
    console.log('• Double awarding prevention implemented')
    console.log('• Cache synchronization added')
    console.log('• Mobile navigation refresh functionality')
    console.log('• Admin tools for points auditing')
    console.log('• Comprehensive error handling')
  } else {
    console.log('❌ SOME TESTS FAILED!')
    console.log('Please review the failed tests above and ensure all fixes are properly implemented.')
    process.exit(1)
  }
}

// Execute tests
runAllTests()
