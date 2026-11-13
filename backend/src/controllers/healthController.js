const { checkPgHealth } = require('../config/db');
const { checkKafkaHealth, isKafkaConnected } = require('../config/kafka');
const { isConsumerActive } = require('../services/kafkaConsumer');
const { isProducerReady } = require('../services/kafkaProducer');
const { checkOpenSearchHealth } = require('../config/opensearch');

/**
 * Dedicated PostgreSQL database health check executing SELECT 1
 */
async function getDatabaseHealth(req, res) {
  const pgHealth = await checkPgHealth();
  const statusCode = pgHealth.connected ? 200 : 503;
  res.status(statusCode).json({
    service: 'Aiven PostgreSQL',
    testQuery: 'SELECT 1',
    ...pgHealth
  });
}

/**
 * Dedicated Apache Kafka health check
 */
async function getKafkaHealth(req, res) {
  const kafkaHealth = await checkKafkaHealth();
  const statusCode = kafkaHealth.connected ? 200 : 503;
  res.status(statusCode).json({
    service: 'Aiven Apache Kafka',
    producerReady: isProducerReady(),
    consumerActive: isConsumerActive(),
    ...kafkaHealth
  });
}

/**
 * All services aggregated health
 */
async function getServicesHealth(req, res) {
  const [pgHealth, kafkaHealth, openSearchHealth] = await Promise.all([
    checkPgHealth(),
    checkKafkaHealth(),
    checkOpenSearchHealth()
  ]);

  const allConnected = pgHealth.connected && kafkaHealth.connected && openSearchHealth.connected;
  const anyConnected = pgHealth.connected || kafkaHealth.connected || openSearchHealth.connected;

  res.json({
    status: allConnected ? 'HEALTHY' : (anyConnected ? 'DEGRADED' : 'FALLBACK_MODE'),
    timestamp: new Date().toISOString(),
    services: {
      postgresql: pgHealth,
      kafka: {
        producerReady: isProducerReady(),
        consumerActive: isConsumerActive(),
        ...kafkaHealth
      },
      opensearch: openSearchHealth
    },
    cloudProvider: 'Aiven',
    aivenConfigGuide: {
      pgRequiredEnv: 'DATABASE_URL',
      kafkaRequiredEnv: 'KAFKA_BROKERS, KAFKA_CA_CERT_PATH, KAFKA_ACCESS_CERT_PATH, KAFKA_ACCESS_KEY_PATH',
      openSearchRequiredEnv: 'OPENSEARCH_NODE'
    }
  });
}

/**
 * Dedicated OpenSearch health check
 */
async function getOpenSearchHealth(req, res) {
  const osHealth = await checkOpenSearchHealth();
  const statusCode = osHealth.connected ? 200 : 503;
  res.status(statusCode).json({
    service: 'Aiven OpenSearch',
    ...osHealth
  });
}

module.exports = {
  getServicesHealth,
  getDatabaseHealth,
  getKafkaHealth,
  getOpenSearchHealth
};
