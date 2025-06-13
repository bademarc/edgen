#!/usr/bin/env node

/**
 * Cross-Platform Development Server Starter
 * Ensures consistent development experience across macOS, Windows, and Linux
 */

import { spawn, execSync } from 'child_process';
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
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
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

function logInfo(message) {
  log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function detectPlatform() {
  const platform = process.platform;
  const arch = process.arch;

  logInfo(`Detected platform: ${platform} (${arch})`);

  return {
    isWindows: platform === 'win32',
    isMacOS: platform === 'darwin',
    isLinux: platform === 'linux',
    architecture: arch,
    platform
  };
}

function getPlatformSpecificCommands(platformInfo) {
  if (platformInfo.isWindows) {
    return {
      killPort: (port) => `netstat -ano | findstr :${port} && for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /f /pid %a`,
      openBrowser: (url) => `start ${url}`,
      clearScreen: 'cls'
    };
  } else {
    return {
      killPort: (port) => `lsof -ti:${port} | xargs kill -9 2>/dev/null || true`,
      openBrowser: (url) => platformInfo.isMacOS ? `open ${url}` : `xdg-open ${url}`,
      clearScreen: 'clear'
    };
  }
}

function getOSInfo() {
  const os = platform();
  const arch = process.arch;
  const nodeVersion = process.version;
  
  return {
    platform: os,
    architecture: arch,
    nodeVersion,
    isWindows: os === 'win32',
    isMacOS: os === 'darwin',
    isLinux: os === 'linux'
  };
}

function checkPrerequisites(osInfo) {
  logStep('CHECK', 'Verifying prerequisites...');
  
  // Check Node.js version
  const nodeVersionNum = parseInt(osInfo.nodeVersion.slice(1));
  if (nodeVersionNum < 18) {
    throw new Error(`Node.js 18+ required. Current version: ${osInfo.nodeVersion}`);
  }
  logSuccess(`Node.js ${osInfo.nodeVersion} ✓`);
  
  // Check npm
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    logSuccess(`npm v${npmVersion} ✓`);
  } catch (error) {
    throw new Error('npm not found. Please install Node.js with npm.');
  }
  
  // Check package.json
  const packageJsonPath = join(projectRoot, 'package.json');
  if (!existsSync(packageJsonPath)) {
    throw new Error('package.json not found. Are you in the correct directory?');
  }
  logSuccess('package.json found ✓');
  
  // Check dependencies
  const nodeModulesPath = join(projectRoot, 'node_modules');
  if (!existsSync(nodeModulesPath)) {
    logWarning('node_modules not found. Installing dependencies...');
    try {
      execSync('npm install', { cwd: projectRoot, stdio: 'inherit' });
      logSuccess('Dependencies installed ✓');
    } catch (error) {
      throw new Error('Failed to install dependencies');
    }
  } else {
    logSuccess('Dependencies found ✓');
  }
}

function setupEnvironment(osInfo) {
  logStep('ENV', 'Setting up environment...');
  
  // Check .env file
  const envPath = join(projectRoot, '.env');
  if (!existsSync(envPath)) {
    logWarning('.env file not found');
    log('   Please create a .env file with required environment variables');
    return false;
  }
  
  // Validate critical environment variables
  const envContent = readFileSync(envPath, 'utf8');
  const criticalVars = ['DATABASE_URL', 'NEXTAUTH_SECRET'];
  const missingVars = criticalVars.filter(varName => 
    !envContent.includes(`${varName}=`)
  );
  
  if (missingVars.length > 0) {
    logWarning(`Missing critical environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  logSuccess('Environment variables configured ✓');
  return true;
}

function setupPrisma(osInfo) {
  logStep('PRISMA', 'Setting up Prisma...');
  
  const prismaClientPath = join(projectRoot, 'node_modules', '.prisma', 'client');
  
  if (!existsSync(prismaClientPath)) {
    logWarning('Prisma client not generated. Generating...');
    
    try {
      // Use platform-specific command
      const command = osInfo.isWindows ? 'npx.cmd prisma generate' : 'npx prisma generate';
      execSync(command, { cwd: projectRoot, stdio: 'inherit' });
      logSuccess('Prisma client generated ✓');
    } catch (error) {
      logError('Failed to generate Prisma client');
      
      // Try alternative approach
      try {
        logStep('PRISMA', 'Trying alternative generation method...');
        execSync('npm run db:generate', { cwd: projectRoot, stdio: 'inherit' });
        logSuccess('Prisma client generated (alternative method) ✓');
      } catch (altError) {
        throw new Error('Failed to generate Prisma client with both methods');
      }
    }
  } else {
    logSuccess('Prisma client found ✓');
  }
}

function startDevServer(osInfo) {
  logStep('SERVER', 'Starting development server...');
  
  return new Promise((resolve, reject) => {
    // Determine the correct command for the platform
    const command = osInfo.isWindows ? 'npm.cmd' : 'npm';
    const args = ['run', 'dev'];
    
    // Set environment variables for better development experience
    const env = {
      ...process.env,
      NODE_ENV: 'development',
      FORCE_COLOR: '1', // Enable colors in output
      // Platform-specific optimizations
      ...(osInfo.isWindows && {
        NODE_OPTIONS: '--max-old-space-size=4096'
      }),
      ...(osInfo.isMacOS && {
        NODE_OPTIONS: '--max-old-space-size=8192'
      })
    };
    
    const devProcess = spawn(command, args, {
      cwd: projectRoot,
      stdio: 'inherit',
      env,
      shell: osInfo.isWindows
    });
    
    let hasStarted = false;
    
    // Set a timeout for startup detection
    const startupTimeout = setTimeout(() => {
      if (!hasStarted) {
        logWarning('Server startup taking longer than expected...');
        log('   This might be normal for the first run or after dependency changes');
        log('   Check the output above for any errors');
      }
    }, 15000);
    
    devProcess.on('spawn', () => {
      logSuccess('Development server process started');
      log(`${colors.cyan}🌐 Server will be available at: ${colors.bright}http://localhost:3000${colors.reset}`);
      log(`${colors.cyan}📱 Network access at: ${colors.bright}http://0.0.0.0:3000${colors.reset}`);
      log(`${colors.yellow}💡 Press Ctrl+C to stop the server${colors.reset}\n`);
      
      hasStarted = true;
      clearTimeout(startupTimeout);
      resolve();
    });
    
    devProcess.on('error', (error) => {
      clearTimeout(startupTimeout);
      logError(`Failed to start development server: ${error.message}`);
      reject(error);
    });
    
    devProcess.on('close', (code) => {
      clearTimeout(startupTimeout);
      
      if (code === 0) {
        log(`\n${colors.green}Development server stopped gracefully${colors.reset}`);
      } else if (code !== null) {
        logError(`Development server exited with code ${code}`);
      }
    });
    
    // Handle process termination gracefully
    process.on('SIGINT', () => {
      log(`\n${colors.yellow}Stopping development server...${colors.reset}`);
      devProcess.kill('SIGINT');
    });
    
    process.on('SIGTERM', () => {
      log(`\n${colors.yellow}Stopping development server...${colors.reset}`);
      devProcess.kill('SIGTERM');
    });
  });
}

function displaySystemInfo(osInfo) {
  log(`${colors.bright}🖥️  System Information${colors.reset}`);
  log(`   Platform: ${osInfo.platform} (${osInfo.architecture})`);
  log(`   Node.js: ${osInfo.nodeVersion}`);
  
  if (osInfo.isMacOS) {
    log(`   ${colors.green}macOS detected - optimized for Apple Silicon and Intel${colors.reset}`);
  } else if (osInfo.isWindows) {
    log(`   ${colors.blue}Windows detected - optimized for Windows development${colors.reset}`);
  } else {
    log(`   ${colors.cyan}Linux detected - using standard configuration${colors.reset}`);
  }
  
  log('');
}

function displayTroubleshootingTips(osInfo) {
  log(`${colors.yellow}🔧 Troubleshooting Tips:${colors.reset}`);
  
  if (osInfo.isMacOS) {
    log(`   • If you see permission errors, try: sudo chown -R $(whoami) ~/.npm`);
    log(`   • For M1/M2 Macs, ensure you're using the correct Node.js version`);
    log(`   • Clear npm cache: npm cache clean --force`);
  } else if (osInfo.isWindows) {
    log(`   • Run as Administrator if you see permission errors`);
    log(`   • Disable antivirus real-time scanning for the project folder`);
    log(`   • Use PowerShell or Command Prompt, not Git Bash`);
  } else {
    log(`   • Check file permissions: chmod -R 755 .`);
    log(`   • Ensure you have build tools: sudo apt-get install build-essential`);
  }
  
  log(`   • Clear all caches: npm run clean && npm install`);
  log(`   • Regenerate Prisma: npx prisma generate`);
  log(`   • Check environment variables in .env file`);
  log('');
}

async function main() {
  const osInfo = getOSInfo();
  
  log(`${colors.bright}🚀 LayerEdge Development Server${colors.reset}`);
  log(`${colors.bright}Cross-Platform Startup Script${colors.reset}\n`);
  
  displaySystemInfo(osInfo);
  
  try {
    // Step 1: Check prerequisites
    checkPrerequisites(osInfo);
    
    // Step 2: Setup environment
    const envOk = setupEnvironment(osInfo);
    if (!envOk) {
      logWarning('Environment setup incomplete - server may not function properly');
    }
    
    // Step 3: Setup Prisma
    setupPrisma(osInfo);
    
    // Step 4: Start development server
    await startDevServer(osInfo);
    
  } catch (error) {
    log(`\n${colors.red}${colors.bright}💥 Failed to start development server${colors.reset}`);
    logError(error.message);
    log('');
    displayTroubleshootingTips(osInfo);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

main().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});
