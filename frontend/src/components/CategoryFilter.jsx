import React from 'react';
import { LayoutGrid, Smartphone, Shirt, UtensilsCrossed, Watch, Sparkles } from 'lucide-react';

const iconMap = {
  1: Smartphone,
  2: Shirt,
  3: UtensilsCrossed,
  4: Watch,
  5: Sparkles
};

export default function CategoryFilter({ categories = [], selectedCategoryId, onSelectCategory }) {
  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Explore Categories</h2>
          <p className="text-xs text-slate-500">Handcrafted selections across India's top retail verticals</p>
        </div>
      </div>

      <div className="flex items-center space-x-2.5 overflow-x-auto pb-2 scrollbar-none">
        {/* All Categories Button */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedCategoryId === null
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>All Products</span>
        </button>

        {/* Category Pills */}
        {categories.map((cat) => {
          const IconComponent = iconMap[cat.id] || LayoutGrid;
          const isSelected = selectedCategoryId === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <IconComponent className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-indigo-600'}`} />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
