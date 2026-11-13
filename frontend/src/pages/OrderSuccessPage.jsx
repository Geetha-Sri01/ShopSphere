import React from 'react';
import { CheckCircle2, ShoppingBag, Radio, ArrowRight, Activity, PackageCheck } from 'lucide-react';

export default function OrderSuccessPage({ order, onContinueShopping, onViewAdmin }) {
  if (!order) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-8">
      
      {/* Animated Success Badge */}
      <div className="relative inline-flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-100">
          <CheckCircle2 className="w-10 h-10" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Order Confirmed!
        </h1>
        <p className="text-sm text-slate-600">
          Thank you, <strong>{order.customer_name}</strong>. Your order has been securely recorded.
        </p>
      </div>

      {/* Order Reference Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md text-left space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Order Reference ID
            </span>
            <div className="text-xl sm:text-2xl font-black text-indigo-700 tracking-wide mt-0.5">
              {order.id}
            </div>
          </div>
          
          {/* Kafka Event Badge */}
          <div className="flex items-center space-x-2 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl text-xs text-purple-900 font-bold">
            <Radio className="w-4 h-4 text-purple-600 animate-pulse" />
            <span>Kafka Event Emitted ({order.topic || 'order_placed'})</span>
          </div>
        </div>

        {/* Customer & Shipping Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-slate-400 uppercase tracking-wider">Customer Details</span>
            <div className="font-semibold text-slate-800">{order.customer_name}</div>
            <div className="text-slate-600">{order.customer_email}</div>
            <div className="text-slate-600">+91 {order.customer_phone}</div>
          </div>
          <div className="space-y-1">
            <span className="font-bold text-slate-400 uppercase tracking-wider">Shipping Destination</span>
            <div className="text-slate-700 leading-relaxed">{order.delivery_address}</div>
          </div>
        </div>

        {/* Ordered Items List */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Items in Order ({order.items?.length || 0})
          </span>
          <div className="divide-y divide-slate-100">
            {order.items?.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  {item.productImage && (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                    />
                  )}
                  <div>
                    <div className="font-bold text-slate-900">{item.productName}</div>
                    <div className="text-slate-500">Qty: {item.quantity}</div>
                  </div>
                </div>
                <div className="font-bold text-slate-900">
                  ₹{Number(item.subtotal || item.unitPrice * item.quantity).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total row */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-sm sm:text-base font-black text-slate-900">
          <span>Total Paid (incl. GST)</span>
          <span className="text-indigo-700 text-lg sm:text-xl">
            ₹{Number(order.total_amount).toLocaleString('en-IN')}
          </span>
        </div>

      </div>

      {/* Navigation Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <button
          onClick={onContinueShopping}
          className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>

        <button
          onClick={onViewAdmin}
          className="w-full sm:w-auto px-6 py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs sm:text-sm rounded-xl transition-all active:scale-95 flex items-center justify-center space-x-2"
        >
          <Activity className="w-4 h-4 text-indigo-600" />
          <span>View in Admin Telemetry</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
