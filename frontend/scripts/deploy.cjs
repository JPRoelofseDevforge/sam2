#!/usr/bin/env node

/**
 * Deployment script for Vite React TypeScript project
 * This script handles the deployment process after build
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting deployment process...');

try {
  // Check if dist/build directory exists
  const distDir = path.join(process.cwd(), 'dist');

  if (!fs.existsSync(distDir)) {
    console.error('❌ Build directory not found. Please run build first.');
    process.exit(1);
  }

  console.log('✅ Build directory found');

  // Example deployment steps:
  // 1. Copy files to deployment target
  // 2. Upload to CDN
  // 3. Invalidate cache
  // 4. Run database migrations
  // 5. Health checks

  console.log('📦 Deployment package ready');
  console.log('🔍 To deploy to Azure Static Web Apps:');
  console.log('   1. Commit and push changes to your repository');
  console.log('   2. Azure will automatically build and deploy');
  console.log('   3. Check Azure portal for deployment status');

  // Example: Show deployment info
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`📋 Project: ${packageJson.name} v${packageJson.version}`);

  console.log('✅ Deployment script completed successfully');

} catch (error) {
  console.error('❌ Error during deployment:', error.message);
  process.exit(1);
}