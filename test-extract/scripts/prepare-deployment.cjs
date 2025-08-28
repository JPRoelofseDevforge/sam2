// Prepare deployment by copying production environment file
const fs = require('fs');
const path = require('path');

console.log('Preparing deployment...');

// Copy production environment file to .env
const envProdPath = path.join(__dirname, '..', '.env.production');
const envPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(envProdPath)) {
  fs.copyFileSync(envProdPath, envPath);
  console.log('✅ Copied .env.production to .env');
} else {
  console.log('⚠️  .env.production not found, using existing .env if present');
}

console.log('Deployment preparation complete!');