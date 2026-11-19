import React, { useState, useRef, useEffect } from 'react';
import { 
  ShoppingBag, 
  ShoppingCart, 
  Search, 
  Menu, 
  X, 
  Activity, 
  Sparkles, 
  ShieldCheck, 
  User, 
  LogOut, 
  ChevronDown, 
  CheckCircle2, 
  MapPin, 
  Shield 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenSearch, activeTab, setActiveTab, onNavigate }) {
  const { itemCount, setIsCartOpen } = useCart();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    logout();
    setUserDropdownOpen(false);
    setActiveTab('home');
    onNavigate?.('home');
  };

  const getFirstName = (fullName) => {
    if (!fullName) return 'User';
    return fullName.trim().split(' ')[0];
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Expansion Sale
            </span>
            <span>Grand Indian Retail Launch: Free Express Shipping on orders over ₹999!</span>
          </div>
          <div className="hidden sm:flex items-center space-x-4 text-[11px] text-indigo-100">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>100% Authentic Products</span>
            </span>
            <span>•</span>
            <span className="text-amber-200 font-semibold">Aiven Powered (PG + Kafka + OS)</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Brand Name */}
          <div 
            onClick={() => { setActiveTab('home'); onNavigate?.('home'); }} 
            className="flex items-center space-x-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform duration-200">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Shop<span className="text-indigo-600">Sphere</span>
                </span>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded ml-1">
                  INDIA
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                Physical Quality • Digital Speed
              </p>
            </div>
          </div>

          {/* Quick Search Trigger Bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-6 lg:mx-8">
            <button
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 hover:border-indigo-300 rounded-full text-slate-500 text-sm transition-all duration-150 shadow-inner group"
            >
              <div className="flex items-center space-x-2.5">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                <span className="text-slate-500 group-hover:text-slate-700">
                  Search 16+ products (e.g. <span className="text-indigo-600 font-medium">"bluetoth"</span> typo test)...
                </span>
              </div>
              <span className="text-[11px] font-semibold bg-white text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full shadow-xs">
                OpenSearch
              </span>
            </button>
          </div>

          {/* Right Navigation & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Admin & Telemetry Dashboard Button */}
            <button
              onClick={() => { setActiveTab('admin'); onNavigate?.('admin'); }}
              className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-300'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 animate-pulse text-indigo-500" />
              <span>Admin & Telemetry</span>
            </button>

            {/* Mobile Search Button */}
            <button
              onClick={onOpenSearch}
              className="md:hidden p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Authentication / User Profile Button & Dropdown */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    userDropdownOpen
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-[11px] font-bold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden sm:inline max-w-[85px] truncate">
                    {getFirstName(user?.name)}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {user?.name}
                        </p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isAdmin 
                            ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {isAdmin ? 'Admin' : 'Customer'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {user?.email}
                      </p>
                      {user?.city && (
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{user.city}, {user.state}</span>
                        </p>
                      )}
                    </div>

                    <div className="py-1">
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setActiveTab('admin');
                            onNavigate?.('admin');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center space-x-2"
                        >
                          <Shield className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Admin & Telemetry Dashboard</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setActiveTab('home');
                          onNavigate?.('home');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center space-x-2"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                        <span>Explore Catalogue</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-600" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => { setActiveTab('login'); onNavigate?.('login'); }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'login'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 border border-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center space-x-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm group"
            >
              <ShoppingCart className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 space-y-2">
            <button
              onClick={() => { setActiveTab('home'); onNavigate?.('home'); setMobileMenuOpen(false); }}
              className="block w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 rounded-md"
            >
              Home & Storefront
            </button>
            <button
              onClick={() => { setActiveTab('admin'); onNavigate?.('admin'); setMobileMenuOpen(false); }}
              className="block w-full text-left px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-md"
            >
              Admin & Aiven Telemetry Dashboard
            </button>
            {isAuthenticated ? (
              <div className="pt-2 border-t border-slate-100 px-3">
                <div className="text-xs text-slate-500 mb-2">
                  Signed in as <span className="font-bold text-slate-800">{user?.name}</span> ({user?.email})
                </div>
                <button
                  onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                  className="w-full text-left py-1.5 text-xs font-semibold text-rose-600 flex items-center space-x-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setActiveTab('login'); onNavigate?.('login'); setMobileMenuOpen(false); }}
                className="block w-full text-left px-3 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-md"
              >
                Sign In / Register
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
