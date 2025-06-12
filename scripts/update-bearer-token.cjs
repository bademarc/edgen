#!/usr/bin/env node

/**
 * Update Bearer Token Script
 * Generates a new Bearer token and updates the .env file
 */

const fs = require('fs')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config()

async function updateBearerToken() {
  console.log('🔄 Updating Bearer Token in .env file...\n')

  try {
    // Step 1: Generate new Bearer token
    console.log('1️⃣ Generating new Bearer token...')
    
    const apiKey = process.env.TWITTER_API_KEY
    const apiSecret = process.env.TWITTER_API_SECRET
    
    if (!apiKey || !apiSecret) {
      console.log('❌ API Key and Secret are required')
      return false
    }

    const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
    
    const response = await fetch('https://api.twitter.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })

    if (!response.ok) {
      console.log('❌ Failed to generate new Bearer token')
      return false
    }

    const tokenData = await response.json()
    const newBearerToken = tokenData.access_token

    if (!newBearerToken) {
      console.log('❌ No access token received')
      return false
    }

    console.log('✅ New Bearer token generated successfully')

    // Step 2: Test the new token
    console.log('2️⃣ Testing new Bearer token...')
    
    const testResponse = await fetch('https://api.twitter.com/2/users/by/username/twitter', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${newBearerToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!testResponse.ok && testResponse.status !== 429) {
      console.log('❌ New Bearer token test failed')
      return false
    }

    console.log('✅ New Bearer token test successful')

    // Step 3: Update .env file
    console.log('3️⃣ Updating .env file...')
    
    const envPath = '.env'
    
    if (!fs.existsSync(envPath)) {
      console.log('❌ .env file not found')
      return false
    }

    let envContent = fs.readFileSync(envPath, 'utf8')
    
    // Replace the Bearer token line
    const bearerTokenRegex = /^TWITTER_BEARER_TOKEN=.*$/m
    
    if (bearerTokenRegex.test(envContent)) {
      envContent = envContent.replace(bearerTokenRegex, `TWITTER_BEARER_TOKEN=${newBearerToken}`)
      console.log('✅ Updated existing TWITTER_BEARER_TOKEN')
    } else {
      // Add the Bearer token if it doesn't exist
      envContent += `\nTWITTER_BEARER_TOKEN=${newBearerToken}\n`
      console.log('✅ Added new TWITTER_BEARER_TOKEN')
    }

    // Write the updated content back to .env
    fs.writeFileSync(envPath, envContent, 'utf8')
    console.log('✅ .env file updated successfully')

    // Step 4: Verify the update
    console.log('4️⃣ Verifying update...')
    
    // Reload environment variables
    delete require.cache[require.resolve('dotenv')]
    dotenv.config()
    
    const updatedToken = process.env.TWITTER_BEARER_TOKEN
    
    if (updatedToken === newBearerToken) {
      console.log('✅ Bearer token update verified')
      
      const tokenPreview = newBearerToken.substring(0, 20) + '...' + newBearerToken.substring(newBearerToken.length - 10)
      console.log(`📋 New token preview: ${tokenPreview}`)
      
      return true
    } else {
      console.log('❌ Bearer token update verification failed')
      return false
    }

  } catch (error) {
    console.error(`❌ Error updating Bearer token: ${error.message}`)
    return false
  }
}

// Run the update script
updateBearerToken()
  .then(success => {
    if (success) {
      console.log('\n🎉 Bearer token updated successfully!')
      console.log('\n🔧 Next steps:')
      console.log('1. Restart the development server')
      console.log('2. Test the simplified services')
      console.log('3. Test tweet submission functionality')
      process.exit(0)
    } else {
      console.log('\n❌ Failed to update Bearer token.')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('\n💥 Update script failed:', error)
    process.exit(1)
  })
