#!/bin/bash

# RabbitMQ Examples Setup Script
echo "🐰 RabbitMQ Implementation Examples Setup"
echo "========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3 first."
    exit 1
fi

echo "✅ Node.js, npm, Python, and pip are installed"

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install Node.js dependencies"
    exit 1
fi

echo "✅ Node.js dependencies installed successfully"

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
pip3 install -r examples/python/requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Failed to install Python dependencies"
    exit 1
fi

echo "✅ Python dependencies installed successfully"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOL
# RabbitMQ Configuration
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/

# Message settings
MESSAGE_TTL=60000
MAX_RETRIES=3
RETRY_DELAY=1000

# Consumer settings
CONSUMER_PREFETCH=1

# Logging
LOG_LEVEL=info
LOG_FILE=logs/rabbitmq.log
EOL
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Create logs directory
mkdir -p logs

# Check if Docker is available
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "🐳 Docker detected. You can run RabbitMQ with:"
    echo "   docker-compose up -d"
    echo "   or"
    echo "   docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management"
else
    echo "🐳 Docker not detected. Make sure RabbitMQ is running on localhost:5672"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start RabbitMQ server:"
echo "   docker-compose up -d"
echo "   OR make sure RabbitMQ is running on localhost:5672"
echo ""
echo "2. Run health check:"
echo "   npm run healthcheck"
echo ""
echo "3. Test basic examples:"
echo "   # Start consumer in one terminal"
echo "   node examples/basic/consumer.js"
echo ""
echo "   # Run producer in another terminal"
echo "   node examples/basic/producer.js"
echo ""
echo "4. Test Python examples:"
echo "   # Start Python consumer"
echo "   python examples/python/basic_consumer.py"
echo ""
echo "   # Run Python producer"
echo "   python examples/python/basic_producer.py"
echo ""
echo "5. Test different patterns:"
echo "   node examples/direct/producer.js"
echo "   node examples/topic/producer.js"
echo "   node examples/fanout/producer.js"
echo "   node examples/rpc/server.js"
echo ""
echo "📚 Check README.md for detailed documentation"
echo ""
echo "🌐 RabbitMQ Management UI: http://localhost:15672"
echo "   Username: guest"
echo "   Password: guest"

