#!/usr/bin/env node

/**
 * Simple Development Server Starter
 * Fixes the infinite loop issue and Node.js PATH problems
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

console.log('🚀 LayerEdge Development Server');
console.log('Simple Startup Script\n');

// Check if we're in the right directory
if (!existsSync('package.json')) {
    console.error('❌ ERROR: package.json not found');
    console.error('Please run this script from the project root directory');
    process.exit(1);
}

// Check if node_modules exists
if (!existsSync('node_modules')) {
    console.log('📦 node_modules not found. Please run: npm install');
    process.exit(1);
}

console.log('✅ Starting Next.js development server...');
console.log('🌐 Server will be available at: http://localhost:3000');
console.log('💡 Press Ctrl+C to stop the server\n');

// Start Next.js directly
const isWindows = process.platform === 'win32';
const command = isWindows ? 'npx.cmd' : 'npx';
const args = ['next', 'dev'];

const devProcess = spawn(command, args, {
    stdio: 'inherit',
    shell: isWindows,
    env: {
        ...process.env,
        NODE_ENV: 'development',
        FORCE_COLOR: '1'
    }
});

devProcess.on('error', (error) => {
    console.error('❌ Failed to start development server:', error.message);
    
    if (error.code === 'ENOENT') {
        console.error('\n🔧 Troubleshooting:');
        console.error('- Ensure Node.js is installed and in your PATH');
        console.error('- Try running: npm install -g npx');
        console.error('- Restart your terminal/command prompt');
    }
    
    process.exit(1);
});

devProcess.on('close', (code) => {
    if (code === 0) {
        console.log('\n✅ Development server stopped gracefully');
    } else if (code !== null) {
        console.error(`\n❌ Development server exited with code ${code}`);
    }
});

// Handle process termination gracefully
process.on('SIGINT', () => {
    console.log('\n🛑 Stopping development server...');
    devProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Stopping development server...');
    devProcess.kill('SIGTERM');
});
