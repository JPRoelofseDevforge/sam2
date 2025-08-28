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
    npm ci --production
fi

# Ensure the compiled server exists
if [ ! -f "dist/server.js" ]; then
    echo "Compiling TypeScript server..."
    npx tsc src/api/server.ts --outDir . --target es2020 --module commonjs --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck
    mkdir -p dist
    mv server.js dist/server.js 2>/dev/null || cp server.js dist/server.js 2>/dev/null || echo "Server compilation completed"
fi

# Copy production environment file
if [ -f ".env.production" ]; then
    cp .env.production .env
    echo "✅ Production environment file loaded"
fi

# Start the application
echo "Starting server..."
npm start