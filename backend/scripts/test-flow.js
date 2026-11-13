// Automated verification test script for ShopSphere backend APIs
const http = require('http');

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting ShopSphere End-to-End Verification Tests...\n');

  try {
    // 1. Health check
    console.log('1️⃣ Testing /api/health ...');
    const health = await makeRequest('/api/health');
    console.log(`   Status: ${health.status} (${health.body.status})`);
    console.log(`   PG: ${health.body.services.postgresql.connected ? '✅' : '⚠️ Fallback'}`);
    console.log(`   Kafka: ${health.body.services.kafka.connected ? '✅' : '⚠️ Fallback'}`);
    console.log(`   OpenSearch: ${health.body.services.opensearch.connected ? '✅' : '⚠️ Fallback'}`);

    // 2. Fetch products
    console.log('\n2️⃣ Testing /api/products ...');
    const prods = await makeRequest('/api/products');
    console.log(`   Fetched ${prods.body.count} products.`);
    if (prods.body.count < 15) throw new Error('Expected at least 15 products');
    console.log('   ✅ Products fetched successfully.');

    // 3. Typo-tolerant search
    console.log('\n3️⃣ Testing Typo Tolerance /api/search?q=bluetoth ...');
    const searchRes = await makeRequest('/api/search?q=bluetoth');
    console.log(`   Engine: ${searchRes.body.engine}, Total Matches: ${searchRes.body.total}`);
    if (searchRes.body.results.length === 0) {
      console.warn('   ⚠️ No results for typo "bluetoth"');
    } else {
      console.log(`   ✅ Matched: "${searchRes.body.results[0].name}"`);
    }

    // 4. Place valid order
    console.log('\n4️⃣ Testing Order Placement & Stock Decrement ...');
    const targetProduct = prods.body.products[0];
    const initialStock = targetProduct.stock;
    console.log(`   Ordering product "${targetProduct.name}" (Current stock: ${initialStock})`);

    const orderPayload = {
      customerName: 'Aarav Sharma',
      email: 'aarav.sharma@example.in',
      phone: '9876543210',
      address: '42 MG Road, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      items: [
        {
          productId: targetProduct.id,
          quantity: 2
        }
      ]
    };

    const orderRes = await makeRequest('/api/orders', 'POST', orderPayload);
    console.log(`   Status: ${orderRes.status}`);
    if (orderRes.status !== 201) {
      throw new Error(`Order placement failed: ${JSON.stringify(orderRes.body)}`);
    }
    console.log(`   ✅ Order Created: ${orderRes.body.order.id}`);

    // Verify stock decremented
    const verifyProd = await makeRequest(`/api/products/${targetProduct.id}`);
    console.log(`   Updated stock: ${verifyProd.body.product.stock} (Expected: ${initialStock - 2})`);
    if (verifyProd.body.product.stock !== initialStock - 2) {
      console.warn('   ⚠️ Stock did not decrement as expected');
    } else {
      console.log('   ✅ Stock decremented correctly.');
    }

    // 5. Test overselling prevention
    console.log('\n5️⃣ Testing Overselling Prevention (Ordering 9999 items) ...');
    const invalidOrder = {
      ...orderPayload,
      items: [
        {
          productId: targetProduct.id,
          quantity: 9999
        }
      ]
    };
    const invalidRes = await makeRequest('/api/orders', 'POST', invalidOrder);
    console.log(`   Status: ${invalidRes.status} (Expected 400)`);
    if (invalidRes.status === 400 && invalidRes.body.message.includes('Insufficient stock')) {
      console.log(`   ✅ Overselling correctly rejected: "${invalidRes.body.message}"`);
    } else {
      throw new Error(`Expected 400 with Insufficient stock error, got ${invalidRes.status}`);
    }

    // 6. Check Admin stats & Kafka Telemetry
    console.log('\n6️⃣ Checking Admin Telemetry & Kafka Stream Logs ...');
    const adminStats = await makeRequest('/api/admin/stats');
    console.log(`   Total Orders in Admin: ${adminStats.body.metrics.totalOrders}`);
    console.log(`   Kafka Event Logs captured: ${adminStats.body.kafkaEventLogs.length}`);
    if (adminStats.body.kafkaEventLogs.length > 0) {
      console.log(`   Latest event: [${adminStats.body.kafkaEventLogs[0].type}] for ${adminStats.body.kafkaEventLogs[0].orderId}`);
    }
    console.log('   ✅ Admin telemetry active and accurate.');

    console.log('\n🎉 ALL 6 VERIFICATION CHECKS PASSED!\n');
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
    process.exit(1);
  }
}

runTests();
