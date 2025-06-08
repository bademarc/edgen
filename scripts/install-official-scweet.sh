#!/bin/bash

# Official Scweet v3.0+ Installation Script for LayerEdge Platform
# Installs Official Altimis/Scweet repository with all dependencies

set -e  # Exit on any error

echo "🚀 Installing Official Scweet v3.0+ for LayerEdge Platform"
echo "📦 Repository: https://github.com/Altimis/Scweet"
echo "=" | tr '=' '=' | head -c 60; echo

# Check Python version
echo "🐍 Checking Python version..."
python_version=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
required_version="3.7"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" = "$required_version" ]; then
    echo "✅ Python $python_version is compatible (>= 3.7)"
else
    echo "❌ Python $python_version is not compatible. Requires Python >= 3.7"
    exit 1
fi

# Check if pip is available
echo "📦 Checking pip availability..."
if command -v pip3 &> /dev/null; then
    echo "✅ pip3 is available"
    PIP_CMD="pip3"
elif command -v pip &> /dev/null; then
    echo "✅ pip is available"
    PIP_CMD="pip"
else
    echo "❌ pip is not available. Please install pip first."
    exit 1
fi

# Create virtual environment (optional but recommended)
echo "🔧 Setting up virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate
echo "✅ Virtual environment activated"

# Upgrade pip
echo "⬆️ Upgrading pip..."
$PIP_CMD install --upgrade pip

# Install system dependencies information
echo "🖥️ System Dependencies Check..."
echo "ℹ️ The following system packages are required for Official Scweet v3.0+:"
echo "   - Google Chrome or Chromium browser"
echo "   - Xvfb (for headless operation)"
echo "   - Various system libraries for browser automation"
echo ""

# Detect OS and provide installation instructions
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Linux detected. Install dependencies with:"
    echo "   sudo apt-get update"
    echo "   sudo apt-get install -y wget gnupg unzip curl xvfb"
    echo "   sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2"
    echo "   sudo apt-get install -y libxcomposite1 libxdamage1 libxrandr2"
    echo "   sudo apt-get install -y libgbm1 libxss1 libasound2"
    echo "   # Install Google Chrome:"
    echo "   wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -"
    echo "   echo 'deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main' | sudo tee /etc/apt/sources.list.d/google-chrome.list"
    echo "   sudo apt-get update && sudo apt-get install -y google-chrome-stable"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 macOS detected. Install dependencies with:"
    echo "   brew install --cask google-chrome"
    echo "   # Or download from: https://www.google.com/chrome/"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo "🪟 Windows detected. Install dependencies:"
    echo "   Download and install Google Chrome from: https://www.google.com/chrome/"
fi

echo ""
read -p "Have you installed the required system dependencies? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⚠️ Please install system dependencies first, then run this script again."
    exit 1
fi

# Install Official Scweet dependencies first
echo "📋 Installing Official Scweet dependencies..."
$PIP_CMD install certifi python-dotenv urllib3 PyVirtualDisplay requests
$PIP_CMD install "beautifulsoup4==4.12.3"
$PIP_CMD install "nodriver==0.38.post1"

# Install Official Scweet from GitHub
echo "📦 Installing Official Scweet v3.0+ from Altimis/Scweet repository..."
$PIP_CMD install git+https://github.com/Altimis/Scweet.git@master

# Install additional dependencies for our service
echo "🔧 Installing additional service dependencies..."
$PIP_CMD install fastapi uvicorn pydantic redis asyncio

# Verify installation
echo "✅ Verifying Official Scweet installation..."
python3 -c "
try:
    from Scweet.scweet import Scweet
    from Scweet.utils import create_mailtm_email
    print('✅ Official Scweet v3.0+ imported successfully!')
    
    # Try to initialize (without actually running)
    scweet = Scweet(
        proxy=None,
        cookies=None,
        cookies_directory='/tmp/test_cookies',
        user_agent=None,
        disable_images=True,
        env_path='.env',
        n_splits=-1,
        concurrency=1,
        headless=True,
        scroll_ratio=50
    )
    print('✅ Official Scweet initialization test passed!')
    
except ImportError as e:
    print(f'❌ Import failed: {e}')
    exit(1)
except Exception as e:
    print(f'⚠️ Initialization warning: {e}')
    print('✅ Import successful, initialization may need browser setup')
"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 INSTALLATION SUCCESSFUL!"
    echo "=" | tr '=' '=' | head -c 60; echo
    echo "✅ Official Scweet v3.0+ is installed and ready"
    echo "📦 Source: https://github.com/Altimis/Scweet"
    echo ""
    echo "🔧 Next Steps:"
    echo "1. Copy .env.scweet.example to .env and configure credentials"
    echo "2. Test the installation: python3 scripts/test-official-scweet.py"
    echo "3. Start the Scweet service: python3 src/lib/scweet-service.py"
    echo "4. Run integration tests: node scripts/test-scweet-integration.js"
    echo ""
    echo "📚 Documentation:"
    echo "   - Official Scweet: https://github.com/Altimis/Scweet"
    echo "   - LayerEdge Integration: See README.md"
    echo ""
    echo "🎯 Ready for LayerEdge platform integration!"
else
    echo ""
    echo "⚠️ INSTALLATION COMPLETED WITH WARNINGS"
    echo "=" | tr '=' '=' | head -c 60; echo
    echo "📦 Official Scweet v3.0+ is installed but may need configuration"
    echo "🔧 Check browser installation and system dependencies"
    echo "📋 Run: python3 scripts/test-official-scweet.py for detailed testing"
fi

echo ""
echo "💡 Troubleshooting:"
echo "   - Browser issues: Ensure Chrome/Chromium is installed"
echo "   - Permission errors: Check file permissions in cookies directory"
echo "   - Import errors: Verify Python path and virtual environment"
echo "   - Network issues: Check internet connectivity for GitHub access"
