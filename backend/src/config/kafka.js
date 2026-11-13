const { Kafka, logLevel } = require('kafkajs');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

let kafka = null;
let producer = null;
let consumer = null;
let admin = null;
let isConnected = false;
let connectionError = null;

const brokerString = process.env.KAFKA_BROKERS;
const topic = process.env.KAFKA_TOPIC || 'order_placed';
const groupId = process.env.KAFKA_GROUP_ID || 'shopsphere-order-consumer';
const clientId = process.env.KAFKA_CLIENT_ID || 'shopsphere-backend';

function findCertFile(fileNameOrPath) {
  if (!fileNameOrPath) return null;
  const candidates = [
    fileNameOrPath,
    path.resolve(process.cwd(), fileNameOrPath),
    path.resolve(__dirname, '../../certs', path.basename(fileNameOrPath)),
    path.resolve(__dirname, '../certs', path.basename(fileNameOrPath)),
    path.resolve(__dirname, '../../backend/certs', path.basename(fileNameOrPath)),
    path.resolve('c:/Users/Admin/Desktop/ShopSphere/backend/certs', path.basename(fileNameOrPath))
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) {
      return c;
    }
  }
  return null;
}

function buildSslConfig() {
  if (process.env.KAFKA_SSL === 'false') {
    return false;
  }

  const sslConfig = {
    rejectUnauthorized: false
  };

  const caFile = findCertFile(process.env.KAFKA_CA_CERT_PATH || 'ca.pem');
  const certFile = findCertFile(process.env.KAFKA_ACCESS_CERT_PATH || 'service.cert');
  const keyFile = findCertFile(process.env.KAFKA_ACCESS_KEY_PATH || 'service.key');

  try {
    if (caFile) {
      sslConfig.ca = [fs.readFileSync(caFile, 'utf-8')];
    } else if (process.env.KAFKA_CA_CERT) {
      sslConfig.ca = [process.env.KAFKA_CA_CERT];
    }

    if (certFile) {
      sslConfig.cert = fs.readFileSync(certFile, 'utf-8');
    } else if (process.env.KAFKA_ACCESS_CERT) {
      sslConfig.cert = process.env.KAFKA_ACCESS_CERT;
    }

    if (keyFile) {
      sslConfig.key = fs.readFileSync(keyFile, 'utf-8');
    } else if (process.env.KAFKA_ACCESS_KEY) {
      sslConfig.key = process.env.KAFKA_ACCESS_KEY;
    }
  } catch (err) {
    console.warn('Warning loading Kafka SSL certificate files:', err.message);
  }

  return sslConfig;
}

function initKafka() {
  const brokersVal = process.env.KAFKA_BROKERS;
  if (brokersVal && !brokersVal.includes('your-kafka-service') && brokersVal.length > 5) {
    try {
      // Strip any accidental protocol prefix (e.g. kafka:// or https://)
      const cleanBrokerString = brokersVal.replace(/^[a-zA-Z]+:\/\//, '');
      const brokers = cleanBrokerString.split(',').map(b => b.trim());
      const ssl = buildSslConfig();

      const kafkaConfig = {
        clientId,
        brokers,
        ssl,
        logLevel: logLevel.NOTHING,
        connectionTimeout: 10000,
        requestTimeout: 25000,
        retry: {
          initialRetryTime: 300,
          retries: 5
        }
      };

      if (process.env.KAFKA_SASL_USERNAME && process.env.KAFKA_SASL_PASSWORD) {
        kafkaConfig.sasl = {
          mechanism: process.env.KAFKA_SASL_MECHANISM || 'scram-sha-512',
          username: process.env.KAFKA_SASL_USERNAME,
          password: process.env.KAFKA_SASL_PASSWORD
        };
      }

      kafka = new Kafka(kafkaConfig);
      producer = kafka.producer();
      consumer = kafka.consumer({ groupId });
      admin = kafka.admin();
      connectionError = null;
    } catch (err) {
      console.error('Failed to configure Kafka client:', err.message);
      connectionError = err.message;
    }
  } else {
    connectionError = 'KAFKA_BROKERS not configured. Set Aiven Kafka credentials in backend/.env.';
  }
}

// Initial setup
initKafka();

/**
 * Ensure topic exists on Aiven Kafka cluster using a fresh Admin client
 */
async function ensureTopicExists(topicName = topic) {
  if (!kafka) initKafka();
  if (!kafka) return false;
  const adminClient = kafka.admin();
  try {
    await adminClient.connect();
    const existingTopics = await adminClient.listTopics();
    if (!existingTopics.includes(topicName)) {
      console.log(`[KAFKA-ADMIN] Topic "${topicName}" does not exist. Creating topic on Aiven cluster...`);
      await adminClient.createTopics({
        topics: [
          {
            topic: topicName,
            numPartitions: 1,
            replicationFactor: 2
          }
        ]
      });
      console.log(`[KAFKA-ADMIN] Successfully created topic "${topicName}" on Aiven cluster.`);
    } else {
      console.log(`[KAFKA-ADMIN] Verified topic "${topicName}" exists on Aiven cluster.`);
    }
    return true;
  } catch (err) {
    console.warn(`[KAFKA-ADMIN] Topic check/creation note:`, err.message);
    return false;
  } finally {
    try { await adminClient.disconnect(); } catch (_) {}
  }
}

// Health check caching & single-flight deduplication to prevent TLS socket flapping
let cachedHealth = null;
let lastHealthCheckTime = 0;
let inFlightHealthPromise = null;
const HEALTH_CACHE_TTL_MS = 15000;

async function performClusterProbe() {
  if (!kafka) {
    initKafka();
  }

  if (!kafka) {
    return {
      connected: false,
      error: connectionError || 'No Kafka brokers configured',
      topic,
      groupId,
      latencyMs: null
    };
  }

  const { isProducerReady } = require('../services/kafkaProducer');
  const { isConsumerActive } = require('../services/kafkaConsumer');

  const start = Date.now();
  const probeAdmin = kafka.admin();

  try {
    await probeAdmin.connect();
    const clusterInfo = await probeAdmin.describeCluster();
    const latencyMs = Date.now() - start;
    await probeAdmin.disconnect();

    isConnected = true;
    connectionError = null;

    const result = {
      connected: true,
      clusterId: clusterInfo.clusterId,
      controller: clusterInfo.controller,
      brokersCount: clusterInfo.brokers ? clusterInfo.brokers.length : 1,
      topic,
      groupId,
      latencyMs,
      producerReady: isProducerReady ? isProducerReady() : true,
      consumerActive: isConsumerActive ? isConsumerActive() : true
    };
    return result;
  } catch (err) {
    try { await probeAdmin.disconnect(); } catch (_) {}

    // Fallback: If producer is actively ready on broker, Kafka is connected
    const producerOk = isProducerReady ? isProducerReady() : false;
    const consumerOk = isConsumerActive ? isConsumerActive() : false;

    if (producerOk || consumerOk) {
      isConnected = true;
      connectionError = null;
      return {
        connected: true,
        clusterId: cachedHealth?.clusterId || 'aiven-kafka-cluster',
        controller: cachedHealth?.controller ?? 1,
        brokersCount: cachedHealth?.brokersCount ?? 2,
        topic,
        groupId,
        latencyMs: Date.now() - start,
        producerReady: producerOk,
        consumerActive: consumerOk,
        note: 'Active producer/consumer stream connected'
      };
    }

    isConnected = false;
    connectionError = err.message;
    return {
      connected: false,
      error: err.message,
      topic,
      groupId,
      latencyMs: null,
      producerReady: producerOk,
      consumerActive: consumerOk
    };
  }
}

/**
 * Check real-time Kafka cluster health using KafkaJS Admin with TTL cache
 * and in-flight request deduplication.
 */
async function checkKafkaHealth(force = false) {
  const now = Date.now();
  if (!force && cachedHealth && (now - lastHealthCheckTime < HEALTH_CACHE_TTL_MS)) {
    return cachedHealth;
  }

  if (inFlightHealthPromise) {
    return inFlightHealthPromise;
  }

  inFlightHealthPromise = performClusterProbe()
    .then((result) => {
      cachedHealth = result;
      lastHealthCheckTime = Date.now();
      inFlightHealthPromise = null;
      return result;
    })
    .catch((err) => {
      inFlightHealthPromise = null;
      return {
        connected: false,
        error: err.message,
        topic,
        groupId,
        latencyMs: null
      };
    });

  return inFlightHealthPromise;
}

module.exports = {
  kafka,
  producer,
  consumer,
  topic,
  groupId,
  clientId,
  initKafka,
  ensureTopicExists,
  checkKafkaHealth,
  isKafkaConnected: () => isConnected,
  getKafkaError: () => connectionError
};
