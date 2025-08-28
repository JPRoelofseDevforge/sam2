#!/usr/bin/env node

/**
 * Weather API Migration Analysis Report
 *
 * This script analyzes the current state of the AirVisual API migration
 * and provides a comprehensive report on the migration status.
 *
 * Usage: node migration-analysis-report.js
 */

import fs from 'fs';
import path from 'path';

// Configuration
const PROJECT_ROOT = process.cwd();
const SRC_DIR = path.join(PROJECT_ROOT, 'src');

// Analysis results
const analysisResults = {
  summary: {
    migrationStatus: 'unknown',
    completionPercentage: 0,
    criticalIssues: [],
    warnings: [],
    recommendations: []
  },
  sections: {}
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: 'ℹ️ ',
    success: '✅',
    error: '❌',
    warning: '⚠️ ',
    section: '📋',
  }[type] || '📝';

  console.log(`[${timestamp}] ${prefix} ${message}`);
}

function recordAnalysis(section, item, status, details = null) {
  if (!analysisResults.sections[section]) {
    analysisResults.sections[section] = [];
  }

  analysisResults.sections[section].push({
    item,
    status, // 'good', 'warning', 'error', 'unknown'
    details,
    timestamp: new Date().toISOString(),
  });
}

function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// =====================================================
// ANALYSIS FUNCTIONS
// =====================================================

function analyzeBackendAPI() {
  log('Analyzing Backend API Implementation', 'section');

  const weatherRoutesPath = path.join(SRC_DIR, 'api/routes/weather.ts');
  const weatherServicePath = path.join(SRC_DIR, 'services/weatherService.ts');
  const weatherCachePath = path.join(SRC_DIR, 'services/weatherCache.ts');
  const serverPath = path.join(SRC_DIR, 'api/server.ts');

  // Check if backend files exist
  const routesExist = fileExists(weatherRoutesPath);
  const serviceExists = fileExists(weatherServicePath);
  const cacheExists = fileExists(weatherCachePath);
  const serverExists = fileExists(serverPath);

  recordAnalysis('Backend API', 'Weather Routes File', routesExist ? 'good' : 'error',
    routesExist ? 'Weather routes file exists' : 'Weather routes file missing');

  recordAnalysis('Backend API', 'Weather Service File', serviceExists ? 'good' : 'error',
    serviceExists ? 'Weather service file exists' : 'Weather service file missing');

  recordAnalysis('Backend API', 'Weather Cache File', cacheExists ? 'good' : 'error',
    cacheExists ? 'Weather cache file exists' : 'Weather cache file missing');

  recordAnalysis('Backend API', 'Server Configuration', serverExists ? 'good' : 'error',
    serverExists ? 'Server configuration exists' : 'Server configuration missing');

  if (routesExist) {
    const routesContent = readFileContent(weatherRoutesPath);

    // Check for API endpoints
    const hasCurrentEndpoint = routesContent.includes('/current');
    const hasCoordinatesEndpoint = routesContent.includes('/coordinates');
    const hasIPEndpoint = routesContent.includes('/ip');
    const hasCacheEndpoints = routesContent.includes('/cache');
    const hasHealthEndpoint = routesContent.includes('/health');

    recordAnalysis('Backend API', 'Current Weather Endpoint', hasCurrentEndpoint ? 'good' : 'error',
      hasCurrentEndpoint ? 'Current weather endpoint implemented' : 'Current weather endpoint missing');

    recordAnalysis('Backend API', 'Coordinates Weather Endpoint', hasCoordinatesEndpoint ? 'good' : 'error',
      hasCoordinatesEndpoint ? 'Coordinates weather endpoint implemented' : 'Coordinates weather endpoint missing');

    recordAnalysis('Backend API', 'IP Weather Endpoint', hasIPEndpoint ? 'good' : 'error',
      hasIPEndpoint ? 'IP weather endpoint implemented' : 'IP weather endpoint missing');

    recordAnalysis('Backend API', 'Cache Management Endpoints', hasCacheEndpoints ? 'good' : 'warning',
      hasCacheEndpoints ? 'Cache management endpoints implemented' : 'Cache management endpoints missing');

    recordAnalysis('Backend API', 'Health Check Endpoint', hasHealthEndpoint ? 'good' : 'warning',
      hasHealthEndpoint ? 'Health check endpoint implemented' : 'Health check endpoint missing');
  }

  if (serviceExists) {
    const serviceContent = readFileContent(weatherServicePath);

    // Check for AirVisual API integration
    const hasAirVisualImport = serviceContent.includes('airvisual') || serviceContent.includes('AirVisual');
    const hasAxiosCalls = serviceContent.includes('axios') || serviceContent.includes('fetch');
    const hasErrorHandling = serviceContent.includes('try') && serviceContent.includes('catch');
    const hasRetryLogic = serviceContent.includes('retry') || serviceContent.includes('attempt');

    recordAnalysis('Backend API', 'AirVisual API Integration', hasAirVisualImport ? 'good' : 'warning',
      hasAirVisualImport ? 'AirVisual API integration detected' : 'AirVisual API integration not clearly identified');

    recordAnalysis('Backend API', 'HTTP Client Usage', hasAxiosCalls ? 'good' : 'error',
      hasAxiosCalls ? 'HTTP client properly configured' : 'HTTP client not configured');

    recordAnalysis('Backend API', 'Error Handling', hasErrorHandling ? 'good' : 'error',
      hasErrorHandling ? 'Error handling implemented' : 'Error handling missing');

    recordAnalysis('Backend API', 'Retry Logic', hasRetryLogic ? 'good' : 'warning',
      hasRetryLogic ? 'Retry logic implemented' : 'Retry logic not detected');
  }

  if (cacheExists) {
    const cacheContent = readFileContent(weatherCachePath);

    // Check for caching functionality
    const hasMemoryCache = cacheContent.includes('Map') || cacheContent.includes('memory');
    const hasRedisSupport = cacheContent.includes('redis') || cacheContent.includes('Redis');
    const hasExpiration = cacheContent.includes('expiresAt') || cacheContent.includes('ttl');
    const hasCleanup = cacheContent.includes('cleanup') || cacheContent.includes('clear');

    recordAnalysis('Backend API', 'Memory Caching', hasMemoryCache ? 'good' : 'warning',
      hasMemoryCache ? 'Memory caching implemented' : 'Memory caching not detected');

    recordAnalysis('Backend API', 'Redis Support', hasRedisSupport ? 'good' : 'warning',
      hasRedisSupport ? 'Redis support available' : 'Redis support not implemented');

    recordAnalysis('Backend API', 'Cache Expiration', hasExpiration ? 'good' : 'warning',
      hasExpiration ? 'Cache expiration implemented' : 'Cache expiration not detected');

    recordAnalysis('Backend API', 'Cache Cleanup', hasCleanup ? 'good' : 'warning',
      hasCleanup ? 'Cache cleanup implemented' : 'Cache cleanup not detected');
  }

  log('Backend API Analysis completed', 'section');
}

function analyzeFrontendIntegration() {
  log('Analyzing Frontend Integration', 'section');

  const weatherApiServicePath = path.join(SRC_DIR, 'services/weatherApi.ts');
  const weatherImpactPath = path.join(SRC_DIR, 'components/WeatherImpact.tsx');
  const teamOverviewPath = path.join(SRC_DIR, 'components/TeamOverview.tsx');

  // Check if frontend files exist
  const apiServiceExists = fileExists(weatherApiServicePath);
  const weatherImpactExists = fileExists(weatherImpactPath);
  const teamOverviewExists = fileExists(teamOverviewPath);

  recordAnalysis('Frontend Integration', 'Weather API Service', apiServiceExists ? 'good' : 'error',
    apiServiceExists ? 'Weather API service exists' : 'Weather API service missing');

  recordAnalysis('Frontend Integration', 'WeatherImpact Component', weatherImpactExists ? 'good' : 'error',
    weatherImpactExists ? 'WeatherImpact component exists' : 'WeatherImpact component missing');

  recordAnalysis('Frontend Integration', 'TeamOverview Component', teamOverviewExists ? 'good' : 'warning',
    teamOverviewExists ? 'TeamOverview component exists' : 'TeamOverview component missing');

  if (apiServiceExists) {
    const apiServiceContent = readFileContent(weatherApiServicePath);

    // Check for backend API calls
    const hasBackendCalls = apiServiceContent.includes('/api/weather') || apiServiceContent.includes('localhost:3001');
    const hasErrorHandling = apiServiceContent.includes('try') && apiServiceContent.includes('catch');
    const hasLoadingStates = apiServiceContent.includes('loading') || apiServiceContent.includes('Loading');

    recordAnalysis('Frontend Integration', 'Backend API Calls', hasBackendCalls ? 'good' : 'error',
      hasBackendCalls ? 'Backend API calls implemented' : 'Backend API calls not detected');

    recordAnalysis('Frontend Integration', 'Error Handling', hasErrorHandling ? 'good' : 'warning',
      hasErrorHandling ? 'Error handling implemented' : 'Error handling not detected');

    recordAnalysis('Frontend Integration', 'Loading States', hasLoadingStates ? 'good' : 'warning',
      hasLoadingStates ? 'Loading states implemented' : 'Loading states not detected');
  }

  if (weatherImpactExists) {
    const weatherImpactContent = readFileContent(weatherImpactPath);

    // Check for weather data usage
    const hasWeatherData = weatherImpactContent.includes('weatherData') || weatherImpactContent.includes('WeatherData');
    const hasGeneticIntegration = weatherImpactContent.includes('genetic') || weatherImpactContent.includes('Genetic');
    const hasPerformanceCalc = weatherImpactContent.includes('performance') || weatherImpactContent.includes('Performance');

    recordAnalysis('Frontend Integration', 'Weather Data Usage', hasWeatherData ? 'good' : 'error',
      hasWeatherData ? 'Weather data properly used' : 'Weather data usage not detected');

    recordAnalysis('Frontend Integration', 'Genetic Data Integration', hasGeneticIntegration ? 'good' : 'warning',
      hasGeneticIntegration ? 'Genetic data integration implemented' : 'Genetic data integration not detected');

    recordAnalysis('Frontend Integration', 'Performance Calculations', hasPerformanceCalc ? 'good' : 'warning',
      hasPerformanceCalc ? 'Performance calculations implemented' : 'Performance calculations not detected');
  }

  log('Frontend Integration Analysis completed', 'section');
}

function analyzeDataTransformation() {
  log('Analyzing Data Transformation', 'section');

  const typesPath = path.join(SRC_DIR, 'types/index.ts');
  const weatherServicePath = path.join(SRC_DIR, 'services/weatherService.ts');

  // Check types definition
  const typesExist = fileExists(typesPath);
  recordAnalysis('Data Transformation', 'Type Definitions', typesExist ? 'good' : 'warning',
    typesExist ? 'Type definitions exist' : 'Type definitions missing');

  if (typesExist) {
    const typesContent = readFileContent(typesPath);

    // Check for weather-related types
    const hasWeatherDataType = typesContent.includes('WeatherData');
    const hasWeatherServiceResponse = typesContent.includes('WeatherServiceResponse');
    const hasWeatherApiConfig = typesContent.includes('WeatherApiConfig');

    recordAnalysis('Data Transformation', 'WeatherData Type', hasWeatherDataType ? 'good' : 'warning',
      hasWeatherDataType ? 'WeatherData type defined' : 'WeatherData type missing');

    recordAnalysis('Data Transformation', 'WeatherServiceResponse Type', hasWeatherServiceResponse ? 'good' : 'warning',
      hasWeatherServiceResponse ? 'WeatherServiceResponse type defined' : 'WeatherServiceResponse type missing');

    recordAnalysis('Data Transformation', 'WeatherApiConfig Type', hasWeatherApiConfig ? 'good' : 'warning',
      hasWeatherApiConfig ? 'WeatherApiConfig type defined' : 'WeatherApiConfig type missing');
  }

  if (fileExists(weatherServicePath)) {
    const serviceContent = readFileContent(weatherServicePath);

    // Check for data transformation functions
    const hasTransformFunction = serviceContent.includes('transform') || serviceContent.includes('Transform');
    const hasAirVisualMapping = serviceContent.includes('airvisual') || serviceContent.includes('AirVisual');
    const hasWeatherDescription = serviceContent.includes('description') || serviceContent.includes('Description');
    const hasAirQualityCategory = serviceContent.includes('category') || serviceContent.includes('Category');

    recordAnalysis('Data Transformation', 'Data Transformation Function', hasTransformFunction ? 'good' : 'error',
      hasTransformFunction ? 'Data transformation function implemented' : 'Data transformation function missing');

    recordAnalysis('Data Transformation', 'AirVisual Data Mapping', hasAirVisualMapping ? 'good' : 'warning',
      hasAirVisualMapping ? 'AirVisual data mapping implemented' : 'AirVisual data mapping not detected');

    recordAnalysis('Data Transformation', 'Weather Description Mapping', hasWeatherDescription ? 'good' : 'warning',
      hasWeatherDescription ? 'Weather description mapping implemented' : 'Weather description mapping not detected');

    recordAnalysis('Data Transformation', 'Air Quality Category Mapping', hasAirQualityCategory ? 'good' : 'warning',
      hasAirQualityCategory ? 'Air quality category mapping implemented' : 'Air quality category mapping not detected');
  }

  log('Data Transformation Analysis completed', 'section');
}

function analyzeSecurity() {
  log('Analyzing Security Implementation', 'section');

  const rateLimiterPath = path.join(SRC_DIR, 'middleware/rateLimiter.ts');
  const serverPath = path.join(SRC_DIR, 'api/server.ts');

  // Check rate limiting
  const rateLimiterExists = fileExists(rateLimiterPath);
  recordAnalysis('Security', 'Rate Limiting Middleware', rateLimiterExists ? 'good' : 'warning',
    rateLimiterExists ? 'Rate limiting middleware exists' : 'Rate limiting middleware missing');

  if (rateLimiterExists) {
    const rateLimiterContent = readFileContent(rateLimiterPath);

    // Check rate limiting configuration
    const hasWindowMs = rateLimiterContent.includes('windowMs');
    const hasMaxRequests = rateLimiterContent.includes('max') || rateLimiterContent.includes('limit');
    const hasWeatherRateLimit = rateLimiterContent.includes('weather') || rateLimiterContent.includes('Weather');

    recordAnalysis('Security', 'Rate Limit Window', hasWindowMs ? 'good' : 'warning',
      hasWindowMs ? 'Rate limit window configured' : 'Rate limit window not configured');

    recordAnalysis('Security', 'Max Requests Limit', hasMaxRequests ? 'good' : 'warning',
      hasMaxRequests ? 'Max requests limit configured' : 'Max requests limit not configured');

    recordAnalysis('Security', 'Weather-specific Rate Limiting', hasWeatherRateLimit ? 'good' : 'warning',
      hasWeatherRateLimit ? 'Weather-specific rate limiting implemented' : 'Weather-specific rate limiting not detected');
  }

  if (fileExists(serverPath)) {
    const serverContent = readFileContent(serverPath);

    // Check security middleware
    const hasHelmet = serverContent.includes('helmet') || serverContent.includes('Helmet');
    const hasCors = serverContent.includes('cors') || serverContent.includes('CORS');
    const hasInputValidation = serverContent.includes('validate') || serverContent.includes('Validate');

    recordAnalysis('Security', 'Security Headers (Helmet)', hasHelmet ? 'good' : 'warning',
      hasHelmet ? 'Security headers middleware implemented' : 'Security headers middleware missing');

    recordAnalysis('Security', 'CORS Configuration', hasCors ? 'good' : 'warning',
      hasCors ? 'CORS properly configured' : 'CORS configuration not detected');

    recordAnalysis('Security', 'Input Validation', hasInputValidation ? 'good' : 'warning',
      hasInputValidation ? 'Input validation implemented' : 'Input validation not detected');
  }

  log('Security Analysis completed', 'section');
}

function analyzeConfiguration() {
  log('Analyzing Configuration', 'section');

  const envPath = path.join(PROJECT_ROOT, '.env');
  const envExists = fileExists(envPath);

  recordAnalysis('Configuration', 'Environment File', envExists ? 'good' : 'warning',
    envExists ? 'Environment file exists' : 'Environment file missing');

  if (envExists) {
    const envContent = readFileContent(envPath);

    // Check for weather-related configuration
    const hasAirVisualKey = envContent.includes('AIRVISUAL_API_KEY') || envContent.includes('AIRVISUAL_API_KEYS');
    const hasApiUrl = envContent.includes('VITE_API_URL') || envContent.includes('API_URL');
    const hasCityConfig = envContent.includes('VITE_CITY') || envContent.includes('CITY');

    recordAnalysis('Configuration', 'AirVisual API Key', hasAirVisualKey ? 'good' : 'error',
      hasAirVisualKey ? 'AirVisual API key configured' : 'AirVisual API key not configured');

    recordAnalysis('Configuration', 'API Base URL', hasApiUrl ? 'good' : 'warning',
      hasApiUrl ? 'API base URL configured' : 'API base URL not configured');

    recordAnalysis('Configuration', 'Location Configuration', hasCityConfig ? 'good' : 'warning',
      hasCityConfig ? 'Location configuration available' : 'Location configuration missing');
  }

  log('Configuration Analysis completed', 'section');
}

function generateMigrationReport() {
  log('Generating Migration Analysis Report', 'section');

  // Calculate completion percentage
  let totalChecks = 0;
  let passedChecks = 0;

  Object.values(analysisResults.sections).forEach(section => {
    section.forEach(check => {
      totalChecks++;
      if (check.status === 'good') passedChecks++;
    });
  });

  const completionPercentage = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

  // Determine migration status
  let migrationStatus = 'unknown';
  if (completionPercentage >= 90) {
    migrationStatus = 'completed';
  } else if (completionPercentage >= 70) {
    migrationStatus = 'mostly_complete';
  } else if (completionPercentage >= 50) {
    migrationStatus = 'in_progress';
  } else {
    migrationStatus = 'incomplete';
  }

  analysisResults.summary.migrationStatus = migrationStatus;
  analysisResults.summary.completionPercentage = completionPercentage;

  // Generate recommendations based on findings
  const recommendations = [];

  // Check for critical issues
  const criticalIssues = [];
  Object.values(analysisResults.sections).forEach(section => {
    section.forEach(check => {
      if (check.status === 'error') {
        criticalIssues.push(`${check.item}: ${check.details}`);
      }
    });
  });

  if (criticalIssues.length > 0) {
    recommendations.push('Address critical issues before proceeding with production deployment');
  }

  if (migrationStatus === 'completed') {
    recommendations.push('Migration appears complete - proceed with testing in staging environment');
    recommendations.push('Monitor API usage and performance after deployment');
    recommendations.push('Set up proper monitoring and alerting for weather service');
  } else if (migrationStatus === 'mostly_complete') {
    recommendations.push('Address remaining warnings and minor issues');
    recommendations.push('Conduct thorough testing before production deployment');
  } else {
    recommendations.push('Continue implementing missing components');
    recommendations.push('Review architecture and ensure all requirements are met');
  }

  analysisResults.summary.criticalIssues = criticalIssues;
  analysisResults.summary.recommendations = recommendations;

  // Print comprehensive report
  console.log('\n' + '='.repeat(80));
  console.log('🎯 WEATHER API MIGRATION ANALYSIS REPORT');
  console.log('='.repeat(80));

  console.log('\n📊 MIGRATION STATUS:');
  console.log(`   Status: ${migrationStatus.toUpperCase().replace('_', ' ')}`);
  console.log(`   Completion: ${completionPercentage}% (${passedChecks}/${totalChecks} checks passed)`);

  console.log('\n📋 SECTION ANALYSIS:');
  Object.entries(analysisResults.sections).forEach(([sectionName, checks]) => {
    const sectionPassed = checks.filter(c => c.status === 'good').length;
    const sectionTotal = checks.length;
    const sectionPercentage = Math.round((sectionPassed / sectionTotal) * 100);

    const statusIcon = sectionPercentage === 100 ? '✅' : sectionPercentage >= 75 ? '⚠️ ' : '❌';
    console.log(`   ${statusIcon} ${sectionName}: ${sectionPassed}/${sectionTotal} (${sectionPercentage}%)`);
  });

  console.log('\n📝 DETAILED FINDINGS:');
  Object.entries(analysisResults.sections).forEach(([sectionName, checks]) => {
    console.log(`\n   ${sectionName}:`);
    checks.forEach(check => {
      const statusIcon = {
        'good': '✅',
        'warning': '⚠️ ',
        'error': '❌',
        'unknown': '❓'
      }[check.status] || '❓';

      console.log(`     ${statusIcon} ${check.item}`);
      if (check.details) {
        console.log(`        ${check.details}`);
      }
    });
  });

  if (criticalIssues.length > 0) {
    console.log('\n❌ CRITICAL ISSUES:');
    criticalIssues.forEach(issue => {
      console.log(`   • ${issue}`);
    });
  }

  console.log('\n💡 RECOMMENDATIONS:');
  recommendations.forEach(rec => {
    console.log(`   • ${rec}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('🏁 Migration Analysis Complete');
  console.log('='.repeat(80));

  return analysisResults;
}

// =====================================================
// MAIN EXECUTION
// =====================================================

async function runMigrationAnalysis() {
  log('🚀 Starting Weather API Migration Analysis', 'section');

  try {
    // Run all analysis sections
    analyzeConfiguration();
    analyzeBackendAPI();
    analyzeFrontendIntegration();
    analyzeDataTransformation();
    analyzeSecurity();

    // Generate and display report
    const results = generateMigrationReport();

    // Exit with appropriate code
    const exitCode = results.summary.migrationStatus === 'completed' ? 0 : 1;
    process.exit(exitCode);

  } catch (error) {
    log(`Analysis failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrationAnalysis().catch(error => {
    log(`Analysis failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

export { runMigrationAnalysis, analysisResults };