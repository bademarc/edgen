const https = require('https')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Testing Supabase API Connection\n')
console.log(`URL: ${supabaseUrl}`)
console.log(`Service Key Length: ${serviceKey?.length}`)
console.log(`Service Key Preview: ${serviceKey?.substring(0, 50)}...`)

// Test the auth admin endpoint directly
function testAuthAdmin() {
  return new Promise((resolve, reject) => {
    const url = `${supabaseUrl}/auth/v1/admin/users`
    
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceKey
      }
    }

    console.log('\n🧪 Testing Auth Admin Endpoint...')
    console.log(`Making request to: ${url}`)

    const req = https.request(url, options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        console.log(`Response Status: ${res.statusCode}`)
        console.log(`Response Headers:`, res.headers)
        
        try {
          const jsonData = JSON.parse(data)
          console.log('Response Data:', JSON.stringify(jsonData, null, 2))
          resolve({ status: res.statusCode, data: jsonData })
        } catch (error) {
          console.log('Raw Response:', data)
          resolve({ status: res.statusCode, data: data })
        }
      })
    })

    req.on('error', (error) => {
      console.error('Request Error:', error)
      reject(error)
    })

    req.end()
  })
}

// Test database endpoint
function testDatabase() {
  return new Promise((resolve, reject) => {
    const url = `${supabaseUrl}/rest/v1/User?select=id,name&limit=5`
    
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceKey
      }
    }

    console.log('\n🧪 Testing Database Endpoint...')
    console.log(`Making request to: ${url}`)

    const req = https.request(url, options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        console.log(`Response Status: ${res.statusCode}`)
        
        try {
          const jsonData = JSON.parse(data)
          console.log('Response Data:', JSON.stringify(jsonData, null, 2))
          resolve({ status: res.statusCode, data: jsonData })
        } catch (error) {
          console.log('Raw Response:', data)
          resolve({ status: res.statusCode, data: data })
        }
      })
    })

    req.on('error', (error) => {
      console.error('Request Error:', error)
      reject(error)
    })

    req.end()
  })
}

async function runTests() {
  try {
    await testAuthAdmin()
    await testDatabase()
    console.log('\n✅ API tests completed!')
  } catch (error) {
    console.error('\n❌ API tests failed:', error)
  }
}

runTests()
