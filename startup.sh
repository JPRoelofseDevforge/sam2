#!/bin/bash

# Azure App Service startup script for SAM application
echo "=== Starting SAM Application ==="

# Set production environment
export NODE_ENV=production

# Change to the application directory
cd /home/site/wwwroot

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    if ! npm ci --production; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
fi

# Verify the compiled server exists
if [ ! -f "dist/server.js" ]; then
    echo "ERROR: Compiled server not found at dist/server.js"
    exit 1
fi

# Copy production environment file
if [ -f ".env.production" ]; then
    cp .env.production .env
    echo "✅ Production environment file loaded"
fi

# Start the application
echo "Starting server..."
exec npm start