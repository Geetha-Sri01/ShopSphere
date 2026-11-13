import React from 'react';
import { Star, ShoppingCart, Eye, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product, onQuickView }) {
  const { addToCart, cartItems } = useCart();

  const cartItem = cartItems.find(i => i.id === product.id);
  const cartQty = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.stock <= 0;
  const isMaxInCart = cartQty >= product.stock;

  const discountPercent = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative">
      
      {/* Badges Overlay */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <span className="bg-white/90 backdrop-blur-xs text-indigo-700 text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-xs border border-indigo-100">
          {product.category_name}
        </span>
        {discountPercent > 0 && (
          <span className="bg-rose-600 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-xs">
            {discountPercent}% OFF
          </span>
        )}
      </div>

      {/* Image container with zoom & Quick View overlay */}
      <div 
        onClick={() => onQuickView(product)}
        className="relative w-full h-52 sm:h-56 bg-slate-100 overflow-hidden cursor-pointer"
      >
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Hover Quick View Trigger */}
        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="px-3 py-1.5 bg-white text-slate-800 text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            <span>Quick View</span>
          </span>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Rating & Stock Status */}
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center space-x-1 text-amber-500 font-bold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{product.rating || 4.5}</span>
              <span className="text-slate-400 font-normal">({product.reviews_count || 120})</span>
            </div>

            {/* Stock status indicator */}
            {isOutOfStock ? (
              <span className="flex items-center space-x-1 text-rose-600 font-bold text-[11px]">
                <XCircle className="w-3.5 h-3.5" />
                <span>Out of Stock</span>
              </span>
            ) : product.stock <= 5 ? (
              <span className="flex items-center space-x-1 text-amber-600 font-bold text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Only {product.stock} left</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-emerald-600 font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>In Stock ({product.stock})</span>
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3 
            onClick={() => onQuickView(product)}
            className="text-sm sm:text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-2 cursor-pointer leading-snug"
          >
            {product.name}
          </h3>

          {/* Brief snippet */}
          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
            {product.description}
          </p>
        </div>

        {/* Pricing and Action */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-lg sm:text-xl font-black text-slate-900">
              ₹{Number(product.price).toLocaleString('en-IN')}
            </div>
            {product.original_price && (
              <div className="text-xs text-slate-400 line-through">
                ₹{Number(product.original_price).toLocaleString('en-IN')}
              </div>
            )}
          </div>

          {/* Add to Cart button */}
          <button
            onClick={() => addToCart(product, 1)}
            disabled={isOutOfStock || isMaxInCart}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : isMaxInCart
                ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-sm shadow-indigo-200 hover:shadow-md'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{isOutOfStock ? 'Sold Out' : isMaxInCart ? 'Max in Cart' : 'Add to Cart'}</span>
          </button>
        </div>

      </div>

    </div>
  );
}
