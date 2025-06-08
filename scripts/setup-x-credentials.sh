#!/bin/bash

# X/Twitter Credentials Setup Script for LayerEdge Platform
# Securely configures X login credentials for Twikit integration

set -e  # Exit on any error

echo "🔐 LAYEREDGE X/TWITTER CREDENTIALS SETUP"
echo "=" | tr '=' '=' | head -c 60; echo
echo "🐦 Setting up credentials for enhanced fallback system"
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

# Function to update or add environment variable
update_env_var() {
    local var_name="$1"
    local var_value="$2"
    local comment="$3"
    
    if [ -f ".env" ]; then
        # Check if variable already exists
        if grep -q "^${var_name}=" .env; then
            # Update existing variable
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s|^${var_name}=.*|${var_name}=${var_value}${comment:+ # $comment}|" .env
            else
                # Linux
                sed -i "s|^${var_name}=.*|${var_name}=${var_value}${comment:+ # $comment}|" .env
            fi
            echo "✅ Updated ${var_name}"
        else
            # Add new variable
            echo "${var_name}=${var_value}${comment:+ # $comment}" >> .env
            echo "✅ Added ${var_name}"
        fi
    else
        # Create new .env file
        echo "${var_name}=${var_value}${comment:+ # $comment}" > .env
        echo "✅ Created .env and added ${var_name}"
    fi
}

# Main setup function
setup_credentials() {
    echo "🔧 Setting up X/Twitter credentials..."
    
    # Backup existing .env
    backup_env
    
    # Set the credentials
    echo "📝 Adding X/Twitter credentials to .env file..."
    
    # Add Twikit credentials
    update_env_var "TWIKIT_USERNAME" "nxrsultxn" "Your X/Twitter username"
    update_env_var "TWIKIT_EMAIL" "nnnatlusrun@gmail.com" "Your email associated with X/Twitter account"
    update_env_var "TWIKIT_PASSWORD" "nuriknurik22" "Your X/Twitter password"
    
    # Add Twikit advanced settings
    update_env_var "TWIKIT_LANGUAGE" "en-US" "Language setting for Twikit client"
    update_env_var "TWIKIT_TIMEOUT" "30" "Request timeout in seconds"
    update_env_var "TWIKIT_RETRY_COUNT" "3" "Number of retries for failed requests"
    
    # Add Scweet service configuration
    update_env_var "SCWEET_SERVICE_URL" "http://scweet-service:8001" "Internal Docker network URL"
    update_env_var "PREFER_API" "false" "Prioritize Scweet over Twitter API"
    update_env_var "ENABLE_SCWEET" "true" "Enable Official Scweet v3.0+"
    update_env_var "ENABLE_TWIKIT" "true" "Enable Twikit fallback"
    
    echo ""
    echo "✅ X/Twitter credentials configured successfully!"
}

# Function to verify credentials
verify_credentials() {
    echo ""
    echo "🔍 Verifying credential configuration..."
    
    if [ ! -f ".env" ]; then
        echo "❌ .env file not found"
        return 1
    fi
    
    # Check required variables
    local required_vars=("TWIKIT_USERNAME" "TWIKIT_EMAIL" "TWIKIT_PASSWORD")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        echo "✅ All required credentials are configured"
        
        # Show configured values (masked password)
        echo ""
        echo "📋 Configured credentials:"
        echo "   Username: $(grep '^TWIKIT_USERNAME=' .env | cut -d'=' -f2)"
        echo "   Email: $(grep '^TWIKIT_EMAIL=' .env | cut -d'=' -f2)"
        echo "   Password: $(grep '^TWIKIT_PASSWORD=' .env | cut -d'=' -f2 | sed 's/./*/g')"
        
        return 0
    else
        echo "❌ Missing required variables: ${missing_vars[*]}"
        return 1
    fi
}

# Function to test credentials
test_credentials() {
    echo ""
    echo "🧪 Testing X/Twitter credentials..."
    
    if command -v node &> /dev/null; then
        echo "Running credential verification test..."
        node scripts/test-x-credentials.js || {
            echo "⚠️ Credential test had issues - check output above"
            return 1
        }
    else
        echo "⚠️ Node.js not available for testing"
        echo "💡 Install Node.js to run credential tests"
        return 1
    fi
}

# Function to setup Docker environment
setup_docker_env() {
    echo ""
    echo "🐳 Setting up Docker environment variables..."
    
    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        echo "❌ docker-compose.yml not found"
        return 1
    fi
    
    # Verify Twikit environment variables are in docker-compose.yml
    if grep -q "TWIKIT_USERNAME" docker-compose.yml; then
        echo "✅ Docker Compose already configured for Twikit"
    else
        echo "⚠️ Docker Compose may need Twikit environment variables"
        echo "💡 Check docker-compose.yml for Twikit configuration"
    fi
}

# Main execution
main() {
    echo "🚀 Starting X/Twitter credentials setup for LayerEdge platform..."
    echo ""
    
    # Setup credentials
    setup_credentials
    
    # Verify credentials
    if verify_credentials; then
        echo ""
        echo "🎉 CREDENTIALS SETUP COMPLETED!"
        
        # Setup Docker environment
        setup_docker_env
        
        # Test credentials
        if test_credentials; then
            echo ""
            echo "✅ ALL TESTS PASSED!"
            echo "🎯 Your X/Twitter credentials are ready for use"
            echo ""
            echo "📋 Next Steps:"
            echo "1. Start the enhanced services: npm run deploy:critical-fixes"
            echo "2. Test the specific failing tweet: npm run test:specific-failure"
            echo "3. Run full system diagnostic: npm run diagnose:system-failures"
            echo "4. Test in web interface at: http://localhost:3000/submit"
        else
            echo ""
            echo "⚠️ CREDENTIAL TESTS FAILED"
            echo "💡 The credentials are configured but may need service startup"
            echo ""
            echo "📋 Troubleshooting Steps:"
            echo "1. Start services: docker-compose up -d"
            echo "2. Check service health: docker-compose ps"
            echo "3. Re-run test: npm run test:x-credentials"
        fi
    else
        echo ""
        echo "❌ CREDENTIAL SETUP FAILED"
        echo "💡 Please check the error messages above and try again"
        exit 1
    fi
    
    echo ""
    echo "🔐 X/Twitter credentials setup completed!"
    echo "🐦 Username: nxrsultxn"
    echo "📧 Email: nnnatlusrun@gmail.com"
    echo "🔒 Password: [CONFIGURED]"
}

# Handle command line execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
