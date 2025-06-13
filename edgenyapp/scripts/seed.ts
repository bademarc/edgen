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
