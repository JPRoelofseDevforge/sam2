// Test script for SSL database connection
import { testDatabaseConnection } from './src/db/connection.ts';

async function testSSLConnection() {
  console.log('Testing SSL database connection...\n');

  try {
    const result = await testDatabaseConnection();

    if (result.success) {
      console.log('✅ Connection test PASSED');
      console.log(`📝 Message: ${result.message}`);

      if (result.sslInfo) {
        console.log('\n🔒 SSL Information:');
        console.log(`   - SSL Enabled: ${result.sslInfo.enabled ? 'Yes' : 'No'}`);
        console.log(`   - SSL Mode: ${result.sslInfo.sslMode}`);
        console.log(`   - Database: ${result.sslInfo.database}`);
        console.log(`   - User: ${result.sslInfo.user}`);
        console.log(`   - PostgreSQL Version: ${result.sslInfo.version?.split(' ')[0]} ${result.sslInfo.version?.split(' ')[1]}`);
      }
    } else {
      console.log('❌ Connection test FAILED');
      console.log(`📝 Error: ${result.message}`);

      if (result.sslInfo?.error) {
        console.log(`🔍 Error Details: ${result.sslInfo.error}`);
        if (result.sslInfo?.code) {
          console.log(`🔍 Error Code: ${result.sslInfo.code}`);
        }
      }

      console.log('\n🔧 Troubleshooting Tips:');
      console.log('   1. Check if DB_HOST, DB_USER, DB_PASSWORD are correct');
      console.log('   2. Verify DB_SSL_MODE is set to "require" for Azure PostgreSQL');
      console.log('   3. Ensure DB_SSL_REJECT_UNAUTHORIZED is set to "false"');
      console.log('   4. Check if Azure PostgreSQL server allows SSL connections');
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    console.log('\n🔧 Make sure the application is built and dependencies are installed');
  }
}

// Run the test
testSSLConnection().then(() => {
  console.log('\n🏁 SSL connection test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});