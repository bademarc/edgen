#!/usr/bin/env node

/**
 * Debug script to analyze tweet ownership validation issues
 * This script helps identify mismatches between tweet author and stored user data
 */

const { PrismaClient } = require('@prisma/client')

async function debugTweetOwnership() {
  console.log('🔍 Debugging Tweet Ownership Validation')
  console.log('=' .repeat(50))

  const prisma = new PrismaClient()

  try {
    // Test user ID from the logs
    const testUserId = 'a1aa205f-efcc-4356-a128-c9acd88b0548'
    const testTweetUrl = 'https://x.com/pentestr1/status/1933007672141304207'

    console.log(`\n📋 Test Parameters:`)
    console.log(`- User ID: ${testUserId}`)
    console.log(`- Tweet URL: ${testTweetUrl}`)

    // 1. Check user data in database
    console.log(`\n🔍 Step 1: Checking user data in database...`)
    const user = await prisma.user.findUnique({
      where: { id: testUserId },
      select: {
        id: true,
        name: true,
        email: true,
        xUsername: true,
        xUserId: true,
        image: true,
        totalPoints: true
      }
    })

    if (!user) {
      console.log(`❌ User not found in database: ${testUserId}`)
      return
    }

    console.log(`✅ User found:`)
    console.log(`   - Name: ${user.name}`)
    console.log(`   - Email: ${user.email}`)
    console.log(`   - X Username: ${user.xUsername}`)
    console.log(`   - X User ID: ${user.xUserId}`)
    console.log(`   - Total Points: ${user.totalPoints}`)

    // 2. Extract username from tweet URL
    console.log(`\n🔍 Step 2: Extracting username from tweet URL...`)
    const urlMatch = testTweetUrl.match(/(?:twitter\.com|x\.com)\/([^\/]+)\/status\//)
    const urlUsername = urlMatch ? urlMatch[1] : null
    
    console.log(`✅ Username from URL: ${urlUsername}`)

    // 3. Simulate oEmbed data extraction
    console.log(`\n🔍 Step 3: Simulating oEmbed data extraction...`)
    
    try {
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(testTweetUrl)}&omit_script=true`
      console.log(`   Making request to: ${oembedUrl}`)
      
      const response = await fetch(oembedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LayerEdge/1.0)',
        },
        signal: AbortSignal.timeout(10000)
      })

      if (response.ok) {
        const oembedData = await response.json()
        console.log(`✅ oEmbed data retrieved:`)
        console.log(`   - Author Name: ${oembedData.author_name}`)
        console.log(`   - Author URL: ${oembedData.author_url}`)
        console.log(`   - Provider: ${oembedData.provider_name}`)

        // Extract username from author_url
        const authorUrlMatch = oembedData.author_url?.match(/(?:twitter\.com|x\.com)\/([^\/\?]+)/)
        const oembedUsername = authorUrlMatch ? authorUrlMatch[1] : oembedData.author_name

        console.log(`   - Extracted Username: ${oembedUsername}`)

        // 4. Compare usernames
        console.log(`\n🔍 Step 4: Comparing usernames...`)
        console.log(`   - User's stored xUsername: "${user.xUsername}"`)
        console.log(`   - Tweet URL username: "${urlUsername}"`)
        console.log(`   - oEmbed username: "${oembedUsername}"`)

        // Case-insensitive comparison
        const storedUsername = user.xUsername?.toLowerCase()
        const tweetUrlUsername = urlUsername?.toLowerCase()
        const oembedUsernameNormalized = oembedUsername?.toLowerCase()

        console.log(`\n📊 Normalized comparison:`)
        console.log(`   - Stored (normalized): "${storedUsername}"`)
        console.log(`   - URL (normalized): "${tweetUrlUsername}"`)
        console.log(`   - oEmbed (normalized): "${oembedUsernameNormalized}"`)

        const urlMatch = storedUsername === tweetUrlUsername
        const oembedMatch = storedUsername === oembedUsernameNormalized

        console.log(`\n✅ Match Results:`)
        console.log(`   - URL username matches: ${urlMatch ? '✅ YES' : '❌ NO'}`)
        console.log(`   - oEmbed username matches: ${oembedMatch ? '✅ YES' : '❌ NO'}`)

        // 5. Identify the issue
        console.log(`\n🎯 Issue Analysis:`)
        if (!user.xUsername) {
          console.log(`❌ ISSUE: User has no xUsername stored in database`)
          console.log(`   - This suggests the user authentication didn't properly capture the Twitter username`)
          console.log(`   - The user needs to re-authenticate with Twitter`)
        } else if (!urlMatch && !oembedMatch) {
          console.log(`❌ ISSUE: Username mismatch detected`)
          console.log(`   - The tweet is from @${urlUsername || oembedUsername}`)
          console.log(`   - But the user is authenticated as @${user.xUsername}`)
          console.log(`   - This is a legitimate security check - user cannot submit other users' tweets`)
        } else {
          console.log(`✅ NO ISSUE: Usernames match correctly`)
          console.log(`   - The validation should pass`)
        }

      } else {
        console.log(`❌ oEmbed request failed: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.log(`❌ oEmbed request error: ${error.message}`)
    }

    // 6. Check for similar usernames in database
    console.log(`\n🔍 Step 5: Checking for similar usernames in database...`)
    const similarUsers = await prisma.user.findMany({
      where: {
        OR: [
          { xUsername: { contains: urlUsername || '', mode: 'insensitive' } },
          { name: { contains: urlUsername || '', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        xUsername: true,
        xUserId: true
      }
    })

    if (similarUsers.length > 0) {
      console.log(`✅ Found ${similarUsers.length} similar users:`)
      similarUsers.forEach((u, index) => {
        console.log(`   ${index + 1}. ${u.name} (@${u.xUsername}) - ID: ${u.id}`)
      })
    } else {
      console.log(`❌ No similar users found`)
    }

  } catch (error) {
    console.error('❌ Debug script error:', error)
  } finally {
    await prisma.$disconnect()
  }

  console.log('\n' + '=' .repeat(50))
  console.log('🏁 Debug analysis completed')
}

// Run the debug script
if (require.main === module) {
  debugTweetOwnership().catch(console.error)
}

module.exports = { debugTweetOwnership }
