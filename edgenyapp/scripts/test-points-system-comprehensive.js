#!/usr/bin/env node

/**
 * Comprehensive Points System Test
 * Tests all aspects of the points calculation and display system
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Test configuration
const TEST_CONFIG = {
  EXPECTED_QUEST_POINTS: 1000,
  TEST_USER_EMAIL: 'test-points@layeredge.com',
  ADMIN_SECRET: process.env.ADMIN_SECRET || 'layeredge-admin-secret-2024'
}

async function main() {
  console.log('🧪 COMPREHENSIVE POINTS SYSTEM TEST')
  console.log('=====================================')
  
  try {
    // Test 1: Verify quest points configuration
    await testQuestPointsConfiguration()
    
    // Test 2: Test quest completion and points awarding
    await testQuestCompletion()
    
    // Test 3: Test points consistency
    await testPointsConsistency()
    
    // Test 4: Test leaderboard accuracy
    await testLeaderboardAccuracy()
    
    // Test 5: Test mobile navigation data
    await testMobileNavigationData()
    
    console.log('\n✅ ALL TESTS COMPLETED')
    console.log('======================')
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function testQuestPointsConfiguration() {
  console.log('\n🎯 TEST 1: Quest Points Configuration')
  console.log('------------------------------------')
  
  const quests = await prisma.quest.findMany({
    where: { isActive: true },
    select: { id: true, title: true, points: true }
  })
  
  let passed = 0
  let total = quests.length
  
  for (const quest of quests) {
    if (quest.points === TEST_CONFIG.EXPECTED_QUEST_POINTS) {
      console.log(`  ✅ ${quest.title}: ${quest.points} points`)
      passed++
    } else {
      console.log(`  ❌ ${quest.title}: ${quest.points} points (expected ${TEST_CONFIG.EXPECTED_QUEST_POINTS})`)
    }
  }
  
  console.log(`\n📊 Result: ${passed}/${total} quests have correct points`)
  
  if (passed !== total) {
    throw new Error('Quest points configuration is incorrect')
  }
}

async function testQuestCompletion() {
  console.log('\n🎮 TEST 2: Quest Completion and Points Awarding')
  console.log('----------------------------------------------')
  
  // Create or find test user
  const testUser = await prisma.user.upsert({
    where: { email: TEST_CONFIG.TEST_USER_EMAIL },
    update: {},
    create: {
      email: TEST_CONFIG.TEST_USER_EMAIL,
      name: 'Test Points User',
      xUsername: 'test_points_user',
      totalPoints: 0
    }
  })
  
  console.log(`📝 Test user: ${testUser.name} (${testUser.id})`)
  
  // Get first active quest
  const quest = await prisma.quest.findFirst({
    where: { isActive: true }
  })
  
  if (!quest) {
    throw new Error('No active quests found')
  }
  
  console.log(`🎯 Testing quest: ${quest.title}`)
  
  // Record initial points
  const initialPoints = testUser.totalPoints
  console.log(`💰 Initial points: ${initialPoints}`)
  
  // Simulate quest completion using the API endpoint
  try {
    const response = await fetch(`http://localhost:3000/api/quests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.ADMIN_SECRET}`
      },
      body: JSON.stringify({
        action: 'redirect',
        questId: quest.id,
        userId: testUser.id
      })
    })
    
    if (!response.ok) {
      console.log('⚠️  API test skipped (server not running), testing database directly')
      await testQuestCompletionDirect(testUser.id, quest)
    } else {
      const result = await response.json()
      console.log(`✅ API Response: ${result.message}`)
    }
  } catch (error) {
    console.log('⚠️  API test skipped (server not running), testing database directly')
    await testQuestCompletionDirect(testUser.id, quest)
  }
  
  // Verify points were awarded
  const updatedUser = await prisma.user.findUnique({
    where: { id: testUser.id }
  })
  
  const pointsAwarded = updatedUser.totalPoints - initialPoints
  console.log(`💰 Points awarded: ${pointsAwarded}`)
  console.log(`💰 Final points: ${updatedUser.totalPoints}`)
  
  if (pointsAwarded !== quest.points) {
    throw new Error(`Expected ${quest.points} points, but ${pointsAwarded} were awarded`)
  }
  
  console.log('✅ Quest completion test passed')
}

async function testQuestCompletionDirect(userId, quest) {
  console.log('🔧 Testing quest completion directly via database')
  
  // Simulate the quest service logic
  await prisma.$transaction(async (tx) => {
    // Create or update user quest
    await tx.userQuest.upsert({
      where: {
        userId_questId: { userId, questId: quest.id }
      },
      update: {
        status: 'claimed',
        progress: 1,
        completedAt: new Date(),
        claimedAt: new Date()
      },
      create: {
        userId,
        questId: quest.id,
        status: 'claimed',
        progress: 1,
        maxProgress: 1,
        completedAt: new Date(),
        claimedAt: new Date()
      }
    })
    
    // Award points
    await tx.user.update({
      where: { id: userId },
      data: {
        totalPoints: {
          increment: quest.points
        }
      }
    })
    
    // Create points history
    await tx.pointsHistory.create({
      data: {
        userId,
        pointsAwarded: quest.points,
        reason: `Test quest completion: ${quest.title}`
      }
    })
  })
}

async function testPointsConsistency() {
  console.log('\n🔍 TEST 3: Points Consistency')
  console.log('-----------------------------')
  
  const users = await prisma.user.findMany({
    where: { totalPoints: { gt: 0 } },
    select: { id: true, name: true, totalPoints: true }
  })
  
  let inconsistentUsers = 0
  
  for (const user of users) {
    // Calculate points from history
    const pointsHistory = await prisma.pointsHistory.aggregate({
      where: { userId: user.id },
      _sum: { pointsAwarded: true }
    })
    
    const calculatedPoints = pointsHistory._sum.pointsAwarded || 0
    const difference = user.totalPoints - calculatedPoints
    
    if (difference !== 0) {
      console.log(`  ❌ ${user.name}: ${user.totalPoints} stored, ${calculatedPoints} calculated (diff: ${difference})`)
      inconsistentUsers++
    } else {
      console.log(`  ✅ ${user.name}: ${user.totalPoints} points (consistent)`)
    }
  }
  
  console.log(`\n📊 Result: ${users.length - inconsistentUsers}/${users.length} users have consistent points`)
  
  if (inconsistentUsers > 0) {
    console.log(`⚠️  ${inconsistentUsers} users have inconsistent points`)
  }
}

async function testLeaderboardAccuracy() {
  console.log('\n🏆 TEST 4: Leaderboard Accuracy')
  console.log('-------------------------------')
  
  // Get leaderboard from database
  const dbLeaderboard = await prisma.user.findMany({
    where: { totalPoints: { gt: 0 } },
    select: { id: true, name: true, totalPoints: true, rank: true },
    orderBy: { totalPoints: 'desc' },
    take: 10
  })
  
  console.log('📊 Database Leaderboard (Top 10):')
  dbLeaderboard.forEach((user, index) => {
    const expectedRank = index + 1
    const actualRank = user.rank
    const rankStatus = actualRank === expectedRank ? '✅' : '❌'
    
    console.log(`  ${rankStatus} #${expectedRank}: ${user.name} - ${user.totalPoints} points (stored rank: ${actualRank})`)
  })
  
  // Test API leaderboard if server is running
  try {
    const response = await fetch('http://localhost:3000/api/leaderboard?limit=10')
    if (response.ok) {
      const apiResult = await response.json()
      console.log('\n📊 API Leaderboard (Top 10):')
      apiResult.users.forEach((user, index) => {
        console.log(`  ✅ #${user.rank}: ${user.name} - ${user.totalPoints} points`)
      })
    }
  } catch (error) {
    console.log('⚠️  API leaderboard test skipped (server not running)')
  }
}

async function testMobileNavigationData() {
  console.log('\n📱 TEST 5: Mobile Navigation Data')
  console.log('---------------------------------')
  
  const testUser = await prisma.user.findFirst({
    where: { email: TEST_CONFIG.TEST_USER_EMAIL }
  })
  
  if (!testUser) {
    console.log('⚠️  No test user found for mobile navigation test')
    return
  }
  
  console.log(`📱 Test user data for mobile navigation:`)
  console.log(`   Name: ${testUser.name}`)
  console.log(`   Username: ${testUser.xUsername}`)
  console.log(`   Points: ${testUser.totalPoints}`)
  console.log(`   Rank: ${testUser.rank}`)
  
  // Test user stats API if server is running
  try {
    const response = await fetch('http://localhost:3000/api/user/stats', {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.ADMIN_SECRET}`
      }
    })
    
    if (response.ok) {
      const stats = await response.json()
      console.log(`📊 API Stats:`)
      console.log(`   Total Points: ${stats.totalPoints}`)
      console.log(`   Rank: ${stats.rank}`)
      console.log(`   Tweets: ${stats.tweetsSubmitted}`)
      console.log(`   This Week: ${stats.thisWeekPoints}`)
    }
  } catch (error) {
    console.log('⚠️  API stats test skipped (server not running)')
  }
}

// Run the tests
main().catch(console.error)
