import React, { useState } from 'react';
import { X, Star, ShoppingCart, CheckCircle2, AlertTriangle, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductModal({ product, onClose }) {
  const [qty, setQty] = useState(1);
  const { addToCart, cartItems } = useCart();

  if (!product) return null;

  const cartItem = cartItems.find(i => i.id === product.id);
  const alreadyInCart = cartItem ? cartItem.quantity : 0;
  const remainingAvailable = Math.max(0, product.stock - alreadyInCart);
  const isOutOfStock = product.stock <= 0;

  const handleAdd = () => {
    if (addToCart(product, qty)) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 grid grid-cols-1 md:grid-cols-2">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-slate-700 bg-white/80 backdrop-blur-md rounded-full shadow-xs border border-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Column */}
        <div className="bg-slate-100 p-6 flex items-center justify-center relative">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full max-h-80 md:max-h-full object-cover rounded-2xl shadow-md"
          />
          <span className="absolute top-6 left-6 bg-white/90 backdrop-blur-xs text-indigo-700 text-xs font-bold px-3 py-1 rounded-full shadow-xs border border-indigo-100">
            {product.category_name}
          </span>
        </div>

        {/* Product Info Column */}
        <div className="p-6 md:p-8 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Rating */}
            <div className="flex items-center space-x-2 text-xs">
              <div className="flex items-center text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-current mr-1" />
                <span>{product.rating || 4.5}</span>
              </div>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">{product.reviews_count || 120} customer ratings</span>
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {product.name}
            </h2>

            {/* Price Box */}
            <div className="flex items-baseline space-x-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/60">
              <span className="text-2xl sm:text-3xl font-black text-indigo-900">
                ₹{Number(product.price).toLocaleString('en-IN')}
              </span>
              {product.original_price && (
                <span className="text-sm text-slate-400 line-through">
                  ₹{Number(product.original_price).toLocaleString('en-IN')}
                </span>
              )}
              {product.original_price && (
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Save ₹{(product.original_price - product.price).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {product.description}
            </p>

            {/* Stock status indicator */}
            <div className="pt-2">
              {isOutOfStock ? (
                <div className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  Currently Out of Stock. Fresh inventory arrives shortly!
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="flex items-center space-x-1.5 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>In Stock ({product.stock} units available)</span>
                  </span>
                  {alreadyInCart > 0 && (
                    <span className="text-indigo-600 font-bold">
                      ({alreadyInCart} in your cart)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Row */}
          {!isOutOfStock && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center space-x-3">
                {/* Quantity Controls */}
                <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    disabled={qty <= 1}
                    className="px-3 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 font-bold text-sm text-slate-800">{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(remainingAvailable, qty + 1))}
                    disabled={qty >= remainingAvailable}
                    className="px-3 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAdd}
                  disabled={remainingAvailable <= 0}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md shadow-indigo-200 transition-all active:scale-98"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{remainingAvailable <= 0 ? 'Max in Cart' : `Add to Cart (₹${(product.price * qty).toLocaleString('en-IN')})`}</span>
                </button>
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-slate-500 text-center">
                <div className="flex flex-col items-center">
                  <Truck className="w-3.5 h-3.5 text-indigo-600 mb-0.5" />
                  <span>Free Over ₹999</span>
                </div>
                <div className="flex flex-col items-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mb-0.5" />
                  <span>Original Brand</span>
                </div>
                <div className="flex flex-col items-center">
                  <RotateCcw className="w-3.5 h-3.5 text-purple-600 mb-0.5" />
                  <span>7-Day Return</span>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
