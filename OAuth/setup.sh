#!/bin/bash

# OAuth 2.0 Example Setup Script
echo "🚀 OAuth 2.0 Implementation Example Setup"
echo "========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env 2>/dev/null || echo "⚠️  .env.example not found, creating basic .env file..."

    # Create basic .env file if example doesn't exist
    if [ ! -f .env ]; then
        cat > .env << EOL
# OAuth 2.0 Configuration
NODE_ENV=development
PORT=3000
SESSION_SECRET=your-secret-key-change-this-in-production

# Replace these with your actual OAuth credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
EOL
    fi

    echo "✅ .env file created"
    echo "⚠️  Please edit .env file with your OAuth credentials before running"
else
    echo "✅ .env file already exists"
fi

# Create logs directory
mkdir -p logs

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit the .env file with your OAuth credentials"
echo "2. Set up OAuth applications:"
echo "   - Google: https://console.cloud.google.com/apis/credentials"
echo "   - GitHub: https://github.com/settings/applications/new"
echo "3. Run the application:"
echo "   npm start"
echo "4. Visit http://localhost:3000 to test OAuth flows"
echo ""
echo "For Docker deployment:"
echo "docker-compose up -d"
echo ""
echo "📚 Check OAUTH_README.md for detailed documentation"
