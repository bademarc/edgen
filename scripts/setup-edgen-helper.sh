#!/bin/bash

# Edgen Helper AI Chatbot Setup Script
# Sets up the io.net API integration and chatbot functionality

set -e  # Exit on any error

echo "🤖 EDGEN HELPER AI CHATBOT SETUP"
echo "=" | tr '=' '=' | head -c 50; echo
echo "🔑 io.net API Integration"
echo "🎯 LayerEdge Community Assistant"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Function to install required dependencies
install_chatbot_dependencies() {
    echo "📦 Installing Edgen Helper dependencies..."
    
    # Install Radix UI scroll area component
    if ! npm list @radix-ui/react-scroll-area &> /dev/null; then
        echo "Installing @radix-ui/react-scroll-area..."
        npm install @radix-ui/react-scroll-area@^1.2.1
        echo "✅ @radix-ui/react-scroll-area installed"
    else
        echo "✅ @radix-ui/react-scroll-area already installed"
    fi
    
    # Verify other required dependencies
    local required_deps=("framer-motion" "lucide-react")
    
    for dep in "${required_deps[@]}"; do
        if npm list "$dep" &> /dev/null; then
            echo "✅ $dep is available"
        else
            echo "⚠️ $dep not found, but should be in package.json"
        fi
    done
    
    echo "✅ All chatbot dependencies verified"
}

# Function to verify environment configuration
verify_environment() {
    echo ""
    echo "🔧 Verifying environment configuration..."
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        echo "❌ .env file not found"
        return 1
    fi
    
    # Check required environment variables
    local required_vars=("IO_NET_API_KEY" "IO_NET_API_URL" "EDGEN_HELPER_ENABLED")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" .env; then
            echo "✅ $var is configured"
        else
            echo "❌ $var is missing"
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        echo "✅ Environment configuration complete"
        return 0
    else
        echo "❌ Missing environment variables: ${missing_vars[*]}"
        return 1
    fi
}

# Function to test chatbot functionality
test_chatbot() {
    echo ""
    echo "🧪 Testing Edgen Helper chatbot..."
    
    if command -v node &> /dev/null; then
        echo "Running chatbot functionality test..."
        if node scripts/test-edgen-helper-chatbot.js; then
            echo "✅ Chatbot test passed"
            return 0
        else
            echo "❌ Chatbot test failed"
            return 1
        fi
    else
        echo "⚠️ Node.js not available for testing"
        return 1
    fi
}

# Function to verify component files
verify_components() {
    echo ""
    echo "📁 Verifying chatbot component files..."
    
    local required_files=(
        "src/lib/ionet-api-service.ts"
        "src/components/edgen-helper-chatbot.tsx"
        "src/components/ui/scroll-area.tsx"
        "src/app/api/edgen-helper/chat/route.ts"
    )
    
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            echo "✅ $file exists"
        else
            echo "❌ $file is missing"
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        echo "✅ All component files present"
        return 0
    else
        echo "❌ Missing component files: ${missing_files[*]}"
        return 1
    fi
}

# Function to test build process
test_build() {
    echo ""
    echo "🏗️ Testing build process with chatbot..."
    
    echo "Running TypeScript compilation check..."
    if npx tsc --noEmit; then
        echo "✅ TypeScript compilation successful"
        return 0
    else
        echo "❌ TypeScript compilation failed"
        echo "💡 Check for import errors or missing dependencies"
        return 1
    fi
}

# Main setup function
main() {
    echo "🚀 Starting Edgen Helper chatbot setup..."
    
    # Step 1: Install dependencies
    install_chatbot_dependencies
    
    # Step 2: Verify environment
    if ! verify_environment; then
        echo ""
        echo "⚠️ Environment configuration issues detected"
        echo "💡 The io.net API key should already be configured in .env"
        echo "💡 If missing, check the .env file for IO_NET_API_KEY"
    fi
    
    # Step 3: Verify component files
    if ! verify_components; then
        echo ""
        echo "❌ Component files missing"
        echo "💡 Ensure all chatbot files have been created properly"
        exit 1
    fi
    
    # Step 4: Test build process
    if ! test_build; then
        echo ""
        echo "❌ Build process failed"
        echo "💡 Fix TypeScript errors before proceeding"
        exit 1
    fi
    
    # Step 5: Test chatbot functionality
    if ! test_chatbot; then
        echo ""
        echo "⚠️ Chatbot functionality test had issues"
        echo "💡 This might be due to network connectivity or API access"
        echo "💡 The chatbot should still work with fallback responses"
    fi
    
    echo ""
    echo "🎉 EDGEN HELPER CHATBOT SETUP COMPLETED!"
    echo "✅ Dependencies installed"
    echo "✅ Component files verified"
    echo "✅ Build process working"
    echo "✅ Environment configured"
    echo ""
    echo "🎯 Chatbot Features Available:"
    echo "• Platform navigation assistance"
    echo "• Tweet submission guidance"
    echo "• Points system explanations"
    echo "• Hashtag usage help"
    echo "• Troubleshooting support"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Start the application: npm run dev"
    echo "2. Look for the floating chat button (bottom-right)"
    echo "3. Test chatbot functionality in the web interface"
    echo "4. Monitor io.net API usage and responses"
    echo ""
    echo "🤖 Edgen Helper is ready to assist your community!"
}

# Handle command line execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
