const productService = require('../services/productService');

async function getCategories(req, res, next) {
  try {
    const categories = await productService.getCategories();
    res.json({ success: true, count: categories.length, categories });
  } catch (err) {
    next(err);
  }
}

async function getProducts(req, res, next) {
  try {
    const { category, minPrice, maxPrice, featured, trending, limit } = req.query;
    const products = await productService.getProducts({
      categoryId: category,
      minPrice,
      maxPrice,
      featured,
      trending,
      limit: limit ? parseInt(limit, 10) : 50
    });
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    next(err);
  }
}

async function getProductById(req, res, next) {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCategories,
  getProducts,
  getProductById
};
