#!/bin/bash
# Setup script for AI Test Framework

echo "🚀 Setting up AI Test Framework..."

# Check Python version
python3.11 --version > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Python 3.11+ required but not found"
    exit 1
fi

# Create virtual environment
echo "📦 Creating Python virtual environment..."
python3.11 -m venv venv

# Activate and install dependencies
echo "⬇️  Installing dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
playwright install chromium

echo "✅ Setup complete!"
echo ""
echo "🔧 To get started:"
echo "1. source venv/bin/activate"
echo "2. Add your Google API key to .env"
echo "3. python simple_test.py"