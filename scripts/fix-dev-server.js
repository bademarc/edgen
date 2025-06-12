#!/usr/bin/env node

/**
 * Development Server Diagnostic and Fix Script
 * Fixes common issues with Next.js development server on macOS and Windows
 */

import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { platform } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`${colors.cyan}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logWarning(message) {
  log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      cwd: projectRoot,
      stdio: 'pipe',
      encoding: 'utf8',
      ...options
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout?.trim() || '',
      stderr: error.stderr?.trim() || ''
    };
  }
}

function checkSystemInfo() {
  logStep('SYSTEM', 'Checking system information...');
  
  const os = platform();
  const nodeVersion = process.version;
  
  log(`   OS: ${os}`);
  log(`   Node.js: ${nodeVersion}`);
  
  // Check npm version
  const npmResult = execCommand('npm --version');
  if (npmResult.success) {
    log(`   npm: v${npmResult.output}`);
  }
  
  // Check if we're on macOS
  if (os === 'darwin') {
    logSuccess('Running on macOS - applying macOS-specific fixes');
    return 'macos';
  } else if (os === 'win32') {
    logSuccess('Running on Windows - applying Windows-specific fixes');
    return 'windows';
  } else {
    logSuccess('Running on Linux/Unix - applying standard fixes');
    return 'linux';
  }
}

function checkDependencies() {
  logStep('DEPS', 'Checking dependencies...');
  
  const packageJsonPath = join(projectRoot, 'package.json');
  if (!existsSync(packageJsonPath)) {
    throw new Error('package.json not found');
  }
  
  const nodeModulesPath = join(projectRoot, 'node_modules');
  if (!existsSync(nodeModulesPath)) {
    logWarning('node_modules not found - running npm install...');
    const installResult = execCommand('npm install');
    if (!installResult.success) {
      throw new Error(`npm install failed: ${installResult.error}`);
    }
    logSuccess('Dependencies installed');
  } else {
    logSuccess('Dependencies found');
  }
  
  // Check for Next.js
  const nextPath = join(projectRoot, 'node_modules', '.bin', 'next');
  const nextPathWin = join(projectRoot, 'node_modules', '.bin', 'next.cmd');
  
  if (!existsSync(nextPath) && !existsSync(nextPathWin)) {
    logWarning('Next.js binary not found - reinstalling...');
    const reinstallResult = execCommand('npm install next@latest');
    if (!reinstallResult.success) {
      throw new Error(`Next.js reinstall failed: ${reinstallResult.error}`);
    }
    logSuccess('Next.js reinstalled');
  } else {
    logSuccess('Next.js found');
  }
}

function checkPrismaSetup() {
  logStep('PRISMA', 'Checking Prisma setup...');
  
  const prismaClientPath = join(projectRoot, 'node_modules', '.prisma', 'client');
  
  if (!existsSync(prismaClientPath)) {
    logWarning('Prisma client not generated - generating...');
    const generateResult = execCommand('npx prisma generate');
    if (!generateResult.success) {
      logError(`Prisma generate failed: ${generateResult.error}`);
      // Try alternative approach
      logStep('PRISMA', 'Trying alternative Prisma generation...');
      const altResult = execCommand('npm run db:generate');
      if (!altResult.success) {
        throw new Error(`Prisma client generation failed: ${altResult.error}`);
      }
    }
    logSuccess('Prisma client generated');
  } else {
    logSuccess('Prisma client found');
  }
}

function cleanupDevFiles(osType) {
  logStep('CLEANUP', 'Cleaning up development files...');
  
  const filesToClean = [
    '.next',
    '.next/cache',
    'node_modules/.cache'
  ];
  
  for (const file of filesToClean) {
    const filePath = join(projectRoot, file);
    if (existsSync(filePath)) {
      try {
        rmSync(filePath, { recursive: true, force: true });
        log(`   Removed: ${file}`);
      } catch (error) {
        logWarning(`Could not remove ${file}: ${error.message}`);
      }
    }
  }
  
  // macOS specific cleanup
  if (osType === 'macos') {
    // Clear any macOS specific caches
    const macCaches = [
      '~/Library/Caches/npm',
      '~/Library/Caches/yarn'
    ];
    
    for (const cache of macCaches) {
      try {
        execCommand(`rm -rf ${cache}`);
      } catch (error) {
        // Ignore errors for cache cleanup
      }
    }
  }
  
  logSuccess('Development files cleaned');
}

function fixNextConfig(osType) {
  logStep('CONFIG', 'Checking Next.js configuration...');
  
  const nextConfigPath = join(projectRoot, 'next.config.js');
  
  if (!existsSync(nextConfigPath)) {
    logWarning('next.config.js not found - creating basic config...');
    
    const basicConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma']
  }
};

export default nextConfig;
`;
    
    writeFileSync(nextConfigPath, basicConfig);
    logSuccess('Basic next.config.js created');
  } else {
    logSuccess('next.config.js found');
  }
}

function checkEnvironmentVariables() {
  logStep('ENV', 'Checking environment variables...');
  
  const envPath = join(projectRoot, '.env');
  
  if (!existsSync(envPath)) {
    logWarning('.env file not found');
    return false;
  }
  
  const envContent = readFileSync(envPath, 'utf8');
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];
  
  const missingVars = requiredVars.filter(varName => 
    !envContent.includes(`${varName}=`)
  );
  
  if (missingVars.length > 0) {
    logWarning(`Missing environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  logSuccess('Environment variables configured');
  return true;
}

function testDevServer(osType) {
  logStep('TEST', 'Testing development server startup...');
  
  return new Promise((resolve, reject) => {
    // Start the dev server
    const devProcess = spawn('npm', ['run', 'dev'], {
      cwd: projectRoot,
      stdio: 'pipe'
    });
    
    let output = '';
    let hasStarted = false;
    let hasError = false;
    
    const timeout = setTimeout(() => {
      devProcess.kill();
      if (!hasStarted) {
        reject(new Error('Development server failed to start within 30 seconds'));
      }
    }, 30000);
    
    devProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      
      // Check for successful startup indicators
      if (text.includes('Ready in') || text.includes('compiled successfully') || text.includes('Local:')) {
        hasStarted = true;
        clearTimeout(timeout);
        devProcess.kill();
        resolve({
          success: true,
          output: output,
          message: 'Development server started successfully'
        });
      }
      
      // Check for fast compilation that might indicate issues
      if (text.includes('compiled in') && text.includes('ms')) {
        const match = text.match(/compiled in (\d+)ms/);
        if (match && parseInt(match[1]) < 200) {
          logWarning(`Very fast compilation detected (${match[1]}ms) - this might indicate missing dependencies`);
        }
      }
    });
    
    devProcess.stderr.on('data', (data) => {
      const text = data.toString();
      output += text;
      
      if (text.includes('Error') || text.includes('Failed')) {
        hasError = true;
      }
    });
    
    devProcess.on('close', (code) => {
      clearTimeout(timeout);
      
      if (hasStarted) {
        return; // Already resolved
      }
      
      if (code !== 0 || hasError) {
        reject(new Error(`Development server exited with code ${code}. Output: ${output}`));
      } else {
        resolve({
          success: true,
          output: output,
          message: 'Development server test completed'
        });
      }
    });
  });
}

async function main() {
  log(`${colors.bright}🔧 Development Server Diagnostic and Fix${colors.reset}\n`);
  
  try {
    // Step 1: Check system info
    const osType = checkSystemInfo();
    
    // Step 2: Check dependencies
    checkDependencies();
    
    // Step 3: Check Prisma setup
    checkPrismaSetup();
    
    // Step 4: Cleanup dev files
    cleanupDevFiles(osType);
    
    // Step 5: Fix Next.js config
    fixNextConfig(osType);
    
    // Step 6: Check environment variables
    checkEnvironmentVariables();
    
    // Step 7: Test dev server
    logStep('TEST', 'Testing development server...');
    const testResult = await testDevServer(osType);
    
    if (testResult.success) {
      logSuccess(testResult.message);
    }
    
    log(`\n${colors.green}${colors.bright}🎉 Development server diagnostic completed!${colors.reset}`);
    log(`${colors.cyan}🚀 You can now run: npm run dev${colors.reset}`);
    log(`${colors.cyan}🌐 Server should be accessible at: http://localhost:3000${colors.reset}\n`);
    
  } catch (error) {
    log(`\n${colors.red}${colors.bright}💥 Diagnostic failed!${colors.reset}`);
    logError(error.message);
    
    log(`\n${colors.yellow}🔧 Troubleshooting tips:${colors.reset}`);
    log(`${colors.yellow}   1. Try: npm run clean && npm install${colors.reset}`);
    log(`${colors.yellow}   2. Check that all environment variables are set${colors.reset}`);
    log(`${colors.yellow}   3. Ensure database is accessible${colors.reset}`);
    log(`${colors.yellow}   4. Try running: npx prisma generate${colors.reset}\n`);
    
    process.exit(1);
  }
}

main().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});
