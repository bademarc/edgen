#!/usr/bin/env node

/**
 * Simple Setup Verification Script
 * Quick check to ensure development environment is ready
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { platform } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔍 Verifying Development Setup...\n');

// Check platform
const os = platform();
console.log(`Platform: ${os}`);
console.log(`Node.js: ${process.version}`);

// Check critical files
const criticalFiles = [
  'package.json',
  'next.config.js',
  'tsconfig.json',
  '.env',
  'prisma/schema.prisma'
];

console.log('\n📁 Checking critical files:');
let allFilesExist = true;

for (const file of criticalFiles) {
  const filePath = join(projectRoot, file);
  const exists = existsSync(filePath);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
}

// Check directories
const criticalDirs = [
  'src',
  'src/app',
  'src/components',
  'src/lib',
  'node_modules'
];

console.log('\n📂 Checking directories:');
let allDirsExist = true;

for (const dir of criticalDirs) {
  const dirPath = join(projectRoot, dir);
  const exists = existsSync(dirPath);
  console.log(`   ${exists ? '✅' : '❌'} ${dir}/`);
  if (!exists) allDirsExist = false;
}

// Check Prisma client
const prismaClient = join(projectRoot, 'node_modules', '.prisma', 'client');
const prismaExists = existsSync(prismaClient);
console.log(`\n🗄️  Prisma client: ${prismaExists ? '✅' : '❌'}`);

// Summary
console.log('\n📋 Summary:');
if (allFilesExist && allDirsExist && prismaExists) {
  console.log('✅ Setup verification passed!');
  console.log('🚀 Ready to run: npm run dev');
} else {
  console.log('❌ Setup verification failed!');
  console.log('🔧 Run: npm run setup:dev');
  
  if (!prismaExists) {
    console.log('🔧 Run: npx prisma generate');
  }
}

console.log('\n💡 Available commands:');
console.log('   npm run dev        - Start development server');
console.log('   npm run dev:fix    - Fix development issues');
console.log('   npm run test:platform - Test cross-platform compatibility');
console.log('   npm run setup:dev  - Setup development environment');
