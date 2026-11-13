const { consumer, topic, groupId, initKafka } = require('../config/kafka');
const { query, pool } = require('../config/db');
const { updateProductStockInIndex } = require('./searchService');
const { getProductById } = require('./productService');
const { logEvent } = require('./eventLogger');

let isConsumerRunning = false;
const processedOrderIds = new Set(); // In-memory deduplication cache

/**
 * Handle a consumed order_placed event with strict idempotency guards
 * @param {Object} eventData 
 * @param {Object} meta 
 */
async function processOrderEvent(eventData, meta = {}) {
  const { orderId, items = [] } = eventData;

  // 1. In-Memory Idempotency Check
  if (processedOrderIds.has(orderId)) {
    console.warn(`[KAFKA-CONSUMER] Idempotency guard (Memory): Order ${orderId} already processed. Skipping duplicate.`);
    logEvent({
      type: 'CONSUMED',
      topic: meta.topic || topic,
      orderId,
      partition: meta.partition || 0,
      offset: meta.offset,
      details: { notice: 'Duplicate event skipped by memory idempotency guard' },
      status: 'DUPLICATE_SKIPPED'
    });
    return { skipped: true, reason: 'Duplicate event (in-memory)' };
  }

  // 2. Database Idempotency Check (Persistent guard in PostgreSQL)
  if (pool) {
    try {
      const orderCheck = await query(
        `SELECT id, status, kafka_status FROM orders WHERE id = $1`,
        [String(orderId)]
      );
      if (orderCheck.rows.length > 0 && orderCheck.rows[0].kafka_status === 'CONSUMED') {
        console.warn(`[KAFKA-CONSUMER] Idempotency guard (PostgreSQL): Order ${orderId} already CONSUMED in database. Skipping duplicate.`);
        processedOrderIds.add(orderId);
        logEvent({
          type: 'CONSUMED',
          topic: meta.topic || topic,
          orderId,
          partition: meta.partition || 0,
          offset: meta.offset,
          details: { notice: 'Duplicate event skipped by PostgreSQL database guard' },
          status: 'DUPLICATE_SKIPPED'
        });
        return { skipped: true, reason: 'Duplicate event (database check)' };
      }
    } catch (dbCheckErr) {
      console.warn('Error checking order status in DB:', dbCheckErr.message);
    }
  }

  // Mark as processed immediately
  processedOrderIds.add(orderId);

  logEvent({
    type: 'CONSUMED',
    topic: meta.topic || topic,
    orderId,
    partition: meta.partition || 0,
    offset: meta.offset,
    details: { itemsCount: items.length, totalAmount: eventData.totalAmount },
    status: 'RECEIVED'
  });

  const updatedProducts = [];

  // 3. Process each item: verify inventory in PostgreSQL and sync to OpenSearch
  for (const item of items) {
    try {
      const prod = await getProductById(item.productId);
      const currentStock = prod ? prod.stock : 0;

      // Sync updated stock to OpenSearch index
      await updateProductStockInIndex(item.productId, currentStock);

      updatedProducts.push({
        productId: item.productId,
        productName: item.productName,
        stockRemaining: currentStock
      });
    } catch (itemErr) {
      console.error(`[KAFKA-CONSUMER] Error processing product ${item.productId}:`, itemErr.message);
    }
  }

  // 4. Update Order status in PostgreSQL to 'PROCESSING_COMPLETE' & kafka_status to 'CONSUMED'
  if (pool) {
    try {
      await query(
        `UPDATE orders 
         SET status = 'PROCESSING_COMPLETE', kafka_status = 'CONSUMED' 
         WHERE id = $1`,
        [String(orderId)]
      );
    } catch (dbErr) {
      console.warn('Failed to update order status in PostgreSQL:', dbErr.message);
    }
  }

  // 5. Emit real-time telemetry events
  logEvent({
    type: 'INVENTORY_UPDATED',
    topic: meta.topic || topic,
    orderId,
    partition: meta.partition || 0,
    offset: meta.offset,
    details: { updatedProducts },
    status: 'COMPLETED'
  });

  logEvent({
    type: 'OPENSEARCH_SYNCED',
    topic: meta.topic || topic,
    orderId,
    partition: meta.partition || 0,
    offset: meta.offset,
    details: { syncedCount: updatedProducts.length },
    status: 'INDEXED'
  });

  console.log(`[KAFKA-CONSUMER] Successfully processed order ${orderId} (${updatedProducts.length} items synced)`);
  return { success: true, updatedProducts };
}

/**
 * Start the real Kafka consumer listener
 */
async function startConsumer() {
  if (!consumer) {
    initKafka();
  }
  if (!consumer) return false;

  try {
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });

    isConsumerRunning = true;
    console.log(`[KAFKA-CONSUMER] Connected and subscribed to Aiven Kafka topic "${topic}" (group: "${groupId}")`);

    await consumer.run({
      autoCommit: true,
      eachMessage: async ({ topic: msgTopic, partition, message }) => {
        try {
          const payload = JSON.parse(message.value.toString());
          console.log(`[KAFKA-CONSUMER] Consumed message from partition ${partition}, offset ${message.offset}`);
          await processOrderEvent(payload, {
            topic: msgTopic,
            partition,
            offset: message.offset
          });
        } catch (err) {
          console.error('[KAFKA-CONSUMER] Error processing message:', err.message);
          logEvent({
            type: 'ERROR',
            topic: msgTopic,
            orderId: 'unknown',
            details: { error: err.message },
            status: 'FAILED'
          });
        }
      }
    });

    return true;
  } catch (err) {
    console.error('[KAFKA-CONSUMER] Failed to start consumer on Aiven cluster:', err.message);
    isConsumerRunning = false;
    return false;
  }
}

module.exports = {
  startConsumer,
  processOrderEvent,
  isConsumerActive: () => isConsumerRunning
};
