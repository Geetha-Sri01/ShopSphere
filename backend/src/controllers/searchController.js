const { searchProducts } = require('../services/searchService');

async function search(req, res, next) {
  try {
    const { q, category, minPrice, maxPrice, limit } = req.query;

    const result = await searchProducts({
      q: q || '',
      categoryId: category,
      minPrice,
      maxPrice,
      limit: limit ? parseInt(limit, 10) : 20
    });

    res.json({
      success: true,
      query: q || '',
      engine: result.source,
      total: result.total,
      tookMs: result.took || 0,
      results: result.results,
      message: result.results.length === 0 ? 'No products matched your search. Try checking for typos or relaxing filters.' : null
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  search
};
