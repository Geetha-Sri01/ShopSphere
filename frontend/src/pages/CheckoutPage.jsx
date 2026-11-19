import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, Lock, Loader2, AlertCircle, CheckCircle2, User, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { placeOrder } from '../api/api';

export default function CheckoutPage({ onBackToStore, onOrderSuccess, onNavigateToLogin }) {
  const { cartItems, subtotal, tax, shipping, total, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    customerName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || 'Bengaluru',
    state: user?.state || 'Karnataka',
    pincode: user?.pincode || '560038'
  });

  // Pre-fill form details if user logs in or user details are available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: prev.customerName || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
        address: prev.address || user.address || '',
        city: prev.city || user.city || 'Bengaluru',
        state: prev.state || user.state || 'Karnataka',
        pincode: prev.pincode || user.pincode || '560038'
      }));
    }
  }, [user]);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const validate = () => {
    const errs = {};
    if (!formData.customerName.trim()) {
      errs.customerName = 'Please enter your full name';
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim() || formData.phone.replace(/\D/g, '').length < 10) {
      errs.phone = 'Please enter a valid 10-digit mobile number';
    }
    if (!formData.address.trim()) {
      errs.address = 'Street address is required';
    }
    if (!formData.city.trim()) {
      errs.city = 'City is required';
    }
    if (!formData.state.trim()) {
      errs.state = 'State is required';
    }
    if (!formData.pincode.trim() || formData.pincode.replace(/\D/g, '').length !== 6) {
      errs.pincode = 'Valid 6-digit PIN code required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) return;

    if (cartItems.length === 0) {
      setErrorMessage('Your cart is empty. Please add items before checking out.');
      return;
    }

    setLoading(true);

    try {
      const orderPayload = {
        ...formData,
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity
        }))
      };

      const response = await placeOrder(orderPayload);
      clearCart();
      onOrderSuccess(response.order);
    } catch (err) {
      console.error('Order error:', err);
      setErrorMessage(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Indian States quick list
  const indianStates = [
    'Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Telangana',
    'Gujarat', 'Uttar Pradesh', 'West Bengal', 'Rajasthan', 'Kerala',
    'Punjab', 'Haryana', 'Madhya Pradesh', 'Bihar', 'Andhra Pradesh', 'Other'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Back button */}
      <button
        onClick={onBackToStore}
        className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Shop</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Delivery Details Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Delivery Information
                </h2>
                <div className="flex items-center space-x-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <Lock className="w-3.5 h-3.5" />
                  <span>256-bit Secure</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Enter your shipping address across India for express courier dispatch.
              </p>
            </div>

            {/* Error Alert Banner */}
            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-rose-800 text-xs sm:text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <div className="font-bold">Order Placement Blocked</div>
                  <div>{errorMessage}</div>
                </div>
              </div>
            )}

            {/* Auth status & Express Checkout Banner */}
            {isAuthenticated ? (
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center space-x-1">
                      <span>Express Checkout: {user?.name}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    </div>
                    <div className="text-[11px] text-slate-500">{user?.email} • Saved details applied</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-700 bg-white border border-indigo-200 px-2.5 py-1 rounded-full shrink-0">
                  Auto-filled
                </span>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <User className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs text-slate-600">
                    Already have an account? <span className="font-semibold text-slate-800">Sign in</span> to load your saved delivery address.
                  </span>
                </div>
                {onNavigateToLogin && (
                  <button
                    type="button"
                    onClick={onNavigateToLogin}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-slate-200 hover:border-indigo-300 px-3 py-1 rounded-xl shadow-2xs transition-all shrink-0 ml-2"
                  >
                    Sign In
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="e.g. Aarav Sharma"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-hidden transition-all ${
                    errors.customerName
                      ? 'border-rose-400 bg-rose-50/30'
                      : 'border-slate-300 focus:border-indigo-600'
                  }`}
                />
                {errors.customerName && (
                  <p className="text-xs text-rose-600 font-medium mt-1">{errors.customerName}</p>
                )}
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="aarav@example.in"
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-hidden transition-all ${
                      errors.email
                        ? 'border-rose-400 bg-rose-50/30'
                        : 'border-slate-300 focus:border-indigo-600'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-600 font-medium mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone Number (10 Digits) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-xs font-bold text-slate-500">
                      +91
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      maxLength={10}
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="98765 43210"
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border text-sm focus:outline-hidden transition-all ${
                        errors.phone
                          ? 'border-rose-400 bg-rose-50/30'
                          : 'border-slate-300 focus:border-indigo-600'
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-rose-600 font-medium mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Delivery Address (Flat / House / Street) *
                </label>
                <textarea
                  rows={2}
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="e.g. Flat 402, Shanti Heights, 12th Main Road, Indiranagar"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-hidden transition-all ${
                    errors.address
                      ? 'border-rose-400 bg-rose-50/30'
                      : 'border-slate-300 focus:border-indigo-600'
                  }`}
                />
                {errors.address && (
                  <p className="text-xs text-rose-600 font-medium mt-1">{errors.address}</p>
                )}
              </div>

              {/* City, State, PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Bengaluru"
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-hidden transition-all ${
                      errors.city
                        ? 'border-rose-400 bg-rose-50/30'
                        : 'border-slate-300 focus:border-indigo-600'
                    }`}
                  />
                  {errors.city && (
                    <p className="text-xs text-rose-600 font-medium mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    State *
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-3 rounded-xl border text-sm focus:outline-hidden transition-all bg-white ${
                      errors.state
                        ? 'border-rose-400 bg-rose-50/30'
                        : 'border-slate-300 focus:border-indigo-600'
                    }`}
                  >
                    <option value="">Select State</option>
                    {indianStates.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className="text-xs text-rose-600 font-medium mt-1">{errors.state}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    PIN Code (6 Digits) *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="560038"
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-hidden transition-all ${
                      errors.pincode
                        ? 'border-rose-400 bg-rose-50/30'
                        : 'border-slate-300 focus:border-indigo-600'
                    }`}
                  />
                  {errors.pincode && (
                    <p className="text-xs text-rose-600 font-medium mt-1">{errors.pincode}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || cartItems.length === 0}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:bg-slate-300 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-98 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verifying Stock & Publishing to Kafka...</span>
                    </>
                  ) : (
                    <>
                      <span>Place Order (₹{total.toLocaleString('en-IN')})</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Right Column: Order Summary Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 sticky top-28">
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">
              Order Summary ({cartItems.length} items)
            </h3>

            {/* Items list */}
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1 max-w-[200px]">
                        {item.name}
                      </h4>
                      <div className="text-[11px] text-slate-500">
                        Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-900">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated GST (5%)</span>
                <span className="font-semibold text-slate-900">₹{tax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Express Shipping</span>
                <span className="font-semibold text-slate-900">
                  {shipping === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${shipping}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-200">
                <span>Total Payable</span>
                <span className="text-indigo-700">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Security Assurance */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-indigo-700 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Enterprise Transaction Guarantees</span>
              </div>
              <p className="text-[11px] text-slate-500">
                1. Product rows locked with PostgreSQL `SELECT FOR UPDATE` to prevent overselling.
                <br />
                2. Real-time `order_placed` event published to Aiven Apache Kafka stream.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
