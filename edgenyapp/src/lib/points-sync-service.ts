import { prisma } from '@/lib/db'
import { getFreeTierService } from '@/lib/free-tier-service'
import { getBudgetDbService } from '@/lib/db-budget'

/**
 * Points Synchronization Service
 * Ensures points are properly synchronized across all systems
 */
export class PointsSyncService {
  /**
   * Refresh user points and rankings after quest completion
   */
  static async syncUserPointsAfterQuest(userId: string): Promise<void> {
    try {
      console.log(`🔄 Syncing points for user ${userId} after quest completion`)

      // 1. Get updated user data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          totalPoints: true,
          rank: true
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // 2. Clear relevant caches
      await this.clearUserCaches(userId)

      // 3. Update user rank
      await this.updateUserRank(userId, user.totalPoints)

      // 4. Clear leaderboard caches to reflect new rankings
      await this.clearLeaderboardCaches()

      console.log(`✅ Points sync completed for user ${userId}`)
    } catch (error) {
      console.error('Error syncing user points:', error)
      throw error
    }
  }

  /**
   * Clear user-specific caches
   */
  private static async clearUserCaches(userId: string): Promise<void> {
    try {
      // Clear free tier service cache if enabled
      const isFreeTier = process.env.OPTIMIZE_FOR_FREE_TIER === 'true'
      
      if (isFreeTier) {
        const freeTierService = getFreeTierService()
        // Clear user stats cache
        await freeTierService.clearUserCache(userId)
      } else {
        const budgetDb = getBudgetDbService()
        // Clear user cache
        await budgetDb.deleteCacheEntry(`user:${userId}`)
      }
    } catch (error) {
      console.error('Error clearing user caches:', error)
    }
  }

  /**
   * Update user rank based on current points
   */
  private static async updateUserRank(userId: string, totalPoints: number): Promise<void> {
    try {
      // Calculate new rank
      const usersWithHigherPoints = await prisma.user.count({
        where: {
          totalPoints: {
            gt: totalPoints
          }
        }
      })

      const newRank = usersWithHigherPoints + 1

      // Update user rank
      await prisma.user.update({
        where: { id: userId },
        data: { rank: newRank }
      })

      console.log(`📊 Updated user ${userId} rank to ${newRank}`)
    } catch (error) {
      console.error('Error updating user rank:', error)
    }
  }

  /**
   * Clear leaderboard caches
   */
  private static async clearLeaderboardCaches(): Promise<void> {
    try {
      const isFreeTier = process.env.OPTIMIZE_FOR_FREE_TIER === 'true'
      
      if (isFreeTier) {
        const freeTierService = getFreeTierService()
        // Clear leaderboard caches with different limits
        const limits = [10, 25, 50, 100]
        for (const limit of limits) {
          await freeTierService.deleteCacheEntry(`leaderboard:${limit}`)
        }
      } else {
        const budgetDb = getBudgetDbService()
        // Clear leaderboard cache
        await budgetDb.clearLeaderboardCache()
        // Clear other common leaderboard cache keys
        const limits = [10, 25, 50, 100]
        for (const limit of limits) {
          await budgetDb.clearLeaderboardCache(limit)
        }
      }

      console.log('🗑️ Cleared leaderboard caches')
    } catch (error) {
      console.error('Error clearing leaderboard caches:', error)
    }
  }

  /**
   * Verify points consistency for a user
   */
  static async verifyUserPointsConsistency(userId: string): Promise<{
    isConsistent: boolean
    userPoints: number
    calculatedPoints: number
    difference: number
  }> {
    try {
      // Get user's current points
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { totalPoints: true }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Calculate points from history
      const pointsHistory = await prisma.pointsHistory.aggregate({
        where: { userId },
        _sum: { pointsAwarded: true }
      })

      const userPoints = user.totalPoints
      const calculatedPoints = pointsHistory._sum.pointsAwarded || 0
      const difference = userPoints - calculatedPoints

      return {
        isConsistent: difference === 0,
        userPoints,
        calculatedPoints,
        difference
      }
    } catch (error) {
      console.error('Error verifying points consistency:', error)
      throw error
    }
  }

  /**
   * Fix points inconsistency for a user
   */
  static async fixUserPointsInconsistency(userId: string): Promise<void> {
    try {
      const verification = await this.verifyUserPointsConsistency(userId)
      
      if (verification.isConsistent) {
        console.log(`✅ User ${userId} points are already consistent`)
        return
      }

      console.log(`🔧 Fixing points inconsistency for user ${userId}`)
      console.log(`   Current: ${verification.userPoints}`)
      console.log(`   Expected: ${verification.calculatedPoints}`)
      console.log(`   Difference: ${verification.difference}`)

      // Update user points to match calculated points
      await prisma.user.update({
        where: { id: userId },
        data: { totalPoints: verification.calculatedPoints }
      })

      // Sync after fix
      await this.syncUserPointsAfterQuest(userId)

      console.log(`✅ Fixed points inconsistency for user ${userId}`)
    } catch (error) {
      console.error('Error fixing points inconsistency:', error)
      throw error
    }
  }

  /**
   * Batch sync all users (admin function)
   */
  static async batchSyncAllUsers(): Promise<void> {
    try {
      console.log('🔄 Starting batch sync of all users')

      const users = await prisma.user.findMany({
        where: { totalPoints: { gt: 0 } },
        select: { id: true, totalPoints: true },
        orderBy: { totalPoints: 'desc' }
      })

      console.log(`📊 Found ${users.length} users with points`)

      // Update ranks for all users
      for (let i = 0; i < users.length; i++) {
        const user = users[i]
        const newRank = i + 1

        await prisma.user.update({
          where: { id: user.id },
          data: { rank: newRank }
        })
      }

      // Clear all caches
      await this.clearLeaderboardCaches()

      console.log('✅ Batch sync completed')
    } catch (error) {
      console.error('Error in batch sync:', error)
      throw error
    }
  }
}

export default PointsSyncService
