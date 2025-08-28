// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

// Check if we're in a Node.js environment
const isNodeEnvironment = typeof process !== 'undefined' && process.env && typeof process.cwd === 'function';

// Create PostgreSQL connection pool only in Node.js environment
let pool: any = null;
let poolPromise: Promise<any> | null = null;

async function initializePool(): Promise<any> {
  if (pool) {
    return pool;
  }

  if (poolPromise) {
    return poolPromise;
  }

  poolPromise = (async () => {
    try {
      // Import pg dynamically
      const pg = await import('pg');
      const { Pool } = pg;

      // Validate required environment variables
      if (!process.env.DB_HOST) {
        throw new Error('DB_HOST environment variable is required');
      }
      if (!process.env.DB_NAME) {
        throw new Error('DB_NAME environment variable is required');
      }
      if (!process.env.DB_USER) {
        throw new Error('DB_USER environment variable is required');
      }
      if (!process.env.DB_PASSWORD) {
        throw new Error('DB_PASSWORD environment variable is required');
      }

      // Azure PostgreSQL SSL configuration
      const sslConfig = process.env.DB_SSL_MODE === 'disable'
        ? false
        : {
            rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
            ca: process.env.DB_SSL_CA_CERT || undefined,
            cert: process.env.DB_SSL_CLIENT_CERT || undefined,
            key: process.env.DB_SSL_CLIENT_KEY || undefined,
          };

      pool = new Pool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: sslConfig, // Enhanced SSL configuration for Azure PostgreSQL
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
        connectionTimeoutMillis: 10000, // Increased timeout for Azure connections
        // Azure PostgreSQL specific options
        keepAlive: true,
        keepAliveInitialDelayMillis: 0,
        // Additional Azure PostgreSQL connection options
        application_name: 'SAM Dashboard API',
        connectionString: process.env.DATABASE_URL, // Support for connection string format
      });

      // Test database connection
      pool.on('connect', (client: any) => {
        if (process.env.NODE_ENV !== 'production') {
          console.log('Connected to PostgreSQL database with SSL');
          // Log SSL connection details for debugging
          if (client.ssl) {
              console.log('SSL connection established:', {
                authorized: client.ssl.authorized,
                protocol: client.ssl.protocol,
                cipher: client.ssl.cipher?.name
              });
          }
        }
      });

      pool.on('error', (err: any) => {
        console.error('Unexpected error on idle client', err);
        // Log additional details for debugging
        console.error('Pool error details:', {
          code: err.code,
          message: err.message,
          stack: err.stack
        });

        // Enhanced SSL error handling
        if (err.code === 'CERT_HAS_EXPIRED' || err.message?.includes('certificate')) {
          console.error('SSL Certificate Error: Please check your SSL configuration and certificates');
        } else if (err.code === 'ECONNREFUSED' && process.env.DB_SSL_MODE === 'require') {
          console.error('SSL Connection Failed: Azure PostgreSQL requires SSL. Check DB_SSL_MODE and SSL settings');
        }

        // Do not exit the process to allow graceful handling
        // The server will continue running, database operations may fail
      });

      if (process.env.NODE_ENV !== 'production') {
        console.log('PostgreSQL connection pool initialized successfully');
      }
      return pool;
    } catch (error) {
      console.error('Failed to initialize PostgreSQL connection:', error);
      throw error;
    }
  })();

  return poolPromise;
}

if (isNodeEnvironment) {
   // Initialize pool asynchronously with better error handling
   initializePool().catch(error => {
     console.error('Failed to initialize database connection:', error);
     if (process.env.NODE_ENV !== 'production') {
       console.warn('Server will continue running but database operations will fail');
     }
     // Don't exit the process - let the server start even without database
   });
 } else {
   if (process.env.NODE_ENV !== 'production') {
     console.warn('Database connection skipped - not in Node.js environment');
   }
 }

export default pool;

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  try {
    const dbPool = await getPool();
    const start = Date.now();
    const res = await dbPool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error: any) {
    console.error('Database query error:', error);
    // Check if it's a connection error
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message?.includes('connection')) {
      throw new Error('Database connection failed. Please check your database configuration.');
    }
    throw error;
  }
}

// Helper function to get pool
async function getPool(): Promise<any> {
  if (!pool) {
    if (!isNodeEnvironment) {
      throw new Error('Database connection not available - not in Node.js environment');
    }
    await initializePool();
  }
  return pool;
}

// Helper function to get a client from the pool
export async function getClient() {
  const dbPool = await getPool();

  const client = await dbPool.connect();
  const query = client.query.bind(client);
  const release = () => {
    client.release();
  };

  // Set a timeout of 5 seconds, after which we will log this client's last query
  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!');
  }, 5000);

  const releaseWithTimeout = () => {
    clearTimeout(timeout);
    release();
  };

  return {
    query,
    release: releaseWithTimeout,
  };
}

// Helper function to test database connection with SSL validation
export async function testDatabaseConnection(): Promise<{ success: boolean; message: string; sslInfo?: any }> {
  try {
    const dbPool = await getPool();
    const client = await dbPool.connect();

    // Test basic connectivity
    const result = await client.query('SELECT version(), current_database(), session_user');
    const version = result.rows[0].version;
    const database = result.rows[0].current_database;
    const user = result.rows[0].session_user;

    // Get SSL information
    const sslResult = await client.query('SHOW ssl');
    const sslEnabled = sslResult.rows[0].ssl === 'on';

    client.release();

    const sslInfo = {
      enabled: sslEnabled,
      version: version,
      database: database,
      user: user,
      sslMode: process.env.DB_SSL_MODE || 'default'
    };

    return {
      success: true,
      message: `Database connection successful. SSL: ${sslEnabled ? 'enabled' : 'disabled'}`,
      sslInfo
    };

  } catch (error: any) {
    console.error('Database connection test failed:', error);

    let errorMessage = 'Database connection failed';
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused - check host and port settings';
    } else if (error.code === '42P01') {
      errorMessage = 'Database connection successful but test query failed';
    } else if (error.message?.includes('SSL')) {
      errorMessage = `SSL connection error: ${error.message}`;
    }

    return {
      success: false,
      message: errorMessage,
      sslInfo: {
        error: error.message,
        code: error.code
      }
    };
  }
}