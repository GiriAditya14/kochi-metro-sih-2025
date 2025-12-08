#!/bin/bash
# Test build script - simulates Render deployment
# This tests if all dependencies can be installed

set -e  # Exit on error

echo "🔧 Testing build process..."
echo "Python version: $(python --version)"

echo ""
echo "📦 Upgrading pip..."
pip install --upgrade pip

echo ""
echo "📥 Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "✅ Build test successful!"
echo ""
echo "🧪 Testing imports..."
python -c "
import fastapi
import uvicorn
import sqlalchemy
import pandas
import numpy
import ortools
print('✓ All core dependencies imported successfully')
"

echo ""
echo "🚀 Build test completed successfully!"

