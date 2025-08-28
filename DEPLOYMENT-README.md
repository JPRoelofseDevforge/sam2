# SAM Dashboard API - Deployment Guide

## Overview

This guide provides instructions for deploying the SAM Dashboard API application to Azure App Service with proper build artifact management.

## Build Process

The application uses a multi-step build process:

1. **Prepare Deployment**: Copies production environment variables
2. **Frontend Build**: Builds React application using Vite
3. **Server Build**: Compiles TypeScript and organizes server files
4. **Packaging**: Creates deployment package with all necessary files

## Deployment Methods

### Method 1: Automated Deployment Script (Recommended)

The easiest way to deploy is using the automated deployment script:

```bash
# Install dependencies (if not already done)
npm ci

# Run the deployment script
npm run deploy
```

This script will:
- ✅ Validate environment and dependencies
- ✅ Install production dependencies
- ✅ Build the application (frontend + server)
- ✅ Verify build artifacts exist
- ✅ Create deployment package (app.zip)
- ✅ Deploy to Azure App Service
- ✅ Verify deployment status

### Method 2: Manual Deployment Steps

If you prefer manual control over the deployment process:

```bash
# 1. Install dependencies
npm ci

# 2. Build the application
npm run build

# 3. Verify build artifacts
ls -la dist/
# Should show: server.js, index.html, assets/, etc.

# 4. Create deployment package manually
# (The automated script handles this, but you can create manually if needed)

# 5. Deploy to Azure
az webapp deployment source config-zip \
  --resource-group samdashboardapi_group \
  --name samdashboardapi \
  --src app.zip
```

## Build Scripts

### Available NPM Scripts

- `npm run build` - Full build (prepare + frontend + server)
- `npm run build:frontend` - Build only frontend
- `npm run build:server` - Build only server
- `npm run prepare-deployment` - Setup deployment environment
- `npm run deploy` - Full deployment process

### Build Artifacts

After running `npm run build`, the following files are created in `dist/`:

- `server.js` - Compiled Express server
- `index.html` - Built React application
- `assets/` - Static assets (CSS, JS, images)
- `db/` - Database models and connection
- `routes/` - API route handlers
- `services/` - Business logic services
- `middleware/` - Express middleware
- `types/` - TypeScript type definitions

## Azure App Service Configuration

### Startup Script

The application uses `startup.sh` as the startup command, which:

1. Sets production environment
2. Installs dependencies
3. **Builds the application** (NEW - ensures dist/server.js exists)
4. Verifies database connectivity
5. Starts the server

### Environment Variables

Required environment variables for Azure App Service:

```
DB_HOST=<your-database-host>
DB_PORT=<your-database-port>
DB_NAME=<your-database-name>
DB_USER=<your-database-user>
DB_PASSWORD=<your-database-password>
JWT_SECRET=<your-jwt-secret>
NODE_ENV=production
PORT=8080
```

### Application Settings

In Azure Portal > App Service > Configuration > Application Settings:

- Set all environment variables listed above
- Ensure `Startup Command` is set to `startup.sh`
- Verify `Node.js version` matches your local version (22.x)

## Troubleshooting

### Build Issues

**Problem**: `dist/server.js` not found during deployment

**Solution**: The startup script now includes a build step that will create this file automatically.

**Problem**: Build fails with TypeScript errors

**Solution**:
```bash
# Check TypeScript compilation
npx tsc --noEmit

# Fix any TypeScript errors
# Then rebuild
npm run build
```

### Deployment Issues

**Problem**: Azure deployment fails

**Solution**:
```bash
# Check Azure CLI login
az login

# Verify resource group and app service exist
az webapp show --resource-group samdashboardapi_group --name samdashboardapi

# Check deployment logs
az webapp log tail --resource-group samdashboardapi_group --name samdashboardapi
```

**Problem**: Database connection fails

**Solution**:
- Verify all DB_* environment variables are set
- Check database firewall rules allow Azure App Service
- Test database connectivity locally first

### Runtime Issues

**Problem**: Application won't start

**Solution**:
```bash
# Check application logs
az webapp log tail --resource-group samdashboardapi_group --name samdashboardapi

# Restart the app service
az webapp restart --resource-group samdashboardapi_group --name samdashboardapi
```

## File Structure

```
/
├── src/                    # Source code
│   ├── api/server.ts      # Main server file
│   ├── components/        # React components
│   └── db/               # Database models
├── dist/                  # Build output (generated)
│   ├── server.js         # Compiled server
│   ├── index.html        # Built frontend
│   └── assets/           # Static files
├── scripts/               # Build and deployment scripts
│   ├── deploy.cjs        # Automated deployment
│   ├── build-server.cjs  # Server build script
│   └── prepare-deployment.cjs
├── startup.sh            # Azure startup script
├── package.json          # Dependencies and scripts
└── .deployment          # Azure deployment config
```

## Key Improvements

### ✅ Build Step in Startup Script

The `startup.sh` script now includes:
```bash
# Build the application
echo "=== Building Application ==="
npm run build
```

This ensures `dist/server.js` is always created before the application starts.

### ✅ Comprehensive Deployment Script

The new `scripts/deploy.cjs` provides:
- Automated validation
- Build verification
- Cross-platform packaging
- Azure deployment integration

### ✅ Proper Artifact Management

All build artifacts are now properly included:
- Frontend assets
- Server code
- Database models
- API routes
- Static files

## Monitoring

### Health Checks

The application includes health check endpoints:

- `GET /api/health` - Basic health status
- `GET /api/health/db` - Database connectivity check

### Logging

Monitor application logs:
```bash
az webapp log tail --resource-group samdashboardapi_group --name samdashboardapi
```

## Security Considerations

- ✅ Environment variables properly configured
- ✅ Production dependencies only
- ✅ CORS properly configured
- ✅ Helmet security middleware enabled
- ✅ Rate limiting implemented
- ✅ JWT authentication required for admin endpoints

---

## Quick Start

1. **Prerequisites**:
   - Node.js 22.x
   - Azure CLI installed and logged in
   - Azure App Service configured

2. **Deploy**:
   ```bash
   npm run deploy
   ```

3. **Verify**:
   - Check Azure portal for successful deployment
   - Test health endpoints
   - Verify application functionality

For issues or questions, check the troubleshooting section or review the build/deployment logs.