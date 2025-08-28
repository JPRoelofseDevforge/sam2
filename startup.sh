#!/bin/bash

# Azure App Service startup script for SAM application with detailed logging
echo "=== Starting SAM Application ==="
echo "Current working directory: $(pwd)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Environment: $NODE_ENV"

# Set production environment
export NODE_ENV=production

# Change to the application directory
cd /home/site/wwwroot
echo "Changed to application directory: $(pwd)"

# Check environment variables
echo "=== Environment Variables Check ==="
echo "DB_HOST: ${DB_HOST:-'NOT SET'}"
echo "DB_PORT: ${DB_PORT:-'NOT SET'}"
echo "DB_NAME: ${DB_NAME:-'NOT SET'}"
echo "DB_USER: ${DB_USER:-'NOT SET'}"
echo "DB_PASSWORD: ${DB_PASSWORD:+'SET (hidden)'}"
echo "JWT_SECRET: ${JWT_SECRET:+'SET (hidden)'}"
echo "PORT: ${PORT:-'NOT SET'}"

# Validate required environment variables
MISSING_VARS=""
if [ -z "$DB_HOST" ]; then MISSING_VARS="$MISSING_VARS DB_HOST"; fi
if [ -z "$DB_PORT" ]; then MISSING_VARS="$MISSING_VARS DB_PORT"; fi
if [ -z "$DB_NAME" ]; then MISSING_VARS="$MISSING_VARS DB_NAME"; fi
if [ -z "$DB_USER" ]; then MISSING_VARS="$MISSING_VARS DB_USER"; fi
if [ -z "$DB_PASSWORD" ]; then MISSING_VARS="$MISSING_VARS DB_PASSWORD"; fi
if [ -z "$JWT_SECRET" ]; then MISSING_VARS="$MISSING_VARS JWT_SECRET"; fi

if [ ! -z "$MISSING_VARS" ]; then
    echo "ERROR: Missing required environment variables:$MISSING_VARS"
    exit 1
fi

echo "✅ All required environment variables are set"
echo "Waiting 10 seconds for database services to initialize..."
sleep 10

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    if ! npm ci --production; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
else
    echo "✅ Dependencies already installed"
fi

# Verify the compiled server exists
if [ ! -f "dist/server.js" ]; then
    echo "ERROR: Compiled server not found at dist/server.js"
    echo "Files in current directory:"
    ls -la
    exit 1
fi
echo "✅ Compiled server found at dist/server.js"

# Copy production environment file
if [ -f ".env.production" ]; then
    cp .env.production .env
    echo "✅ Production environment file loaded"
else
    echo "⚠️  No .env.production file found, using existing .env"
fi

# Test database connectivity before starting the app
echo "=== Testing Database Connection ==="
node -e "
const { Client } = require('pg');
const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => {
    console.log('✅ Database connection successful');
    return client.query('SELECT 1 as test');
  })
  .then(result => {
    console.log('✅ Database query successful:', result.rows[0]);
    client.end();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.error('Connection details:');
    console.error('  Host:', process.env.DB_HOST);
    console.error('  Port:', process.env.DB_PORT);
    console.error('  Database:', process.env.DB_NAME);
    console.error('  User:', process.env.DB_USER);
    client.end();
    process.exit(1);
  });
"

if [ $? -ne 0 ]; then
    echo "ERROR: Database connectivity test failed"
    exit 1
fi

# Start the application
echo "=== Starting Application ==="
echo "Starting server..."
exec npm start