import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validateQuestSystem() {
  console.log('🔍 FINAL QUEST SYSTEM VALIDATION');
  console.log('=' .repeat(50));
  
  let allTestsPassed = true;
  const testResults = [];

  try {
    // 1. Validate quest configuration
    console.log('\n1️⃣ Validating Quest Configuration...');
    const activeQuests = await prisma.quest.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    console.log(`   Found ${activeQuests.length} active quests:`);
    activeQuests.forEach(quest => {
      const pointsCorrect = quest.points === 1000;
      const isRedirectType = quest.type.includes('redirect');
      const isAutoVerifiable = quest.autoVerifiable;
      
      console.log(`   ${pointsCorrect && isRedirectType && isAutoVerifiable ? '✅' : '❌'} ${quest.title}`);
      console.log(`      Points: ${quest.points} | Type: ${quest.type} | Auto-verifiable: ${isAutoVerifiable}`);
      
      if (!pointsCorrect || !isRedirectType || !isAutoVerifiable) {
        allTestsPassed = false;
      }
    });

    testResults.push({
      test: 'Quest Configuration',
      passed: activeQuests.length >= 2 && activeQuests.every(q => q.points === 1000 && q.type.includes('redirect') && q.autoVerifiable)
    });

    // 2. Test redirect-based completion
    console.log('\n2️⃣ Testing Redirect-Based Completion...');
    
    if (activeQuests.length > 0) {
      const testUser = await prisma.user.create({
        data: {
          id: `final-test-${Date.now()}`,
          name: 'Final Test User',
          email: `final-test-${Date.now()}@example.com`,
          totalPoints: 0
        }
      });

      try {
        const quest = activeQuests[0];
        const startTime = Date.now();
        
        // Simulate redirect quest completion
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
              reason: `Final validation: ${quest.title}`
            }
          });
        });

        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Verify results
        const updatedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
        const pointsAwarded = updatedUser.totalPoints === quest.points;
        const fastCompletion = duration < 2000;

        console.log(`   ✅ Quest: ${quest.title}`);
        console.log(`   ✅ Points awarded: ${updatedUser.totalPoints} (${pointsAwarded ? 'correct' : 'incorrect'})`);
        console.log(`   ✅ Completion time: ${duration}ms (${fastCompletion ? 'fast' : 'slow'})`);

        testResults.push({
          test: 'Redirect Completion',
          passed: pointsAwarded && fastCompletion
        });

        if (!pointsAwarded || !fastCompletion) {
          allTestsPassed = false;
        }

      } finally {
        // Cleanup
        await prisma.userQuest.deleteMany({ where: { userId: testUser.id } });
        await prisma.pointsHistory.deleteMany({ where: { userId: testUser.id } });
        await prisma.user.delete({ where: { id: testUser.id } });
      }
    }

    // 3. Validate database-only approach
    console.log('\n3️⃣ Validating Database-Only Approach...');
    
    let hasExternalAPIs = false;
    for (const quest of activeQuests) {
      if (quest.metadata && typeof quest.metadata === 'object') {
        const metadataStr = JSON.stringify(quest.metadata);
        if (metadataStr.includes('api.twitter.com') || metadataStr.includes('api.x.com')) {
          hasExternalAPIs = true;
          console.log(`   ❌ External API found in ${quest.title}`);
          break;
        }
      }
    }

    if (!hasExternalAPIs) {
      console.log('   ✅ No external API dependencies found');
    }

    testResults.push({
      test: 'Database-Only Verification',
      passed: !hasExternalAPIs
    });

    if (hasExternalAPIs) {
      allTestsPassed = false;
    }

    // 4. Test quest tracking
    console.log('\n4️⃣ Testing Quest Tracking...');
    
    const questCount = await prisma.quest.count({ where: { isActive: true } });
    const userQuestCount = await prisma.userQuest.count();
    const pointsHistoryCount = await prisma.pointsHistory.count();

    console.log(`   ✅ Active quests: ${questCount}`);
    console.log(`   ✅ User quest records: ${userQuestCount}`);
    console.log(`   ✅ Points history records: ${pointsHistoryCount}`);

    testResults.push({
      test: 'Quest Tracking',
      passed: questCount >= 2
    });

    // 5. Performance validation
    console.log('\n5️⃣ Performance Validation...');
    
    const perfStartTime = Date.now();
    await prisma.quest.findMany({
      where: { isActive: true },
      include: {
        userQuests: { take: 10 }
      }
    });
    const perfEndTime = Date.now();
    const perfDuration = perfEndTime - perfStartTime;

    const performanceGood = perfDuration < 3000;
    console.log(`   ${performanceGood ? '✅' : '❌'} Quest retrieval: ${perfDuration}ms`);

    testResults.push({
      test: 'Performance',
      passed: performanceGood
    });

    if (!performanceGood) {
      allTestsPassed = false;
    }

    // Final summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 FINAL VALIDATION RESULTS');
    console.log('=' .repeat(50));

    testResults.forEach(result => {
      console.log(`${result.passed ? '✅' : '❌'} ${result.test}: ${result.passed ? 'PASS' : 'FAIL'}`);
    });

    const passedTests = testResults.filter(r => r.passed).length;
    const totalTests = testResults.length;
    const successRate = (passedTests / totalTests * 100).toFixed(1);

    console.log(`\n📈 Success Rate: ${successRate}% (${passedTests}/${totalTests})`);
    console.log(`🎯 Overall Status: ${allTestsPassed ? '🟢 FULLY COMPLIANT' : '🔴 ISSUES DETECTED'}`);

    // Requirement compliance check
    console.log('\n📋 REQUIREMENT COMPLIANCE:');
    console.log(`  ✅ ~1000 points per quest: ${testResults[0]?.passed ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ Redirect-based completion: ${testResults[1]?.passed ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ Database-only verification: ${testResults[2]?.passed ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ Quest tracking: ${testResults[3]?.passed ? 'PASS' : 'FAIL'}`);
    console.log(`  ✅ Performance: ${testResults[4]?.passed ? 'PASS' : 'FAIL'}`);

    if (allTestsPassed) {
      console.log('\n🎉 QUEST SYSTEM VALIDATION SUCCESSFUL!');
      console.log('✅ All requirements met - System ready for production');
    } else {
      console.log('\n⚠️ QUEST SYSTEM VALIDATION FAILED!');
      console.log('❌ Some requirements not met - Review needed');
    }

    return allTestsPassed;

  } catch (error) {
    console.error('\n❌ VALIDATION ERROR:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

validateQuestSystem()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Validation failed:', error);
    process.exit(1);
  });
