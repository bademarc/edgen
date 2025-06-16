#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SECURE_PATH = process.env.ADMIN_OBFUSCATED_PATH || 'secure-mgmt-portal-x7k9';

console.log('🔒 Admin Security Test Suite');
console.log('============================\n');

async function makeRequest(path, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AdminSecurityTest/1.0',
        ...headers
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testOldAdminPaths() {
  console.log('🚫 Testing Old Admin Path Blocking...');
  
  const oldPaths = [
    '/admin',
    '/admin/',
    '/admin/moderation',
    '/api/admin',
    '/api/admin/',
    '/api/admin/moderation'
  ];

  for (const path of oldPaths) {
    try {
      const response = await makeRequest(path);
      const status = response.status === 404 ? '✅ BLOCKED' : '❌ ACCESSIBLE';
      console.log(`  ${path}: ${status} (${response.status})`);
    } catch (error) {
      console.log(`  ${path}: ✅ BLOCKED (Connection refused)`);
    }
  }
  console.log();
}

async function testSecurePathAccess() {
  console.log('🔐 Testing Secure Path Access...');
  
  try {
    const response = await makeRequest(`/${SECURE_PATH}`);
    console.log(`  /${SECURE_PATH}: Status ${response.status}`);
    
    if (response.status === 401 || response.status === 403) {
      console.log('  ✅ Properly protected - authentication required');
    } else if (response.status === 200) {
      console.log('  ⚠️  Accessible - check authentication');
    } else {
      console.log(`  ❓ Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log(`  ❌ Error accessing secure path: ${error.message}`);
  }
  console.log();
}

async function testAPISecurePathAccess() {
  console.log('🔐 Testing Secure API Path Access...');
  
  try {
    const response = await makeRequest(`/api/${SECURE_PATH}`);
    console.log(`  /api/${SECURE_PATH}: Status ${response.status}`);
    
    if (response.status === 401 || response.status === 403) {
      console.log('  ✅ Properly protected - authentication required');
    } else if (response.status === 200) {
      console.log('  ⚠️  Accessible - check authentication');
    } else {
      console.log(`  ❓ Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log(`  ❌ Error accessing secure API path: ${error.message}`);
  }
  console.log();
}

async function testSecurityHeaders() {
  console.log('🛡️  Testing Security Headers...');
  
  try {
    const response = await makeRequest(`/${SECURE_PATH}`);
    const headers = response.headers;
    
    const securityHeaders = [
      'x-robots-tag',
      'cache-control',
      'x-frame-options',
      'x-content-type-options'
    ];

    securityHeaders.forEach(header => {
      if (headers[header]) {
        console.log(`  ✅ ${header}: ${headers[header]}`);
      } else {
        console.log(`  ❌ Missing header: ${header}`);
      }
    });
  } catch (error) {
    console.log(`  ❌ Error checking headers: ${error.message}`);
  }
  console.log();
}

async function testRateLimiting() {
  console.log('⏱️  Testing Rate Limiting...');
  
  console.log('  Making multiple rapid requests to secure path...');
  
  const requests = [];
  for (let i = 0; i < 5; i++) {
    requests.push(makeRequest(`/api/${SECURE_PATH}`));
  }
  
  try {
    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status === 429);
    
    if (rateLimited) {
      console.log('  ✅ Rate limiting is working');
    } else {
      console.log('  ⚠️  Rate limiting may not be configured');
    }
    
    console.log(`  Response codes: ${responses.map(r => r.status).join(', ')}`);
  } catch (error) {
    console.log(`  ❌ Error testing rate limiting: ${error.message}`);
  }
  console.log();
}

async function testPasswordAuthentication() {
  console.log('🔑 Testing Password Authentication...');
  
  try {
    // Test without password
    const response1 = await makeRequest(`/api/${SECURE_PATH}`, 'POST', {}, {
      action: 'authenticate'
    });
    
    console.log(`  Without password: Status ${response1.status}`);
    
    // Test with invalid password
    const response2 = await makeRequest(`/api/${SECURE_PATH}`, 'POST', {}, {
      action: 'authenticate',
      password: 'invalid-password'
    });
    
    console.log(`  With invalid password: Status ${response2.status}`);
    
    if (response1.status === 401 && response2.status === 401) {
      console.log('  ✅ Password authentication is working');
    } else {
      console.log('  ⚠️  Password authentication may need verification');
    }
  } catch (error) {
    console.log(`  ❌ Error testing password auth: ${error.message}`);
  }
  console.log();
}

async function runAllTests() {
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Secure path: ${SECURE_PATH}\n`);
  
  await testOldAdminPaths();
  await testSecurePathAccess();
  await testAPISecurePathAccess();
  await testSecurityHeaders();
  await testRateLimiting();
  await testPasswordAuthentication();
  
  console.log('🏁 Security Test Suite Complete');
  console.log('================================');
  console.log('Review the results above to ensure all security measures are working correctly.');
  console.log('For any ❌ or ⚠️  items, check your configuration and server setup.');
}

// Run tests
runAllTests().catch(console.error);
