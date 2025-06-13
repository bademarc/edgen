#!/usr/bin/env node

/**
 * Test script to verify rank synchronization fixes
 * This script tests the dashboard rank display issue fix
 */

import { PrismaClient } from '@prisma/client'

async function testRankSync() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🧪 Testing Rank Synchronization Fix')
    console.log('=' .repeat(50))
    
    // 1. Check current user data and ranks
    console.log('\n1. 📊 Checking current user data...')
    const users = await prisma.user.findMany({
      where: { totalPoints: { gt: 0 } },
      select: {
        id: true,
        name: true,
        xUsername: true,
        totalPoints: true,
        rank: true
      },
      orderBy: { totalPoints: 'desc' },
      take: 10
    })
    
    console.log(`   Found ${users.length} users with points`)
    
    users.forEach((user, index) => {
      const expectedRank = index + 1
      const storedRank = user.rank
      const status = storedRank === expectedRank ? '✅' : '❌'
      
      console.log(`   ${status} ${user.name || user.xUsername}: ${user.totalPoints} pts, stored rank: ${storedRank}, expected: ${expectedRank}`)
    })
    
    // 2. Test rank calculation logic
    console.log('\n2. 🔄 Testing rank calculation...')
    const testUserId = users[0]?.id
    
    if (testUserId) {
      const userData = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { totalPoints: true, rank: true }
      })
      
      // Calculate rank using the same logic as the API
      const calculatedRank = await prisma.user.count({
        where: {
          totalPoints: { gt: userData.totalPoints }
        }
      }) + 1
      
      console.log(`   User total points: ${userData.totalPoints}`)
      console.log(`   Stored rank: ${userData.rank}`)
      console.log(`   Calculated rank: ${calculatedRank}`)
      console.log(`   Match: ${userData.rank === calculatedRank ? '✅' : '❌'}`)
    }
    
    // 3. Test batch rank update simulation
    console.log('\n3. 🔧 Simulating batch rank update...')
    
    const leaderboard = users.map((user, index) => ({
      id: user.id,
      rank: index + 1,
      name: user.name || user.xUsername,
      totalPoints: user.totalPoints
    }))
    
    console.log('   Leaderboard with correct ranks:')
    leaderboard.forEach(user => {
      console.log(`   #${user.rank}: ${user.name} (${user.totalPoints} pts)`)
    })
    
    // 4. Check environment configuration
    console.log('\n4. ⚙️  Environment Configuration:')
    console.log(`   OPTIMIZE_FOR_FREE_TIER: ${process.env.OPTIMIZE_FOR_FREE_TIER}`)
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`)
    console.log(`   Database URL configured: ${process.env.DATABASE_URL ? '✅' : '❌'}`)
    
    // 5. Summary
    console.log('\n5. 📋 Summary:')
    const usersWithoutRank = users.filter(u => !u.rank).length
    const usersWithIncorrectRank = users.filter((u, i) => u.rank !== i + 1).length
    
    console.log(`   Users without rank: ${usersWithoutRank}`)
    console.log(`   Users with incorrect rank: ${usersWithIncorrectRank}`)
    
    if (usersWithoutRank === 0 && usersWithIncorrectRank === 0) {
      console.log('   ✅ All ranks are correctly synchronized!')
    } else {
      console.log('   ❌ Rank synchronization needed')
      console.log('   💡 Run the rank sync API endpoint to fix this')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testRankSync().catch(console.error)
