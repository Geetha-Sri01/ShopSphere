import React from 'react';
import { ShoppingBag, ShieldCheck, Heart, Server, Database, Radio } from 'lucide-react';

export default function Footer({ onSelectCategory, onNavigateToAdmin }) {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-slate-800">
          
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Shop<span className="text-indigo-400">Sphere</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              From flagship retail storefronts in Mumbai and Bengaluru directly to your digital cart. Shop genuine Indian lifestyle products with enterprise-grade reliability and lightning-fast dispatch.
            </p>
            <div className="flex items-center space-x-2 text-xs text-indigo-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold">Authorised Retail Partner Across India</span>
            </div>
          </div>

          {/* Categories links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Categories</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button onClick={() => onSelectCategory(1)} className="hover:text-indigo-400 transition-colors">
                  Consumer Electronics
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory(2)} className="hover:text-indigo-400 transition-colors">
                  Ethnic & Casual Fashion
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory(3)} className="hover:text-indigo-400 transition-colors">
                  Home Cookware & Kitchen
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory(4)} className="hover:text-indigo-400 transition-colors">
                  Leather & Accessories
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory(5)} className="hover:text-indigo-400 transition-colors">
                  Ayurvedic & Natural Beauty
                </button>
              </li>
            </ul>
          </div>

          {/* Physical Store Hubs */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Retail Hubs</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>Mumbai • Phoenix Palladium</li>
              <li>Bengaluru • Indiranagar 100ft Rd</li>
              <li>New Delhi • Connaught Place</li>
              <li>Hyderabad • Jubilee Hills</li>
              <li>Pune • Koregaon Park</li>
            </ul>
          </div>

          {/* Hackathon Architecture Column */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Hackathon Architecture</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center space-x-2">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>Aiven PostgreSQL</span>
              </li>
              <li className="flex items-center space-x-2">
                <Radio className="w-3.5 h-3.5 text-purple-400" />
                <span>Aiven Apache Kafka</span>
              </li>
              <li className="flex items-center space-x-2">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                <span>Aiven OpenSearch</span>
              </li>
              <li className="pt-2">
                <button
                  onClick={onNavigateToAdmin}
                  className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-bold transition-all"
                >
                  View Live Telemetry
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Credits */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-4 sm:space-y-0">
          <p>© {new Date().getFullYear()} ShopSphere India Retail Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center space-x-2">
            <span>Built for the Hackathon with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-current inline" />
            <span>using Aiven Cloud Services</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
