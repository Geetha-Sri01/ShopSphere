const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { getClient, client: defaultClient, indexName } = require('../src/config/opensearch');
const { products } = require('../src/data/mockProducts');

async function syncOpenSearch() {
  console.log('=== ShopSphere OpenSearch Indexing & Sync Script ===');
  const client = getClient ? getClient() : defaultClient;

  if (!client) {
    console.error('❌ Error: OPENSEARCH_NODE is not configured or invalid in environment.');
    console.log('👉 Please set OPENSEARCH_NODE in backend/.env before running this script.');
    process.exit(1);
  }

  try {
    // 1. Check if index already exists
    const exists = await client.indices.exists({ index: indexName });
    const isIndexPresent = exists.body !== undefined ? exists.body : exists;

    if (isIndexPresent) {
      console.log(`ℹ️ Index "${indexName}" already exists. Recreating for clean mapping...`);
      await client.indices.delete({ index: indexName });
      console.log(`🗑️ Deleted existing index "${indexName}".`);
    }

    // 2. Create index with custom analyzer and field mappings
    console.log(`📐 Creating index "${indexName}" with typo-tolerance mapping...`);
    await client.indices.create({
      index: indexName,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 1,
          analysis: {
            analyzer: {
              autocomplete_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'edge_ngram_filter']
              }
            },
            filter: {
              edge_ngram_filter: {
                type: 'edge_ngram',
                min_gram: 2,
                max_gram: 15
              }
            }
          }
        },
        mappings: {
          properties: {
            id: { type: 'integer' },
            name: {
              type: 'text',
              analyzer: 'standard',
              fields: {
                edge_ngram: {
                  type: 'text',
                  analyzer: 'autocomplete_analyzer',
                  search_analyzer: 'standard'
                },
                raw: {
                  type: 'keyword'
                }
              }
            },
            slug: { type: 'keyword' },
            description: { type: 'text' },
            price: { type: 'float' },
            original_price: { type: 'float' },
            category_id: { type: 'integer' },
            category_name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
            stock: { type: 'integer' },
            rating: { type: 'float' },
            reviews_count: { type: 'integer' },
            image_url: { type: 'keyword' },
            featured: { type: 'boolean' },
            trending: { type: 'boolean' },
            updated_at: { type: 'date' }
          }
        }
      }
    });
    console.log(`✅ Index "${indexName}" created successfully.`);

    // 3. Prepare bulk index operations from PostgreSQL or fallback
    let productsToIndex = products;
    try {
      const { pool, query } = require('../src/config/db');
      if (pool) {
        const dbRes = await query(`
          SELECT p.*, c.name as category_name 
          FROM products p 
          LEFT JOIN categories c ON p.category_id = c.id
          ORDER BY p.id ASC
        `);
        if (dbRes.rows && dbRes.rows.length > 0) {
          productsToIndex = dbRes.rows;
          console.log(`📦 Loaded ${productsToIndex.length} live products directly from Aiven PostgreSQL.`);
        }
      }
    } catch (dbErr) {
      console.log('ℹ️ Using seed product catalogue for OpenSearch indexing.');
    }

    console.log(`🚀 Indexing ${productsToIndex.length} products into Aiven OpenSearch...`);
    const operations = productsToIndex.flatMap(doc => [
      { index: { _index: indexName, _id: String(doc.id) } },
      {
        ...doc,
        price: parseFloat(doc.price),
        original_price: parseFloat(doc.original_price),
        stock: parseInt(doc.stock, 10),
        rating: parseFloat(doc.rating),
        reviews_count: parseInt(doc.reviews_count, 10),
        updated_at: new Date().toISOString()
      }
    ]);

    const bulkResponse = await client.bulk({ refresh: true, body: operations });

    const bulkBody = bulkResponse.body || bulkResponse;
    if (bulkBody.errors) {
      console.error('⚠️ Some documents encountered indexing errors:');
      const erroredDocs = bulkBody.items.filter(item => item.index && item.index.error);
      console.error(erroredDocs);
    } else {
      console.log(`✅ Successfully indexed all ${productsToIndex.length} products into OpenSearch!`);
    }

    // 4. Verify search with typo tolerance test ("bluetoth")
    console.log('\n🔍 Verifying typo tolerance search for: "bluetoth"...');
    const testSearch = await client.search({
      index: indexName,
      body: {
        query: {
          multi_match: {
            query: 'bluetoth',
            fields: ['name^2', 'description'],
            fuzziness: 'AUTO'
          }
        }
      }
    });

    const hits = testSearch.body ? testSearch.body.hits : testSearch.hits;
    const total = typeof hits.total === 'object' ? hits.total.value : hits.total;
    console.log(`🎯 Test query matched ${total} results!`);
    if (hits.hits && hits.hits.length > 0) {
      console.log(`   Top match: "${hits.hits[0]._source.name}" (Score: ${hits.hits[0]._score})`);
    }

    console.log('\n🎉 OpenSearch sync complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ OpenSearch sync failed:', err);
    process.exit(1);
  }
}

syncOpenSearch();
