const { pool, getClient, query } = require('../config/db');
const { getProductById, decrementStock, getLocalProducts } = require('./productService');
const { publishOrderPlaced } = require('./kafkaProducer');
const { processOrderEvent } = require('./kafkaConsumer');

// In-memory orders store for fallback preview
const localOrders = [];

/**
 * Generate a clean, human-readable order ID: ORD-YYYYMMDD-XXXX
 */
function generateOrderId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${dateStr}-${rand}`;
}

/**
 * Place a new order with safe database transactions, row-locking, and Kafka event publishing
 */
async function createOrder({
  customerName,
  email,
  phone,
  address,
  city,
  state,
  pincode,
  items
}) {
  if (!items || items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  const orderId = generateOrderId();
  let subtotal = 0;
  const enrichedItems = [];

  // If PostgreSQL is available, execute inside a strict ACID transaction with row-level locks
  if (pool) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const productIds = items.map(it => parseInt(it.productId, 10));

      // Lock the product rows to prevent race conditions and overselling
      const lockRes = await client.query(
        'SELECT id, name, price, stock, image_url FROM products WHERE id = ANY($1) FOR UPDATE',
        [productIds]
      );

      const productMap = new Map();
      lockRes.rows.forEach(p => productMap.set(p.id, p));

      // Validate stock for all items
      for (const item of items) {
        const prodId = parseInt(item.productId, 10);
        const qty = parseInt(item.quantity, 10);
        const product = productMap.get(prodId);

        if (!product) {
          throw new Error(`Product with ID ${prodId} not found`);
        }

        if (product.stock < qty) {
          throw new Error(
            `Insufficient stock for "${product.name}". Requested: ${qty}, Available: ${product.stock}`
          );
        }

        const unitPrice = parseFloat(product.price);
        const itemSubtotal = unitPrice * qty;
        subtotal += itemSubtotal;

        enrichedItems.push({
          productId: product.id,
          productName: product.name,
          productImage: product.image_url,
          quantity: qty,
          unitPrice,
          subtotal: itemSubtotal
        });
      }

      // Atomically decrement stock
      for (const item of enrichedItems) {
        await client.query(
          'UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2',
          [item.quantity, item.productId]
        );
      }

      // Insert customer
      const custRes = await client.query(
        `INSERT INTO customers (name, email, phone, address, city, state, pincode)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [customerName, email, phone, address, city, state, pincode]
      );
      const customerId = custRes.rows[0].id;

      // Calculate totals (Free shipping over ₹999, 5% GST)
      const tax = Math.round(subtotal * 0.05 * 100) / 100;
      const shipping = subtotal > 999 ? 0 : 99;
      const totalAmount = Math.round((subtotal + tax + shipping) * 100) / 100;
      const deliveryAddress = `${address}, ${city}, ${state} - ${pincode}`;

      // Insert Order
      await client.query(
        `INSERT INTO orders (id, customer_id, customer_name, customer_email, customer_phone, delivery_address, subtotal, tax, shipping, total_amount, status, kafka_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'CONFIRMED', 'PENDING')`,
        [orderId, customerId, customerName, email, phone, deliveryAddress, subtotal, tax, shipping, totalAmount]
      );

      // Insert Order Items
      for (const item of enrichedItems) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [orderId, item.productId, item.productName, item.productImage, item.quantity, item.unitPrice, item.subtotal]
        );
      }

      // Insert Outbox Event for reliable Kafka publishing
      const outboxPayload = {
        orderId,
        customer_name: customerName,
        customer_email: email,
        customer_phone: phone,
        city,
        items: enrichedItems,
        total_amount: totalAmount,
        createdAt: new Date().toISOString()
      };

      await client.query(
        `INSERT INTO outbox_events (aggregate_type, aggregate_id, event_type, payload, status)
         VALUES ('ORDER', $1, 'ORDER_PLACED', $2, 'PENDING')`,
        [orderId, JSON.stringify(outboxPayload)]
      );

      await client.query('COMMIT');
      client.release();

      const createdOrder = {
        id: orderId,
        customer_name: customerName,
        customer_email: email,
        customer_phone: phone,
        delivery_address: deliveryAddress,
        city,
        items: enrichedItems,
        subtotal,
        tax,
        shipping,
        total_amount: totalAmount,
        status: 'CONFIRMED',
        topic: process.env.KAFKA_TOPIC || 'order_placed',
        created_at: new Date().toISOString()
      };

      // Publish to Kafka
      try {
        const pubResult = await publishOrderPlaced(createdOrder);
        if (pubResult.mode === 'simulated') {
          // Trigger consumer logic in-process for demo
          setImmediate(() => processOrderEvent(outboxPayload, { topic: 'shopsphere-orders (simulated)' }));
        }
      } catch (kafkaErr) {
        console.warn('Kafka publish deferred to outbox worker:', kafkaErr.message);
      }

      return createdOrder;
    } catch (err) {
      await client.query('ROLLBACK');
      client.release();
      throw err;
    }
  }

  // Fallback in-memory order handling
  const allProds = getLocalProducts();
  for (const item of items) {
    const prodId = parseInt(item.productId, 10);
    const qty = parseInt(item.quantity, 10);
    const prod = allProds.find(p => p.id === prodId);

    if (!prod) throw new Error(`Product ${prodId} not found`);
    if (prod.stock < qty) {
      throw new Error(`Insufficient stock for "${prod.name}". Available: ${prod.stock}`);
    }

    const unitPrice = parseFloat(prod.price);
    const itemSubtotal = unitPrice * qty;
    subtotal += itemSubtotal;

    enrichedItems.push({
      productId: prod.id,
      productName: prod.name,
      productImage: prod.image_url,
      quantity: qty,
      unitPrice,
      subtotal: itemSubtotal
    });
  }

  // Deduct local memory stock
  for (const item of enrichedItems) {
    await decrementStock(item.productId, item.quantity);
  }

  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const shipping = subtotal > 999 ? 0 : 99;
  const totalAmount = Math.round((subtotal + tax + shipping) * 100) / 100;
  const deliveryAddress = `${address}, ${city}, ${state} - ${pincode}`;

  const createdOrder = {
    id: orderId,
    customer_name: customerName,
    customer_email: email,
    customer_phone: phone,
    delivery_address: deliveryAddress,
    city,
    items: enrichedItems,
    subtotal,
    tax,
    shipping,
    total_amount: totalAmount,
    status: 'CONFIRMED',
    topic: process.env.KAFKA_TOPIC || 'order_placed',
    created_at: new Date().toISOString()
  };

  localOrders.unshift(createdOrder);

  // Dispatch Kafka event
  const pubResult = await publishOrderPlaced(createdOrder);
  if (pubResult.mode === 'simulated') {
    setImmediate(() => processOrderEvent({
      orderId,
      items: enrichedItems,
      totalAmount,
      timestamp: createdOrder.created_at
    }, { topic: 'shopsphere-orders (simulated)' }));
  }

  return createdOrder;
}

/**
 * Get all orders for the Admin dashboard
 */
async function getOrders(limit = 20) {
  if (pool) {
    try {
      const ordersRes = await query(
        'SELECT * FROM orders ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
      return ordersRes.rows;
    } catch (err) {
      console.warn('Failed to fetch orders from PostgreSQL:', err.message);
    }
  }
  return localOrders.slice(0, limit);
}

/**
 * Get single order with its items
 */
async function getOrderById(orderId) {
  if (pool) {
    try {
      const orderRes = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
      if (orderRes.rows.length === 0) return null;

      const itemsRes = await query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
      return {
        ...orderRes.rows[0],
        items: itemsRes.rows
      };
    } catch (err) {
      console.warn('Failed to fetch order from PostgreSQL:', err.message);
    }
  }

  return localOrders.find(o => o.id === orderId) || null;
}

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  getLocalOrders: () => localOrders
};
