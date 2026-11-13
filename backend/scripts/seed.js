const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const { pool, query } = require('../src/config/db');
const { categories, products } = require('../src/data/mockProducts');

async function runSeed() {
  console.log('=== ShopSphere Database Initialization & Seeder ===');

  if (!pool) {
    console.error('❌ Error: DATABASE_URL is not configured or invalid in environment.');
    console.log('👉 Please set DATABASE_URL in backend/.env before running this script.');
    process.exit(1);
  }

  try {
    // 1. Run schema migration
    console.log('📦 Applying PostgreSQL schema (init-db.sql)...');
    const sqlPath = path.join(__dirname, 'init-db.sql');
    const schemaSql = fs.readFileSync(sqlPath, 'utf-8');
    await query(schemaSql);
    console.log('✅ Tables created: categories, products, customers, orders, order_items, outbox_events.');

    // 2. Seed Categories
    console.log('📂 Seeding product categories...');
    for (const cat of categories) {
      await query(
        `INSERT INTO categories (id, name, slug, description, icon)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (slug) DO UPDATE
         SET name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon`,
        [cat.id, cat.name, cat.slug, cat.description, cat.icon]
      );
    }
    console.log(`✅ Seeded ${categories.length} categories.`);

    // 3. Seed Products
    console.log('🛍️ Seeding products catalogue with Indian Rupee prices and stock...');
    for (const prod of products) {
      await query(
        `INSERT INTO products 
         (id, name, slug, description, price, original_price, category_id, category_name, stock, rating, reviews_count, image_url, featured, trending)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (slug) DO UPDATE
         SET name = EXCLUDED.name,
             description = EXCLUDED.description,
             price = EXCLUDED.price,
             original_price = EXCLUDED.original_price,
             category_id = EXCLUDED.category_id,
             category_name = EXCLUDED.category_name,
             stock = EXCLUDED.stock,
             rating = EXCLUDED.rating,
             reviews_count = EXCLUDED.reviews_count,
             image_url = EXCLUDED.image_url,
             featured = EXCLUDED.featured,
             trending = EXCLUDED.trending,
             updated_at = NOW()`,
        [
          prod.id,
          prod.name,
          prod.slug,
          prod.description,
          prod.price,
          prod.original_price,
          prod.category_id,
          prod.category_name,
          prod.stock,
          prod.rating,
          prod.reviews_count,
          prod.image_url,
          prod.featured,
          prod.trending
        ]
      );
    }
    console.log(`✅ Seeded ${products.length} products successfully.`);

    // Reset sequence for products id
    await query(`SELECT setval(pg_get_serial_sequence('products', 'id'), coalesce(max(id),0) + 1, false) FROM products;`);
    await query(`SELECT setval(pg_get_serial_sequence('categories', 'id'), coalesce(max(id),0) + 1, false) FROM categories;`);

    console.log('🎉 Database seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed with error:', err);
    process.exit(1);
  }
}

runSeed();
