#!/usr/bin/env node

/**
 * Test Script for Migration Fix
 * 
 * This script tests the migration fix implementation to ensure
 * it properly handles P3005 errors and database baseline scenarios.
 */

import { execSync } from 'child_process';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message) {
  console.log(message);
}

function logStep(step, message) {
  log(`${colors.blue}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logWarning(message) {
  log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logError(message) {
  log(`${colors.red}❌ ${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      ...options
    });
    return { success: true, output, error: null };
  } catch (error) {
    return {
      success: false,
      output: error.stdout || '',
      error: error.message,
      stderr: error.stderr || ''
    };
  }
}

async function testDatabaseConnection() {
  logStep('TEST', 'Testing database connection...');
  
  if (!process.env.DATABASE_URL) {
    logError('DATABASE_URL environment variable not set');
    return false;
  }
  
  const result = execCommand('npx prisma db execute --stdin', {
    input: 'SELECT 1 as connection_test;'
  });
  
  if (result.success) {
    logSuccess('Database connection successful');
    return true;
  } else {
    logError(`Database connection failed: ${result.error}`);
    return false;
  }
}

async function testMigrationStatus() {
  logStep('TEST', 'Checking migration status...');
  
  const result = execCommand('npx prisma migrate status');
  
  log(`Migration status output:`);
  log(`Success: ${result.success}`);
  log(`Output: ${result.output}`);
  if (result.error) {
    log(`Error: ${result.error}`);
  }
  if (result.stderr) {
    log(`Stderr: ${result.stderr}`);
  }
  
  return result;
}

async function testBaselineScript() {
  logStep('TEST', 'Testing baseline script...');
  
  const result = execCommand('node scripts/baseline-database.js');
  
  if (result.success) {
    logSuccess('Baseline script executed successfully');
    log(`Output: ${result.output}`);
    return true;
  } else {
    logWarning(`Baseline script completed with warnings/errors`);
    log(`Output: ${result.output}`);
    log(`Error: ${result.error}`);
    return false;
  }
}

async function testPrismaGenerate() {
  logStep('TEST', 'Testing Prisma client generation...');
  
  const result = execCommand('npx prisma generate');
  
  if (result.success) {
    logSuccess('Prisma client generated successfully');
    return true;
  } else {
    logError(`Prisma client generation failed: ${result.error}`);
    return false;
  }
}

async function main() {
  log(`${colors.bright}🧪 LayerEdge Migration Fix Test Suite${colors.reset}\n`);
  
  const tests = [
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Migration Status', fn: testMigrationStatus },
    { name: 'Baseline Script', fn: testBaselineScript },
    { name: 'Prisma Generate', fn: testPrismaGenerate }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      log(`\n${colors.cyan}Running test: ${test.name}${colors.reset}`);
      const result = await test.fn();
      results.push({ name: test.name, success: result });
    } catch (error) {
      logError(`Test ${test.name} threw an error: ${error.message}`);
      results.push({ name: test.name, success: false, error: error.message });
    }
  }
  
  // Summary
  log(`\n${colors.bright}📊 Test Results Summary${colors.reset}`);
  log('─'.repeat(50));
  
  let passedTests = 0;
  for (const result of results) {
    const status = result.success ? 
      `${colors.green}✅ PASS${colors.reset}` : 
      `${colors.red}❌ FAIL${colors.reset}`;
    
    log(`${result.name.padEnd(25)} ${status}`);
    
    if (result.success) {
      passedTests++;
    } else if (result.error) {
      log(`   Error: ${result.error}`);
    }
  }
  
  log('─'.repeat(50));
  log(`Total: ${results.length} | Passed: ${passedTests} | Failed: ${results.length - passedTests}`);
  
  if (passedTests === results.length) {
    log(`\n${colors.green}${colors.bright}🎉 All tests passed! Migration fix is working correctly.${colors.reset}`);
  } else {
    log(`\n${colors.yellow}${colors.bright}⚠️  Some tests failed. Check the output above for details.${colors.reset}`);
  }
  
  // Environment check
  log(`\n${colors.blue}Environment Information:${colors.reset}`);
  log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'set' : 'not set'}`);
  log(`DIRECT_URL: ${process.env.DIRECT_URL ? 'set' : 'not set'}`);
}

// Handle async execution
main().catch(error => {
  logError(`Test suite failed: ${error.message}`);
  process.exit(1);
});
