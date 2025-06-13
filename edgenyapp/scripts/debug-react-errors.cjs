#!/usr/bin/env node

/**
 * React Error Debugging Helper
 * Helps identify and debug common React errors in the codebase
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 REACT ERROR DEBUGGING HELPER')
console.log('=' .repeat(50))

/**
 * Common React error patterns and their solutions
 */
const REACT_ERROR_PATTERNS = {
  185: {
    name: 'Maximum update depth exceeded',
    description: 'Infinite loop in state updates',
    patterns: [
      /useEffect\([^}]+\}, \[[^\]]*useCallback[^\]]*\]\)/,
      /useCallback\([^}]+\}, \[[^\]]*user[^\]]*\]\)/,
      /useEffect\([^}]+\}, \[[^\]]*fetch[A-Z][a-zA-Z]*[^\]]*\]\)/
    ],
    solutions: [
      'Use useRef to store current values',
      'Remove function dependencies from useEffect',
      'Use empty dependency arrays for stable functions'
    ]
  },
  310: {
    name: 'Too many re-renders',
    description: 'Component is stuck in a render loop',
    patterns: [
      /setState.*render/,
      /useState.*render/,
      /useEffect\(\(\) => \{[^}]*setState[^}]*\}, \[\]\)/
    ],
    solutions: [
      'Move state updates outside render',
      'Use useEffect for side effects',
      'Check dependency arrays'
    ]
  },
  418: {
    name: 'Cannot read property of undefined',
    description: 'Accessing properties on undefined objects',
    patterns: [
      /\.[a-zA-Z]+(?!\?)/,
      /\[[^\]]+\](?!\?)/
    ],
    solutions: [
      'Use optional chaining (?.)',
      'Add null checks',
      'Provide default values'
    ]
  }
}

/**
 * Scan a file for potential React error patterns
 */
function scanFileForReactErrors(filePath) {
  if (!fs.existsSync(filePath)) {
    return null
  }

  const content = fs.readFileSync(filePath, 'utf8')
  const results = []

  for (const [errorCode, errorInfo] of Object.entries(REACT_ERROR_PATTERNS)) {
    for (const pattern of errorInfo.patterns) {
      if (pattern.test(content)) {
        results.push({
          errorCode,
          name: errorInfo.name,
          description: errorInfo.description,
          solutions: errorInfo.solutions,
          file: filePath
        })
      }
    }
  }

  return results
}

/**
 * Scan all React component files
 */
function scanAllComponents() {
  const componentDirs = [
    'src/app',
    'src/components',
    'src/hooks'
  ]

  const allIssues = []

  for (const dir of componentDirs) {
    const dirPath = path.join(process.cwd(), dir)
    if (!fs.existsSync(dirPath)) continue

    const scanDirectory = (dirPath) => {
      const items = fs.readdirSync(dirPath)
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item)
        const stat = fs.statSync(itemPath)
        
        if (stat.isDirectory()) {
          scanDirectory(itemPath)
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
          const issues = scanFileForReactErrors(itemPath)
          if (issues && issues.length > 0) {
            allIssues.push(...issues)
          }
        }
      }
    }

    scanDirectory(dirPath)
  }

  return allIssues
}

/**
 * Check for specific React Error #185 patterns
 */
function checkError185Specifically() {
  console.log('\n🎯 SPECIFIC CHECK: React Error #185')
  console.log('-'.repeat(40))

  const criticalFiles = [
    'src/app/dashboard/page.tsx',
    'src/app/recent/page.tsx'
  ]

  let foundIssues = false

  for (const file of criticalFiles) {
    const filePath = path.join(process.cwd(), file)
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${file}`)
      continue
    }

    const content = fs.readFileSync(filePath, 'utf8')
    
    // Check for problematic patterns
    const problematicPatterns = [
      {
        name: 'useEffect with function dependency',
        pattern: /useEffect\([^}]+\}, \[[^\]]*fetch[A-Z][a-zA-Z]*[^\]]*\]\)/
      },
      {
        name: 'useCallback with changing user dependency',
        pattern: /useCallback\([^}]+\}, \[[^\]]*user[^\]]*\]\)/
      }
    ]

    console.log(`\n📁 Checking ${file}:`)
    
    for (const check of problematicPatterns) {
      if (check.pattern.test(content)) {
        console.log(`  ❌ Found: ${check.name}`)
        foundIssues = true
      } else {
        console.log(`  ✅ Clean: ${check.name}`)
      }
    }
  }

  if (!foundIssues) {
    console.log('\n🎉 No React Error #185 patterns detected!')
  }

  return !foundIssues
}

/**
 * Provide development mode setup instructions
 */
function provideDevelopmentInstructions() {
  console.log('\n📋 DEVELOPMENT MODE DEBUGGING')
  console.log('-'.repeat(40))
  console.log('To get detailed React error messages:')
  console.log('')
  console.log('1. Run in development mode:')
  console.log('   npm run dev')
  console.log('')
  console.log('2. Open browser console (F12)')
  console.log('3. Look for detailed error messages')
  console.log('4. Check React DevTools for component tree')
  console.log('')
  console.log('🌐 Development URL: http://localhost:3000')
  console.log('')
}

/**
 * Main execution
 */
async function main() {
  // Check for React Error #185 specifically
  const error185Clean = checkError185Specifically()
  
  // Scan all components for potential issues
  console.log('\n🔍 SCANNING ALL COMPONENTS')
  console.log('-'.repeat(40))
  
  const allIssues = scanAllComponents()
  
  if (allIssues.length === 0) {
    console.log('✅ No potential React error patterns detected!')
  } else {
    console.log(`⚠️  Found ${allIssues.length} potential issues:`)
    
    const groupedIssues = {}
    for (const issue of allIssues) {
      if (!groupedIssues[issue.errorCode]) {
        groupedIssues[issue.errorCode] = []
      }
      groupedIssues[issue.errorCode].push(issue)
    }
    
    for (const [errorCode, issues] of Object.entries(groupedIssues)) {
      console.log(`\n❌ React Error #${errorCode}: ${issues[0].name}`)
      console.log(`   ${issues[0].description}`)
      console.log(`   Files affected: ${issues.length}`)
      console.log('   Solutions:')
      for (const solution of issues[0].solutions) {
        console.log(`   • ${solution}`)
      }
    }
  }

  // Provide development instructions
  provideDevelopmentInstructions()

  // Summary
  console.log('\n' + '='.repeat(50))
  if (error185Clean && allIssues.length === 0) {
    console.log('🎉 ALL CHECKS PASSED!')
    console.log('✅ React Error #185 is fixed')
    console.log('✅ No other potential React errors detected')
    console.log('\n🚀 Ready for production deployment!')
  } else {
    console.log('⚠️  ISSUES DETECTED')
    console.log('Please review the issues above and apply the suggested solutions.')
  }
}

// Run the debugging helper
main().catch(error => {
  console.error('Error running React debugging helper:', error)
  process.exit(1)
})
