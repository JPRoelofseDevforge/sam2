#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting SAM Dashboard API Deployment Process...\n');

// Configuration
const CONFIG = {
  appName: 'samdashboardapi',
  resourceGroup: 'samdashboardapi_group',
  sourceDir: path.join(__dirname, '..'),
  buildDir: path.join(__dirname, '..', 'dist'),
  deploymentFile: path.join(__dirname, '..', '.deployment'),
  startupScript: path.join(__dirname, '..', 'startup.sh'),
  lockFile: path.join(__dirname, '..', '.deployment.lock'),
  maxRetries: 3,
  baseRetryDelay: 2000, // 2 seconds
  azureValidationTimeout: 30000 // 30 seconds
};

// Generate timestamped package name
function generatePackageName() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // Format: 2025-08-28T18-18-41
  return `app-${timestamp}.zip`;
}

// Deployment locking mechanism
function acquireLock() {
  try {
    if (fs.existsSync(CONFIG.lockFile)) {
      const lockData = JSON.parse(fs.readFileSync(CONFIG.lockFile, 'utf8'));
      const lockAge = Date.now() - lockData.timestamp;

      // If lock is older than 30 minutes, consider it stale
      if (lockAge > 30 * 60 * 1000) {
        console.log('🔓 Found stale lock file, removing...');
        releaseLock();
      } else {
        throw new Error(`Deployment already in progress (started ${Math.round(lockAge / 1000)}s ago)`);
      }
    }

    const lockData = {
      timestamp: Date.now(),
      pid: process.pid,
      hostname: require('os').hostname()
    };

    fs.writeFileSync(CONFIG.lockFile, JSON.stringify(lockData, null, 2));
    console.log('🔒 Deployment lock acquired');
    return true;
  } catch (error) {
    logError(`Failed to acquire deployment lock: ${error.message}`);
    throw error;
  }
}

function releaseLock() {
  try {
    if (fs.existsSync(CONFIG.lockFile)) {
      fs.unlinkSync(CONFIG.lockFile);
      console.log('🔓 Deployment lock released');
    }
  } catch (error) {
    console.warn(`⚠️  Failed to release deployment lock: ${error.message}`);
  }
}

// Retry logic with exponential backoff
async function retryWithBackoff(operation, operationName, maxRetries = CONFIG.maxRetries) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries} for ${operationName}`);
      const result = await operation();
      logSuccess(`${operationName} succeeded on attempt ${attempt}`);
      return result;
    } catch (error) {
      lastError = error;
      console.log(`❌ Attempt ${attempt}/${maxRetries} failed: ${error.message}`);

      // Check if it's a 409 conflict error
      if (error.message.includes('409') || error.message.includes('Conflict')) {
        if (attempt < maxRetries) {
          const delay = CONFIG.baseRetryDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Waiting ${delay}ms before retry due to 409 conflict...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      } else {
        // For non-409 errors, don't retry
        throw error;
      }
    }
  }

  throw new Error(`${operationName} failed after ${maxRetries} attempts. Last error: ${lastError.message}`);
}

// Azure resource validation
async function validateAzureResources() {
  console.log('🔍 Validating Azure resources...');

  try {
    // Check if resource group exists
    const rgCommand = `az group show --name ${CONFIG.resourceGroup} --query "name"`;
    execSync(rgCommand, { stdio: 'pipe', encoding: 'utf8' });
    console.log(`✅ Resource group '${CONFIG.resourceGroup}' exists`);

    // Check if app service exists
    const appCommand = `az webapp show --resource-group ${CONFIG.resourceGroup} --name ${CONFIG.appName} --query "name"`;
    execSync(appCommand, { stdio: 'pipe', encoding: 'utf8' });
    console.log(`✅ App service '${CONFIG.appName}' exists`);

    // Check app service state
    const stateCommand = `az webapp show --resource-group ${CONFIG.resourceGroup} --name ${CONFIG.appName} --query "state"`;
    const state = execSync(stateCommand, { stdio: 'pipe', encoding: 'utf8' }).trim().replace(/"/g, '');
    console.log(`📊 App service state: ${state}`);

    if (state !== 'Running') {
      console.log(`⚠️  App service is in '${state}' state, attempting to start...`);
      const startCommand = `az webapp start --resource-group ${CONFIG.resourceGroup} --name ${CONFIG.appName}`;
      execSync(startCommand, { stdio: 'inherit', encoding: 'utf8' });
      console.log('✅ App service started');
    }

    logSuccess('Azure resource validation completed');
  } catch (error) {
    throw new Error(`Azure resource validation failed: ${error.message}`);
  }
}

// Enhanced deployment status check
async function checkDeploymentStatus() {
  console.log('📊 Checking current deployment status...');

  try {
    const statusCommand = `az webapp deployment list-publishing-profiles --resource-group ${CONFIG.resourceGroup} --name ${CONFIG.appName} --query "[0].{publishUrl:publishUrl, userName:userName, userPWD:userPWD}"`;
    const status = execSync(statusCommand, { stdio: 'pipe', encoding: 'utf8' });

    if (status.trim()) {
      console.log('✅ Deployment profiles available');
    }

    // Check for any ongoing deployments
    const deploymentCommand = `az webapp deployment source show --resource-group ${CONFIG.resourceGroup} --name ${CONFIG.appName} --query "{status: status, url: url}"`;
    try {
      const deploymentInfo = execSync(deploymentCommand, { stdio: 'pipe', encoding: 'utf8' });
      if (deploymentInfo.trim()) {
        const info = JSON.parse(deploymentInfo);
        console.log(`📋 Current deployment status: ${info.status || 'Unknown'}`);
      }
    } catch (error) {
      console.log('ℹ️  No active deployment source configured (this is normal for first deployment)');
    }

    logSuccess('Deployment status check completed');
  } catch (error) {
    console.log(`⚠️  Could not check deployment status: ${error.message}`);
    // Don't throw error here as this might fail on first deployment
  }
}

// Enhanced error handling for Azure error codes
function handleAzureError(error) {
  const errorMessage = error.message.toLowerCase();

  if (errorMessage.includes('409') || errorMessage.includes('conflict')) {
    return {
      type: 'CONFLICT',
      message: 'Deployment conflict detected. Another deployment may be in progress.',
      suggestion: 'Wait for the current deployment to complete or check Azure portal for deployment status.'
    };
  }

  if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
    return {
      type: 'AUTH',
      message: 'Authentication or authorization failed.',
      suggestion: 'Check Azure CLI login status with "az login" and verify permissions.'
    };
  }

  if (errorMessage.includes('404') || errorMessage.includes('not found')) {
    return {
      type: 'NOT_FOUND',
      message: 'Azure resource not found.',
      suggestion: 'Verify resource group and app service names are correct.'
    };
  }

  if (errorMessage.includes('429') || errorMessage.includes('too many requests')) {
    return {
      type: 'RATE_LIMIT',
      message: 'Rate limit exceeded.',
      suggestion: 'Wait a few minutes before retrying the deployment.'
    };
  }

  if (errorMessage.includes('500') || errorMessage.includes('internal server error')) {
    return {
      type: 'SERVER_ERROR',
      message: 'Azure internal server error.',
      suggestion: 'This is likely a temporary Azure issue. Try again in a few minutes.'
    };
  }

  return {
    type: 'UNKNOWN',
    message: 'Unknown Azure error occurred.',
    suggestion: 'Check Azure CLI logs and Azure portal for more details.'
  };
}

function logStep(step, message) {
  console.log(`📋 Step ${step}: ${message}`);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message) {
  console.error(`❌ ${message}`);
}

function executeCommand(command, description) {
  try {
    console.log(`🔧 ${description}...`);
    const result = execSync(command, {
      cwd: CONFIG.sourceDir,
      stdio: 'inherit',
      encoding: 'utf8'
    });
    logSuccess(`${description} completed`);
    return result;
  } catch (error) {
    logError(`${description} failed: ${error.message}`);
    throw error;
  }
}

async function main() {
  let lockAcquired = false;

  try {
    // Acquire deployment lock first
    logStep(0, 'Acquiring deployment lock');
    acquireLock();
    lockAcquired = true;

    logStep(1, 'Validating environment and dependencies');

    // Check if required files exist
    const requiredFiles = [
      'package.json',
      '.deployment',
      'startup.sh',
      'src/api/server.ts'
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(CONFIG.sourceDir, file))) {
        throw new Error(`Required file not found: ${file}`);
      }
    }
    logSuccess('All required files found');

    // Check Node.js and npm versions
    const nodeVersion = process.version;
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`Node.js version: ${nodeVersion}`);
    console.log(`NPM version: ${npmVersion}`);

    // Validate Azure resources
    logStep(1.5, 'Validating Azure resources');
    await validateAzureResources();

    // Check deployment status
    logStep(1.8, 'Checking deployment status');
    await checkDeploymentStatus();

    logStep(2, 'Installing dependencies');
    executeCommand('npm ci', 'Installing production dependencies');

    logStep(3, 'Building application');
    executeCommand('npm run build', 'Building application (frontend + server)');

    // Verify build artifacts
    const buildArtifacts = [
      'dist/server.js',
      'dist/index.html',
      'package.json',
      'package-lock.json'
    ];

    console.log('🔍 Verifying build artifacts...');
    for (const artifact of buildArtifacts) {
      const artifactPath = path.join(CONFIG.sourceDir, artifact);
      if (!fs.existsSync(artifactPath)) {
        throw new Error(`Build artifact not found: ${artifact}`);
      }
      console.log(`  ✅ ${artifact}`);
    }
    logSuccess('All build artifacts verified');

    logStep(4, 'Preparing deployment package');

    // Generate unique package name with timestamp
    CONFIG.packageName = generatePackageName();
    console.log(`📦 Using package name: ${CONFIG.packageName}`);

    // Clean up any existing packages (cleanup old ones)
    const cleanupOldPackages = () => {
      try {
        const files = fs.readdirSync(CONFIG.sourceDir);
        const oldPackages = files.filter(file => file.startsWith('app-') && file.endsWith('.zip') && file !== CONFIG.packageName);
        oldPackages.forEach(file => {
          const filePath = path.join(CONFIG.sourceDir, file);
          fs.unlinkSync(filePath);
          console.log(`🧹 Cleaned up old package: ${file}`);
        });
      } catch (error) {
        console.log(`⚠️  Could not cleanup old packages: ${error.message}`);
      }
    };
    cleanupOldPackages();

    const packagePath = path.join(CONFIG.sourceDir, CONFIG.packageName);

    // Ensure startup.sh has execute permissions
    const startupScriptPath = path.join(CONFIG.sourceDir, 'startup.sh');
    if (fs.existsSync(startupScriptPath)) {
      try {
        // Set execute permissions on startup.sh (cross-platform)
        if (process.platform === 'win32') {
          // On Windows, we can't set actual permissions, but we can ensure the file is readable
          console.log('✅ Startup script found (Windows - permissions will be set on Linux)');
        } else {
          fs.chmodSync(startupScriptPath, '755');
          console.log('✅ Execute permissions set on startup.sh');
        }
      } catch (error) {
        console.log('⚠️  Could not set permissions on startup.sh:', error.message);
      }
    }

    // Create deployment package using zip (cross-platform)
    const filesToInclude = [
      'dist/**/*',
      'src/**/*',
      'public/**/*',
      'scripts/**/*',
      'package.json',
      'package-lock.json',
      '.deployment',
      'startup.sh',
      '.env.production',
      'tsconfig*.json',
      'vite.config.ts',
      'tailwind.config.js',
      'postcss.config.js'
    ];

    // Use PowerShell on Windows, zip on Unix-like systems
    const isWindows = process.platform === 'win32';
    let zipCommand;

    if (isWindows) {
      // Use PowerShell to create a simple zip file
      const psScript = `
        $sourceDir = "${CONFIG.sourceDir.replace(/\\/g, '\\')}"
        $zipPath = "${packagePath.replace(/\\/g, '\\')}"

        # Create zip file
        Add-Type -AssemblyName System.IO.Compression.FileSystem

        # Files to include
        $includeFiles = @(
          "package.json",
          "package-lock.json",
          ".deployment",
          "startup.sh",
          ".env.production",
          "vite.config.ts",
          "tailwind.config.js",
          "postcss.config.js"
        )

        $includeDirs = @(
          "dist",
          "src",
          "public",
          "scripts"
        )

        try {
          $zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')

          # Add individual files
          foreach ($file in $includeFiles) {
            $filePath = Join-Path $sourceDir $file
            if (Test-Path $filePath) {
              $relativePath = $file
              [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $filePath, $relativePath)
            }
          }

          # Add directories recursively
          foreach ($dir in $includeDirs) {
            $dirPath = Join-Path $sourceDir $dir
            if (Test-Path $dirPath) {
              $files = Get-ChildItem -Path $dirPath -Recurse -File
              foreach ($file in $files) {
                $relativePath = $file.FullName.Substring($sourceDir.Length + 1)
                [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $relativePath)
              }
            }
          }

          $zip.Dispose()
          Write-Host "Package created successfully"
        } catch {
          Write-Error "Failed to create package: $_"
          exit 1
        }
      `;
      fs.writeFileSync('temp_zip.ps1', psScript);
      zipCommand = 'powershell -ExecutionPolicy Bypass -File temp_zip.ps1';
    } else {
      // Use zip command on Unix-like systems
      const fileList = filesToInclude.map(pattern => `"${pattern}"`).join(' ');
      zipCommand = `cd "${CONFIG.sourceDir}" && zip -r "${CONFIG.packageName}" ${fileList} -x "*.git*" "*.DS_Store" "node_modules/*" "*.log"`;
    }

    executeCommand(zipCommand, 'Creating deployment package');

    // Clean up temp file on Windows
    if (isWindows && fs.existsSync('temp_zip.ps1')) {
      fs.unlinkSync('temp_zip.ps1');
    }

    // Verify package was created
    if (!fs.existsSync(packagePath)) {
      throw new Error('Deployment package was not created');
    }

    const stats = fs.statSync(packagePath);
    console.log(`📦 Package created: ${CONFIG.packageName} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

    // Test package extraction and verify startup.sh permissions
    console.log('🔍 Testing package extraction...');
    const testExtractPath = path.join(CONFIG.sourceDir, 'test-deployment-extract');
    if (fs.existsSync(testExtractPath)) {
      fs.rmSync(testExtractPath, { recursive: true, force: true });
    }
    fs.mkdirSync(testExtractPath, { recursive: true });

    if (isWindows) {
      // Use PowerShell to extract and test
      const extractCommand = `powershell -Command "Expand-Archive -Path '${packagePath}' -DestinationPath '${testExtractPath}' -Force"`;
      executeCommand(extractCommand, 'Testing package extraction');
    } else {
      // Use unzip on Unix-like systems
      const extractCommand = `unzip -q "${packagePath}" -d "${testExtractPath}"`;
      executeCommand(extractCommand, 'Testing package extraction');
    }

    // Verify startup.sh exists and has proper content
    const extractedStartupScript = path.join(testExtractPath, 'startup.sh');
    if (fs.existsSync(extractedStartupScript)) {
      console.log('✅ startup.sh found in extracted package');
    } else {
      throw new Error('startup.sh not found in extracted package');
    }

    // Clean up test extraction
    fs.rmSync(testExtractPath, { recursive: true, force: true });
    console.log('🧹 Cleaned up test extraction');

    logStep(5, 'Deploying to Azure App Service');

    // Deploy using Azure CLI with retry logic
    const deployOperation = async () => {
      const deployCommand = `az webapp deployment source config-zip --resource-group ${CONFIG.resourceGroup} --name ${CONFIG.appName} --src ${CONFIG.packageName} --verbose`;
      return executeCommand(deployCommand, 'Deploying to Azure App Service');
    };

    await retryWithBackoff(deployOperation, 'Azure App Service deployment');

    logStep(6, 'Verifying deployment');

    // Check deployment status with enhanced error handling
    const verifyOperation = async () => {
      const statusCommand = `az webapp show --resource-group ${CONFIG.resourceGroup} --name ${CONFIG.appName} --query "{name:name, state:state, defaultHostName:defaultHostName}"`;
      return executeCommand(statusCommand, 'Checking deployment status');
    };

    const statusResult = await retryWithBackoff(verifyOperation, 'Deployment verification');

    logSuccess('Deployment completed successfully!');
    console.log('\n🎉 Deployment Summary:');
    console.log('====================');
    console.log(`📦 Package: ${CONFIG.packageName}`);
    console.log(`🌐 App Service: ${CONFIG.appName}`);
    console.log(`📁 Resource Group: ${CONFIG.resourceGroup}`);
    console.log(`✅ Build artifacts included: dist/server.js, dist/index.html`);
    console.log(`✅ Startup script: startup.sh (with build step)`);
    console.log('\n🚀 The application should now be running with the latest build!');

  } catch (error) {
    // Enhanced error handling with Azure-specific error codes
    const azureError = handleAzureError(error);

    logError(`Deployment failed: ${error.message}`);
    console.error(`\n🚨 Error Type: ${azureError.type}`);
    console.error(`📝 Details: ${azureError.message}`);
    console.error(`💡 Suggestion: ${azureError.suggestion}`);

    console.error('\n🔧 Troubleshooting Steps:');
    console.log('1. Ensure Azure CLI is installed and logged in');
    console.log('2. Check Azure resource group and app service exist');
    console.log('3. Verify environment variables are set');
    console.log('4. Check build logs for compilation errors');
    console.log('5. Review Azure portal deployment logs');
    console.log('6. Ensure no other deployments are running concurrently');

    if (azureError.type === 'CONFLICT') {
      console.log('\n⏳ For 409 conflicts, the deployment will automatically retry with backoff');
      console.log('   You can also wait and try again manually');
    }

    process.exit(1);
  } finally {
    // Always release the lock
    if (lockAcquired) {
      releaseLock();
    }
  }
}

// Run the deployment
main().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});