const { producer, topic, initKafka, ensureTopicExists, kafka } = require('../config/kafka');
const { query, pool } = require('../config/db');
const { logEvent } = require('./eventLogger');

let isProducerConnected = false;

async function initProducer() {
  if (!producer) {
    initKafka();
  }
  if (!producer) return false;

  try {
    // 1. Ensure topic exists on Aiven cluster
    await ensureTopicExists(topic);

    // 2. Connect producer to broker
    await producer.connect();
    isProducerConnected = true;
    console.log(`[KAFKA-PRODUCER] Connected successfully to Aiven Kafka broker (Topic: "${topic}")`);
    return true;
  } catch (err) {
    console.error('[KAFKA-PRODUCER] Connection failed:', err.message);
    isProducerConnected = false;
    return false;
  }
}

/**
 * Publish real order_placed event to Aiven Apache Kafka
 * @param {Object} orderData 
 */
async function publishOrderPlaced(orderData) {
  const eventPayload = {
    eventType: 'ORDER_PLACED',
    orderId: orderData.id,
    timestamp: new Date().toISOString(),
    customer: {
      name: orderData.customer_name,
      email: orderData.customer_email,
      phone: orderData.customer_phone,
      city: orderData.city
    },
    items: orderData.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    })),
    totalAmount: orderData.total_amount
  };

  // If real Kafka producer is connected, publish to Aiven cluster
  if (isProducerConnected && producer) {
    try {
      const record = await producer.send({
        topic,
        messages: [
          {
            key: String(orderData.id),
            value: JSON.stringify(eventPayload),
            headers: {
              'correlation-id': `corr_${Date.now()}`,
              'event-source': 'shopsphere-api',
              'timestamp': String(Date.now())
            }
          }
        ]
      });

      const partition = record[0]?.partition ?? 0;
      const baseOffset = record[0]?.baseOffset ?? '0';

      // Update PostgreSQL outbox and order records
      if (pool) {
        try {
          await query(
            `UPDATE outbox_events 
             SET status = 'PUBLISHED', published_at = NOW() 
             WHERE aggregate_id = $1 AND event_type = 'ORDER_PLACED'`,
            [String(orderData.id)]
          );
          await query(
            `UPDATE orders SET kafka_status = 'PUBLISHED' WHERE id = $1`,
            [String(orderData.id)]
          );
        } catch (dbErr) {
          console.warn('Failed to update outbox status in DB:', dbErr.message);
        }
      }

      logEvent({
        type: 'PRODUCED',
        topic,
        orderId: orderData.id,
        partition,
        offset: baseOffset,
        details: eventPayload,
        status: 'SUCCESS'
      });

      console.log(`[KAFKA-PRODUCER] Published order_placed event to partition ${partition}, offset ${baseOffset}`);
      return { success: true, mode: 'kafka_broker', record };
    } catch (err) {
      console.error('[KAFKA-PRODUCER] Error sending message to Aiven Kafka:', err.message);
      logEvent({
        type: 'PRODUCED',
        topic,
        orderId: orderData.id,
        details: { error: err.message },
        status: 'ERROR'
      });
      throw err;
    }
  }

  // Fallback only when KAFKA_BROKERS is not yet configured
  logEvent({
    type: 'PRODUCED',
    topic: `${topic} (simulated)`,
    orderId: orderData.id,
    details: eventPayload,
    status: 'SIMULATED'
  });

  return { success: true, mode: 'simulated', event: eventPayload };
}

module.exports = {
  initProducer,
  publishOrderPlaced,
  isProducerReady: () => isProducerConnected
};
