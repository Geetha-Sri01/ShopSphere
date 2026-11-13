const { getOrders } = require('../services/orderService');
const { getProducts, resetDemoData } = require('../services/productService');
const { getEventLogs, clearEventLogs } = require('../services/eventLogger');
const { checkPgHealth } = require('../config/db');
const { checkKafkaHealth } = require('../config/kafka');
const { checkOpenSearchHealth } = require('../config/opensearch');

async function getAdminDashboardStats(req, res, next) {
  try {
    const [products, orders, pgHealth, kafkaHealth, osHealth] = await Promise.all([
      getProducts({ limit: 100 }),
      getOrders(30),
      checkPgHealth(),
      checkKafkaHealth(),
      checkOpenSearchHealth()
    ]);

    const totalStock = products.reduce((acc, p) => acc + (parseInt(p.stock, 10) || 0), 0);
    const totalRevenue = orders.reduce((acc, o) => acc + (parseFloat(o.total_amount) || 0), 0);

    const eventLogs = getEventLogs(50);

    res.json({
      success: true,
      metrics: {
        totalProducts: products.length,
        totalOrders: orders.length,
        availableStock: totalStock,
        totalRevenue: Math.round(totalRevenue * 100) / 100
      },
      services: {
        postgresql: pgHealth,
        kafka: kafkaHealth,
        opensearch: osHealth
      },
      recentOrders: orders,
      kafkaEventLogs: eventLogs
    });
  } catch (err) {
    next(err);
  }
}

async function getKafkaLogs(req, res) {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
  res.json({
    success: true,
    logs: getEventLogs(limit)
  });
}

async function resetData(req, res, next) {
  try {
    const result = await resetDemoData();
    clearEventLogs();
    res.json({
      success: true,
      message: 'Demo inventory reset successfully to 16 products, and event stream refreshed.',
      count: result.count
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAdminDashboardStats,
  getKafkaLogs,
  resetData
};
