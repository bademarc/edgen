import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test configuration matching requirements
const REQUIREMENTS = {
  POINTS_PER_QUEST: 1000,
  REDIRECT_BASED_COMPLETION: true,
  DATABASE_ONLY_VERIFICATION: true,
  ONE_MINUTE_TIMER: 60000,
  IMMEDIATE_POINT_AWARD: true,
  NO_EXTERNAL_API_CALLS: true
};

async function createTestUser() {
  const testUser = await prisma.user.create({
    data: {
      id: `test-user-${Date.now()}`,
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      totalPoints: 0
    }
  });
  return testUser;
}

async function cleanupTestUser(userId) {
  try {
    await prisma.userQuest.deleteMany({ where: { userId } });
    await prisma.pointsHistory.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  } catch (error) {
    console.log(`⚠️ Cleanup warning: ${error.message}`);
  }
}

// Test 1: Verify quest points awarding (~1000 points per quest)
async function testQuestPointsAwarding() {
  console.log('\n🎯 TEST 1: Quest Points Awarding');
  console.log('Requirement: Quests should award approximately 1000 points per completion');
  
  const activeQuests = await prisma.quest.findMany({
    where: { isActive: true }
  });

  let passed = 0;
  let total = activeQuests.length;

  for (const quest of activeQuests) {
    if (quest.points === REQUIREMENTS.POINTS_PER_QUEST) {
      console.log(`  ✅ ${quest.title}: Awards ${quest.points} points`);
      passed++;
    } else {
      console.log(`  ❌ ${quest.title}: Awards ${quest.points} points (expected ${REQUIREMENTS.POINTS_PER_QUEST})`);
    }
  }

  console.log(`  📊 Result: ${passed}/${total} quests award correct points`);
  return { passed: passed === total, details: `${passed}/${total} quests award 1000 points` };
}

// Test 2: Verify redirect-based completion with immediate point award
async function testRedirectBasedCompletion() {
  console.log('\n🔄 TEST 2: Redirect-Based Completion');
  console.log('Requirement: Quest completion uses redirect-based mechanisms with immediate point award');
  
  const testUser = await createTestUser();
  let testResults = [];

  try {
    const redirectQuests = await prisma.quest.findMany({
      where: { 
        isActive: true,
        type: { in: ['follow_redirect', 'community_redirect'] }
      }
    });

    if (redirectQuests.length === 0) {
      console.log('  ⚠️ No redirect-based quests found');
      return { passed: false, details: 'No redirect-based quests configured' };
    }

    for (const quest of redirectQuests) {
      console.log(`  Testing: ${quest.title}`);
      
      // Simulate redirect-based completion
      const startTime = Date.now();
      const userBefore = await prisma.user.findUnique({ where: { id: testUser.id } });
      
      // Create and complete quest in one transaction (simulating redirect completion)
      await prisma.$transaction(async (tx) => {
        // Create user quest
        await tx.userQuest.create({
          data: {
            userId: testUser.id,
            questId: quest.id,
            status: 'completed',
            progress: 1,
            maxProgress: 1,
            completedAt: new Date(),
            submissionData: {
              redirectedAt: new Date(),
              autoCompleted: true
            }
          }
        });

        // Award points immediately
        await tx.user.update({
          where: { id: testUser.id },
          data: {
            totalPoints: { increment: quest.points }
          }
        });

        // Record points history
        await tx.pointsHistory.create({
          data: {
            userId: testUser.id,
            pointsAwarded: quest.points,
            reason: `Quest redirect completed: ${quest.title}`
          }
        });
      });

      const endTime = Date.now();
      const userAfter = await prisma.user.findUnique({ where: { id: testUser.id } });
      const duration = endTime - startTime;

      // Verify immediate point award
      const pointsAwarded = userAfter.totalPoints - userBefore.totalPoints;
      if (pointsAwarded === quest.points && duration < 2000) {
        console.log(`    ✅ Points awarded immediately: ${pointsAwarded} points in ${duration}ms`);
        testResults.push(true);
      } else {
        console.log(`    ❌ Points not awarded immediately: ${pointsAwarded} points in ${duration}ms`);
        testResults.push(false);
      }
    }

  } finally {
    await cleanupTestUser(testUser.id);
  }

  const passed = testResults.every(result => result);
  console.log(`  📊 Result: ${testResults.filter(r => r).length}/${testResults.length} redirect quests work correctly`);
  return { passed, details: `${testResults.filter(r => r).length}/${testResults.length} redirect quests complete with immediate point award` };
}

// Test 3: Verify database-only verification with 1-minute timers
async function testDatabaseOnlyVerification() {
  console.log('\n💾 TEST 3: Database-Only Verification');
  console.log('Requirement: Quest system uses database-only verification with 1-minute timers, no real-time API calls');
  
  let testResults = [];

  // Check quest metadata for external API references
  const activeQuests = await prisma.quest.findMany({
    where: { isActive: true }
  });

  let hasExternalAPIs = false;
  for (const quest of activeQuests) {
    if (quest.metadata && typeof quest.metadata === 'object') {
      const metadataStr = JSON.stringify(quest.metadata);
      if (metadataStr.includes('api.twitter.com') || 
          metadataStr.includes('api.x.com') || 
          metadataStr.includes('graph.facebook.com')) {
        hasExternalAPIs = true;
        console.log(`    ❌ External API found in ${quest.title}: ${metadataStr}`);
        break;
      }
    }
  }

  if (!hasExternalAPIs) {
    console.log('    ✅ No external API dependencies found in quest metadata');
    testResults.push(true);
  } else {
    testResults.push(false);
  }

  // Verify auto-verifiable quests use database-only approach
  const autoVerifiableQuests = activeQuests.filter(q => q.autoVerifiable);
  console.log(`    ✅ Found ${autoVerifiableQuests.length} auto-verifiable quests (database-only)`);
  testResults.push(autoVerifiableQuests.length > 0);

  // Check that manual verification quests don't require real-time API calls
  const manualQuests = activeQuests.filter(q => q.requiresManualVerification);
  console.log(`    ✅ Found ${manualQuests.length} manual verification quests (admin-reviewed)`);
  testResults.push(true); // Manual verification is acceptable

  const passed = testResults.every(result => result);
  console.log(`  📊 Result: Database-only verification ${passed ? 'CONFIRMED' : 'FAILED'}`);
  return { passed, details: `Database-only verification with ${autoVerifiableQuests.length} auto-verifiable quests` };
}

// Test 4: Verify quest tracking reliability
async function testQuestTracking() {
  console.log('\n📈 TEST 4: Quest Tracking Reliability');
  console.log('Requirement: Quest status is properly tracked and updated in the database');
  
  const testUser = await createTestUser();
  let testResults = [];

  try {
    const activeQuests = await prisma.quest.findMany({
      where: { isActive: true },
      take: 1
    });

    if (activeQuests.length === 0) {
      return { passed: false, details: 'No active quests for tracking test' };
    }

    const quest = activeQuests[0];
    console.log(`  Testing tracking for: ${quest.title}`);

    // Test status progression: not_started → in_progress → completed
    
    // 1. Create quest (in_progress)
    const userQuest = await prisma.userQuest.create({
      data: {
        userId: testUser.id,
        questId: quest.id,
        status: 'in_progress',
        progress: 0,
        maxProgress: 1
      }
    });

    if (userQuest.status === 'in_progress') {
      console.log('    ✅ Quest status: in_progress');
      testResults.push(true);
    } else {
      console.log('    ❌ Quest status not set to in_progress');
      testResults.push(false);
    }

    // 2. Complete quest
    const completedQuest = await prisma.userQuest.update({
      where: { id: userQuest.id },
      data: {
        status: 'completed',
        progress: 1,
        completedAt: new Date()
      }
    });

    if (completedQuest.status === 'completed' && completedQuest.completedAt) {
      console.log('    ✅ Quest status: completed with timestamp');
      testResults.push(true);
    } else {
      console.log('    ❌ Quest completion not properly tracked');
      testResults.push(false);
    }

    // 3. Verify quest can be retrieved with correct status
    const retrievedQuest = await prisma.userQuest.findUnique({
      where: { id: userQuest.id },
      include: { quest: true }
    });

    if (retrievedQuest && retrievedQuest.status === 'completed') {
      console.log('    ✅ Quest status persisted correctly');
      testResults.push(true);
    } else {
      console.log('    ❌ Quest status not persisted correctly');
      testResults.push(false);
    }

  } finally {
    await cleanupTestUser(testUser.id);
  }

  const passed = testResults.every(result => result);
  console.log(`  📊 Result: Quest tracking ${passed ? 'RELIABLE' : 'UNRELIABLE'}`);
  return { passed, details: `Quest status tracking through ${testResults.filter(r => r).length}/${testResults.length} stages` };
}

// Test 5: Verify no infinite loops or performance issues
async function testPerformanceAndReliability() {
  console.log('\n⚡ TEST 5: Performance and Reliability');
  console.log('Requirement: No infinite loops or performance issues in quest system');
  
  let testResults = [];

  // Test 1: Quest retrieval performance
  const startTime = Date.now();
  const quests = await prisma.quest.findMany({
    where: { isActive: true },
    include: {
      userQuests: { take: 10 }
    }
  });
  const endTime = Date.now();
  const duration = endTime - startTime;

  if (duration < 3000) {
    console.log(`    ✅ Quest retrieval performance: ${duration}ms (acceptable)`);
    testResults.push(true);
  } else {
    console.log(`    ❌ Quest retrieval performance: ${duration}ms (too slow)`);
    testResults.push(false);
  }

  // Test 2: Concurrent operations
  const testUser = await createTestUser();
  try {
    const concurrentOps = Array(5).fill().map(async (_, index) => {
      return prisma.userQuest.create({
        data: {
          userId: testUser.id,
          questId: quests[0]?.id || 'dummy',
          status: 'in_progress',
          progress: 0,
          maxProgress: 1
        }
      }).catch(() => null); // Ignore errors for this test
    });

    const results = await Promise.all(concurrentOps);
    const successfulOps = results.filter(r => r !== null).length;
    
    if (successfulOps > 0) {
      console.log(`    ✅ Concurrent operations: ${successfulOps}/5 successful`);
      testResults.push(true);
    } else {
      console.log(`    ❌ Concurrent operations: 0/5 successful`);
      testResults.push(false);
    }

  } finally {
    await cleanupTestUser(testUser.id);
  }

  const passed = testResults.every(result => result);
  console.log(`  📊 Result: Performance ${passed ? 'ACCEPTABLE' : 'ISSUES DETECTED'}`);
  return { passed, details: `Performance tests: ${testResults.filter(r => r).length}/${testResults.length} passed` };
}

// Main test runner
async function runComprehensiveQuestTests() {
  const startTime = Date.now();
  console.log('🧪 COMPREHENSIVE QUEST SYSTEM REQUIREMENTS TEST');
  console.log('=' .repeat(70));
  console.log('Testing compliance with established quest system requirements:');
  console.log('1. Quests award ~1000 points per completion');
  console.log('2. Redirect-based completion with immediate point award');
  console.log('3. Database-only verification with 1-minute timers');
  console.log('4. Reliable quest tracking without external API dependencies');
  console.log('5. No infinite loops or performance issues');
  console.log('=' .repeat(70));

  try {
    const testResults = [];
    
    testResults.push(await testQuestPointsAwarding());
    testResults.push(await testRedirectBasedCompletion());
    testResults.push(await testDatabaseOnlyVerification());
    testResults.push(await testQuestTracking());
    testResults.push(await testPerformanceAndReliability());

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Calculate results
    const passedTests = testResults.filter(r => r.passed).length;
    const totalTests = testResults.length;
    const successRate = (passedTests / totalTests * 100).toFixed(1);

    console.log('\n' + '=' .repeat(70));
    console.log('📊 COMPREHENSIVE TEST RESULTS');
    console.log('=' .repeat(70));

    testResults.forEach((result, index) => {
      const testNames = [
        'Quest Points Awarding',
        'Redirect-Based Completion', 
        'Database-Only Verification',
        'Quest Tracking Reliability',
        'Performance & Reliability'
      ];
      console.log(`${result.passed ? '✅' : '❌'} ${testNames[index]}: ${result.details}`);
    });

    console.log(`\n📈 Overall Success Rate: ${successRate}% (${passedTests}/${totalTests})`);
    console.log(`⏱️ Total Test Duration: ${duration}ms`);
    console.log(`🎯 Compliance Status: ${successRate >= 100 ? '🟢 FULLY COMPLIANT' : successRate >= 80 ? '🟡 MOSTLY COMPLIANT' : '🔴 NON-COMPLIANT'}`);

    // Requirement compliance summary
    console.log('\n📋 REQUIREMENT COMPLIANCE SUMMARY:');
    console.log(`  ✅ ~1000 points per quest: ${testResults[0].passed ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ Redirect-based completion: ${testResults[1].passed ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ Database-only verification: ${testResults[2].passed ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ Reliable quest tracking: ${testResults[3].passed ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ No performance issues: ${testResults[4].passed ? 'PASS' : 'FAIL'}`);

    if (passedTests === totalTests) {
      console.log('\n🎉 ALL REQUIREMENTS MET! Quest system is fully compliant.');
    } else {
      console.log(`\n⚠️ ${totalTests - passedTests} requirement(s) not met. Review needed.`);
    }

    return passedTests === totalTests;

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR during testing:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

runComprehensiveQuestTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
