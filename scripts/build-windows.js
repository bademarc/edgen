#!/usr/bin/env node

/**
 * Windows-compatible build script for LayerEdge community platform
 * Handles Prisma client generation issues on Windows systems
 */

import { execSync } from 'child_process';
import { existsSync, rmSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
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
    logStep('EXEC', `Running: ${command}`);
    const result = execSync(command, {
      cwd: projectRoot,
      stdio: 'pipe',
      encoding: 'utf8',
      ...options
    });
    return { success: true, output: result };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout || '',
      stderr: error.stderr || ''
    };
  }
}

function cleanupPrismaTemporaryFiles() {
  logStep('CLEANUP', 'Cleaning up Prisma temporary files...');

  const prismaClientPath = join(projectRoot, 'node_modules', '.prisma', 'client');

  if (!existsSync(prismaClientPath)) {
    logWarning('Prisma client directory not found, skipping cleanup');
    return;
  }

  try {
    // Remove temporary query engine files
    const tempFiles = [
      'query_engine-windows.dll.node.tmp*',
      'libquery_engine-*.so.tmp*',
      'query_engine-*.dylib.tmp*'
    ];

    for (const pattern of tempFiles) {
      const command = process.platform === 'win32'
        ? `del /q "${join(prismaClientPath, pattern)}" 2>nul || echo "No temp files found"`
        : `rm -f "${join(prismaClientPath, pattern)}"`;

      execCommand(command);
    }

    // Also try to remove the main query engine file if it exists and might be corrupted
    const queryEngineFile = join(prismaClientPath, 'query_engine-windows.dll.node');
    if (existsSync(queryEngineFile)) {
      try {
        rmSync(queryEngineFile, { force: true });
        logStep('CLEANUP', 'Removed existing query engine file for fresh generation');
      } catch (error) {
        logWarning(`Could not remove existing query engine file: ${error.message}`);
      }
    }

    logSuccess('Prisma temporary files cleaned up');
  } catch (error) {
    logWarning(`Could not clean up some temporary files: ${error.message}`);
  }
}

async function generatePrismaClient() {
  logStep('PRISMA', 'Generating Prisma client...');

  // Clean up first
  cleanupPrismaTemporaryFiles();

  // Generate Prisma client with retry logic
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    logStep('PRISMA', `Generation attempt ${attempts}/${maxAttempts}`);

    const result = execCommand('npx prisma generate', {
      env: {
        ...process.env,
        // Disable Prisma telemetry to avoid potential file conflicts
        CHECKPOINT_DISABLE: '1',
        // Force regeneration
        PRISMA_GENERATE_SKIP_AUTOINSTALL: 'false'
      }
    });

    if (result.success) {
      logSuccess('Prisma client generated successfully');
      return true;
    }

    logError(`Prisma generation failed (attempt ${attempts}): ${result.error}`);

    if (attempts < maxAttempts) {
      logStep('RETRY', 'Cleaning up and retrying...');
      cleanupPrismaTemporaryFiles();

      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  throw new Error(`Failed to generate Prisma client after ${maxAttempts} attempts`);
}

function deployMigrations() {
  logStep('MIGRATE', 'Deploying database migrations...');

  const result = execCommand('npx prisma migrate deploy');

  if (!result.success) {
    // Check if it's a "no pending migrations" message
    if (result.stderr && result.stderr.includes('No pending migrations')) {
      logSuccess('No pending migrations to deploy');
      return true;
    }
    throw new Error(`Migration deployment failed: ${result.error}`);
  }

  logSuccess('Database migrations deployed successfully');
  return true;
}

function buildNextJS() {
  logStep('BUILD', 'Building Next.js application...');

  // Clean .next directory first
  const nextDir = join(projectRoot, '.next');
  if (existsSync(nextDir)) {
    logStep('CLEAN', 'Cleaning .next directory...');
    try {
      rmSync(nextDir, { recursive: true, force: true });
      logSuccess('.next directory cleaned');
    } catch (error) {
      logWarning(`Could not clean .next directory: ${error.message}`);
    }
  }

  const result = execCommand('npx next build', {
    env: {
      ...process.env,
      // Optimize for Windows
      NODE_OPTIONS: '--max-old-space-size=4096'
    }
  });

  if (!result.success) {
    throw new Error(`Next.js build failed: ${result.error}`);
  }

  logSuccess('Next.js application built successfully');
  return true;
}

function verifyBuild() {
  logStep('VERIFY', 'Verifying build artifacts...');

  const requiredFiles = [
    '.next/BUILD_ID',
    '.next/package.json',
    'node_modules/.prisma/client/index.js'
  ];

  for (const file of requiredFiles) {
    const filePath = join(projectRoot, file);
    if (!existsSync(filePath)) {
      throw new Error(`Required build artifact missing: ${file}`);
    }
  }

  logSuccess('Build verification completed');
  return true;
}

async function main() {
  log(`${colors.bright}🚀 Starting Windows-compatible build process...${colors.reset}\n`);

  try {
    // Step 1: Generate Prisma client
    await generatePrismaClient();

    // Step 2: Deploy migrations
    deployMigrations();

    // Step 3: Build Next.js
    buildNextJS();

    // Step 4: Verify build
    verifyBuild();

    log(`\n${colors.green}${colors.bright}🎉 Build completed successfully!${colors.reset}`);
    log(`${colors.cyan}📦 Production build is ready in .next/ directory${colors.reset}`);
    log(`${colors.cyan}🚀 You can now run: npm start${colors.reset}\n`);

  } catch (error) {
    log(`\n${colors.red}${colors.bright}💥 Build failed!${colors.reset}`);
    logError(error.message);

    log(`\n${colors.yellow}🔧 Troubleshooting tips:${colors.reset}`);
    log(`${colors.yellow}   1. Make sure no antivirus is blocking file operations${colors.reset}`);
    log(`${colors.yellow}   2. Close any IDEs or editors that might lock files${colors.reset}`);
    log(`${colors.yellow}   3. Run as administrator if permission issues persist${colors.reset}`);
    log(`${colors.yellow}   4. Try: npm run clean && npm install${colors.reset}\n`);

    process.exit(1);
  }
}

// Handle async execution
main().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});
