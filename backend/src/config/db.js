const { Pool } = require('pg');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

let pool = null;
let isConnected = false;
let lastPingTimeMs = null;
let connectionError = null;

function buildSslConfig() {
  const caPath = process.env.PG_SSL_CA || process.env.AIVEN_CA_CERT;
  if (caPath && fs.existsSync(caPath)) {
    try {
      return {
        rejectUnauthorized: true,
        ca: fs.readFileSync(caPath, 'utf-8')
      };
    } catch (err) {
      console.warn('Could not read PostgreSQL CA certificate file, falling back to standard SSL:', err.message);
    }
  }
  // Standard SSL mode for Aiven PostgreSQL cloud instances
  return {
    rejectUnauthorized: false
  };
}

function initPool() {
  const rawConnectionString = process.env.DATABASE_URL;

  if (rawConnectionString && !rawConnectionString.includes('YOUR_PASSWORD') && rawConnectionString.startsWith('postgres')) {
    try {
      // Normalize connection string so pg-connection-string does not force verify-full over explicit SSL config
      const cleanUrl = rawConnectionString.replace(/([?&])sslmode=[^&]+(&|$)/, (m, p1, p2) => p2 === '&' ? p1 : '');
      const trimmedUrl = cleanUrl.endsWith('?') ? cleanUrl.slice(0, -1) : cleanUrl;

      pool = new Pool({
        connectionString: trimmedUrl,
        ssl: buildSslConfig(),
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
      });

      pool.on('error', (err) => {
        console.error('Unexpected error on idle PostgreSQL client:', err.message);
        isConnected = false;
        connectionError = err.message;
      });
      connectionError = null;
    } catch (err) {
      console.error('Failed to initialize PostgreSQL pool:', err.message);
      connectionError = err.message;
    }
  } else {
    connectionError = 'DATABASE_URL not configured. Running in local fallback mode.';
  }
}

// Initialize on module load
initPool();

/**
 * Check real-time PostgreSQL connection health by executing SELECT 1
 */
async function checkPgHealth() {
  // If pool was not initialized previously, check if env was updated
  if (!pool && process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('YOUR_PASSWORD')) {
    initPool();
  }

  if (!pool) {
    return {
      connected: false,
      query: 'SELECT 1',
      error: connectionError || 'No PostgreSQL connection string provided in DATABASE_URL',
      latencyMs: null
    };
  }

  const start = Date.now();
  try {
    // Explicitly run SELECT 1 along with server version and database name
    const res = await pool.query('SELECT 1 as ping, NOW() as now, current_database() as db_name, version() as version;');
    const latencyMs = Date.now() - start;
    isConnected = true;
    lastPingTimeMs = latencyMs;
    connectionError = null;
    return {
      connected: true,
      query: 'SELECT 1',
      pingResult: res.rows[0].ping,
      database: res.rows[0].db_name,
      serverTime: res.rows[0].now,
      latencyMs,
      version: res.rows[0].version.split(' ')[0] + ' ' + res.rows[0].version.split(' ')[1]
    };
  } catch (err) {
    isConnected = false;
    connectionError = err.message;
    return {
      connected: false,
      query: 'SELECT 1',
      error: err.message,
      latencyMs: null
    };
  }
}

/**
 * Execute parameterized query safely
 */
async function query(text, params) {
  if (!pool) {
    initPool();
  }
  if (!pool) {
    throw new Error('PostgreSQL pool is not initialized');
  }
  return pool.query(text, params);
}

/**
 * Get dedicated client for transactions
 */
async function getClient() {
  if (!pool) {
    initPool();
  }
  if (!pool) {
    throw new Error('PostgreSQL pool is not initialized');
  }
  return pool.connect();
}

module.exports = {
  pool,
  query,
  getClient,
  initPool,
  checkPgHealth,
  isPgConnected: () => isConnected,
  getConnectionError: () => connectionError
};
