# SSL Database Connection Configuration for Azure PostgreSQL

## Overview
This document outlines the SSL configuration implemented to resolve Azure PostgreSQL connectivity issues for the SAM Dashboard API.

## Changes Made

### 1. Database Connection Configuration (`src/db/connection.ts`)
- **Enhanced SSL Configuration**: Updated the PostgreSQL pool configuration to support flexible SSL settings
- **Environment Variable Support**: Added support for `DB_SSL_MODE`, `DB_SSL_REJECT_UNAUTHORIZED`, and other SSL-related environment variables
- **Improved Error Handling**: Added specific SSL error detection and logging
- **Connection Validation**: Added `testDatabaseConnection()` function for SSL connection testing

### 2. Environment Variables
Updated both `.env` and `.env.production` files with SSL configuration:

```bash
# SSL Configuration for Azure PostgreSQL
DB_SSL_MODE=require
DB_SSL_REJECT_UNAUTHORIZED=false

# Alternative: Connection string format (uncomment if preferred)
# DATABASE_URL=postgresql://rx:qwe12345_@rxg.postgres.database.azure.com:5432/sports_performance_db?sslmode=require
```

### 3. SSL Configuration Options
- **`DB_SSL_MODE`**: Set to `require` for Azure PostgreSQL (enforces SSL connection)
- **`DB_SSL_REJECT_UNAUTHORIZED`**: Set to `false` to accept Azure's self-signed certificates
- **`DATABASE_URL`**: Alternative connection string format with SSL parameters

## Testing

### Local Testing
A test script `test-ssl-connection.js` has been created to validate the SSL configuration:

```bash
node test-ssl-connection.js
```

**Expected Output:**
```
✅ Connection test PASSED
📝 Message: Database connection successful. SSL: enabled

🔒 SSL Information:
   - SSL Enabled: Yes
   - SSL Mode: require
   - Database: sports_performance_db
   - User: rx
   - PostgreSQL Version: PostgreSQL 17.5
```

## Azure Deployment

### 1. Environment Variables in Azure App Service
Set the following environment variables in your Azure App Service:

```bash
DB_SSL_MODE=require
DB_SSL_REJECT_UNAUTHORIZED=false
```

### 2. Azure PostgreSQL Configuration
Ensure your Azure PostgreSQL server has:
- **SSL enforcement enabled** (default for Azure PostgreSQL)
- **Allow public access** or proper VNet configuration
- **Firewall rules** configured for your App Service

### 3. Deployment Steps
1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to Azure**:
   ```bash
   az webapp deployment source config-zip --resource-group samdashboardapi_group --name samdashboardapi --src app.zip
   ```

3. **Verify SSL connection** in Azure logs:
   ```bash
   az webapp log tail --name samdashboardapi --resource-group samdashboardapi_group
   ```

## Troubleshooting

### Common SSL Issues

1. **Connection Refused with SSL Required**
   ```
   Error: SSL connection error: Connection refused
   ```
   **Solution**: Ensure `DB_SSL_MODE=require` and verify Azure PostgreSQL SSL settings

2. **Certificate Validation Errors**
   ```
   Error: CERT_HAS_EXPIRED or certificate verification failed
   ```
   **Solution**: Set `DB_SSL_REJECT_UNAUTHORIZED=false` for Azure's self-signed certificates

3. **Authentication Failed**
   ```
   Error: Authentication failed for user
   ```
   **Solution**: Verify `DB_USER` and `DB_PASSWORD` are correct

### Debugging Steps

1. **Check environment variables**:
   ```bash
   echo $DB_SSL_MODE
   echo $DB_SSL_REJECT_UNAUTHORIZED
   ```

2. **Test connection locally**:
   ```bash
   node test-ssl-connection.js
   ```

3. **Check Azure PostgreSQL logs** for connection attempts

4. **Verify firewall rules** allow connections from your App Service

## Security Considerations

- **SSL Mode**: Always use `require` for production Azure PostgreSQL connections
- **Certificate Validation**: Azure uses self-signed certificates, so `rejectUnauthorized: false` is required
- **Connection String**: Consider using `DATABASE_URL` for simpler configuration management
- **Environment Variables**: Never commit sensitive database credentials to version control

## Files Modified

1. `src/db/connection.ts` - Enhanced SSL configuration and error handling
2. `.env` - Added SSL environment variables for development
3. `.env.production` - Added SSL environment variables for production
4. `test-ssl-connection.js` - Created SSL connection test script
5. `SSL-CONFIGURATION-README.md` - This documentation file

## Next Steps

1. Deploy the changes to Azure App Service
2. Monitor application logs for SSL connection status
3. Consider implementing connection health checks in production
4. Set up monitoring alerts for database connection failures