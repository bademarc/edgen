#!/bin/bash

# LayerEdge X API Dependencies Installation Script
# Ensures all required dependencies for X API service are properly installed

set -e  # Exit on any error

echo "📦 LAYEREDGE X API DEPENDENCIES INSTALLATION"
echo "=" | tr '=' '=' | head -c 60; echo
echo "🔧 Installing all required dependencies for X API service"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Function to check if a package is installed
check_package() {
    local package_name="$1"
    if npm list "$package_name" &> /dev/null; then
        echo "✅ $package_name is already installed"
        return 0
    else
        echo "❌ $package_name is missing"
        return 1
    fi
}

# Function to install a package if not present
install_if_missing() {
    local package_name="$1"
    local version="$2"
    
    if ! check_package "$package_name"; then
        echo "📦 Installing $package_name..."
        if [ -n "$version" ]; then
            npm install "$package_name@$version"
        else
            npm install "$package_name"
        fi
        echo "✅ $package_name installed successfully"
    fi
}

# Main installation function
install_x_api_dependencies() {
    echo "🔍 Checking X API dependencies..."
    
    # Core X API dependency
    install_if_missing "twitter-api-v2" "^1.17.2"
    
    # Additional dependencies that might be needed
    install_if_missing "axios" "^1.6.2"
    install_if_missing "dotenv" "^16.5.0"
    
    # TypeScript types for better development
    if ! npm list "@types/node" &> /dev/null; then
        echo "📦 Installing @types/node for TypeScript support..."
        npm install --save-dev "@types/node"
    fi
    
    echo ""
    echo "✅ All X API dependencies checked and installed"
}

# Function to verify installations
verify_installations() {
    echo ""
    echo "🔍 Verifying X API dependency installations..."
    
    local all_good=true
    
    # Check core dependencies
    if check_package "twitter-api-v2"; then
        echo "✅ twitter-api-v2: $(npm list twitter-api-v2 --depth=0 2>/dev/null | grep twitter-api-v2 | awk '{print $2}' || echo 'installed')"
    else
        echo "❌ twitter-api-v2: MISSING"
        all_good=false
    fi
    
    if check_package "axios"; then
        echo "✅ axios: $(npm list axios --depth=0 2>/dev/null | grep axios | awk '{print $2}' || echo 'installed')"
    else
        echo "❌ axios: MISSING"
        all_good=false
    fi
    
    if check_package "dotenv"; then
        echo "✅ dotenv: $(npm list dotenv --depth=0 2>/dev/null | grep dotenv | awk '{print $2}' || echo 'installed')"
    else
        echo "❌ dotenv: MISSING"
        all_good=false
    fi
    
    if [ "$all_good" = true ]; then
        echo ""
        echo "🎉 All X API dependencies are properly installed!"
        return 0
    else
        echo ""
        echo "❌ Some dependencies are missing. Please run the installation again."
        return 1
    fi
}

# Function to test X API service compilation
test_compilation() {
    echo ""
    echo "🔧 Testing X API service compilation..."
    
    # Check if TypeScript compilation works
    if command -v npx &> /dev/null; then
        echo "Testing TypeScript compilation..."
        
        # Try to compile the X API service file
        if npx tsc --noEmit src/lib/x-api-service.ts 2>/dev/null; then
            echo "✅ X API service compiles successfully"
            return 0
        else
            echo "❌ X API service compilation failed"
            echo "💡 Running detailed compilation check..."
            npx tsc --noEmit src/lib/x-api-service.ts
            return 1
        fi
    else
        echo "⚠️ TypeScript compiler not available for testing"
        return 1
    fi
}

# Function to test X API import
test_import() {
    echo ""
    echo "🧪 Testing X API import..."
    
    # Create a temporary test file
    cat > /tmp/test-x-api-import.js << 'EOF'
try {
    const { TwitterApi } = require('twitter-api-v2');
    console.log('✅ twitter-api-v2 import successful');
    console.log('✅ TwitterApi class available');
    process.exit(0);
} catch (error) {
    console.log('❌ twitter-api-v2 import failed:', error.message);
    process.exit(1);
}
EOF
    
    if node /tmp/test-x-api-import.js; then
        echo "✅ X API import test passed"
        rm -f /tmp/test-x-api-import.js
        return 0
    else
        echo "❌ X API import test failed"
        rm -f /tmp/test-x-api-import.js
        return 1
    fi
}

# Function to clean npm cache if needed
clean_npm_cache() {
    echo ""
    echo "🧹 Cleaning npm cache to ensure fresh installations..."
    npm cache clean --force
    echo "✅ npm cache cleaned"
}

# Function to reinstall node_modules if needed
reinstall_node_modules() {
    echo ""
    echo "🔄 Reinstalling node_modules for clean state..."
    
    if [ -d "node_modules" ]; then
        echo "Removing existing node_modules..."
        rm -rf node_modules
    fi
    
    if [ -f "package-lock.json" ]; then
        echo "Removing package-lock.json..."
        rm -f package-lock.json
    fi
    
    echo "Running fresh npm install..."
    npm install
    
    echo "✅ node_modules reinstalled"
}

# Main execution function
main() {
    echo "🚀 Starting X API dependencies installation..."
    
    # Step 1: Install dependencies
    install_x_api_dependencies
    
    # Step 2: Verify installations
    if ! verify_installations; then
        echo ""
        echo "⚠️ Some dependencies failed verification. Attempting fixes..."
        
        # Try cleaning cache and reinstalling
        clean_npm_cache
        reinstall_node_modules
        
        # Verify again
        if ! verify_installations; then
            echo ""
            echo "❌ Dependencies installation failed after retry"
            echo "💡 Manual steps required:"
            echo "1. npm cache clean --force"
            echo "2. rm -rf node_modules package-lock.json"
            echo "3. npm install"
            echo "4. npm install twitter-api-v2@^1.17.2"
            exit 1
        fi
    fi
    
    # Step 3: Test compilation
    if ! test_compilation; then
        echo ""
        echo "⚠️ Compilation test failed, but dependencies are installed"
        echo "💡 This might be due to TypeScript configuration issues"
    fi
    
    # Step 4: Test import
    if ! test_import; then
        echo ""
        echo "❌ Import test failed"
        echo "💡 There might be a runtime issue with the twitter-api-v2 package"
        exit 1
    fi
    
    echo ""
    echo "🎉 X API DEPENDENCIES INSTALLATION COMPLETED!"
    echo "✅ twitter-api-v2 is properly installed and working"
    echo "✅ All supporting dependencies are available"
    echo "✅ Import tests passed"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Test X API service: npm run test:x-api-credentials"
    echo "2. Build the application: npm run build"
    echo "3. Deploy to production: npm start"
    echo ""
    echo "🎯 Ready for X API service deployment!"
}

# Handle command line execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
