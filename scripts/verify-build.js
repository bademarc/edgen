#!/usr/bin/env node

/**
 * Build verification script for LayerEdge production deployment
 * Checks TypeScript compilation and build process
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'pipe',
      shell: true,
      ...options
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`Command failed with code ${code}\nStderr: ${stderr}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function verifyBuild() {
  console.log('🚀 LayerEdge Build Verification\n');
  
  try {
    // Step 1: TypeScript type checking
    console.log('1. 🔍 TypeScript Type Checking...');
    await runCommand('npx', ['tsc', '--noEmit']);
    console.log('✅ TypeScript compilation passed\n');
    
    // Step 2: Next.js build (dry run)
    console.log('2. 🏗️ Next.js Build Test...');
    await runCommand('npm', ['run', 'build']);
    console.log('✅ Next.js build completed successfully\n');
    
    // Step 3: Check debug endpoints exist
    console.log('3. 📁 Checking debug endpoints...');
    const debugEndpoints = [
      'src/app/api/debug/data-check/route.ts',
      'src/app/api/debug/db-test/route.ts',
      'src/app/api/debug/seed-data/route.ts'
    ];
    
    for (const endpoint of debugEndpoints) {
      if (fs.existsSync(endpoint)) {
        console.log(`✅ ${endpoint} exists`);
      } else {
        throw new Error(`❌ Missing endpoint: ${endpoint}`);
      }
    }
    
    console.log('\n🎉 BUILD VERIFICATION SUCCESSFUL!');
    console.log('✅ All TypeScript errors fixed');
    console.log('✅ Production build passes');
    console.log('✅ Debug endpoints ready');
    console.log('\n📋 Next Steps:');
    console.log('1. Deploy to Koyeb/Heroku');
    console.log('2. Test debug endpoints on production');
    console.log('3. Seed data if database is empty');
    console.log('4. Verify statistics display correctly');
    
  } catch (error) {
    console.error('\n❌ BUILD VERIFICATION FAILED!');
    console.error('Error:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Check TypeScript errors in the output above');
    console.error('2. Fix any compilation issues');
    console.error('3. Ensure all dependencies are installed');
    console.error('4. Run npm install if needed');
    process.exit(1);
  }
}

// Run verification
verifyBuild().catch(console.error);
