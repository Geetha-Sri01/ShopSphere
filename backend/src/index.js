const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
dotenv.config();

const productRoutes = require('./routes/productRoutes');
const searchRoutes = require('./routes/searchRoutes');
const orderRoutes = require('./routes/orderRoutes');
const healthRoutes = require('./routes/healthRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const { initProducer } = require('./services/kafkaProducer');
const { startConsumer } = require('./services/kafkaConsumer');
const { checkPgHealth } = require('./config/db');
const { checkKafkaHealth } = require('./config/kafka');
const { checkOpenSearchHealth } = require('./config/opensearch');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'ShopSphere API',
    version: '1.0.0',
    description: 'Modern Indian Retail E-Commerce Backend with Aiven Cloud Services',
    services: {
      database: 'Aiven PostgreSQL',
      streaming: 'Aiven Apache Kafka',
      search: 'Aiven OpenSearch'
    },
    endpoints: {
      products: '/api/products',
      categories: '/api/products/categories',
      search: '/api/search?q=query',
      orders: '/api/orders',
      health: '/api/health',
      admin: '/api/admin/stats'
    }
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start server and background workers
app.listen(PORT, async () => {
  console.log('========================================================');
  console.log(`🚀 ShopSphere Backend running on http://localhost:${PORT}`);
  console.log('========================================================');

  // Asynchronously test and log initial connection statuses
  const [pg, kafka, os] = await Promise.all([
    checkPgHealth(),
    checkKafkaHealth(),
    checkOpenSearchHealth()
  ]);

  console.log(`🐘 PostgreSQL Status : ${pg.connected ? `CONNECTED (${pg.latencyMs}ms)` : `DISCONNECTED (${pg.error || 'Check .env'})`}`);
  console.log(`📨 Apache Kafka Status: ${kafka.connected ? `CONNECTED (${kafka.latencyMs}ms)` : `DISCONNECTED (${kafka.error || 'Check .env'})`}`);
  console.log(`🔎 OpenSearch Status  : ${os.connected ? `CONNECTED (${os.latencyMs}ms)` : `DISCONNECTED (${os.error || 'Check .env'})`}`);
  console.log('========================================================');

  // Initialize Kafka stream components
  await initProducer();
  startConsumer();
});

module.exports = app;
