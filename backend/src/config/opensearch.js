const { Client } = require('@opensearch-project/opensearch');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

let client = null;
let isConnected = false;
let connectionError = null;

const indexName = process.env.OPENSEARCH_INDEX || 'products';

function initOpenSearch() {
  const nodeUrl = process.env.OPENSEARCH_NODE;
  if (nodeUrl && !nodeUrl.includes('your-opensearch-service') && nodeUrl.startsWith('http')) {
    try {
      const sslConfig = {
        rejectUnauthorized: process.env.OPENSEARCH_SSL_REJECT_UNAUTHORIZED === 'true'
      };

      // Check if Aiven CA cert is present
      const caCandidates = [
        path.resolve(__dirname, '../../certs/ca.pem'),
        path.resolve(__dirname, '../certs/ca.pem'),
        path.resolve(process.cwd(), 'certs/ca.pem'),
        path.resolve(process.cwd(), 'backend/certs/ca.pem')
      ];
      for (const caPath of caCandidates) {
        if (fs.existsSync(caPath)) {
          try {
            sslConfig.ca = fs.readFileSync(caPath, 'utf-8');
            break;
          } catch (_) {}
        }
      }

      client = new Client({
        node: nodeUrl,
        ssl: sslConfig,
        requestTimeout: 10000
      });
      connectionError = null;
    } catch (err) {
      console.error('Failed to initialize OpenSearch client:', err.message);
      connectionError = err.message;
      client = null;
    }
  } else {
    client = null;
    connectionError = 'OPENSEARCH_NODE not configured. Set Aiven OpenSearch Service URI in backend/.env';
  }
  return client;
}

// Initial setup
initOpenSearch();

/**
 * Check real-time OpenSearch cluster health and index statistics
 */
async function checkOpenSearchHealth() {
  if (!client) {
    initOpenSearch();
  }

  if (!client) {
    return {
      connected: false,
      error: connectionError || 'No OpenSearch node URL provided in backend/.env',
      indexName,
      documentCount: 0,
      latencyMs: null
    };
  }

  const start = Date.now();
  try {
    const health = await client.cluster.health();
    const latencyMs = Date.now() - start;

    // Check if products index exists and count documents
    let docCount = 0;
    try {
      const indexExists = await client.indices.exists({ index: indexName });
      const isPresent = indexExists.body !== undefined ? indexExists.body : indexExists;
      if (isPresent) {
        const countRes = await client.count({ index: indexName });
        docCount = countRes.body ? countRes.body.count : (countRes.count || 0);
      }
    } catch (idxErr) {
      // Index might not be created yet
    }

    isConnected = true;
    connectionError = null;
    return {
      connected: true,
      status: health.body ? health.body.status : (health.status || 'green'),
      clusterName: health.body ? health.body.cluster_name : (health.cluster_name || 'unknown'),
      numberOfNodes: health.body ? health.body.number_of_nodes : (health.number_of_nodes || 1),
      indexName,
      documentCount: docCount,
      latencyMs
    };
  } catch (err) {
    isConnected = false;
    connectionError = err.message;
    return {
      connected: false,
      error: err.message,
      indexName,
      documentCount: 0,
      latencyMs: null
    };
  }
}

module.exports = {
  get client() {
    return client || initOpenSearch();
  },
  getClient: () => client || initOpenSearch(),
  indexName,
  initOpenSearch,
  checkOpenSearchHealth,
  isOpenSearchConnected: () => isConnected,
  getOpenSearchError: () => connectionError
};
