#!/bin/bash

# LayerEdge X API Upgrade Script
# Upgrades the platform with new X API credentials and enhanced functionality

set -e  # Exit on any error

echo "🚀 LAYEREDGE X API UPGRADE"
echo "=" | tr '=' '=' | head -c 60; echo
echo "🔑 Upgrading with new X API credentials"
echo "👤 Target User: @nxrsultxn"
echo "🐦 Enhanced tweet fetching and login verification"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Function to backup existing .env
backup_env() {
    if [ -f ".env" ]; then
        BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"
        cp .env "$BACKUP_FILE"
        echo "✅ Backed up existing .env to $BACKUP_FILE"
    fi
}

# Function to update environment variables
update_x_api_env() {
    echo "🔧 Updating X API environment variables..."
    
    # Backup existing .env
    backup_env
    
    # Add new X API credentials
    cat >> .env << 'EOF'

# NEW X API CREDENTIALS - UPGRADED
TWITTER_API_KEY=cEDodIuWbGdMynFSunnxdFJVS
TWITTER_API_SECRET=xGpwmVssQSROioYSpt0PQULMtC18kAslMwh2qbCoRlPZakdRES

# X API CONFIGURATION - ENHANCED
X_API_ENABLED=true
X_API_VERSION=2
X_API_RATE_LIMIT_ENABLED=true
X_API_MAX_REQUESTS_PER_WINDOW=300
X_API_WINDOW_MINUTES=15

# X API FEATURES
X_API_LOGIN_VERIFICATION=true
X_API_TWEET_FETCHING=true
X_API_USER_TIMELINE=true
X_API_RATE_MONITORING=true

# FALLBACK CONFIGURATION - ENHANCED
PREFER_X_API=true
ENABLE_X_API_FALLBACK=true
X_API_PRIORITY=1
EOF

    echo "✅ X API environment variables updated"
}

# Function to install dependencies
install_dependencies() {
    echo ""
    echo "📦 Installing X API dependencies..."
    
    # Install twitter-api-v2 if not already installed
    if ! npm list twitter-api-v2 &> /dev/null; then
        echo "Installing twitter-api-v2..."
        npm install twitter-api-v2
        echo "✅ twitter-api-v2 installed"
    else
        echo "✅ twitter-api-v2 already installed"
    fi
    
    # Update other dependencies
    npm install
    echo "✅ Dependencies updated"
}

# Function to test X API credentials
test_x_api() {
    echo ""
    echo "🧪 Testing X API credentials..."
    
    if command -v node &> /dev/null; then
        echo "Running X API credentials test..."
        if node scripts/test-x-api-credentials.js; then
            echo "✅ X API credentials test passed"
            return 0
        else
            echo "❌ X API credentials test failed"
            return 1
        fi
    else
        echo "⚠️ Node.js not available for testing"
        return 1
    fi
}

# Function to test login verification
test_login_verification() {
    echo ""
    echo "🔐 Testing login verification..."
    
    if command -v curl &> /dev/null; then
        echo "Testing login verification endpoint..."
        
        # Start the application in background for testing
        if ! pgrep -f "next dev" > /dev/null; then
            echo "Starting application for testing..."
            npm run dev &
            APP_PID=$!
            sleep 10  # Wait for app to start
        fi
        
        # Test login verification
        RESPONSE=$(curl -s -X POST http://localhost:3000/api/x-api/login \
            -H "Content-Type: application/json" \
            -d '{"username": "nxrsultxn"}' || echo "curl_failed")
        
        if [[ "$RESPONSE" == *"success"* ]]; then
            echo "✅ Login verification test passed"
            LOGIN_SUCCESS=true
        else
            echo "❌ Login verification test failed"
            echo "Response: $RESPONSE"
            LOGIN_SUCCESS=false
        fi
        
        # Clean up background process
        if [ ! -z "$APP_PID" ]; then
            kill $APP_PID 2>/dev/null || true
        fi
        
        return $([ "$LOGIN_SUCCESS" = true ] && echo 0 || echo 1)
    else
        echo "⚠️ curl not available for testing"
        return 1
    fi
}

# Function to test tweet fetching
test_tweet_fetching() {
    echo ""
    echo "🐦 Testing tweet fetching..."
    
    if command -v curl &> /dev/null; then
        echo "Testing tweet fetching endpoint..."
        
        # Start the application in background for testing
        if ! pgrep -f "next dev" > /dev/null; then
            echo "Starting application for testing..."
            npm run dev &
            APP_PID=$!
            sleep 10  # Wait for app to start
        fi
        
        # Test tweet fetching
        RESPONSE=$(curl -s -X POST http://localhost:3000/api/x-api/tweet \
            -H "Content-Type: application/json" \
            -d '{"tweetUrl": "https://x.com/nxrsultxn/status/1931733077400641998"}' || echo "curl_failed")
        
        if [[ "$RESPONSE" == *"success"* ]]; then
            echo "✅ Tweet fetching test passed"
            TWEET_SUCCESS=true
        else
            echo "❌ Tweet fetching test failed"
            echo "Response: $RESPONSE"
            TWEET_SUCCESS=false
        fi
        
        # Clean up background process
        if [ ! -z "$APP_PID" ]; then
            kill $APP_PID 2>/dev/null || true
        fi
        
        return $([ "$TWEET_SUCCESS" = true ] && echo 0 || echo 1)
    else
        echo "⚠️ curl not available for testing"
        return 1
    fi
}

# Function to generate upgrade report
generate_upgrade_report() {
    echo ""
    echo "📋 X API UPGRADE REPORT"
    echo "=" | tr '=' '=' | head -c 60; echo
    
    # Test results
    local env_updated=true
    local deps_installed=true
    local api_test_passed=false
    local login_test_passed=false
    local tweet_test_passed=false
    
    # Run tests
    if test_x_api; then
        api_test_passed=true
    fi
    
    if test_login_verification; then
        login_test_passed=true
    fi
    
    if test_tweet_fetching; then
        tweet_test_passed=true
    fi
    
    echo ""
    echo "📊 UPGRADE SUMMARY"
    echo "=" | tr '=' '=' | head -c 40; echo
    
    echo "🔧 Environment Setup:"
    echo "   ✅ Environment Variables: $([ "$env_updated" = true ] && echo "UPDATED" || echo "FAILED")"
    echo "   ✅ Dependencies: $([ "$deps_installed" = true ] && echo "INSTALLED" || echo "FAILED")"
    
    echo ""
    echo "🧪 X API Tests:"
    echo "   ✅ API Credentials: $([ "$api_test_passed" = true ] && echo "PASSED" || echo "FAILED")"
    echo "   ✅ Login Verification: $([ "$login_test_passed" = true ] && echo "PASSED" || echo "FAILED")"
    echo "   ✅ Tweet Fetching: $([ "$tweet_test_passed" = true ] && echo "PASSED" || echo "FAILED")"
    
    local all_passed=true
    if [ "$api_test_passed" != true ] || [ "$login_test_passed" != true ] || [ "$tweet_test_passed" != true ]; then
        all_passed=false
    fi
    
    echo ""
    if [ "$all_passed" = true ]; then
        echo "🎉 X API UPGRADE SUCCESSFUL!"
        echo "✅ All tests passed"
        echo "✅ New X API credentials are working"
        echo "✅ Login verification is functional"
        echo "✅ Tweet fetching is operational"
        echo ""
        echo "🎯 SUCCESS: Your LayerEdge platform is upgraded with new X API!"
    else
        echo "⚠️ X API UPGRADE PARTIALLY SUCCESSFUL"
        echo "❌ Some tests failed - review the output above"
        echo "💡 The upgrade may still be functional for basic operations"
    fi
    
    echo ""
    echo "📋 Next Steps:"
    if [ "$all_passed" = true ]; then
        echo "1. Deploy to production: npm run build && npm start"
        echo "2. Test in web interface: http://localhost:3000/submit"
        echo "3. Monitor X API usage and rate limits"
        echo "4. Test with target tweet: https://x.com/nxrsultxn/status/1931733077400641998"
    else
        echo "1. Review failed tests and fix any issues"
        echo "2. Re-run upgrade: bash scripts/upgrade-x-api.sh"
        echo "3. Check X API credentials in .env file"
        echo "4. Verify network connectivity and API access"
    fi
    
    return $([ "$all_passed" = true ] && echo 0 || echo 1)
}

# Main execution
main() {
    echo "🚀 Starting X API upgrade process..."
    
    # Step 1: Update environment variables
    update_x_api_env
    
    # Step 2: Install dependencies
    install_dependencies
    
    # Step 3: Generate upgrade report with tests
    if generate_upgrade_report; then
        echo ""
        echo "🎉 X API UPGRADE COMPLETED SUCCESSFULLY!"
        echo "🔑 API Key: cEDodIuWbGdMynFSunnxdFJVS"
        echo "🔒 API Secret: [CONFIGURED]"
        echo "👤 Target User: @nxrsultxn"
        echo "🐦 Target Tweet: https://x.com/nxrsultxn/status/1931733077400641998"
        return 0
    else
        echo ""
        echo "⚠️ X API UPGRADE COMPLETED WITH ISSUES"
        echo "💡 Review the test results and fix any problems"
        return 1
    fi
}

# Handle command line execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
