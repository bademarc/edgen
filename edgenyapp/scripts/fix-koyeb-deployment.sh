#!/bin/bash

# LayerEdge Koyeb Deployment Fix Script
# Fixes package-lock.json synchronization issues and ensures successful deployment

set -e  # Exit on any error

echo "🚀 LAYEREDGE KOYEB DEPLOYMENT FIX"
echo "=" | tr '=' '=' | head -c 60; echo
echo "🔧 Fixing package-lock.json synchronization issues"
echo "📦 Ensuring all dependencies are properly installed"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Function to clean and reinstall dependencies
clean_and_reinstall() {
    echo "🧹 Cleaning existing dependencies..."
    
    # Remove node_modules and lock file for fresh install
    if [ -d "node_modules" ]; then
        echo "Removing node_modules directory..."
        rm -rf node_modules
    fi
    
    if [ -f "package-lock.json" ]; then
        echo "Removing existing package-lock.json..."
        rm -f package-lock.json
    fi
    
    # Clean npm cache
    echo "Cleaning npm cache..."
    npm cache clean --force
    
    echo "✅ Cleanup completed"
}

# Function to install dependencies
install_dependencies() {
    echo ""
    echo "📦 Installing all dependencies..."
    
    # Install all dependencies fresh
    echo "Running npm install..."
    npm install
    
    # Verify critical dependencies are installed
    echo ""
    echo "🔍 Verifying critical dependencies..."
    
    local critical_deps=(
        "@radix-ui/react-scroll-area"
        "twitter-api-v2"
        "framer-motion"
        "lucide-react"
    )
    
    local missing_deps=()
    
    for dep in "${critical_deps[@]}"; do
        if npm list "$dep" &> /dev/null; then
            echo "✅ $dep: $(npm list "$dep" --depth=0 2>/dev/null | grep "$dep" | awk '{print $2}' || echo 'installed')"
        else
            echo "❌ $dep: MISSING"
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -eq 0 ]; then
        echo "✅ All critical dependencies are installed"
        return 0
    else
        echo "❌ Missing dependencies: ${missing_deps[*]}"
        return 1
    fi
}

# Function to verify package-lock.json synchronization
verify_lock_file_sync() {
    echo ""
    echo "🔍 Verifying package-lock.json synchronization..."
    
    # Test npm ci to ensure lock file is in sync
    echo "Testing npm ci (dry run)..."
    
    # Create a temporary directory for testing
    local temp_dir=$(mktemp -d)
    cp package.json "$temp_dir/"
    cp package-lock.json "$temp_dir/"
    
    cd "$temp_dir"
    
    if npm ci --dry-run &> /dev/null; then
        echo "✅ package-lock.json is synchronized with package.json"
        cd - > /dev/null
        rm -rf "$temp_dir"
        return 0
    else
        echo "❌ package-lock.json is NOT synchronized with package.json"
        cd - > /dev/null
        rm -rf "$temp_dir"
        return 1
    fi
}

# Function to test build process
test_build_process() {
    echo ""
    echo "🏗️ Testing build process..."
    
    # Test TypeScript compilation first
    echo "Testing TypeScript compilation..."
    if npx tsc --noEmit --skipLibCheck; then
        echo "✅ TypeScript compilation successful"
    else
        echo "❌ TypeScript compilation failed"
        return 1
    fi
    
    # Test Next.js build
    echo ""
    echo "Testing Next.js build process..."
    if timeout 300 npm run build; then
        echo "✅ Next.js build successful"
        return 0
    else
        echo "❌ Next.js build failed or timed out"
        return 1
    fi
}

# Function to verify Edgen Helper dependencies
verify_edgen_helper_deps() {
    echo ""
    echo "🤖 Verifying Edgen Helper chatbot dependencies..."
    
    local edgen_deps=(
        "@radix-ui/react-scroll-area"
        "framer-motion"
        "lucide-react"
    )
    
    local all_good=true
    
    for dep in "${edgen_deps[@]}"; do
        if npm list "$dep" &> /dev/null; then
            echo "✅ $dep: Available for Edgen Helper"
        else
            echo "❌ $dep: Missing for Edgen Helper"
            all_good=false
        fi
    done
    
    if [ "$all_good" = true ]; then
        echo "✅ All Edgen Helper dependencies are available"
        return 0
    else
        echo "❌ Some Edgen Helper dependencies are missing"
        return 1
    fi
}

# Function to create deployment-ready package files
prepare_deployment_files() {
    echo ""
    echo "📋 Preparing deployment-ready package files..."
    
    # Ensure package.json has correct dependencies
    echo "Verifying package.json dependencies..."
    
    # Check if @radix-ui/react-scroll-area is in package.json
    if grep -q "@radix-ui/react-scroll-area" package.json; then
        echo "✅ @radix-ui/react-scroll-area found in package.json"
    else
        echo "❌ @radix-ui/react-scroll-area missing from package.json"
        return 1
    fi
    
    # Check if twitter-api-v2 is in package.json
    if grep -q "twitter-api-v2" package.json; then
        echo "✅ twitter-api-v2 found in package.json"
    else
        echo "❌ twitter-api-v2 missing from package.json"
        return 1
    fi
    
    # Verify package-lock.json exists and is valid
    if [ -f "package-lock.json" ]; then
        echo "✅ package-lock.json exists"
        
        # Check if it contains the new dependencies
        if grep -q "@radix-ui/react-scroll-area" package-lock.json; then
            echo "✅ @radix-ui/react-scroll-area found in package-lock.json"
        else
            echo "❌ @radix-ui/react-scroll-area missing from package-lock.json"
            return 1
        fi
    else
        echo "❌ package-lock.json does not exist"
        return 1
    fi
    
    echo "✅ Deployment files are ready"
    return 0
}

# Function to generate deployment report
generate_deployment_report() {
    echo ""
    echo "📋 KOYEB DEPLOYMENT FIX REPORT"
    echo "=" .repeat(60)
    
    # Run all verification steps
    local results=(
        "$(install_dependencies && echo "true" || echo "false")"
        "$(verify_lock_file_sync && echo "true" || echo "false")"
        "$(verify_edgen_helper_deps && echo "true" || echo "false")"
        "$(prepare_deployment_files && echo "true" || echo "false")"
        "$(test_build_process && echo "true" || echo "false")"
    )
    
    echo ""
    echo "📊 DEPLOYMENT FIX SUMMARY"
    echo "=" .repeat(60)
    
    echo "🔧 Dependency Management:"
    echo "   ✅ Dependencies Installed: ${results[0]}"
    echo "   ✅ Lock File Synchronized: ${results[1]}"
    echo "   ✅ Edgen Helper Dependencies: ${results[2]}"
    echo "   ✅ Deployment Files Ready: ${results[3]}"
    echo "   ✅ Build Process Working: ${results[4]}"
    
    # Check if all tests passed
    local all_passed=true
    for result in "${results[@]}"; do
        if [ "$result" != "true" ]; then
            all_passed=false
            break
        fi
    done
    
    if [ "$all_passed" = true ]; then
        echo ""
        echo "🎉 ALL DEPLOYMENT FIXES SUCCESSFUL!"
        echo "✅ package-lock.json synchronized with package.json"
        echo "✅ @radix-ui/react-scroll-area properly installed"
        echo "✅ All Edgen Helper dependencies available"
        echo "✅ Build process working correctly"
        echo "✅ Ready for Koyeb deployment"
        echo ""
        echo "🚀 DEPLOYMENT READY!"
        echo "The LayerEdge platform with Edgen Helper AI chatbot is ready to deploy to Koyeb."
    else
        echo ""
        echo "⚠️ SOME DEPLOYMENT FIXES FAILED"
        echo "❌ Review the failed components above"
        echo "💡 Manual intervention may be required"
    fi
    
    echo ""
    echo "📋 Next Steps:"
    if [ "$all_passed" = true ]; then
        echo "1. Commit the updated package-lock.json file"
        echo "2. Push changes to trigger Koyeb deployment"
        echo "3. Monitor deployment logs for any issues"
        echo "4. Test Edgen Helper chatbot after deployment"
    else
        echo "1. Fix the failed components listed above"
        echo "2. Re-run this script: bash scripts/fix-koyeb-deployment.sh"
        echo "3. Manually verify dependencies if needed"
        echo "4. Contact support if issues persist"
    fi
    
    return $([ "$all_passed" = true ] && echo 0 || echo 1)
}

# Main execution function
main() {
    echo "🚀 Starting Koyeb deployment fix process..."
    
    # Step 1: Clean and reinstall dependencies
    clean_and_reinstall
    
    # Step 2: Generate comprehensive report
    if generate_deployment_report; then
        echo ""
        echo "🎉 KOYEB DEPLOYMENT FIX COMPLETED SUCCESSFULLY!"
        echo "📦 package-lock.json is now synchronized"
        echo "🤖 Edgen Helper chatbot dependencies ready"
        echo "🚀 Ready for Koyeb deployment"
        return 0
    else
        echo ""
        echo "⚠️ KOYEB DEPLOYMENT FIX COMPLETED WITH ISSUES"
        echo "💡 Review the failed components and fix manually"
        return 1
    fi
}

# Handle command line execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
