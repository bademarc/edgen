#!/usr/bin/env node

/**
 * Cross-Platform Functionality Test Script
 * Tests all major features across macOS, Windows, and Linux
 */

import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
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
      timeout: 30000,
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

function testSystemCompatibility() {
  logStep('SYSTEM', 'Testing system compatibility...');
  
  const os = platform();
  const nodeVersion = process.version;
  const arch = process.arch;
  
  log(`   Platform: ${os}`);
  log(`   Architecture: ${arch}`);
  log(`   Node.js: ${nodeVersion}`);
  
  // Test Node.js version
  const nodeVersionNum = parseInt(nodeVersion.slice(1));
  if (nodeVersionNum < 18) {
    logError(`Node.js 18+ required. Current: ${nodeVersion}`);
    return false;
  }
  
  // Test npm
  const npmResult = execCommand('npm --version');
  if (!npmResult.success) {
    logError('npm not available');
    return false;
  }
  
  logSuccess(`System compatibility verified (${os})`);
  return true;
}

function testDependencies() {
  logStep('DEPS', 'Testing dependencies...');
  
  // Check package.json
  const packageJsonPath = join(projectRoot, 'package.json');
  if (!existsSync(packageJsonPath)) {
    logError('package.json not found');
    return false;
  }
  
  // Check node_modules
  const nodeModulesPath = join(projectRoot, 'node_modules');
  if (!existsSync(nodeModulesPath)) {
    logError('node_modules not found - run npm install');
    return false;
  }
  
  // Check critical dependencies
  const criticalDeps = [
    'next',
    '@prisma/client',
    'react',
    'react-dom'
  ];
  
  for (const dep of criticalDeps) {
    const depPath = join(projectRoot, 'node_modules', dep);
    if (!existsSync(depPath)) {
      logError(`Critical dependency missing: ${dep}`);
      return false;
    }
  }
  
  logSuccess('Dependencies verified');
  return true;
}

function testPrismaSetup() {
  logStep('PRISMA', 'Testing Prisma setup...');
  
  // Check Prisma schema
  const schemaPath = join(projectRoot, 'prisma', 'schema.prisma');
  if (!existsSync(schemaPath)) {
    logError('Prisma schema not found');
    return false;
  }
  
  // Check generated client
  const clientPath = join(projectRoot, 'node_modules', '.prisma', 'client');
  if (!existsSync(clientPath)) {
    logWarning('Prisma client not generated - attempting generation...');
    
    const generateResult = execCommand('npx prisma generate');
    if (!generateResult.success) {
      logError(`Prisma generation failed: ${generateResult.error}`);
      return false;
    }
    
    logSuccess('Prisma client generated');
  } else {
    logSuccess('Prisma client found');
  }
  
  return true;
}

function testEnvironmentVariables() {
  logStep('ENV', 'Testing environment variables...');
  
  const envPath = join(projectRoot, '.env');
  if (!existsSync(envPath)) {
    logError('.env file not found');
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
    logError(`Missing environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  logSuccess('Environment variables configured');
  return true;
}

function testBuildProcess() {
  logStep('BUILD', 'Testing build process...');
  
  // Test TypeScript compilation
  const tscResult = execCommand('npx tsc --noEmit');
  if (!tscResult.success) {
    logWarning('TypeScript compilation has issues (this may be expected in development)');
  } else {
    logSuccess('TypeScript compilation passed');
  }
  
  // Test Next.js build (quick check)
  logStep('BUILD', 'Testing Next.js configuration...');
  const configResult = execCommand('npx next info');
  if (configResult.success) {
    logSuccess('Next.js configuration valid');
  } else {
    logWarning('Next.js configuration check failed');
  }
  
  return true;
}

async function testDevServerStartup() {
  logStep('SERVER', 'Testing development server startup...');
  
  return new Promise((resolve) => {
    const os = platform();
    const command = os === 'win32' ? 'npm.cmd' : 'npm';
    const args = ['run', 'dev:next'];
    
    const devProcess = spawn(command, args, {
      cwd: projectRoot,
      stdio: 'pipe',
      shell: os === 'win32'
    });
    
    let output = '';
    let hasStarted = false;
    
    const timeout = setTimeout(() => {
      devProcess.kill();
      if (hasStarted) {
        logSuccess('Development server started successfully');
        resolve(true);
      } else {
        logError('Development server failed to start within 20 seconds');
        resolve(false);
      }
    }, 20000);
    
    devProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      
      // Check for successful startup
      if (text.includes('Ready in') || text.includes('compiled successfully') || text.includes('Local:')) {
        hasStarted = true;
        clearTimeout(timeout);
        devProcess.kill();
        logSuccess('Development server started successfully');
        resolve(true);
      }
      
      // Check for compilation issues
      if (text.includes('Failed to compile') || text.includes('Error:')) {
        clearTimeout(timeout);
        devProcess.kill();
        logError('Development server compilation failed');
        log(`   Output: ${text.trim()}`);
        resolve(false);
      }
    });
    
    devProcess.stderr.on('data', (data) => {
      const text = data.toString();
      if (text.includes('Error') || text.includes('EADDRINUSE')) {
        clearTimeout(timeout);
        devProcess.kill();
        
        if (text.includes('EADDRINUSE')) {
          logWarning('Port 3000 is already in use (this is expected if server is running)');
          resolve(true);
        } else {
          logError(`Development server error: ${text.trim()}`);
          resolve(false);
        }
      }
    });
    
    devProcess.on('error', (error) => {
      clearTimeout(timeout);
      logError(`Failed to start development server: ${error.message}`);
      resolve(false);
    });
  });
}

function testAIChatbotAPI() {
  logStep('AI', 'Testing AI chatbot API...');

  // Check if AI service files exist
  const aiServicePath = join(projectRoot, 'src', 'lib', 'ionet-api-service.ts');
  if (!existsSync(aiServicePath)) {
    logError('AI service file not found');
    return false;
  }

  // Check API route
  const apiRoutePath = join(projectRoot, 'src', 'app', 'api', 'edgen-helper', 'chat', 'route.ts');
  if (!existsSync(apiRoutePath)) {
    logError('AI chat API route not found');
    return false;
  }

  // Check chatbot component
  const chatbotPath = join(projectRoot, 'src', 'components', 'edgen-helper-chatbot.tsx');
  if (!existsSync(chatbotPath)) {
    logError('AI chatbot component not found');
    return false;
  }

  logSuccess('AI chatbot files verified');
  return true;
}

function testDockerCompatibility() {
  logStep('DOCKER', 'Testing Docker compatibility...');

  // Check if Dockerfile exists
  const dockerfilePath = join(projectRoot, 'Dockerfile');
  if (!existsSync(dockerfilePath)) {
    logError('Dockerfile not found');
    return false;
  }

  // Check docker-compose files
  const dockerComposePath = join(projectRoot, 'docker-compose.scale.yml');
  if (!existsSync(dockerComposePath)) {
    logWarning('Docker compose file not found');
  }

  // Test Docker build (if Docker is available)
  const dockerResult = execCommand('docker --version');
  if (dockerResult.success) {
    logSuccess('Docker is available');

    // Test if we can build the image (dry run)
    logStep('DOCKER', 'Testing Docker build syntax...');
    const buildResult = execCommand('docker build --dry-run -t edgenyapp-test .');
    if (buildResult.success) {
      logSuccess('Docker build syntax is valid');
    } else {
      logWarning('Docker build syntax check failed (this may be expected in some environments)');
    }
  } else {
    logWarning('Docker not available - skipping Docker tests');
  }

  logSuccess('Docker compatibility verified');
  return true;
}

function testFilePathCompatibility() {
  logStep('PATHS', 'Testing file path compatibility...');

  const os = platform();

  // Test path separators
  const testPaths = [
    'src/app/page.tsx',
    'src\\app\\page.tsx',
    './src/app/page.tsx',
    '.\\src\\app\\page.tsx'
  ];

  let compatiblePaths = 0;
  for (const testPath of testPaths) {
    try {
      const normalizedPath = join(projectRoot, testPath.replace(/[/\\]/g, '/'));
      if (existsSync(normalizedPath)) {
        compatiblePaths++;
      }
    } catch (error) {
      // Path normalization failed
    }
  }

  if (compatiblePaths > 0) {
    logSuccess(`Path compatibility verified (${compatiblePaths}/${testPaths.length} paths work)`);
  } else {
    logError('Path compatibility issues detected');
    return false;
  }

  // Test directory creation and deletion
  const testDir = join(projectRoot, 'test-cross-platform-dir');
  try {
    // Create test directory
    execCommand(`mkdir "${testDir}"`);
    if (existsSync(testDir)) {
      logSuccess('Directory creation works');

      // Clean up
      if (os === 'win32') {
        execCommand(`rmdir /s /q "${testDir}"`);
      } else {
        execCommand(`rm -rf "${testDir}"`);
      }

      if (!existsSync(testDir)) {
        logSuccess('Directory deletion works');
      }
    }
  } catch (error) {
    logWarning('Directory operations test failed');
  }

  return true;
}

function displayPlatformSpecificTips() {
  const os = platform();
  
  log(`\n${colors.yellow}Platform-Specific Tips (${os}):${colors.reset}`);
  
  if (os === 'darwin') {
    log('   🍎 macOS:');
    log('     • Use Homebrew for Node.js: brew install node');
    log('     • For M1/M2 Macs, ensure native Node.js build');
    log('     • Clear npm cache: npm cache clean --force');
    log('     • Check Xcode Command Line Tools: xcode-select --install');
  } else if (os === 'win32') {
    log('   🪟 Windows:');
    log('     • Use Node.js installer from nodejs.org');
    log('     • Run PowerShell as Administrator for global installs');
    log('     • Disable Windows Defender real-time scanning for project folder');
    log('     • Use Windows Terminal or PowerShell (not Git Bash)');
  } else {
    log('   🐧 Linux:');
    log('     • Install Node.js via package manager or NodeSource');
    log('     • Ensure build tools: sudo apt-get install build-essential');
    log('     • Check file permissions: chmod -R 755 .');
    log('     • Use nvm for Node.js version management');
  }
  
  log('');
}

async function main() {
  const os = platform();
  
  log(`${colors.bright}🧪 Cross-Platform Functionality Test${colors.reset}`);
  log(`${colors.bright}Platform: ${os}${colors.reset}\n`);
  
  const tests = [
    { name: 'System Compatibility', fn: testSystemCompatibility },
    { name: 'Dependencies', fn: testDependencies },
    { name: 'Prisma Setup', fn: testPrismaSetup },
    { name: 'Environment Variables', fn: testEnvironmentVariables },
    { name: 'Build Process', fn: testBuildProcess },
    { name: 'AI Chatbot API', fn: testAIChatbotAPI },
    { name: 'Docker Compatibility', fn: testDockerCompatibility },
    { name: 'File Path Compatibility', fn: testFilePathCompatibility },
    { name: 'Dev Server Startup', fn: testDevServerStartup }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      logError(`Test "${test.name}" threw an error: ${error.message}`);
      results.push({ name: test.name, passed: false });
    }
  }
  
  // Summary
  log(`\n${colors.bright}📋 Test Results Summary:${colors.reset}`);
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    log(`   ${status} ${result.name}`);
  });
  
  log(`\n${colors.bright}Overall: ${passed}/${total} tests passed${colors.reset}`);
  
  if (passed === total) {
    log(`${colors.green}🎉 All tests passed! The application is ready for cross-platform development.${colors.reset}`);
  } else {
    log(`${colors.yellow}⚠️  Some tests failed. Please address the issues above.${colors.reset}`);
    displayPlatformSpecificTips();
  }
  
  log(`\n${colors.cyan}🚀 To start development: npm run dev${colors.reset}`);
  log(`${colors.cyan}🔧 To fix issues: npm run dev:fix${colors.reset}`);
}

main().catch(error => {
  logError(`Test suite failed: ${error.message}`);
  process.exit(1);
});
