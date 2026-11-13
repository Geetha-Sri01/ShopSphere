import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Loader2, Sparkles, TrendingUp, Check, RefreshCw } from 'lucide-react';
import HeroBanner from '../components/HeroBanner';
import CategoryFilter from '../components/CategoryFilter';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import SpecialOffers from '../components/SpecialOffers';
import { fetchCategories, fetchProducts } from '../api/api';

export default function HomePage({ onOpenSearch }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [priceFilter, setPriceFilter] = useState('all'); // all, under1000, 1000-3000, above3000
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Load categories and initial products
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        const [cats, prods] = await Promise.all([
          fetchCategories(),
          fetchProducts()
        ]);
        setCategories(cats);
        setProducts(prods);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Filter products when category or price changes
  const filteredProducts = products.filter(prod => {
    if (selectedCategory && prod.category_id !== selectedCategory) {
      return false;
    }
    if (priceFilter === 'under1000' && prod.price >= 1000) return false;
    if (priceFilter === '1000-3000' && (prod.price < 1000 || prod.price > 3000)) return false;
    if (priceFilter === 'above3000' && prod.price <= 3000) return false;
    return true;
  });

  const featuredProducts = products.filter(p => p.featured);
  const trendingProducts = products.filter(p => p.trending);

  const scrollToCatalogue = () => {
    const el = document.getElementById('catalogue-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Section */}
      <HeroBanner onShopNow={scrollToCatalogue} onOpenSearch={onOpenSearch} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Category Filter Horizontal Carousel */}
        <CategoryFilter
          categories={categories}
          selectedCategoryId={selectedCategory}
          onSelectCategory={(id) => {
            setSelectedCategory(id);
            scrollToCatalogue();
          }}
        />

        {/* Special Festive Offers Section */}
        <SpecialOffers
          onSelectCategory={(catId) => {
            setSelectedCategory(catId);
            scrollToCatalogue();
          }}
        />

        {/* Main Catalogue Header and Price Filters */}
        <div id="catalogue-section" className="pt-4 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Product Catalogue
                </h2>
                <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
                  {filteredProducts.length} items
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Prices in Indian Rupees (₹) • ACID row-locking inventory management
              </p>
            </div>

            {/* Price Filter Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
              <span className="flex items-center space-x-1 text-slate-500 font-semibold shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Price:</span>
              </span>
              {[
                { id: 'all', label: 'All Prices' },
                { id: 'under1000', label: 'Under ₹1,000' },
                { id: '1000-3000', label: '₹1,000 - ₹3,000' },
                { id: 'above3000', label: 'Above ₹3,000' }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setPriceFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
                    priceFilter === filter.id
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Fetching products from database...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
              <h3 className="text-base font-bold text-slate-800">No products match your active filters</h3>
              <p className="text-xs text-slate-500">
                Try selecting "All Products" or resetting your price filter.
              </p>
              <button
                onClick={() => { setSelectedCategory(null); setPriceFilter('all'); }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={(p) => setSelectedProduct(p)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Featured Section */}
        {featuredProducts.length > 0 && (
          <div className="pt-10 border-t border-slate-200">
            <div className="flex items-center space-x-2 mb-6">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Featured Highlights</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 4).map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={(p) => setSelectedProduct(p)}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Quick View Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
