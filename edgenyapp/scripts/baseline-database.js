#!/usr/bin/env node

/**
 * Database Baseline Script for LayerEdge Community Platform
 * 
 * This script resolves the P3005 Prisma migration error by establishing
 * a baseline for existing database schemas. It's designed to handle
 * production deployments where the database already contains tables
 * that weren't created through Prisma migrations.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

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

async function checkDatabaseConnection() {
  logStep('CONNECTION', 'Testing database connection...');
  
  const result = execCommand('npx prisma db execute --stdin', {
    input: 'SELECT 1 as test;'
  });
  
  if (!result.success) {
    throw new Error(`Database connection failed: ${result.error}`);
  }
  
  logSuccess('Database connection established');
  return true;
}

async function checkExistingTables() {
  logStep('SCHEMA', 'Checking existing database schema...');
  
  const checkTablesQuery = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('User', 'Tweet', 'Account', 'Session', 'PointsHistory', 'VerificationToken')
    ORDER BY table_name;
  `;
  
  const result = execCommand('npx prisma db execute --stdin', {
    input: checkTablesQuery
  });
  
  if (!result.success) {
    logWarning('Could not check existing tables - assuming empty database');
    return [];
  }
  
  // Parse the output to extract table names
  const tables = [];
  if (result.output) {
    const lines = result.output.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.includes('table_name') && !trimmed.includes('---')) {
        tables.push(trimmed);
      }
    }
  }
  
  if (tables.length > 0) {
    logWarning(`Found existing tables: ${tables.join(', ')}`);
    return tables;
  } else {
    logSuccess('No existing tables found - database appears to be empty');
    return [];
  }
}

async function getMigrationStatus() {
  logStep('MIGRATIONS', 'Checking migration status...');
  
  const result = execCommand('npx prisma migrate status');
  
  return {
    success: result.success,
    output: result.output,
    error: result.error,
    stderr: result.stderr
  };
}

async function baselineDatabase() {
  logStep('BASELINE', 'Establishing database baseline...');
  
  // Try to resolve migrations by marking them as applied
  const result = execCommand('npx prisma migrate resolve --applied "20250526015806_initial_supabase_setup"');
  
  if (result.success) {
    logSuccess('Successfully marked initial migration as applied');
    
    // Try to resolve other migrations
    const migrations = [
      '20250526020000_add_engagement_tracking',
      '20250526112137_add_automatic_monitoring',
      '20250526180708_remove_email_unique_constraint',
      '20250526200000_add_scalability_indexes'
    ];
    
    for (const migration of migrations) {
      const migrationResult = execCommand(`npx prisma migrate resolve --applied "${migration}"`);
      if (migrationResult.success) {
        logSuccess(`Marked migration ${migration} as applied`);
      } else {
        logWarning(`Could not mark migration ${migration} as applied: ${migrationResult.error}`);
      }
    }
    
    return true;
  } else {
    logWarning(`Baseline resolution failed: ${result.error}`);
    return false;
  }
}

async function deployPendingMigrations() {
  logStep('DEPLOY', 'Deploying any pending migrations...');
  
  const result = execCommand('npx prisma migrate deploy');
  
  if (result.success) {
    logSuccess('All migrations deployed successfully');
    return true;
  } else {
    // Check if it's just "no pending migrations"
    if (result.stderr && result.stderr.includes('No pending migrations')) {
      logSuccess('No pending migrations to deploy');
      return true;
    }
    
    logError(`Migration deployment failed: ${result.error}`);
    return false;
  }
}

async function main() {
  log(`${colors.bright}🗄️  LayerEdge Database Baseline Tool${colors.reset}\n`);
  
  try {
    // Step 1: Check database connection
    await checkDatabaseConnection();
    
    // Step 2: Check existing tables
    const existingTables = await checkExistingTables();
    
    // Step 3: Check migration status
    const migrationStatus = await getMigrationStatus();
    
    // Step 4: Handle different scenarios
    if (existingTables.length > 0 && !migrationStatus.success) {
      // Database has tables but migrations are not properly tracked
      logStep('SCENARIO', 'Detected existing database with untracked schema');
      
      if (migrationStatus.error && migrationStatus.error.includes('P3005')) {
        logStep('P3005', 'Resolving P3005 error by establishing baseline...');
        const baselined = await baselineDatabase();
        
        if (!baselined) {
          throw new Error('Failed to establish database baseline');
        }
      }
    }
    
    // Step 5: Deploy any pending migrations
    await deployPendingMigrations();
    
    // Step 6: Generate Prisma client
    logStep('GENERATE', 'Generating Prisma client...');
    const generateResult = execCommand('npx prisma generate');
    
    if (!generateResult.success) {
      throw new Error(`Prisma client generation failed: ${generateResult.error}`);
    }
    
    logSuccess('Prisma client generated successfully');
    
    log(`\n${colors.green}${colors.bright}🎉 Database baseline completed successfully!${colors.reset}`);
    log(`${colors.cyan}✅ Database is ready for the LayerEdge application${colors.reset}\n`);
    
  } catch (error) {
    log(`\n${colors.red}${colors.bright}💥 Database baseline failed!${colors.reset}`);
    logError(error.message);
    
    log(`\n${colors.yellow}🔧 Troubleshooting tips:${colors.reset}`);
    log(`${colors.yellow}   1. Verify DATABASE_URL is correctly set${colors.reset}`);
    log(`${colors.yellow}   2. Ensure database is accessible from this environment${colors.reset}`);
    log(`${colors.yellow}   3. Check if database user has sufficient permissions${colors.reset}`);
    log(`${colors.yellow}   4. Try running: npx prisma db pull && npx prisma migrate diff${colors.reset}\n`);
    
    process.exit(1);
  }
}

// Handle async execution
main().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});
