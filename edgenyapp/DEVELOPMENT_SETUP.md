# Development Server Setup Guide

## Cross-Platform Development Environment

This guide provides comprehensive solutions for development server issues on macOS, Windows, and Linux.

## 🚀 Quick Start

### For All Platforms
```bash
# 1. Setup development environment
npm run setup:dev

# 2. Test platform compatibility
npm run test:platform

# 3. Start development server
npm run dev
```

### Alternative Commands
```bash
# If main dev command has issues
npm run dev:next

# Fix development server issues
npm run dev:fix
```

## 🔧 Common Issues & Solutions

### macOS Issues

#### Fast Compilation (100ms) Issue
**Problem**: Server compiles in ~100ms but application doesn't work properly.

**Causes**:
- Missing dependencies
- Prisma client not generated
- Environment variables not loaded
- File watching issues

**Solutions**:
```bash
# Clean and reinstall
npm run clean && npm install

# Regenerate Prisma client
npx prisma generate

# Check environment variables
cat .env

# Use our cross-platform dev script
npm run dev
```

#### File Watching Issues
**Problem**: Changes not detected or slow hot reload.

**Solutions**:
```bash
# Increase file watching limits (requires sudo)
sudo sysctl -w kern.maxfiles=65536
sudo sysctl -w kern.maxfilesperproc=65536

# Use polling mode (fallback)
CHOKIDAR_USEPOLLING=true npm run dev
```

### Windows Issues

#### Permission Errors
**Solutions**:
```powershell
# Run as Administrator
# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Use our Windows-optimized build
npm run build
```

#### Antivirus Interference
**Solutions**:
- Add project folder to Windows Defender exclusions
- Temporarily disable real-time protection during development
- Use Windows Terminal instead of Git Bash

### Linux Issues

#### Missing Build Tools
**Solutions**:
```bash
# Ubuntu/Debian
sudo apt-get install build-essential

# CentOS/RHEL
sudo yum groupinstall "Development Tools"

# Check permissions
chmod -R 755 .
```

## 📁 Project Structure

### Development Scripts
- `scripts/dev-cross-platform.js` - Main development server starter
- `scripts/fix-dev-server.js` - Diagnostic and fix script
- `scripts/test-cross-platform.js` - Platform compatibility tester
- `scripts/setup-development.js` - Environment setup script

### Configuration Files
- `next.config.js` - Optimized for cross-platform development
- `.npmrc` - Platform-specific npm optimizations
- `.vscode/` - VS Code settings and extensions

## 🌐 Server Access

### Default URLs
- **Local**: http://localhost:3000
- **Network**: http://0.0.0.0:3000
- **Helper Page**: http://localhost:3000/helper

### Port Issues
If port 3000 is in use:
```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

## 🔍 Troubleshooting

### Step 1: Run Diagnostics
```bash
npm run test:platform
```

### Step 2: Check System Requirements
- Node.js 18+ required
- npm 8+ recommended
- 4GB+ RAM available
- 2GB+ disk space

### Step 3: Verify Dependencies
```bash
# Check critical dependencies
ls node_modules/next
ls node_modules/@prisma/client
ls node_modules/.prisma/client
```

### Step 4: Environment Variables
```bash
# Check .env file exists
ls -la .env

# Verify critical variables
grep -E "(DATABASE_URL|NEXTAUTH_SECRET)" .env
```

### Step 5: Clean Installation
```bash
# Nuclear option - clean everything
npm run clean
rm -rf node_modules package-lock.json
npm install
npx prisma generate
npm run dev
```

## 🎯 Platform-Specific Optimizations

### macOS
- Uses native file watching
- Optimized for Apple Silicon and Intel
- Homebrew integration
- Increased file descriptor limits

### Windows
- PowerShell integration
- Polling-based file watching
- Windows Terminal support
- Antivirus exclusions

### Linux
- Standard file watching
- Build tools verification
- Permission checks
- Package manager integration

## 🚨 Emergency Fixes

### Server Won't Start
```bash
# 1. Check if already running
ps aux | grep next  # macOS/Linux
tasklist | findstr node  # Windows

# 2. Kill existing processes
pkill -f next  # macOS/Linux
taskkill /IM node.exe /F  # Windows

# 3. Clean and restart
npm run dev:fix
```

### Compilation Errors
```bash
# 1. Clear Next.js cache
rm -rf .next

# 2. Regenerate Prisma
npx prisma generate

# 3. Check TypeScript
npx tsc --noEmit
```

### Database Issues
```bash
# 1. Check connection
npx prisma db pull

# 2. Reset if needed
npx prisma migrate reset

# 3. Generate client
npx prisma generate
```

## 📊 Performance Monitoring

### Development Metrics
- **Startup Time**: Should be < 10 seconds
- **Hot Reload**: Should be < 2 seconds
- **Memory Usage**: Should be < 1GB
- **CPU Usage**: Should be < 50% during idle

### Monitoring Commands
```bash
# Check memory usage
ps aux | grep next  # macOS/Linux
tasklist /FI "IMAGENAME eq node.exe"  # Windows

# Monitor file changes
# Built into our dev scripts
```

## 🔗 Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Node.js Downloads](https://nodejs.org/)
- [VS Code Download](https://code.visualstudio.com/)

## 📞 Support

If you continue to experience issues:

1. Run `npm run test:platform` and share the output
2. Check the console for specific error messages
3. Verify your system meets the requirements
4. Try the emergency fixes above

The development environment is now optimized for cross-platform compatibility and should work consistently across macOS, Windows, and Linux systems.
