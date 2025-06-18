#!/usr/bin/env node

/**
 * Production Build Verification Script
 * Verifies that all critical components are ready for production deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 LayerEdge Production Build Verification\n');

const checks = [
  {
    name: 'TypeScript Compilation',
    command: 'npx tsc --noEmit --skipLibCheck',
    description: 'Checking for TypeScript errors'
  },
  {
    name: 'Next.js Build',
    command: 'npm run build',
    description: 'Building production bundle'
  },
  {
    name: 'ESLint Check',
    command: 'npm run lint',
    description: 'Checking code quality'
  }
];

const fileChecks = [
  {
    name: 'Database Optimization',
    file: 'src/lib/db-optimized.ts',
    description: 'Verifying database optimization exists'
  },
  {
    name: 'Production Environment Template',
    file: '.env.production.example',
    description: 'Verifying production environment template'
  },
  {
    name: 'Docker Configuration',
    file: 'Dockerfile',
    description: 'Verifying Docker configuration'
  },
  {
    name: 'Nginx Configuration',
    file: 'nginx.conf',
    description: 'Verifying load balancer configuration'
  }
];

let allPassed = true;

// Run command checks
console.log('📋 Running Build Checks:\n');

for (const check of checks) {
  try {
    console.log(`⏳ ${check.description}...`);
    execSync(check.command, { stdio: 'pipe' });
    console.log(`✅ ${check.name}: PASSED\n`);
  } catch (error) {
    console.log(`❌ ${check.name}: FAILED`);
    console.log(`   Error: ${error.message}\n`);
    allPassed = false;
  }
}

// Run file checks
console.log('📁 Checking Required Files:\n');

for (const check of fileChecks) {
  const filePath = path.join(process.cwd(), check.file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${check.name}: EXISTS`);
  } else {
    console.log(`❌ ${check.name}: MISSING`);
    console.log(`   File: ${check.file}`);
    allPassed = false;
  }
}

// Performance optimizations check
console.log('\n🔧 Checking Performance Optimizations:\n');

const optimizations = [
  {
    name: 'Rate Limiting',
    file: 'src/app/api/tweets/route.ts',
    pattern: 'checkRateLimit',
    description: 'API rate limiting implementation'
  },
  {
    name: 'Database Batch Updates',
    file: 'src/app/api/leaderboard/route.ts',
    pattern: 'executeRaw',
    description: 'Batch database updates for leaderboard'
  },
  {
    name: 'Bundle Optimization',
    file: 'next.config.js',
    pattern: 'optimizePackageImports',
    description: 'Bundle size optimization'
  }
];

for (const opt of optimizations) {
  const filePath = path.join(process.cwd(), opt.file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(opt.pattern)) {
      console.log(`✅ ${opt.name}: IMPLEMENTED`);
    } else {
      console.log(`⚠️  ${opt.name}: NOT FOUND`);
      console.log(`   Expected pattern: ${opt.pattern}`);
    }
  } else {
    console.log(`❌ ${opt.name}: FILE MISSING`);
    allPassed = false;
  }
}

// Final result
console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('🎉 ALL CHECKS PASSED - READY FOR PRODUCTION DEPLOYMENT!');
  console.log('\nNext Steps:');
  console.log('1. Configure production environment variables');
  console.log('2. Set up monitoring and alerting');
  console.log('3. Deploy to production environment');
  console.log('4. Monitor performance metrics');
  process.exit(0);
} else {
  console.log('❌ SOME CHECKS FAILED - PLEASE FIX BEFORE DEPLOYMENT');
  console.log('\nReview the failed checks above and fix them before deploying.');
  process.exit(1);
}
