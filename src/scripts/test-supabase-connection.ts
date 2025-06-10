import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('🔍 Testing Supabase Connection...\n')

console.log('Environment Variables:')
console.log(`  Supabase URL: ${supabaseUrl}`)
console.log(`  Anon Key Length: ${supabaseAnonKey?.length || 0}`)
console.log(`  Service Key Length: ${supabaseServiceKey?.length || 0}`)
console.log(`  Anon Key Preview: ${supabaseAnonKey?.substring(0, 50)}...`)
console.log(`  Service Key Preview: ${supabaseServiceKey?.substring(0, 50)}...`)

async function testConnections() {
  console.log('\n🧪 Testing Connections...\n')

  // Test 1: Anonymous client
  console.log('1. Testing Anonymous Client...')
  try {
    const anonClient = createClient(supabaseUrl, supabaseAnonKey)
    const { data, error } = await anonClient.from('User').select('count').limit(1)
    
    if (error) {
      console.log(`   ❌ Anonymous client error: ${error.message}`)
    } else {
      console.log('   ✅ Anonymous client connection successful')
    }
  } catch (error) {
    console.log(`   ❌ Anonymous client exception: ${error}`)
  }

  // Test 2: Service role client
  console.log('\n2. Testing Service Role Client...')
  try {
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    const { data, error } = await serviceClient.auth.admin.listUsers()
    
    if (error) {
      console.log(`   ❌ Service client error: ${error.message}`)
      console.log(`   Error details:`, error)
    } else {
      console.log(`   ✅ Service client connection successful`)
      console.log(`   Found ${data.users.length} users in Supabase Auth`)
    }
  } catch (error) {
    console.log(`   ❌ Service client exception: ${error}`)
  }

  // Test 3: Database access with service role
  console.log('\n3. Testing Database Access with Service Role...')
  try {
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
    const { data, error } = await serviceClient.from('User').select('id, name').limit(5)
    
    if (error) {
      console.log(`   ❌ Database access error: ${error.message}`)
    } else {
      console.log(`   ✅ Database access successful`)
      console.log(`   Found ${data?.length || 0} users in database`)
    }
  } catch (error) {
    console.log(`   ❌ Database access exception: ${error}`)
  }

  // Test 4: Check JWT token validity
  console.log('\n4. Analyzing JWT Tokens...')
  
  try {
    // Decode JWT without verification (just to see structure)
    const decodeJWT = (token: string) => {
      const parts = token.split('.')
      if (parts.length !== 3) return null
      
      try {
        const payload = JSON.parse(atob(parts[1]))
        return payload
      } catch {
        return null
      }
    }

    const anonPayload = decodeJWT(supabaseAnonKey)
    const servicePayload = decodeJWT(supabaseServiceKey)

    console.log('   Anon Key Payload:')
    console.log(`     Role: ${anonPayload?.role}`)
    console.log(`     Issuer: ${anonPayload?.iss}`)
    console.log(`     Project Ref: ${anonPayload?.ref}`)
    console.log(`     Expires: ${anonPayload?.exp ? new Date(anonPayload.exp * 1000).toISOString() : 'N/A'}`)

    console.log('\n   Service Key Payload:')
    console.log(`     Role: ${servicePayload?.role}`)
    console.log(`     Issuer: ${servicePayload?.iss}`)
    console.log(`     Project Ref: ${servicePayload?.ref}`)
    console.log(`     Expires: ${servicePayload?.exp ? new Date(servicePayload.exp * 1000).toISOString() : 'N/A'}`)

    // Check if tokens match the project
    const urlProjectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
    console.log(`\n   URL Project Ref: ${urlProjectRef}`)
    console.log(`   Anon Token Project Match: ${anonPayload?.ref === urlProjectRef}`)
    console.log(`   Service Token Project Match: ${servicePayload?.ref === urlProjectRef}`)

  } catch (error) {
    console.log(`   ❌ JWT analysis error: ${error}`)
  }
}

testConnections()
  .then(() => {
    console.log('\n🎉 Connection test completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Connection test failed:', error)
    process.exit(1)
  })
