#!/usr/bin/env node

/**
 * Script to fix the rank synchronization issue
 * This will update all user ranks in the database
 */

import { PrismaClient } from '@prisma/client'

async function fixRanks() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔧 Fixing Rank Synchronization Issue')
    console.log('=' .repeat(50))
    
    // 1. Get all users with points, ordered by totalPoints desc
    console.log('\n1. 📊 Fetching users...')
    const users = await prisma.user.findMany({
      where: { totalPoints: { gt: 0 } },
      select: {
        id: true,
        name: true,
        xUsername: true,
        totalPoints: true,
        rank: true
      },
      orderBy: [
        { totalPoints: 'desc' },
        { joinDate: 'asc' } // Earlier joiners rank higher in case of ties
      ]
    })
    
    console.log(`   Found ${users.length} users with points`)
    
    // 2. Calculate correct ranks
    console.log('\n2. 🔄 Calculating correct ranks...')
    const leaderboard = users.map((user, index) => ({
      id: user.id,
      name: user.name || user.xUsername,
      totalPoints: user.totalPoints,
      oldRank: user.rank,
      newRank: index + 1
    }))
    
    leaderboard.forEach(user => {
      const status = user.oldRank === user.newRank ? '✅' : '🔄'
      console.log(`   ${status} ${user.name}: ${user.totalPoints} pts, ${user.oldRank} → #${user.newRank}`)
    })
    
    // 3. Update ranks in database
    console.log('\n3. 💾 Updating ranks in database...')
    
    // Process in chunks to avoid overwhelming the database
    const chunkSize = 10
    const chunks = []
    for (let i = 0; i < leaderboard.length; i += chunkSize) {
      chunks.push(leaderboard.slice(i, i + chunkSize))
    }
    
    let updatedCount = 0
    for (const chunk of chunks) {
      await prisma.$transaction(async (tx) => {
        const promises = chunk.map(user =>
          tx.user.update({
            where: { id: user.id },
            data: { rank: user.newRank },
            select: { id: true }
          })
        )
        await Promise.all(promises)
      })
      updatedCount += chunk.length
      console.log(`   Updated ${updatedCount}/${leaderboard.length} users`)
    }
    
    // 4. Verify the fix
    console.log('\n4. ✅ Verifying the fix...')
    const verifyUsers = await prisma.user.findMany({
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
    
    let allCorrect = true
    verifyUsers.forEach((user, index) => {
      const expectedRank = index + 1
      const actualRank = user.rank
      const status = actualRank === expectedRank ? '✅' : '❌'
      
      if (actualRank !== expectedRank) {
        allCorrect = false
      }
      
      console.log(`   ${status} ${user.name || user.xUsername}: Rank #${actualRank} (expected #${expectedRank})`)
    })
    
    // 5. Summary
    console.log('\n5. 📋 Summary:')
    console.log(`   Total users updated: ${updatedCount}`)
    console.log(`   Rank synchronization: ${allCorrect ? '✅ SUCCESS' : '❌ FAILED'}`)
    
    if (allCorrect) {
      console.log('\n🎉 Dashboard rank display issue should now be fixed!')
      console.log('   The Network Rank should now show the correct rank instead of "#N/A"')
    } else {
      console.log('\n❌ Some ranks are still incorrect. Please check the database.')
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the fix
fixRanks().catch(console.error)
