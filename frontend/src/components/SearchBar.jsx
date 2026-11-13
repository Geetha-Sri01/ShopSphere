import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Zap, ArrowRight, CornerDownLeft } from 'lucide-react';
import { searchProducts } from '../api/api';
import { useCart } from '../context/CartContext';

export default function SearchBar({ isOpen, onClose, onSelectProduct }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [engine, setEngine] = useState(null);
  const [total, setTotal] = useState(0);
  const inputRef = useRef(null);
  const { addToCart } = useCart();

  // Preset queries for hackathon judges to immediately test OpenSearch typo tolerance
  const sampleTypoQueries = [
    { label: 'bluetoth (typo)', value: 'bluetoth' },
    { label: 'sartwatch (typo)', value: 'sartwatch' },
    { label: 'anarkli (typo)', value: 'anarkli' },
    { label: 'earfone (typo)', value: 'earfone' },
    { label: 'cooker (Home)', value: 'cooker' },
    { label: 'serum (Beauty)', value: 'serum' }
  ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setTotal(0);
      setEngine(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchProducts(query);
        setResults(data.results || []);
        setEngine(data.engine);
        setTotal(data.total || 0);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 transition-all">
        
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 border-b border-slate-200">
          <Search className="w-5 h-5 text-indigo-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a product name, category, or try typos like 'bluetoth'..."
            className="w-full px-3 py-4 text-slate-800 placeholder-slate-400 text-base focus:outline-hidden"
          />
          {loading && <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />}
          {query && !loading && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg ml-2"
          >
            ESC
          </button>
        </div>

        {/* Typo Quick Test Bar */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center space-x-2 overflow-x-auto text-xs">
          <span className="text-slate-500 font-semibold shrink-0 flex items-center space-x-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Try Typo Tests:</span>
          </span>
          {sampleTypoQueries.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => setQuery(sample.value)}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 text-slate-700 text-xs font-medium transition-colors whitespace-nowrap shadow-2xs"
            >
              {sample.label}
            </button>
          ))}
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
          {engine && (
            <div className="flex items-center justify-between text-xs text-slate-500 px-1 pb-1">
              <span>
                Found <strong>{total}</strong> {total === 1 ? 'match' : 'matches'} for "{query}"
              </span>
              <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                engine === 'opensearch' 
                  ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                  : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
              }`}>
                {engine === 'opensearch' ? '⚡ Aiven OpenSearch (Typo-Tolerant)' : 'Simulated Fuzzy Match'}
              </span>
            </div>
          )}

          {results.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {results.map((product) => (
                <div
                  key={product.id}
                  className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors group cursor-pointer"
                  onClick={() => {
                    onSelectProduct(product);
                    onClose();
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                          {product.category_name}
                        </span>
                        {product.stock <= 5 && product.stock > 0 && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded">
                            Only {product.stock} left
                          </span>
                        )}
                        {product.stock === 0 && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                            Out of stock
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {product.name}
                      </h4>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">
                        ₹{Number(product.price).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      disabled={product.stock <= 0}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
                    >
                      Add to Cart
                    </button>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          ) : query && !loading ? (
            <div className="text-center py-10 space-y-2">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No products found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                We couldn't find any products matching "{query}". Try checking for spelling or searching a general category like Electronics or Fashion.
              </p>
            </div>
          ) : !query ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Start typing to search products with OpenSearch fuzzy match...
            </div>
          ) : null}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 flex items-center justify-between">
          <span>Search queries indexed via <strong>Aiven OpenSearch</strong></span>
          <span className="flex items-center space-x-1">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">ESC</kbd>
            <span>to close</span>
          </span>
        </div>

      </div>
    </div>
  );
}
