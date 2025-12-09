#!/bin/bash

# ========================================
# Android App Troubleshooting for Pixel 8
# ========================================

echo "=========================================="
echo "Android Build Troubleshooting Script"
echo "=========================================="
echo ""

# Step 1: Check Node and npm
echo "✓ Checking Node.js and npm..."
node --version
npm --version
echo ""

# Step 2: Check if we're in the right directory
echo "✓ Current directory: $(pwd)"
cd frontend_app 2>/dev/null && echo "✓ In frontend_app directory" || echo "⚠ Need to be in frontend_app directory"
echo ""

# Step 3: Clear cache and reinstall
echo "✓ Cleaning npm cache..."
npm cache clean --force

# Step 4: Remove node_modules and reinstall
echo "✓ Removing old node_modules..."
rm -rf node_modules package-lock.json

echo "✓ Reinstalling dependencies..."
npm install

echo ""
echo "=========================================="
echo "Ready to run: npm run android"
echo "=========================================="
