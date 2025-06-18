// Test script for the rank update SQL fix
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function testRankUpdate() {
  console.log('🔍 Testing rank update SQL fix...');
  
  try {
    // 1. Get some users with points to test with
    console.log('1️⃣ Fetching users for testing...');
    const users = await prisma.user.findMany({
      where: {
        totalPoints: { gt: 0 }
      },
      select: {
        id: true,
        name: true,
        totalPoints: true,
        rank: true
      },
      orderBy: {
        totalPoints: 'desc'
      },
      take: 5
    });
    
    if (users.length === 0) {
      console.log('❌ No users with points found for testing');
      return { success: false, error: 'No test data available' };
    }
    
    console.log(`✅ Found ${users.length} users for testing`);
    console.log('📊 Current users:', users.map(u => ({ name: u.name, points: u.totalPoints, rank: u.rank })));
    
    // 2. Create a test leaderboard with new ranks
    const leaderboard = users.map((user, index) => ({
      ...user,
      rank: index + 1
    }));
    
    console.log('2️⃣ Testing the fixed rank update SQL...');
    
    // 3. Test the rank update logic (same as in the fixed API)
    try {
      // Validate and sanitize user IDs (they should be UUIDs from our database)
      const validatedUpdates = leaderboard
        .filter(user => user.id && typeof user.id === 'string' && typeof user.rank === 'number')
        .map(user => `('${user.id.replace(/'/g, "''")}', ${user.rank})`) // Escape single quotes for safety
        .join(',');
      
      if (validatedUpdates) {
        console.log('📝 Generated SQL VALUES:', validatedUpdates);
        
        // Use $executeRawUnsafe for direct SQL interpolation (same as the fix)
        await prisma.$executeRawUnsafe(`
          UPDATE "User"
          SET rank = updates.new_rank::integer
          FROM (VALUES ${validatedUpdates}) AS updates(user_id, new_rank)
          WHERE "User".id = updates.user_id
        `);
        console.log('✅ Rank update SQL executed successfully');
      }
    } catch (error) {
      console.error('❌ Rank update failed:', error);
      throw error;
    }
    
    // 4. Verify the ranks were updated
    console.log('3️⃣ Verifying rank updates...');
    const updatedUsers = await prisma.user.findMany({
      where: {
        id: {
          in: users.map(u => u.id)
        }
      },
      select: {
        id: true,
        name: true,
        rank: true,
        totalPoints: true
      },
      orderBy: {
        totalPoints: 'desc'
      }
    });
    
    console.log('📊 Updated users with ranks:', updatedUsers.map(u => ({ name: u.name, points: u.totalPoints, rank: u.rank })));
    
    // 5. Check if ranks match what we set
    const allRanksCorrect = updatedUsers.every(user => {
      const expectedRank = leaderboard.find(l => l.id === user.id)?.rank;
      return user.rank === expectedRank;
    });
    
    if (allRanksCorrect) {
      console.log('✅ All ranks were updated correctly');
      return { success: true, usersUpdated: updatedUsers.length };
    } else {
      console.log('❌ Some ranks were not updated correctly');
      updatedUsers.forEach(user => {
        const expectedRank = leaderboard.find(l => l.id === user.id)?.rank;
        if (user.rank !== expectedRank) {
          console.log(`❌ User ${user.name}: expected rank ${expectedRank}, actual rank ${user.rank}`);
        }
      });
      return { success: false, error: 'Rank mismatch' };
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRankUpdate()
  .then(result => {
    if (result.success) {
      console.log('\n🎉 Rank update test completed successfully!');
      console.log(`📊 Updated ${result.usersUpdated} users`);
      process.exit(0);
    } else {
      console.log('\n❌ Rank update test failed');
      console.log(`Error: ${result.error}`);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
