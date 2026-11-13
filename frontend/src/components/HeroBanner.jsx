import React from 'react';
import { ArrowRight, Zap, Shield, RotateCcw, Truck } from 'lucide-react';

export default function HeroBanner({ onShopNow, onOpenSearch }) {
  return (
    <div className="relative overflow-hidden bg-white border-b border-slate-200">
      {/* Decorative gradient blur background */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-200/50 to-purple-200/50 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 rounded-full bg-gradient-to-tr from-pink-100/40 to-indigo-100/40 blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-200/80 rounded-full px-3 py-1 shadow-2xs">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
              <span className="text-xs font-bold text-indigo-800 tracking-wide uppercase">
                Physical Retail Brand • Now Nationwide Online
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
              India's Trusted Store, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800">
                Now at Your Fingertips.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl font-normal leading-relaxed">
              Experience authentic Indian retail craftsmanship across Electronics, Fashion, Home Cookware, and Ayurvedic Wellness. Powered by an enterprise cloud backbone with <strong>Aiven PostgreSQL, Apache Kafka, and OpenSearch</strong>.
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onShopNow}
                className="flex items-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 hover:shadow-lg transition-all duration-200 active:scale-95"
              >
                <span>Browse Products</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenSearch}
                className="flex items-center space-x-2 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl border border-slate-200 transition-all active:scale-95"
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Test OpenSearch Typo Engine</span>
              </button>
            </div>

            {/* Feature Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-semibold text-slate-700">Free Over ₹999</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-700">100% Genuine</span>
              </div>
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold text-slate-700">7-Day Return</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-semibold text-slate-700">Kafka Streaming</span>
              </div>
            </div>
          </div>

          {/* Right Hero Image Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 group">
              <img
                src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1000&q=80"
                alt="Online Shopping Experience"
                className="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              
              {/* Floating Highlight Card */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-white/95 backdrop-blur-md shadow-lg border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">Festival Special</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded">Save 40%</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Electronics & Traditional Wear</h4>
                  <p className="text-[11px] text-slate-500">Instant checkout with real-time stock reservations</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 line-through">₹4,999</div>
                  <div className="text-base font-extrabold text-indigo-700">₹2,999</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
