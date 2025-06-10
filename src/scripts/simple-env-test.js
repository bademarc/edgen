require('dotenv').config({ path: '.env.local' })

console.log('🔍 Environment Variables Test\n')

console.log('Supabase Configuration:')
console.log(`  URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
console.log(`  Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 50)}...`)
console.log(`  Service Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 50)}...`)
console.log(`  Service Key Length: ${process.env.SUPABASE_SERVICE_ROLE_KEY?.length}`)

// Test JWT decode
function decodeJWT(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    return payload
  } catch (error) {
    return { error: error.message }
  }
}

console.log('\nJWT Analysis:')
const servicePayload = decodeJWT(process.env.SUPABASE_SERVICE_ROLE_KEY)
console.log('Service Key Payload:', JSON.stringify(servicePayload, null, 2))

const urlProjectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
console.log(`\nProject Reference Check:`)
console.log(`  URL Project Ref: ${urlProjectRef}`)
console.log(`  Token Project Ref: ${servicePayload?.ref}`)
console.log(`  Match: ${servicePayload?.ref === urlProjectRef}`)
