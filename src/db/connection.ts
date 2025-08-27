// Check if we're in a Node.js environment
const isNodeEnvironment = typeof process !== 'undefined' && process.env && typeof process.cwd === 'function';

// Load environment variables only in Node.js environment
if (isNodeEnvironment) {
  // Use dynamic import to avoid bundler issues
  import('dotenv').then((dotenv) => {
    dotenv.config();
  }).catch(() => {
    // Silently fail in browser environment
  });
}

// Create PostgreSQL connection pool only in Node.js environment
let pool: any = null;

if (isNodeEnvironment) {
  try {
    // Dynamic import for ES modules
    import('pg').then((pg) => {
      const { Pool } = pg;
      pool = new Pool({
        host: process.env.DB_HOST || 'rxg.postgres.database.azure.com',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'sports_performance_db',
        user: process.env.DB_USER || 'rx',
        password: process.env.DB_PASSWORD || 'qwe12345_',
        ssl: { rejectUnauthorized: false }, // Required for Azure PostgreSQL
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
        connectionTimeoutMillis: 10000, // Increased timeout for Azure connections
        // Azure PostgreSQL specific options
        keepAlive: true,
        keepAliveInitialDelayMillis: 0,
      });

      // Test database connection
      pool.on('connect', () => {
        console.log('Connected to PostgreSQL database');
      });

      pool.on('error', (err: any) => {
        console.error('Unexpected error on idle client', err);
        if (isNodeEnvironment) {
          process.exit(-1);
        }
      });
    }).catch((error) => {
      console.warn('PostgreSQL connection not available in this environment:', error);
    });
  } catch (error) {
    console.warn('PostgreSQL connection not available in this environment:', error);
  }
} else {
  console.warn('Database connection skipped - not in Node.js environment');
}

export default pool;

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const dbPool = await waitForPool();

  const start = Date.now();
  try {
    const res = await dbPool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Helper function to wait for pool initialization
async function waitForPool(): Promise<any> {
  if (pool) return pool;

  // Wait a bit for the dynamic import to complete
  for (let i = 0; i < 50; i++) {
    if (pool) return pool;
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw new Error('Database connection not available - pool not initialized');
}

// Helper function to get a client from the pool
export async function getClient() {
  const dbPool = await waitForPool();

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