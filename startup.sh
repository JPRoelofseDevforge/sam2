#!/bin/bash

# Azure App Service startup script for SAM application
echo "Starting SAM Application..."
export NODE_ENV=production
cd /home/site/wwwroot

# Install dependencies (including devDependencies needed for build)
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    if ! npm ci; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
else
    echo "✅ Dependencies already installed"
fi

# Check if dist directory exists (built files)
if [ -d "dist" ] && [ -f "dist/server.js" ]; then
    echo "✅ Built files found, skipping build step"
else
    echo "Building application..."
    echo "Using npx vite build and npm run build:server..."
    if ! npx vite build || ! npm run build:server; then
        echo "ERROR: Failed to build application"
        exit 1
    fi
    echo "✅ Application built successfully"
fi

# Start the application
echo "Starting server..."
exec npm start