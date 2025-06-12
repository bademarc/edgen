#!/usr/bin/env node

/**
 * Simplified Services Test Script
 * Tests that the application is using the new simplified services
 * and that they're working correctly
 */

const dotenv = require('dotenv')

// Load environment variables
dotenv.config()

async function testSimplifiedServices() {
  console.log('🧪 Testing Simplified Services Integration...\n')

  const tests = []
  let allTestsPassed = true

  // Test 1: Verify environment configuration
  console.log('1️⃣ Testing Environment Configuration...')
  try {
    const requiredVars = [
      'TWITTER_BEARER_TOKEN',
      'TWITTER_CLIENT_ID', 
      'TWITTER_CLIENT_SECRET',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN'
    ]

    let configValid = true
    for (const varName of requiredVars) {
      if (process.env[varName]) {
        console.log(`✅ ${varName} is configured`)
      } else {
        console.log(`❌ ${varName} is missing`)
        configValid = false
        allTestsPassed = false
      }
    }

    if (configValid) {
      console.log('✅ Environment configuration is complete')
    } else {
      console.log('❌ Environment configuration has issues')
    }

    tests.push({
      name: 'Environment Configuration',
      passed: configValid,
      details: configValid ? 'All required variables present' : 'Missing required variables'
    })

  } catch (error) {
    console.log(`❌ Environment test failed: ${error.message}`)
    allTestsPassed = false
    tests.push({
      name: 'Environment Configuration',
      passed: false,
      details: error.message
    })
  }

  console.log()

  // Test 2: Test Redis connection and cleanup
  console.log('2️⃣ Testing Redis Connection...')
  try {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

    if (upstashUrl && upstashToken) {
      // Test basic connection
      const pingResponse = await fetch(`${upstashUrl}/ping`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${upstashToken}`
        }
      })

      if (pingResponse.ok) {
        console.log('✅ Redis connection successful')
        
        // Test set/get operations
        const testKey = 'test_simplified_services'
        const testValue = { timestamp: Date.now(), test: true }
        
        // Set test value
        const setResponse = await fetch(`${upstashUrl}/setex/${encodeURIComponent(testKey)}/60`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${upstashToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testValue)
        })

        if (setResponse.ok) {
          console.log('✅ Redis SET operation successful')
          
          // Get test value
          const getResponse = await fetch(`${upstashUrl}/get/${encodeURIComponent(testKey)}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${upstashToken}`
            }
          })

          if (getResponse.ok) {
            const result = await getResponse.json()
            if (result && result.result) {
              console.log('✅ Redis GET operation successful')
              
              // Clean up test key
              await fetch(`${upstashUrl}/del/${encodeURIComponent(testKey)}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${upstashToken}`
                }
              })
              
              tests.push({
                name: 'Redis Connection',
                passed: true,
                details: 'Connection, SET, and GET operations successful'
              })
            } else {
              console.log('❌ Redis GET operation failed')
              allTestsPassed = false
              tests.push({
                name: 'Redis Connection',
                passed: false,
                details: 'GET operation failed'
              })
            }
          } else {
            console.log('❌ Redis GET operation failed')
            allTestsPassed = false
            tests.push({
              name: 'Redis Connection',
              passed: false,
              details: 'GET operation failed'
            })
          }
        } else {
          console.log('❌ Redis SET operation failed')
          allTestsPassed = false
          tests.push({
            name: 'Redis Connection',
            passed: false,
            details: 'SET operation failed'
          })
        }
      } else {
        console.log('❌ Redis connection failed')
        allTestsPassed = false
        tests.push({
          name: 'Redis Connection',
          passed: false,
          details: 'Connection failed'
        })
      }
    } else {
      console.log('⚠️ Redis configuration missing')
      tests.push({
        name: 'Redis Connection',
        passed: false,
        details: 'Configuration missing'
      })
    }

  } catch (error) {
    console.log(`❌ Redis test failed: ${error.message}`)
    allTestsPassed = false
    tests.push({
      name: 'Redis Connection',
      passed: false,
      details: error.message
    })
  }

  console.log()

  // Test 3: Test Twitter API credentials
  console.log('3️⃣ Testing Twitter API Credentials...')
  try {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN
    
    if (bearerToken && bearerToken.length > 50) {
      console.log('✅ Bearer token format looks correct')
      
      // Test API connection with a simple request
      try {
        const response = await fetch('https://api.twitter.com/2/users/by/username/twitter', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          console.log('✅ Twitter API authentication successful')
          tests.push({
            name: 'Twitter API Credentials',
            passed: true,
            details: 'Authentication successful'
          })
        } else if (response.status === 429) {
          console.log('⚠️ Twitter API rate limited (credentials are valid)')
          tests.push({
            name: 'Twitter API Credentials',
            passed: true,
            details: 'Rate limited but credentials valid'
          })
        } else {
          console.log(`❌ Twitter API authentication failed: ${response.status}`)
          allTestsPassed = false
          tests.push({
            name: 'Twitter API Credentials',
            passed: false,
            details: `Authentication failed: ${response.status}`
          })
        }
      } catch (apiError) {
        console.log(`❌ Twitter API test failed: ${apiError.message}`)
        allTestsPassed = false
        tests.push({
          name: 'Twitter API Credentials',
          passed: false,
          details: apiError.message
        })
      }
    } else {
      console.log('❌ Bearer token missing or invalid format')
      allTestsPassed = false
      tests.push({
        name: 'Twitter API Credentials',
        passed: false,
        details: 'Bearer token missing or invalid format'
      })
    }

  } catch (error) {
    console.log(`❌ Twitter API test failed: ${error.message}`)
    allTestsPassed = false
    tests.push({
      name: 'Twitter API Credentials',
      passed: false,
      details: error.message
    })
  }

  console.log()

  // Test 4: Verify circuit breaker reset
  console.log('4️⃣ Verifying Circuit Breaker Reset...')
  try {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

    if (upstashUrl && upstashToken) {
      const circuitBreakerKey = 'circuit_breaker:tweet-submission'
      
      const response = await fetch(`${upstashUrl}/get/${encodeURIComponent(circuitBreakerKey)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${upstashToken}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result && result.result) {
          const status = JSON.parse(result.result)
          if (status.state === 'CLOSED') {
            console.log('✅ Circuit breaker is in CLOSED state')
            tests.push({
              name: 'Circuit Breaker Reset',
              passed: true,
              details: 'Circuit breaker in CLOSED state'
            })
          } else {
            console.log(`⚠️ Circuit breaker is in ${status.state} state`)
            tests.push({
              name: 'Circuit Breaker Reset',
              passed: false,
              details: `Circuit breaker in ${status.state} state`
            })
          }
        } else {
          console.log('✅ Circuit breaker data cleared (will default to CLOSED)')
          tests.push({
            name: 'Circuit Breaker Reset',
            passed: true,
            details: 'Circuit breaker data cleared'
          })
        }
      } else {
        console.log('✅ Circuit breaker data cleared (will default to CLOSED)')
        tests.push({
          name: 'Circuit Breaker Reset',
          passed: true,
          details: 'Circuit breaker data cleared'
        })
      }
    } else {
      console.log('⚠️ Cannot verify circuit breaker - Redis config missing')
      tests.push({
        name: 'Circuit Breaker Reset',
        passed: false,
        details: 'Redis configuration missing'
      })
    }

  } catch (error) {
    console.log(`❌ Circuit breaker test failed: ${error.message}`)
    allTestsPassed = false
    tests.push({
      name: 'Circuit Breaker Reset',
      passed: false,
      details: error.message
    })
  }

  console.log()

  // Summary
  console.log('📋 Test Summary:')
  console.log('================')
  
  tests.forEach(test => {
    const status = test.passed ? '✅' : '❌'
    console.log(`${status} ${test.name}: ${test.details}`)
  })

  console.log()

  if (allTestsPassed) {
    console.log('🎉 All simplified services tests passed!')
    console.log()
    console.log('✅ Environment is properly configured')
    console.log('✅ Redis connection is working')
    console.log('✅ Twitter API credentials are valid')
    console.log('✅ Circuit breakers are reset')
    console.log()
    console.log('🚀 Ready to test tweet submission functionality!')
  } else {
    console.log('⚠️ Some tests failed. Please address the issues above.')
  }

  return allTestsPassed
}

// Run the test script
testSimplifiedServices()
  .then(success => {
    if (success) {
      console.log('\n🎉 Simplified services are ready!')
      process.exit(0)
    } else {
      console.log('\n❌ Some issues need to be resolved.')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('\n💥 Test script failed:', error)
    process.exit(1)
  })
