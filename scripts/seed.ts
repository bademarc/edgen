/**
 * LayerEdge Database Seeding Script
 *
 * Purpose: Seeds the database with initial demo data for development/testing
 * Usage: npx tsx scripts/seed.ts
 *
 * This script:
 * - Creates demo users and tweets
 * - Sets up initial leaderboard data
 * - Provides sample engagement metrics
 *
 * Use only for development or demo environments.
 */

import { seedDatabase } from '../src/lib/seed'

async function main() {
  try {
    await seedDatabase()
    console.log('Seeding completed successfully!')
  } catch (error) {
    console.error('Seeding failed:', error)
    process.exit(1)
  }
}

main()
