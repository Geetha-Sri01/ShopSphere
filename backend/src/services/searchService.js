const { getClient, indexName } = require('../config/opensearch');
const { getLocalProducts } = require('./productService');

/**
 * Perform Typo-Tolerant, Fuzzy Search using Aiven OpenSearch
 * Supports partial matching, category filtering, and price range filtering.
 */
async function searchProducts({ q = '', categoryId, minPrice, maxPrice, limit = 20 }) {
  const cleanQuery = q.trim();
  const osClient = getClient();

  if (osClient) {
    try {
      // Build OpenSearch query DSL
      const mustClauses = [];
      const filterClauses = [];

      if (cleanQuery) {
        mustClauses.push({
          bool: {
            should: [
              // 1. Exact or prefix match with highest boost
              {
                multi_match: {
                  query: cleanQuery,
                  fields: ['name^3', 'category_name^2', 'description'],
                  type: 'phrase_prefix',
                  boost: 3
                }
              },
              // 2. Typo-tolerant fuzzy match (e.g., 'bluetoth' -> 'Bluetooth')
              {
                multi_match: {
                  query: cleanQuery,
                  fields: ['name^2', 'description'],
                  fuzziness: 'AUTO',
                  prefix_length: 2,
                  max_expansions: 50,
                  boost: 1.5
                }
              },
              // 3. Wildcard for substring matching
              {
                wildcard: {
                  name: {
                    value: `*${cleanQuery.toLowerCase()}*`,
                    boost: 1.0
                  }
                }
              }
            ],
            minimum_should_match: 1
          }
        });
      } else {
        mustClauses.push({ match_all: {} });
      }

      // Category filter
      if (categoryId) {
        filterClauses.push({
          term: { category_id: parseInt(categoryId, 10) }
        });
      }

      // Price range filter
      if ((minPrice !== undefined && minPrice !== null) || (maxPrice !== undefined && maxPrice !== null)) {
        const priceRange = {};
        if (minPrice !== undefined && minPrice !== null && !isNaN(minPrice)) {
          priceRange.gte = parseFloat(minPrice);
        }
        if (maxPrice !== undefined && maxPrice !== null && !isNaN(maxPrice)) {
          priceRange.lte = parseFloat(maxPrice);
        }
        filterClauses.push({
          range: { price: priceRange }
        });
      }

      const searchBody = {
        size: limit,
        query: {
          bool: {
            must: mustClauses,
            filter: filterClauses
          }
        },
        highlight: {
          pre_tags: ['<mark class="bg-indigo-100 text-indigo-800 font-semibold px-0.5 rounded">'],
          post_tags: ['</mark>'],
          fields: {
            name: {},
            description: {}
          }
        }
      };

      const searchResponse = await osClient.search({
        index: indexName,
        body: searchBody
      });

      const hits = searchResponse.body ? searchResponse.body.hits : searchResponse.hits;
      const totalHits = typeof hits.total === 'object' ? hits.total.value : hits.total;

      const results = hits.hits.map(hit => ({
        ...hit._source,
        _score: hit._score,
        highlight: hit.highlight || null
      }));

      return {
        source: 'opensearch',
        total: totalHits,
        took: searchResponse.body ? searchResponse.body.took : searchResponse.took,
        results
      };
    } catch (err) {
      console.error('[OPENSEARCH] Live search query failed:', err.message);
      // Strictly do not mask live OpenSearch failures with simulated results
      throw new Error(`Aiven OpenSearch search failed: ${err.message}`);
    }
  }

  // Fallback fuzzy search simulation (Levenshtein distance + substring) ONLY when OPENSEARCH_NODE is not configured in .env
  const allProds = getLocalProducts();
  const lowerQ = cleanQuery.toLowerCase();

  function simpleLevenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  const results = allProds.filter(prod => {
    if (categoryId && prod.category_id !== parseInt(categoryId, 10)) return false;
    if (minPrice && prod.price < parseFloat(minPrice)) return false;
    if (maxPrice && prod.price > parseFloat(maxPrice)) return false;
    if (!lowerQ) return true;

    const nameLower = prod.name.toLowerCase();
    const descLower = prod.description.toLowerCase();

    // Check direct substring
    if (nameLower.includes(lowerQ) || descLower.includes(lowerQ)) return true;

    // Check token fuzzy distance (handles 'bluetoth' -> 'bluetooth', 'sartwatch' -> 'smartwatch')
    const words = `${nameLower} ${descLower}`.split(/\s+/);
    return words.some(w => {
      if (Math.abs(w.length - lowerQ.length) <= 2) {
        return simpleLevenshtein(w, lowerQ) <= 2;
      }
      return false;
    });
  }).slice(0, limit);

  return {
    source: 'local_fuzzy_simulation',
    total: results.length,
    results
  };
}

/**
 * Update product stock inside OpenSearch index
 * Called by Kafka consumer upon receiving order_placed event!
 */
async function updateProductStockInIndex(productId, newStock) {
  const osClient = getClient();
  if (!osClient) {
    return false;
  }
  try {
    await osClient.update({
      index: indexName,
      id: String(productId),
      body: {
        doc: {
          stock: newStock,
          updated_at: new Date().toISOString()
        }
      },
      retry_on_conflict: 3
    });
    console.log(`[OPENSEARCH] Updated product ${productId} stock to ${newStock}`);
    return true;
  } catch (err) {
    console.error(`[OPENSEARCH] Failed to update stock for product ${productId}:`, err.message);
    return false;
  }
}

module.exports = {
  searchProducts,
  updateProductStockInIndex
};
