#!/usr/bin/env node

/**
 * Test script for platform statistics API
 * Tests both local and production endpoints
 */

const https = require('https');
const http = require('http');

async function testStatsAPI(baseUrl) {
  return new Promise((resolve, reject) => {
    const url = `${baseUrl}/api/platform/stats`;
    console.log(`🔍 Testing: ${url}`);
    
    const client = baseUrl.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}\nResponse: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testDatabaseAPI(baseUrl) {
  return new Promise((resolve, reject) => {
    const url = `${baseUrl}/api/debug/db-test`;
    console.log(`🔍 Testing DB: ${url}`);
    
    const client = baseUrl.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: parsed
          });
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}\nResponse: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runTests() {
  console.log('🚀 LayerEdge Statistics API Test\n');
  
  const testUrls = [
    'http://localhost:3000',
    'https://edgen.koyeb.app'
  ];
  
  for (const baseUrl of testUrls) {
    console.log(`\n📋 Testing: ${baseUrl}`);
    console.log('='.repeat(50));
    
    try {
      // Test database connectivity first
      console.log('\n🔍 Testing database connectivity...');
      const dbResult = await testDatabaseAPI(baseUrl);
      
      if (dbResult.status === 200) {
        console.log('✅ Database test passed');
        console.log(`📊 Users: ${dbResult.data.counts?.users || 'N/A'}`);
        console.log(`📊 Tweets: ${dbResult.data.counts?.tweets || 'N/A'}`);
        console.log(`📊 Points History: ${dbResult.data.counts?.pointsHistory || 'N/A'}`);
      } else {
        console.log(`❌ Database test failed with status: ${dbResult.status}`);
        console.log('Error:', dbResult.data);
      }
      
    } catch (error) {
      console.log(`❌ Database test failed: ${error.message}`);
    }
    
    try {
      // Test statistics API
      console.log('\n🔍 Testing statistics API...');
      const result = await testStatsAPI(baseUrl);
      
      if (result.status === 200) {
        console.log('✅ Statistics API test passed');
        console.log('📊 Response data:');
        console.log(`   Total Users: ${result.data.totalUsers}`);
        console.log(`   Total Tweets: ${result.data.totalTweets}`);
        console.log(`   Total Points: ${result.data.totalPoints}`);
        console.log(`   Active Users: ${result.data.activeUsers}`);
        console.log(`   Last Updated: ${result.data.lastUpdated}`);
        
        // Check for zero values
        const zeroFields = [];
        if (result.data.totalUsers === 0) zeroFields.push('totalUsers');
        if (result.data.totalTweets === 0) zeroFields.push('totalTweets');
        if (result.data.totalPoints === 0) zeroFields.push('totalPoints');
        
        if (zeroFields.length > 0) {
          console.log(`⚠️  Warning: Zero values detected in: ${zeroFields.join(', ')}`);
        }
        
        if (result.data.error) {
          console.log(`⚠️  API Error: ${result.data.error}`);
        }
        
      } else {
        console.log(`❌ Statistics API test failed with status: ${result.status}`);
        console.log('Response:', result.data);
      }
      
    } catch (error) {
      console.log(`❌ Statistics API test failed: ${error.message}`);
    }
  }
  
  console.log('\n🏁 Test completed');
}

// Run the tests
runTests().catch(console.error);
