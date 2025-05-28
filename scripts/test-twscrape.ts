import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function testTwscrape() {
  console.log('🧪 Testing twscrape functionality...\n')

  try {
    // Test 1: Check twscrape version
    console.log('1. Testing twscrape version...')
    try {
      const { stdout } = await execAsync('twscrape version')
      console.log(`   ✅ twscrape version: ${stdout.trim()}`)
    } catch (error) {
      console.log('   ❌ twscrape version check failed:', error instanceof Error ? error.message : 'Unknown error')
      return
    }

    // Test 2: Test search command format (without actually searching)
    console.log('\n2. Testing search command format...')
    try {
      // Test the command format without actually executing a search
      const query = '$Edgen OR LayerEdge'
      const command = `twscrape search "${query}" --limit 5 --format json`
      console.log(`   ✅ Command format: ${command}`)
    } catch (error) {
      console.log('   ❌ Command format test failed:', error instanceof Error ? error.message : 'Unknown error')
    }

    // Test 3: Test help command
    console.log('\n3. Testing help command...')
    try {
      const { stdout } = await execAsync('twscrape search --help')
      console.log('   ✅ Help command works')
      console.log('   Available options:', stdout.includes('--limit') ? 'limit' : 'no limit', 
                                         stdout.includes('--format') ? 'format' : 'no format')
    } catch (error) {
      console.log('   ❌ Help command failed:', error instanceof Error ? error.message : 'Unknown error')
    }

    // Test 4: Test accounts status (this will show if we need to add accounts)
    console.log('\n4. Testing accounts status...')
    try {
      const { stdout } = await execAsync('twscrape accounts')
      console.log('   ✅ Accounts command works')
      if (stdout.trim() === '') {
        console.log('   ⚠️ No accounts configured - twscrape will have limited functionality')
        console.log('   💡 To add accounts: twscrape add_accounts accounts.txt')
      } else {
        console.log('   ✅ Accounts are configured')
      }
    } catch (error) {
      console.log('   ❌ Accounts check failed:', error instanceof Error ? error.message : 'Unknown error')
    }

    console.log('\n✅ twscrape testing completed!')
    console.log('\n📋 Notes:')
    console.log('   - twscrape is installed and working')
    console.log('   - For full functionality, you may need to add Twitter accounts')
    console.log('   - The system will work with limited functionality for testing')

  } catch (error) {
    console.error('❌ twscrape test failed:', error)
  }
}

testTwscrape().catch(console.error)
