// In-memory circular buffer of Kafka event logs for the real-time Admin telemetry
const MAX_LOGS = 100;
const eventLogs = [];

/**
 * Log an event to the telemetry stream
 * @param {Object} logEntry 
 */
function logEvent({
  type, // 'PRODUCED' | 'CONSUMED' | 'INVENTORY_UPDATED' | 'OPENSEARCH_SYNCED' | 'ERROR'
  topic = 'shopsphere-orders',
  orderId,
  partition = 0,
  offset = null,
  details = {},
  status = 'SUCCESS'
}) {
  const entry = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    type,
    topic,
    orderId,
    partition,
    offset: offset !== null ? offset : Math.floor(Math.random() * 500) + 1,
    details,
    status
  };

  eventLogs.unshift(entry);
  if (eventLogs.length > MAX_LOGS) {
    eventLogs.pop();
  }

  console.log(`[KAFKA-TELEMETRY] [${entry.type}] Order: ${orderId} | Status: ${status}`);
  return entry;
}

/**
 * Get recent event telemetry logs
 * @param {number} limit 
 */
function getEventLogs(limit = 50) {
  return eventLogs.slice(0, limit);
}

/**
 * Clear event telemetry logs
 */
function clearEventLogs() {
  eventLogs.length = 0;
}

module.exports = {
  logEvent,
  getEventLogs,
  clearEventLogs
};
