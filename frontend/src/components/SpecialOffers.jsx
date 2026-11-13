import React from 'react';
import { Tag, Sparkles, ArrowRight, Percent } from 'lucide-react';

export default function SpecialOffers({ onSelectCategory }) {
  return (
    <section className="py-8">
      <div className="flex items-center space-x-2 mb-6">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Special Offers & Collections</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Offer 1: Audio & Tech */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 sm:p-8 flex flex-col justify-between shadow-xl">
          <div className="relative z-10 space-y-3 max-w-sm">
            <span className="inline-flex items-center space-x-1.5 bg-white/20 backdrop-blur-md text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5" />
              <span>Limited Deal</span>
            </span>
            <h3 className="text-2xl sm:text-3xl font-black leading-tight">
              Acoustic Bliss & Smart Wearables
            </h3>
            <p className="text-xs sm:text-sm text-indigo-200">
              Noise cancellation, 60Hz displays, and high-fidelity bass. Get up to 40% OFF top audio brands.
            </p>
          </div>

          <div className="relative z-10 pt-6">
            <button
              onClick={() => onSelectCategory(1)} // Electronics
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-white text-indigo-900 font-bold text-xs rounded-xl hover:bg-indigo-50 shadow-md transition-all active:scale-95"
            >
              <span>Explore Electronics</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-30 pointer-events-none flex items-center justify-center">
            <Percent className="w-48 h-48 stroke-1 text-white/40 transform translate-x-10 translate-y-10" />
          </div>
        </div>

        {/* Offer 2: Festive Ethnic Wear */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 flex flex-col justify-between shadow-xl">
          <div className="relative z-10 space-y-3 max-w-sm">
            <span className="inline-flex items-center space-x-1.5 bg-amber-400 text-slate-950 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Festive Edit</span>
            </span>
            <h3 className="text-2xl sm:text-3xl font-black leading-tight">
              Royal Handcrafted Ethnic Wear
            </h3>
            <p className="text-xs sm:text-sm text-purple-200">
              Pure cotton block prints and embroidered Anarkali sets curated from master weavers across India.
            </p>
          </div>

          <div className="relative z-10 pt-6">
            <button
              onClick={() => onSelectCategory(2)} // Fashion
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:from-amber-300 hover:to-amber-400 shadow-md transition-all active:scale-95"
            >
              <span>Explore Fashion</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-20 pointer-events-none flex items-center justify-center">
            <Sparkles className="w-48 h-48 stroke-1 text-amber-300 transform translate-x-10 translate-y-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
