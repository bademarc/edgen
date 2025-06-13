#!/usr/bin/env node

/**
 * Development Environment Setup Script
 * Configures the development environment for optimal cross-platform performance
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { platform, homedir } from 'os';

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

function setupGitIgnore() {
  logStep('GIT', 'Setting up .gitignore...');
  
  const gitignorePath = join(projectRoot, '.gitignore');
  const additionalIgnores = [
    '',
    '# Development files',
    '.DS_Store',
    'Thumbs.db',
    '*.log',
    'npm-debug.log*',
    'yarn-debug.log*',
    'yarn-error.log*',
    '',
    '# IDE files',
    '.vscode/',
    '.idea/',
    '*.swp',
    '*.swo',
    '*~',
    '',
    '# OS generated files',
    '.DS_Store',
    '.DS_Store?',
    '._*',
    '.Spotlight-V100',
    '.Trashes',
    'ehthumbs.db',
    'Thumbs.db',
    '',
    '# Platform specific',
    '*.tmp',
    '*.temp',
    '*.cache',
    '',
    '# Development cache',
    '.next/cache/',
    'node_modules/.cache/',
    '.npm/',
    '.yarn/',
    ''
  ];
  
  if (existsSync(gitignorePath)) {
    const existingContent = readFileSync(gitignorePath, 'utf8');
    const newContent = existingContent + '\n' + additionalIgnores.join('\n');
    writeFileSync(gitignorePath, newContent);
  } else {
    writeFileSync(gitignorePath, additionalIgnores.join('\n'));
  }
  
  logSuccess('.gitignore configured');
}

function setupVSCodeSettings() {
  logStep('VSCODE', 'Setting up VS Code configuration...');
  
  const vscodeDir = join(projectRoot, '.vscode');
  if (!existsSync(vscodeDir)) {
    mkdirSync(vscodeDir, { recursive: true });
  }
  
  // Settings for better development experience
  const settings = {
    "typescript.preferences.importModuleSpecifier": "relative",
    "typescript.suggest.autoImports": true,
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    },
    "files.associations": {
      "*.css": "tailwindcss"
    },
    "emmet.includeLanguages": {
      "javascript": "javascriptreact"
    },
    "tailwindCSS.includeLanguages": {
      "javascript": "javascript",
      "html": "HTML"
    },
    "files.exclude": {
      "**/.git": true,
      "**/.svn": true,
      "**/.hg": true,
      "**/CVS": true,
      "**/.DS_Store": true,
      "**/Thumbs.db": true,
      "**/.next": true,
      "**/node_modules": true
    },
    "search.exclude": {
      "**/node_modules": true,
      "**/bower_components": true,
      "**/*.code-search": true,
      "**/.next": true,
      "**/dist": true,
      "**/coverage": true
    }
  };
  
  const settingsPath = join(vscodeDir, 'settings.json');
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  
  // Extensions recommendations
  const extensions = {
    "recommendations": [
      "bradlc.vscode-tailwindcss",
      "esbenp.prettier-vscode",
      "ms-vscode.vscode-typescript-next",
      "prisma.prisma",
      "ms-vscode.vscode-json"
    ]
  };
  
  const extensionsPath = join(vscodeDir, 'extensions.json');
  writeFileSync(extensionsPath, JSON.stringify(extensions, null, 2));
  
  logSuccess('VS Code configuration created');
}

function setupNpmrc() {
  logStep('NPM', 'Setting up npm configuration...');
  
  const npmrcPath = join(projectRoot, '.npmrc');
  const npmrcContent = [
    '# Optimize npm for development',
    'save-exact=true',
    'progress=true',
    'audit=false',
    'fund=false',
    '',
    '# Platform optimizations',
    platform() === 'win32' ? 'script-shell=powershell' : '# script-shell=bash',
    '',
    '# Cache settings',
    'cache-min=86400',
    ''
  ].join('\n');
  
  writeFileSync(npmrcPath, npmrcContent);
  logSuccess('npm configuration created');
}

function setupDevelopmentEnv() {
  logStep('ENV', 'Setting up development environment variables...');
  
  const envPath = join(projectRoot, '.env');
  const envExamplePath = join(projectRoot, '.env.example');
  
  if (!existsSync(envPath) && existsSync(envExamplePath)) {
    logWarning('.env not found, copying from .env.example...');
    const exampleContent = readFileSync(envExamplePath, 'utf8');
    writeFileSync(envPath, exampleContent);
    logSuccess('.env created from example');
  } else if (!existsSync(envPath)) {
    logWarning('.env not found - you may need to create it manually');
  } else {
    logSuccess('.env file exists');
  }
  
  // Add development-specific variables
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf8');
    const devVars = [
      '',
      '# Development optimizations',
      'NODE_ENV=development',
      'NEXT_TELEMETRY_DISABLED=1',
      ''
    ];
    
    if (!envContent.includes('NODE_ENV=development')) {
      writeFileSync(envPath, envContent + '\n' + devVars.join('\n'));
      logSuccess('Development variables added to .env');
    }
  }
}

function optimizeForPlatform() {
  const os = platform();
  logStep('PLATFORM', `Optimizing for ${os}...`);
  
  if (os === 'darwin') {
    // macOS optimizations
    logStep('MACOS', 'Applying macOS optimizations...');
    
    // Check for Homebrew
    const brewResult = execCommand('which brew');
    if (brewResult.success) {
      logSuccess('Homebrew detected');
    } else {
      logWarning('Homebrew not found - consider installing for better package management');
    }
    
    // Optimize file watching
    try {
      execCommand('sudo sysctl -w kern.maxfiles=65536');
      execCommand('sudo sysctl -w kern.maxfilesperproc=65536');
      logSuccess('File watching limits optimized');
    } catch (error) {
      logWarning('Could not optimize file watching limits (requires sudo)');
    }
    
  } else if (os === 'win32') {
    // Windows optimizations
    logStep('WINDOWS', 'Applying Windows optimizations...');
    
    // Check for Windows Terminal
    const wtResult = execCommand('where wt');
    if (wtResult.success) {
      logSuccess('Windows Terminal detected');
    } else {
      logWarning('Windows Terminal not found - consider installing for better development experience');
    }
    
    // Set execution policy for PowerShell scripts
    try {
      execCommand('powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser"');
      logSuccess('PowerShell execution policy configured');
    } catch (error) {
      logWarning('Could not configure PowerShell execution policy');
    }
    
  } else {
    // Linux optimizations
    logStep('LINUX', 'Applying Linux optimizations...');
    
    // Check for build tools
    const gccResult = execCommand('which gcc');
    if (gccResult.success) {
      logSuccess('Build tools detected');
    } else {
      logWarning('Build tools not found - install with: sudo apt-get install build-essential');
    }
  }
}

function installDevelopmentDependencies() {
  logStep('DEPS', 'Installing development dependencies...');
  
  // Check if dependencies are already installed
  const nodeModulesPath = join(projectRoot, 'node_modules');
  if (!existsSync(nodeModulesPath)) {
    logStep('INSTALL', 'Installing all dependencies...');
    const installResult = execCommand('npm install');
    if (!installResult.success) {
      throw new Error(`Failed to install dependencies: ${installResult.error}`);
    }
    logSuccess('Dependencies installed');
  } else {
    logSuccess('Dependencies already installed');
  }
  
  // Generate Prisma client
  logStep('PRISMA', 'Generating Prisma client...');
  const prismaResult = execCommand('npx prisma generate');
  if (!prismaResult.success) {
    logWarning('Prisma client generation failed - you may need to run this manually');
  } else {
    logSuccess('Prisma client generated');
  }
}

function displaySetupSummary() {
  log(`\n${colors.bright}🎉 Development Environment Setup Complete!${colors.reset}\n`);
  
  log(`${colors.cyan}📁 Project Structure:${colors.reset}`);
  log(`   ✅ .gitignore configured`);
  log(`   ✅ .vscode/ settings created`);
  log(`   ✅ .npmrc optimized`);
  log(`   ✅ Environment variables configured`);
  
  log(`\n${colors.cyan}🚀 Next Steps:${colors.reset}`);
  log(`   1. Review and update .env file with your specific values`);
  log(`   2. Run: ${colors.bright}npm run test:platform${colors.reset} to verify setup`);
  log(`   3. Start development: ${colors.bright}npm run dev${colors.reset}`);
  
  log(`\n${colors.cyan}🔧 Available Commands:${colors.reset}`);
  log(`   • ${colors.bright}npm run dev${colors.reset}        - Start development server (cross-platform)`);
  log(`   • ${colors.bright}npm run dev:fix${colors.reset}     - Fix development server issues`);
  log(`   • ${colors.bright}npm run test:platform${colors.reset} - Test cross-platform compatibility`);
  log(`   • ${colors.bright}npm run build${colors.reset}       - Build for production`);
  
  const os = platform();
  if (os === 'darwin') {
    log(`\n${colors.yellow}🍎 macOS Tips:${colors.reset}`);
    log(`   • Use Homebrew for package management`);
    log(`   • Consider using iTerm2 for better terminal experience`);
  } else if (os === 'win32') {
    log(`\n${colors.yellow}🪟 Windows Tips:${colors.reset}`);
    log(`   • Use Windows Terminal or PowerShell`);
    log(`   • Consider excluding project folder from Windows Defender`);
  }
  
  log('');
}

async function main() {
  log(`${colors.bright}🛠️  Development Environment Setup${colors.reset}`);
  log(`${colors.bright}Platform: ${platform()}${colors.reset}\n`);
  
  try {
    setupGitIgnore();
    setupVSCodeSettings();
    setupNpmrc();
    setupDevelopmentEnv();
    optimizeForPlatform();
    installDevelopmentDependencies();
    
    displaySetupSummary();
    
  } catch (error) {
    log(`\n${colors.red}${colors.bright}💥 Setup failed!${colors.reset}`);
    logError(error.message);
    process.exit(1);
  }
}

main().catch(error => {
  logError(`Setup failed: ${error.message}`);
  process.exit(1);
});
