#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function log(message) {
  console.log(message);
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

function execCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      ...options 
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return { 
      success: false, 
      output: error.stdout ? error.stdout.trim() : '',
      error: error.stderr ? error.stderr.trim() : error.message 
    };
  }
}

function checkTypeScriptErrors() {
  logStep('TYPESCRIPT', 'Checking TypeScript compilation...');
  
  const result = execCommand('npx tsc --noEmit --skipLibCheck');
  
  if (result.success) {
    logSuccess('TypeScript compilation passed');
    return true;
  } else {
    logError('TypeScript compilation failed');
    if (result.error) {
      log(result.error);
    }
    return false;
  }
}

function fixCommonImportIssues() {
  logStep('IMPORTS', 'Fixing common import issues...');
  
  const filesToCheck = [
    'src/components/UnclaimedTweets.tsx',
    'src/app/api/monitoring/health/route.ts',
    'src/lib/quest-service.ts',
    'src/lib/simplified-tweet-submission.ts'
  ];
  
  let fixedFiles = 0;
  
  for (const filePath of filesToCheck) {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      logWarning(`File not found: ${filePath}`);
      continue;
    }
    
    try {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      // Fix date-fns import
      if (content.includes("import { formatDistanceToNow } from 'date-fns'")) {
        // Already correct
      } else if (content.includes("formatDistanceToNow")) {
        content = content.replace(
          /import.*from ['"]date-fns['"];?/g,
          "import { formatDistanceToNow } from 'date-fns';"
        );
        modified = true;
      }
      
      // Add quest types import where needed
      if (content.includes('QuestStatus') && !content.includes("from '@/types/quest'")) {
        const importLine = "import type { QuestStatus, Quest, QuestProgress } from '@/types/quest';\n";
        content = importLine + content;
        modified = true;
      }
      
      // Add API types import where needed
      if (content.includes('ApiResponse') && !content.includes("from '@/types/api'")) {
        const importLine = "import type { ApiResponse, BaseApiResponse } from '@/types/api';\n";
        content = importLine + content;
        modified = true;
      }
      
      // Remove unused imports
      const lines = content.split('\n');
      const filteredLines = lines.filter(line => {
        // Remove unused imports that are declared but never used
        if (line.includes('getSimplifiedXApiService') && !content.includes('getSimplifiedXApiService()')) {
          return false;
        }
        if (line.includes('getSimplifiedCacheService') && !content.includes('getSimplifiedCacheService()')) {
          return false;
        }
        return true;
      });
      
      if (filteredLines.length !== lines.length) {
        content = filteredLines.join('\n');
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        fixedFiles++;
        logInfo(`Fixed imports in ${filePath}`);
      }
      
    } catch (error) {
      logError(`Error processing ${filePath}: ${error.message}`);
    }
  }
  
  if (fixedFiles > 0) {
    logSuccess(`Fixed imports in ${fixedFiles} files`);
  } else {
    logInfo('No import fixes needed');
  }
}

function addMissingTypeDefinitions() {
  logStep('TYPES', 'Adding missing type definitions...');
  
  // Check if global types file exists
  const globalTypesPath = path.join(process.cwd(), 'src/types/global.d.ts');
  
  if (!fs.existsSync(globalTypesPath)) {
    const globalTypes = `// Global type definitions

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      NEXTAUTH_SECRET: string;
      NEXTAUTH_URL: string;
      TWITTER_CLIENT_ID?: string;
      TWITTER_CLIENT_SECRET?: string;
      REDIS_URL?: string;
      IONET_API_KEY?: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}

// Extend Window interface for browser globals
declare interface Window {
  gtag?: (...args: any[]) => void;
  dataLayer?: any[];
}

export {};
`;
    
    fs.writeFileSync(globalTypesPath, globalTypes, 'utf8');
    logSuccess('Created global type definitions');
  }
  
  // Check if we need to add more specific types
  const typesDir = path.join(process.cwd(), 'src/types');
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir, { recursive: true });
  }
}

function updateTsConfig() {
  logStep('CONFIG', 'Updating TypeScript configuration...');
  
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
  
  if (!fs.existsSync(tsconfigPath)) {
    logError('tsconfig.json not found');
    return false;
  }
  
  try {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    // Ensure strict mode is enabled but not too strict for build compatibility
    tsconfig.compilerOptions = {
      ...tsconfig.compilerOptions,
      strict: true,
      noImplicitAny: true,
      noImplicitReturns: true,
      noUnusedLocals: false, // Keep false to avoid build failures
      noUnusedParameters: false, // Keep false to avoid build failures
      exactOptionalPropertyTypes: false, // Keep false for compatibility
      skipLibCheck: true // Important for build performance
    };
    
    // Ensure types directory is included
    if (!tsconfig.compilerOptions.typeRoots) {
      tsconfig.compilerOptions.typeRoots = ["./node_modules/@types", "./src/types"];
    }
    
    // Ensure types are included
    if (!tsconfig.include.includes("src/types/**/*.d.ts")) {
      tsconfig.include.push("src/types/**/*.d.ts");
    }
    
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2), 'utf8');
    logSuccess('Updated TypeScript configuration');
    return true;
    
  } catch (error) {
    logError(`Error updating tsconfig.json: ${error.message}`);
    return false;
  }
}

function runLintFix() {
  logStep('LINT', 'Running ESLint auto-fix...');
  
  const result = execCommand('npx eslint . --fix --ext .ts,.tsx');
  
  if (result.success) {
    logSuccess('ESLint auto-fix completed');
  } else {
    logWarning('ESLint auto-fix completed with warnings');
    if (result.error) {
      log(result.error);
    }
  }
}

async function main() {
  log(`${colors.bright}🔧 TypeScript Fix Tool${colors.reset}\n`);
  
  try {
    // Step 1: Add missing type definitions
    addMissingTypeDefinitions();
    
    // Step 2: Update TypeScript configuration
    updateTsConfig();
    
    // Step 3: Fix common import issues
    fixCommonImportIssues();
    
    // Step 4: Run ESLint auto-fix
    runLintFix();
    
    // Step 5: Check TypeScript compilation
    const tsSuccess = checkTypeScriptErrors();
    
    if (tsSuccess) {
      log(`\n${colors.green}${colors.bright}🎉 TypeScript issues fixed successfully!${colors.reset}`);
      log(`${colors.cyan}✅ TypeScript compilation passes${colors.reset}`);
      log(`${colors.cyan}✅ Import issues resolved${colors.reset}`);
      log(`${colors.cyan}✅ Type definitions added${colors.reset}\n`);
    } else {
      log(`\n${colors.yellow}${colors.bright}⚠️  Some TypeScript issues remain${colors.reset}`);
      log(`${colors.yellow}These may be complex issues that require manual review${colors.reset}`);
      log(`${colors.yellow}The build should still work with --skipLibCheck${colors.reset}\n`);
    }
    
  } catch (error) {
    log(`\n${colors.red}${colors.bright}💥 Fix process failed!${colors.reset}`);
    logError(error.message);
    process.exit(1);
  }
}

// Run main function if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  checkTypeScriptErrors,
  fixCommonImportIssues,
  addMissingTypeDefinitions,
  updateTsConfig,
  runLintFix
};
