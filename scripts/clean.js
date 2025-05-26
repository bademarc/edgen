#!/usr/bin/env node

/**
 * Cleanup script for LayerEdge community platform
 * Removes build artifacts and temporary files that might cause permission issues
 */

import { rmSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function cleanDirectory(dirPath, description) {
  const fullPath = join(projectRoot, dirPath);

  if (existsSync(fullPath)) {
    try {
      log(`🧹 Cleaning ${description}...`, colors.blue);

      // Try multiple approaches for Windows compatibility
      if (process.platform === 'win32') {
        try {
          // First try: Use rmSync with maxRetries
          rmSync(fullPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 1000 });
        } catch (error) {
          // Second try: Use system command
          try {
            execSync(`rmdir /s /q "${fullPath}"`, { stdio: 'ignore' });
          } catch (cmdError) {
            // Third try: Rename then delete (Windows workaround)
            const tempPath = fullPath + '.tmp.' + Date.now();
            try {
              execSync(`move "${fullPath}" "${tempPath}"`, { stdio: 'ignore' });
              setTimeout(() => {
                try {
                  rmSync(tempPath, { recursive: true, force: true });
                } catch (e) {
                  // Silent fail for background cleanup
                }
              }, 1000);
            } catch (renameError) {
              throw error; // Throw original error
            }
          }
        }
      } else {
        rmSync(fullPath, { recursive: true, force: true });
      }

      log(`✅ ${description} cleaned successfully`, colors.green);
    } catch (error) {
      log(`⚠️  Could not clean ${description}: ${error.message}`, colors.yellow);
      log(`💡 Try running as administrator or close any open files in this directory`, colors.blue);
    }
  } else {
    log(`ℹ️  ${description} not found, skipping`, colors.blue);
  }
}

function cleanPrismaTemporaryFiles() {
  const prismaClientPath = join(projectRoot, 'node_modules', '.prisma', 'client');

  if (!existsSync(prismaClientPath)) {
    log('ℹ️  Prisma client directory not found, skipping', colors.blue);
    return;
  }

  try {
    log('🧹 Cleaning Prisma temporary files...', colors.blue);

    // Use platform-specific commands to remove temp files
    if (process.platform === 'win32') {
      try {
        execSync(`del /q "${join(prismaClientPath, 'query_engine-*.tmp*')}" 2>nul`, { stdio: 'ignore' });
        execSync(`del /q "${join(prismaClientPath, 'libquery_engine-*.tmp*')}" 2>nul`, { stdio: 'ignore' });
      } catch (error) {
        // Ignore errors for del command (files might not exist)
      }
    } else {
      try {
        execSync(`rm -f "${join(prismaClientPath, 'query_engine-*.tmp*')}"`, { stdio: 'ignore' });
        execSync(`rm -f "${join(prismaClientPath, 'libquery_engine-*.tmp*')}"`, { stdio: 'ignore' });
      } catch (error) {
        // Ignore errors for rm command (files might not exist)
      }
    }

    log('✅ Prisma temporary files cleaned', colors.green);
  } catch (error) {
    log(`⚠️  Could not clean some Prisma temporary files: ${error.message}`, colors.yellow);
  }
}

function main() {
  log('🚀 Starting cleanup process...\n', colors.blue);

  // Clean build directories
  cleanDirectory('.next', 'Next.js build directory');
  cleanDirectory('dist', 'Distribution directory');
  cleanDirectory('.turbo', 'Turbo cache');

  // Clean cache directories
  cleanDirectory('.next/cache', 'Next.js cache');
  cleanDirectory('node_modules/.cache', 'Node modules cache');

  // Clean Prisma temporary files
  cleanPrismaTemporaryFiles();

  // Clean TypeScript build info
  cleanDirectory('tsconfig.tsbuildinfo', 'TypeScript build info');

  log('\n🎉 Cleanup completed!', colors.green);
  log('💡 You can now run: npm install && npm run build', colors.blue);
}

main();
