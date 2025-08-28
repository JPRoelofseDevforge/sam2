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
  packageName: 'app.zip'
};

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
  try {
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

    // Clean up any existing package
    const packagePath = path.join(CONFIG.sourceDir, CONFIG.packageName);
    if (fs.existsSync(packagePath)) {
      fs.unlinkSync(packagePath);
      console.log('🧹 Cleaned up existing package file');
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

    logStep(5, 'Deploying to Azure App Service');

    // Deploy using Azure CLI
    const deployCommand = `az webapp deployment source config-zip --resource-group ${CONFIG.resourceGroup} --name ${CONFIG.appName} --src ${CONFIG.packageName}`;
    executeCommand(deployCommand, 'Deploying to Azure App Service');

    logStep(6, 'Verifying deployment');

    // Check deployment status
    const statusCommand = `az webapp show --resource-group ${CONFIG.resourceGroup} --name ${CONFIG.appName} --query "{name:name, state:state, defaultHostName:defaultHostName}"`;
    const statusResult = executeCommand(statusCommand, 'Checking deployment status');

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
    logError(`Deployment failed: ${error.message}`);
    console.error('\n🔧 Troubleshooting:');
    console.log('1. Ensure Azure CLI is installed and logged in');
    console.log('2. Check Azure resource group and app service exist');
    console.log('3. Verify environment variables are set');
    console.log('4. Check build logs for compilation errors');
    process.exit(1);
  }
}

// Run the deployment
main().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});