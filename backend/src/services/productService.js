const { query, pool } = require('../config/db');
const { categories: initialCategories, products: initialProducts } = require('../data/mockProducts');

// In-memory working copies for local fallback / demo mode
let localCategories = JSON.parse(JSON.stringify(initialCategories));
let localProducts = JSON.parse(JSON.stringify(initialProducts));

/**
 * Get all product categories
 */
async function getCategories() {
  if (pool) {
    try {
      const res = await query('SELECT * FROM categories ORDER BY id ASC');
      if (res.rows.length > 0) return res.rows;
    } catch (err) {
      console.warn('PostgreSQL getCategories failed, falling back to local memory:', err.message);
    }
  }
  return localCategories;
}

/**
 * Get products with optional category, price filter, and limit
 */
async function getProducts({ categoryId, minPrice, maxPrice, featured, trending, limit = 50 }) {
  if (pool) {
    try {
      let sql = 'SELECT * FROM products WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (categoryId) {
        sql += ` AND category_id = $${paramIndex++}`;
        params.push(parseInt(categoryId, 10));
      }
      if (minPrice !== undefined && minPrice !== null) {
        sql += ` AND price >= $${paramIndex++}`;
        params.push(parseFloat(minPrice));
      }
      if (maxPrice !== undefined && maxPrice !== null) {
        sql += ` AND price <= $${paramIndex++}`;
        params.push(parseFloat(maxPrice));
      }
      if (featured === true || featured === 'true') {
        sql += ` AND featured = true`;
      }
      if (trending === true || trending === 'true') {
        sql += ` AND trending = true`;
      }

      sql += ` ORDER BY id ASC LIMIT $${paramIndex}`;
      params.push(limit);

      const res = await query(sql, params);
      return res.rows;
    } catch (err) {
      console.warn('PostgreSQL getProducts failed, falling back to local memory:', err.message);
    }
  }

  // Fallback to local memory filter
  let filtered = [...localProducts];
  if (categoryId) {
    filtered = filtered.filter(p => p.category_id === parseInt(categoryId, 10));
  }
  if (minPrice !== undefined && minPrice !== null && !isNaN(minPrice)) {
    filtered = filtered.filter(p => p.price >= parseFloat(minPrice));
  }
  if (maxPrice !== undefined && maxPrice !== null && !isNaN(maxPrice)) {
    filtered = filtered.filter(p => p.price <= parseFloat(maxPrice));
  }
  if (featured === true || featured === 'true') {
    filtered = filtered.filter(p => p.featured);
  }
  if (trending === true || trending === 'true') {
    filtered = filtered.filter(p => p.trending);
  }

  return filtered.slice(0, limit);
}

/**
 * Get product by ID
 */
async function getProductById(id) {
  const numericId = parseInt(id, 10);
  if (pool) {
    try {
      const res = await query('SELECT * FROM products WHERE id = $1', [numericId]);
      if (res.rows.length > 0) return res.rows[0];
    } catch (err) {
      console.warn('PostgreSQL getProductById failed, checking local memory:', err.message);
    }
  }
  return localProducts.find(p => p.id === numericId) || null;
}

/**
 * Atomically update / decrement product stock
 * @param {number} productId 
 * @param {number} quantity 
 */
async function decrementStock(productId, quantity, client = null) {
  const numId = parseInt(productId, 10);
  const qty = parseInt(quantity, 10);

  if (client) {
    // Inside active PostgreSQL transaction
    const updateRes = await client.query(
      `UPDATE products 
       SET stock = stock - $1, updated_at = NOW() 
       WHERE id = $2 AND stock >= $1 
       RETURNING id, name, stock`,
      [qty, numId]
    );
    if (updateRes.rowCount === 0) {
      throw new Error(`Insufficient stock for product ID ${numId}`);
    }
    return updateRes.rows[0];
  } else if (pool) {
    // Single query
    const res = await query(
      `UPDATE products 
       SET stock = stock - $1, updated_at = NOW() 
       WHERE id = $2 AND stock >= $1 
       RETURNING id, name, stock`,
      [qty, numId]
    );
    if (res.rowCount === 0) {
      throw new Error(`Insufficient stock for product ID ${numId}`);
    }
    return res.rows[0];
  }

  // Memory fallback
  const prod = localProducts.find(p => p.id === numId);
  if (!prod) {
    throw new Error(`Product not found: ${numId}`);
  }
  if (prod.stock < qty) {
    throw new Error(`Insufficient stock for ${prod.name}. Available: ${prod.stock}`);
  }
  prod.stock -= qty;
  return { id: prod.id, name: prod.name, stock: prod.stock };
}

/**
 * Reset demo stock and product data
 */
async function resetDemoData() {
  localProducts = JSON.parse(JSON.stringify(initialProducts));
  localCategories = JSON.parse(JSON.stringify(initialCategories));

  if (pool) {
    try {
      for (const prod of initialProducts) {
        await query(
          'UPDATE products SET stock = $1, updated_at = NOW() WHERE id = $2',
          [prod.stock, prod.id]
        );
      }
    } catch (err) {
      console.warn('Could not reset PostgreSQL stock:', err.message);
    }
  }

  return { success: true, count: localProducts.length };
}

module.exports = {
  getCategories,
  getProducts,
  getProductById,
  decrementStock,
  resetDemoData,
  getLocalProducts: () => localProducts
};
